// src/FornecedoresModule.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

interface Fornecedor {
  id: string;
  codigo_igreja: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj_cpf: string;
  categoria: string;
  telefone: string;
  email: string;
  contato_responsavel: string;
  cidade_uf: string;
  observacoes: string;
  ativo: boolean;
}

interface FornecedoresModuleProps {
  loggedUser: any;
}

const formInicial = {
  razao_social: '',
  nome_fantasia: '',
  cnpj_cpf: '',
  categoria: 'Geral',
  telefone: '',
  email: '',
  contato_responsavel: '',
  cidade_uf: '',
  observacoes: '',
  ativo: true,
};

export default function FornecedoresModule({ loggedUser }: FornecedoresModuleProps) {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState<Fornecedor | null>(null);
  const [fornecedorParaExcluir, setFornecedorParaExcluir] = useState<{ id: string; nome: string } | null>(null);

  const [senhaExclusao, setSenhaExclusao] = useState('');
  const [formFornecedor, setFormFornecedor] = useState(formInicial);

  const codigoIgreja =
    loggedUser?.codigo_igreja ||
    loggedUser?.igrejas?.codigo_igreja;

  const handlePesquisar = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!codigoIgreja) {
      setError('Código da igreja não encontrado.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('fornecedores')
        .select('*')
        .eq('codigo_igreja', codigoIgreja);

      if (termoBusca.trim() !== '') {
        query = query.or(`razao_social.ilike.%${termoBusca.trim()}%,nome_fantasia.ilike.%${termoBusca.trim()}%`);
      } else {
        query = query.limit(15);
      }

      const { data, error: erroConsulta } = await query;

      if (erroConsulta) throw erroConsulta;

      setFornecedores(data || []);
    } catch (erro: any) {
      console.error('Erro ao buscar fornecedores:', erro);
      setFornecedores([]);
      setError(erro?.message || 'Erro ao buscar fornecedores.');
    } finally {
      setLoading(false);
    }
  }, [codigoIgreja, termoBusca]);

  useEffect(() => {
    if (!loggedUser || !codigoIgreja) return;
    handlePesquisar();
  }, [loggedUser, codigoIgreja, handlePesquisar]);

  const handleOpenNew = () => {
    setEditingFornecedor(null);
    setFormFornecedor(formInicial);
    setShowModal(true);
  };

  const handleOpenEdit = (f: Fornecedor) => {
    setEditingFornecedor(f);
    setFormFornecedor({
      razao_social: f.razao_social || '',
      nome_fantasia: f.nome_fantasia || '',
      cnpj_cpf: f.cnpj_cpf || '',
      categoria: f.categoria || 'Geral',
      telefone: f.telefone || '',
      email: f.email || '',
      contato_responsavel: f.contato_responsavel || '',
      cidade_uf: f.cidade_uf || '',
      observacoes: f.observacoes || '',
      ativo: f.ativo ?? true,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingFornecedor(null);
    setFormFornecedor(formInicial);
  };

  const handleChange = (campo: string, valor: any) => {
    setFormFornecedor((prev) => ({
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
        ...formFornecedor,
        codigo_igreja: codigoIgreja,
      };

      if (editingFornecedor) {
        const { error: updateError } = await supabase
          .from('fornecedores')
          .update(payload)
          .eq('id', editingFornecedor.id);

        if (updateError) throw updateError;
        alert('Fornecedor atualizado com sucesso!');
      } else {
        const { error: insertError } = await supabase
          .from('fornecedores')
          .insert([payload]);

        if (insertError) throw insertError;
        alert('Fornecedor cadastrado com sucesso!');
      }

      handleCloseModal();
      handlePesquisar();
    } catch (err: any) {
      console.error('Erro ao salvar fornecedor:', err);
      alert('Erro ao salvar fornecedor: ' + (err.message || 'Erro desconhecido'));
    }
  };

  const handleIniciarExclusao = (id: string, nome: string) => {
    setFornecedorParaExcluir({ id, nome });
    setSenhaExclusao('');
    setShowDeleteModal(true);
  };

  const confirmarExclusaoComSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fornecedorParaExcluir) return;

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
        .from('fornecedores')
        .delete()
        .eq('id', fornecedorParaExcluir.id);

      if (deleteError) throw deleteError;

      alert('Fornecedor excluído com sucesso!');
      setShowDeleteModal(false);
      setFornecedorParaExcluir(null);
      setSenhaExclusao('');
      handlePesquisar();
    } catch (err: any) {
      console.error('Erro ao excluir fornecedor:', err);
      alert('Erro ao excluir: ' + (err.message || 'Erro desconhecido'));
    }
  };

  if (!loggedUser) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-6xl mx-auto">
        <p className="text-slate-500">Carregando informações do usuário...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-6xl mx-auto space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-blue-900 tracking-tight">
            Cadastros: Fornecedores
          </h2>
          <p className="text-slate-600 mt-1">
            Pesquise e gerencie os fornecedores e prestadores de serviços.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer shrink-0"
        >
          + Novo Fornecedor
        </button>
      </div>

      {/* Barra de Pesquisa */}
      <form onSubmit={handlePesquisar} className="flex gap-2">
        <input
          type="text"
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
          placeholder="Pesquisar por Razão Social ou Nome Fantasia..."
          className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded-xl transition cursor-pointer"
        >
          Pesquisar
        </button>
      </form>

      {/* Listagem */}
      {loading && <p className="text-slate-500 py-4">Buscando fornecedores...</p>}
      {error && <p className="text-red-500 py-4">Erro: {error}</p>}

      {!loading && !error && fornecedores.length === 0 && (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <p className="text-slate-500">Nenhum fornecedor encontrado.</p>
        </div>
      )}

      {!loading && !error && fornecedores.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-slate-50 text-slate-700 text-xs uppercase font-bold">
                <th className="p-3">Nome Fantasia / Razão Social</th>
                <th className="p-3">Categoria</th>
                <th className="p-3">Telefone</th>
                <th className="p-3">E-mail</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {fornecedores.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3">
                    <p className="font-semibold text-slate-800">{f.nome_fantasia || f.razao_social}</p>
                    <p className="text-xs text-slate-500">{f.razao_social}</p>
                  </td>
                  <td className="p-3 text-slate-600">
                    <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">
                      {f.categoria || 'Geral'}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">{f.telefone || '-'}</td>
                  <td className="p-3 text-slate-600">{f.email || '-'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs font-bold rounded-lg ${f.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {f.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-1 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => { setFornecedorSelecionado(f); setShowDetalhesModal(true); }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition cursor-pointer"
                    >
                      Ver Completo
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(f)}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-lg transition cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleIniciarExclusao(f.id, f.nome_fantasia || f.razao_social)}
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
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl p-8 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4 mb-6 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-black text-blue-900">
                {editingFornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
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
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Razão Social *</label>
                  <input
                    type="text"
                    value={formFornecedor.razao_social}
                    onChange={(e) => handleChange('razao_social', e.target.value)}
                    placeholder="Razão Social Ltda"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome Fantasia</label>
                  <input
                    type="text"
                    value={formFornecedor.nome_fantasia}
                    onChange={(e) => handleChange('nome_fantasia', e.target.value)}
                    placeholder="Nome Fantasia"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">CNPJ / CPF</label>
                  <input
                    type="text"
                    value={formFornecedor.cnpj_cpf}
                    onChange={(e) => handleChange('cnpj_cpf', e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Categoria</label>
                  <input
                    type="text"
                    value={formFornecedor.categoria}
                    onChange={(e) => handleChange('categoria', e.target.value)}
                    placeholder="Ex: Manutenção, Papelaria, etc."
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Telefone</label>
                  <input
                    type="text"
                    value={formFornecedor.telefone}
                    onChange={(e) => handleChange('telefone', e.target.value)}
                    placeholder="(00) 0000-0000"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">E-mail</label>
                  <input
                    type="email"
                    value={formFornecedor.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="contato@fornecedor.com"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contato Responsável</label>
                  <input
                    type="text"
                    value={formFornecedor.contato_responsavel}
                    onChange={(e) => handleChange('contato_responsavel', e.target.value)}
                    placeholder="Nome do representante"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cidade / UF</label>
                  <input
                    type="text"
                    value={formFornecedor.cidade_uf}
                    onChange={(e) => handleChange('cidade_uf', e.target.value)}
                    placeholder="Teófilo Otoni - MG"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Observações</label>
                  <textarea
                    value={formFornecedor.observacoes}
                    onChange={(e) => handleChange('observacoes', e.target.value)}
                    placeholder="Informações adicionais..."
                    rows={3}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="ativo_fornecedor"
                    checked={formFornecedor.ativo}
                    onChange={(e) => handleChange('ativo', e.target.checked)}
                    className="w-4 h-4 text-blue-900 rounded border-slate-300"
                  />
                  <label htmlFor="ativo_fornecedor" className="text-sm font-semibold text-slate-700 cursor-pointer">
                    Fornecedor Ativo
                  </label>
                </div>

              </div>

              <div className="flex justify-end gap-3 pt-6 mt-6 border-t sticky bottom-0 bg-white z-10">
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
                  {editingFornecedor ? 'Salvar alterações' : 'Cadastrar fornecedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO POR SENHA */}
      {showDeleteModal && fornecedorParaExcluir && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-4">
            <h3 className="text-xl font-black text-rose-700">Confirmar Exclusão</h3>
            <p className="text-sm text-slate-600">
              Você está prestes a excluir o fornecedor <strong className="text-slate-800">{fornecedorParaExcluir.nome}</strong>. Digite sua senha de acesso para continuar:
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
                  onClick={() => { setShowDeleteModal(false); setFornecedorParaExcluir(null); }}
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
      {showDetalhesModal && fornecedorSelecionado && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 my-8 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="text-xl font-black text-blue-900">Ficha do Fornecedor</h3>
                <p className="text-xs text-slate-500">{fornecedorSelecionado.nome_fantasia || fornecedorSelecionado.razao_social}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDetalhesModal(false)}
                className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-50 p-3 rounded-xl"><span className="block text-xs font-bold text-slate-400 uppercase">Razão Social</span>{fornecedorSelecionado.razao_social}</div>
              <div className="bg-slate-50 p-3 rounded-xl"><span className="block text-xs font-bold text-slate-400 uppercase">Nome Fantasia</span>{fornecedorSelecionado.nome_fantasia || '-'}</div>
              <div className="bg-slate-50 p-3 rounded-xl"><span className="block text-xs font-bold text-slate-400 uppercase">CNPJ / CPF</span>{fornecedorSelecionado.cnpj_cpf || '-'}</div>
              <div className="bg-slate-50 p-3 rounded-xl"><span className="block text-xs font-bold text-slate-400 uppercase">Categoria</span>{fornecedorSelecionado.categoria || '-'}</div>
              <div className="bg-slate-50 p-3 rounded-xl"><span className="block text-xs font-bold text-slate-400 uppercase">Telefone</span>{fornecedorSelecionado.telefone || '-'}</div>
              <div className="bg-slate-50 p-3 rounded-xl"><span className="block text-xs font-bold text-slate-400 uppercase">E-mail</span>{fornecedorSelecionado.email || '-'}</div>
              <div className="bg-slate-50 p-3 rounded-xl"><span className="block text-xs font-bold text-slate-400 uppercase">Responsável</span>{fornecedorSelecionado.contato_responsavel || '-'}</div>
              <div className="bg-slate-50 p-3 rounded-xl"><span className="block text-xs font-bold text-slate-400 uppercase">Cidade / UF</span>{fornecedorSelecionado.cidade_uf || '-'}</div>
              <div className="sm:col-span-2 bg-slate-50 p-3 rounded-xl"><span className="block text-xs font-bold text-slate-400 uppercase">Observações</span>{fornecedorSelecionado.observacoes || '-'}</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}