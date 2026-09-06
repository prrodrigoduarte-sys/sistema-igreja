// 1. Adicione esta importação no topo do src/App.tsx:
import DiscipuladoDEAModule from './DiscipuladoDEAModule';

// 2. Substitua o bloco de renderização do canal principal (por volta da linha 480):
// DE:
// {(activeTab === 'celulas' || activeTab === 'celulas-modulo') && (
//   <CelulasModule loggedUser={loggedUser} subAbaInicial={subAbaCelulas} />
// )}

// PARA:
{(activeTab === 'celulas' || activeTab === 'celulas-modulo') && (
  subAbaCelulas === 'dea' ? (
    <DiscipuladoDEAModule loggedUser={loggedUser} />
  ) : (
    <CelulasModule loggedUser={loggedUser} subAbaInicial={subAbaCelulas} />
  )
)}
// src/DiscipuladoDEAModule.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

interface Membro {
  id: any;
  nome: string;
  celular_principal?: string;
  foto_url?: string;
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
  observacoes?: string;
  encontros?: EncontroDEA[];
  discipulador?: Membro;
  discipulando?: Membro;
}

interface TreeNode {
  membro: Membro;
  discipulandos: TreeNode[];
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
  const [modalNovoVinculoOpen, setModalNovoVinculoOpen] = useState(false);
  const [modalEncontrosOpen, setModalEncontrosOpen] = useState(false);

  // Form Vínculo
  const [discipuladorId, setDiscipuladorId] = useState('');
  const [discipulandoId, setDiscipulandoId] = useState('');
  const [diaReuniao, setDiaReuniao] = useState('Segunda-feira');

  // Encontros / Discipulado Selecionado
  const [selectedVinculo, setSelectedVinculo] = useState<VinculoDEA | null>(null);
  const [listaEncontros, setListaEncontros] = useState<EncontroDEA[]>([]);

  // Novo Encontro Form
  const [novaData, setNovaData] = useState(new Date().toISOString().split('T')[0]);
  const [novaHora, setNovaHora] = useState('19:30');
  const [novoAssunto, setNovoAssunto] = useState('');
  const [novoComentario, setNovoComentario] = useState('');

  const codigoIgreja = loggedUser?.codigo_igreja || 'IGR-001';

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Carregar Membros
      const { data: dataMembros } = await supabase
        .from('members')
        .select('id, nome, celular_principal, foto_url')
        .eq('codigo_igreja', codigoIgreja)
        .order('nome', { ascending: true });

      if (dataMembros) setMembros(dataMembros);

      // 2. Carregar Vínculos
      const { data: dataDEA } = await supabase
        .from('discipulado_dea')
        .select('*')
        .eq('codigo_igreja', codigoIgreja)
        .order('id', { ascending: false });

