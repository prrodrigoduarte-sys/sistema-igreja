// src/CelulasModule.tsx
// Estrutura: 1º Rede → 2º Setor (pertence a uma Rede) → 3º Célula (pertence a um Setor)
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { supabase } from './supabase';

interface Membro {
  id: any;
  nome: string;
  tipo?: string;
}

interface Rede {
  id?: string;
  nome: string;
  codigo_igreja: string;
  lider_id?: any;
}

interface Setor {
  id?: string;
  nome: string;
  codigo_igreja: string;
  rede_id?: string | null;
  lider_id?: any;
}

interface Celula {
  id?: string;
  codigo_igreja: string;
  nome: string;
  setor_id?: string | null;
  lider_id?: any;
  vice_id?: any;
  anfitriao_id?: any;
  dia_semana?: string;
  horario?: string;
  endereco?: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  cep?: string;
}

interface CelulasModuleProps {
  loggedUser: any;
  subAbaInicial?: 'celulas' | 'setores' | 'redes';
}

type Aba = 'celulas' | 'setores' | 'redes';

const DIAS = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
const POR_PAGINA = 1000;

const semAcento = (t: string) => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const nomeBonito = (nome?: string) =>
  (nome || '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((p, i) => (i > 0 && ['de', 'da', 'do', 'das', 'dos', 'e'].includes(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(' ');

// ── Caixa de busca de membro (usada para Líder, Vice, Anfitrião, Líder do Setor e Líder da Rede) ──
function SeletorMembro({
  rotulo,
  membros,
  valor,
  onChange,
  placeholder = 'Digite o nome...',
}: {
  rotulo: string;
  membros: Membro[];
  valor: any;
  onChange: (id: any) => void;
  placeholder?: string;
}) {
  const [busca, setBusca] = useState('');
  const [aberto, setAberto] = useState(false);
  const caixaRef = useRef<HTMLDivElement | null>(null);
  const selecionado = membros.find((m) => String(m.id) === String(valor));

  // Fecha a lista ao clicar fora
  useEffect(() => {
    if (!aberto) return;
    const fechar = (e: MouseEvent) => {
      if (caixaRef.current && !caixaRef.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener('mousedown', fechar);
    return () => document.removeEventListener('mousedown', fechar);
  }, [aberto]);

  const termo = semAcento(busca.trim());
  const resultados = (termo ? membros.filter((m) => semAcento(m.nome).includes(termo)) : membros).slice(0, 60);

  return (
    <div className="relative" ref={caixaRef}>
      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{rotulo}</label>
      {selecionado && !aberto ? (
        <div className="flex items-center gap-2 w-full border border-blue-200 bg-blue-50 rounded-xl px-3 py-2">
          <span className="w-7 h-7 rounded-full bg-blue-900 text-white text-xs font-black flex items-center justify-center shrink-0">
            {nomeBonito(selecionado.nome).charAt(0)}
          </span>
          <span className="flex-1 min-w-0 truncate text-sm font-semibold text-blue-900">{nomeBonito(selecionado.nome)}</span>
          <button
            type="button"
            onClick={() => {
              setBusca('');
              setAberto(true);
            }}
            className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
          >
            Trocar
          </button>
          <button type="button" onClick={() => onChange('')} className="text-slate-400 hover:text-rose-600 cursor-pointer px-1" aria-label={`Remover ${rotulo}`}>
            ✕
          </button>
        </div>
      ) : (
        <input
          type="text"
          placeholder={`🔎 ${placeholder}`}
          value={busca}
          onFocus={() => setAberto(true)}
          onChange={(e) => {
            setBusca(e.target.value);
            setAberto(true);
          }}
          autoFocus={aberto && !!selecionado}
          className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      )}
      {aberto && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-56 overflow-y-auto">
          {membros.length === 0 ? (
            <div className="p-3 text-xs text-slate-500 text-center">Nenhum membro cadastrado nesta igreja.</div>
          ) : resultados.length === 0 ? (
            <div className="p-3 text-xs text-slate-500 text-center">Nenhum membro com “{busca}”.</div>
          ) : (
            resultados.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  onChange(m.id);
                  setBusca('');
                  setAberto(false);
                }}
                className={`w-full text-left px-4 py-2 text-xs hover:bg-blue-50 font-medium border-b border-slate-100 last:border-b-0 cursor-pointer flex justify-between gap-2 ${
                  String(m.id) === String(valor) ? 'bg-blue-50 text-blue-900' : ''
                }`}
              >
                <span className="truncate">{nomeBonito(m.nome)}</span>
                {m.tipo && m.tipo !== 'Membro' && <span className="shrink-0 text-[10px] text-slate-400">{m.tipo}</span>}
              </button>
            ))
          )}
          {!termo && membros.length > 60 && <div className="p-2 text-[10px] text-slate-400 text-center">Digite para encontrar os outros {membros.length - 60}</div>}
        </div>
      )}
    </div>
  );
}

