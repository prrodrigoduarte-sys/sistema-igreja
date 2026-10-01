// src/DiscipuladoDEAModule.tsx

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { supabase } from './supabase';

interface Membro {
  id: any;
  nome: string;
  celular_principal?: string;
}

interface EncontroDEA {
  id: number;
  data_encontro: string;
  hora_encontro: string;
  assunto_tratado: string;
  comentarios: string;
}

interface VinculoDEA {
  id: any;
  discipulador_id: any;
  discipulando_id: any;
  dia_reuniao?: string;
  status: string;
  encontros?: EncontroDEA[];
  discipulador?: Membro;
  discipulando?: Membro;
}

interface GroupedDiscipulado {
  discipulador_id: any;
  discipulador: Membro;
  totalDiscipulos: number;
  vinculos: VinculoDEA[];
}

interface Props {
  loggedUser: any;
  activeTab?: string;
}

const DIAS = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
const POR_PAGINA = 1000;

// Data de hoje no fuso do aparelho (toISOString usava o horário de Londres: depois das 21h dava o dia seguinte)
const hojeLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const dataBR = (iso?: string) => (iso ? iso.split('-').reverse().join('/') : '');
const semAcento = (t: string) => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const nomeBonito = (nome?: string) =>
  (nome || '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((p, i) => (i > 0 && ['de', 'da', 'do', 'das', 'dos', 'e'].includes(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(' ');
const linkWhats = (celular?: string, texto = '') => {
  const dig = (celular || '').replace(/\D/g, '');
  if (dig.length < 10) return '';
  return `https://wa.me/${dig.startsWith('55') ? dig : `55${dig}`}?text=${encodeURIComponent(texto)}`;
};

// Caixa de busca para escolher UM membro
function SeletorMembro({
  rotulo,
  membros,
  valor,
  onChange,
}: {
  rotulo: string;
  membros: Membro[];
  valor: any;
  onChange: (id: any) => void;
}) {
  const [busca, setBusca] = useState('');
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const selecionado = membros.find((m) => String(m.id) === String(valor));

  useEffect(() => {
    if (!aberto) return;
    const fechar = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener('mousedown', fechar);
    return () => document.removeEventListener('mousedown', fechar);
  }, [aberto]);

  const termo = semAcento(busca.trim());
  const resultados = (termo ? membros.filter((m) => semAcento(m.nome).includes(termo)) : membros).slice(0, 60);

  return (
    <div className="relative" ref={ref}>
      <label className="block font-bold text-slate-700 mb-1">{rotulo}</label>
      {selecionado && !aberto ? (
        <div className="flex items-center gap-2 border border-blue-200 bg-blue-50 rounded-xl px-3 py-2">
          <span className="flex-1 truncate font-bold text-blue-900">👤 {nomeBonito(selecionado.nome)}</span>
          <button type="button" onClick={() => setAberto(true)} className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer">
            Trocar
          </button>
        </div>
      ) : (
        <input
          type="text"
          value={busca}
          onFocus={() => setAberto(true)}
          onChange={(e) => {
            setBusca(e.target.value);
            setAberto(true);
          }}
          placeholder="🔎 Digite o nome..."
          className="w-full border rounded-xl p-2.5 bg-white"
          autoFocus={aberto && !!selecionado}
        />
      )}
      {aberto && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border rounded-xl shadow-xl z-30 max-h-56 overflow-y-auto">
          {resultados.length === 0 ? (
            <div className="p-3 text-center text-slate-500">Nenhum membro encontrado.</div>
          ) : (
            resultados.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  onChange(String(m.id));
                  setBusca('');
                  setAberto(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-b-0 cursor-pointer"
              >
                {nomeBonito(m.nome)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function DiscipuladoDEAModule({ loggedUser, activeTab = 'discipulado-dea' }: Props) {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [vinculos, setVinculos] = useState<VinculoDEA[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Modais
  const [modalNovoVinculo, setModalNovoVinculo] = useState(false);
  const [modalEncontrosIndividuais, setModalEncontrosIndividuais] = useState(false);
  const [modalEncontroGrupo, setModalEncontroGrupo] = useState(false);
  const [modalEditarVinculo, setModalEditarVinculo] = useState(false);

  // Form Vínculo
  const [discipuladorId, setDiscipuladorId] = useState('');
  const [discipulosSelecionados, setDiscipulosSelecionados] = useState<string[]>([]);
  const [buscaDiscipulos, setBuscaDiscipulos] = useState('');
  const [diaReuniao, setDiaReuniao] = useState('Segunda-feira');

  // Form Agendamento em Grupo
  const [grupoSelecionado, setGrupoSelecionado] = useState<GroupedDiscipulado | null>(null);
  const [dataGrupo, setDataGrupo] = useState(hojeLocal());
  const [horaGrupo, setHoraGrupo] = useState('19:30');
  const [assuntoGrupo, setAssuntoGrupo] = useState('');
  const [comentarioGrupo, setComentarioGrupo] = useState('');

  // Form Edição
  const [vinculoEdicao, setVinculoEdicao] = useState<VinculoDEA | null>(null);

  // Form Agenda Individual
  const [selectedVinculo, setSelectedVinculo] = useState<VinculoDEA | null>(null);
  const [listaEncontros, setListaEncontros] = useState<EncontroDEA[]>([]);
  const [novaData, setNovaData] = useState(hojeLocal());
  const [novaHora, setNovaHora] = useState('19:30');
  const [novoAssunto, setNovoAssunto] = useState('');
  const [novoComentario, setNovoComentario] = useState('');

  // Agenda geral
  const [periodoGeral, setPeriodoGeral] = useState<'proximos' | 'realizados' | 'todos'>('proximos');

  const codigoIgreja = loggedUser?.codigo_igreja || 'IGR-001';

  const carregarDados = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      // Membros desta igreja, de 1000 em 1000 (o Supabase entrega no máximo 1000 por vez)
      const todos: Membro[] = [];
      for (let inicio = 0; ; inicio += POR_PAGINA) {
        const { data, error } = await supabase
          .from('members')
          .select('id, nome, celular_principal')
          .eq('codigo_igreja', codigoIgreja)
          .order('nome', { ascending: true })
          .range(inicio, inicio + POR_PAGINA - 1);
        if (error) throw error;
        todos.push(...((data || []).filter((m: any) => m.nome) as Membro[]));
        if (!data || data.length < POR_PAGINA) break;
      }
      setMembros(todos);

      const { data: dataDEA, error: erroDEA } = await supabase
        .from('discipulado_dea')
        .select('*')
        .eq('codigo_igreja', codigoIgreja)
        .order('id', { ascending: false });
      if (erroDEA) throw erroDEA;

      const enriquecidos = (dataDEA || []).map((v: any) => ({
        ...v,
        encontros: Array.isArray(v.encontros) ? v.encontros : [],
        discipulador: todos.find((m) => String(m.id) === String(v.discipulador_id)),
        discipulando: todos.find((m) => String(m.id) === String(v.discipulando_id)),
      }));
      setVinculos(enriquecidos);
    } catch (err: any) {
      console.error(err);
      setErro('Não foi possível carregar o discipulado: ' + (err?.message || err));
    } finally {
      setLoading(false);
    }
  }, [codigoIgreja]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Quem já é discípulo (e de quem)
  const liderDoDiscipulo = useMemo(() => {
    const mapa: Record<string, VinculoDEA> = {};
    vinculos.forEach((v) => {
      mapa[String(v.discipulando_id)] = v;
    });
    return mapa;
  }, [vinculos]);

  const toggleDiscipulo = (id: string) => {
    setDiscipulosSelecionados((atual) => (atual.includes(id) ? atual.filter((item) => item !== id) : [...atual, id]));
  };

  const handleSalvarVinculo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discipuladorId) return alert('Selecione o Discipulador.');
    if (discipulosSelecionados.length === 0) return alert('Selecione ao menos um Discípulo.');

    // Quem já tem discipulador: pergunta se quer trocar
    const jaVinculados = discipulosSelecionados.filter((id) => liderDoDiscipulo[id]);
    const comMesmoLider = jaVinculados.filter((id) => String(liderDoDiscipulo[id].discipulador_id) === String(discipuladorId));
    const comOutroLider = jaVinculados.filter((id) => String(liderDoDiscipulo[id].discipulador_id) !== String(discipuladorId));

    if (comOutroLider.length) {
      const nomes = comOutroLider
        .map((id) => `• ${nomeBonito(liderDoDiscipulo[id].discipulando?.nome)} (hoje com ${nomeBonito(liderDoDiscipulo[id].discipulador?.nome)})`)
        .join('\n');
      if (!window.confirm(`Estes discípulos já têm discipulador:\n${nomes}\n\nTrocar para o novo discipulador? (os encontros já registrados são mantidos)`)) return;
    }

    setSalvando(true);
    try {
      // Troca de discipulador: atualiza o vínculo existente (mantém o histórico de encontros)
      for (const id of comOutroLider) {
        const { error } = await supabase
          .from('discipulado_dea')
          .update({ discipulador_id: discipuladorId, dia_reuniao: diaReuniao })
          .eq('id', liderDoDiscipulo[id].id);
        if (error) throw error;
      }

      const novos = discipulosSelecionados.filter((id) => !liderDoDiscipulo[id]);
      if (novos.length) {
        const novosRegistros = novos.map((dId) => ({
          codigo_igreja: codigoIgreja,
          discipulador_id: discipuladorId,
          discipulando_id: dId,
          dia_reuniao: diaReuniao,
          status: 'Ativo',
          encontros: [],
        }));
        const { error } = await supabase.from('discipulado_dea').insert(novosRegistros);
        if (error) throw error;
      }

      alert(
        `🌱 Discipulado salvo! ${novos.length} novo(s)` +
          (comOutroLider.length ? `, ${comOutroLider.length} trocado(s) de discipulador` : '') +
          (comMesmoLider.length ? `, ${comMesmoLider.length} já estava(m) com este discipulador` : '') +
          '.'
      );
      setModalNovoVinculo(false);
      setDiscipuladorId('');
      setDiscipulosSelecionados([]);
      carregarDados();
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleSalvarEncontroGrupo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grupoSelecionado || !assuntoGrupo.trim()) return alert('Informe o Assunto.');

    const novoEncontro: EncontroDEA = {
      id: Date.now(),
      data_encontro: dataGrupo,
      hora_encontro: horaGrupo,
      assunto_tratado: assuntoGrupo.trim(),
      comentarios: comentarioGrupo.trim(),
    };

    setSalvando(true);
    try {
      const resultados = await Promise.all(
        grupoSelecionado.vinculos.map((v) =>
          supabase
            .from('discipulado_dea')
            .update({ encontros: [novoEncontro, ...(v.encontros || [])] })
            .eq('id', v.id)
        )
      );
      const falhas = resultados.filter((r) => r.error);
      if (falhas.length) {
        alert(`Encontro registrado para ${resultados.length - falhas.length} de ${resultados.length} discípulos. Erro: ${falhas[0].error?.message}`);
      } else {
        alert(`⚡ Encontro agendado para os ${grupoSelecionado.totalDiscipulos} discípulos!`);
        setModalEncontroGrupo(false);
        setGrupoSelecionado(null);
        setAssuntoGrupo('');
        setComentarioGrupo('');
      }
      carregarDados();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const salvarEncontrosDoVinculo = async (novaLista: EncontroDEA[]) => {
    if (!selectedVinculo) return false;
    const { error } = await supabase.from('discipulado_dea').update({ encontros: novaLista }).eq('id', selectedVinculo.id);
    if (error) {
      alert('Erro ao salvar: ' + error.message);
      return false;
    }
    setListaEncontros(novaLista);
    setVinculos((prev) => prev.map((v) => (v.id === selectedVinculo.id ? { ...v, encontros: novaLista } : v)));
    return true;
  };

  const handleAdicionarEncontroIndividual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVinculo || !novoAssunto.trim()) return alert('Informe o assunto.');

    const novoItem: EncontroDEA = {
      id: Date.now(),
      data_encontro: novaData,
      hora_encontro: novaHora,
      assunto_tratado: novoAssunto.trim(),
      comentarios: novoComentario.trim(),
    };
    // Mantém a lista ordenada da data mais recente para a mais antiga
    const novaLista = [novoItem, ...listaEncontros].sort((a, b) => `${b.data_encontro} ${b.hora_encontro}`.localeCompare(`${a.data_encontro} ${a.hora_encontro}`));
    if (await salvarEncontrosDoVinculo(novaLista)) {
      setNovoAssunto('');
      setNovoComentario('');
    }
  };

  const handleExcluirEncontro = async (item: EncontroDEA) => {
    if (!window.confirm(`Excluir o encontro de ${dataBR(item.data_encontro)} (“${item.assunto_tratado}”)?`)) return;
    await salvarEncontrosDoVinculo(listaEncontros.filter((x) => x.id !== item.id));
  };

  const handleExcluirVinculo = async (v: VinculoDEA) => {
    if (!window.confirm(`Remover ${nomeBonito(v.discipulando?.nome)} do discipulado de ${nomeBonito(v.discipulador?.nome)}?\n\nO histórico de encontros dele será apagado.`)) return;
    const { error } = await supabase.from('discipulado_dea').delete().eq('id', v.id);
    if (error) return alert('Erro ao excluir: ' + error.message);
    carregarDados();
  };

  const handleSalvarEdicaoVinculo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vinculoEdicao) return;
    if (String(vinculoEdicao.discipulador_id) === String(vinculoEdicao.discipulando_id)) return alert('O discipulador e o discípulo precisam ser pessoas diferentes.');
    const outro = liderDoDiscipulo[String(vinculoEdicao.discipulando_id)];
    if (outro && outro.id !== vinculoEdicao.id) {
      return alert(`${nomeBonito(outro.discipulando?.nome)} já é discípulo de ${nomeBonito(outro.discipulador?.nome)}. Edite aquele vínculo.`);
    }

    const { error } = await supabase
      .from('discipulado_dea')
      .update({
        discipulador_id: vinculoEdicao.discipulador_id,
        discipulando_id: vinculoEdicao.discipulando_id,
        dia_reuniao: vinculoEdicao.dia_reuniao,
      })
      .eq('id', vinculoEdicao.id);
    if (error) return alert('Erro ao salvar: ' + error.message);

    setModalEditarVinculo(false);
    setVinculoEdicao(null);
    carregarDados();
  };

  const termo = semAcento(busca.trim());
  const vinculosFiltrados = vinculos.filter(
    (v) => !termo || semAcento(v.discipulador?.nome || '').includes(termo) || semAcento(v.discipulando?.nome || '').includes(termo)
  );

  const gruposAgrupados: GroupedDiscipulado[] = useMemo(() => {
    const mapa = new Map<string, GroupedDiscipulado>();
    vinculosFiltrados.forEach((v) => {
      const key = String(v.discipulador_id);
      if (!mapa.has(key)) {
        mapa.set(key, {
          discipulador_id: v.discipulador_id,
          discipulador: v.discipulador || { id: v.discipulador_id, nome: 'Membro não encontrado' },
          totalDiscipulos: 0,
          vinculos: [],
        });
      }
      const g = mapa.get(key)!;
      g.totalDiscipulos += 1;
      g.vinculos.push(v);
    });
    return Array.from(mapa.values()).sort((a, b) => (a.discipulador.nome || '').localeCompare(b.discipulador.nome || ''));
  }, [vinculosFiltrados]);

  const hoje = hojeLocal();
  const proximoEncontro = (v: VinculoDEA) =>
    (v.encontros || []).filter((e) => e.data_encontro >= hoje).sort((a, b) => a.data_encontro.localeCompare(b.data_encontro))[0];

  const todosEncontrosGeral = useMemo(() => {
    const lista: { idUnico: string; data: string; hora: string; assunto: string; comentarios: string; discipulador: string; discipulo: string }[] = [];
    vinculosFiltrados.forEach((v) => {
      (v.encontros || []).forEach((e) => {
        lista.push({
          idUnico: `${v.id}-${e.id}`,
          data: e.data_encontro,
          hora: e.hora_encontro,
          assunto: e.assunto_tratado,
          comentarios: e.comentarios,
          discipulador: nomeBonito(v.discipulador?.nome) || 'Não informado',
          discipulo: nomeBonito(v.discipulando?.nome) || 'Não informado',
        });
      });
    });
    const filtrada = lista.filter((e) => (periodoGeral === 'proximos' ? e.data >= hoje : periodoGeral === 'realizados' ? e.data < hoje : true));
    // Próximos: do mais perto para o mais longe; realizados/todos: do mais recente para o mais antigo
    return filtrada.sort((a, b) =>
      periodoGeral === 'proximos' ? `${a.data} ${a.hora}`.localeCompare(`${b.data} ${b.hora}`) : `${b.data} ${b.hora}`.localeCompare(`${a.data} ${a.hora}`)
    );
  }, [vinculosFiltrados, periodoGeral, hoje]);

  const candidatosDiscipulos = membros.filter(
    (m) => String(m.id) !== String(discipuladorId) && (!buscaDiscipulos.trim() || semAcento(m.nome).includes(semAcento(buscaDiscipulos.trim())))
  );

  const vazio = !loading && !erro && vinculos.length === 0;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-6xl mx-auto space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-3xl font-black text-blue-900 tracking-tight">
            {activeTab === 'discipulado-agenda-discipulador' && '📅 Agendamentos por Discipulador'}
            {activeTab === 'discipulado-agenda-geral' && '📋 Lista do Agendamento Geral'}
            {(activeTab === 'discipulado-dea' || activeTab === 'discipulado') && '🌱 D.E.A. / G.U.I.'}
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            {vinculos.length} discípulo(s) com {new Set(vinculos.map((v) => String(v.discipulador_id))).size} discipulador(es)
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setDiscipuladorId('');
            setDiscipulosSelecionados([]);
            setBuscaDiscipulos('');
            setModalNovoVinculo(true);
          }}
          className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
        >
          ➕ Novo Discipulado (Líder + Discípulos)
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <input
          type="text"
          placeholder="🔎 Buscar por líder ou discípulo..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full sm:w-80 border rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-600"
        />
        {activeTab === 'discipulado-agenda-geral' && (
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
            {(
              [
                ['proximos', 'Próximos'],
                ['realizados', 'Realizados'],
                ['todos', 'Todos'],
              ] as const
            ).map(([id, rotulo]) => (
              <button
                key={id}
                type="button"
                onClick={() => setPeriodoGeral(id)}
                className={`px-3 py-1.5 rounded-lg cursor-pointer ${periodoGeral === id ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500'}`}
              >
                {rotulo}
              </button>
            ))}
          </div>
        )}
      </div>

      {erro && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3">
          <span>{erro}</span>
          <button type="button" onClick={carregarDados} className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold cursor-pointer">
            Tentar de novo
          </button>
        </div>
      )}

      {vazio && (
        <div className="p-10 text-center bg-slate-50 border border-dashed rounded-2xl space-y-2">
          <p className="text-3xl">🌱</p>
          <p className="font-black text-slate-800">Nenhum discipulado cadastrado ainda</p>
          <p className="text-xs text-slate-500">Clique em “➕ Novo Discipulado” para escolher um discipulador e os discípulos dele.</p>
        </div>
      )}

      {!vazio && !loading && termo && gruposAgrupados.length === 0 && (
        <p className="p-6 text-center text-xs text-slate-500 bg-slate-50 border border-dashed rounded-2xl">Ninguém encontrado com “{busca}”.</p>
      )}

      {loading ? (
        <p className="text-center py-8 text-slate-500 text-xs">Carregando dados...</p>
      ) : (
        <>
          {/* VISUALIZAÇÃO D.E.A. / G.U.I. */}
          {(activeTab === 'discipulado-dea' || activeTab === 'discipulado') && (
            <div className="space-y-6">
              {gruposAgrupados.map((grupo) => (
                <div key={grupo.discipulador_id} className="border border-slate-200 rounded-2xl bg-slate-50 p-5 space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-3 border-slate-200 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-900 text-white p-2.5 rounded-xl text-lg font-black">👤</div>
                      <div>
                        <h3 className="font-black text-blue-900 text-base">{nomeBonito(grupo.discipulador?.nome)}</h3>
                        <p className="text-xs text-slate-500">Discipulador / Líder · {grupo.totalDiscipulos} discípulo(s)</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setGrupoSelecionado(grupo);
                        setDataGrupo(hojeLocal());
                        setModalEncontroGrupo(true);
                      }}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                    >
                      📅 Agendar para Todos ({grupo.totalDiscipulos})
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {grupo.vinculos.map((v) => {
                      const prox = proximoEncontro(v);
                      const whats = linkWhats(
                        v.discipulando?.celular_principal,
                        prox
                          ? `Olá, ${nomeBonito(v.discipulando?.nome).split(' ')[0]}! Lembrando do nosso encontro de discipulado em ${dataBR(prox.data_encontro)} às ${prox.hora_encontro}: ${prox.assunto_tratado}. Deus abençoe!`
                          : `Olá, ${nomeBonito(v.discipulando?.nome).split(' ')[0]}! Tudo bem? Vamos marcar nosso próximo encontro de discipulado?`
                      );
                      return (
                        <div key={v.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                          <div>
                            <p className="font-bold text-emerald-800 text-sm">{nomeBonito(v.discipulando?.nome) || 'Membro não encontrado'}</p>
                            <p className="text-xs text-slate-500">
                              📞 {v.discipulando?.celular_principal || 'Sem contato'} · {v.dia_reuniao || 'Sem dia definido'}
                            </p>
                            <p className="text-[11px] mt-1 text-slate-600">
                              {prox ? (
                                <>
                                  ⏭ Próximo: <strong>{dataBR(prox.data_encontro)}</strong> às {prox.hora_encontro}
                                </>
                              ) : (
                                <span className="text-amber-700">Nenhum encontro agendado</span>
                              )}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedVinculo(v);
                                setListaEncontros(v.encontros || []);
                                setNovaData(hojeLocal());
                                setModalEncontrosIndividuais(true);
                              }}
                              className="flex-1 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-lg cursor-pointer"
                            >
                              📅 Agenda ({(v.encontros || []).length})
                            </button>
                            {whats && (
                              <a href={whats} target="_blank" rel="noreferrer" className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg" title="Mandar mensagem no WhatsApp">
                                💬
                              </a>
                            )}
                          </div>

                          <div className="flex gap-2 justify-end pt-1 border-t">
                            <button
                              type="button"
                              onClick={() => {
                                setVinculoEdicao({ ...v, discipulador_id: String(v.discipulador_id), discipulando_id: String(v.discipulando_id) });
                                setModalEditarVinculo(true);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
                            >
                              ✏️ Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExcluirVinculo(v)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg cursor-pointer"
                            >
                              🗑️ Excluir
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VISUALIZAÇÃO POR DISCIPULADOR */}
          {activeTab === 'discipulado-agenda-discipulador' && (
            <div className="space-y-6">
              {gruposAgrupados.map((grupo) => (
                <div key={grupo.discipulador_id} className="border rounded-2xl p-5 bg-slate-50 space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b pb-2">
                    <h3 className="font-black text-blue-900 text-base">👤 Líder: {nomeBonito(grupo.discipulador?.nome)}</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setGrupoSelecionado(grupo);
                        setDataGrupo(hojeLocal());
                        setModalEncontroGrupo(true);
                      }}
                      className="px-3 py-1 bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                    >
                      ➕ Novo Encontro em Grupo
                    </button>
                  </div>

                  <div className="space-y-2">
                    {grupo.vinculos.map((v) => (
                      <div key={v.id} className="bg-white p-3 border rounded-xl space-y-1">
                        <p className="font-bold text-slate-800 text-xs">🌱 Discípulo: {nomeBonito(v.discipulando?.nome)}</p>
                        <p className="text-[11px] text-slate-500">
                          Encontros Registrados: <strong>{(v.encontros || []).length}</strong>
                        </p>
                        {(v.encontros || []).map((e) => (
                          <div key={e.id} className={`p-2 border rounded-lg text-xs space-y-0.5 ${e.data_encontro >= hoje ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50'}`}>
                            <span className="font-bold text-blue-900">
                              📅 {dataBR(e.data_encontro)} às {e.hora_encontro}
                              {e.data_encontro >= hoje && <span className="ml-1 text-emerald-700">(agendado)</span>}
                            </span>
                            <p className="text-slate-700">📘 {e.assunto_tratado}</p>
                            {e.comentarios && <p className="text-slate-500 italic">💬 {e.comentarios}</p>}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VISUALIZAÇÃO AGENDAMENTO GERAL */}
          {activeTab === 'discipulado-agenda-geral' && !vazio && (
            <div className="space-y-3">
              <h3 className="font-bold text-slate-700 text-sm">
                {periodoGeral === 'proximos' ? 'Próximos encontros' : periodoGeral === 'realizados' ? 'Encontros realizados' : 'Todos os encontros'} ({todosEncontrosGeral.length})
              </h3>
              {todosEncontrosGeral.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed rounded-2xl text-xs text-slate-500">
                  {periodoGeral === 'proximos' ? 'Nenhum encontro agendado daqui para frente.' : 'Nenhum encontro registrado.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs min-w-[640px]">
                    <thead>
                      <tr className="bg-blue-900 text-white uppercase font-bold">
                        <th className="p-3 rounded-l-xl">Data / Hora</th>
                        <th className="p-3">Discipulador</th>
                        <th className="p-3">Discípulo</th>
                        <th className="p-3">Assunto / Pauta</th>
                        <th className="p-3 rounded-r-xl">Comentários</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {todosEncontrosGeral.map((e) => (
                        <tr key={e.idUnico} className={`hover:bg-slate-50 ${e.data === hoje ? 'bg-amber-50' : ''}`}>
                          <td className="p-3 font-bold text-blue-900 whitespace-nowrap">
                            📅 {dataBR(e.data)} {e.data === hoje && <span className="text-amber-700">(hoje)</span>}
                            <br />⏰ {e.hora}
                          </td>
                          <td className="p-3 font-semibold text-slate-800">{e.discipulador}</td>
                          <td className="p-3 font-semibold text-emerald-800">{e.discipulo}</td>
                          <td className="p-3 font-medium text-slate-700">{e.assunto}</td>
                          <td className="p-3 text-slate-500 italic">{e.comentarios || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* MODAL: ENCONTRO EM GRUPO */}
      {modalEncontroGrupo && grupoSelecionado && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-lg font-black text-blue-900">Agendar Encontro em Grupo</h3>
                <p className="text-xs text-slate-500">
                  {nomeBonito(grupoSelecionado.discipulador?.nome)} + {grupoSelecionado.totalDiscipulos} discípulo(s)
                </p>
              </div>
              <button type="button" onClick={() => setModalEncontroGrupo(false)} className="text-xs font-bold text-slate-500 cursor-pointer">
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleSalvarEncontroGrupo} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <label className="block font-bold text-slate-700">
                  Data
                  <input type="date" value={dataGrupo} onChange={(e) => setDataGrupo(e.target.value)} className="mt-1 w-full border rounded-xl p-2.5 bg-white font-semibold" required />
                </label>
                <label className="block font-bold text-slate-700">
                  Hora
                  <input type="time" value={horaGrupo} onChange={(e) => setHoraGrupo(e.target.value)} className="mt-1 w-full border rounded-xl p-2.5 bg-white font-semibold" required />
                </label>
              </div>

              <label className="block font-bold text-slate-700">
                Assunto / Pauta *
                <input
                  type="text"
                  placeholder="Ex: Estudo capítulo 3..."
                  value={assuntoGrupo}
                  onChange={(e) => setAssuntoGrupo(e.target.value)}
                  className="mt-1 w-full border rounded-xl p-2.5 font-bold text-slate-800"
                  required
                />
              </label>

              <label className="block font-bold text-slate-700">
                Comentários
                <textarea
                  placeholder="Observações do encontro..."
                  value={comentarioGrupo}
                  onChange={(e) => setComentarioGrupo(e.target.value)}
                  className="mt-1 w-full border rounded-xl p-2.5 font-normal"
                  rows={3}
                />
              </label>

              <button type="submit" disabled={salvando} className="w-full py-3 bg-emerald-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer disabled:opacity-60">
                {salvando ? 'Salvando...' : `⚡ Replicar para os ${grupoSelecionado.totalDiscipulos} Discípulos`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVO VÍNCULO */}
      {modalNovoVinculo && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 space-y-4 my-8">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-blue-900">Novo Vínculo de Discipulado</h3>
              <button type="button" onClick={() => setModalNovoVinculo(false)} className="text-xs font-bold text-slate-500 cursor-pointer">
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleSalvarVinculo} className="space-y-4 text-xs">
              <SeletorMembro
                rotulo="1. Discipulador"
                membros={membros}
                valor={discipuladorId}
                onChange={(id) => {
                  setDiscipuladorId(id);
                  setDiscipulosSelecionados((atual) => atual.filter((x) => x !== id));
                }}
              />

              <div>
                <label className="block font-bold text-slate-700 mb-1">2. Discípulos ({discipulosSelecionados.length} selecionado(s))</label>
                <input
                  type="text"
                  value={buscaDiscipulos}
                  onChange={(e) => setBuscaDiscipulos(e.target.value)}
                  placeholder="🔎 Filtrar por nome..."
                  className="w-full border rounded-xl p-2.5 mb-2"
                />
                <div className="border rounded-xl p-2 max-h-56 overflow-y-auto space-y-0.5 bg-slate-50">
                  {candidatosDiscipulos.length === 0 ? (
                    <p className="p-3 text-center text-slate-500">Nenhum membro encontrado.</p>
                  ) : (
                    candidatosDiscipulos.map((m) => {
                      const atual = liderDoDiscipulo[String(m.id)];
                      const mesmoLider = atual && String(atual.discipulador_id) === String(discipuladorId);
                      return (
                        <label key={m.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-white cursor-pointer">
                          <input type="checkbox" checked={discipulosSelecionados.includes(String(m.id))} onChange={() => toggleDiscipulo(String(m.id))} />
                          <span className="flex-1 font-semibold text-slate-800 truncate">{nomeBonito(m.nome)}</span>
                          {atual && (
                            <span className={`shrink-0 text-[10px] ${mesmoLider ? 'text-emerald-700' : 'text-amber-700'}`}>
                              {mesmoLider ? 'já é deste líder' : `com ${nomeBonito(atual.discipulador?.nome).split(' ')[0]}`}
                            </span>
                          )}
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <label className="block font-bold text-slate-700">
                3. Dia Regular do Encontro
                <select value={diaReuniao} onChange={(e) => setDiaReuniao(e.target.value)} className="mt-1 w-full border rounded-xl p-2.5 bg-white font-normal">
                  {DIAS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>

              <button type="submit" disabled={salvando} className="w-full py-3 bg-blue-900 text-white font-bold text-xs rounded-xl cursor-pointer disabled:opacity-60">
                {salvando ? 'Salvando...' : '⚡ Salvar Discipulado'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR VÍNCULO */}
      {modalEditarVinculo && vinculoEdicao && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-blue-900">Editar Discipulado</h3>
              <button type="button" onClick={() => setModalEditarVinculo(false)} className="text-xs font-bold text-slate-500 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarEdicaoVinculo} className="space-y-3 text-xs">
              <SeletorMembro
                rotulo="Discipulador"
                membros={membros}
                valor={vinculoEdicao.discipulador_id}
                onChange={(id) => setVinculoEdicao({ ...vinculoEdicao, discipulador_id: id })}
              />
              <SeletorMembro
                rotulo="Discípulo"
                membros={membros}
                valor={vinculoEdicao.discipulando_id}
                onChange={(id) => setVinculoEdicao({ ...vinculoEdicao, discipulando_id: id })}
              />
              <label className="block font-bold text-slate-700">
                Dia Regular do Encontro
                <select
                  value={vinculoEdicao.dia_reuniao || 'Segunda-feira'}
                  onChange={(e) => setVinculoEdicao({ ...vinculoEdicao, dia_reuniao: e.target.value })}
                  className="mt-1 w-full border rounded-xl p-2.5 font-normal"
                >
                  {DIAS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>

              <div className="pt-2 flex gap-2 justify-end">
                <button type="button" onClick={() => setModalEditarVinculo(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-900 text-white font-bold rounded-xl cursor-pointer">
                  💾 Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AGENDA INDIVIDUAL */}
      {modalEncontrosIndividuais && selectedVinculo && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-3 shrink-0">
              <div>
                <h3 className="text-lg font-black text-blue-900">Agenda Individual: {nomeBonito(selectedVinculo.discipulando?.nome)}</h3>
                <p className="text-xs text-slate-500">Discipulador: {nomeBonito(selectedVinculo.discipulador?.nome)}</p>
              </div>
              <button type="button" onClick={() => setModalEncontrosIndividuais(false)} className="text-xs font-bold text-slate-500 cursor-pointer">
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleAdicionarEncontroIndividual} className="bg-slate-50 p-4 rounded-2xl space-y-3 text-xs border shrink-0">
              <div className="grid grid-cols-2 gap-2">
                <label className="block font-bold text-slate-600">
                  Data
                  <input type="date" value={novaData} onChange={(e) => setNovaData(e.target.value)} className="mt-1 w-full border rounded-xl p-2 bg-white" required />
                </label>
                <label className="block font-bold text-slate-600">
                  Hora
                  <input type="time" value={novaHora} onChange={(e) => setNovaHora(e.target.value)} className="mt-1 w-full border rounded-xl p-2 bg-white" required />
                </label>
              </div>
              <label className="block font-bold text-slate-600">
                Assunto Tratado
                <input type="text" value={novoAssunto} onChange={(e) => setNovoAssunto(e.target.value)} className="mt-1 w-full border rounded-xl p-2 bg-white font-normal" required />
              </label>
              <label className="block font-bold text-slate-600">
                Comentários
                <textarea value={novoComentario} onChange={(e) => setNovoComentario(e.target.value)} className="mt-1 w-full border rounded-xl p-2 bg-white font-normal" rows={2} />
              </label>
              <button type="submit" className="w-full py-2.5 bg-blue-900 text-white font-bold rounded-xl shadow cursor-pointer">
                ⚡ Agendar Encontro
              </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {listaEncontros.length === 0 && <p className="p-4 text-center text-xs text-slate-400">Nenhum encontro registrado ainda.</p>}
              {listaEncontros.map((item, idx) => (
                <div key={item.id} className={`border p-3 rounded-xl space-y-1 text-xs shadow-sm ${item.data_encontro >= hoje ? 'bg-emerald-50 border-emerald-200' : 'bg-white'}`}>
                  <div className="flex justify-between gap-2">
                    <span className="font-bold text-blue-900">
                      #{listaEncontros.length - idx} • 📅 {dataBR(item.data_encontro)} às ⏰ {item.hora_encontro}
                      {item.data_encontro >= hoje && <span className="ml-1 text-emerald-700">(agendado)</span>}
                    </span>
                    <button type="button" onClick={() => handleExcluirEncontro(item)} className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer" aria-label="Excluir encontro">
                      🗑️
                    </button>
                  </div>
                  <p className="text-slate-800">📘 <strong>Pauta:</strong> {item.assunto_tratado}</p>
                  {item.comentarios && <p className="text-slate-500 italic">💬 {item.comentarios}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
