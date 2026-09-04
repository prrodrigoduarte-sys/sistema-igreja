// src/FinanceiroModule.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

interface ContaContabil {
  id: string;
  codigo_igreja: string;
  conta_pai: string;
  codigo_conta: string;
  nome_conta: string;
  tipo_natureza: string; // 'Receita', 'Despesa', 'Ativo', 'Passivo', etc.
}

interface FinanceiroModuleProps {
  loggedUser: any;
}

const formInicial = {
  codigo_conta: '',
  nome_conta: '',
  conta_pai: '',
  tipo_natureza: 'Despesa',
};

export default function FinanceiroModule({ loggedUser }: FinanceiroModuleProps) {
  const [contas, setContas] = useState<ContaContabil[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingConta, setEditingConta] = useState<ContaContabil | null>(null);
  const [contaParaExcluir, setContaParaExcluir] = useState<{ id: string; nome_conta: string } | null>(null);
  const [senhaExclusao, setSenhaExclusao] = useState('');
  const [formConta, setFormConta] = useState(formInicial);

  const isAdmin = loggedUser?.perfil === 'admin' || loggedUser?.perfil === 'administrador';
  const codigoIgreja = loggedUser?.codigo_igreja || loggedUser?.igrejas?.codigo_igreja;

  const fetchContas = useCallback(async () => {
    if (!codigoIgreja) {
      setError('Código da igreja não encontrado.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: erroConsulta } = await supabase
        .from('plano_contas_contabil')
        .select('*')
        .eq('codigo_igreja', codigoIgreja)
        .order('codigo_conta', { ascending: true });

      if (erroConsulta) throw erroConsulta;
      setContas(data || []);
    } catch (erro: any) {
      console.error('Erro ao buscar plano de contas:', erro);
      setContas([]);
      setError(erro?.message || 'Erro ao carregar plano de contas.');
    } finally {
      setLoading(false);
    }
  }, [codigoIgreja]);

  useEffect(() => {
    if (!loggedUser || !codigoIgreja) return;
    fetchContas();
  }, [loggedUser, codigoIgreja, fetchContas]);

  const handleOpenNew = () => {
    if (!isAdmin) {
      alert('Apenas administradores podem cadastrar novas contas.');
      return;
    }
    setEditingConta(null);
    setFormConta(formInicial);
    setShowModal(true);
  };

  const handleOpenEdit = (c: ContaContabil) => {
    if (!isAdmin) {
      alert('Apenas administradores podem editar contas.');
      return;
    }
    setEditingConta(c);
    setFormConta({
      codigo_conta: c.codigo_conta || '',
      nome_conta: c.nome_conta || '',
      conta_pai: c.conta_pai || '',
      tipo_natureza: c.tipo_natureza || 'Despesa',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingConta(null);
    setFormConta(formInicial);
  };

  const handleChange = (campo: string, valor: any) => {
    setFormConta((prev) => ({
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
        ...formConta,
        codigo_igreja: codigoIgreja,
      };

      if (editingConta) {
        const { error: updateError } = await supabase
          .from('plano_contas_contabil')
          .update(payload)
          .eq('id', editingConta.id);

        if (updateError) throw updateError;
        alert('Conta contábil atualizada com sucesso!');
      } else {
        const { error: insertError } = await supabase
          .from('plano_contas_contabil')
          .insert([payload]);

        if (insertError) throw insertError;
        alert('Conta contábil cadastrada com sucesso!');
      }

      handleCloseModal();
      fetchContas();
    } catch (err: any) {
      console.error('Erro ao salvar conta:', err);
      alert('Erro ao salvar conta: ' + (err.message || 'Erro desconhecido'));
    }
  };

  const handleIniciarExclusao = (id: string, nome_conta: string) => {
    if (!isAdmin) {
      alert('Apenas administradores podem excluir contas.');
      return;
    }
    setContaParaExcluir({ id, nome_conta });
    setSenhaExclusao('');
    setShowDeleteModal(true);
  };

  const confirmarExclusaoComSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contaParaExcluir) return;

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
        .from('plano_contas_contabil')
        .delete()
        .eq('id', contaParaExcluir.id);

      if (deleteError) throw deleteError;

      alert('Conta excluída com sucesso!');
      setShowDeleteModal(false);
      setContaParaExcluir(null);
      setSenhaExclusao('');
      fetchContas();
    } catch (err: any) {
      console.error('Erro ao excluir conta:', err);
      alert('Erro ao excluir: ' + (err.message || 'Erro desconhecido'));
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 w-full max-w-6xl mx-auto space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-blue-900 tracking-tight">
            Plano de Contas Contábil
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Gerencie as contas financeiras e orçamentárias ({codigoIgreja}). {!isAdmin && <span className="text-amber-600 font-semibold">(Modo Visualização)</span>}
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={handleOpenNew}
            className="w-full sm:w-auto px-4 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer shrink-0 text-center"
          >
            + Nova Conta Contábil
          </button>
        )}
      </div>

      {/* Listagem */}
      {loading && <p className="text-slate-500 py-4 text-center">Carregando plano de contas...</p>}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-semibold">
          Erro ao carregar dados: {error}
        </div>
      )}

      {!loading && !error && contas.length === 0 && (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <p className="text-slate-500 text-sm">Nenhuma conta cadastrada no plano de contas.</p>
        </div>
      )}

      {!loading && !error && contas.length > 0 && (
        <>
          {/* VISÃO MOBILE: CARDS */}
          <div className="block md:hidden space-y-4">
            {contas.map((c) => (
              <div key={c.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-xs font-bold text-blue-900 bg-blue-100 px-2.5 py-1 rounded-lg">
                      Conta: {c.codigo_conta}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-2">{c.nome_conta}</h3>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                    c.tipo_natureza === 'Receita' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {c.tipo_natureza}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-200/60">
                  <p><strong className="text-slate-700">Conta Pai:</strong> {c.conta_pai || 'Conta Raiz'}</p>
                </div>

                {isAdmin && (
                  <div className="flex gap-2 pt-2 border-t border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(c)}
                      className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleIniciarExclusao(c.id, c.nome_conta)}
                      className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* VISÃO DESKTOP: TABELA */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-slate-50 text-slate-700 text-xs uppercase font-bold">
                  <th className="p-3">Código</th>
                  <th className="p-3">Nome da Conta</th>
                  <th className="p-3">Conta Pai</th>
                  <th className="p-3">Natureza</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {contas.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 whitespace-nowrap font-bold text-blue-900">{c.codigo_conta}</td>
                    <td className="p-3 font-semibold text-slate-800">{c.nome_conta}</td>
                    <td className="p-3 text-slate-600">{c.conta_pai || '-'}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        c.tipo_natureza === 'Receita' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {c.tipo_natureza}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1 whitespace-nowrap">
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
                            onClick={() => handleIniciarExclusao(c.id, c.nome_conta)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition cursor-pointer"
                          >
                            Excluir
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      {showModal && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4 mb-6 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-black text-blue-900">
                {editingConta ? 'Editar Conta Contábil' : 'Nova Conta Contábil'}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Código da Conta *</label>
                  <input
                    type="text"
                    value={formConta.codigo_conta}
                    onChange={(e) => handleChange('codigo_conta', e.target.value)}
                    placeholder="Ex: 1.1.01, 2.1.02"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Natureza *</label>
                  <select
                    value={formConta.tipo_natureza}
                    onChange={(e) => handleChange('tipo_natureza', e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                    required
                  >
                    <option value="Receita">🟢 Receita</option>
                    <option value="Despesa">🟠 Despesa</option>
                    <option value="Ativo">🔵 Ativo</option>
                    <option value="Passivo">🟣 Passivo</option>
                    <option value="Patrimônio Líquido">⚪ Patrimônio Líquido</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome da Conta *</label>
                <input
                  type="text"
                  value={formConta.nome_conta}
                  onChange={(e) => handleChange('nome_conta', e.target.value)}
                  placeholder="Ex: Dízimos, Ofertas, Água, Luz"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Conta Pai (Opcional)</label>
                <input
                  type="text"
                  value={formConta.conta_pai}
                  onChange={(e) => handleChange('conta_pai', e.target.value)}
                  placeholder="Ex: 1.1 (para subcontas)"
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
                  {editingConta ? 'Salvar alterações' : 'Cadastrar conta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO POR SENHA */}
      {showDeleteModal && contaParaExcluir && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-8 space-y-4">
            <h3 className="text-xl font-black text-rose-700">Confirmar Exclusão</h3>
            <p className="text-sm text-slate-600">
              Você está prestes a excluir a conta <strong className="text-slate-800">{contaParaExcluir.nome_conta}</strong>. Digite sua senha de acesso para continuar:
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
                  onClick={() => { setShowDeleteModal(false); setContaParaExcluir(null); }}
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

    </div>
  );
}