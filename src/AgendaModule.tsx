import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from './supabase';

interface Compromisso {
  id: string;
  codigo_igreja: string;
  titulo: string;
  descricao: string;
  data_compromisso: string;
  hora_compromisso: string;
  hora_fim: string;
  local_evento: string;
  responsavel: string;
  status: 'pendente' | 'realizado';
  dono_codigo: string;
  dono_tipo: string;
  som_ativo?: boolean;
  tipo_som?: 'bipe' | 'musica';
  url_som?: string;
  tempo_antecedencia?: number;
}

interface AgendaModuleProps {
  loggedUser: any;
}

const formInicial = {
  titulo: '',
  descricao: '',
  data_compromisso: '',
  hora_compromisso: '',
  hora_fim: '',
  local_evento: '',
  responsavel: '',
  status: 'pendente' as 'pendente' | 'realizado',
  som_ativo: true,
  tipo_som: 'bipe' as 'bipe' | 'musica',
  url_som: '',
  tempo_antecedencia: 15,
};

// Repetição ao criar: quantas cópias e de quanto em quanto tempo
const REPETICOES = [
  { id: 'nao', rotulo: 'Não repetir', vezes: 1, dias: 0, meses: 0 },
  { id: 'sem4', rotulo: 'Toda semana (4 semanas)', vezes: 4, dias: 7, meses: 0 },
  { id: 'sem8', rotulo: 'Toda semana (8 semanas)', vezes: 8, dias: 7, meses: 0 },
  { id: 'sem12', rotulo: 'Toda semana (12 semanas)', vezes: 12, dias: 7, meses: 0 },
  { id: 'quinz6', rotulo: 'A cada 15 dias (6 vezes)', vezes: 6, dias: 14, meses: 0 },
  { id: 'mes6', rotulo: 'Todo mês (6 meses)', vezes: 6, dias: 0, meses: 1 },
  { id: 'mes12', rotulo: 'Todo mês (12 meses)', vezes: 12, dias: 0, meses: 1 },
];

const POR_PAGINA = 1000;

// Datas no fuso do aparelho (toISOString usava o horário de Londres)
const isoLocal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const hojeLocal = () => isoLocal(new Date());
const somarData = (iso: string, dias: number, meses: number) => {
  const [a, m, d] = iso.split('-').map(Number);
  const dt = new Date(a, m - 1 + meses, d + dias);
  return isoLocal(dt);
};
const dataBR = (iso?: string) => (iso ? iso.split('-').reverse().join('/') : '-');
const hora = (h?: string) => (h ? h.substring(0, 5) : '');
const tituloDia = (iso: string) => {
  const hoje = hojeLocal();
  if (iso === hoje) return 'Hoje';
  if (iso === somarData(hoje, 1, 0)) return 'Amanhã';
  if (iso === somarData(hoje, -1, 0)) return 'Ontem';
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
};