export default function CelulasModule({ loggedUser, subAbaInicial = 'celulas' }: CelulasModuleProps) {
  const [subAba, setSubAba] = useState<Aba>(subAbaInicial);
  const [membros, setMembros] = useState<Membro[]>([]);
  const [redes, setRedes] = useState<Rede[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [celulas, setCelulas] = useState<Celula[]>([]);
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filtros da lista
  const [filtroRede, setFiltroRede] = useState('');
  const [filtroSetor, setFiltroSetor] = useState('');
  const [busca, setBusca] = useState('');

  const codigoIgreja = loggedUser?.codigo_igreja || loggedUser?.igrejas?.codigo_igreja || 'IGR-001';

  useEffect(() => {
    setSubAba(subAbaInicial);
  }, [subAbaInicial]);

  // Formulário - Rede
  const [nomeRede, setNomeRede] = useState('');
  const [liderRedeId, setLiderRedeId] = useState<any>('');

  // Formulário - Setor
  const [nomeSetor, setNomeSetor] = useState('');
  const [redeSetorId, setRedeSetorId] = useState('');
  const [liderSetorId, setLiderSetorId] = useState<any>('');

  // Formulário - Célula
  const [nomeCelula, setNomeCelula] = useState('');
  const [redeCelulaId, setRedeCelulaId] = useState(''); // só para filtrar os setores
  const [setorCelulaId, setSetorCelulaId] = useState('');
  const [liderCelulaId, setLiderCelulaId] = useState<any>('');
  const [viceCelulaId, setViceCelulaId] = useState<any>('');
  const [anfitriaoCelulaId, setAnfitriaoCelulaId] = useState<any>('');
  const [diaSemana, setDiaSemana] = useState('Quarta-feira');
  const [horario, setHorario] = useState('19:30');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [cep, setCep] = useState('');
  const [buscandoCep, setBuscandoCep] = useState(false);

  const carregarDados = useCallback(async () => {
    setLoading(true);

    // Membros desta igreja (tabela "members", coluna "nome"), de 1000 em 1000
    try {
      const todos: Membro[] = [];
      for (let inicio = 0; ; inicio += POR_PAGINA) {
        const { data, error } = await supabase
          .from('members')
          .select('id, nome, tipo_cadastro')
          .eq('codigo_igreja', codigoIgreja)
          .order('nome', { ascending: true })
          .range(inicio, inicio + POR_PAGINA - 1);
        if (error) throw error;
        todos.push(...(data || []).filter((m: any) => m.nome).map((m: any) => ({ id: m.id, nome: m.nome, tipo: m.tipo_cadastro || 'Membro' })));
        if (!data || data.length < POR_PAGINA) break;
      }
      setMembros(todos);
    } catch (e) {
      console.warn('Erro ao carregar membros:', e);
    }

    const [resRedes, resSetores, resCelulas] = await Promise.all([
      supabase.from('redes').select('*').eq('codigo_igreja', codigoIgreja).order('nome'),
      supabase.from('setores').select('*').eq('codigo_igreja', codigoIgreja).order('nome'),
      supabase.from('celulas').select('*').eq('codigo_igreja', codigoIgreja).order('nome'),
    ]);
    if (!resRedes.error) setRedes(resRedes.data || []);
    if (!resSetores.error) setSetores(resSetores.data || []);
    if (!resCelulas.error) setCelulas(resCelulas.data || []);

    setLoading(false);
  }, [codigoIgreja]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const getNomeMembro = useCallback(
    (id?: any) => {
      if (!id) return '';
      const m = membros.find((item) => String(item.id) === String(id));
      return m ? nomeBonito(m.nome) : '';
    },
    [membros]
  );

  const redePorId = (id?: string | null) => redes.find((r) => String(r.id) === String(id));
  const setorPorId = (id?: string | null) => setores.find((s) => String(s.id) === String(id));
  const setoresDaRede = (redeId: string) => setores.filter((s) => String(s.rede_id || '') === String(redeId));
  const celulasDoSetor = (setorId?: string) => celulas.filter((c) => String(c.setor_id || '') === String(setorId));

  const limparFormularios = () => {
    setEditingId(null);
    setNomeRede('');
    setLiderRedeId('');
    setNomeSetor('');
    setRedeSetorId('');
    setLiderSetorId('');
    setNomeCelula('');
    setRedeCelulaId('');
    setSetorCelulaId('');
    setLiderCelulaId('');
    setViceCelulaId('');
    setAnfitriaoCelulaId('');
    setDiaSemana('Quarta-feira');
    setHorario('19:30');
    setRua('');
    setNumero('');
    setBairro('');
    setCidade('');
    setCep('');
  };

  const abrirNovoModal = () => {
    if (subAba === 'setores' && redes.length === 0) return alert('Cadastre primeiro uma Rede (aba 🌐 Redes).');
    if (subAba === 'celulas' && setores.length === 0) return alert('Cadastre primeiro um Setor (aba 📐 Setores).');
    limparFormularios();
    if (subAba === 'setores' && filtroRede) setRedeSetorId(filtroRede);
    if (subAba === 'celulas') {
      setRedeCelulaId(filtroRede);
      setSetorCelulaId(filtroSetor);
    }
    setModalOpen(true);
  };

  // Executa o salvamento e mostra o erro, se houver (antes o erro era ignorado em silêncio)
  const executar = async (acao: () => PromiseLike<{ error: any }>, sucesso: string) => {
    setSalvando(true);
    const { error } = await acao();
    setSalvando(false);
    if (error) {
      alert('Não foi possível salvar: ' + error.message);
      return false;
    }
    setModalOpen(false);
    carregarDados();
    if (sucesso) console.info(sucesso);
    return true;
  };

  const salvarRede = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeRede.trim()) return alert('Informe o nome da Rede');
    const payload = { codigo_igreja: codigoIgreja, nome: nomeRede.trim(), lider_id: liderRedeId || null };
    await executar(
      () => (editingId ? supabase.from('redes').update(payload).eq('id', editingId) : supabase.from('redes').insert([payload])),
      'Rede salva'
    );
  };

  const salvarSetor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeSetor.trim()) return alert('Informe o nome do Setor');
    if (!redeSetorId) return alert('Escolha a Rede a que este Setor pertence.');
    const payload = { codigo_igreja: codigoIgreja, nome: nomeSetor.trim(), rede_id: redeSetorId, lider_id: liderSetorId || null };
    await executar(
      () => (editingId ? supabase.from('setores').update(payload).eq('id', editingId) : supabase.from('setores').insert([payload])),
      'Setor salvo'
    );
  };

  const salvarCelula = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeCelula.trim()) return alert('Informe o nome da Célula');
    if (!setorCelulaId) return alert('Escolha o Setor a que esta Célula pertence.');
    if (liderCelulaId && viceCelulaId && String(liderCelulaId) === String(viceCelulaId)) return alert('O Líder e o Vice-Líder precisam ser pessoas diferentes.');

    const endFormatado = [rua, numero, bairro, cidade].map((x) => x.trim()).filter(Boolean).join(', ');
    const payload = {
      codigo_igreja: codigoIgreja,
      nome: nomeCelula.trim(),
      setor_id: setorCelulaId,
      lider_id: liderCelulaId || null,
      vice_id: viceCelulaId || null,
      anfitriao_id: anfitriaoCelulaId || null,
      dia_semana: diaSemana,
      horario,
      rua: rua.trim(),
      numero: numero.trim(),
      bairro: bairro.trim(),
      cidade: cidade.trim(),
      cep: cep.trim(),
      endereco: endFormatado,
    };
    await executar(
      () => (editingId ? supabase.from('celulas').update(payload).eq('id', editingId) : supabase.from('celulas').insert([payload])),
      'Célula salva'
    );
  };

  // Preenche rua, bairro e cidade pelo CEP (serviço gratuito ViaCEP)
  const buscarCep = async () => {
    const digitos = cep.replace(/\D/g, '');
    if (digitos.length !== 8) return;
    setBuscandoCep(true);
    try {
      const resp = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
      const dados = await resp.json();
      if (!dados.erro) {
        if (dados.logradouro) setRua(dados.logradouro);
        if (dados.bairro) setBairro(dados.bairro);
        if (dados.localidade) setCidade(`${dados.localidade}${dados.uf ? ` - ${dados.uf}` : ''}`);
      }
    } catch {}
    setBuscandoCep(false);
  };

  const excluir = async (tabela: 'redes' | 'setores' | 'celulas', id: any, nome: string) => {
    if (tabela === 'redes' && setoresDaRede(id).length) {
      return alert(`A Rede "${nome}" tem ${setoresDaRede(id).length} setor(es). Mude esses setores de Rede ou exclua-os antes.`);
    }
    if (tabela === 'setores' && celulasDoSetor(id).length) {
      return alert(`O Setor "${nome}" tem ${celulasDoSetor(id).length} célula(s). Mude essas células de Setor ou exclua-as antes.`);
    }
    if (!window.confirm(`Excluir "${nome}"?`)) return;
    const { error } = await supabase.from(tabela).delete().eq('id', id);
    if (error) return alert('Não foi possível excluir: ' + error.message);
    carregarDados();
  };

  // ── Listas filtradas ──
  const termo = semAcento(busca.trim());
  const celulasFiltradas = useMemo(
    () =>
      celulas.filter((c) => {
        const setor = setores.find((s) => String(s.id) === String(c.setor_id));
        if (filtroRede && String(setor?.rede_id || '') !== String(filtroRede)) return false;
        if (filtroSetor && String(c.setor_id || '') !== String(filtroSetor)) return false;
        if (termo) {
          const texto = semAcento([c.nome, c.bairro, getNomeMembro(c.lider_id)].join(' '));
          if (!texto.includes(termo)) return false;
        }
        return true;
      }),
    [celulas, setores, filtroRede, filtroSetor, termo, getNomeMembro]
  );
  const setoresFiltrados = setores.filter(
    (s) => (!filtroRede || String(s.rede_id || '') === String(filtroRede)) && (!termo || semAcento(s.nome + ' ' + getNomeMembro(s.lider_id)).includes(termo))
  );
  const redesFiltradas = redes.filter((r) => !termo || semAcento(r.nome + ' ' + getNomeMembro(r.lider_id)).includes(termo));

  const tituloAba = subAba === 'celulas' ? 'Célula' : subAba === 'setores' ? 'Setor' : 'Rede';
  const novoOuNova = subAba === 'setores' ? 'Novo' : 'Nova';
  const campo = 'w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white';
  const cartao = 'border rounded-2xl p-5 bg-slate-50 hover:bg-white hover:shadow-md transition flex flex-col justify-between gap-3';

  const botoesCartao = (onEditar: () => void, onExcluir: () => void) => (
    <div className="flex gap-2 pt-3 border-t">
      <button type="button" onClick={onEditar} className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl cursor-pointer">
        ✏️ Editar
      </button>
      <button type="button" onClick={onExcluir} className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 cursor-pointer" aria-label="Excluir">
        🗑️
      </button>
    </div>
  );

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 w-full max-w-6xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-blue-900 tracking-tight">Gestão Estrutural de Células</h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Rede → Setor → Célula ({codigoIgreja}) · {membros.length} membros disponíveis para liderança
          </p>
        </div>

        <button
          type="button"
          onClick={abrirNovoModal}
          className="px-4 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
        >
          ➕ {novoOuNova} {tituloAba}
        </button>
      </div>

      {/* ABAS na ordem da estrutura */}
      <div className="flex flex-wrap gap-2 items-center">
        {([
          ['redes', `1º 🌐 Redes (${redes.length})`],
          ['setores', `2º 📐 Setores (${setores.length})`],
          ['celulas', `3º 🏡 Células (${celulas.length})`],
        ] as [Aba, string][]).map(([id, rotulo]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSubAba(id)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              subAba === id ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {/* FILTROS */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="🔎 Buscar por nome, líder ou bairro..." className={`${campo} sm:flex-1`} />
        {subAba !== 'redes' && (
          <select
            value={filtroRede}
            onChange={(e) => {
              setFiltroRede(e.target.value);
              setFiltroSetor('');
            }}
            className={`${campo} sm:w-56`}
            aria-label="Filtrar por rede"
          >
            <option value="">Todas as redes</option>
            {redes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nome}
              </option>
            ))}
          </select>
        )}
        {subAba === 'celulas' && (
          <select value={filtroSetor} onChange={(e) => setFiltroSetor(e.target.value)} className={`${campo} sm:w-56`} aria-label="Filtrar por setor">
            <option value="">Todos os setores</option>
            {(filtroRede ? setoresDaRede(filtroRede) : setores).map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading && <p className="text-center py-6 text-slate-500">Carregando dados...</p>}

      {/* CÉLULAS */}
      {!loading && subAba === 'celulas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {celulasFiltradas.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-sm">
              {celulas.length === 0 ? 'Nenhuma célula cadastrada. Clique em "➕ Nova Célula" para criar.' : 'Nenhuma célula com esses filtros.'}
            </div>
          ) : (
            celulasFiltradas.map((c) => {
              const setor = setorPorId(c.setor_id);
              const rede = redePorId(setor?.rede_id);
              return (
                <div key={c.id} className={cartao}>
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-500">
                      🌐 {rede?.nome || 'Sem rede'} › 📐 {setor?.nome || <span className="text-rose-600">Sem setor</span>}
                    </p>
                    <h3 className="text-lg font-black text-blue-900 leading-tight">{c.nome}</h3>
                    <p className="text-xs text-slate-600">👑 <strong>Líder:</strong> {getNomeMembro(c.lider_id) || <span className="text-amber-600">Não atribuído</span>}</p>
                    <p className="text-xs text-slate-600">🤝 <strong>Vice:</strong> {getNomeMembro(c.vice_id) || 'Não atribuído'}</p>
                    <p className="text-xs text-slate-600">🏠 <strong>Anfitrião:</strong> {getNomeMembro(c.anfitriao_id) || 'Não atribuído'}</p>
                    <p className="text-xs text-slate-600">📅 {c.dia_semana || 'Não informado'} às {c.horario || '19:30'}</p>
                    {c.endereco && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.endereco)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-xs text-blue-700 hover:underline border-t pt-2 mt-2"
                      >
                        📍 {c.endereco}
                      </a>
                    )}
                  </div>
                  {botoesCartao(
                    () => {
                      limparFormularios();
                      setEditingId(c.id || null);
                      setNomeCelula(c.nome);
                      setRedeCelulaId(String(setor?.rede_id || ''));
                      setSetorCelulaId(String(c.setor_id || ''));
                      setLiderCelulaId(c.lider_id || '');
                      setViceCelulaId(c.vice_id || '');
                      setAnfitriaoCelulaId(c.anfitriao_id || '');
                      setDiaSemana(c.dia_semana || 'Quarta-feira');
                      setHorario(c.horario || '19:30');
                      setRua(c.rua || '');
                      setNumero(c.numero || '');
                      setBairro(c.bairro || '');
                      setCidade(c.cidade || '');
                      setCep(c.cep || '');
                      setModalOpen(true);
                    },
                    () => excluir('celulas', c.id, c.nome)
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SETORES */}
      {!loading && subAba === 'setores' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {setoresFiltrados.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-sm">
              {setores.length === 0 ? 'Nenhum setor cadastrado.' : 'Nenhum setor com esses filtros.'}
            </div>
          ) : (
            setoresFiltrados.map((s) => {
              const qtd = celulasDoSetor(s.id).length;
              return (
                <div key={s.id} className={cartao}>
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-500">🌐 {redePorId(s.rede_id)?.nome || <span className="text-rose-600">Sem rede</span>}</p>
                    <h3 className="text-lg font-black text-blue-900 leading-tight">{s.nome}</h3>
                    <p className="text-xs text-slate-600">👑 <strong>Líder do Setor:</strong> {getNomeMembro(s.lider_id) || <span className="text-amber-600">Não atribuído</span>}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setFiltroRede(String(s.rede_id || ''));
                        setFiltroSetor(String(s.id));
                        setSubAba('celulas');
                      }}
                      className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
                    >
                      🏡 {qtd} célula(s) →
                    </button>
                  </div>
                  {botoesCartao(
                    () => {
                      limparFormularios();
                      setEditingId(s.id || null);
                      setNomeSetor(s.nome);
                      setRedeSetorId(String(s.rede_id || ''));
                      setLiderSetorId(s.lider_id || '');
                      setModalOpen(true);
                    },
                    () => excluir('setores', s.id, s.nome)
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* REDES */}
      {!loading && subAba === 'redes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {redesFiltradas.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-sm">
              {redes.length === 0 ? 'Nenhuma rede cadastrada. Comece por aqui: Rede → Setor → Célula.' : 'Nenhuma rede com essa busca.'}
            </div>
          ) : (
            redesFiltradas.map((r) => {
              const setoresR = setoresDaRede(String(r.id));
              const qtdCelulas = setoresR.reduce((acc, s) => acc + celulasDoSetor(s.id).length, 0);
              return (
                <div key={r.id} className={cartao}>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-blue-900 leading-tight">{r.nome}</h3>
                    <p className="text-xs text-slate-600">👑 <strong>Líder da Rede:</strong> {getNomeMembro(r.lider_id) || <span className="text-amber-600">Não atribuído</span>}</p>
                    <div className="flex gap-3 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          setFiltroRede(String(r.id));
                          setSubAba('setores');
                        }}
                        className="text-blue-700 hover:underline cursor-pointer"
                      >
                        📐 {setoresR.length} setor(es)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFiltroRede(String(r.id));
                          setFiltroSetor('');
                          setSubAba('celulas');
                        }}
                        className="text-blue-700 hover:underline cursor-pointer"
                      >
                        🏡 {qtdCelulas} célula(s)
                      </button>
                    </div>
                  </div>
                  {botoesCartao(
                    () => {
                      limparFormularios();
                      setEditingId(r.id || null);
                      setNomeRede(r.nome);
                      setLiderRedeId(r.lider_id || '');
                      setModalOpen(true);
                    },
                    () => excluir('redes', r.id, r.nome)
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 my-8">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-xl font-black text-blue-900">
                {editingId ? 'Editar' : novoOuNova} {tituloAba}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl cursor-pointer">
                ✕ Fechar
              </button>
            </div>

            {/* REDE */}
            {subAba === 'redes' && (
              <form onSubmit={salvarRede} className="space-y-4">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Nome da Rede *
                  <input type="text" value={nomeRede} onChange={(e) => setNomeRede(e.target.value)} placeholder="Ex: Rede de Jovens" required className={`${campo} mt-1 font-normal normal-case`} />
                </label>
                <SeletorMembro rotulo="👑 Líder da Rede" membros={membros} valor={liderRedeId} onChange={setLiderRedeId} />
                <button type="submit" disabled={salvando} className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl cursor-pointer disabled:opacity-60">
                  {salvando ? 'Salvando...' : 'Salvar Rede'}
                </button>
              </form>
            )}

            {/* SETOR */}
            {subAba === 'setores' && (
              <form onSubmit={salvarSetor} className="space-y-4">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  1º Rede a que pertence *
                  <select value={redeSetorId} onChange={(e) => setRedeSetorId(e.target.value)} className={`${campo} mt-1 font-normal normal-case`} required>
                    <option value="">Escolha a Rede...</option>
                    {redes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nome}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Nome do Setor *
                  <input type="text" value={nomeSetor} onChange={(e) => setNomeSetor(e.target.value)} placeholder="Ex: Setor 01" required className={`${campo} mt-1 font-normal normal-case`} />
                </label>
                <SeletorMembro rotulo="👑 Líder do Setor" membros={membros} valor={liderSetorId} onChange={setLiderSetorId} />
                <button type="submit" disabled={salvando} className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl cursor-pointer disabled:opacity-60">
                  {salvando ? 'Salvando...' : 'Salvar Setor'}
                </button>
              </form>
            )}

            {/* CÉLULA */}
            {subAba === 'celulas' && (
              <form onSubmit={salvarCelula} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    1º Rede
                    <select
                      value={redeCelulaId}
                      onChange={(e) => {
                        setRedeCelulaId(e.target.value);
                        setSetorCelulaId('');
                      }}
                      className={`${campo} mt-1 font-normal normal-case`}
                    >
                      <option value="">Todas as redes</option>
                      {redes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    2º Setor *
                    <select
                      value={setorCelulaId}
                      onChange={(e) => {
                        setSetorCelulaId(e.target.value);
                        const s = setorPorId(e.target.value);
                        if (s?.rede_id) setRedeCelulaId(String(s.rede_id));
                      }}
                      className={`${campo} mt-1 font-normal normal-case`}
                      required
                    >
                      <option value="">Escolha o Setor...</option>
                      {(redeCelulaId ? setoresDaRede(redeCelulaId) : setores).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nome}
                          {!redeCelulaId && redePorId(s.rede_id) ? ` (${redePorId(s.rede_id)?.nome})` : ''}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block sm:col-span-2 text-xs font-bold text-slate-700 uppercase">
                    3º Nome da Célula *
                    <input type="text" value={nomeCelula} onChange={(e) => setNomeCelula(e.target.value)} placeholder="Ex: Célula Shalom" required className={`${campo} mt-1 font-normal normal-case`} />
                  </label>

                  <SeletorMembro rotulo="👑 Líder" membros={membros} valor={liderCelulaId} onChange={setLiderCelulaId} placeholder="Digite o nome do Líder..." />
                  <SeletorMembro rotulo="🤝 Vice-Líder" membros={membros} valor={viceCelulaId} onChange={setViceCelulaId} placeholder="Digite o nome do Vice..." />
                  <div className="sm:col-span-2">
                    <SeletorMembro rotulo="🏠 Anfitrião" membros={membros} valor={anfitriaoCelulaId} onChange={setAnfitriaoCelulaId} placeholder="Digite o nome do Anfitrião..." />
                  </div>

                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Dia da Semana
                    <select value={diaSemana} onChange={(e) => setDiaSemana(e.target.value)} className={`${campo} mt-1 font-normal normal-case`}>
                      {DIAS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Horário
                    <input type="time" value={horario} onChange={(e) => setHorario(e.target.value)} className={`${campo} mt-1 font-normal`} />
                  </label>

                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    CEP {buscandoCep && <span className="normal-case font-normal text-blue-600">(buscando...)</span>}
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cep}
                      onChange={(e) => setCep(e.target.value)}
                      onBlur={buscarCep}
                      placeholder="00000-000 (preenche o endereço)"
                      className={`${campo} mt-1 font-normal`}
                    />
                  </label>
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Número
                    <input type="text" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="123" className={`${campo} mt-1 font-normal`} />
                  </label>
                  <label className="block sm:col-span-2 text-xs font-bold text-slate-700 uppercase">
                    Rua / Logradouro
                    <input type="text" value={rua} onChange={(e) => setRua(e.target.value)} placeholder="Rua..." className={`${campo} mt-1 font-normal normal-case`} />
                  </label>
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Bairro
                    <input type="text" value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Bairro" className={`${campo} mt-1 font-normal normal-case`} />
                  </label>
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Cidade
                    <input type="text" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Cidade" className={`${campo} mt-1 font-normal normal-case`} />
                  </label>
                </div>

                <button type="submit" disabled={salvando} className="w-full py-3 bg-blue-900 text-white font-bold text-xs rounded-xl hover:bg-blue-800 transition cursor-pointer disabled:opacity-60">
                  {salvando ? 'Salvando...' : 'Salvar Célula'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