      if (dataDEA && dataMembros) {
        const enriquecidos = dataDEA.map((v: any) => {
          let enco: EncontroDEA[] = [];
          if (Array.isArray(v.encontros)) {
            enco = v.encontros;
          } else if (typeof v.encontros === 'string') {
            try {
              enco = JSON.parse(v.encontros);
            } catch (e) {
              enco = [];
            }
          }

          return {
            ...v,
            encontros: enco,
            discipulador: dataMembros.find((m) => String(m.id) === String(v.discipulador_id)),
            discipulando: dataMembros.find((m) => String(m.id) === String(v.discipulando_id)),
          };
        });
        setVinculos(enriquecidos);
      }
    } catch (err) {
      console.error('Erro ao carregar D.E.A. / G.U.I.:', err);
    } finally {
      setLoading(false);
    }
  }, [codigoIgreja]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleSalvarVinculo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discipuladorId || !discipulandoId) {
      alert('Selecione o Discipulador e o Discípulo.');
      return;
    }

    if (discipuladorId === discipulandoId) {
      alert('O discipulador e o discípulo não podem ser a mesma pessoa.');
      return;
    }

    try {
      const payload = {
        codigo_igreja: codigoIgreja,
        discipulador_id: discipuladorId,
        discipulando_id: discipulandoId,
        dia_reuniao: diaReuniao,
        status: 'Ativo',
        encontros: [],
      };

      const { error } = await supabase.from('discipulado_dea').insert([payload]);

      if (error) throw error;

      alert('🌱 Vínculo de Discipulado criado com sucesso!');
      setModalNovoVinculoOpen(false);
      setDiscipuladorId('');
      setDiscipulandoId('');
      carregarDados();
    } catch (err: any) {
      alert('Erro ao vincular: ' + err.message);
    }
  };

  const abrirModalEncontros = (v: VinculoDEA) => {
    setSelectedVinculo(v);
    setListaEncontros(v.encontros || []);
    setNovoAssunto('');
    setNovoComentario('');
    setNovaData(new Date().toISOString().split('T')[0]);
    setNovaHora('19:30');
    setModalEncontrosOpen(true);
  };

  const handleAdicionarProximoEncontro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVinculo) return;

    if (!novoAssunto.trim()) {
      alert('Informe o assunto que foi tratado no encontro.');
      return;
    }

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

      alert('⚡ Novo encontro registrado!');
      setListaEncontros(novaLista);
      setNovoAssunto('');
      setNovoComentario('');
      carregarDados();
    } catch (err: any) {
      alert('Erro ao salvar encontro: ' + err.message);
    }
  };

  const handleExcluirEncontro = async (idEncontro: number) => {
    if (!selectedVinculo) return;
    if (!window.confirm('Excluir este registro de encontro?')) return;

    const novaLista = listaEncontros.filter((e) => e.id !== idEncontro);

    try {
      const { error } = await supabase
        .from('discipulado_dea')
        .update({ encontros: novaLista })
        .eq('id', selectedVinculo.id);

      if (error) throw error;

      setListaEncontros(novaLista);
      carregarDados();
    } catch (err: any) {
      alert('Erro ao excluir registro: ' + err.message);
    }
  };

  const handleExcluirVinculo = async (idVinculo: any) => {
    if (!window.confirm('Excluir este vínculo de discipulado completo?')) return;

    try {
      const { error } = await supabase.from('discipulado_dea').delete().eq('id', idVinculo);
      if (error) throw error;

      alert('Vínculo excluído.');
      carregarDados();
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  // Montagem Recursiva da Árvore Genealógica Espiritual
  const montarArvore = (): TreeNode[] => {
    const discipulandosIds = new Set(vinculos.map((v) => String(v.discipulando_id)));

    const raizes = membros.filter(
      (m) =>
        vinculos.some((v) => String(v.discipulador_id) === String(m.id)) &&
        !discipulandosIds.has(String(m.id))
    );

    const construirNos = (membro: Membro): TreeNode => {
      const filhosVinculos = vinculos.filter(
        (v) => String(v.discipulador_id) === String(membro.id)
      );

      const discipulandos = filhosVinculos
        .map((v) => v.discipulando)
        .filter(Boolean) as Membro[];

      return {
        membro,
        discipulandos: discipulandos.map((d) => construirNos(d)),
      };
    };

    return raizes.map((r) => construirNos(r));
  };

  const arvoreGenealogica = montarArvore();

  const filtrados = vinculos.filter(
    (v) =>
      (v.discipulador?.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
      (v.discipulando?.nome || '').toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 w-full max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-blue-900 tracking-tight flex items-center gap-2">
            🌱 D.E.A. / G.U.I.
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            D.E.A. (Discipulado Evangelístico Apostólico) / G.U.I. (Gerando uma Identidade) • ({codigoIgreja})
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalNovoVinculoOpen(true)}
          className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer shrink-0"
        >
          ➕ Novo Vínculo (Líder ➔ Discípulo)
        </button>
      </div>

      <div className="flex justify-between items-center">
        <input
          type="text"
          placeholder="🔎 Buscar por líder ou discípulo..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full sm:w-64 border rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
        />
      </div>

      {loading && <p className="text-center py-6 text-slate-500 text-xs">Carregando discipulados...</p>}

      {!loading && (
        <div className="space-y-8">
          {/* ÁRVORE GENEALÓGICA */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4">
            <h3 className="text-lg font-black text-blue-900 flex items-center gap-2">
              🌳 Árvore Genealógica de Discipulado
            </h3>

            {arvoreGenealogica.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                Nenhum vínculo de discipulado registrado. Clique no botão acima para iniciar.
              </p>
            ) : (
              <div className="overflow-x-auto py-2">
                <div className="flex flex-col gap-6">
                  {arvoreGenealogica.map((node) => (
                    <TreeNodeRender key={node.membro.id} node={node} nivel={0} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* LISTA DE VÍNCULOS E REGISTRO DE ENCONTROS */}
          <div className="space-y-3">
            <h3 className="text-md font-bold text-slate-800">📋 Duplas de Discipulado ({filtrados.length})</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtrados.map((v) => {
                const totalEncontros = (v.encontros || []).length;
                return (
                  <div key={v.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between hover:bg-white hover:shadow-md transition">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start border-b pb-2">
                        <span className="text-[10px] font-black uppercase text-blue-900 bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200">
                          📅 {v.dia_reuniao || 'Encontro Regular'}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleExcluirVinculo(v.id)}
                          className="text-rose-600 hover:text-rose-800 text-xs font-bold cursor-pointer"
                          title="Excluir Vínculo"
                        >
                          🗑️
                        </button>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase">Discipulador / Mestre</span>
                          <p className="font-bold text-blue-900 text-sm">{v.discipulador?.nome || 'Líder não encontrado'}</p>
                        </div>

                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase">Discípulo</span>
                          <p className="font-bold text-emerald-800 text-sm">{v.discipulando?.nome || 'Discípulo não encontrado'}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-600">Encontros Realizados:</span>
                        <span className="bg-indigo-100 text-indigo-900 font-black text-xs px-2.5 py-0.5 rounded-lg border border-indigo-200">
                          {totalEncontros} registrados
                        </span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => abrirModalEncontros(v)}
                        className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                      >
                        📖 Registrar & Ver Encontros ({totalEncontros})
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CRIAR NOVO VÍNCULO */}
      {modalNovoVinculoOpen && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 my-8">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-xl font-black text-blue-900">Novo Vínculo D.E.A. / G.U.I.</h3>
              <button
                type="button"
                onClick={() => setModalNovoVinculoOpen(false)}
                className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleSalvarVinculo} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  1. Discipulador (Líder / Mestre) *
                </label>
                <select
                  value={discipuladorId}
                  onChange={(e) => setDiscipuladorId(e.target.value)}
                  className="w-full border rounded-xl p-3 bg-white font-bold text-blue-900"
                  required
                >
                  <option value="">Selecione o discipulador...</option>
                  {membros.map((m) => (
                    <option key={m.id} value={m.id}>
                      👤 {m.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  2. Discípulo *
                </label>
                <select
                  value={discipulandoId}
                  onChange={(e) => setDiscipulandoId(e.target.value)}
                  className="w-full border rounded-xl p-3 bg-white font-bold text-emerald-900"
                  required
                >
                  <option value="">Selecione o discípulo...</option>
                  {membros.map((m) => (
                    <option key={m.id} value={m.id}>
                      🌱 {m.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Dia Fixo do Encontro
                </label>
                <select
                  value={diaReuniao}
                  onChange={(e) => setDiaReuniao(e.target.value)}
                  className="w-full border rounded-xl p-3 bg-white"
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

              <div className="border-t pt-4">
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                >
                  ⚡ Salvar Vínculo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTRO DE ENCONTROS (SISTEMA ROLANTE DE PRÓXIMO ENCONTRO) */}
      {modalEncontrosOpen && selectedVinculo && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-4 shrink-0">
              <div>
                <h3 className="text-xl font-black text-blue-900">Encontros de Discipulado</h3>
                <p className="text-xs text-slate-500">
                  Líder: <strong className="text-blue-900">{selectedVinculo.discipulador?.nome}</strong> | Discípulo: <strong className="text-emerald-800">{selectedVinculo.discipulando?.nome}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalEncontrosOpen(false)}
                className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            {/* FORMULARIO DO NOVO ENCONTRO */}
            <form onSubmit={handleAdicionarProximoEncontro} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 shrink-0">
              <h4 className="font-bold text-blue-900 text-xs uppercase flex items-center gap-1">
                ➕ Registrar Próximo Encontro
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Data do Encontro</label>
                  <input
                    type="date"
                    value={novaData}
                    onChange={(e) => setNovaData(e.target.value)}
                    className="w-full border rounded-xl p-2 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Horário</label>
                  <input
                    type="time"
                    value={novaHora}
                    onChange={(e) => setNovaHora(e.target.value)}
                    className="w-full border rounded-xl p-2 bg-white"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-600 uppercase mb-1">O que foi tratado / Estudo *</label>
                  <input
                    type="text"
                    value={novoAssunto}
                    onChange={(e) => setNovoAssunto(e.target.value)}
                    placeholder="Ex: Estudo sobre a vida de oração, lição 3 do manual."
                    className="w-full border rounded-xl p-2 bg-white"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-600 uppercase mb-1">Comentários & Pedidos de Oração</label>
                  <textarea
                    rows={2}
                    value={novoComentario}
                    onChange={(e) => setNovoComentario(e.target.value)}
                    placeholder="Ex: O discípulo relatou desafios na vida profissional. Orar pela família."
                    className="w-full border rounded-xl p-2 bg-white outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
              >
                ⚡ Adicionar Este Encontro ao Histórico
              </button>
            </form>

            {/* ROLAGEM DOS ENCONTROS PASSADOS */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              <h4 className="font-bold text-slate-700 text-xs">📜 Histórico dos Encontros Realizados ({listaEncontros.length})</h4>

              {listaEncontros.length === 0 ? (
                <p className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed">
                  Nenhum encontro registrado ainda. Preencha o formulário acima.
                </p>
              ) : (
                listaEncontros.map((item, idx) => (
                  <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 relative shadow-sm">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-bold text-xs text-blue-900">
                        #{listaEncontros.length - idx} • Encontro em {item.data_encontro?.split('-').reverse().join('/')} às {item.hora_encontro}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleExcluirEncontro(item.id)}
                        className="text-rose-600 hover:text-rose-800 text-xs font-bold cursor-pointer"
                      >
                        🗑️ Excluir
                      </button>
                    </div>

                    <p className="text-xs font-bold text-slate-800">
                      📘 Tratado: <span className="font-normal text-slate-700">{item.assunto_tratado}</span>
                    </p>

                    {item.comentarios && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        💬 <strong className="text-slate-700">Comentários:</strong> {item.comentarios}
                      </p>
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

// Componente Recursivo da Árvore Genealógica
function TreeNodeRender({ node, nivel }: { node: TreeNode; nivel: number }) {
  const coresNivel = [
    'bg-blue-900 text-white border-blue-700',
    'bg-indigo-700 text-white border-indigo-600',
    'bg-emerald-700 text-white border-emerald-600',
    'bg-amber-600 text-white border-amber-500',
  ];

  const corBadge = coresNivel[nivel % coresNivel.length];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className={`px-4 py-2.5 rounded-2xl border shadow-sm flex items-center gap-2 ${corBadge}`}>
          <span className="font-black text-xs">
            {nivel === 0 ? '👑 G1' : `🌱 G${nivel + 1}`}
          </span>
          <span className="font-bold text-sm">{node.membro.nome}</span>
        </div>
      </div>

      {node.discipulandos.length > 0 && (
        <div className="ml-6 pl-4 border-l-2 border-slate-300 space-y-3 pt-1">
          {node.discipulandos.map((childNode) => (
            <TreeNodeRender key={childNode.membro.id} node={childNode} nivel={nivel + 1} />
          ))}
        </div>
      )}
    </div>
  );
}