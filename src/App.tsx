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

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCadastrosOpen, setIsCadastrosOpen] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  // Estados para o QR Code Temporário de 6 horas
  const [qrCodeUrlDinamico, setQrCodeUrlDinamico] = useState('');
  const [gerandoQr, setGerandoQr] = useState(false);

  const gerarNovoQrCodeTemporario = async () => {
    if (!loggedUser) return;
    setGerandoQr(true);

    try {
      const codigoIgreja = loggedUser?.codigo_igreja || 'IGR-001';
      const tokenUnico = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const dataExpiracao = new Date(new Date().getTime() + 6 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase.from('tokens_cadastro_temporario').insert([
        {
          codigo_igreja: codigoIgreja,
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

  // Atalho para desfazer/fechar o QR Code ao pressionar ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && qrCodeUrlDinamico) {
        setQrCodeUrlDinamico('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [qrCodeUrlDinamico]);

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
      if (!session?.user?.id) {
        setLoggedUser(null);
        return;
      }

      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .or(`auth_user_id.eq.${session.user.id},id.eq.${session.user.id}`)
        .maybeSingle();

      if (error || !data) {
        setLoggedUser({
          codigo_igreja: 'IGR-001',
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  };

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    const { error } = await supabase.auth.signUp({ email, password });
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
            {isLogin ? 'Faça login para continuar.' : 'Cadastre-se para acessar o sistema.'}
          </p>

          <form onSubmit={isLogin ? handleLogin : handleSignUp} className="space-y-4">
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
              {isLogin ? 'ENTRAR' : 'CADASTRAR'}
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
              activeTab === 'dashboard' ? 'bg-blue-700' : 'hover:bg-blue-800'
            }`}
          >
            🏠 Dashboard
          </button>

          <button
            type="button"
            onClick={() => setIsCadastrosOpen(!isCadastrosOpen)}
            className={`w-full text-left px-4 py-3 rounded-lg flex justify-between items-center font-medium transition cursor-pointer ${
              activeTab.startsWith('cadastros') ? 'bg-blue-700' : 'hover:bg-blue-800'
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

              <button
                type="button"
                onClick={() => selecionarAba('cadastros-usuario')}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                  activeTab === 'cadastros-usuario' ? 'bg-blue-600' : 'hover:bg-blue-700/80'
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

        <div className="p-4 border-t border-blue-800 space-y-2">
          <a
            href="#cadastro"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center px-4 py-2 bg-blue-800 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition"
          >
            🔗 Abrir Tela Mobile
          </a>

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
                Gerencie o acesso seguro e gere QR Codes temporários com validade de 6 horas para novos cadastros.
              </p>
            </div>

            {/* Painel do QR Code Dinâmico de 6h */}
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-col sm:flex-row items-center gap-6">
              <div className="bg-white p-3 rounded-2xl shadow-md border shrink-0 text-center">
                {qrCodeUrlDinamico ? (
                  <div className="space-y-2">
                    <img src={qrCodeUrlDinamico} alt="QR Code Temporário" className="w-40 h-40 object-contain mx-auto" />
                    <span className="block text-[10px] text-slate-400 font-medium">Pressione ESC para fechar</span>
                  </div>
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center text-xs text-slate-400 font-semibold bg-slate-100 rounded-xl p-2 text-center">
                    Clique em gerar QR Code
                  </div>
                )}
              </div>

              <div className="space-y-3 flex-1 text-center sm:text-left w-full">
                <h4 className="font-bold text-blue-900 text-lg">QR Code Temporário (Validade: 6 Horas)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Gere um acesso seguro para o evento ou culto. O link expira automaticamente após 6 horas, garantindo que o formulário seja preenchido com segurança.
                </p>
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
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cadastros-membros' && <MembrosModule loggedUser={loggedUser} />}
        {activeTab === 'cadastros-fornecedores' && <FornecedoresModule loggedUser={loggedUser} />}
        {activeTab === 'cadastros-ministerios' && <MinisteriosModule loggedUser={loggedUser} />}
        {activeTab === 'cadastros-usuario' && <UsuariosModule loggedUser={loggedUser} />}
        {activeTab === 'projetos' && <ProjetosModule loggedUser={loggedUser} />}
        {activeTab === 'agenda' && <TelaProvisoria titulo="Agenda" />}
        {activeTab === 'financeiro' && <TelaProvisoria titulo="Financeiro" />}
      </main>
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