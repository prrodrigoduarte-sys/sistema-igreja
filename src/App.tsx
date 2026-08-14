import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function App() {
  // --- SESSÃO E AUTENTICAÇÃO ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedUser, setLoggedUser] = useState<any>(null);
  const [loggedIgreja, setLoggedIgreja] = useState<any>(null);

  // Campos do Login
  const [loginCodigo, setLoginCodigo] = useState('IGR-001');
  const [loginUsuario, setLoginUsuario] = useState('');
  const [loginSenha, setLoginSenha] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // --- NAVEGAÇÃO E TABS ---
  const [activeTab, setActiveTab] = useState<'membros' | 'financeiro' | 'agenda'>('membros');

  // --- DADOS ---
  const [members, setMembers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // --- BUSCAR MEMBROS DO SUPABASE ---
  const fetchMembers = async (codigoIgreja: string) => {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('codigo_igreja', codigoIgreja);
    
    if (!error) {
      setMembers(data || []);
    }
  };

  // --- LOGIN ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*, igrejas(*)')
        .eq('codigo_igreja', loginCodigo.trim())
        .eq('usuario', loginUsuario.trim())
        .eq('senha', loginSenha.trim())
        .eq('ativo', true)
        .single();

      if (error || !data) {
        alert('Usuário ou senha incorretos.');
        return;
      }

      setLoggedUser(data);
      setLoggedIgreja(data.igrejas);
      setIsLoggedIn(true);

      // Busca os membros logo após logar
      fetchMembers(data.codigo_igreja);
    } catch (err: any) {
      alert('Erro no login: ' + err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoggedUser(null);
    setLoggedIgreja(null);
    setMembers([]);
  };

  // Atualiza membros ao mudar de aba se estiver logado
  useEffect(() => {
    if (isLoggedIn && loggedUser?.codigo_igreja && activeTab === 'membros') {
      fetchMembers(loggedUser.codigo_igreja);
    }
  }, [activeTab, isLoggedIn]);

  const filteredMembers = members.filter((m) => !searchTerm || m.nome?.toLowerCase().includes(searchTerm.toLowerCase()));

  // Se não estiver logado
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 space-y-6">
          <div className="text-center">
            <span className="text-3xl font-black text-blue-900 block">BRSYSTEM</span>
            <p className="text-xs text-slate-500 font-semibold mt-1">Gestão de Igrejas</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Código Igreja</label>
              <input type="text" required value={loginCodigo} onChange={(e) => setLoginCodigo(e.target.value)} className="w-full rounded-xl border p-3 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Usuário</label>
              <input type="text" required value={loginUsuario} onChange={(e) => setLoginUsuario(e.target.value)} className="w-full rounded-xl border p-3 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Senha</label>
              <input type="password" required value={loginSenha} onChange={(e) => setLoginSenha(e.target.value)} className="w-full rounded-xl border p-3 text-sm" />
            </div>
            <button type="submit" disabled={loginLoading} className="w-full py-3.5 bg-blue-900 text-white font-bold rounded-xl shadow-lg">
              {loginLoading ? 'Acessando...' : 'Entrar no Sistema'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Tela Principal
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="text-xl font-black text-blue-900">BRSYSTEM</span>
            <nav className="flex items-center gap-6 text-sm font-bold text-blue-900">
              <button 
                onClick={() => setActiveTab('membros')} 
                className={`py-2 ${activeTab === 'membros' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'hover:text-indigo-600'}`}
              >
                📋 Membros
              </button>
              <button 
                onClick={() => setActiveTab('financeiro')} 
                className={`py-2 ${activeTab === 'financeiro' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'hover:text-indigo-600'}`}
              >
                💰 Financeiro
              </button>
              <button 
                onClick={() => setActiveTab('agenda')} 
                className={`py-2 ${activeTab === 'agenda' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'hover:text-indigo-600'}`}
              >
                📅 Agenda
                {/* ABA AGENDA */}
        {activeTab === 'agenda' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">📅 Agenda Integrada de Compromissos</h2>
                <p className="text-xs text-slate-500">Compromissos e eventos cadastrados.</p>
              </div>
              <button onClick={() => setIsAgendaModalOpen(true)} className="px-4 py-2 bg-blue-900 text-white font-bold text-xs rounded-xl shadow">+ Agendar Evento</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {compromissos.length === 0 ? (
                <p className="text-sm text-slate-400">Nenhum compromisso agendado.</p>
              ) : (
                compromissos.map((c) => (
                  <div key={c.id} className="p-4 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-indigo-100 text-indigo-900 rounded-md">Dono: {c.dono_codigo}</span>
                      <span className="text-xs font-mono font-bold text-blue-900">{c.hora_compromisso}</span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900">{c.titulo}</h4>
                    <p className="text-xs text-slate-600">{c.descricao || 'Sem descrição.'}</p>
                    <div className="text-xs text-slate-500 pt-2 border-t">🗓️ {c.data_compromisso} • 📍 {c.local_evento || 'Igreja'}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800">{loggedIgreja?.nome_fantasia || 'Igreja'}</p>
              <p className="text-xs text-slate-500 font-medium">{loggedUser?.nome_usuario}</p>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl">Sair</button>
          </div>
        </div>
      </header>
      <nav className="flex items-center gap-6 text-sm font-bold text-blue-950">
              <button 
                onClick={() => setActiveTab('membros')} 
                className={`py-2 ${activeTab === 'membros' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'hover:text-indigo-600'}`}
              >
                📋 Membros
              </button>
              <button 
                onClick={() => setActiveTab('financeiro')} 
                className={`py-2 ${activeTab === 'financeiro' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'hover:text-indigo-600'}`}
              >
                💰 Financeiro
              </button>
              <button 
                onClick={() => setActiveTab('agenda')} 
                className={`py-2 ${activeTab === 'agenda' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'hover:text-indigo-600'}`}
              >
                📅 Agenda
              </button>
            </nav>

      <main className="max-w-7xl w-full mx-auto p-6 flex-1 space-y-6">
        {activeTab === 'membros' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Cadastro de Membros ({filteredMembers.length})</h2>
                <p className="text-xs text-slate-500">Lista de membros cadastrados na instituição.</p>
              </div>

              <input
                type="text"
                placeholder="Buscar por Nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 rounded-xl border border-slate-300 p-2 text-sm"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-slate-600 text-sm font-semibold">
                    <th className="py-3 px-4">Nome</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">CPF</th>
                    <th className="py-3 px-4">Celular</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm text-slate-700">
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400">Nenhum membro encontrado.</td>
                    </tr>
                  ) : (
                    filteredMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-blue-50/50">
                        <td className="py-3 px-4 font-bold text-slate-900">{m.nome}</td>
                        <td className="py-3 px-4">{m.tipo_cadastro}</td>
                        <td className="py-3 px-4 font-mono">{m.cpf || '-'}</td>
                        <td className="py-3 px-4">{m.celular_principal || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'financeiro' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">Módulo Financeiro</h2>
            <p className="text-sm text-slate-500 mt-2">Próximo passo: vamos conectar os dados financeiros aqui.</p>
          </div>
        )}

        {activeTab === 'agenda' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">Módulo de Agenda</h2>
            <p className="text-sm text-slate-500 mt-2">Próximo passo: vamos conectar os compromissos aqui.</p>
          </div>
        )}
      </main>
    </div>
  );
}