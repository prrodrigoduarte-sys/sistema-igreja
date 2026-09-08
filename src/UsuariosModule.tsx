import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';

export default function UsuariosModule({ loggedUser }: { loggedUser: any }) {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do Modal de Cadastro/Edição
  const [showModal, setShowModal] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<any | null>(null);
  
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [emailUsuario, setEmailUsuario] = useState('');
  const [perfilUsuario, setPerfilUsuario] = useState('comum');
  const [senhaAdmin, setSenhaAdmin] = useState('');

  const codigoIgreja = loggedUser?.codigo_igreja || 'IGR-001';

  useEffect(() => {
    carregarUsuarios();
  }, [codigoIgreja]);

  const carregarUsuarios = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('codigo_igreja', codigoIgreja);

      if (error) throw error;
      setUsuarios(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar usuários:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNew = () => {
    setEditingUsuario(null);
    setNomeUsuario('');
    setEmailUsuario('');
    setPerfilUsuario('comum');
    setSenhaAdmin('');
    setShowModal(true);
  };

  const handleOpenEdit = (usuario: any) => {
    setEditingUsuario(usuario);
    setNomeUsuario(usuario.nome_usuario || '');
    setEmailUsuario(usuario.email || '');
    setPerfilUsuario(usuario.perfil || 'comum');
    setSenhaAdmin('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (senhaAdmin !== '1234' && loggedUser?.perfil !== 'administrador') {
      alert('🔒 Senha de segurança incorreta ou acesso não autorizado.');
      return;
    }

    try {
      const payload = {
        codigo_igreja: codigoIgreja,
        nome_usuario: nomeUsuario.trim(),
        email: emailUsuario.trim(),
        perfil: perfilUsuario,
      };

      if (editingUsuario) {
        const { error } = await supabase
          .from('usuarios')
          .update(payload)
          .eq('id', editingUsuario.id);

        if (error) throw error;
        alert('✏️ Usuário atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('usuarios').insert([payload]);
        if (error) throw error;
        alert('👤 Novo usuário cadastrado com sucesso!');
      }

      setShowModal(false);
      carregarUsuarios();
    } catch (err: any) {
      alert('Erro ao salvar usuário: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmacaoSenha = window.prompt('🔒 Digite a senha administrativa para excluir este usuário:');
    
    if (confirmacaoSenha !== '1234') {
      alert('Senha incorreta. Exclusão cancelada.');
      return;
    }

    try {
      const { error } = await supabase.from('usuarios').delete().eq('id', id);
      if (error) throw error;

      alert('🗑️ Usuário excluído com sucesso.');
      carregarUsuarios();
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-xl font-black text-blue-900">👥 Controle de Usuários</h2>
          <p className="text-xs text-slate-500">Gerencie os acessos e permissões dos membros da igreja ({codigoIgreja})</p>
        </div>
        <button
          type="button"
          onClick={handleOpenNew}
          className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
        >
          + Novo Usuário
        </button>
      </div>

      {loading ? (
        <p className="text-center py-8 text-xs text-slate-500">Carregando usuários...</p>
      ) : usuarios.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-xs border border-dashed rounded-2xl">
          Nenhum usuário cadastrado encontrado para esta igreja.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase">
              <tr>
                <th className="p-3">Nome</th>
                <th className="p-3">E-mail</th>
                <th className="p-3">Perfil</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-800">{u.nome_usuario || 'Sem nome'}</td>
                  <td className="p-3 text-slate-600">{u.email}</td>
                  <td className="p-3 font-semibold text-blue-900">{u.perfil || 'comum'}</td>
                  <td className="p-3">
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-200">
                      Ativo
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(u)}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-lg transition cursor-pointer"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(u.id)}
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg transition cursor-pointer"
                    >
                      🗑️ Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 space-y-4 text-xs">
            <h3 className="text-lg font-black text-blue-900 border-b pb-3">
              {editingUsuario ? '✏️ Editar Usuário' : '👤 Novo Usuário'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome do Usuário *</label>
                <input
                  type="text"
                  value={nomeUsuario}
                  onChange={(e) => setNomeUsuario(e.target.value)}
                  placeholder="Ex: Rodrigo"
                  className="w-full border rounded-xl p-2.5 outline-none font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">E-mail *</label>
                <input
                  type="email"
                  value={emailUsuario}
                  onChange={(e) => setEmailUsuario(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="w-full border rounded-xl p-2.5 outline-none font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Perfil de Acesso</label>
                <select
                  value={perfilUsuario}
                  onChange={(e) => setPerfilUsuario(e.target.value)}
                  className="w-full border rounded-xl p-2.5 bg-white outline-none font-semibold"
                >
                  <option value="comum">Comum</option>
                  <option value="lider">Líder</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">🔒 Senha de Segurança (Admin)</label>
                <input
                  type="password"
                  value={senhaAdmin}
                  onChange={(e) => setSenhaAdmin(e.target.value)}
                  placeholder="Digite a senha para autorizar"
                  className="w-full border rounded-xl p-2.5 outline-none font-semibold border-amber-300 bg-amber-50/50"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}