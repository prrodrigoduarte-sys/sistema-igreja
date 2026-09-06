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
  activeTab?: string;
}

export default function DiscipuladoDEAModule({ loggedUser, activeTab = 'discipulado-dea' }: Props) {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [vinculos, setVinculos] = useState<VinculoDEA[]>([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');

  // Modais
  const [modalNovoVinculo, setModalNovoVinculo] = useState(false);
  const [modalEncontrosIndividuais, setModalEncontrosIndividuais] = useState(false);
  const [modalEncontroGrupo, setModalEncontroGrupo] = useState(false);
  const [modalEditarVinculo, setModalEditarVinculo] = useState(false);

  // Form Vínculo
  const [discipuladorId, setDiscipuladorId] = useState('');
  const [discipulosSelecionados, setDiscipulosSelecionados] = useState<string[]>([]);
  const [diaReuniao, setDiaReuniao] = useState('Segunda-feira');

  // Form Agendamento em Grupo
  const [grupoSelecionado, setGrupoSelecionado] = useState<GroupedDiscipulado | null>(null);
  const [dataGrupo, setDataGrupo] = useState(new Date().toISOString().split('T')[0]);
  const [horaGrupo, setHoraGrupo] = useState('19:30');
  const [assuntoGrupo, setAssuntoGrupo] = useState('');
  const [comentarioGrupo, setComentarioGrupo] = useState('');

  // Form Edição
  const [vinculoEdicao, setVinculoEdicao] = useState<VinculoDEA | null>(null);

  // Form Agenda Individual
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

  const toggleDiscipulo = (id: string) => {
    if (discipulosSelecionados.includes(id)) {
      setDiscipulosSelecionados(discipulosSelecionados.filter((item) => item !== id));
    } else {
      setDiscipulosSelecionados([...discipulosSelecionados, id]);
    }
  };

  const handleSalvarVinculo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discipuladorId) return alert('Selecione o Discipulador.');
    if (discipulosSelecionados.length === 0) return alert('Selecione ao menos um Discípulo.');

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

    try {
      const promessas = grupoSelecionado.vinculos.map((v) => {
        const historicoAtual = v.encontros || [];
        const novoHistorico = [novoEncontro, ...historicoAtual];
        return supabase.from('discipulado_dea').update({ encontros: novoHistorico }).eq('id', v.id);
      });

      await Promise.all(promessas);
      alert(`⚡ Encontro agendado para os ${grupoSelecionado.totalDiscipulos} discípulos!`);
      setModalEncontroGrupo(false);
      setGrupoSelecionado(null);
      carregarDados();
    } catch (err: any) {
      alert(err.message);
    }
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

  const handleExcluirVinculo = async (id: any) => {
    if (!window.confirm('Deseja realmente excluir este discípulo do líder?')) return;
    try {
      await supabase.from('discipulado_dea').delete().eq('id', id);
      carregarDados();
    } catch (err: any) {
      alert(err.message);
    }
  };

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

  const todosEncontrosGeral = React.useMemo(() => {
    const lista: {
      idUnico: string;
      data: string;
      hora: string;
      assunto: string;
      comentarios: string;
      discipulador: string;
      discipulo: string;
    }[] = [];

    vinculos.forEach((v) => {
      (v.encontros || []).forEach((e) => {
        lista.push({
          idUnico: `${v.id}-${e.id}`,
          data: e.data_encontro,
          hora: e.hora_encontro,
          assunto: e.assunto_tratado,
          comentarios: e.comentarios,
          discipulador: v.discipulador?.nome || 'Não informado',
          discipulo: v.discipulando?.nome || 'Não informado',
        });
      });
    });

    return lista.sort((a, b) => b.data.localeCompare(a.data));
  }, [vinculos]);

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
            Gestão Integrada de Discipulado e Agenda de Encontros
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
          ➕ Novo Discipulado (Líder + Discípulos)
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
                        <h3 className="font-black text-blue-900 text-base">{grupo.discipulador?.nome}</h3>
                        <p className="text-xs text-slate-500">Discipulador / Líder</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="bg-blue-100 text-blue-900 font-black text-xs px-3 py-1.5 rounded-xl">
                        Total de Discípulos: {grupo.totalDiscipulos}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setGrupoSelecionado(grupo);
                          setModalEncontroGrupo(true);
                        }}
                        className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                      >
                        📅 Agendar para Todos ({grupo.totalDiscipulos})
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {grupo.vinculos.map((v) => (
                      <div key={v.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                        <div>
                          <p className="font-bold text-emerald-800 text-sm">{v.discipulando?.nome}</p>
                          <p className="text-xs text-slate-500">📞 {v.discipulando?.celular_principal || 'Sem contato'}</p>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVinculo(v);
                            setListaEncontros(v.encontros || []);
                            setModalEncontrosIndividuais(true);
                          }}
                          className="w-full py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-lg cursor-pointer"
                        >
                          📅 Agenda Individual ({(v.encontros || []).length})
                        </button>

                        <div className="flex gap-2 justify-end pt-1 border-t">
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
                    ))}
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
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-black text-blue-900 text-base">👤 Líder: {grupo.discipulador?.nome}</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setGrupoSelecionado(grupo);
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
                        <p className="font-bold text-slate-800 text-xs">🌱 Discípulo: {v.discipulando?.nome}</p>
                        <p className="text-[11px] text-slate-500">
                          Encontros Registrados: <strong>{(v.encontros || []).length}</strong>
                        </p>
                        {(v.encontros || []).map((e, idx) => (
                          <div key={idx} className="bg-slate-50 p-2 border rounded-lg text-xs space-y-0.5">
                            <span className="font-bold text-blue-900">
                              📅 {e.data_encontro?.split('-').reverse().join('/')} às {e.hora_encontro}
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
          {activeTab === 'discipulado-agenda-geral' && (
            <div className="space-y-3">
              <h3 className="font-bold text-slate-700 text-sm">Cronograma Geral de Encontros ({todosEncontrosGeral.length})</h3>
              {todosEncontrosGeral.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed rounded-2xl text-xs text-slate-500">
                  Nenhum encontro registrado na agenda geral.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
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
                        <tr key={e.idUnico} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-blue-900 whitespace-nowrap">
                            📅 {e.data?.split('-').reverse().join('/')} <br />
                            ⏰ {e.hora}
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

      {/* MODAIS */}
      {modalEncontroGrupo && grupoSelecionado && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-blue-900">Agendar Encontro em Grupo</h3>
              <button type="button" onClick={() => setModalEncontroGrupo(false)} className="text-xs font-bold text-slate-500">
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleSalvarEncontroGrupo} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data</label>
                  <input
                    type="date"
                    value={dataGrupo}
                    onChange={(e) => setDataGrupo(e.target.value)}
                    className="w-full border rounded-xl p-2.5 bg-white font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hora</label>
                  <input
                    type="time"
                    value={horaGrupo}
                    onChange={(e) => setHoraGrupo(e.target.value)}
                    className="w-full border rounded-xl p-2.5 bg-white font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assunto / Pauta *</label>
                <input
                  type="text"
                  placeholder="Ex: Estudo capítulo 3..."
                  value={assuntoGrupo}
                  onChange={(e) => setAssuntoGrupo(e.target.value)}
                  className="w-full border rounded-xl p-2.5 font-bold text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Comentários</label>
                <textarea
                  placeholder="Observações do encontro..."
                  value={comentarioGrupo}
                  onChange={(e) => setComentarioGrupo(e.target.value)}
                  className="w-full border rounded-xl p-2.5"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
              >
                ⚡ Replicar para os {grupoSelecionado.totalDiscipulos} Discípulos
              </button>
            </form>
          </div>
        </div>
      )}

      {modalNovoVinculo && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 space-y-4 my-8">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-blue-900">Novo Vínculo de Discipulado</h3>
              <button type="button" onClick={() => setModalNovoVinculo(false)} className="text-xs font-bold text-slate-500">
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleSalvarVinculo} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">1. Discipulador</label>
                <select
                  value={discipuladorId}
                  onChange={(e) => setDiscipuladorId(e.target.value)}
                  className="w-full border rounded-xl p-2.5 bg-white font-bold"
                  required
                >
                  <option value="">Selecione...</option>
                  {membros.map((m) => (
                    <option key={m.id} value={m.id}>
                      👤 {m.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">2. Discípulos ({discipulosSelecionados.length})</label>
                <div className="border rounded-xl p-3 max-h-40 overflow-y-auto space-y-1.5 bg-slate-50">
                  {membros
                    .filter((m) => String(m.id) !== String(discipuladorId))
                    .map((m) => (
                      <label key={m.id} className="flex items-center gap-2 p-1 rounded hover:bg-white cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={discipulosSelecionados.includes(String(m.id))}
                          onChange={() => toggleDiscipulo(String(m.id))}
                        />
                        <span className="font-semibold text-slate-800">{m.nome}</span>
                      </label>
                    ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">3. Dia Regular do Encontro</label>
                <select value={diaReuniao} onChange={(e) => setDiaReuniao(e.target.value)} className="w-full border rounded-xl p-2.5 bg-white">
                  <option value="Segunda-feira">Segunda-feira</option>
                  <option value="Terça-feira">Terça-feira</option>
                  <option value="Quarta-feira">Quarta-feira</option>
                  <option value="Quinta-feira">Quinta-feira</option>
                  <option value="Sexta-feira">Sexta-feira</option>
                  <option value="Sábado">Sábado</option>
                  <option value="Domingo">Domingo</option>
                </select>
              </div>

              <button type="submit" className="w-full py-3 bg-blue-900 text-white font-bold text-xs rounded-xl cursor-pointer">
                ⚡ Salvar Discipulado
              </button>
            </form>
          </div>
        </div>
      )}

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

      {modalEncontrosIndividuais && selectedVinculo && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-3 shrink-0">
              <h3 className="text-lg font-black text-blue-900">
                Agenda Individual: {selectedVinculo.discipuando?.nome}
              </h3>
              <button type="button" onClick={() => setModalEncontrosIndividuais(false)} className="text-xs font-bold text-slate-500">
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleAdicionarEncontroIndividual} className="bg-slate-50 p-4 rounded-2xl space-y-3 text-xs border shrink-0">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Data</label>
                  <input type="date" value={novaData} onChange={(e) => setNovaData(e.target.value)} className="w-full border rounded-xl p-2 bg-white" required />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Hora</label>
                  <input type="time" value={novaHora} onChange={(e) => setNovaHora(e.target.value)} className="w-full border rounded-xl p-2 bg-white" required />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Assunto Tratado</label>
                <input type="text" value={novoAssunto} onChange={(e) => setNovoAssunto(e.target.value)} className="w-full border rounded-xl p-2 bg-white" required />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Comentários</label>
                <textarea value={novoComentario} onChange={(e) => setNovoComentario(e.target.value)} className="w-full border rounded-xl p-2 bg-white" rows={2} />
              </div>

              <button type="submit" className="w-full py-2.5 bg-blue-900 text-white font-bold rounded-xl shadow cursor-pointer">
                ⚡ Agendar Encontro
              </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {listaEncontros.map((item, idx) => (
                <div key={item.id} className="bg-white border p-3 rounded-xl space-y-1 text-xs shadow-sm">
                  <span className="font-bold text-blue-900">
                    #{listaEncontros.length - idx} • 📅 {item.data_encontro?.split('-').reverse().join('/')} às ⏰ {item.hora_encontro}
                  </span>
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