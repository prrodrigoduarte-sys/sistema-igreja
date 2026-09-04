// src/UsuariosModule.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

interface Usuario {
  id: string;
  codigo_igreja: string;
  usuario: string;
  nome_usuario: string;
  ativo: boolean;
  permissao_mobile: boolean;
  permissao_computador: boolean;
  auth_user_id: string;
}

interface UsuariosModuleProps {
  loggedUser: any;
}

const formInicial = {
  codigo_igreja: '',
  usuario: '',
  senha: '',
  nome_usuario: '',
  ativo: true,
  permissao_mobile: false,
  permissao_computador: true,
  auth_user_id: '',
};

export default function UsuariosModule({ loggedUser }: UsuariosModuleProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [formUsuario, setFormUsuario] = useState(formInicial);

  const codigoIgrejaAtual =
    loggedUser?.codigo_igreja ||
    loggedUser?.igrejas?.codigo_igreja;

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!codigoIgrejaAtual) {
        throw new Error('Código da igreja não identificado no usuário logado.');
      }

      const { data, error: errConsulta } = await supabase
        .from('usuarios')
        .select('*')
        .eq('codigo_igreja', codigoIgrejaAtual);

      if (errConsulta) throw errConsulta;

      setUsuarios(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar usuários:', err);
      setUsuarios([]);
      setError(err?.message || 'Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  }, [codigoIgrejaAtual]);

  useEffect(() => {
    if (!loggedUser) return;
    fetchUsuarios();
  }, [loggedUser, fetchUsuarios]);

  const handleOpenNew = () => {
    setEditingUsuario(null);
    setFormUsuario({
      ...formInicial,
      codigo_igreja: codigoIgrejaAtual || '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (usu: Usuario) => {
    setEditingUsuario(usu);
    setFormUsuario({
      codigo_igreja: usu.codigo_igreja || codigoIgrejaAtual || '',
      usuario: usu.usuario || '',
      senha: '', // senha em branco por segurança na edição
      nome_usuario: usu.nome_usuario || '',
      ativo: usu.ativo ?? true,
      permissao_mobile: usu.permissao_mobile ?? false,
      permissao_computador: usu.permissao_computador ?? true,
      auth_user_id: usu.auth_user_id || '',
    });
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingUsuario(null);
    setFormUsuario(formInicial);
  };

  const handleChange = (campo: string, valor: any) => {
    setFormUsuario((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingUsuario) {
        // Atualização
        const payload: any = {
          nome_usuario: formUsuario.nome_usuario,
          usuario: formUsuario.usuario,
          ativo: formUsuario.ativo,
          permissao_mobile: formUsuario.permissao_mobile,
          permissao_computador: formUsuario.permissao_computador,
        };

        const { error: errUpdate } = await supabase
          .from('usuarios')
          .update(payload)
          .eq('id', editingUsuario.id);

        if (errUpdate) throw errUpdate;
        alert('Usuário atualizado com sucesso!');
      } else {
        // Criação de novo usuário no Auth e na tabela usuarios
        // 1. Cria no Auth do Supabase
        const { data: authData, error: errAuth } = await supabase.auth.signUp({
          email: formUsuario.usuario, // assumindo que o campo 'usuario' seja o e-mail de login
          password: formUsuario.senha,
        });

        if (errAuth) throw errAuth;

        const newAuthId = authData.user?.id;

        // 2. Insere na tabela 'usuarios' vinculando o auth_user_id e o codigo_igreja
        const { error: errInsert } = await supabase.from('usuarios').insert([
          {
            codigo_igreja: codigoIgrejaAtual,
            usuario: formUsuario.usuario,
            senha: formUsuario.senha, // se sua aplicação salvar texto puro na coluna senha
            nome_usuario: formUsuario.nome_usuario,
            ativo: formUsuario.ativo,
            permissao_mobile: formUsuario.permissao_mobile,
            permissao_computador: formUsuario.permissao_computador,
            auth_user_id: newAuthId || null,
          },
        ]);

        if (errInsert) throw errInsert;
        alert('Usuário cadastrado com sucesso!');
      }

      handleClose();
      fetchUsuarios();
    } catch (err: any) {
      console.error('Erro ao salvar usuário:', err);
      alert('Erro ao salvar: ' + (err.message || 'Erro desconhecido'));
    }
  };

  if (!loggedUser) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-5xl mx-auto">
        <p className="text-slate-500">Carregando dados do usuário...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-black text-blue-900 tracking-tight">
            Cadastros: Usuários do Sistema
          </h2>
          <p className="text-slate-600 mt-1">
            Gerencie os acessos e permissões para a igreja ({codigoIgrejaAtual}).
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer"
        >
          + Novo Usuário
        </button>
      </div>

      {loading && <p className="text-slate-500">Carregando usuários...</p>}
      {error && <p className="text-red-500">Erro: {error}</p>}

      {!loading && !error && usuarios.length === 0 && (
        <p className="text-slate-500 mt-4">Nenhum usuário cadastrado.</p>
      )}

      {!loading && !error && usuarios.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-slate-50 text-slate-700 text-xs uppercase font-bold">
                <th className="p-3">Nome</th>
                <th className="p-3">Usuário / Login</th>
                <th className="p-3">Status</th>
                <th className="p-3">Permissões</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 font-semibold text-slate-800">{u.nome_usuario}</td>
                  <td className="p-3 text-slate-600">{u.usuario}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs font-bold rounded-lg ${u.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-slate-600">
                    {u.permissao_computador && <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded mr-1">Computador</span>}
                    {u.permissao_mobile && <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">Mobile</span>}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(u)}
                      className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-lg transition"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-8 my-8">
            <div className="flex justify-between items-center border-b pb-4 mb-6">
              <h3 className="text-xl font-black text-blue-900">
                {editingUsuario ? 'Editar Usuário' : 'Novo Usuário'}
              </h3>
              <button
                type="button"
                onClick={handleClose}
                className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl transition"
              >
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome Completo do Usuário *</label>
                <input
                  type="text"
                  value={formUsuario.nome_usuario}
                  onChange={(e) => handleChange('nome_usuario', e.target.value)}
                  placeholder="Ex: Administrador"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">E-mail / Login (Usuário) *</label>
                <input
                  type="email"
                  value={formUsuario.usuario}
                  onChange={(e) => handleChange('usuario', e.target.value)}
                  placeholder="admin@igreja.com"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {!editingUsuario && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Senha de Acesso *</label>
                  <input
                    type="password"
                    value={formUsuario.senha}
                    onChange={(e) => handleChange('senha', e.target.value)}
                    placeholder="Mínimo de 6 caracteres"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formUsuario.ativo}
                    onChange={(e) => handleChange('ativo', e.target.checked)}
                    className="w-4 h-4 text-blue-900 rounded border-slate-300"
                  />
                  <span className="text-sm font-semibold text-slate-700">Usuário Ativo</span>
                </label>
              </div>

              <div className="border-t pt-4 space-y-2">
                <p className="text-xs font-bold text-slate-700 uppercase">Permissões de Acesso</p>
                
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formUsuario.permissao_computador}
                      onChange={(e) => handleChange('permissao_computador', e.target.checked)}
                      className="w-4 h-4 text-blue-900 rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-700">Computador (Web)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formUsuario.permissao_mobile}
                      onChange={(e) => handleChange('permissao_mobile', e.target.checked)}
                      className="w-4 h-4 text-blue-900 rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-700">Aplicativo Mobile</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md transition"
                >
                  {editingUsuario ? 'Salvar alterações' : 'Criar usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}