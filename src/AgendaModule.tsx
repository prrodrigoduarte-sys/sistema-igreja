// src/AgendaModule.tsx
import React, { useEffect, useState, useCallback } from 'react';
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
}

interface Membro {
  id: string;
  nome_completo: string;
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
};

export default function AgendaModule({ loggedUser }: AgendaModuleProps) {
  const [compromissos, setCompromissos] = useState<Compromisso[]>([]);
  const [membrosIgreja, setMembrosIgreja] = useState<Membro[]>([]);
  const [filtroData, setFiltroData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [editingCompromisso, setEditingCompromisso] = useState<Compromisso | null>(null);
  const [compromissoSelecionado, setCompromissoSelecionado] = useState<Compromisso | null>(null);
  const [compromissoParaExcluir, setCompromissoParaExcluir] = useState<{ id: string; titulo: string } | null>(null);

  const [senhaExclusao, setSenhaExclusao] = useState('');
  const [formCompromisso, setFormCompromisso] = useState(formInicial);

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
      let query = supabase
        .from('agenda_compromissos')
        .select('*')
        .eq('codigo_igreja', codigoIgreja)
        .order('data_compromisso', { ascending: true })
        .order('hora_compromisso', { ascending: true });

      if (filtroData) {
        query = query.eq('data_compromisso', filtroData);
      } else {
        query = query.limit(30);
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
  }, [codigoIgreja, filtroData]);

  // Buscar lista de membros da igreja para preencher o select de responsáveis
  const fetchMembros = useCallback(async () => {
    if (!codigoIgreja) return;
    try {
      const { data, error } = await supabase
        .from('membros')
        .select('id, nome_completo')
        .eq('codigo_igreja', codigoIgreja)
        .order('nome_completo', { ascending: true });

      if (error) throw error;
      setMembrosIgreja(data || []);
    } catch (err) {
      console.error('Erro ao buscar membros para responsáveis:', err);
    }
  }, [codigoIgreja]);

  useEffect(() => {
    if (!loggedUser || !codigoIgreja) return;
    fetchCompromissos();
    fetchMembros();
  }, [loggedUser, codigoIgreja, fetchCompromissos, fetchMembros]);

  const handleOpenNew = () => {
    if (!isAdmin) {
      alert('Apenas administradores podem cadastrar novos compromissos.');
      return;
    }
    setEditingCompromisso(null);
    setFormCompromisso(formInicial);
    setShowModal(true);
  };

  const handleOpenEdit = (c: Compromisso) => {
    if (!isAdmin) {
      alert('Apenas administradores podem editar compromissos.');
      return;
    }
    setEditingCompromisso(c);
    setFormCompromisso({
      titulo: c.titulo || '',
      descricao: c.descricao || '',
      data_compromisso: c.data_compromisso || '',
      hora_compromisso: c.hora_compromisso || '',
      hora_fim: c.hora_fim || '',
      local_evento: c.local_evento || '',
      responsavel: c.responsavel || '',
      status: c.status || 'pendente',
    });
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

    try {
      const payload = {
        ...formCompromisso,
        codigo_igreja: codigoIgreja,
        dono_tipo: 'admin',
        dono_codigo: loggedUser?.id || null,
      };

      if (editingCompromisso) {
        const { error: updateError } = await supabase
          .from('agenda_compromissos')
          .update(payload)
          .eq('id', editingCompromisso.id);

        if (updateError) throw updateError;
        alert('Compromisso atualizado com sucesso!');
      } else {
        const { error: insertError } = await supabase
          .from('agenda_compromissos')
          .insert([payload]);

        if (insertError) throw insertError;
        alert('Compromisso agendado com sucesso!');
      }

      handleCloseModal();
      fetchCompromissos();
    } catch (err: any) {
      console.error('Erro ao salvar compromisso:', err);
      alert('Erro ao salvar compromisso: ' + (err.message || 'Erro desconhecido'));
    }
  };

  const handleAlternarStatus = async (id: string, statusAtual: string) => {
    if (!isAdmin) {
      alert('Apenas administradores podem alterar o status do evento.');
      return;
    }

    const novoStatus = statusAtual === 'realizado' ? 'pendente' : 'realizado';

    try {
      const { error } = await supabase
        .from('agenda_compromissos')
        .update({ status: novoStatus })
        .eq('id', id);

      if (error) throw error;
      fetchCompromissos();
    } catch (err: any) {
      console.error('Erro ao atualizar status:', err);
      alert('Erro ao atualizar status: ' + err.message);
    }
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

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: emailUsuario,
        password: senhaExclusao,
      });

      if (authError) {
        alert('Senha incorreta! A exclusão foi cancelada por segurança.');
        return;
      }

      const { error: deleteError } = await supabase
        .from('agenda_compromissos')
        .delete()
        .eq('id', compromissoParaExcluir.id);

      if (deleteError) throw deleteError;

      alert('Compromisso excluído com sucesso!');
      setShowDeleteModal(false);
      setCompromissoParaExcluir(null);
      setSenhaExclusao('');
      fetchCompromissos();
    } catch (err: any) {
      console.error('Erro ao excluir compromisso:', err);
      alert('Erro ao excluir: ' + (err.message || 'Erro desconhecido'));
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 w-full max-w-6xl mx-auto space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-blue-900 tracking-tight">
            Agenda e Compromissos
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Gerencie cultos, reuniões e eventos ({codigoIgreja}). {!isAdmin && <span className="text-amber-600 font-semibold">(Modo Visualização)</span>}
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

      {/* Filtro por Data */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center bg-slate-50 p-4 rounded-2xl border">
        <label className="text-xs font-bold text-slate-700 uppercase">Filtrar por Data:</label>
        <input
          type="date"
          value={filtroData}
          onChange={(e) => setFiltroData(e.target.value)}
          className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        {filtroData && (
          <button
            type="button"
            onClick={() => setFiltroData('')}
            className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Limpar Filtro
          </button>
        )}
      </div>

      {/* Listagem */}
      {loading && <p className="text-slate-500 py-4 text-center">Carregando compromissos...</p>}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-semibold">
          Erro ao carregar dados: {error}
        </div>
      )}

      {!loading && !error && compromissos.length === 0 && (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <p className="text-slate-500 text-sm">Nenhum compromisso agendado para este período.</p>
        </div>
      )}

      {!loading && !error && compromissos.length > 0 && (
        <>
          {/* VISÃO MOBILE: CARDS INTUITIVOS */}
          <div className="block md:hidden space-y-4">
            {compromissos.map((c) => {
              const realizado = c.status === 'realizado';
              return (
                <div key={c.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-xs font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded-md">
                        {c.data_compromisso ? c.data_compromisso.split('-').reverse().join('/') : '-'} {c.hora_compromisso ? `às ${c.hora_compromisso.substring(0, 5)}` : ''}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base mt-1.5">{c.titulo}</h3>
                    </div>

                    <button
                      type="button"
                      disabled={!isAdmin}
                      onClick={() => handleAlternarStatus(c.id, c.status || 'pendente')}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                        realizado
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      } ${isAdmin ? 'cursor-pointer active:scale-95' : 'cursor-default'}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${realizado ? 'bg-emerald-600' : 'bg-rose-600'}`}></span>
                      {realizado ? 'Realizado' : 'Pendente'}
                    </button>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-200/60">
                    <p><strong className="text-slate-700">Local:</strong> {c.local_evento || 'Não informado'}</p>
                    <p><strong className="text-slate-700">Responsável:</strong> {c.responsavel || 'Não informado'}</p>
                    {c.descricao && <p className="text-slate-500 italic mt-1">"{c.descricao}"</p>}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => { setCompromissoSelecionado(c); setShowDetalhesModal(true); }}
                      className="flex-1 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Ver Detalhes
                    </button>

                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(c)}
                          className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-xl transition cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleIniciarExclusao(c.id, c.titulo)}
                          className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition cursor-pointer"
                        >
                          Excluir
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* VISÃO DESKTOP: TABELA TRADICIONAL */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-slate-50 text-slate-700 text-xs uppercase font-bold">
                  <th className="p-3">Status</th>
                  <th className="p-3">Data / Hora</th>
                  <th className="p-3">Título do Evento</th>
                  <th className="p-3">Local</th>
                  <th className="p-3">Responsável</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {compromissos.map((c) => {
                  const realizado = c.status === 'realizado';
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 whitespace-nowrap">
                        <button
                          type="button"
                          disabled={!isAdmin}
                          onClick={() => handleAlternarStatus(c.id, c.status || 'pendente')}
                          title={isAdmin ? "Clique para alternar entre Pendente e Realizado" : "Status do evento"}
                          className={`px-2.5 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                            realizado
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          } ${isAdmin ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${realizado ? 'bg-emerald-600' : 'bg-rose-600'}`}></span>
                          {realizado ? 'Realizado' : 'Pendente'}
                        </button>
                      </td>
                      <td className="p-3 whitespace-nowrap font-medium text-slate-700">
                        {c.data_compromisso ? c.data_compromisso.split('-').reverse().join('/') : '-'}
                        <span className="block text-xs text-blue-800 font-bold">
                          {c.hora_compromisso ? c.hora_compromisso.substring(0, 5) : ''}
                          {c.hora_fim ? ` às ${c.hora_fim.substring(0, 5)}` : ''}
                        </span>
                      </td>
                      <td className="p-3">
                        <p className="font-semibold text-slate-800">{c.titulo}</p>
                        <p className="text-xs text-slate-500 truncate max-w-xs">{c.descricao || '-'}</p>
                      </td>
                      <td className="p-3 text-slate-600">{c.local_evento || '-'}</td>
                      <td className="p-3 text-slate-600">{c.responsavel || '-'}</td>
                      <td className="p-3 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => { setCompromissoSelecionado(c); setShowDetalhesModal(true); }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition cursor-pointer"
                        >
                          Ver
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(c)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-lg transition cursor-pointer"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleIniciarExclusao(c.id, c.titulo)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition cursor-pointer"
                            >
                              Excluir
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      {showModal && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4 mb-6 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-black text-blue-900">
                {editingCompromisso ? 'Editar Compromisso' : 'Novo Compromisso'}
              </h3>
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
              >
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
                  <select
                    value={formCompromisso.responsavel}
                    onChange={(e) => handleChange('responsavel', e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                    required
                  >
                    <option value="">Selecione um membro...</option>
                    {membrosIgreja.map((m) => (
                      <option key={m.id} value={m.nome_completo}>
                        {m.nome_completo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer"
                >
                  {editingCompromisso ? 'Salvar alterações' : 'Agendar compromisso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO POR SENHA */}
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
                  onClick={() => { setShowDeleteModal(false); setCompromissoParaExcluir(null); }}
                  className="w-full sm:w-auto px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer"
                >
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
              <button
                type="button"
                onClick={() => setShowDetalhesModal(false)}
                className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="bg-slate-50 p-3 rounded-xl flex justify-between items-center">
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase">Status</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold mt-1 ${
                    compromissoSelecionado.status === 'realizado' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {compromissoSelecionado.status === 'realizado' ? '🟢 Realizado' : '🔴 Pendente'}
                  </span>
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl"><span className="block text-xs font-bold text-slate-400 uppercase">Título</span>{compromissoSelecionado.titulo}</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-3 rounded-xl"><span className="block text-xs font-bold text-slate-400 uppercase">Data</span>{compromissoSelecionado.data_compromisso?.split('-').reverse().join('/')}</div>
                <div className="bg-slate-50 p-3 rounded-xl"><span className="block text-xs font-bold text-slate-400 uppercase">Horário</span>{compromissoSelecionado.hora_compromisso?.substring(0,5)} {compromissoSelecionado.hora_fim ? `às ${compromissoSelecionado.hora_fim.substring(0,5)}` : ''}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl"><span className="block text-xs font-bold text-slate-400 uppercase">Local</span>{compromissoSelecionado.local_evento || '-'}</div>
              <div className="bg-slate-50 p-3 rounded-xl"><span className="block text-xs font-bold text-slate-400 uppercase">Responsável</span>{compromissoSelecionado.responsavel || '-'}</div>
              <div className="bg-slate-50 p-3 rounded-xl"><span className="block text-xs font-bold text-slate-400 uppercase">Descrição</span>{compromissoSelecionado.descricao || 'Nenhuma descrição informada.'}</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}