// src/FinanceiroModule.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

interface Lancamento {
  id: string;
  codigo_igreja: string;
  data_lancamento: string;
  tipo: 'receita' | 'despesa';
  descricao: string;
  valor: number;
  conta_corrente_id: string;
  id_conta_contabil: string;
}

interface ContaContabil {
  id: string;
  codigo_conta: string;
  nome_conta: string;
  tipo_natureza: string;
  conta_pai?: string;
}

interface ContaCorrente {
  id: string;
  nome_conta_corrente: string;
  banco: string;
}

interface FinanceiroModuleProps {
  loggedUser: any;
}

const formLancamentoInicial = {
  data_lancamento: new Date().toISOString().split('T')[0],
  tipo: 'receita' as 'receita' | 'despesa',
  descricao: '',
  valor: '',
  conta_corrente_id: '',
  id_conta_contabil: '',
};

const formContaInicial = {
  codigo_conta: '',
  nome_conta: '',
  conta_pai: '',
  tipo_natureza: 'Despesa',
};

export default function FinanceiroModule({ loggedUser }: FinanceiroModuleProps) {
  const [subAba, setSubAba] = useState<'lancamentos' | 'plano_contas'>('lancamentos');

  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [contasContabeis, setContasContabeis] = useState<ContaContabil[]>([]);
  const [contasCorrentes, setContasCorrentes] = useState<ContaCorrente[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modais Lançamentos
  const [showModalLancamento, setShowModalLancamento] = useState(false);
  const [formLancamento, setFormLancamento] = useState(formLancamentoInicial);

  // Modais Plano de Contas
  const [contasPlano, setContasPlano] = useState<ContaContabil[]>([]);
  const [showModalConta, setShowModalConta] = useState(false);
  const [editingConta, setEditingConta] = useState<ContaContabil | null>(null);
  const [formConta, setFormConta] = useState(formContaInicial);

  // Exclusão com senha
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemParaExcluir, setItemParaExcluir] = useState<{ id: string; tipo: 'lancamento' | 'conta'; nome: string } | null>(null);
  const [senhaExclusao, setSenhaExclusao] = useState('');

  const codigoIgreja = loggedUser?.codigo_igreja || loggedUser?.igrejas?.codigo_igreja || 'IGR-001';

  const fetchDados = useCallback(async () => {
    if (!codigoIgreja) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Lançamentos
      const resLanc = await supabase
        .from('lancamentos_financeiros')
        .select('*')
        .eq('codigo_igreja', codigoIgreja)
        .order('data_lancamento', { ascending: false });

      if (!resLanc.error) setLancamentos(resLanc.data || []);

      // 2. Plano de Contas
      const resPlano = await supabase
        .from('plano_contas_contabil')
        .select('*')
        .eq('codigo_igreja', codigoIgreja)
        .order('codigo_conta', { ascending: true });

      if (!resPlano.error) {
        setContasContabeis(resPlano.data || []);
        setContasPlano(resPlano.data || []);
      }

      // 3. Contas Correntes
      const resCc = await supabase
        .from('contas_correntes')
        .select('*')
        .eq('codigo_igreja', codigoIgreja);

      if (!resCc.error && resCc.data) {
        setContasCorrentes(resCc.data);
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [codigoIgreja]);

  useEffect(() => {
    if (!loggedUser) return;
    fetchDados();
  }, [loggedUser, fetchDados]);

  // Salvar Lançamento
  const handleSubmitLancamento = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        codigo_igreja: codigoIgreja,
        data_lancamento: formLancamento.data_lancamento,
        tipo: formLancamento.tipo,
        descricao: formLancamento.descricao,
        valor: parseFloat(formLancamento.valor as string),
        conta_corrente_id: formLancamento.conta_corrente_id || null,
        id_conta_contabil: formLancamento.id_conta_contabil || null,
      };

      const { error } = await supabase.from('lancamentos_financeiros').insert([payload]);
      if (error) throw error;

      alert('Lançamento realizado com sucesso!');
      setShowModalLancamento(false);
      setFormLancamento(formLancamentoInicial);
      fetchDados();
    } catch (err: any) {
      alert('Erro ao salvar lançamento: ' + err.message);
    }
  };

  // Salvar ou Atualizar Conta do Plano de Contas (Exige senha na edição para segurança)
  const handleSubmitConta = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formConta, codigo_igreja: codigoIgreja };

      if (editingConta) {
        // Se estiver editando, exige senha de confirmação do admin por segurança
        const emailUsuario = loggedUser?.usuario || loggedUser?.email;
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: emailUsuario,
          password: senhaExclusao, // Reutilizamos o campo de senha do modal de edição/exclusão
        });

        if (authError) {
          alert('Senha incorreta! A alteração da conta contábil foi cancelada.');
          return;
        }

        const { error } = await supabase
          .from('plano_contas_contabil')
          .update(payload)
          .eq('id', editingConta.id);

        if (error) throw error;
        alert('Conta contábil atualizada com sucesso!');
      } else {
        const { error } = await supabase.from('plano_contas_contabil').insert([payload]);
        if (error) throw error;
        alert('Conta cadastrada com sucesso!');
      }

      setShowModalConta(false);
      setEditingConta(null);
      setFormConta(formContaInicial);
      setSenhaExclusao('');
      fetchDados();
    } catch (err: any) {
      alert('Erro ao salvar conta: ' + err.message);
    }
  };

  // Exclusão Segura por Senha
  const confirmarExclusao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemParaExcluir) return;

    try {
      const emailUsuario = loggedUser?.usuario || loggedUser?.email;
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: emailUsuario,
        password: senhaExclusao,
      });

      if (authError) {
        alert('Senha incorreta! Exclusão cancelada.');
        return;
      }

      const tabela = itemParaExcluir.tipo === 'lancamento' ? 'lancamentos_financeiros' : 'plano_contas_contabil';
      const { error } = await supabase.from(tabela).delete().eq('id', itemParaExcluir.id);
      if (error) throw error;

      alert('Item excluído com sucesso!');
      setShowDeleteModal(false);
      setItemParaExcluir(null);
      setSenhaExclusao('');
      fetchDados();
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const getNomeContaContabil = (id: string) => {
    const c = contasContabeis.find((x) => x.id === id);
    return c ? `${c.codigo_conta} - ${c.nome_conta}` : 'Não vinculada';
  };

  const getNomeContaCorrente = (id: string) => {
    const cc = contasCorrentes.find((x) => x.id === id);
    return cc ? cc.nome_conta_corrente : 'Caixa Geral / Dinheiro';
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 w-full max-w-6xl mx-auto space-y-6">
      
      {/* Cabeçalho e Abas */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-blue-900 tracking-tight">
            Gestão Financeira & Contábil
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Controle de Caixa e Plano Contábil ({codigoIgreja})
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setSubAba('lancamentos')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              subAba === 'lancamentos' ? 'bg-blue-900 text-white shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            💸 Lançamentos
          </button>
          <button
            type="button"
            onClick={() => setSubAba('plano_contas')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              subAba === 'plano_contas' ? 'bg-blue-900 text-white shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 Plano de Contas
          </button>
        </div>
      </div>

      {/* BOTÕES DE AÇÃO */}
      <div className="flex justify-end">
        {subAba === 'lancamentos' && (
          <button
            type="button"
            onClick={() => {
              setFormLancamento(formLancamentoInicial);
              setShowModalLancamento(true);
            }}
            className="px-4 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow transition cursor-pointer"
          >
            + Novo Lançamento
          </button>
        )}

        {subAba === 'plano_contas' && (
          <button
            type="button"
            onClick={() => {
              setEditingConta(null);
              setFormConta(formContaInicial);
              setSenhaExclusao('');
              setShowModalConta(true);
            }}
            className="px-4 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow transition cursor-pointer"
          >
            + Nova Conta Contábil
          </button>
        )}
      </div>

      {loading && <p className="text-center py-6 text-slate-500">Carregando dados financeiros...</p>}
      {error && <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">{error}</div>}

      {/* TABELA DE LANÇAMENTOS */}
      {!loading && subAba === 'lancamentos' && (
        <>
          {lancamentos.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <p className="text-slate-500 text-sm">Nenhum lançamento financeiro registrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-700 text-xs uppercase font-bold">
                    <th className="p-3">Data</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Descrição</th>
                    <th className="p-3">Conta Corrente (Admin)</th>
                    <th className="p-3">Conta Contábil (DRE)</th>
                    <th className="p-3 text-right">Valor</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {lancamentos.map((l) => {
                    const isReceita = l.tipo === 'receita';
                    return (
                      <tr key={l.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 whitespace-nowrap text-slate-600">
                          {l.data_lancamento ? l.data_lancamento.split('-').reverse().join('/') : '-'}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            isReceita ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {isReceita ? '🟢 Receita' : '🔴 Despesa'}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-800">{l.descricao}</td>
                        <td className="p-3 text-slate-600 text-xs">{getNomeContaCorrente(l.conta_corrente_id)}</td>
                        <td className="p-3 text-blue-900 font-medium text-xs">{getNomeContaContabil(l.id_conta_contabil)}</td>
                        <td className={`p-3 text-right font-black ${isReceita ? 'text-emerald-700' : 'text-rose-700'}`}>
                          R$ {Number(l.valor || 0).toFixed(2)}
                        </td>
                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setItemParaExcluir({ id: l.id, tipo: 'lancamento', nome: l.descricao });
                              setSenhaExclusao('');
                              setShowDeleteModal(true);
                            }}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition cursor-pointer"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* TABELA DE PLANO DE CONTAS */}
      {!loading && subAba === 'plano_contas' && (
        <>
          {contasPlano.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <p className="text-slate-500 text-sm">Nenhuma conta cadastrada no plano de contas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-700 text-xs uppercase font-bold">
                    <th className="p-3">Código</th>
                    <th className="p-3">Nome da Conta</th>
                    <th className="p-3">Natureza</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {contasPlano.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-bold text-blue-900">{c.codigo_conta}</td>
                      <td className="p-3 font-semibold text-slate-800">{c.nome_conta}</td>
                      <td className="p-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border">
                          {c.tipo_natureza}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingConta(c);
                            setFormConta({
                              codigo_conta: c.codigo_conta,
                              nome_conta: c.nome_conta,
                              conta_pai: c.conta_pai || '',
                              tipo_natureza: c.tipo_natureza,
                            });
                            setSenhaExclusao('');
                            setShowModalConta(true);
                          }}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-lg transition cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setItemParaExcluir({ id: c.id, tipo: 'conta', nome: c.nome_conta });
                            setSenhaExclusao('');
                            setShowDeleteModal(true);
                          }}
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
        </>
      )}

      {/* MODAL DE NOVO LANÇAMENTO */}
      {showModalLancamento && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4 mb-6 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-black text-blue-900">Novo Lançamento Financeiro</h3>
              <button
                type="button"
                onClick={() => setShowModalLancamento(false)}
                className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleSubmitLancamento} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo *</label>
                  <select
                    value={formLancamento.tipo}
                    onChange={(e) => setFormLancamento({ ...formLancamento, tipo: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none bg-white font-medium"
                    required
                  >
                    <option value="receita">🟢 Receita (Entrada)</option>
                    <option value="despesa">🔴 Despesa (Saída)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Data *</label>
                  <input
                    type="date"
                    value={formLancamento.data_lancamento}
                    onChange={(e) => setFormLancamento({ ...formLancamento, data_lancamento: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Descrição *</label>
                <input
                  type="text"
                  value={formLancamento.descricao}
                  onChange={(e) => setFormLancamento({ ...formLancamento, descricao: e.target.value })}
                  placeholder="Ex: Dízimos do Culto, Conta de Luz"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Valor (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formLancamento.valor}
                  onChange={(e) => setFormLancamento({ ...formLancamento, valor: e.target.value })}
                  placeholder="0.00"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none font-bold text-blue-900"
                  required
                />
              </div>

              {/* CONTA CORRENTE */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  🏦 Conta Corrente / Caixa (Admin)
                </label>
                <select
                  value={formLancamento.conta_corrente_id}
                  onChange={(e) => setFormLancamento({ ...formLancamento, conta_corrente_id: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none bg-white"
                >
                  <option value="">Caixa Geral / Dinheiro (Padrão)</option>
                  {contasCorrentes.map((cc) => (
                    <option key={cc.id} value={cc.id}>{cc.nome_conta_corrente}</option>
                  ))}
                </select>
              </div>

              {/* PLANO DE CONTAS */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  📊 Conta do Plano de Contas (Contábil / DRE) *
                </label>
                <select
                  value={formLancamento.id_conta_contabil}
                  onChange={(e) => setFormLancamento({ ...formLancamento, id_conta_contabil: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none bg-white font-medium"
                  required
                >
                  <option value="">Selecione a conta do plano contábil...</option>
                  {contasContabeis.map((c) => (
                    <option key={c.id} value={c.id}>{c.codigo_conta} - {c.nome_conta} ({c.tipo_natureza})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModalLancamento(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-900 text-white font-bold text-sm rounded-xl shadow cursor-pointer"
                >
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE PLANO DE CONTAS (NOVO OU EDIÇÃO COM SENHA) */}
      {showModalConta && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-8 space-y-4">
            <h3 className="text-xl font-black text-blue-900">
              {editingConta ? 'Editar Conta Contábil' : 'Nova Conta Contábil'}
            </h3>
            
            <form onSubmit={handleSubmitConta} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Código da Conta *</label>
                <input
                  type="text"
                  value={formConta.codigo_conta}
                  onChange={(e) => setFormConta({ ...formConta, codigo_conta: e.target.value })}
                  placeholder="Ex: 3.1.01.01"
                  className="w-full border rounded-xl px-3 py-2 text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome da Conta *</label>
                <input
                  type="text"
                  value={formConta.nome_conta}
                  onChange={(e) => setFormConta({ ...formConta, nome_conta: e.target.value })}
                  placeholder="Ex: Dízimos Recebidos"
                  className="w-full border rounded-xl px-3 py-2 text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Natureza *</label>
                <select
                  value={formConta.tipo_natureza}
                  onChange={(e) => setFormConta({ ...formConta, tipo_natureza: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 text-sm bg-white"
                  required
                >
                  <option value="Receita">Receita</option>
                  <option value="Despesa">Despesa</option>
                  <option value="Ativo">Ativo</option>
                  <option value="Passivo">Passivo</option>
                </select>
              </div>

              {/* SE ESTIVER EDITANDO, EXIGE SENHA DE CONFIRMAÇÃO DO ADMIN */}
              {editingConta && (
                <div className="pt-2 border-t">
                  <label className="block text-xs font-bold text-rose-700 mb-1">Digite sua Senha de Administrador para Alterar *</label>
                  <input
                    type="password"
                    value={senhaExclusao}
                    onChange={(e) => setSenhaExclusao(e.target.value)}
                    placeholder="Sua senha atual"
                    className="w-full border border-rose-300 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModalConta(false); setEditingConta(null); }}
                  className="px-4 py-2 bg-slate-100 text-sm font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 text-white text-sm font-bold rounded-xl cursor-pointer shadow"
                >
                  {editingConta ? 'Salvar Alterações' : 'Cadastrar Conta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EXCLUSÃO COM SENHA */}
      {showDeleteModal && itemParaExcluir && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-8 space-y-4">
            <h3 className="text-xl font-black text-rose-700">Confirmar Exclusão</h3>
            <p className="text-sm text-slate-600">
              Você vai excluir <strong className="text-slate-800">{itemParaExcluir.nome}</strong>. Digite sua senha para confirmar:
            </p>
            <form onSubmit={confirmarExclusao} className="space-y-4">
              <input
                type="password"
                value={senhaExclusao}
                onChange={(e) => setSenhaExclusao(e.target.value)}
                placeholder="Sua senha atual"
                className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-500"
                required
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-slate-100 text-sm font-bold rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-rose-600 text-white text-sm font-bold rounded-xl cursor-pointer">Confirmar Exclusão</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}