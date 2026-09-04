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
  
  // Modais
  const [modalNovoOpen, setModalNovoOpen] = useState(false);
  const [modalHistoricoOpen, setModalHistoricoOpen] = useState(false);
  const [selectedVisitante, setSelectedVisitante] = useState<Visitante | null>(null);
  
  // Estado para o NOVO acompanhamento sendo adicionado
  const [novoMeio, setNovoMeio] = useState<'WhatsApp' | 'Telefone'>('WhatsApp');
  const [novoComentario, setNovoComentario] = useState('');
  
  // Estado para edição/exclusão do histórico existente
  const [listaHistorico, setListaHistorico] = useState<Acompanhamento[]>([]);
  const [busca, setBusca] = useState('');

  const codigoIgreja = loggedUser?.codigo_igreja || 'IGR-001';

  const carregarVisitantes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('codigo_igreja', codigoIgreja)
        .eq('tipo_cadastro', 'Visitante')
        .order('id', { ascending: false });

      if (error) {
        console.error('Erro ao buscar visitantes:', error);
      }

      if (data) {
        const normalizados = data.map((v: any) => {
          let acomp: Acompanhamento[] = [];
          if (Array.isArray(v.acompanhamentos)) {
            acomp = v.acompanhamentos;
          } else if (typeof v.acompanhamentos === 'string') {
            try {
              acomp = JSON.parse(v.acompanhamentos);
            } catch (e) {
              acomp = [];
            }
          }

          return {
            ...v,
            nome_completo: v.nome || v.nome_completo || 'Visitante Sem Nome',
            telefone: v.celular_principal || v.telefone || '',
            acompanhamentos: acomp,
          };
        });
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

  // Abrir modal para incluir NOVO contato no histórico existente
  const abrirModalNovoAcompanhamento = (vis: Visitante) => {
    setSelectedVisitante(vis);
    setNovoMeio('WhatsApp');
    setNovoComentario('');
    setModalNovoOpen(true);
  };

  // Abrir modal para ver todo o histórico, editar observações antigas ou excluir um item
  const abrirModalHistorico = (vis: Visitante) => {
    setSelectedVisitante(vis);
    setListaHistorico(vis.acompanhamentos || []);
    setModalHistoricoOpen(true);
  };

  // Gravar NOVO acompanhamento preservando todos os anteriores
  const handleSalvarNovoAcompanhamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisitante) return;

    const historicoAtual = selectedVisitante.acompanhamentos || [];

    if (historicoAtual.length >= 8) {
      alert('Limite máximo de 8 acompanhamentos atingido para este visitante.');
      return;
    }

    if (!novoComentario.trim()) {
      alert('Por favor, informe um comentário ou observação sobre o contato.');
      return;
    }

    const novoItem: Acompanhamento = {
      id: Date.now(),
      meio: novoMeio,
      data: new Date().toLocaleDateString('pt-BR'),
      comentario: novoComentario.trim(),
    };

    // ADICIONA O NOVO AO HISTÓRICO EXISTENTE
    const historicoAtualizado = [...historicoAtual, novoItem];

    try {
      const { error } = await supabase
        .from('members')
        .update({ acompanhamentos: historicoAtualizado })
        .eq('id', selectedVisitante.id);

      if (error) throw error;

      alert(' Novo acompanhamento registrado no histórico!');
      setModalNovoOpen(false);
      setNovoComentario('');
      carregarVisitantes();
    } catch (err: any) {
      alert('Erro ao salvar acompanhamento: ' + err.message);
    }
  };

  // Salvar edições/exclusões feitas na lista completa de histórico
  const handleSalvarEdicaoHistorico = async () => {
    if (!selectedVisitante) return;

    try {
      const { error } = await supabase
        .from('members')
        .update({ acompanhamentos: listaHistorico })
        .eq('id', selectedVisitante.id);

      if (error) throw error;

      alert('Histórico atualizado com sucesso!');
      setModalHistoricoOpen(false);
      carregarVisitantes();
    } catch (err: any) {
      alert('Erro ao atualizar histórico: ' + err.message);
    }
  };

  // Excluir um item específico do histórico na modal de edição
  const removerItemHistorico = (idItem: number) => {
    setListaHistorico((prev) => prev.filter((item) => item.id !== idItem));
  };

  // Editar texto/meio de um item existente no histórico
  const atualizarItemHistorico = (idItem: number, campo: 'meio' | 'comentario', valor: string) => {
    setListaHistorico((prev) =>
      prev.map((item) => (item.id === idItem ? { ...item, [campo]: valor } : item))
    );
  };

  const evoluirParaMembro = async (vis: Visitante) => {
    if (!window.confirm(`Deseja evoluir o visitante "${vis.nome_completo}" para Membro? Ele passará para a Lista Oficial de Membros.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('members')
        .update({ tipo_cadastro: 'Membro' })
        .eq('id', vis.id);

      if (error) throw error;

      alert(`🌟 "${vis.nome_completo}" agora é um Membro da igreja!`);
      carregarVisitantes();
    } catch (err: any) {
      alert('Erro ao evoluir visitante: ' + err.message);
    }
  };

  const excluirVisitante = async (vis: Visitante) => {
    if (!window.confirm(`Tem certeza que deseja excluir o visitante "${vis.nome_completo}"? Esta ação não poderá ser desfeita.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', vis.id);

      if (error) throw error;

      alert(`Visitante "${vis.nome_completo}" excluído com sucesso.`);
      carregarVisitantes();
    } catch (err: any) {
      alert('Erro ao excluir visitante: ' + err.message);
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
                        📞 Histórico Registrado:
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
                      onClick={() => abrirModalNovoAcompanhamento(v)}
                      className="w-full py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                    >
                      ➕ Registrar Novo Contato ({qtd}/8)
                    </button>

                    <button
                      type="button"
                      onClick={() => abrirModalHistorico(v)}
                      className="w-full py-2 bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                    >
                      📋 Ver Histórico / Editar ({qtd})
                    </button>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => evoluirParaMembro(v)}
                        className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                      >
                        ⭐ Evoluir para Membro
                      </button>

                      <button
                        type="button"
                        onClick={() => excluirVisitante(v)}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition cursor-pointer border border-rose-200"
                        title="Excluir Visitante"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL 1: REGISTRAR NOVO CONTATO (ADICIONA AO HISTÓRICO) */}
      {modalNovoOpen && selectedVisitante && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 my-8">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="text-xl font-black text-blue-900">Adicionar Acompanhamento</h3>
                <p className="text-xs text-slate-500">Novo contato para {selectedVisitante.nome_completo}</p>
              </div>
              <button
                type="button"
                onClick={() => setModalNovoOpen(false)}
                className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleSalvarNovoAcompanhamento} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Meio de Comunicação
                </label>
                <select
                  value={novoMeio}
                  onChange={(e) => setNovoMeio(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white font-medium"
                >
                  <option value="WhatsApp">💬 WhatsApp</option>
                  <option value="Telefone">📞 Ligação Telefônica</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Observações / Resumo da Conversa *
                </label>
                <textarea
                  rows={3}
                  value={novoComentario}
                  onChange={(e) => setNovoComentario(e.target.value)}
                  placeholder="Ex: Liguei para confirmar se viria ao culto de domingo. Pediu oração pela família."
                  className="w-full border border-slate-300 rounded-xl p-3 text-xs bg-white outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-[11px] text-blue-900 font-medium">
                💡 Este novo registro será adicionado com a data de hoje ao histórico do visitante.
              </div>

              <div className="border-t pt-4 flex gap-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                >
                  ➕ Salvar Novo Contato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VER TODO O HISTÓRICO / EDITAR OU EXCLUIR REGISTROS ANTIGOS */}
      {modalHistoricoOpen && selectedVisitante && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 my-8">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="text-xl font-black text-blue-900">Histórico de Acompanhamentos</h3>
                <p className="text-xs text-slate-500">Visualização e edição do histórico de {selectedVisitante.nome_completo}</p>
              </div>
              <button
                type="button"
                onClick={() => setModalHistoricoOpen(false)}
                className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            {listaHistorico.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-8 text-center text-xs text-slate-500">
                Nenhum acompanhamento registrado para este visitante até o momento.
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                {listaHistorico.map((item, idx) => (
                  <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-bold text-xs text-blue-900">
                        #{idx + 1} • {item.meio === 'WhatsApp' ? '💬 WhatsApp' : '📞 Telefone'} em {item.data}
                      </span>
                      <button
                        type="button"
                        onClick={() => removerItemHistorico(item.id)}
                        className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-[10px] rounded-lg cursor-pointer"
                      >
                        🗑️ Excluir Este Registro
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
                            atualizarItemHistorico(item.id, 'meio', e.target.value as any)
                          }
                          className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white font-medium"
                        >
                          <option value="WhatsApp">💬 WhatsApp</option>
                          <option value="Telefone">📞 Telefone</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                          Editar Comentário / Observação
                        </label>
                        <input
                          type="text"
                          value={item.comentario}
                          onChange={(e) =>
                            atualizarItemHistorico(item.id, 'comentario', e.target.value)
                          }
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
                onClick={handleSalvarEdicaoHistorico}
                className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
              >
                💾 Salvar Alterações no Histórico
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}