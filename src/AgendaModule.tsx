// src/AgendaModule.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

interface Compromisso {
  id: string;
  codigo_igreja: string;
  titulo: string;
  descricao: string;
  data_compromiss: string;
  hora_compromiss: string;
  hora_fim: string;
  local_evento: string;
  responsavel: string;
  dono_codigo: string;
  dono_tipo: string;
}

interface AgendaModuleProps {
  loggedUser: any;
}

const formInicial = {
  titulo: '',
  descricao: '',
  data_compromiss: '',
  hora_compromiss: '',
  hora_fim: '',
  local_evento: '',
  responsavel: '',
};

export default function AgendaModule({ loggedUser }: AgendaModuleProps) {
  const [compromissos, setCompromissos] = useState<Compromisso[]>([]);
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

  const codigoIgreja =
    loggedUser?.codigo_igreja ||
    loggedUser?.igrejas?.codigo_igreja;

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
        .order('data_compromiss', { ascending: true })
        .order('hora_compromiss', { ascending: true });

      if (filtroData) {
        query = query.eq('data_compromiss', filtroData);
      } else {
        // Traz os compromissos de hoje em diante ou limite recente
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

  useEffect(() => {
    if (!loggedUser || !codigoIgreja) return;
    fetchCompromissos();
  }, [loggedUser, codigoIgreja, fetchCompromissos]);

  const handleOpenNew = () => {
    setEditingCompromisso(null);
    setFormCompromisso(formInicial);
    setShowModal(true);
  };

  const handleOpenEdit = (c: Compromisso) => {
    setEditingCompromisso(c);
    setFormCompromisso({
      titulo: c.titulo || '',
      descricao: c.descricao || '',
      data_compromiss: c.data_compromiss || '',
      hora_compromiss: c.hora_compromiss || '',
      hora_fim: c.hora_fim || '',
      local_evento: c.local_evento || '',
      responsavel: c.responsavel || '',
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

    if (!codigoIgreja) {
      alert('Erro: Código da igreja não identificado.');
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

  const handleIniciarExclusao = (id: string, titulo: string) => {
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

  if (!loggedUser) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-6xl mx-auto">
        <p className="text-slate-500">Carregando informações da agenda...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-6xl mx-auto space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-blue-900 tracking-tight">
            Agenda e Compromissos
          </h2>
          <p className="text-slate-600 mt-1">
            Gerencie os cultos, reuniões e eventos da instituição ({codigoIgreja}).
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer shrink-0"
        >
          + Novo Compromisso
        </button>
      </div>

      {/* Filtro por Data */}
      <div className="flex flex-col sm:flex-row gap-2 items-center bg-slate-50 p-4 rounded-2xl border">
        <label className="text-xs font-bold text-slate-700 uppercase">Filtrar por Data:</label>
        <input
          type="date"
          value={filtroData}
          onChange={(e) => setFiltroData(e.target.value)}
          className="border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        {filtroData && (
          <button
            type="button"
            onClick={() => setFiltroData('')}
            className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Limpar Filtro
          </button>
        )}
      </div>

      {/* Listagem */}
      {loading && <p className="text-slate-500 py-4">Carregando compromissos...</p>}
      {error && <p className="text-red-500 py-4">Erro: {error}</p>}

      {!loading && !error && compromissos.length === 0 && (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <p className="text-slate-500">Nenhum compromisso agendado para este período.</p>
        </div>
      )}

      {!loading && !error && compromissos.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-slate-50 text-slate-700 text-xs uppercase font-bold">
                <th className="p-3">Data / Hora</th>
                <th className="p-3">Título do Evento</th>
                <th className="p-3">Local</th>
                <th className="p-3">Responsável</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {compromissos.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 whitespace-nowrap font-medium text-slate-700">
                    {c.data_compromiss ? c.data_compromiss.split('-').reverse().join('/') : '-'}
                    <span className="block text-xs text-blue-800 font-bold">
                      {c.hora_compromiss ? c.hora_compromiss.substring(0, 5) : ''}
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-8 my-8 max-h-[90vh] overflow-y-auto">
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
                    value={formCompromisso.data_compromiss}
                    onChange={(e) => handleChange('data_compromiss', e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Hora Início</label>
                  <input
                    type="time"
                    value={formCompromisso.hora_compromiss}
                    onChange={(e) => handleChange('hora_compromiss', e.target.value)}
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
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Responsável</label>
                  <input
                    type="text"
                    value={formCompromisso.responsavel}
                    onChange={(e) => handleChange('responsavel', e.target.value)}
                    placeholder="Ex: Pr. João, Diaconato"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
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

              <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer"
                >
                  {editingCompromisso ? 'Salvar alterações' : 'Agendar compromisso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO POR SENHA */}
      {showDeleteModal && compromissoParaExcluir && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-4">
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

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowDeleteModal(false); setCompromissoParaExcluir(null); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer"
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
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 space-y-4">
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
              <div className="bg-slate-50 p-3 rounded-xl"><span className="block text-xs font-bold text-slate-400 uppercase">Título</span>{compromissoSelecionado.titulo}</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-3 rounded-xl"><span className="block text-xs font-bold text-slate-400 uppercase">Data</span>{compromissoSelecionado.data_compromiss?.split('-').reverse().join('/')}</div>
                <div className="bg-slate-50 p-3 rounded-xl"><span className="block text-xs font-bold text-slate-400 uppercase">Horário</span>{compromissoSelecionado.hora_compromiss?.substring(0,5)} {compromissoSelecionado.hora_fim ? `às ${compromissoSelecionado.hora_fim.substring(0,5)}` : ''}</div>
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