// src/AcompanhamentoVisitantesModule.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

interface Acompanhamento {
  id: number;
  meio: 'WhatsApp' | 'Telefone';
  data: string;
  comentario: string;
}

interface Visitante {
  id: any;
  nome_completo: string;
  telefone?: string;
  data_nascimento?: string;
  bairro?: string;
  cidade?: string;
  tipo_cadastro: string;
  codigo_igreja: string;
  acompanhamentos?: Acompanhamento[];
  created_at?: string;
}

interface Props {
  loggedUser: any;
}

export default function AcompanhamentoVisitantesModule({ loggedUser }: Props) {
  const [visitantes, setVisitantes] = useState<Visitante[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVisitante, setSelectedVisitante] = useState<Visitante | null>(null);
  const [listaAcompanhamentos, setListaAcompanhamentos] = useState<Acompanhamento[]>([]);
  const [busca, setBusca] = useState('');

  const codigoIgreja = loggedUser?.codigo_igreja || 'IGR-001';

  const carregarVisitantes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('membros')
        .select('*')
        .eq('codigo_igreja', codigoIgreja)
        .eq('tipo_cadastro', 'Visitante')
        .order('id', { ascending: false });

      if (!error && data) {
        const normalizados = data.map((v: any) => ({
          ...v,
          nome_completo: v.nome_completo || v.nome || 'Visitante Sem Nome',
          telefone: v.telefone || v.celular_principal || '',
          acompanhamentos: Array.isArray(v.acompanhamentos)
            ? v.acompanhamentos
            : typeof v.acompanhamentos === 'string'
            ? JSON.parse(v.acompanhamentos || '[]')
            : [],
        }));
        setVisitantes(normalizados);
      }
    } catch (err) {
      console.error('Erro ao carregar visitantes:', err);
    } finally {
      setLoading(false);
    }
  }, [codigoIgreja]);

  useEffect(() => {
    carregarVisitantes();
  }, [carregarVisitantes]);

  const abrirModalAcompanhamento = (vis: Visitante) => {
    setSelectedVisitante(vis);
    setListaAcompanhamentos(vis.acompanhamentos || []);
    setModalOpen(true);
  };

  const adicionarAcompanhamento = () => {
    if (listaAcompanhamentos.length >= 8) {
      alert('Limite máximo de 8 acompanhamentos atingido para este visitante.');
      return;
    }

    const novo: Acompanhamento = {
      id: Date.now(),
      meio: 'WhatsApp',
      data: new Date().toLocaleDateString('pt-BR'),
      comentario: '',
    };

    setListaAcompanhamentos((prev) => [...prev, novo]);
  };

  const atualizarItemAcompanhamento = (id: number, campo: 'meio' | 'comentario', valor: string) => {
    setListaAcompanhamentos((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [campo]: valor } : item))
    );
  };

  const removerAcompanhamento = (id: number) => {
    setListaAcompanhamentos((prev) => prev.filter((item) => item.id !== id));
  };

  const salvarAcompanhamentos = async () => {
    if (!selectedVisitante) return;

    try {
      const { error } = await supabase
        .from('membros')
        .update({ acompanhamentos: listaAcompanhamentos })
        .eq('id', selectedVisitante.id);

      if (error) throw error;

      alert('Acompanhamentos salvos com sucesso!');
      setModalOpen(false);
      carregarVisitantes();
    } catch (err: any) {
      alert('Erro ao salvar acompanhamentos: ' + err.message);
    }
  };

  const evoluirParaMembro = async (vis: Visitante) => {
    if (!window.confirm(`Deseja evoluir o visitante "${vis.nome_completo}" para Membro? Ele passará para a Lista Oficial de Membros.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('membros')
        .update({ tipo_cadastro: 'Membro' })
        .eq('id', vis.id);

      if (error) throw error;

      alert(`🌟 "${vis.nome_completo}" agora é um Membro da igreja!`);
      carregarVisitantes();
    } catch (err: any) {
      alert('Erro ao evoluir visitante: ' + err.message);
    }
  };

  const filtrados = visitantes.filter((v) =>
    v.nome_completo.toLowerCase().includes(busca.toLowerCase()) ||
    (v.telefone && v.telefone.includes(busca))
  );

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 w-full max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-blue-900 tracking-tight">
            Acompanhamento de Visitantes
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Acolhimento, acompanhamento pré-membro e integração ({codigoIgreja})
          </p>
        </div>

        <div className="w-full sm:w-auto">
          <input
            type="text"
            placeholder="🔎 Buscar por nome ou telefone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full sm:w-64 border rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
          />
        </div>
      </div>

      {loading && <p className="text-center py-6 text-slate-500">Carregando visitantes...</p>}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-sm">
              Nenhum visitante cadastrado no momento.
            </div>
          ) : (
            filtrados.map((v) => {
              const qtd = (v.acompanhamentos || []).length;
              return (
                <div key={v.id} className="border rounded-2xl p-5 bg-slate-50 hover:bg-white hover:shadow-md transition space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="text-base font-black text-blue-900 leading-snug">{v.nome_completo}</h3>
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-blue-200 uppercase">
                        Visitante
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">📞 {v.telefone || 'Sem telefone'}</p>
                    {v.bairro && <p className="text-xs text-slate-500">📍 {v.bairro} {v.cidade ? `- ${v.cidade}` : ''}</p>}

                    <div className="pt-2 border-t flex justify-between items-center text-xs">
                      <span className="font-bold text-indigo-900">
                        📞 Acompanhamentos:
                      </span>
                      <span className={`font-black text-xs px-2 py-0.5 rounded-lg ${
                        qtd >= 8 ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {qtd} de 8
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => abrirModalAcompanhamento(v)}
                      className="w-full py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                    >
                      📝 Gerenciar Acompanhamento ({qtd}/8)
                    </button>

                    <button
                      type="button"
                      onClick={() => evoluirParaMembro(v)}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                    >
                      ⭐ Evoluir para Membro
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL DE GERENCIAMENTO DE ACOMPANHAMENTO */}
      {modalOpen && selectedVisitante && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 my-8">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="text-xl font-black text-blue-900">Histórico de Acompanhamento</h3>
                <p className="text-xs text-slate-500">{selectedVisitante.nome_completo}</p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700">
                {listaAcompanhamentos.length} de 8 acompanhamentos
              </span>

              <button
                type="button"
                onClick={adicionarAcompanhamento}
                disabled={listaAcompanhamentos.length >= 8}
                className="px-3 py-2 bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl transition shadow cursor-pointer disabled:opacity-40"
              >
                ➕ Adicionar Acompanhamento
              </button>
            </div>

            {listaAcompanhamentos.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-6 text-center text-xs text-slate-500">
                Nenhum acompanhamento registrado. Clique no botão acima para registrar a primeira ligação ou mensagem.
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {listaAcompanhamentos.map((item, idx) => (
                  <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 relative">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-bold text-xs text-blue-900">
                        #{idx + 1} - Contato em {item.data}
                      </span>
                      <button
                        type="button"
                        onClick={() => removerAcompanhamento(item.id)}
                        className="text-rose-600 hover:text-rose-800 font-bold text-xs cursor-pointer"
                      >
                        ✕ Remover
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                          Meio
                        </label>
                        <select
                          value={item.meio}
                          onChange={(e) =>
                            atualizarItemAcompanhamento(item.id, 'meio', e.target.value as any)
                          }
                          className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white font-medium"
                        >
                          <option value="WhatsApp">💬 WhatsApp</option>
                          <option value="Telefone">📞 Telefone</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                          Comentário / Observação
                        </label>
                        <input
                          type="text"
                          value={item.comentario}
                          onChange={(e) =>
                            atualizarItemAcompanhamento(item.id, 'comentario', e.target.value)
                          }
                          placeholder="Ex: Gostou do culto, pediu oração pela família."
                          className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white outline-none focus:ring-1 focus:ring-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t pt-4 flex gap-2">
              <button
                type="button"
                onClick={salvarAcompanhamentos}
                className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
              >
                💾 Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}