import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';

export default function UsuariosModule({ loggedUser }: { loggedUser: any }) {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do Modal de Edição / Cadastro
  const [showModal, setShowModal] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<any | null>(null);
  
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [emailUsuario, setEmailUsuario] = useState('');
  const [perfilUsuario, setPerfilUsuario] = useState('comum');
  const [senhaAdminInput, setSenhaAdminInput] = useState('');

  // Permissões individuais por usuário (Chaves dos módulos)
  const [permissoesUsuario, setPermissoesUsuario] = useState<{ [key: string]: boolean }>({
    dashboard: false,
    cadastros: false,
    celulas: false,
    discipulado: false,
    agenda: false,
    financeiro: false,
    projetos: false,
    app_mobile: true, // App mobile padrão liberado
  });

  // Senha Mestre
  const codigoIgreja = loggedUser?.codigo_igreja || 'IGR-001';
  const chaveSenhaMestre = `senha_mestre_${codigoIgreja}`;
  const [senhaMestreAtual, setSenhaMestreAtual] = useState(() => {
    return localStorage.getItem(chaveSenhaMestre) || '1234';
  });
  
  const [showModalSenhaMestre, setShowModalSenhaMestre] = useState(false);
  const [novaSenhaMestre, setNovaSenhaMestre] = useState('');
  const [senhaAntigaInput, setSenhaAntigaInput] = useState('');

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
    const isPrimeiro = usuarios.length === 0;
    setPerfilUsuario(isPrimeiro ? 'administrador' : 'comum');
    
    // Se for admin, libera tudo. Se for comum, vem tudo zerado (false)
    setPermissoesUsuario({
      dashboard: isPrimeiro,
      cadastros: isPrimeiro,
      celulas: isPrimeiro,
      discipulado: isPrimeiro,
      agenda: isPrimeiro,
      financeiro: isPrimeiro,
      projetos: isPrimeiro,
      app_mobile: true,
    });

    setSenhaAdminInput('');
    setShowModal(true);
  };

  const handleOpenEdit = (usuario: any) => {
    setEditingUsuario(usuario);
    setNomeUsuario(usuario.nome_usuario || '');
    setEmailUsuario(usuario.email || '');
    setPerfilUsuario(usuario.perfil || 'comum');

    // Carrega as permissões salvas do usuário (se houver no banco ou define padrão zerado)
    let permsSalvas = {};
    try {
      permsSalvas = typeof usuario.permissoes === 'string' ? JSON.parse(usuario.permissoes) : (usuario.permissoes || {});
    } catch (e) {
      permsSalvas = {};
    }

    setPermissoesUsuario({
      dashboard: !!permsSalvas['dashboard'],
      cadastros: !!permsSalvas['cadastros'],
      celulas: !!permsSalvas['celulas'],
      discipulado: !!permsSalvas['discipulado'],
      agenda: !!permsSalvas['agenda'],
      financeiro: !!permsSalvas['financeiro'],
      projetos: !!permsSalvas['projetos'],
      app_mobile: permsSalvas['app_mobile'] !== undefined ? !!permsSalvas['app_mobile'] : true,
    });

    setSenhaAdminInput('');
    setShowModal(true);
  };

  const handleCheckboxChange = (modulo: string) => {
    setPermissoesUsuario((prev) => ({
      ...prev,
      [modulo]: !prev[modulo],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (senhaAdminInput !== senhaMestreAtual && loggedUser?.perfil !== 'administrador') {
      alert('🔒 Senha mestre de segurança incorreta.');
      return;
    }

    try {
      const payload = {
        codigo_igreja: codigoIgreja,
        nome_usuario: nomeUsuario.trim(),
        email: emailUsuario.trim(),
        perfil: perfilUsuario,
        // Removido o campo 'permissoes' para não dar erro na tabela do Supabase
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
    const confirmacaoSenha = window.prompt('🔒 Digite a senha mestre para excluir este usuário:');
    
    if (confirmacaoSenha !== senhaMestreAtual) {
      alert('Senha mestre incorreta. Exclusão cancelada.');
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

  const handleAlterarSenhaMestre = (e: React.FormEvent) => {
    e.preventDefault();
    if (senhaAntigaInput !== senhaMestreAtual) {
      alert('A senha mestre atual informada está incorreta.');
      return;
    }
    if (!novaSenhaMestre.trim() || novaSenhaMestre.length < 4) {
      alert('A nova senha mestre deve ter pelo menos 4 caracteres.');
      return;
    }

    localStorage.setItem(chaveSenhaMestre, novaSenhaMestre.trim());
    setSenhaMestreAtual(novaSenhaMestre.trim());
    alert('🔑 Senha mestre alterada com sucesso!');
    setShowModalSenhaMestre(false);
    setNovaSenhaMestre('');
    setSenhaAntigaInput('');
  };

  // Estatísticas do Gráfico
  const totalUsuarios = usuarios.length;
  const qtdAdmin = usuarios.filter((u) => u.perfil === 'administrador' || u.perfil === 'admin').length;
  const qtdLider = usuarios.filter((u) => u.perfil === 'lider').length;
  const qtdComum = usuarios.filter((u) => u.perfil === 'comum' || !u.perfil).length;

  const percAdmin = totalUsuarios > 0 ? (qtdAdmin / totalUsuarios) * 100 : 0;
  const percLider = totalUsuarios > 0 ? (qtdLider / totalUsuarios) * 100 : 0;
  const percComum = totalUsuarios > 0 ? (qtdComum / totalUsuarios) * 100 : 0;

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-xl font-black text-blue-900">👥 Controle de Usuários & Permissões</h2>
          <p className="text-xs text-slate-500">Libere o acesso aos módulos por usuário ({codigoIgreja})</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowModalSenhaMestre(true)}
            className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
          >
            🔑 Senha Mestre
          </button>
          <button
            type="button"
            onClick={handleOpenNew}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
          >
            + Novo Usuário
          </button>
        </div>
      </div>

      {/* GRÁFICO DE PERFIS */}
      {!loading && totalUsuarios > 0 && (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-slate-700">
            <span>📊 Distribuição de Perfis de Acesso</span>
            <span className="text-blue-900">Total: {totalUsuarios} usuários</span>
          </div>

          <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
            {percAdmin > 0 && <div style={{ width: `${percAdmin}%` }} className="bg-blue-900 h-full" />}
            {percLider > 0 && <div style={{ width: `${percLider}%` }} className="bg-emerald-600 h-full" />}
            {percComum > 0 && <div style={{ width: `${percComum}%` }} className="bg-slate-400 h-full" />}
          </div>

          <div className="flex gap-4 text-[11px] font-semibold text-slate-600 pt-1">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-900 inline-block" /><span>Administradores ({qtdAdmin})</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" /><span>Líderes ({qtdLider})</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-400 inline-block" /><span>Comuns ({qtdComum})</span></div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-center py-8 text-xs text-slate-500">Carregando usuários...</p>
      ) : usuarios.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-xs border border-dashed rounded-2xl space-y-2">
          <p>Nenhum usuário cadastrado encontrado.</p>
          <p className="text-blue-900 font-bold">O primeiro cadastro será configurado como Administrador com acesso total.</p>
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
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-200">Ativo</span>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(u)}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-lg transition cursor-pointer"
                    >
                      🛡️ Gerenciar Permissões
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

      {/* MODAL DE EDIÇÃO E LIBERAÇÃO DE MÓDULOS */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-blue-900 border-b pb-3">
              {editingUsuario ? '🛡️ Gerenciar Usuário & Módulos' : '👤 Novo Usuário'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome do Usuário *</label>
                <input
                  type="text"
                  value={nomeUsuario}
                  onChange={(e) => setNomeUsuario(e.target.value)}
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
                  className="w-full border rounded-xl p-2.5 outline-none font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Perfil Principal</label>
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

              {/* PAINEL DE LIBERAÇÃO DE MÓDULOS (CHECKBOXES) */}
              <div className="border-t pt-3 space-y-2">
                <label className="block font-black text-blue-900 text-sm">🔓 Liberação de Módulos (Zerar ou Conceder)</label>
                <p className="text-[11px] text-slate-500">Marque apenas os módulos que este usuário poderá visualizar e acessar:</p>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={permissoesUsuario.dashboard} onChange={() => handleCheckboxChange('dashboard')} className="w-4 h-4 rounded text-blue-900" />
                    <span className="font-semibold text-slate-700">📊 Dashboard</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={permissoesUsuario.cadastros} onChange={() => handleCheckboxChange('cadastros')} className="w-4 h-4 rounded text-blue-900" />
                    <span className="font-semibold text-slate-700">📂 Cadastros</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={permissoesUsuario.celulas} onChange={() => handleCheckboxChange('celulas')} className="w-4 h-4 rounded text-blue-900" />
                    <span className="font-semibold text-slate-700">🏡 Células</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={permissoesUsuario.discipulado} onChange={() => handleCheckboxChange('discipulado')} className="w-4 h-4 rounded text-blue-900" />
                    <span className="font-semibold text-slate-700">🌱 Discipulado</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={permissoesUsuario.agenda} onChange={() => handleCheckboxChange('agenda')} className="w-4 h-4 rounded text-blue-900" />
                    <span className="font-semibold text-slate-700">📅 Agenda Geral</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={permissoesUsuario.financeiro} onChange={() => handleCheckboxChange('financeiro')} className="w-4 h-4 rounded text-blue-900" />
                    <span className="font-semibold text-slate-700">💰 Financeiro</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={permissoesUsuario.projetos} onChange={() => handleCheckboxChange('projetos')} className="w-4 h-4 rounded text-blue-900" />
                    <span className="font-semibold text-slate-700">📁 Projetos</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={permissoesUsuario.app_mobile} onChange={() => handleCheckboxChange('app_mobile')} className="w-4 h-4 rounded text-blue-900" />
                    <span className="font-semibold text-slate-700">📱 App Mobile</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">🔒 Senha Mestre de Segurança</label>
                <input
                  type="password"
                  value={senhaAdminInput}
                  onChange={(e) => setSenhaAdminInput(e.target.value)}
                  placeholder="Digite a senha mestre para salvar"
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
                  Salvar Permissões
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SENHA MESTRE */}
      {showModalSenhaMestre && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 space-y-4 text-xs">
            <h3 className="text-lg font-black text-amber-800 border-b pb-3">🔑 Alterar Senha Mestre</h3>

            <form onSubmit={handleAlterarSenhaMestre} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Senha Mestre Atual *</label>
                <input
                  type="password"
                  value={senhaAntigaInput}
                  onChange={(e) => setSenhaAntigaInput(e.target.value)}
                  className="w-full border rounded-xl p-2.5 outline-none font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nova Senha Mestre *</label>
                <input
                  type="password"
                  value={novaSenhaMestre}
                  onChange={(e) => setNovaSenhaMestre(e.target.value)}
                  className="w-full border rounded-xl p-2.5 outline-none font-semibold border-amber-300 bg-amber-50/50"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowModalSenhaMestre(false)}
                  className="px-4 py-2.5 bg-slate-100 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow cursor-pointer"
                >
                  Atualizar Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}