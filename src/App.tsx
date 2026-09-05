// src/App.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import ProjetosModule from './ProjetosModule';
import MembrosModule from './MembrosModule';
import FornecedoresModule from './FornecedoresModule';
import MinisteriosModule from './MinisteriosModule';
import UsuariosModule from './UsuariosModule';
import CadastroPublico from './CadastroPublico';
import AgendaModule from './AgendaModule';
import FinanceiroModule from './FinanceiroModule';
import ControleRegistroModule from './ControleRegistroModule';
import CelulasModule from './CelulasModule';
import AcompanhamentoVisitantesModule from './AcompanhamentoVisitantesModule';

function App() {
  const [rotaPublica, setRotaPublica] = useState(
    window.location.hash.includes('cadastro') || window.location.pathname.includes('cadastro')
  );

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [loggedUser, setLoggedUser] = useState<any>(null);
  const [precisaCompletarPerfil, setPrecisaCompletarPerfil] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCadastrosOpen, setIsCadastrosOpen] = useState(false);
  const [isCelulasOpen, setIsCelulasOpen] = useState(true);
  const [subAbaCelulas, setSubAbaCelulas] = useState<'celulas' | 'setores' | 'redes'>('celulas');
  const [isConfiguracoesOpen, setIsConfiguracoesOpen] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  // Estados de Autenticação e Cadastro
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [codigoIgreja, setCodigoIgreja] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  // Estados para o QR Code Temporário
  const [qrCodeUrlDinamico, setQrCodeUrlDinamico] = useState('');
  const [gerandoQr, setGerandoQr] = useState(false);

  const isAdmin = loggedUser?.perfil === 'admin' || loggedUser?.perfil === 'administrador';

  const gerarNovoQrCodeTemporario = async () => {
    if (!isAdmin) {
      alert('Apenas administradores podem gerar o QR Code temporário.');
      return;
    }
    if (!loggedUser) return;
    setGerandoQr(true);

    try {
      const igrejaAtual = loggedUser.codigo_igreja;
      const tokenUnico = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const dataExpiracao = new Date(new Date().getTime() + 6 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase.from('tokens_cadastro_temporario').insert([
        {
          codigo_igreja: igrejaAtual,
          token: tokenUnico,
          expira_em: dataExpiracao,
        },
      ]);

      if (error) throw error;

      const linkCompleto = `${window.location.origin}${window.location.pathname}#cadastro?token=${tokenUnico}`;
      const novaUrlQr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(linkCompleto)}`;
      
      setQrCodeUrlDinamico(novaUrlQr);
    } catch (err: any) {
      console.error('Erro ao gerar QR Code:', err);
      alert('Erro ao gerar QR Code temporário.');
    } finally {
      setGerandoQr(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setQrCodeUrlDinamico('');
        setIsMobileModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      setRotaPublica(window.location.hash.includes('cadastro') || window.location.pathname.includes('cadastro'));
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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
      if (!session?.user?.email) {
        setLoggedUser(null);
        setPrecisaCompletarPerfil(false);
        return;
      }

      const emailUsuario = session.user.email;

      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', emailUsuario)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar perfil:', error);
      }

      if (!data) {
        setPrecisaCompletarPerfil(true);
        setLoggedUser(null);
        return;
      }

      setPrecisaCompletarPerfil(false);
      setLoggedUser(data);
    };

    carregarUsuario();
  }, [session]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  };

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!nomeUsuario || !codigoIgreja) {
      alert('Preencha o Nome de Usuário e o Código da Igreja.');
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      alert('Erro no cadastro (Auth): ' + authError.message);
      return;
    }

    const authUserId = authData.user?.id || authData.session?.user?.id;

    const { error: profileError } = await supabase.from('usuarios').insert([
      {
        auth_user_id: authUserId || null,
        email,
        nome_usuario: nomeUsuario,
        codigo_igreja: codigoIgreja.toUpperCase().trim(),
        perfil: 'admin',
        ativo: true,
      },
    ]);

    if (profileError) {
      alert('Erro ao criar perfil do usuário: ' + profileError.message);
      return;
    }

    alert('Conta cadastrada com sucesso! Faça login para entrar.');
    setIsLogin(true);
  };

  const handleCompletarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeUsuario || !codigoIgreja) {
      alert('Preencha todos os campos.');
      return;
    }

    const { error } = await supabase.from('usuarios').insert([
      {
        auth_user_id: session.user.id,
        email: session.user.email,
        nome_usuario: nomeUsuario,
        codigo_igreja: codigoIgreja.toUpperCase().trim(),
        perfil: 'admin',
        ativo: true,
      },
    ]);

    if (error) {
      alert('Erro ao salvar perfil: ' + error.message);
      return;
    }

    window.location.reload();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLoggedUser(null);
    setPrecisaCompletarPerfil(false);
    setActiveTab('dashboard');
  };

  const selecionarAba = (aba: string) => {
    setActiveTab(aba);
  };

  if (rotaPublica) {
    return <CadastroPublico />;
  }

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
            {isLogin ? 'Faça login para continuar.' : 'Cadastre sua igreja e seu usuário administrador.'}
          </p>

          <form onSubmit={isLogin ? handleLogin : handleSignUp} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">NOME DO USUÁRIO</label>
                  <input
                    type="text"
                    value={nomeUsuario}
                    onChange={(e) => setNomeUsuario(e.target.value)}
                    placeholder="Seu nome"
                    required
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CÓDIGO DA IGREJA (Ex: IGR-001)</label>
                  <input
                    type="text"
                    value={codigoIgreja}
                    onChange={(e) => setCodigoIgreja(e.target.value)}
                    placeholder="IGR-001"
                    required
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 uppercase"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">E-MAIL</label>
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
              <label className="block text-xs font-bold text-slate-700 mb-1">SENHA</label>
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
              {isLogin ? 'ENTRAR' : 'CADASTRAR CONTA'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="w-full mt-5 text-blue-700 font-semibold text-sm hover:underline cursor-pointer"
          >
            {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Fazer login'}
          </button>
        </div>
      </div>
    );
  }

  if (precisaCompletarPerfil) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-4">
          <h2 className="text-2xl font-black text-blue-900 text-center">COMPLETE SEU CADASTRO</h2>
          <p className="text-xs text-slate-600 text-center">
            Sua conta de e-mail <span className="font-bold">{session.user.email}</span> foi autenticada, mas precisamos vincular seu nome e o código da sua igreja.
          </p>

          <form onSubmit={handleCompletarPerfil} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">NOME DO USUÁRIO</label>
              <input
                type="text"
                value={nomeUsuario}
                onChange={(e) => setNomeUsuario(e.target.value)}
                placeholder="Seu nome"
                required
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CÓDIGO DA IGREJA (Ex: IGR-001)</label>
              <input
                type="text"
                value={codigoIgreja}
                onChange={(e) => setCodigoIgreja(e.target.value)}
                placeholder="IGR-001"
                required
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 uppercase"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 rounded-xl transition cursor-pointer"
            >
              SALVAR E ENTRAR
            </button>
          </form>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-center text-rose-600 font-semibold text-xs hover:underline cursor-pointer pt-2"
          >
            Sair e tentar com outra conta
          </button>
        </div>
      </div>
    );
  }

  if (!loggedUser) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 bg-blue-900 text-white flex flex-col">
        <div className="p-6 border-b border-blue-800">
          <h1 className="text-2xl font-black">SISTEMA IGREJA</h1>
          <p className="text-xs text-blue-200 mt-2 truncate">
            {loggedUser.nome_usuario} ({loggedUser.codigo_igreja})
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button
            type="button"
            onClick={() => selecionarAba('dashboard')}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'dashboard' ? 'bg-blue-700' : 'hover:bg-blue-800'
            }`}
          >
            🏠 Dashboard
          </button>

          {/* GRUPO CADASTROS */}
          <button
            type="button"
            onClick={() => setIsCadastrosOpen(!isCadastrosOpen)}
            className={`w-full text-left px-4 py-3 rounded-lg flex justify-between items-center font-medium transition cursor-pointer ${
              activeTab.startsWith('cadastros') && activeTab !== 'cadastros-usuario' ? 'bg-blue-700' : 'hover:bg-blue-800'
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
                  activeTab === 'cadastros-membros' ? 'bg-blue-600' : 'hover:bg-blue-700/80'
                }`}
              >
                Membros
              </button>

              <button
                type="button"
                onClick={() => selecionarAba('cadastros-fornecedores')}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                  activeTab === 'cadastros-fornecedores' ? 'bg-blue-600' : 'hover:bg-blue-700/80'
                }`}
              >
                Fornecedores
              </button>

              <button
                type="button"
                onClick={() => selecionarAba('cadastros-ministerios')}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                  activeTab === 'cadastros-ministerios' ? 'bg-blue-600' : 'hover:bg-blue-700/80'
                }`}
              >
                Ministérios
              </button>
            </div>
          )}

          {/* MÓDULO: ACOMPANHAMENTO DE VISITANTES */}
          <button
            type="button"
            onClick={() => selecionarAba('acompanhamento-visitantes')}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'acompanhamento-visitantes' ? 'bg-blue-700' : 'hover:bg-blue-800'
            }`}
          >
            🤝 Acompanhamento Visitantes
          </button>

          {/* GRUPO CÉLULAS COM SUBMENUS RETRÁTEIS */}
          <button
            type="button"
            onClick={() => {
              setIsCelulasOpen(!isCelulasOpen);
              setSubAbaCelulas('celulas');
              selecionarAba('celulas-modulo');
            }}
            className={`w-full text-left px-4 py-3 rounded-lg flex justify-between items-center font-medium transition cursor-pointer ${
              activeTab.startsWith('celulas') ? 'bg-blue-700' : 'hover:bg-blue-800'
            }`}
          >
            <span>🏡 Células</span>
            <span>{isCelulasOpen ? '▲' : '▼'}</span>
          </button>

          {isCelulasOpen && (
            <div className="ml-4 space-y-1 border-l-2 border-blue-700 pl-2">
              <button
                type="button"
                onClick={() => {
                  setSubAbaCelulas('celulas');
                  selecionarAba('celulas-modulo');
                }}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                  activeTab === 'celulas-modulo' && subAbaCelulas === 'celulas' ? 'bg-blue-600' : 'hover:bg-blue-700/80'
                }`}
              >
                Células
              </button>

              <button
                type="button"
                onClick={() => {
                  setSubAbaCelulas('setores');
                  selecionarAba('celulas-modulo');
                }}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                  activeTab === 'celulas-modulo' && subAbaCelulas === 'setores' ? 'bg-blue-600' : 'hover:bg-blue-700/80'
                }`}
              >
                Setores
              </button>

              <button
                type="button"
                onClick={() => {
                  setSubAbaCelulas('redes');
                  selecionarAba('celulas-modulo');
                }}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                  activeTab === 'celulas-modulo' && subAbaCelulas === 'redes' ? 'bg-blue-600' : 'hover:bg-blue-700/80'
                }`}
              >
                Redes
              </button>
            </div>
          )}

          {/* AGENDA */}
          <button
            type="button"
            onClick={() => selecionarAba('agenda')}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'agenda' ? 'bg-blue-700' : 'hover:bg-blue-800'
            }`}
          >
            📅 Agenda
          </button>

          {/* FINANCEIRO */}
          <button
            type="button"
            onClick={() => selecionarAba('financeiro')}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'financeiro' ? 'bg-blue-700' : 'hover:bg-blue-800'
            }`}
          >
            💰 Financeiro
          </button>

          {/* PROJETOS */}
          <button
            type="button"
            onClick={() => selecionarAba('projetos')}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'projetos' ? 'bg-blue-700' : 'hover:bg-blue-800'
            }`}
          >
            🚀 Projetos
          </button>

          {/* MENU CONFIGURAÇÕES */}
          <button
            type="button"
            onClick={() => setIsConfiguracoesOpen(!isConfiguracoesOpen)}
            className={`w-full text-left px-4 py-3 rounded-lg flex justify-between items-center font-medium transition cursor-pointer ${
              activeTab.startsWith('configuracoes') || activeTab === 'controle_registro' ? 'bg-blue-700' : 'hover:bg-blue-800'
            }`}
          >
            <span>⚙️ Configurações</span>
            <span>{isConfiguracoesOpen ? '▲' : '▼'}</span>
          </button>

          {isConfiguracoesOpen && (
            <div className="ml-4 space-y-1 border-l-2 border-blue-700 pl-2">
              <button
                type="button"
                onClick={() => selecionarAba('configuracoes-usuarios')}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                  activeTab === 'configuracoes-usuarios' ? 'bg-blue-600' : 'hover:bg-blue-700/80'
                }`}
              >
                Controle de Usuários
              </button>

              <button
                type="button"
                onClick={() => selecionarAba('controle_registro')}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                  activeTab === 'controle_registro' ? 'bg-blue-600' : 'hover:bg-blue-700/80'
                }`}
              >
                🔒 Controle de Registro
              </button>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-blue-800 space-y-2">
          <button
            type="button"
            onClick={() => setIsMobileModalOpen(true)}
            className="block w-full text-center px-4 py-2.5 bg-blue-800 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow"
          >
            📱 Abrir Tela Mobile / Opções
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 rounded-lg text-red-300 hover:bg-blue-800 font-medium transition cursor-pointer text-sm"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-8 overflow-y-auto w-full max-w-full">
        {activeTab === 'dashboard' && <DashboardHome loggedUser={loggedUser} selecionarAba={selecionarAba} />}
        {activeTab === 'cadastros-membros' && <MembrosModule loggedUser={loggedUser} />}
        {activeTab === 'cadastros-fornecedores' && <FornecedoresModule loggedUser={loggedUser} />}
        {activeTab === 'cadastros-ministerios' && <MinisteriosModule loggedUser={loggedUser} />}
        
        {/* RENDERIZAÇÃO DO MÓDULO DE ACOMPANHAMENTO DE VISITANTES */}
        {activeTab === 'acompanhamento-visitantes' && (
          <AcompanhamentoVisitantesModule loggedUser={loggedUser} />
        )}

        {/* RENDERIZAÇÃO DIRETA DO MÓDULO REAL DE CÉLULAS */}
        {(activeTab === 'celulas' || activeTab === 'celulas-modulo') && (
          <CelulasModule loggedUser={loggedUser} subAbaInicial={subAbaCelulas} />
        )}

        {activeTab === 'configuracoes-usuarios' && <UsuariosModule loggedUser={loggedUser} />}
        {activeTab === 'projetos' && <ProjetosModule loggedUser={loggedUser} />}
        {activeTab === 'agenda' && <AgendaModule loggedUser={loggedUser} />}
        {activeTab === 'financeiro' && <FinanceiroModule loggedUser={loggedUser} />}
        {activeTab === 'controle_registro' && <ControleRegistroModule loggedUser={loggedUser} />}
      </main>

      {/* MODAL INTUITIVO MOBILE */}
      {isMobileModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 space-y-6 my-8">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="text-xl font-black text-blue-900">Painel Mobile & Atalhos</h3>
                <p className="text-xs text-slate-500">Opções rápidas para dispositivos móveis</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileModalOpen(false)}
                className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <a
                  href="#cadastro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center px-4 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl transition shadow"
                >
                  🔗 1. Abrir Tela de Cadastro Público (Nova Guia)
                </a>
                <p className="text-xs text-slate-500 px-1">
                  Abre a interface externa de cadastro de membros/visitantes otimizada para celulares e tablets.
                </p>
              </div>

              <div className="border-t pt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileModalOpen(false);
                    selecionarAba('agenda');
                  }}
                  className="w-full text-center px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold text-sm rounded-xl transition shadow border border-indigo-200 cursor-pointer"
                >
                  📅 2. Ver Agenda e Próximos Eventos
                </button>
                <p className="text-xs text-slate-500 px-1">
                  Acesse rapidamente a lista de cultos, reuniões e programações agendadas da igreja.
                </p>
              </div>

              <div className="border-t pt-4 space-y-3">
                <h4 className="font-bold text-blue-900 text-sm">📱 3. Gerar QR Code para Membros Escanearem</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Gere um QR Code temporário (válido por 6 horas) para exibir na tela do seu celular e permitir que os membros escaneiem e se cadastrarem.
                </p>

                {isAdmin ? (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={gerarNovoQrCodeTemporario}
                      disabled={gerandoQr}
                      className="w-full px-4 py-3 bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer disabled:opacity-50"
                    >
                      {gerandoQr ? 'Gerando QR Code...' : '⚡ Gerar QR Code na Tela'}
                    </button>

                    {qrCodeUrlDinamico && (
                      <div className="bg-slate-50 border p-4 rounded-2xl text-center space-y-3">
                        <img src={qrCodeUrlDinamico} alt="QR Code Temporário" className="w-48 h-48 object-contain mx-auto bg-white p-2 rounded-xl border shadow-sm" />
                        <p className="text-[10px] text-slate-500 font-semibold">Mostre esta imagem para o membro escanear com a câmera do celular.</p>
                        
                        <div className="flex gap-2 justify-center flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              const urlParams = new URLSearchParams(qrCodeUrlDinamico.split('?')[1]);
                              const linkReal = urlParams.get('data');
                              if (linkReal) {
                                navigator.clipboard.writeText(linkReal);
                                alert('Link copiado!');
                              }
                            }}
                            className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
                          >
                            📋 Copiar Link
                          </button>

                          <button
                            type="button"
                            onClick={() => setQrCodeUrlDinamico('')}
                            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg transition cursor-pointer"
                          >
                            ✕ Fechar QR Code
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100 text-center">
                    🔒 Recurso restrito: Apenas administradores podem gerar o QR Code de cadastro.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardHome({ loggedUser, selecionarAba }: { loggedUser: any; selecionarAba: (aba: string) => void }) {
  const [modoAniversariantes, setModoAniversariantes] = useState<'dia' | 'mes'>('dia');
  const [aniversariantes, setAniversariantes] = useState<any[]>([]);
  const [loadingAniversariantes, setLoadingAniversariantes] = useState(false);

  // Estados de contagem e modais para Membros e Visitantes
  const [qtdMembros, setQtdMembros] = useState(0);
  const [qtdVisitantes, setQtdVisitantes] = useState(0);
  
  const [modalListaOpen, setModalListaOpen] = useState(false);
  const [tipoListaModal, setTipoListaModal] = useState<'Membros' | 'Visitantes'>('Membros');
  const [listaPessoas, setListaPessoas] = useState<any[]>([]);
  const [buscaModal, setBuscaModal] = useState('');
  const [loadingLista, setLoadingLista] = useState(false);

  // Estado para Edição do registro diretamente da modal do Dashboard
  const [itemEditando, setItemEditando] = useState<any | null>(null);
  const [itemDetalhes, setItemDetalhes] = useState<any | null>(null);

  const codigoIgreja = loggedUser?.codigo_igreja || loggedUser?.igrejas?.codigo_igreja || 'IGR-001';

  // Buscar totais de Membros e Visitantes
  const carregarTotais = useCallback(async () => {
    try {
      // 1. Total Membros
      const { count: countMembros } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('codigo_igreja', codigoIgreja)
        .neq('tipo_cadastro', 'Visitante');

      // 2. Total Visitantes
      const { count: countVisitantes } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('codigo_igreja', codigoIgreja)
        .eq('tipo_cadastro', 'Visitante');

      setQtdMembros(countMembros || 0);
      setQtdVisitantes(countVisitantes || 0);
    } catch (err) {
      console.error('Erro ao buscar totais:', err);
    }
  }, [codigoIgreja]);

  useEffect(() => {
    carregarTotais();
  }, [carregarTotais]);

  useEffect(() => {
    if (!codigoIgreja) return;

    const carregarAniversariantes = async () => {
      setLoadingAniversariantes(true);
      try {
        const { data, error } = await supabase
          .from('members')
          .select('id, nome, data_nascimento, celular_principal')
          .eq('codigo_igreja', codigoIgreja);

        if (error) throw error;

        if (data) {
          const hoje = new Date();
          const mesAtual = hoje.getMonth() + 1;
          const diaAtual = hoje.getDate();

          const filtrados = data.filter((membro) => {
            if (!membro.data_nascimento) return false;
            const partes = membro.data_nascimento.split('-');
            if (partes.length < 3) return false;

            const mesNasc = parseInt(partes[1], 10);
            const diaNasc = parseInt(partes[2], 10);

            if (modoAniversariantes === 'dia') {
              return mesNasc === mesAtual && diaNasc === diaAtual;
            } else {
              return mesNasc === mesAtual;
            }
          });

          if (modoAniversariantes === 'mes') {
            filtrados.sort((a, b) => {
              const diaA = parseInt(a.data_nascimento.split('-')[2], 10);
              const diaB = parseInt(b.data_nascimento.split('-')[2], 10);
              return diaA - diaB;
            });
          }

          setAniversariantes(filtrados);
        }
      } catch (err) {
        console.error('Erro ao buscar aniversariantes:', err);
      } finally {
        setLoadingAniversariantes(false);
      }
    };

    carregarAniversariantes();
  }, [codigoIgreja, modoAniversariantes]);

  // Função para carregar a lista completa quando o usuário clica num card
  const abrirModalLista = async (tipo: 'Membros' | 'Visitantes') => {
    setTipoListaModal(tipo);
    setBuscaModal('');
    setModalListaOpen(true);
    setLoadingLista(true);

    try {
      let query = supabase
        .from('members')
        .select('*')
        .eq('codigo_igreja', codigoIgreja);

      if (tipo === 'Visitantes') {
        query = query.eq('tipo_cadastro', 'Visitante');
      } else {
        query = query.neq('tipo_cadastro', 'Visitante');
      }

      const { data, error } = await query.order('nome', { ascending: true });

      if (error) throw error;
      setListaPessoas(data || []);
    } catch (err) {
      console.error('Erro ao buscar lista:', err);
      alert('Erro ao carregar lista de ' + tipo);
    } finally {
      setLoadingLista(false);
    }
  };

  // Salvar alterações de um registro direto no Dashboard
  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemEditando) return;

    try {
      const payload = {
        ...itemEditando,
        data_nascimento: itemEditando.data_nascimento && itemEditando.data_nascimento.trim() !== '' 
          ? itemEditando.data_nascimento 
          : null,
      };

      const { error } = await supabase
        .from('members')
        .update(payload)
        .eq('id', itemEditando.id);

      if (error) throw error;

      alert('Cadastro atualizado com sucesso!');
      setItemEditando(null);
      abrirModalLista(tipoListaModal);
      carregarTotais();
    } catch (err: any) {
      alert('Erro ao atualizar: ' + err.message);
    }
  };

  // Excluir registro diretamente do Dashboard
  const handleExcluirRegistro = async (id: any, nome: string) => {
    if (!window.confirm(`Deseja realmente excluir "${nome}"?`)) return;

    try {
      const { error } = await supabase.from('members').delete().eq('id', id);
      if (error) throw error;

      alert('Excluído com sucesso!');
      abrirModalLista(tipoListaModal);
      carregarTotais();
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const filtradosModal = listaPessoas.filter((p) =>
    (p.nome || '').toLowerCase().includes(buscaModal.toLowerCase()) ||
    (p.celular_principal || '').includes(buscaModal)
  );

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 max-w-5xl mx-auto shadow-sm space-y-6">
      <div>
        <h2 className="text-3xl font-black text-blue-900">Dashboard</h2>
        <p className="text-slate-600 mt-1">
          Seja bem-vindo ao sistema! Igreja: <span className="font-bold text-blue-900">{loggedUser.codigo_igreja}</span> | Usuário: <span className="font-bold text-blue-900">{loggedUser.nome_usuario}</span>
        </p>
      </div>

      {/* CARDS INTERATIVOS: MEMBROS E VISITANTES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          onClick={() => abrirModalLista('Membros')}
          className="bg-gradient-to-br from-blue-900 to-indigo-900 p-6 rounded-2xl text-white shadow-md hover:shadow-xl transition cursor-pointer transform hover:-translate-y-0.5 flex justify-between items-center"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-200">Total de Membros Oficial</p>
            <h3 className="text-4xl font-black mt-1">{qtdMembros}</h3>
            <p className="text-[11px] text-blue-300 mt-2">Clique para ver lista e editar 🔍</p>
          </div>
          <div className="text-4xl bg-white/10 p-3 rounded-2xl">👥</div>
        </div>

        <div
          onClick={() => abrirModalLista('Visitantes')}
          className="bg-gradient-to-br from-amber-600 to-amber-700 p-6 rounded-2xl text-white shadow-md hover:shadow-xl transition cursor-pointer transform hover:-translate-y-0.5 flex justify-between items-center"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-100">Total de Visitantes</p>
            <h3 className="text-4xl font-black mt-1">{qtdVisitantes}</h3>
            <p className="text-[11px] text-amber-200 mt-2">Clique para ver lista e acompanhar 🤝</p>
          </div>
          <div className="text-4xl bg-white/10 p-3 rounded-2xl">🤝</div>
        </div>
      </div>

      {/* BLUCO ANIVERSARIANTES */}
      <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-2xl p-6 text-white shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-blue-700/60 pb-4">
          <div>
            <h3 className="text-lg font-black tracking-wide flex items-center gap-2">
              🎂 Aniversariantes {modoAniversariantes === 'dia' ? 'de Hoje' : 'do Mês'}
            </h3>
            <p className="text-xs text-blue-200">
              {modoAniversariantes === 'dia' ? 'Membros que sopram as velinhas hoje!' : 'Todos os aniversariantes deste mês.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModoAniversariantes(modoAniversariantes === 'dia' ? 'mes' : 'dia')}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs rounded-xl transition shadow cursor-pointer border border-blue-500/50"
          >
            {modoAniversariantes === 'dia' ? '📅 Ver Aniversariantes do Mês' : '⭐ Ver Aniversariantes de Hoje'}
          </button>
        </div>

        {loadingAniversariantes ? (
          <p className="text-xs text-blue-200 py-4 text-center">Buscando aniversariantes...</p>
        ) : aniversariantes.length === 0 ? (
          <div className="bg-blue-950/40 p-4 rounded-xl border border-blue-800/50 text-center">
            <p className="text-sm text-blue-200">
              Nenhum aniversariante encontrado {modoAniversariantes === 'dia' ? 'para hoje' : 'neste mês'}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {aniversariantes.map((m) => {
              const partes = m.data_nascimento.split('-');
              const dataFormatada = `${partes[2]}/${partes[1]}`;
              return (
                <div key={m.id} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm text-white truncate max-w-[180px]">{m.nome}</p>
                    <p className="text-xs text-blue-200">📞 {m.celular_principal || 'Sem telefone'}</p>
                  </div>
                  <span className="bg-blue-500/30 text-blue-100 font-black text-xs px-2.5 py-1 rounded-lg border border-blue-400/30">
                    {dataFormatada}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-center">
        <p className="font-medium">Utilize os cards acima para rápida edição de cadastros ou navegue pelo menu lateral.</p>
      </div>

      {/* MODAL 1: LISTAGEM DE MEMBROS / VISITANTES ACIONADA PELOS CARDS */}
      {modalListaOpen && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-4 shrink-0">
              <div>
                <h3 className="text-2xl font-black text-blue-900">
                  Lista de {tipoListaModal} ({filtradosModal.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Cadastros oficiais registrados para a igreja {codigoIgreja}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalListaOpen(false)}
                className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            <div className="shrink-0">
              <input
                type="text"
                placeholder={`🔎 Pesquisar ${tipoListaModal.toLowerCase()} por nome ou celular...`}
                value={buscaModal}
                onChange={(e) => setBuscaModal(e.target.value)}
                className="w-full border rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>

            <div className="overflow-y-auto flex-1 pr-1 space-y-2">
              {loadingLista ? (
                <p className="text-center py-6 text-slate-500 text-xs">Carregando lista...</p>
              ) : filtradosModal.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed text-slate-500 text-xs">
                  Nenhum registro encontrado.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-slate-50 text-slate-700 text-xs uppercase font-bold sticky top-0">
                      <th className="p-3">Nome</th>
                      <th className="p-3">Tipo</th>
                      <th className="p-3">Telefone</th>
                      <th className="p-3">Bairro / Cidade</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs">
                    {filtradosModal.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-800">{p.nome || 'Sem nome'}</td>
                        <td className="p-3">
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                            {p.tipo_cadastro || 'Membro'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">{p.celular_principal || '-'}</td>
                        <td className="p-3 text-slate-500">{[p.bairro, p.cidade].filter(Boolean).join(' - ') || '-'}</td>
                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setItemDetalhes(p)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                          >
                            👁️ Ver
                          </button>
                          <button
                            type="button"
                            onClick={() => setItemEditando(p)}
                            className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold rounded-lg cursor-pointer"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExcluirRegistro(p.id, p.nome)}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg cursor-pointer"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIÇÃO RÁPIDA DE REGISTRO SELECIONADO NO DASHBOARD */}
      {itemEditando && (
        <div className="fixed inset-0 bg-slate-900/90 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="text-xl font-black text-blue-900">Editar Cadastro</h3>
                <p className="text-xs text-slate-500">{itemEditando.nome}</p>
              </div>
              <button
                type="button"
                onClick={() => setItemEditando(null)}
                className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl cursor-pointer"
              >
                ✕ Cancelar
              </button>
            </div>

            <form onSubmit={handleSalvarEdicao} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">TIPO DE CADASTRO</label>
                  <select
                    value={itemEditando.tipo_cadastro || 'Membro'}
                    onChange={(e) => setItemEditando({ ...itemEditando, tipo_cadastro: e.target.value })}
                    className="w-full border rounded-xl p-2.5 bg-white font-medium"
                  >
                    <option value="Membro">Membro</option>
                    <option value="Congregado">Congregado</option>
                    <option value="Visitante">Visitante</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">NOME COMPLETO *</label>
                  <input
                    type="text"
                    value={itemEditando.nome || ''}
                    onChange={(e) => setItemEditando({ ...itemEditando, nome: e.target.value })}
                    className="w-full border rounded-xl p-2.5 font-bold text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">CELULAR / WHATSAPP</label>
                  <input
                    type="text"
                    value={itemEditando.celular_principal || ''}
                    onChange={(e) => setItemEditando({ ...itemEditando, celular_principal: e.target.value })}
                    className="w-full border rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">E-MAIL</label>
                  <input
                    type="email"
                    value={itemEditando.email || ''}
                    onChange={(e) => setItemEditando({ ...itemEditando, email: e.target.value })}
                    className="w-full border rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">DATA DE NASCIMENTO</label>
                  <input
                    type="date"
                    value={itemEditando.data_nascimento || ''}
                    onChange={(e) => setItemEditando({ ...itemEditando, data_nascimento: e.target.value })}
                    className="w-full border rounded-xl p-2.5 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ESTADO CIVIL</label>
                  <select
                    value={itemEditando.estado_civil || 'Solteiro(a)'}
                    onChange={(e) => setItemEditando({ ...itemEditando, estado_civil: e.target.value })}
                    className="w-full border rounded-xl p-2.5 bg-white"
                  >
                    <option value="Solteiro(a)">Solteiro(a)</option>
                    <option value="Casado(a)">Casado(a)</option>
                    <option value="Divorciado(a)">Divorciado(a)</option>
                    <option value="Viúvo(a)">Viúvo(a)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">BAIRRO</label>
                  <input
                    type="text"
                    value={itemEditando.bairro || ''}
                    onChange={(e) => setItemEditando({ ...itemEditando, bairro: e.target.value })}
                    className="w-full border rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">CIDADE</label>
                  <input
                    type="text"
                    value={itemEditando.cidade || ''}
                    onChange={(e) => setItemEditando({ ...itemEditando, cidade: e.target.value })}
                    className="w-full border rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="border-t pt-4 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setItemEditando(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow cursor-pointer"
                >
                  💾 Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VISUALIZAR FICHA COMPLETA */}
      {itemDetalhes && (
        <div className="fixed inset-0 bg-slate-900/90 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-8 space-y-4 my-8">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-blue-900">Ficha do Cadastro</h3>
              <button
                type="button"
                onClick={() => setItemDetalhes(null)}
                className="px-3 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 font-bold text-xs rounded-xl"
              >
                ✕ Fechar
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl"><strong className="block text-slate-400">NOME</strong>{itemDetalhes.nome}</div>
              <div className="bg-slate-50 p-3 rounded-xl"><strong className="block text-slate-400">TIPO</strong>{itemDetalhes.tipo_cadastro}</div>
              <div className="bg-slate-50 p-3 rounded-xl"><strong className="block text-slate-400">TELEFONE</strong>{itemDetalhes.celular_principal || '-'}</div>
              <div className="bg-slate-50 p-3 rounded-xl"><strong className="block text-slate-400">E-MAIL</strong>{itemDetalhes.email || '-'}</div>
              <div className="bg-slate-50 p-3 rounded-xl"><strong className="block text-slate-400">CPF / RG</strong>{itemDetalhes.cpf || '-'} / {itemDetalhes.rg || '-'}</div>
              <div className="bg-slate-50 p-3 rounded-xl"><strong className="block text-slate-400">ENDEREÇO</strong>{[itemDetalhes.rua, itemDetalhes.numero, itemDetalhes.bairro, itemDetalhes.cidade].filter(Boolean).join(', ') || '-'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;