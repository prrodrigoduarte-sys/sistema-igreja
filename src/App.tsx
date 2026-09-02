// src/App.tsx
// Versão com login e menu básico, focando na estrutura.

import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import ProjetosModule from './ProjetosModule'; // Importa o módulo de Projetos

function App() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [loggedUser, setLoggedUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // Aba ativa padrão
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true); // Para alternar entre login e cadastro

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
              {isLogin ? 'ENTRAR' : 'CADASTRAR'}
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
            onClick={() => setActiveTab('dashboard')}
            className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'dashboard' ? 'bg-blue-700' : 'hover:bg-blue-800'
            }`}
          >
            🏠 Dashboard
          </button>
          <button
            onClick={() => setActiveTab('projetos')}
            className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'projetos' ? 'bg-blue-700' : 'hover:bg-blue-800'
            }`}
          >
            🚀 Projetos
          </button>
          {/* Adicione outros itens de menu aqui, se desejar */}
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

        {activeTab === 'projetos' && (
          <ProjetosModule loggedUser={loggedUser} />
        )}

        {/* Outras abas de conteúdo iriam aqui */}
      </main>
    </div>
  );
}

export default App;