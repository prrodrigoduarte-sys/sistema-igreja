// src/DiscipuladoDEAModule.tsx

import React, { useEffect, useState, useCallback } from 'react';
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
}

export default function DiscipuladoDEAModule({ loggedUser }: Props) {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [vinculos, setVinculos] = useState<VinculoDEA[]>([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');

  // Modais
  const [modalNovoVinculo, setModalNovoVinculo] = useState(false);
  const [modalEncontros, setModalEncontros] = useState(false);
  const [modalEditarVinculo, setModalEditarVinculo] = useState(false);

  // Form Vínculo (Múltiplos Discípulos)
  const [discipuladorId, setDiscipuladorId] = useState('');
  const [discipulosSelecionados, setDiscipulosSelecionados] = useState<string[]>([]);
  const [diaReuniao, setDiaReuniao] = useState('Segunda-feira');

  // Form Edição de Vínculo
  const [vinculoEdicao, setVinculoEdicao] = useState<VinculoDEA | null>(null);

  // Form Encontros / Agenda
  const [selectedVinculo, setSelectedVinculo] = useState<VinculoDEA | null>(null);
  const [listaEncontros, setListaEncontros] = useState<EncontroDEA[]>([]);
  const [novaData, setNovaData] = useState(new Date().toISOString().split('T')[0]);
  const [novaHora, setNovaHora] = useState('19:30');
  const [novoAssunto, setNovoAssunto] = useState('');
  const [novoComentario, setNovoComentario] = useState('');

  const codigoIgreja = loggedUser?.codigo_igreja || 'IGR-001';

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const { data: dataMembros } = await supabase
        .from('members')
        .select('id, nome, celular_principal')
        .eq('codigo_igreja', codigoIgreja)
        .order('nome', { ascending: true });

      if (dataMembros) setMembros(dataMembros);

      const { data: dataDEA } = await supabase
        .from('discipulado_dea')
        .select('*')
        .eq('codigo_igreja', codigoIgreja)
        .order('id', { ascending: false });

      if (dataDEA && dataMembros) {
        const enriquecidos = dataDEA.map((v: any) => ({
          ...v,
          encontros: Array.isArray(v.encontros) ? v.encontros : [],
          discipulador: dataMembros.find((m) => String(m.id) === String(v.discipulador_id)),
          discipulando: dataMembros.find((m) => String(m.id) === String(v.discipulando_id)),
        }));
        setVinculos(enriquecidos);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [codigoIgreja]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Alternar seleção de discípulos (múltipla escolha)
  const toggleDiscipulo = (id: string) => {
    if (discipulosSelecionados.includes(id)) {
      setDiscipulosSelecionados(discipulosSelecionados.filter((item) => item !== id));
    } else {
      setDiscipulosSelecionados([...discipulosSelecionados, id]);
    }
  };

  // Salvar Novo Discipulado (para um ou mais discípulos selecionados)
  const handleSalvarVinculo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discipuladorId) return alert('Selecione o Discipulador.');
    if (discipulosSelecionados.length === 0) return alert('Selecione ao menos um Discípulo.');

    if (discipulosSelecionados.includes(discipuladorId)) {
      return alert('O discipulador não pode ser adicionado como seu próprio discípulo.');
    }

    try {
      const novosRegistros = discipulosSelecionados.map((dId) => ({
        codigo_igreja: codigoIgreja,
        discipulador_id: discipuladorId,
        discipulando_id: dId,
        dia_reuniao: diaReuniao,
        status: 'Ativo',
        encontros: [],
      }));

      const { error } = await supabase.from('discipulado_dea').insert(novosRegistros);

      if (error) throw error;

      alert('🌱 Discipulado(s) cadastrado(s) com sucesso!');
      setModalNovoVinculo(false);
      setDiscipuladorId('');
      setDiscipulosSelecionados([]);
      carregarDados();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Salvar Edição do Vínculo
  const handleSalvarEdicaoVinculo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vinculoEdicao) return;

    try {
      const { error } = await supabase
        .from('discipulado_dea')
        .update({
          discipulador_id: vinculoEdicao.discipulador_id,
          discipulando_id: vinculoEdicao.discipulando_id,
          dia_reuniao: vinculoEdicao.dia_reuniao,
        })
        .eq('id', vinculoEdicao.id);

      if (error) throw error;

      alert('Vínculo atualizado!');
      setModalEditarVinculo(false);
      setVinculoEdicao(null);
      carregarDados();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Agendamento / Registro de Encontro com Data, Hora e Comentários
  const abrirModalEncontros = (v: VinculoDEA) => {
    setSelectedVinculo(v);
    setListaEncontros(v.encontros || []);
    setNovoAssunto('');
    setNovoComentario('');
    setModalEncontros(true);
  };

  const handleAdicionarEncontro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVinculo || !novoAssunto.trim()) return alert('Informe o assunto/pauta do encontro.');

    const novoItem: EncontroDEA = {
      id: Date.now(),
      data_encontro: novaData,
      hora_encontro: novaHora,
      assunto_tratado: novoAssunto.trim(),
      comentarios: novoComentario.trim(),
    };

    const novaLista = [novoItem, ...listaEncontros];

    try {
      const { error } = await supabase
        .from('discipulado_dea')
        .update({ encontros: novaLista })
        .eq('id', selectedVinculo.id);

      if (error) throw error;

      setListaEncontros(novaLista);
      setNovoAssunto('');
      setNovoComentario('');
      carregarDados();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExcluirEncontro = async (idEncontro: number) => {
    if (!selectedVinculo || !window.confirm('Deseja excluir este registro de agenda/encontro?')) return;
    const novaLista = listaEncontros.filter((e) => e.id !== idEncontro);

    try {
      await supabase.from('discipulado_dea').update({ encontros: novaLista }).eq('id', selectedVinculo.id);
      setListaEncontros(novaLista);
      carregarDados();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExcluirVinculo = async (id: any) => {
    if (!window.confirm('Deseja realmente remover este vínculo de discipulado?')) return;
    try {
      await supabase.from('discipulado_dea').delete().eq('id', id);
      carregarDados();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filtragem e Agrupamento por Discipulador
  const vinculosFiltrados = vinculos.filter(
    (v) =>
      (v.discipulador?.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
      (v.discipulando?.nome || '').toLowerCase().includes(busca.toLowerCase())
  );

  const gruposAgrupados: GroupedDiscipulado[] = React.useMemo(() => {
    const mapa = new Map<string, GroupedDiscipulado>();

    vinculosFiltrados.forEach((v) => {
      const key = String(v.discipulador_id);
      if (!mapa.has(key)) {
        mapa.set(key, {
          discipulador_id: v.discipulador_id,
          discipulador: v.discipulador || { id: v.discipulador_id, nome: 'Desconhecido' },
          totalDiscipulos: 0,
          vinculos: [],
        });
      }
      const g = mapa.get(key)!;
      g.totalDiscipulos += 1;
      g.vinculos.push(v);
    });

    return Array.from(mapa.values());
  }, [vinculosFiltrados]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-6xl mx-auto space-y-6">
      {/* CABEÇALHO D.E.A. / G.U.I. */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-3xl font-black text-blue-900 tracking-tight">🌱 D.E.A. / G.U.I.</h2>
          <p className="text-sm text-slate-600 mt-1">
            Gestão de Discipulado (Total de Vínculos: <span className="font-bold text-blue-900">{vinculos.length}</span>)
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setDiscipuladorId('');
            setDiscipulosSelecionados([]);
            setModalNovoVinculo(true);
          }}
          className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
        >
          ➕ Novo Discipulado (Múltiplos Discípulos)
        </button>
      </div>

      <input
        type="text"
        placeholder="🔎 Buscar por líder ou discípulo..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="w-full sm:w-80 border rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-600"
      />

      {loading ? (
        <p className="text-center py-8 text-slate-500 text-xs">Carregando discipulados...</p>
      ) : gruposAgrupados.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed text-slate-500 text-xs">
          Nenhum vínculo de discipulado cadastrado.
        </div>
      ) : (
        /* COMPOSIÇÃO DE MÓDULO AGRUPADO POR DISCIPULADOR */
        <div className="space-y-6">
          {gruposAgrupados.map((grupo) => (
            <div key={grupo.discipulador_id} className="border border-slate-200 rounded-2xl bg-slate-50 p-5 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-3 border-slate-200 gap-2">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-900 text-white p-2.5 rounded-xl text-lg font-black">👤</div>
                  <div>
                    <h3 className="font-black text-blue-900 text-base">{grupo.discipulador?.nome}</h3>
                    <p className="text-xs text-slate-500">Discipulador / Líder</p>
                  </div>
                </div>
                <span className="bg-blue-100 text-blue-900 font-black text-xs px-3 py-1 rounded-xl">
                  Total de Discípulos: {grupo.totalDiscipulos}
                </span>
              </div>

              {/* LISTA DOS DISCÍPULOS DO DISCIPULADOR */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {grupo.vinculos.map((v) => (
                  <div key={v.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Discípulo</span>
                        <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded">
                          {v.dia_reuniao || 'Sem dia fixo'}
                        </span>
                      </div>
                      <p className="font-bold text-emerald-800 text-sm">{v.discipulando?.nome || 'Não informado'}</p>
                      <p className="text-[11px] text-slate-500">📞 {v.discipulando?.celular_principal || 'Sem contato'}</p>
                    </div>

                    <div className="border-t pt-2 space-y-2">
                      <button
                        type="button"
                        onClick={() => abrirModalEncontros(v)}
                        className="w-full py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-lg transition cursor-pointer"
                      >
                        📅 Agenda / Encontros ({(v.encontros || []).length})
                      </button>

                      <div className="flex gap-2 justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setVinculoEdicao(v);
                            setModalEditarVinculo(true);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExcluirVinculo(v.id)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg cursor-pointer"
                        >
                          🗑️ Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: NOVO VÍNCULO COM SELEÇÃO MÚLTIPLA DE DISCÍPULOS */}
      {modalNovoVinculo && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 space-y-4 my-8 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-3 shrink-0">
              <h3 className="text-lg font-black text-blue-900">Novo Vínculo de Discipulado</h3>
              <button
                type="button"
                onClick={() => setModalNovoVinculo(false)}
                className="text-xs font-bold text-slate-500 hover:text-rose-600 cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleSalvarVinculo} className="space-y-4 text-xs flex-1 overflow-y-auto pr-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1">1. Discipulador (Líder / Mestre)</label>
                <select
                  value={discipuladorId}
                  onChange={(e) => setDiscipuladorId(e.target.value)}
                  className="w-full border rounded-xl p-2.5 bg-white font-bold text-slate-800"
                  required
                >
                  <option value="">Selecione o Discipulador...</option>
                  {membros.map((m) => (
                    <option key={m.id} value={m.id}>
                      👤 {m.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  2. Selecione o(s) Discípulo(s) ({discipulosSelecionados.length} selecionado(s))
                </label>
                <div className="border rounded-xl p-3 max-h-48 overflow-y-auto space-y-1.5 bg-slate-50">
                  {membros
                    .filter((m) => String(m.id) !== String(discipuladorId))
                    .map((m) => (
                      <label
                        key={m.id}
                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={discipulosSelecionados.includes(String(m.id))}
                          onChange={() => toggleDiscipulo(String(m.id))}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-semibold text-slate-800">{m.nome}</span>
                      </label>
                    ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Dia Regular do Encontro</label>
                <select
                  value={diaReuniao}
                  onChange={(e) => setDiaReuniao(e.target.value)}
                  className="w-full border rounded-xl p-2.5 bg-white"
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

              <button
                type="submit"
                className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer shrink-0"
              >
                ⚡ Salvar Discipulado
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIÇÃO DE VÍNCULO */}
      {modalEditarVinculo && vinculoEdicao && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-blue-900">Editar Discipulado</h3>
              <button
                type="button"
                onClick={() => setModalEditarVinculo(false)}
                className="text-xs font-bold text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarEdicaoVinculo} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Discipulador</label>
                <select
                  value={vinculoEdicao.discipulador_id}
                  onChange={(e) => setVinculoEdicao({ ...vinculoEdicao, discipulador_id: e.target.value })}
                  className="w-full border rounded-xl p-2.5"
                  required
                >
                  {membros.map((m) => (
                    <option key={m.id} value={m.id}>
                      👤 {m.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Discípulo</label>
                <select
                  value={vinculoEdicao.discipulando_id}
                  onChange={(e) => setVinculoEdicao({ ...vinculoEdicao, discipulando_id: e.target.value })}
                  className="w-full border rounded-xl p-2.5"
                  required
                >
                  {membros.map((m) => (
                    <option key={m.id} value={m.id}>
                      🌱 {m.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Dia Regular do Encontro</label>
                <select
                  value={vinculoEdicao.dia_reuniao || 'Segunda-feira'}
                  onChange={(e) => setVinculoEdicao({ ...vinculoEdicao, dia_reuniao: e.target.value })}
                  className="w-full border rounded-xl p-2.5"
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

              <div className="pt-2 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setModalEditarVinculo(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 text-white font-bold rounded-xl cursor-pointer"
                >
                  💾 Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: AGENDA E ENCONTROS COM DATA, HORA E COMENTÁRIOS */}
      {modalEncontros && selectedVinculo && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-3 shrink-0">
              <div>
                <h3 className="text-lg font-black text-blue-900">Agenda & Registro de Encontros</h3>
                <p className="text-xs text-slate-500">
                  Líder: <strong>{selectedVinculo.discipulador?.nome}</strong> ➔ Discípulo:{' '}
                  <strong>{selectedVinculo.discipulando?.nome}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalEncontros(false)}
                className="text-xs font-bold text-slate-500 hover:text-rose-600 cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            {/* FORMULÁRIO DE REGISTRO / AGENDAMENTO */}
            <form onSubmit={handleAdicionarEncontro} className="bg-slate-50 p-4 rounded-2xl space-y-3 text-xs border shrink-0">
              <h4 className="font-bold text-blue-900 uppercase">📅 Registrar Novo Encontro</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Data</label>
                  <input
                    type="date"
                    value={novaData}
                    onChange={(e) => setNovaData(e.target.value)}
                    className="w-full border rounded-xl p-2 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Hora</label>
                  <input
                    type="time"
                    value={novaHora}
                    onChange={(e) => setNovaHora(e.target.value)}
                    className="w-full border rounded-xl p-2 bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Assunto Tratado / Pauta</label>
                <input
                  type="text"
                  placeholder="Ex: Estudo da Lição 02, Oração e Alinhamento..."
                  value={novoAssunto}
                  onChange={(e) => setNovoAssunto(e.target.value)}
                  className="w-full border rounded-xl p-2 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Comentários e Observações</label>
                <textarea
                  placeholder="Digite os comentários do encontro, pedidos de oração ou próximos passos..."
                  value={novoComentario}
                  onChange={(e) => setNovoComentario(e.target.value)}
                  className="w-full border rounded-xl p-2 bg-white"
                  rows={2}
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow transition cursor-pointer"
              >
                ⚡ Agendar / Salvar Encontro
              </button>
            </form>

            {/* HISTÓRICO ROLANTE DE ENCONTROS */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <h4 className="font-bold text-xs text-slate-500 uppercase pt-2">Histórico de Encontros ({listaEncontros.length})</h4>
              {listaEncontros.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center border border-dashed rounded-xl">
                  Nenhum encontro registrado para este discípulo.
                </p>
              ) : (
                listaEncontros.map((item, idx) => (
                  <div key={item.id} className="bg-white border p-3 rounded-xl space-y-1.5 text-xs shadow-sm">
                    <div className="flex justify-between items-center border-b pb-1 font-bold text-blue-900">
                      <span>
                        #{listaEncontros.length - idx} • 📅 {item.data_encontro?.split('-').reverse().join('/')} às ⏰ {item.hora_encontro}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleExcluirEncontro(item.id)}
                        className="text-rose-600 hover:bg-rose-50 px-2 py-0.5 rounded cursor-pointer font-bold"
                      >
                        🗑️
                      </button>
                    </div>
                    <p className="text-slate-800">
                      📘 <strong>Pauta:</strong> {item.assunto_tratado}
                    </p>
                    {item.comentarios && (
                      <div className="text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        💬 <strong>Comentários:</strong> {item.comentarios}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}