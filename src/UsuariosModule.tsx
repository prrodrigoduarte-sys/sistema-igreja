import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

interface Usuario {
  id: string;
  nome_usuario: string;
  email: string;
  perfil: string;
  ativo: boolean;
  codigo_igreja: string;
}

const MODULOS_SISTEMA = [
  { id: 'dashboard', label: '🏠 Dashboard' },
  { id: 'app-mobile', label: '📱 Aplicativo Mobile' },
  { id: 'cadastros', label: '👥 Cadastros (Membros/Fornecedores/Ministérios)' },
  { id: 'visitantes', label: '🤝 Acompanhamento Visitantes' },
  { id: 'celulas', label: '🏡 Células / Setores / Redes' },
  { id: 'discipulado', label: '🌱 Discipulado (D.E.A. / Agendamentos)' },
  { id: 'agenda', label: '📅 Agenda' },
  { id: 'financeiro', label: '💰 Financeiro' },
  { id: 'projetos', label: '🚀 Projetos' },
  { id: 'configuracoes', label: '⚙️ Configurações & Igreja' },
];

export default function UsuariosModule({ loggedUser }: { loggedUser: any }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);
  const [permissoesSelecionadas, setPermissoesSelecionadas] = useState<string[]>([]);
  const [salvandoPermissoes, setSalvandoPermissoes] = useState(false);

  const codigoIgreja = loggedUser?.codigo_igreja || 'IGR-001';

  const carregarUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('codigo_igreja', codigoIgreja)
        .order('nome_usuario', { ascending: true });

      if (error) throw error;
      setUsuarios(data || []);
    } catch (err: any) {
      alert('Erro ao carregar usuários: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [codigoIgreja]);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  const abrirGerenciamentoPermissoes = async (usr: Usuario) => {
    setUsuarioSelecionado(usr);
    try {
      const { data, error } = await supabase
        .from('permissoes_usuario')
        .select('modulo')
        .eq('usuario_id', usr.id)
        .eq('permitido', true);

      if (error) throw error;
      const modulosAtivos = data ? data.map((item) => item.modulo) : [];
      setPermissoesSelecionadas(modulosAtivos);
    } catch (err: any) {
      console.error('Erro ao buscar permissões:', err);
      setPermissoesSelecionadas([]);
    }
  };

  const toggleModulo = (moduloId: string) => {
    if (permissoesSelecionadas.includes(moduloId)) {
      setPermissoesSelecionadas(permissoesSelecionadas.filter((id) => id !== moduloId));
    } else {
      setPermissoesSelecionadas([...permissoesSelecionadas, moduloId]);
    }
  };

  const salvarPermissoes = async () => {
    if (!usuarioSelecionado) return;
    setSalvandoPermissoes(true);

    try {
      // 1. Limpa as permissões antigas do usuário
      await supabase
        .from('permissoes_usuario')
        .delete()
        .eq('usuario_id', usuarioSelecionado.id);

      // 2. Insere as novas permissões selecionadas
      if (permissoesSelecionadas.length > 0) {
        const registrosInsert = permissoesSelecionadas.map((modId) => ({
          usuario_id: usuarioSelecionado.id,
          modulo: modId,
          permitido: true,
        }));

        const { error } = await supabase
          .from('permissoes_usuario')
          .insert(registrosInsert);

        if (error) throw error;
      }

      alert(`Permissões de ${usuarioSelecionado.nome_usuario} atualizadas com sucesso!`);
      setUsuarioSelecionado(null);
    } catch (err: any) {
      alert('Erro ao salvar permissões: ' + err.message);
    } finally {
      setSalvandoPermissoes(false);
    }
  };

  const toggleStatusUsuario = async (id: string, statusAtual: boolean) => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ ativo: !statusAtual })
        .eq('id', id);

      if (error) throw error;
      carregarUsuarios();
    } catch (err: any) {
      alert('Erro ao alterar status: ' + err.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 max-w-5xl mx-auto shadow-sm space-y-6">
      <div>
        <h2 className="text-2xl font-black text-blue-900">Controle de Usuários e Acessos</h2>
        <p className="text-xs text-slate-500 mt-1">
          Gerencie o status dos usuários e libere quais módulos cada um poderá acessar.
        </p>
      </div>

      {loading ? (
        <p className="text-center text-xs text-slate-500 py-6">Carregando lista...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b bg-slate-50 text-slate-700 font-bold uppercase">
                <th className="p-3">Nome / Usuário</th>
                <th className="p-3">E-mail</th>
                <th className="p-3">Perfil</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {usuarios.map((usr) => (
                <tr key={usr.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-800">{usr.nome_usuario}</td>
                  <td className="p-3 text-slate-600">{usr.email}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                      usr.perfil === 'admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {usr.perfil}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => toggleStatusUsuario(usr.id, usr.ativo)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black cursor-pointer ${
                        usr.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {usr.ativo ? '● ATIVO' : '○ INATIVO'}
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => abrirGerenciamentoPermissoes(usr)}
                      className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl cursor-pointer shadow transition"
                    >
                      🔑 Controlar Módulos
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE PERMISSÕES POR MÓDULO */}
      {usuarioSelecionado && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 space-y-6 my-8">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-lg font-black text-blue-900">Módulos Liberados</h3>
                <p className="text-xs text-slate-500">Usuário: {usuarioSelecionado.nome_usuario}</p>
              </div>
              <button
                type="button"
                onClick={() => setUsuarioSelecionado(null)}
                className="px-3 py-1 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {MODULOS_SISTEMA.map((mod) => {
                const estaPermitido = permissoesSelecionadas.includes(mod.id);
                return (
                  <label
                    key={mod.id}
                    onClick={() => toggleModulo(mod.id)}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer ${
                      estaPermitido ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <span className="text-xs">{mod.label}</span>
                    <input
                      type="checkbox"
                      checked={estaPermitido}
                      onChange={() => {}}
                      className="w-4 h-4 accent-blue-900 cursor-pointer"
                    />
                  </label>
                );
              })}
            </div>

            <div className="flex gap-2 justify-end border-t pt-4">
              <button
                type="button"
                onClick={() => setUsuarioSelecionado(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvarPermissoes}
                disabled={salvandoPermissoes}
                className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow cursor-pointer disabled:opacity-50"
              >
                {salvandoPermissoes ? 'Salvando...' : '💾 Salvar Permissões'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}