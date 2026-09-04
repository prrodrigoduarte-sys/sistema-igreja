// src/CelulasModule.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

interface Membro {
  id: any;
  nome_completo: string;
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

export default function CelulasModule({ loggedUser, subAbaInicial = 'celulas' }: CelulasModuleProps) {
  const [subAba, setSubAba] = useState<'celulas' | 'setores' | 'redes'>(subAbaInicial);
  const [membros, setMembros] = useState<Membro[]>([]);
  const [redes, setRedes] = useState<Rede[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [celulas, setCelulas] = useState<Celula[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const codigoIgreja = loggedUser?.codigo_igreja || loggedUser?.igrejas?.codigo_igreja || 'IGR-001';

  useEffect(() => {
    setSubAba(subAbaInicial);
  }, [subAbaInicial]);

  // Formulário - Rede
  const [nomeRede, setNomeRede] = useState('');
  const [liderRedeId, setLiderRedeId] = useState('');

  // Formulário - Setor
  const [nomeSetor, setNomeSetor] = useState('');
  const [redeSetorId, setRedeSetorId] = useState('');
  const [liderSetorId, setLiderSetorId] = useState('');

  // Formulário - Célula
  const [nomeCelula, setNomeCelula] = useState('');
  const [setorCelulaId, setSetorCelulaId] = useState('');
  const [liderCelulaId, setLiderCelulaId] = useState('');
  const [viceCelulaId, setViceCelulaId] = useState('');
  const [anfitriaoCelulaId, setAnfitriaoCelulaId] = useState('');
  const [diaSemana, setDiaSemana] = useState('Quarta-feira');
  const [horario, setHorario] = useState('19:30');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [cep, setCep] = useState('');

  // Filtros rápidos
  const [searchLider, setSearchLider] = useState('');
  const [searchVice, setSearchVice] = useState('');
  const [searchAnfitriao, setSearchAnfitriao] = useState('');

  const carregarDados = useCallback(async () => {
    setLoading(true);

    // Carregar membros aceitando múltiplos nomes de colunas
    try {
      const { data, error } = await supabase
        .from('membros')
        .select('*');

      if (!error && data) {
        // Mapeia o nome independente do nome da coluna na tabela de membros
        const membrosNormalizados = data.map((m: any) => ({
          id: m.id,
          nome_completo: m.nome_completo || m.nome || m.nome_membro || `Membro #${m.id}`
        }));
        setMembros(membrosNormalizados);
      }
    } catch (e) {
      console.warn('Erro ao carregar membros:', e);
    }

    try {
      const resRedes = await supabase.from('redes').select('*').eq('codigo_igreja', codigoIgreja);
      if (!resRedes.error) setRedes(resRedes.data || []);
    } catch (e) {}

    try {
      const resSetores = await supabase.from('setores').select('*').eq('codigo_igreja', codigoIgreja);
      if (!resSetores.error) setSetores(resSetores.data || []);
    } catch (e) {}

    try {
      const resCelulas = await supabase.from('celulas').select('*').eq('codigo_igreja', codigoIgreja);
      if (!resCelulas.error) setCelulas(resCelulas.data || []);
    } catch (e) {}

    setLoading(false);
  }, [codigoIgreja]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const limparFormularios = () => {
    setEditingId(null);
    setNomeRede('');
    setLiderRedeId('');
    setNomeSetor('');
    setRedeSetorId('');
    setLiderSetorId('');
    setNomeCelula('');
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
    setSearchLider('');
    setSearchVice('');
    setSearchAnfitriao('');
  };

  const abrirNovoModal = () => {
    limparFormularios();
    setModalOpen(true);
  };

  const salvarRede = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeRede.trim()) return alert('Informe o nome da Rede');

    const payload = {
      codigo_igreja: codigoIgreja,
      nome: nomeRede.trim(),
      lider_id: liderRedeId || null,
    };

    if (editingId) {
      await supabase.from('redes').update(payload).eq('id', editingId);
    } else {
      await supabase.from('redes').insert([payload]);
    }
    setModalOpen(false);
    carregarDados();
  };

  const salvarSetor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeSetor.trim()) return alert('Informe o nome do Setor');

    const payload = {
      codigo_igreja: codigoIgreja,
      nome: nomeSetor.trim(),
      rede_id: redeSetorId || null,
      lider_id: liderSetorId || null,
    };

    if (editingId) {
      await supabase.from('setores').update(payload).eq('id', editingId);
    } else {
      await supabase.from('setores').insert([payload]);
    }
    setModalOpen(false);
    carregarDados();
  };