export default function AgendaModule({ loggedUser }: AgendaModuleProps) {
  const [compromissos, setCompromissos] = useState<Compromisso[]>([]);
  const [nomesMembros, setNomesMembros] = useState<string[]>([]);
  const [periodo, setPeriodo] = useState<'proximos' | 'anteriores' | 'data'>('proximos');
  const [filtroData, setFiltroData] = useState('');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [editingCompromisso, setEditingCompromisso] = useState<Compromisso | null>(null);
  const [compromissoSelecionado, setCompromissoSelecionado] = useState<Compromisso | null>(null);
  const [compromissoParaExcluir, setCompromissoParaExcluir] = useState<{ id: string; titulo: string } | null>(null);

  const [senhaExclusao, setSenhaExclusao] = useState('');
  const [formCompromisso, setFormCompromisso] = useState(formInicial);
  const [repeticao, setRepeticao] = useState('nao');

  const isAdmin = loggedUser?.perfil === 'admin' || loggedUser?.perfil === 'administrador';
  const codigoIgreja = loggedUser?.codigo_igreja || loggedUser?.igrejas?.codigo_igreja;

  const fetchCompromissos = useCallback(async () => {
    if (!codigoIgreja) {
      setError('Código da igreja não encontrado.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const hoje = hojeLocal();
      let query = supabase.from('agenda_compromissos').select('*').eq('codigo_igreja', codigoIgreja);

      if (periodo === 'data' && filtroData) {
        query = query.eq('data_compromisso', filtroData).order('hora_compromisso', { ascending: true });
      } else if (periodo === 'anteriores') {
        // Do mais recente para o mais antigo
        query = query.lt('data_compromisso', hoje).order('data_compromisso', { ascending: false }).order('hora_compromisso', { ascending: false }).limit(100);
      } else {
        // Próximos: de hoje em diante, do mais perto para o mais longe
        query = query.gte('data_compromisso', hoje).order('data_compromisso', { ascending: true }).order('hora_compromisso', { ascending: true }).limit(200);
      }

      const { data, error: erroConsulta } = await query;
      if (erroConsulta) throw erroConsulta;

      setCompromissos(data || []);
    } catch (erro: any) {
      console.error('Erro ao buscar compromissos:', erro);
      setCompromissos([]);
      setError(erro?.message || 'Erro ao carregar agenda.');
    } finally {
      setLoading(false);
    }
  }, [codigoIgreja, periodo, filtroData]);

  // Nomes dos membros desta igreja (só o nome, sem foto), para sugerir o responsável
  const fetchMembros = useCallback(async () => {
    if (!codigoIgreja) return;
    try {
      const nomes: string[] = [];
      for (let inicio = 0; ; inicio += POR_PAGINA) {
        const { data, error } = await supabase
          .from('members')
          .select('nome')
          .eq('codigo_igreja', codigoIgreja)
          .order('nome', { ascending: true })
          .range(inicio, inicio + POR_PAGINA - 1);
        if (error) throw error;
        nomes.push(...(data || []).map((m: any) => m.nome).filter(Boolean));
        if (!data || data.length < POR_PAGINA) break;
      }
      setNomesMembros(Array.from(new Set(nomes)));
    } catch (err) {
      console.error('Erro ao buscar membros para responsáveis:', err);
    }
  }, [codigoIgreja]);

  useEffect(() => {
    if (!loggedUser || !codigoIgreja) return;
    fetchCompromissos();
  }, [loggedUser, codigoIgreja, fetchCompromissos]);

  useEffect(() => {
    if (!loggedUser || !codigoIgreja) return;
    fetchMembros();
  }, [loggedUser, codigoIgreja, fetchMembros]);

  const handleOpenNew = () => {
    if (!isAdmin) {
      alert('Apenas administradores podem cadastrar novos compromissos.');
      return;
    }
    setEditingCompromisso(null);
    setFormCompromisso({ ...formInicial, data_compromisso: periodo === 'data' && filtroData ? filtroData : hojeLocal() });
    setRepeticao('nao');
    setShowModal(true);
  };

  const preencherForm = (c: Compromisso) => ({
    titulo: c.titulo || '',
    descricao: c.descricao || '',
    data_compromisso: c.data_compromisso || '',
    hora_compromisso: hora(c.hora_compromisso),
    hora_fim: hora(c.hora_fim),
    local_evento: c.local_evento || '',
    responsavel: c.responsavel || '',
    status: c.status || 'pendente',
    som_ativo: c.som_ativo ?? true,
    tipo_som: c.tipo_som || 'bipe',
    url_som: c.url_som || '',
    tempo_antecedencia: c.tempo_antecedencia ?? 15,
  });

  const handleOpenEdit = (c: Compromisso) => {
    if (!isAdmin) {
      alert('Apenas administradores podem editar compromissos.');
      return;
    }
    setEditingCompromisso(c);
    setFormCompromisso(preencherForm(c));
    setRepeticao('nao');
    setShowModal(true);
  };

  // Abre um novo com os mesmos dados (útil para eventos parecidos)
  const handleDuplicar = (c: Compromisso) => {
    if (!isAdmin) return;
    setEditingCompromisso(null);
    setFormCompromisso({ ...preencherForm(c), status: 'pendente', data_compromisso: hojeLocal() });
    setRepeticao('nao');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCompromisso(null);
    setFormCompromisso(formInicial);
  };

  const handleChange = (campo: string, valor: any) => {
    setFormCompromisso((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Ação não permitida.');
      return;
    }
    if (formCompromisso.hora_compromisso && formCompromisso.hora_fim && formCompromisso.hora_fim < formCompromisso.hora_compromisso) {
      alert('A hora de término está antes da hora de início.');
      return;
    }

    setSalvando(true);
    try {
      const payload = {
        ...formCompromisso,
        titulo: formCompromisso.titulo.trim(),
        responsavel: formCompromisso.responsavel.trim(),
        hora_compromisso: formCompromisso.hora_compromisso || null,
        hora_fim: formCompromisso.hora_fim || null,
        codigo_igreja: codigoIgreja,
        dono_tipo: 'admin',
        dono_codigo: loggedUser?.id || null,
        url_som: formCompromisso.tipo_som === 'musica' ? formCompromisso.url_som : null,
      };

      if (editingCompromisso) {
        const { error: updateError } = await supabase.from('agenda_compromissos').update(payload).eq('id', editingCompromisso.id);
        if (updateError) throw updateError;
        alert('Compromisso atualizado com sucesso!');
      } else {
        const rep = REPETICOES.find((r) => r.id === repeticao) || REPETICOES[0];
        const registros = Array.from({ length: rep.vezes }, (_, i) => ({
          ...payload,
          data_compromisso: somarData(payload.data_compromisso, rep.dias * i, rep.meses * i),
        }));
        const { error: insertError } = await supabase.from('agenda_compromissos').insert(registros);
        if (insertError) throw insertError;
        alert(registros.length > 1 ? `${registros.length} compromissos agendados (até ${dataBR(registros[registros.length - 1].data_compromisso)})!` : 'Compromisso agendado com sucesso!');
      }

      handleCloseModal();
      fetchCompromissos();
    } catch (err: any) {
      console.error('Erro ao salvar compromisso:', err);
      alert('Erro ao salvar compromisso: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setSalvando(false);
    }
  };

  const handleAlternarStatus = async (id: string, statusAtual: string) => {
    if (!isAdmin) {
      alert('Apenas administradores podem alterar o status do evento.');
      return;
    }
    const novoStatus = statusAtual === 'realizado' ? 'pendente' : 'realizado';
    const { error } = await supabase.from('agenda_compromissos').update({ status: novoStatus }).eq('id', id);
    if (error) return alert('Erro ao atualizar status: ' + error.message);
    setCompromissos((prev) => prev.map((c) => (c.id === id ? { ...c, status: novoStatus as Compromisso['status'] } : c)));
  };

  const handleIniciarExclusao = (id: string, titulo: string) => {
    if (!isAdmin) {
      alert('Apenas administradores podem excluir compromissos.');
      return;
    }
    setCompromissoParaExcluir({ id, titulo });
    setSenhaExclusao('');
    setShowDeleteModal(true);
  };

  const confirmarExclusaoComSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compromissoParaExcluir) return;

    try {
      const emailUsuario = loggedUser?.usuario || loggedUser?.email;
      const { error: authError } = await supabase.auth.signInWithPassword({ email: emailUsuario, password: senhaExclusao });
      if (authError) {
        alert('Senha incorreta! A exclusão foi cancelada por segurança.');
        return;
      }

      const { error: deleteError } = await supabase.from('agenda_compromissos').delete().eq('id', compromissoParaExcluir.id);
      if (deleteError) throw deleteError;

      setShowDeleteModal(false);
      setCompromissoParaExcluir(null);
      setSenhaExclusao('');
      fetchCompromissos();
    } catch (err: any) {
      console.error('Erro ao excluir compromisso:', err);
      alert('Erro ao excluir: ' + (err.message || 'Erro desconhecido'));
    }
  };

  const formatarAntecedencia = (minutos?: number) => {
    if (minutos === 0) return 'No horário exato';
    if (minutos === 60) return '1 hora antes';
    if (minutos === 1440) return '1 dia antes';
    return `${minutos ?? 15} minutos antes`;
  };

  const textoWhats = (c: Compromisso) =>
    `📅 *${c.titulo}*\n${tituloDia(c.data_compromisso)} (${dataBR(c.data_compromisso)})${c.hora_compromisso ? ` às ${hora(c.hora_compromisso)}` : ''}${
      c.local_evento ? `\n📍 ${c.local_evento}` : ''
    }${c.descricao ? `\n\n${c.descricao}` : ''}`;

  // Agrupa por dia (com a busca aplicada)
  const termo = busca.trim().toLowerCase();
  const grupos = useMemo(() => {
    const filtrados = compromissos.filter(
      (c) => !termo || [c.titulo, c.local_evento, c.responsavel, c.descricao].join(' ').toLowerCase().includes(termo)
    );
    const mapa = new Map<string, Compromisso[]>();
    filtrados.forEach((c) => {
      const k = c.data_compromisso || 'sem-data';
      mapa.set(k, [...(mapa.get(k) || []), c]);
    });
    return Array.from(mapa.entries());
  }, [compromissos, termo]);

  const hoje = hojeLocal();

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 w-full max-w-6xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-blue-900 tracking-tight">Agenda e Compromissos</h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Cultos, reuniões e eventos ({codigoIgreja}). {!isAdmin && <span className="text-amber-600 font-semibold">(Modo Visualização)</span>}
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={handleOpenNew}
            className="w-full sm:w-auto px-4 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer shrink-0 text-center"
          >
            + Novo Compromisso
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col lg:flex-row gap-2 lg:items-center bg-slate-50 p-3 rounded-2xl border">
        <div className="flex rounded-xl bg-white border p-1 text-xs font-bold">
          {(
            [
              ['proximos', '📅 Próximos'],
              ['anteriores', '🕘 Anteriores'],
              ['data', '🔎 Uma data'],
            ] as const
          ).map(([id, rotulo]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setPeriodo(id);
                if (id === 'data' && !filtroData) setFiltroData(hojeLocal());
              }}
              className={`px-3 py-2 rounded-lg cursor-pointer whitespace-nowrap ${periodo === id ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {rotulo}
            </button>
          ))}
        </div>
        {periodo === 'data' && (
          <input
            type="date"
            value={filtroData}
            onChange={(e) => setFiltroData(e.target.value)}
            className="border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        )}
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="🔎 Buscar por título, local ou responsável..."
          className="lg:flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* Listagem */}
      {loading && <p className="text-slate-500 py-4 text-center">Carregando compromissos...</p>}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-semibold flex items-center justify-between gap-3">
          <span>Erro ao carregar dados: {error}</span>
          <button type="button" onClick={fetchCompromissos} className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold cursor-pointer">
            Tentar de novo
          </button>
        </div>
      )}

      {!loading && !error && grupos.length === 0 && (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-1">
          <p className="text-slate-700 text-sm font-bold">
            {termo
              ? `Nada encontrado com “${busca}”.`
              : periodo === 'proximos'
                ? 'Nenhum compromisso agendado daqui para frente.'
                : periodo === 'anteriores'
                  ? 'Nenhum compromisso anterior.'
                  : `Nenhum compromisso em ${dataBR(filtroData)}.`}
          </p>
          {isAdmin && !termo && <p className="text-slate-500 text-xs">Clique em “+ Novo Compromisso” para agendar.</p>}
        </div>
      )}

      {!loading && !error && grupos.length > 0 && (
        <div className="space-y-5">
          {grupos.map(([dia, itens]) => (
            <section key={dia}>
              <h3
                className={`sticky top-0 z-[1] mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black first-letter:uppercase ${
                  dia === hoje ? 'bg-amber-100 text-amber-900' : 'bg-blue-50 text-blue-900'
                }`}
              >
                <span className="first-letter:uppercase">{tituloDia(dia)}</span>
                <span className="font-semibold opacity-70">{dataBR(dia)}</span>
              </h3>
              <div className="space-y-2">
                {itens.map((c) => {
                  const realizado = c.status === 'realizado';
                  return (
                    <div key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 hover:shadow-sm transition">
                      <div className="sm:w-24 shrink-0">
                        <p className="text-lg font-black text-blue-900 leading-none">{hora(c.hora_compromisso) || '—'}</p>
                        {c.hora_fim && <p className="text-[11px] text-slate-500">até {hora(c.hora_fim)}</p>}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900">{c.titulo}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {[c.local_evento && `📍 ${c.local_evento}`, c.responsavel && `👤 ${c.responsavel}`].filter(Boolean).join(' · ') || 'Sem local e responsável'}
                          {c.som_ativo ? ` · ${c.tipo_som === 'musica' ? '🎵' : '🔔'} ${formatarAntecedencia(c.tempo_antecedencia)}` : ''}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          disabled={!isAdmin}
                          onClick={() => handleAlternarStatus(c.id, c.status || 'pendente')}
                          title={isAdmin ? 'Clique para alternar entre Pendente e Realizado' : 'Status do evento'}
                          className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                            realizado ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                          } ${isAdmin ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${realizado ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                          {realizado ? 'Realizado' : 'Pendente'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCompromissoSelecionado(c);
                            setShowDetalhesModal(true);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
                        >
                          Ver
                        </button>
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(textoWhats(c))}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg"
                          title="Divulgar no WhatsApp"
                        >
                          💬
                        </a>
                        {isAdmin && (
                          <>
                            <button type="button" onClick={() => handleOpenEdit(c)} className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-lg cursor-pointer">
                              Editar
                            </button>
                            <button type="button" onClick={() => handleDuplicar(c)} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer" title="Criar outro igual">
                              ⧉
                            </button>
                            <button type="button" onClick={() => handleIniciarExclusao(c.id, c.titulo)} className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg cursor-pointer" aria-label={`Excluir ${c.titulo}`}>
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      {showModal && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4 mb-6 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-black text-blue-900">{editingCompromisso ? 'Editar Compromisso' : 'Novo Compromisso'}</h3>
              <button type="button" onClick={handleCloseModal} className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer">
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Título do Evento *</label>
                <input
                  type="text"
                  value={formCompromisso.titulo}
                  onChange={(e) => handleChange('titulo', e.target.value)}
                  placeholder="Ex: Culto de Santa Ceia, Reunião de Líderes"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Data *</label>
                  <input
                    type="date"
                    value={formCompromisso.data_compromisso}
                    onChange={(e) => handleChange('data_compromisso', e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Hora Início</label>
                  <input
                    type="time"
                    value={formCompromisso.hora_compromisso}
                    onChange={(e) => handleChange('hora_compromisso', e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Hora Fim</label>
                  <input
                    type="time"
                    value={formCompromisso.hora_fim}
                    onChange={(e) => handleChange('hora_fim', e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>

              {!editingCompromisso && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">🔁 Repetir</label>
                  <select
                    value={repeticao}
                    onChange={(e) => setRepeticao(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                  >
                    {REPETICOES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.rotulo}
                      </option>
                    ))}
                  </select>
                  {repeticao !== 'nao' && formCompromisso.data_compromisso && (
                    <p className="mt-1 text-[11px] text-slate-500">
                      Serão criados {REPETICOES.find((r) => r.id === repeticao)?.vezes} compromissos, de {dataBR(formCompromisso.data_compromisso)} a{' '}
                      {dataBR(
                        somarData(
                          formCompromisso.data_compromisso,
                          (REPETICOES.find((r) => r.id === repeticao)?.dias || 0) * ((REPETICOES.find((r) => r.id === repeticao)?.vezes || 1) - 1),
                          (REPETICOES.find((r) => r.id === repeticao)?.meses || 0) * ((REPETICOES.find((r) => r.id === repeticao)?.vezes || 1) - 1)
                        )
                      )}
                      . Cada um pode ser editado depois.
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Local</label>
                  <input
                    type="text"
                    value={formCompromisso.local_evento}
                    onChange={(e) => handleChange('local_evento', e.target.value)}
                    placeholder="Ex: Templo Principal, Sala de Reuniões"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Responsável *</label>
                  <input
                    type="text"
                    list="agenda-membros"
                    value={formCompromisso.responsavel}
                    onChange={(e) => handleChange('responsavel', e.target.value)}
                    placeholder="Digite o nome (membro ou convidado)"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                    required
                  />
                  <datalist id="agenda-membros">
                    {nomesMembros.map((n) => (
                      <option key={n} value={n} />
                    ))}
                  </datalist>
                </div>
              </div>

              {editingCompromisso && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status do Evento</label>
                  <select
                    value={formCompromisso.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                  >
                    <option value="pendente">🔴 Pendente</option>
                    <option value="realizado">🟢 Realizado</option>
                  </select>
                </div>
              )}

              {/* SOM E ANTECEDÊNCIA */}
              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="som_ativo"
                    checked={formCompromisso.som_ativo}
                    onChange={(e) => handleChange('som_ativo', e.target.checked)}
                    className="w-4 h-4 text-blue-900 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="som_ativo" className="text-xs font-bold text-blue-950 uppercase cursor-pointer">
                    Lembrar do compromisso com som no celular?
                  </label>
                </div>

                {formCompromisso.som_ativo && (
                  <div className="pl-6 space-y-3 pt-2 border-t border-blue-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Avisar quanto tempo antes?</label>
                        <select
                          value={formCompromisso.tempo_antecedencia}
                          onChange={(e) => handleChange('tempo_antecedencia', Number(e.target.value))}
                          className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                        >
                          <option value={0}>⏰ No horário exato do evento</option>
                          <option value={5}>⏱️ 5 minutos antes</option>
                          <option value={15}>⏱️ 15 minutos antes</option>
                          <option value={30}>⏱️ 30 minutos antes</option>
                          <option value={60}>⌛ 1 hora antes</option>
                          <option value={1440}>📅 1 dia antes</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Alerta Sonoro:</label>
                        <div className="flex flex-col gap-1.5 pt-1 text-xs font-medium text-slate-800">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="tipo_som" value="bipe" checked={formCompromisso.tipo_som === 'bipe'} onChange={() => handleChange('tipo_som', 'bipe')} />
                            🔔 Bipe Padrão
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="tipo_som" value="musica" checked={formCompromisso.tipo_som === 'musica'} onChange={() => handleChange('tipo_som', 'musica')} />
                            🎵 Música MP3
                          </label>
                        </div>
                      </div>
                    </div>

                    {formCompromisso.tipo_som === 'musica' && (
                      <div className="pt-1">
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Link/URL do Áudio MP3</label>
                        <input
                          type="url"
                          value={formCompromisso.url_som}
                          onChange={(e) => handleChange('url_som', e.target.value)}
                          placeholder="https://seu-servidor.com/audio-vinheta.mp3"
                          className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          required={formCompromisso.tipo_som === 'musica'}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Descrição / Observações</label>
                <textarea
                  value={formCompromisso.descricao}
                  onChange={(e) => handleChange('descricao', e.target.value)}
                  placeholder="Detalhes adicionais sobre o evento..."
                  rows={3}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 mt-6 border-t">
                <button type="button" onClick={handleCloseModal} className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" disabled={salvando} className="w-full sm:w-auto px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer disabled:opacity-60">
                  {salvando ? 'Salvando...' : editingCompromisso ? 'Salvar alterações' : 'Agendar compromisso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {showDeleteModal && compromissoParaExcluir && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-8 space-y-4">
            <h3 className="text-xl font-black text-rose-700">Confirmar Exclusão</h3>
            <p className="text-sm text-slate-600">
              Você está prestes a excluir o evento <strong className="text-slate-800">{compromissoParaExcluir.titulo}</strong>. Digite sua senha de acesso para continuar:
            </p>
            <form onSubmit={confirmarExclusaoComSenha} className="space-y-4">
              <input
                type="password"
                value={senhaExclusao}
                onChange={(e) => setSenhaExclusao(e.target.value)}
                placeholder="Digite sua senha atual"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-500"
                required
              />
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setCompromissoParaExcluir(null);
                  }}
                  className="w-full sm:w-auto px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button type="submit" className="w-full sm:w-auto px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer">
                  Confirmar Exclusão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE DETALHES */}
      {showDetalhesModal && compromissoSelecionado && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-xl font-black text-blue-900">Detalhes do Evento</h3>
              <button type="button" onClick={() => setShowDetalhesModal(false)} className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer">
                ✕ Fechar
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="block text-xs font-bold text-slate-400 uppercase">Status</span>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold mt-1 ${
                    compromissoSelecionado.status === 'realizado' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {compromissoSelecionado.status === 'realizado' ? '🟢 Realizado' : '🔴 Pendente'}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="block text-xs font-bold text-slate-400 uppercase">Título</span>
                {compromissoSelecionado.titulo}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="block text-xs font-bold text-slate-400 uppercase">Data</span>
                  {dataBR(compromissoSelecionado.data_compromisso)}
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="block text-xs font-bold text-slate-400 uppercase">Horário</span>
                  {hora(compromissoSelecionado.hora_compromisso) || '-'} {compromissoSelecionado.hora_fim ? `às ${hora(compromissoSelecionado.hora_fim)}` : ''}
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="block text-xs font-bold text-slate-400 uppercase">Local</span>
                {compromissoSelecionado.local_evento || '-'}
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="block text-xs font-bold text-slate-400 uppercase">Responsável</span>
                {compromissoSelecionado.responsavel || '-'}
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="block text-xs font-bold text-slate-400 uppercase">Configuração de Som</span>
                {compromissoSelecionado.som_ativo
                  ? `${compromissoSelecionado.tipo_som === 'musica' ? '🎵 Música MP3' : '🔔 Bipe Padrão'} (${formatarAntecedencia(compromissoSelecionado.tempo_antecedencia)})`
                  : '🔕 Sem som'}
              </div>
              <div className="bg-slate-50 p-3 rounded-xl whitespace-pre-wrap">
                <span className="block text-xs font-bold text-slate-400 uppercase">Descrição</span>
                {compromissoSelecionado.descricao || 'Nenhuma descrição informada.'}
              </div>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(textoWhats(compromissoSelecionado))}`}
                target="_blank"
                rel="noreferrer"
                className="text-center rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-bold text-white"
              >
                💬 Divulgar no WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
