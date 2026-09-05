// src/DiscipuladoDEAModule.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

interface Membro {
  id: any;
  nome: string;
  celular_principal?: string;
  foto_url?: string;
}

interface VinsuloDEA {
  id: any;
  discipulador_id: any;
  discipulando_id: any;
  dia_reuniao?: string;
  status: string;
  observacoes?: string;
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
  const [vinculos, setVinculos] = useState<VinsuloDEA[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalNovoOpen, setModalNovoOpen] = useState(false);

  // Form para novo vínculo
  const [discipuladorId, setDiscipuladorId] = useState('');
  const [discipulandoId, setDiscipulandoId] = useState('');
  const [diaReuniao, setDiaReuniao] = useState('Segunda-feira');
  const [observacoes, setObservacoes] = useState('');

  const codigoIgreja = loggedUser?.codigo_igreja || 'IGR-001';

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Carregar lista de membros
      const { data: dataMembros } = await supabase
        .from('members')
        .select('id, nome, celular_principal, foto_url')
        .eq('codigo_igreja', codigoIgreja)
        .order('nome', { ascending: true });

      if (dataMembros) setMembros(dataMembros);

      // 2. Carregar relacionamentos do D.E.A.
      const { data: dataDEA } = await supabase
        .from('discipulado_dea')
        .select('*')
        .eq('codigo_igreja', codigoIgreja);

      if (dataDEA && dataMembros) {
        const enriquecidos = dataDEA.map((v: any) => ({
          ...v,
          discipulador: dataMembros.find((m) => String(m.id) === String(v.discipulador_id)),
          discipulando: dataMembros.find((m) => String(m.id) === String(v.discipulando_id)),
        }));
        setVinculos(enriquecidos);
      }
    } catch (err) {
      console.error('Erro ao carregar módulo D.E.A.:', err);
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
      alert('Selecione o Líder/Discipulador e o Discipulando.');
      return;
    }

    if (discipuladorId === discipulandoId) {
      alert('O discipulador e o discipulando não podem ser a mesma pessoa.');
      return;
    }

    try {
      const payload = {
        codigo_igreja: codigoIgreja,
        discipulador_id: discipuladorId,
        discipulando_id: discipulandoId,
        dia_reuniao: diaReuniao,
        observacoes: observacoes.trim(),
        status: 'Ativo',
      };

      const { error } = await supabase.from('discipulado_dea').insert([payload]);

      if (error) throw error;

      alert('⚡ Vínculo D.E.A. criado com sucesso!');
      setModalNovoOpen(false);
      setDiscipuladorId('');
      setDiscipulandoId('');
      setObservacoes('');
      carregarDados();
    } catch (err: any) {
      alert('Erro ao vincular discipulado: ' + err.message);
    }
  };

  const handleExcluirVinculo = async (idVinculo: any) => {
    if (!window.confirm('Deseja remover este vínculo de discipulado D.E.A.?')) return;

    try {
      const { error } = await supabase.from('discipulado_dea').delete().eq('id', idVinculo);
      if (error) throw error;

      alert('Vínculo removido!');
      carregarDados();
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  // Construção recursiva da Árvore Genealógica Espiritual
  const montarArvore = (): TreeNode[] => {
    const discipulandosIds = new Set(vinculos.map((v) => String(v.discipulando_id)));

    // Raízes são líderes que não possuem discipulador acoplado
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

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 w-full max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-blue-900 tracking-tight flex items-center gap-2">
            🌱 D.E.A. - Discipulado Estratégico
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Mapeamento de liderança, acompanhamento e árvore genealogica espiritual ({codigoIgreja})
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalNovoOpen(true)}
          className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer shrink-0"
        >
          ➕ Novo Vínculo de Discipulado
        </button>
      </div>

      {loading && <p className="text-center py-6 text-slate-500 text-xs">Carregando estrutura D.E.A...</p>}

      {!loading && (
        <div className="space-y-8">
          {/* SEÇÃO 1: ÁRVORE GENEALÓGICA ESPIRITUAL */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4">
            <h3 className="text-lg font-black text-blue-900 flex items-center gap-2">
              🌳 Árvore Genealógica de Liderança
            </h3>

            {arvoreGenealogica.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                Nenhum vínculo de discipulado ativo. Clique no botão acima para criar o primeiro nível.
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

          {/* SEÇÃO 2: LISTA DE VÍNCULOS D.E.A. */}
          <div className="space-y-3">
            <h3 className="text-md font-bold text-slate-800">📋 Todos os Vínculos Registrados ({vinculos.length})</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {vinculos.map((v) => (
                <div key={v.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-[10px] font-black uppercase text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      📅 {v.dia_reuniao || 'Não def.'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleExcluirVinculo(v.id)}
                      className="text-rose-600 hover:text-rose-800 text-xs font-bold cursor-pointer"
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-500 w-20">Líder:</span>
                      <span className="font-bold text-blue-900 truncate">{v.discipulador?.nome || 'Não encontrado'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-500 w-20">Discipulando:</span>
                      <span className="font-bold text-emerald-800 truncate">{v.discipulando?.nome || 'Não encontrado'}</span>
                    </div>

                    {v.observacoes && (
                      <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg italic">
                        "{v.observacoes}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVO VÍNCULO */}
      {modalNovoOpen && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 my-8">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-xl font-black text-blue-900">Novo Vínculo D.E.A.</h3>
              <button
                type="button"
                onClick={() => setModalNovoOpen(false)}
                className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleSalvarVinculo} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  1. Selecione o Líder / Discipulador *
                </label>
                <select
                  value={discipuladorId}
                  onChange={(e) => setDiscipuladorId(e.target.value)}
                  className="w-full border rounded-xl p-3 bg-white font-bold text-blue-900"
                  required
                >
                  <option value="">Selecione quem irá discipular...</option>
                  {membros.map((m) => (
                    <option key={m.id} value={m.id}>
                      👤 {m.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  2. Selecione o Discipulando *
                </label>
                <select
                  value={discipulandoId}
                  onChange={(e) => setDiscipulandoId(e.target.value)}
                  className="w-full border rounded-xl p-3 bg-white font-bold text-emerald-900"
                  required
                >
                  <option value="">Selecione o discipulando...</option>
                  {membros.map((m) => (
                    <option key={m.id} value={m.id}>
                      🌱 {m.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Dia Principal do Encontro
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

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Observações / Objetivos
                </label>
                <textarea
                  rows={2}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Ex: Foco no treinamento para liderar nova célula."
                  className="w-full border rounded-xl p-3 bg-white outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="border-t pt-4">
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                >
                  ⚡ Vincular Discipulado
                </button>
              </div>
            </form>
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

      {node.discipulando.length > 0 && (
        <div className="ml-6 pl-4 border-l-2 border-slate-300 space-y-3 pt-1">
          {node.discipulando.map((childNode) => (
            <TreeNodeRender key={childNode.membro.id} node={childNode} nivel={nivel + 1} />
          ))}
        </div>
      )}
    </div>
  );
}