  const salvarCelula = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeCelula.trim()) return alert('Informe o nome da Célula');

    const endFormatado = [rua, numero, bairro, cidade].filter(Boolean).join(', ');

    const payload = {
      codigo_igreja: codigoIgreja,
      nome: nomeCelula.trim(),
      setor_id: setorCelulaId || null,
      lider_id: liderCelulaId || null,
      vice_id: viceCelulaId || null,
      anfitriao_id: anfitriaoCelulaId || null,
      dia_semana: diaSemana,
      horario: horario,
      rua: rua.trim(),
      numero: numero.trim(),
      bairro: bairro.trim(),
      cidade: cidade.trim(),
      cep: cep.trim(),
      endereco: endFormatado,
    };

    if (editingId) {
      await supabase.from('celulas').update(payload).eq('id', editingId);
    } else {
      await supabase.from('celulas').insert([payload]);
    }
    setModalOpen(false);
    carregarDados();
  };

  const getNomeMembro = (id?: any) => {
    if (!id) return 'Não atribuído';
    const m = membros.find((item) => String(item.id) === String(id));
    return m ? m.nome_completo : `Membro #${id}`;
  };

  const membrosFiltradosLider = membros.filter((m) =>
    (m.nome_completo || '').toLowerCase().includes(searchLider.toLowerCase())
  );
  const membrosFiltradosVice = membros.filter((m) =>
    (m.nome_completo || '').toLowerCase().includes(searchVice.toLowerCase())
  );
  const membrosFiltradosAnfitriao = membros.filter((m) =>
    (m.nome_completo || '').toLowerCase().includes(searchAnfitriao.toLowerCase())
  );

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 w-full max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-blue-900 tracking-tight">
            Gestão Estrutural de Células
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Administração de Células, Setores e Redes ({codigoIgreja})
          </p>
        </div>

        <button
          type="button"
          onClick={abrirNovoModal}
          className="px-4 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
        >
          ➕ Novo ({subAba === 'celulas' ? 'Célula' : subAba === 'setores' ? 'Setor' : 'Rede'})
        </button>
      </div>

      <div className="flex gap-2 border-b pb-2">
        <button
          type="button"
          onClick={() => setSubAba('celulas')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            subAba === 'celulas' ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          🏡 Células ({celulas.length})
        </button>
        <button
          type="button"
          onClick={() => setSubAba('setores')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            subAba === 'setores' ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          📐 Setores ({setores.length})
        </button>
        <button
          type="button"
          onClick={() => setSubAba('redes')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            subAba === 'redes' ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          🌐 Redes ({redes.length})
        </button>
      </div>

      {loading && <p className="text-center py-6 text-slate-500">Carregando dados...</p>}

      {!loading && subAba === 'celulas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {celulas.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-sm">
              Nenhuma célula cadastrada. Clique em "➕ Novo (Célula)" para criar.
            </div>
          ) : (
            celulas.map((c) => (
              <div key={c.id} className="border rounded-2xl p-5 bg-slate-50 hover:bg-white hover:shadow-md transition space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-blue-900">{c.nome}</h3>
                  <p className="text-xs text-slate-600">👑 <strong>Líder:</strong> {getNomeMembro(c.lider_id)}</p>
                  <p className="text-xs text-slate-600">🤝 <strong>Vice:</strong> {getNomeMembro(c.vice_id)}</p>
                  <p className="text-xs text-slate-600">🏠 <strong>Anfitrião:</strong> {getNomeMembro(c.anfitriao_id)}</p>
                  <p className="text-xs text-slate-600">📅 {c.dia_semana || 'Não informado'} às {c.horario || '19:30'}</p>
                  {c.endereco && <p className="text-xs text-slate-500 border-t pt-2 mt-2">📍 {c.endereco}</p>}
                </div>

                <div className="flex gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(c.id || null);
                      setNomeCelula(c.nome);
                      setSetorCelulaId(c.setor_id || '');
                      setLiderCelulaId(c.lider_id ? String(c.lider_id) : '');
                      setViceCelulaId(c.vice_id ? String(c.vice_id) : '');
                      setAnfitriaoCelulaId(c.anfitriao_id ? String(c.anfitriao_id) : '');
                      setDiaSemana(c.dia_semana || 'Quarta-feira');
                      setHorario(c.horario || '19:30');
                      setRua(c.rua || '');
                      setNumero(c.numero || '');
                      setBairro(c.bairro || '');
                      setCidade(c.cidade || '');
                      setCep(c.cep || '');
                      setModalOpen(true);
                    }}
                    className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm('Excluir esta célula?')) {
                        await supabase.from('celulas').delete().eq('id', c.id);
                        carregarDados();
                      }
                    }}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {!loading && subAba === 'setores' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {setores.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-sm">
              Nenhum setor cadastrado.
            </div>
          ) : (
            setores.map((s) => (
              <div key={s.id} className="border rounded-2xl p-5 bg-slate-50 hover:bg-white hover:shadow-md transition space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-blue-900">{s.nome}</h3>
                  <p className="text-xs text-slate-600">👑 <strong>Líder do Setor:</strong> {getNomeMembro(s.lider_id)}</p>
                </div>
                <div className="flex gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(s.id || null);
                      setNomeSetor(s.nome);
                      setRedeSetorId(s.rede_id || '');
                      setLiderSetorId(s.lider_id ? String(s.lider_id) : '');
                      setModalOpen(true);
                    }}
                    className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm('Excluir este setor?')) {
                        await supabase.from('setores').delete().eq('id', s.id);
                        carregarDados();
                      }
                    }}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {!loading && subAba === 'redes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {redes.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-sm">
              Nenhuma rede cadastrada.
            </div>
          ) : (
            redes.map((r) => (
              <div key={r.id} className="border rounded-2xl p-5 bg-slate-50 hover:bg-white hover:shadow-md transition space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-blue-900">{r.nome}</h3>
                  <p className="text-xs text-slate-600">👑 <strong>Líder da Rede:</strong> {getNomeMembro(r.lider_id)}</p>
                </div>
                <div className="flex gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(r.id || null);
                      setNomeRede(r.nome);
                      setLiderRedeId(r.lider_id ? String(r.lider_id) : '');
                      setModalOpen(true);
                    }}
                    className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm('Excluir esta rede?')) {
                        await supabase.from('redes').delete().eq('id', r.id);
                        carregarDados();
                      }
                    }}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 my-8">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-xl font-black text-blue-900">
                {editingId ? 'Editar' : 'Novo'} ({subAba === 'celulas' ? 'Célula' : subAba === 'setores' ? 'Setor' : 'Rede'})
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl"
              >
                ✕ Fechar
              </button>
            </div>

            {/* FORMULÁRIO DA REDE */}
            {subAba === 'redes' && (
              <form onSubmit={salvarRede} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome da Rede *</label>
                  <input
                    type="text"
                    value={nomeRede}
                    onChange={(e) => setNomeRede(e.target.value)}
                    placeholder="Ex: Rede de Jovens"
                    required
                    className="w-full border rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Líder da Rede</label>
                  <select
                    value={liderRedeId}
                    onChange={(e) => setLiderRedeId(e.target.value)}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm"
                  >
                    <option value="">Selecione um Membro ({membros.length} disponíveis)</option>
                    {membros.map((m) => (
                      <option key={m.id} value={m.id}>{m.nome_completo}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="w-full py-3 bg-blue-900 text-white font-bold text-xs rounded-xl">
                  Salvar Rede
                </button>
              </form>
            )}

            {/* FORMULÁRIO DO SETOR */}
            {subAba === 'setores' && (
              <form onSubmit={salvarSetor} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome do Setor *</label>
                  <input
                    type="text"
                    value={nomeSetor}
                    onChange={(e) => setNomeSetor(e.target.value)}
                    placeholder="Ex: Setor 01"
                    required
                    className="w-full border rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Rede Pertencente</label>
                  <select
                    value={redeSetorId}
                    onChange={(e) => setRedeSetorId(e.target.value)}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm"
                  >
                    <option value="">Nenhuma / Geral</option>
                    {redes.map((r) => (
                      <option key={r.id} value={r.id}>{r.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Líder do Setor</label>
                  <select
                    value={liderSetorId}
                    onChange={(e) => setLiderSetorId(e.target.value)}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm"
                  >
                    <option value="">Selecione um Membro ({membros.length} disponíveis)</option>
                    {membros.map((m) => (
                      <option key={m.id} value={m.id}>{m.nome_completo}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="w-full py-3 bg-blue-900 text-white font-bold text-xs rounded-xl">
                  Salvar Setor
                </button>
              </form>
            )}

            {/* FORMULÁRIO DA CÉLULA */}
            {subAba === 'celulas' && (
              <form onSubmit={salvarCelula} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome da Célula *</label>
                    <input
                      type="text"
                      value={nomeCelula}
                      onChange={(e) => setNomeCelula(e.target.value)}
                      placeholder="Ex: Célula Shalom"
                      required
                      className="w-full border rounded-xl px-4 py-2.5 text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Setor Pertencente</label>
                    <select
                      value={setorCelulaId}
                      onChange={(e) => setSetorCelulaId(e.target.value)}
                      className="w-full border rounded-xl px-4 py-2.5 text-sm"
                    >
                      <option value="">Selecione um Setor</option>
                      {setores.map((s) => (
                        <option key={s.id} value={s.id}>{s.nome}</option>
                      ))}
                    </select>
                  </div>

                  {/* LÍDER DA CÉLULA */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">👑 Líder</label>
                    <input
                      type="text"
                      placeholder="🔍 Filtrar nome..."
                      value={searchLider}
                      onChange={(e) => setSearchLider(e.target.value)}
                      className="w-full border rounded-t-xl px-3 py-1.5 text-xs bg-slate-50 focus:outline-none"
                    />
                    <select
                      value={liderCelulaId}
                      onChange={(e) => setLiderCelulaId(e.target.value)}
                      className="w-full border border-t-0 rounded-b-xl px-4 py-2 text-sm bg-white"
                    >
                      <option value="">Selecione o Líder ({membros.length} cadastrados)</option>
                      {membrosFiltradosLider.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nome_completo}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* VICE-LÍDER DA CÉLULA */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">🤝 Vice-Líder</label>
                    <input
                      type="text"
                      placeholder="🔍 Filtrar nome..."
                      value={searchVice}
                      onChange={(e) => setSearchVice(e.target.value)}
                      className="w-full border rounded-t-xl px-3 py-1.5 text-xs bg-slate-50 focus:outline-none"
                    />
                    <select
                      value={viceCelulaId}
                      onChange={(e) => setViceCelulaId(e.target.value)}
                      className="w-full border border-t-0 rounded-b-xl px-4 py-2 text-sm bg-white"
                    >
                      <option value="">Selecione o Vice-Líder ({membros.length} cadastrados)</option>
                      {membrosFiltradosVice.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nome_completo}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* ANFITRIÃO DA CÉLULA */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">🏠 Anfitrião</label>
                    <input
                      type="text"
                      placeholder="🔍 Filtrar nome..."
                      value={searchAnfitriao}
                      onChange={(e) => setSearchAnfitriao(e.target.value)}
                      className="w-full border rounded-t-xl px-3 py-1.5 text-xs bg-slate-50 focus:outline-none"
                    />
                    <select
                      value={anfitriaoCelulaId}
                      onChange={(e) => setAnfitriaoCelulaId(e.target.value)}
                      className="w-full border border-t-0 rounded-b-xl px-4 py-2 text-sm bg-white"
                    >
                      <option value="">Selecione o Anfitrião ({membros.length} cadastrados)</option>
                      {membrosFiltradosAnfitriao.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nome_completo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Dia da Semana</label>
                    <select
                      value={diaSemana}
                      onChange={(e) => setDiaSemana(e.target.value)}
                      className="w-full border rounded-xl px-4 py-2.5 text-sm"
                    >
                      <option value="Segunda-feira">Segunda-feira</option>
                      <option value="Terça-feira">Terça-feira</option>
                      <option value="Quarta-feira">Quarta-feira</option>
                      <option value="Quinta-feira">Quinta-feira</option>
                      <option value="Sexta-feira">Sexta-feira</option>
                      <option value="Sábado">Sábado</option>
                      <option value="Domingo">Domingo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Horário</label>
                    <input
                      type="text"
                      value={horario}
                      onChange={(e) => setHorario(e.target.value)}
                      placeholder="19:30"
                      className="w-full border rounded-xl px-4 py-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Rua / Logradouro</label>
                    <input
                      type="text"
                      value={rua}
                      onChange={(e) => setRua(e.target.value)}
                      placeholder="Rua..."
                      className="w-full border rounded-xl px-4 py-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Número</label>
                    <input
                      type="text"
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                      placeholder="123"
                      className="w-full border rounded-xl px-4 py-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Bairro</label>
                    <input
                      type="text"
                      value={bairro}
                      onChange={(e) => setBairro(e.target.value)}
                      placeholder="Bairro"
                      className="w-full border rounded-xl px-4 py-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cidade</label>
                    <input
                      type="text"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      placeholder="Cidade"
                      className="w-full border rounded-xl px-4 py-2.5 text-sm"
                    />
                  </div>
                </div>

                <button type="submit" className="w-full py-3 bg-blue-900 text-white font-bold text-xs rounded-xl hover:bg-blue-800 transition cursor-pointer">
                  Salvar Célula
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}