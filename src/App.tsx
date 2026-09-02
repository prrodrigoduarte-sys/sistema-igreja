// src/App.tsx
// Versão com login e menu completo, incluindo submenu para Cadastros.

import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import ProjetosModule from './ProjetosModule'; // Módulo de Projetos (temporário)

// Importe os módulos para cada nova aba aqui, se já os tiver criado.
// Exemplo:
// import CadastrosModule from './CadastrosModule';
// import AgendaModule from './AgendaModule';
// import CelulaModule from './CelulaModule';
// import FinanceiroModule from './FinanceiroModule';
// import IgrejaModule from './IgrejaModule';
// import ConfiguracoesModule from './ConfiguracoesModule';


function App() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [loggedUser, setLoggedUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // Aba ativa padrão
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true); // Para alternar entre login e cadastro
  const [isCadastrosOpen, setIsCadastrosOpen] = useState(false); // Estado para controlar a abertura do submenu Cadastros

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      if (session) {
        const { data: user, error } = await supabase
          .from('usuarios')
          .select('*, igrejas(*)')
          .eq('id', session.user.id)
          .single();
        if (error) {
          console.error('Erro ao buscar usuário:', error);
        } else {
          setLoggedUser(user);
        }
      } else {
        setLoggedUser(null);
      }
    };
    fetchUser();
  }, [session]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error: any) {
      alert(error.error_description || error.message);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      alert('Verifique seu e-mail para confirmar o cadastro!');
    } catch (error: any) {
      alert(error.error_description || error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLoggedUser(null);
    setActiveTab('dashboard'); // Volta para a dashboard após logout
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-700">Carregando...</div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-6">
          <h2 className="text-3xl font-black text-blue-900 text-center">
            {isLogin ? 'BEM-VINDO DE VOLTA!' : 'CRIE SUA CONTA'}
          </h2>
          <p className="text-center text-slate-600">
            {isLogin ? 'Faça login para continuar.' : 'Cadastre-se para acessar o sistema.'}
          </p>
          <form onSubmit={isLogin ? handleLogin : handleSignUp} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">E-MAIL</label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">SENHA</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 rounded-xl shadow-md transition-all"
            >
              {isLogin ? 'ENTRAR' : 'CADASTRE-SE'}
            </button>
          </form>
          <div className="text-center text-sm mt-4">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-700 hover:text-blue-900 font-semibold"
            >
              {isLogin ? 'Não tem uma conta? Cadastre-se!' : 'Já tem uma conta? Faça login!'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* MENU LATERAL */}
      <div className="w-64 bg-blue-900 text-white shadow-lg flex flex-col">
        <div className="p-6 border-b border-blue-800">
          <h1 className="text-2xl font-black tracking-wide">SISTEMA IGREJA</h1>
          <p className="text-xs text-blue-200 mt-1">Olá, {loggedUser?.nome || loggedUser?.email || 'Usuário'}!</p>
        </div>
        <nav className="flex-grow p-4 space-y-2">
          <button
            onClick={() => { setActiveTab('dashboard'); setIsCadastrosOpen(false); }}
            className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'dashboard' ? 'bg-blue-700' : 'hover:bg-blue-800'
            }`}
          >
            🏠 Dashboard
          </button>

          {/* Menu Cadastros com Submenu */}
          <div>
            <button
              onClick={() => { setIsCadastrosOpen(!isCadastrosOpen); setActiveTab('cadastros'); }}
              className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-colors flex justify-between items-center ${
                activeTab.startsWith('cadastros') ? 'bg-blue-700' : 'hover:bg-blue-800'
              }`}
            >
              <span>👥 Cadastros</span>
              <span>{isCadastrosOpen ? '▲' : '▼'}</span>
            </button>
            {isCadastrosOpen && (
              <div className="ml-4 mt-1 space-y-1">
                <button
                  onClick={() => setActiveTab('cadastros-fornecedores')}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'cadastros-fornecedores' ? 'bg-blue-600' : 'hover:bg-blue-700'
                  }`}
                >
                  Fornecedores
                </button>
                <button
                  onClick={() => setActiveTab('cadastros-membros')}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'cadastros-membros' ? 'bg-blue-600' : 'hover:bg-blue-700'
                  }`}
                >
                  Membros
                </button>
                <button
                  onClick={() => setActiveTab('cadastros-ministerios')}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'cadastros-ministerios' ? 'bg-blue-600' : 'hover:bg-blue-700'
                  }`}
                >
                  Ministérios
                </button>
                <button
                  onClick={() => setActiveTab('cadastros-usuario')}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'cadastros-usuario' ? 'bg-blue-600' : 'hover:bg-blue-700'
                  }`}
                >
                  Usuário
                </button>
                <button
                  onClick={() => setActiveTab('cadastros-relatorio')}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'cadastros-relatorio' ? 'bg-blue-600' : 'hover:bg-blue-700'
                  }`}
                >
                  Relatório
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => { setActiveTab('agenda'); setIsCadastrosOpen(false); }}
            className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'agenda' ? 'bg-blue-700' : 'hover:bg-blue-800'
            }`}
          >
            📅 Agenda
          </button>
          <button
            onClick={() => { setActiveTab('celula'); setIsCadastrosOpen(false); }}
            className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'celula' ? 'bg-blue-700' : 'hover:bg-blue-800'
            }`}
          >
            🌱 Célula
          </button>
          <button
            onClick={() => { setActiveTab('financeiro'); setIsCadastrosOpen(false); }}
            className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'financeiro' ? 'bg-blue-700' : 'hover:bg-blue-800'
            }`}
          >
            💰 Financeiro
          </button>
          <button
            onClick={() => { setActiveTab('igreja'); setIsCadastrosOpen(false); }}
            className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'igreja' ? 'bg-blue-700' : 'hover:bg-blue-800'
            }`}
          >
            ⛪ Igreja
          </button>
          <button
            onClick={() => { setActiveTab('configuracoes'); setIsCadastrosOpen(false); }}
            className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'configuracoes' ? 'bg-blue-700' : 'hover:bg-blue-800'
            }`}
          >
            ⚙️ Configurações
          </button>
          <button
            onClick={() => { setActiveTab('projetos'); setIsCadastrosOpen(false); }}
            className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'projetos' ? 'bg-blue-700' : 'hover:bg-blue-800'
            }`}
          >
            🚀 Projetos
          </button>
        </nav>
        <div className="p-4 border-t border-blue-800">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 rounded-lg font-medium text-red-300 hover:bg-blue-800 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-grow p-8">
        {activeTab === 'dashboard' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-blue-900 tracking-tight">Dashboard</h2>
            <p className="text-slate-600 mt-2">Bem-vindo à sua dashboard!</p>
          </div>
        )}

        {/* Conteúdo para Cadastros e seus submenus */}
        {(activeTab === 'cadastros' || activeTab.startsWith('cadastros-')) && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-blue-900 tracking-tight">
              {activeTab === 'cadastros' && 'Cadastros'}
              {activeTab === 'cadastros-fornecedores' && 'Cadastros: Fornecedores'}
              {activeTab === 'cadastros-membros' && 'Cadastros: Membros'}
              {activeTab === 'cadastros-ministerios' && 'Cadastros: Ministérios'}
              {activeTab === 'cadastros-usuario' && 'Cadastros: Usuário'}
              {activeTab === 'cadastros-relatorio' && 'Cadastros: Relatório'}
            </h2>
            <p className="text-slate-600 mt-2">
              Conteúdo da seção de {activeTab.replace('cadastros-', '').replace('cadastros', 'Cadastros')}.
            </p>
          </div>
        )}

        {activeTab === 'agenda' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-blue-900 tracking-tight">Agenda</h2>
            <p className="text-slate-600 mt-2">Conteúdo da seção de Agenda.</p>
          </div>
        )}

        {activeTab === 'celula' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-blue-900 tracking-tight">Célula</h2>
            <p className="text-slate-600 mt-2">Conteúdo da seção de Célula.</p>
          </div>
        )}

        {activeTab === 'financeiro' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-blue-900 tracking-tight">Financeiro</h2>
            <p className="text-slate-600 mt-2">Conteúdo da seção de Financeiro.</p>
          </div>
        )}

        {activeTab === 'igreja' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-blue-900 tracking-tight">Igreja</h2>
            <p className="text-slate-600 mt-2">Conteúdo da seção de Igreja.</p>
          </div>
        )}

        {activeTab === 'configuracoes' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-blue-900 tracking-tight">Configurações</h2>
            <p className="text-slate-600 mt-2">Conteúdo da seção de Configurações.</p>
          </div>
        )}

        {activeTab === 'projetos' && (
          <ProjetosModule loggedUser={loggedUser} />
        )}
      </main>
    </div>
  );
}

export default App;