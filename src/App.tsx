// src/App.tsx

import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import ProjetosModule from './ProjetosModule';
import MembrosModule from './MembrosModule';
import FornecedoresModule from './FornecedoresModule';
import MinisteriosModule from './MinisteriosModule';
import UsuariosModule from './UsuariosModule';
import CadastroPublico from './CadastroPublico';

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
  const [isConfiguracoesOpen, setIsConfiguracoesOpen] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  // Estados de Autenticação e Cadastro
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [codigoIgreja, setCodigoIgreja] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  // Estados para o QR Code Temporário de 6 horas
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
      alert('Erro ao gerar QR Code temporário. Verifique se a tabela "tokens_cadastro_temporario" foi criada no Supabase.');
    } finally {
      setGerandoQr(false);
    }
  };

  // Atalho para fechar os modais com ESC
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

  // Busca do usuário por e-mail de forma segura
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

    // O primeiro usuário cadastrado nesta conta assume o perfil de admin
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

          {/* MENU CONFIGURAÇÕES */}
          <button
            type="button"
            onClick={() => setIsConfiguracoesOpen(!isConfiguracoesOpen)}
            className={`w-full text-left px-4 py-3 rounded-lg flex justify-between items-center font-medium transition cursor-pointer ${
              activeTab.startsWith('configuracoes') ? 'bg-blue-700' : 'hover:bg-blue-800'
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

      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 max-w-5xl mx-auto shadow-sm space-y-6">
            <div>
              <h2 className="text-3xl font-black text-blue-900">Dashboard</h2>
              <p className="text-slate-600 mt-1">
                Igreja: <span className="font-bold text-blue-900">{loggedUser.codigo_igreja}</span> | Usuário: <span className="font-bold text-blue-900">{loggedUser.nome_usuario}</span>
              </p>
            </div>

            {/* Painel do QR Code Dinâmico de 6h (Apenas para Admin) */}
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-col sm:flex-row items-center gap-6">
              <div className="bg-white p-3 rounded-2xl shadow-md border shrink-0 text-center">
                {qrCodeUrlDinamico ? (
                  <div className="space-y-2">
                    <img src={qrCodeUrlDinamico} alt="QR Code Temporário" className="w-40 h-40 object-contain mx-auto" />
                    <span className="block text-[10px] text-slate-400 font-medium">Pressione ESC para fechar</span>
                  </div>
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center text-xs text-slate-400 font-semibold bg-slate-100 rounded-xl p-2 text-center">
                    {isAdmin ? 'Clique em gerar QR Code' : 'Recurso restrito ao Admin'}
                  </div>
                )}
              </div>

              <div className="space-y-3 flex-1 text-center sm:text-left w-full">
                <h4 className="font-bold text-blue-900 text-lg">QR Code Temporário (Validade: 6 Horas)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Gere um acesso seguro para o evento ou culto da igreja <span className="font-bold">{loggedUser.codigo_igreja}</span>. O link expira automaticamente após 6 horas.
                </p>

                {isAdmin ? (
                  <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                    <button
                      type="button"
                      onClick={gerarNovoQrCodeTemporario}
                      disabled={gerandoQr}
                      className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer disabled:opacity-50"
                    >
                      {gerandoQr ? 'Gerando...' : '⚡ Gerar Novo QR Code (6h)'}
                    </button>

                    {qrCodeUrlDinamico && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            const urlParams = new URLSearchParams(qrCodeUrlDinamico.split('?')[1]);
                            const linkReal = urlParams.get('data');
                            if (linkReal) {
                              navigator.clipboard.writeText(linkReal);
                              alert('Link de cadastro copiado para a área de transferência!');
                            }
                          }}
                          className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                          📋 Copiar Link
                        </button>

                        <a
                          href={qrCodeUrlDinamico}
                          download="qrcode-temporario.png"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition"
                        >
                          📥 Baixar Imagem
                        </a>

                        <button
                          type="button"
                          onClick={() => setQrCodeUrlDinamico('')}
                          className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                          ✕ Fechar (ESC)
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100 inline-block">
                    🔒 Apenas administradores do sistema podem gerar o QR Code de acesso.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cadastros-membros' && <MembrosModule loggedUser={loggedUser} />}
        {activeTab === 'cadastros-fornecedores' && <FornecedoresModule loggedUser={loggedUser} />}
        {activeTab === 'cadastros-ministerios' && <MinisteriosModule loggedUser={loggedUser} />}
        {activeTab === 'configuracoes-usuarios' && <UsuariosModule loggedUser={loggedUser} />}
        {activeTab === 'projetos' && <ProjetosModule loggedUser={loggedUser} />}
        {activeTab === 'agenda' && <TelaProvisoria titulo="Agenda" />}
        {activeTab === 'financeiro' && <TelaProvisoria titulo="Financeiro" />}
      </main>

      {/* MODAL INTUITIVO "ABRIR TELA MOBILE / OPÇÕES" */}
      {isMobileModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6">
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

            <div className="space-y-3">
              <a
                href="#cadastro"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-4 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl transition shadow"
              >
                🔗 Abrir Tela de Cadastro Público (Nova Guia)
              </a>

              <p className="text-xs text-slate-500 leading-relaxed pt-2">
                Este atalho abre a interface externa de cadastro de membros/visitantes otimizada para celulares e tablets, ideal para uso em eventos com o QR Code.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TelaProvisoria({ titulo }: { titulo: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 max-w-5xl mx-auto shadow-sm">
      <h2 className="text-3xl font-black text-blue-900">{titulo}</h2>
      <p className="text-slate-600 mt-2">Esta seção está pronta para receber a implementação do módulo correspondente.</p>
    </div>
  );
}

export default App;