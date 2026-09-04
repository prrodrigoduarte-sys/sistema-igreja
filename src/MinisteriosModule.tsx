// src/MinisteriosModule.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

interface Ministerio {
  id: string;
  codigo_igreja: string;
  nome: string;
  descricao: string;
}

interface MinisteriosModuleProps {
  loggedUser: any;
}

const formInicial = {
  nome: '',
  descricao: '',
};

export default function MinisteriosModule({ loggedUser }: MinisteriosModuleProps) {
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [editingMinisterio, setEditingMinisterio] = useState<Ministerio | null>(null);
  const [ministerioSelecionado, setMinisterioSelecionado] = useState<Ministerio | null>(null);
  const [ministerioParaExcluir, setMinisterioParaExcluir] = useState<{ id: string; nome: string } | null>(null);

  const [senhaExclusao, setSenhaExclusao] = useState('');
  const [formMinisterio, setFormMinisterio] = useState(formInicial);

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
        .from('ministerios')
        .select('*')
        .eq('codigo_igreja', codigoIgreja);

      if (termoBusca.trim() !== '') {
        query = query.ilike('nome', `%${termoBusca.trim()}%`);
      } else {
        query = query.limit(20);
      }

      const { data, error: erroConsulta } = await query;

      if (erroConsulta) throw erroConsulta;

      setMinisterios(data || []);
    } catch (erro: any) {
      console.error('Erro ao buscar ministérios:', erro);
      setMinisterios([]);
      setError(erro?.message || 'Erro ao buscar ministérios.');
    } finally {
      setLoading(false);
    }
  }, [codigoIgreja, termoBusca]);

  useEffect(() => {
    if (!loggedUser || !codigoIgreja) return;
    handlePesquisar();
  }, [loggedUser, codigoIgreja, handlePesquisar]);

  const handleOpenNew = () => {
    setEditingMinisterio(null);
    setFormMinisterio(formInicial);
    setShowModal(true);
  };

  const handleOpenEdit = (m: Ministerio) => {
    setEditingMinisterio(m);
    setFormMinisterio({
      nome: m.nome || '',
      descricao: m.descricao || '',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMinisterio(null);
    setFormMinisterio(formInicial);
  };

  const handleChange = (campo: string, valor: any) => {
    setFormMinisterio((prev) => ({
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
        ...formMinisterio,
        codigo_igreja: codigoIgreja,
      };

      if (editingMinisterio) {
        const { error: updateError } = await supabase
          .from('ministerios')
          .update(payload)
          .eq('id', editingMinisterio.id);

        if (updateError) throw updateError;
        alert('Ministério atualizado com sucesso!');
      } else {
        const { error: insertError } = await supabase
          .from('ministerios')
          .insert([payload]);

        if (insertError) throw insertError;
        alert('Ministério cadastrado com sucesso!');
      }

      handleCloseModal();
      handlePesquisar();
    } catch (err: any) {
      console.error('Erro ao salvar ministério:', err);
      alert('Erro ao salvar ministério: ' + (err.message || 'Erro desconhecido'));
    }
  };

  const handleIniciarExclusao = (id: string, nome: string) => {
    setMinisterioParaExcluir({ id, nome });
    setSenhaExclusao('');
    setShowDeleteModal(true);
  };

  const confirmarExclusaoComSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ministerioParaExcluir) return;

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
        .from('ministerios')
        .delete()
        .eq('id', ministerioParaExcluir.id);

      if (deleteError) throw deleteError;

      alert('Ministério excluído com sucesso!');
      setShowDeleteModal(false);
      setMinisterioParaExcluir(null);
      setSenhaExclusao('');
      handlePesquisar();
    } catch (err: any) {
      console.error('Erro ao excluir ministério:', err);
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
            Cadastros: Ministérios
          </h2>
          <p className="text-slate-600 mt-1">
            Pesquise e gerencie os ministérios e departamentos da igreja.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer shrink-0"
        >
          + Novo Ministério
        </button>
      </div>

      {/* Barra de Pesquisa */}
      <form onSubmit={handlePesquisar} className="flex gap-2">
        <input
          type="text"
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
          placeholder="Pesquisar pelo nome do ministério..."
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
      {loading && <p className="text-slate-500 py-4">Buscando ministérios...</p>}
      {error && <p className="text-red-500 py-4">Erro: {error}</p>}

      {!loading && !error && ministerios.length === 0 && (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <p className="text-slate-500">Nenhum ministério encontrado.</p>
        </div>
      )}

      {!loading && !error && ministerios.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-slate-50 text-slate-700 text-xs uppercase font-bold">
                <th className="p-3">Nome do Ministério</th>
                <th className="p-3">Descrição</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {ministerios.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 font-semibold text-slate-800">{m.nome}</td>
                  <td className="p-3 text-slate-600 truncate max-w-md">{m.descricao || '-'}</td>
                  <td className="p-3 text-right space-x-1 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => { setMinisterioSelecionado(m); setShowDetalhesModal(true); }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition cursor-pointer"
                    >
                      Ver Detalhes
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(m)}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-lg transition cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleIniciarExclusao(m.id, m.nome)}
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
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 my-8">
            <div className="flex justify-between items-center border-b pb-4 mb-6">
              <h3 className="text-xl font-black text-blue-900">
                {editingMinisterio ? 'Editar Ministério' : 'Novo Ministério'}
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
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome do Ministério *</label>
                <input
                  type="text"
                  value={formMinisterio.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  placeholder="Ex: Louvor, Jovens, Diaconia"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Descrição</label>
                <textarea
                  value={formMinisterio.descricao}
                  onChange={(e) => handleChange('descricao', e.target.value)}
                  placeholder="Breve descrição das atividades do ministério..."
                  rows={4}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
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
                  {editingMinisterio ? 'Salvar alterações' : 'Cadastrar ministério'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO POR SENHA */}
      {showDeleteModal && ministerioParaExcluir && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-4">
            <h3 className="text-xl font-black text-rose-700">Confirmar Exclusão</h3>
            <p className="text-sm text-slate-600">
              Você está prestes a excluir o ministério <strong className="text-slate-800">{ministerioParaExcluir.nome}</strong>. Digite sua senha de acesso para continuar:
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
                  onClick={() => { setShowDeleteModal(false); setMinisterioParaExcluir(null); }}
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
      {showDetalhesModal && ministerioSelecionado && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 space-y-4">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-xl font-black text-blue-900">Detalhes do Ministério</h3>
              <button
                type="button"
                onClick={() => setShowDetalhesModal(false)}
                className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="block text-xs font-bold text-slate-400 uppercase">Nome</span>
                <span className="font-semibold text-slate-800">{ministerioSelecionado.nome}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="block text-xs font-bold text-slate-400 uppercase">Descrição</span>
                <span className="text-slate-700">{ministerioSelecionado.descricao || 'Nenhuma descrição informada.'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}