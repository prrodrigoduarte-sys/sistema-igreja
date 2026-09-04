// src/App.tsx

import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import ProjetosModule from './ProjetosModule';
import MembrosModule from './MembrosModule';
import UsuariosModule from './UsuariosModule';

function App() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [loggedUser, setLoggedUser] = useState<any>(null);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCadastrosOpen, setIsCadastrosOpen] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    const carregarSessao = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);
      setLoading(false);
    };

    carregarSessao();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, novaSessao) => {
      setSession(novaSessao);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const carregarUsuario = async () => {
      if (!session?.user?.id) {
        console.log('Nenhuma sessão autenticada encontrada.');
        setLoggedUser(null);
        return;
      }

      console.log('ID do usuário autenticado:', session.user.id);

      // Consulta direta na tabela usuarios pelo auth_user_id ou id
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .or(`auth_user_id.eq.${session.user.id},id.eq.${session.user.id}`)
        .maybeSingle();

      console.log('Usuário retornado pela tabela usuarios:', data);
      console.log('Erro ao buscar usuário:', error);

      if (error || !data) {
        console.error('Erro ou usuário não encontrado na tabela usuarios:', error);
        // Fallback para não travar a aplicação caso o registro na tabela usuarios demore a ser criado
        setLoggedUser({
          codigo_igreja: 'IGR-001', // Ajuste padrão ou deixe null se preferir
          nome_usuario: session.user.email,
          ...session.user,
        });
        return;
      }

      setLoggedUser(data);
    };

    carregarUsuario();
  }, [session]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    }
  };

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert('Verifique seu e-mail para confirmar o cadastro.');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLoggedUser(null);
    setActiveTab('dashboard');
  };

  const selecionarAba = (aba: string) => {
    setActiveTab(aba);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700 font-bold">
        Carregando sistema...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <h2 className="text-3xl font-black text-blue-900 text-center">
            {isLogin ? 'BEM-VINDO DE VOLTA!' : 'CRIE SUA CONTA'}
          </h2>

          <p className="text-center text-slate-600 mt-2 mb-6">
            {isLogin
              ? 'Faça login para continuar.'
              : 'Cadastre-se para acessar o sistema.'}
          </p>

          <form
            onSubmit={isLogin ? handleLogin : handleSignUp}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                E-MAIL
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                SENHA
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Digite sua senha"
                required
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 rounded-xl transition cursor-pointer"
            >
              {isLogin ? 'ENTRAR' : 'CADASTRAR'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="w-full mt-5 text-blue-700 font-semibold text-sm hover:underline"
          >
            {isLogin
              ? 'Não tem uma conta? Cadastre-se'
              : 'Já tem uma conta? Fazer login'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 bg-blue-900 text-white flex flex-col">
        <div className="p-6 border-b border-blue-800">
          <h1 className="text-2xl font-black">SISTEMA IGREJA</h1>

          <p className="text-xs text-blue-200 mt-2 truncate">
            Olá, {loggedUser?.nome_usuario || loggedUser?.email || session.user.email}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            type="button"
            onClick={() => selecionarAba('dashboard')}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-blue-700'
                : 'hover:bg-blue-800'
            }`}
          >
            🏠 Dashboard
          </button>

          <button
            type="button"
            onClick={() => {
              setIsCadastrosOpen(!isCadastrosOpen);
            }}
            className={`w-full text-left px-4 py-3 rounded-lg flex justify-between items-center font-medium transition cursor-pointer ${
              activeTab.startsWith('cadastros')
                ? 'bg-blue-700'
                : 'hover:bg-blue-800'
            }`}
          >
            <span>👥 Cadastros</span>
            <span>{isCadastrosOpen ? '▲' : '▼'}</span>
          </button>

          {isCadastrosOpen && (
            <div className="ml-4 space-y-1 border-l-2 border-blue-700 pl-2">
              <button
                type="button"
                onClick={() => selecionarAba('cadastros-membros')}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                  activeTab === 'cadastros-membros'
                    ? 'bg-blue-600'
                    : 'hover:bg-blue-700/80'
                }`}
              >
                Membros
              </button>

              <button
                type="button"
                onClick={() => selecionarAba('cadastros-fornecedores')}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                  activeTab === 'cadastros-fornecedores'
                    ? 'bg-blue-600'
                    : 'hover:bg-blue-700/80'
                }`}
              >
                Fornecedores
              </button>

              <button
                type="button"
                onClick={() => selecionarAba('cadastros-ministerios')}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                  activeTab === 'cadastros-ministerios'
                    ? 'bg-blue-600'
                    : 'hover:bg-blue-700/80'
                }`}
              >
                Ministérios
              </button>

              <button
                type="button"
                onClick={() => selecionarAba('cadastros-usuario')}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                  activeTab === 'cadastros-usuario'
                    ? 'bg-blue-600'
                    : 'hover:bg-blue-700/80'
                }`}
              >
                Usuários
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => selecionarAba('agenda')}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'agenda' ? 'bg-blue-700' : 'hover:bg-blue-800'
            }`}
          >
            📅 Agenda
          </button>

          <button
            type="button"
            onClick={() => selecionarAba('financeiro')}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'financeiro' ? 'bg-blue-700' : 'hover:bg-blue-800'
            }`}
          >
            💰 Financeiro
          </button>

          <button
            type="button"
            onClick={() => selecionarAba('projetos')}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'projetos' ? 'bg-blue-700' : 'hover:bg-blue-800'
            }`}
          >
            🚀 Projetos
          </button>
        </nav>

        <div className="p-4 border-t border-blue-800">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 rounded-lg text-red-300 hover:bg-blue-800 font-medium transition cursor-pointer"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 max-w-5xl mx-auto shadow-sm">
            <h2 className="text-3xl font-black text-blue-900">
              Dashboard
            </h2>

            <p className="text-slate-600 mt-2">
              Bem-vindo ao sistema da igreja. Navegue pelas opções ao lado para gerenciar os dados.
            </p>
          </div>
        )}

        {activeTab === 'cadastros-membros' && (
          <MembrosModule loggedUser={loggedUser} />
        )}

        {activeTab === 'cadastros-usuario' && (
          <UsuariosModule loggedUser={loggedUser} />
        )}

        {activeTab === 'projetos' && (
          <ProjetosModule loggedUser={loggedUser} />
        )}

        {activeTab === 'cadastros-fornecedores' && (
          <TelaProvisoria titulo="Fornecedores" />
        )}

        {activeTab === 'cadastros-ministerios' && (
          <TelaProvisoria titulo="Ministérios" />
        )}

        {activeTab === 'agenda' && (
          <TelaProvisoria titulo="Agenda" />
        )}

        {activeTab === 'financeiro' && (
          <TelaProvisoria titulo="Financeiro" />
        )}
      </main>
    </div>
  );
}

function TelaProvisoria({ titulo }: { titulo: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 max-w-5xl mx-auto shadow-sm">
      <h2 className="text-3xl font-black text-blue-900">
        {titulo}
      </h2>

      <p className="text-slate-600 mt-2">
        Esta seção está pronta para receber a implementação do módulo correspondente.
      </p>
    </div>
  );
}

export default App;