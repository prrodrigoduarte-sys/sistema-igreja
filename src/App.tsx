/* ========================================================================== */
/* 1. IMPORTAÇÕES E CONFIGURAÇÕES INICIAIS                                    */
/* ========================================================================== */
if (typeof window !== 'undefined') {
  (window as any).setSubAbaAtiva = (window as any).setSubAbaAtiva || function () {};
}

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
import DiscipuladoDEAModule from './DiscipuladoDEAModule';
import AppMobileModule from './AppMobileModule';
import CadastroIgrejaModule from './CadastroIgrejaModule';
import { MessageSquare, Send, Bell, Trash2 } from 'lucide-react';

function getOrCreateDeviceToken() {
  let token = localStorage.getItem('app_device_token');
  if (!token) {
    token = 'DEV-' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('app_device_token', token);
  }
  return token;
}

/* ========================================================================== */
/* 2. COMPONENTE PRINCIPAL (APP)                                              */
/* ========================================================================== */
export default function App() {
  const [isMobileSubdomain, setIsMobileSubdomain] = useState(false);
  const [rotaPublica, setRotaPublica] = useState(
    window.location.hash.includes('cadastro') || window.location.pathname.includes('cadastro')
  );

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [loggedUser, setLoggedUser] = useState<any>(null);
  const [precisaCompletarPerfil, setPrecisaCompletarPerfil] = useState(false);
  const [precisaCompletarCadastro, setPrecisaCompletarCadastro] = useState(false);
  const [permissoesAtivas, setPermissoesAtivas] = useState<string[]>([]);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCadastrosOpen, setIsCadastrosOpen] = useState(false);
  const [isCelulasOpen, setIsCelulasOpen] = useState(false);
  const [subAbaCelulas, setSubAbaCelulas] = useState<'celulas' | 'setores' | 'redes'>('celulas');
  const [isDiscipuladoOpen, setIsDiscipuladoOpen] = useState(true);
  const [isConfiguracoesOpen, setIsConfiguracoesOpen] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  // Estados de Autenticação e Cadastro
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [codigoIgreja, setCodigoIgreja] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  // Estados para o Chat Mobile, Status e Aniversários dos Líderes
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: string; text: string; time: string; isBroadcast?: boolean }>>([
    { id: '1', sender: 'Sistema', text: 'Bem-vindo ao chat da rede!', time: '10:00', isBroadcast: true }
  ]);
  const [messageInput, setMessageInput] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<string>('all');
  const [membrosChat, setMembrosChat] = useState<any[]>([]);

  // Estados de Segurança 2FA (Dispositivo Novo / 3 Erros)
  const [exigir2FA, setExigir2FA] = useState(false);
  const [codigoDigitado2FA, setCodigoDigitado2FA] = useState('');
  const [codigoGerado2FA, setCodigoGerado2FA] = useState('');
  const [motivo2FA, setMotivo2FA] = useState('');
  const [usuarioPendente2FA, setUsuarioPendente2FA] = useState<any>(null);

  // Estados para o QR Code Temporário
  const [qrCodeUrlDinamico, setQrCodeUrlDinamico] = useState('');
  const [gerandoQr, setGerandoQr] = useState(false);

  const isAdmin = loggedUser?.perfil === 'admin' || loggedUser?.perfil === 'administrador';

  useEffect(() => {
    if (window.location.hostname.startsWith('app.')) {
      setIsMobileSubdomain(true);
    }
  }, []);

  // Carregar lista de membros para o Chat e Aniversariantes dos Líderes
  useEffect(() => {
    const carregarMembrosChat = async () => {
      const igrejaAtual = loggedUser?.codigo_igreja || 'IGR-001';
      const { data } = await supabase
        .from('members')
        .select('id, nome, celular_principal, data_nascimento, tipo_cadastro')
        .eq('codigo_igreja', igrejaAtual);

      if (data) {
        const formatados = data.map((m, idx) => ({
          ...m,
          type: (m.tipo_cadastro || '').toLowerCase().includes('lider') ? 'lider' : 'membro',
          status: idx % 2 === 0 ? 'online' : 'offline'
        }));
        setMembrosChat(formatados);
      }
    };
    if (loggedUser) {
      carregarMembrosChat();
    }
  }, [loggedUser]);

  // Aniversariantes do dia para líderes
  const todayStr = new Date().toISOString().slice(5, 10);
  const todaysBirthdays = membrosChat.filter(m => (m.data_nascimento || '').slice(5, 10) === todayStr);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    const newMessage = {
      id: Date.now().toString(),
      sender: loggedUser?.nome_usuario || 'Você',
      text: selectedRecipient === 'all' ? `[TRANSMISSÃO PARA TODOS] ${messageInput}` : `[Privado] ${messageInput}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isBroadcast: selectedRecipient === 'all'
    };
    setChatMessages(prev => [...prev, newMessage]);
    setMessageInput('');
  };

  const handleExcluirMensagemChat = (msgId: string, isBroadcastMsg?: boolean) => {
    if (isBroadcastMsg && !isAdmin) {
      alert('🔒 Apenas o Administrador pode excluir mensagens da conversa geral (todos os membros).');
      return;
    }

    if (!window.confirm('Deseja realmente excluir esta mensagem?')) return;

    setChatMessages(prev => prev.filter(m => m.id !== msgId));
  };

  const dispararVerificacao2FA = (motivo: string, userTemp: any) => {
    const codigoHex = Math.floor(100000 + Math.random() * 900000).toString();
    setCodigoGerado2FA(codigoHex);
    setUsuarioPendente2FA(userTemp);
    setMotivo2FA(motivo);
    setExigir2FA(true);

    alert(`🔒 SEGURANÇA (2º NÍVEL):\nMotivo: ${motivo}\n\nSeu código de verificação é: ${codigoHex}`);
  };

  /* ========================================================================== */
  /* 3. LÓGICA DE AUTENTICAÇÃO E LOGIN                                          */
  /* ========================================================================== */
  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    const emailLimpo = email.trim().toLowerCase();
    const deviceToken = getOrCreateDeviceToken();

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: emailLimpo,
      password,
    });

    if (error) {
      const { data: regTentativa } = await supabase
        .from('tentativas_login')
        .select('*')
        .eq('email', emailLimpo)
        .maybeSingle();

      const numTentativas = (regTentativa?.tentativas || 0) + 1;

      await supabase.from('tentativas_login').upsert(
        [
          {
            email: emailLimpo,
            tentativas: numTentativas,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'email' }
      );

      if (numTentativas >= 3) {
        alert('⚠️ Senha incorreta pela 3ª vez! Por segurança, o 2º nível de verificação será exigido no próximo login correto.');
      } else {
        alert(`Senha incorreta! Tentativa ${numTentativas} de 3.`);
      }
      return;
    }

    const { data: regTentativa } = await supabase
      .from('tentativas_login')
      .select('*')
      .eq('email', emailLimpo)
      .maybeSingle();

    const teveTresErros = (regTentativa?.tentativas || 0) >= 3;

    if (teveTresErros) {
      dispararVerificacao2FA('Múltiplas tentativas incorretas de senha (3x)', authData.session);
    } else {
      setSession(authData.session);
    }
  };

  const handleConfirmar2FA = async (e: React.FormEvent) => {
    e.preventDefault();

    if (codigoDigitado2FA.trim() !== codigoGerado2FA) {
      alert('❌ Código incorreto! Verifique e tente novamente.');
      return;
    }

    const emailLimpo = email.trim().toLowerCase();
    const deviceToken = getOrCreateDeviceToken();

    await supabase.from('tentativas_login').upsert(
      [{ email: emailLimpo, tentativas: 0, updated_at: new Date().toISOString() }],
      { onConflict: 'email' }
    );

    if (usuarioPendente2FA?.user?.id) {
      await supabase.from('dispositivos_autorizados').upsert(
        [
          {
            usuario_id: usuarioPendente2FA.user.id,
            email: emailLimpo,
            device_token: deviceToken,
            nome_dispositivo: navigator.userAgent.substring(0, 50),
            ultimo_acesso: new Date().toISOString(),
          },
        ],
        { onConflict: 'usuario_id,device_token' }
      );
    }

    alert('✅ Dispositivo verificado e autorizado com sucesso!');
    setExigir2FA(false);
    setCodigoDigitado2FA('');
    setSession(usuarioPendente2FA);
  };

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
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    carregarSessao();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, novaSessao) => {
      setSession(novaSessao);
    });

    return () => subscription.unsubscribe();
  }, []);

  /* ========================================================================== */
  /* 4. CARREGAMENTO DE USUÁRIO E PERMISSÕES                                    */
  /* ========================================================================== */
  const carregarUsuarioEPermissoes = useCallback(async () => {
    if (!session?.user?.id) {
      setLoggedUser(null);
      setPrecisaCompletarPerfil(false);
      setPrecisaCompletarCadastro(false);
      setPermissoesAtivas([]);
      return;
    }

    const authUserId = session.user.id;
    const emailUsuario = session.user.email?.trim().toLowerCase();

    let { data } = await supabase
      .from('usuarios')
      .select('*')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (!data && emailUsuario) {
      const resEmail = await supabase
        .from('usuarios')
        .select('*')
        .ilike('email', emailUsuario)
        .maybeSingle();
      data = resEmail.data;

      if (data && !data.auth_user_id) {
        await supabase.from('usuarios').update({ auth_user_id: authUserId }).eq('id', data.id);
      }
    }

    if (!data) {
      setPrecisaCompletarPerfil(true);
      setLoggedUser(null);
      return;
    }

    setPrecisaCompletarPerfil(false);
    setLoggedUser(data);

    if (data.perfil === 'admin' || data.perfil === 'administrador' || data.perfil === 'lider') {
      setPermissoesAtivas(['dashboard', 'app-mobile', 'chat-mobile', 'cadastros', 'visitantes', 'celulas', 'discipulado', 'agenda', 'financeiro', 'projetos', 'configuracoes']);
      setPrecisaCompletarCadastro(false);
    } else {
      const { data: permData } = await supabase
        .from('permissoes_usuario')
        .select('modulo')
        .eq('usuario_id', data.id)
        .eq('permitido', true);

      const mods = permData ? permData.map((p) => p.modulo) : [];
      setPermissoesAtivas(mods);

      const { data: membroInfo } = await supabase
        .from('members')
        .select('id, cadastro_concluido')
        .eq('email', emailUsuario)
        .maybeSingle();

      if (!membroInfo || !membroInfo.cadastro_concluido) {
        setPrecisaCompletarCadastro(true);
      } else {
        setPrecisaCompletarCadastro(false);
      }
    }
  }, [session]);

  useEffect(() => {
    carregarUsuarioEPermissoes();
  }, [carregarUsuarioEPermissoes]);

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!nomeUsuario || !codigoIgreja) {
      alert('Preencha o Nome de Usuário e o Código da Igreja.');
      return;
    }

    const { count, error: countError } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true })
      .eq('codigo_igreja', codigoIgreja.toUpperCase().trim());

    const perfilInicial = (countError || count === 0) ? 'administrador' : 'comum';

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
        email: email.trim().toLowerCase(),
        nome_usuario: nomeUsuario,
        codigo_igreja: codigoIgreja.toUpperCase().trim(),
        perfil: perfilInicial,
        ativo: true,
      },
    ]);

    if (profileError) {
      alert('Erro ao criar perfil do usuário: ' + profileError.message);
      return;
    }

    alert(perfilInicial === 'administrador' 
      ? '🎉 Cadastro realizado! Como primeiro usuário desta igreja, você é o Administrador.' 
      : '👤 Cadastro realizado com sucesso! Seus módulos virão zerados até que o Administrador os libere.');
    setIsLogin(true);
  };

  const handleCompletarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeUsuario || !codigoIgreja) {
      alert('Preencha todos os campos.');
      return;
    }

    const emailLimpo = session.user.email.trim().toLowerCase();
    const authUserId = session.user.id;

    const { data: registroExistente } = await supabase
      .from('usuarios')
      .select('id')
      .or(`auth_user_id.eq.${authUserId},email.ilike.${emailLimpo}`)
      .maybeSingle();

    let error;

    if (registroExistente) {
      const res = await supabase
        .from('usuarios')
        .update({
          auth_user_id: authUserId,
          email: emailLimpo,
          nome_usuario: nomeUsuario,
          codigo_igreja: codigoIgreja.toUpperCase().trim(),
          perfil: 'comum',
          ativo: true,
        })
        .eq('id', registroExistente.id);
      error = res.error;
    } else {
      const res = await supabase.from('usuarios').insert([
        {
          auth_user_id: authUserId,
          email: emailLimpo,
          nome_usuario: nomeUsuario,
          codigo_igreja: codigoIgreja.toUpperCase().trim(),
          perfil: 'comum',
          ativo: true,
        },
      ]);
      error = res.error;
    }

    if (error) {
      alert('Erro ao salvar perfil: ' + error.message);
      return;
    }

    await carregarUsuarioEPermissoes();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLoggedUser(null);
    setPrecisaCompletarPerfil(false);
    setPrecisaCompletarCadastro(false);
    setActiveTab('dashboard');
  };

  const temPermissao = (moduloKey: string) => {
    if (isAdmin || loggedUser?.perfil === 'lider') return true;
    return permissoesAtivas.includes(moduloKey);
  };

  const selecionarAba = (aba: string) => {
    setActiveTab(aba);
  };

  /* ========================================================================== */
  /* 5. RENDERIZAÇÃO DE TELAS DE AUTENTICAÇÃO E BLOQUEIO                        */
  /* ========================================================================== */
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

  if (exigir2FA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-950 p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full space-y-5 text-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-900 rounded-full flex items-center justify-center mx-auto text-3xl font-black">
            🔒
          </div>
          <h2 className="text-2xl font-black text-blue-900">VERIFICAÇÃO DE SEGURANÇA</h2>
          <p className="text-xs text-slate-600 font-medium">{motivo2FA}</p>

          <form onSubmit={handleConfirmar2FA} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">DIGITE O CÓDIGO DE 6 DÍGITOS</label>
              <input
                type="text"
                maxLength={6}
                value={codigoDigitado2FA}
                onChange={(e) => setCodigoDigitado2FA(e.target.value)}
                placeholder="000000"
                required
                className="w-full text-center text-3xl tracking-widest font-mono py-3 border-2 border-blue-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3.5 rounded-2xl transition cursor-pointer shadow-lg"
            >
              VERIFICAR E LIBERAR ACESSO
            </button>
          </form>

          <button
            type="button"
            onClick={() => setExigir2FA(false)}
            className="text-xs text-slate-500 font-bold hover:underline cursor-pointer pt-2 block mx-auto"
          >
            Cancelar e Voltar ao Login
          </button>
        </div>
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
            {isLogin ? 'Faça login para continuar.' : 'Cadastre sua igreja e seu usuário.'}
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

  const userEfetivo = loggedUser || {
    email: session?.user?.email,
    nome_usuario: session?.user?.email?.split('@')[0] || 'Usuário',
    codigo_igreja: 'IGR-001',
    perfil: 'comum',
  };

  // SUBDOMÍNIO MOBILE
  if (isMobileSubdomain) {
    return (
      <div className="min-h-screen bg-slate-100 p-2 sm:p-4 w-full">
        <AppMobileModule loggedUser={userEfetivo} />
      </div>
    );
  }

  /* ========================================================================== */
  /* 6. LAYOUT PRINCIPAL DO SISTEMA (SIDEBAR E NAVEGAÇÃO)                       */
  /* ========================================================================== */
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 bg-blue-900 text-white flex flex-col">
        <div className="p-6 border-b border-blue-800">
          <h1 className="text-2xl font-black">SISTEMA IGREJA</h1>
          <p className="text-xs text-blue-200 mt-2 truncate">
            {userEfetivo.nome_usuario} ({userEfetivo.codigo_igreja})
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {temPermissao('dashboard') && (
            <button
              type="button"
              onClick={() => selecionarAba('dashboard')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'dashboard' ? 'bg-blue-700' : 'hover:bg-blue-800'
              }`}
            >
              🏠 Dashboard
            </button>
          )}

          {temPermissao('app-mobile') && (
            <button
              type="button"
              onClick={() => selecionarAba('app-mobile')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition cursor-pointer flex items-center justify-between ${
                activeTab === 'app-mobile' ? 'bg-blue-700 font-bold' : 'hover:bg-blue-800'
              }`}
            >
              <span className="flex items-center gap-2">📱 Aplicativo Mobile</span>
              <span className="text-[10px] bg-emerald-500 text-white font-black px-2 py-0.5 rounded-full">APP</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => selecionarAba('chat-mobile')}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition cursor-pointer flex items-center justify-between ${
              activeTab === 'chat-mobile' ? 'bg-blue-700 font-bold' : 'hover:bg-blue-800'
            }`}
          >
            <span className="flex items-center gap-2">💬 Chat & Aniversários</span>
            {todaysBirthdays.length > 0 && (
              <span className="text-[10px] bg-amber-500 text-slate-900 font-black px-1.5 py-0.5 rounded-full animate-bounce">
                🎂 {todaysBirthdays.length}
              </span>
            )}
          </button>

          {temPermissao('cadastros') && (
            <div>
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
            </div>
          )}

          {temPermissao('visitantes') && (
            <button
              type="button"
              onClick={() => selecionarAba('acompanhamento-visitantes')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'acompanhamento-visitantes' ? 'bg-blue-700' : 'hover:bg-blue-800'
              }`}
            >
              🤝 Acompanhamento Visitantes
            </button>
          )}

          {temPermissao('celulas') && (
            <div>
              <button
                type="button"
                onClick={() => {
                  setIsCelulasOpen(!isCelulasOpen);
                  setSubAbaCelulas('celulas');
                  selecionarAba('celulas-modulo');
                }}
                className={`w-full text-left px-4 py-3 rounded-lg flex justify-between items-center font-medium transition cursor-pointer ${
                  activeTab === 'celulas-modulo' ? 'bg-blue-700' : 'hover:bg-blue-800'
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
            </div>
          )}

          {temPermissao('discipulado') && (
            <div>
              <button
                type="button"
                onClick={() => setIsDiscipuladoOpen(!isDiscipuladoOpen)}
                className={`w-full text-left px-4 py-3 rounded-lg flex justify-between items-center font-medium transition cursor-pointer ${
                  activeTab.startsWith('discipulado') ? 'bg-blue-700' : 'hover:bg-blue-800'
                }`}
              >
                <span>🌱 Discipulado</span>
                <span>{isDiscipuladoOpen ? '▲' : '▼'}</span>
              </button>

              {isDiscipuladoOpen && (
                <div className="ml-4 space-y-1 border-l-2 border-blue-700 pl-2">
                  <button
                    type="button"
                    onClick={() => selecionarAba('discipulado-dea')}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                      activeTab === 'discipulado-dea' || activeTab === 'discipulado' ? 'bg-blue-600' : 'hover:bg-blue-700/80'
                    }`}
                  >
                    D.E.A. / G.U.I.
                  </button>

                  <button
                    type="button"
                    onClick={() => selecionarAba('discipulado-agenda-discipulador')}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                      activeTab === 'discipulado-agenda-discipulador' ? 'bg-blue-600' : 'hover:bg-blue-700/80'
                    }`}
                  >
                    Lista do Agendamento: Por Discipulador
                  </button>

                  <button
                    type="button"
                    onClick={() => selecionarAba('discipulado-agenda-geral')}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                      activeTab === 'discipulado-agenda-geral' ? 'bg-blue-600' : 'hover:bg-blue-700/80'
                    }`}
                  >
                    Lista do Agendamento: Geral
                  </button>
                </div>
              )}
            </div>
          )}

          {temPermissao('agenda') && (
            <button
              type="button"
              onClick={() => selecionarAba('agenda')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'agenda' ? 'bg-blue-700' : 'hover:bg-blue-800'
              }`}
            >
              📅 Agenda
            </button>
          )}

          {temPermissao('financeiro') && (
            <button
              type="button"
              onClick={() => selecionarAba('financeiro')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'financeiro' ? 'bg-blue-700' : 'hover:bg-blue-800'
              }`}
            >
              💰 Financeiro
            </button>
          )}

          {temPermissao('projetos') && (
            <button
              type="button"
              onClick={() => selecionarAba('projetos')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'projetos' ? 'bg-blue-700' : 'hover:bg-blue-800'
              }`}
            >
              🚀 Projetos
            </button>
          )}

          {temPermissao('configuracoes') && (
            <div>
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
                    onClick={() => selecionarAba('configuracoes-igreja')}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                      activeTab === 'configuracoes-igreja' ? 'bg-blue-600' : 'hover:bg-blue-700/80'
                    }`}
                  >
                    🏛️ Cadastro da Igreja / Congregações
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
            </div>
          )}
        </nav>

        <div className="space-y-2 border-t border-blue-800 p-4">
          <button
            type="button"
            onClick={() => setIsMobileModalOpen(true)}
            className="block w-full cursor-pointer rounded-xl bg-blue-800 px-4 py-2.5 text-center text-xs font-bold text-white shadow transition hover:bg-blue-700"
          >
            📱 Abrir Tela Mobile / Opções
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full cursor-pointer rounded-lg px-4 py-2 text-left text-sm font-medium text-red-300 transition hover:bg-blue-800"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* ========================================================================== */}
      /* 7. ÁREA DE CONTEÚDO PRINCIPAL — RENDERIZAÇÃO DOS MÓDULOS                   */
      /* ========================================================================== */}
      <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-8">
        {activeTab === 'dashboard' && temPermissao('dashboard') && (
          <DashboardHome loggedUser={userEfetivo} selecionarAba={selecionarAba} />
        )}

        {activeTab === 'app-mobile' && temPermissao('app-mobile') && (
          <div className="mx-auto w-full max-w-4xl">
            <AppMobileModule loggedUser={userEfetivo} />
          </div>
        )}

        {/* 7.1 CHAT MOBILE */}
        {activeTab === 'chat-mobile' && (
          <div className="mx-auto flex h-[75vh] max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow">
            <div className="flex items-center justify-between bg-slate-900 p-4 text-white">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <MessageSquare size={20} />
                  Chat e Avisos Mobile
                </h2>
                <p className="text-xs text-slate-400">
                  Comunicação direta com status online e repasse automático para líderes.
                </p>
              </div>

              {todaysBirthdays.length > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-slate-900">
                  <Bell size={14} />
                  🎂 {todaysBirthdays.length} aniversariante(s) hoje
                </div>
              )}
            </div>

            <div className="flex min-h-0 flex-1 overflow-hidden">
              <div className="w-1/3 overflow-y-auto border-r border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Membros e Status
                </h3>

                <div
                  onClick={() => setSelectedRecipient('all')}
                  className={`mb-2 cursor-pointer rounded-lg p-3 transition ${
                    selectedRecipient === 'all'
                      ? 'border border-blue-300 bg-blue-100'
                      : 'bg-white hover:bg-slate-100'
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-800">
                    📢 Todos os Membros
                  </p>
                  <p className="text-xs text-slate-500">
                    Enviar para toda a rede
                  </p>
                </div>

                {membrosChat.map((member) => (
                  <div
                    key={member.id}
                    onClick={() => setSelectedRecipient(member.id)}
                    className={`mb-2 flex cursor-pointer items-center justify-between rounded-lg p-3 transition ${
                      selectedRecipient === member.id
                        ? 'border border-blue-300 bg-blue-100'
                        : 'bg-white hover:bg-slate-100'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {member.nome || 'Membro sem nome'}
                      </p>
                      <p className="text-xs capitalize text-slate-500">
                        Tipo: {member.type}
                        {member.ehLiderOuPastor ? ' ⭐' : ''}
                      </p>
                    </div>

                    <span
                      className={`ml-3 h-2.5 w-2.5 shrink-0 rounded-full ${
                        member.status === 'online'
                          ? 'bg-emerald-500'
                          : 'bg-slate-300'
                      }`}
                      title={member.status === 'online' ? 'Online' : 'Offline'}
                    />
                  </div>
                ))}
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-between bg-white p-4">
                <div className="mb-3 border-b border-slate-200 pb-3">
                  <h3 className="text-sm font-bold text-slate-800">
                    {selectedRecipient === 'all'
                      ? '📢 Conversa Geral'
                      : `💬 Conversa com ${
                          membrosChat.find((member) => member.id === selectedRecipient)?.nome ||
                          'Membro selecionado'
                        }`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedRecipient === 'all'
                      ? 'Mensagem enviada para todos os membros'
                      : 'Conversa privada com este membro'}
                  </p>
                </div>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-2">
                  {chatMessages
                    .filter((msg) => {
                      const mensagem = msg as any;
                      if (selectedRecipient === 'all') {
                        return mensagem.isBroadcast || !mensagem.recipientId;
                      }
                      return (
                        !mensagem.isBroadcast &&
                        mensagem.recipientId === selectedRecipient
                      );
                    })
                    .map((msg) => (
                      <div
                        key={msg.id}
                        className={`relative group rounded-lg p-3 ${
                          msg.isBroadcast
                            ? 'mx-auto w-full border border-amber-200 bg-amber-50 text-center'
                            : 'bg-slate-100'
                        }`}
                      >
                        <div className="mb-1 flex justify-between text-xs text-slate-500">
                          <span className="font-semibold">{msg.sender}</span>
                          <div className="flex items-center gap-2">
                            <span>{msg.time}</span>
                            {(!msg.isBroadcast || isAdmin) && (
                              <button
                                type="button"
                                onClick={() => handleExcluirMensagemChat(msg.id, msg.isBroadcast)}
                                className="text-rose-500 hover:text-rose-700 p-0.5 rounded cursor-pointer"
                                title={msg.isBroadcast ? "Excluir transmissão geral (Admin)" : "Excluir mensagem"}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-800">{msg.text}</p>
                      </div>
                    ))}

                  {chatMessages.filter((msg) => {
                    const mensagem = msg as any;
                    if (selectedRecipient === 'all') {
                      return mensagem.isBroadcast || !mensagem.recipientId;
                    }
                    return (
                      !mensagem.isBroadcast &&
                      mensagem.recipientId === selectedRecipient
                    );
                  }).length === 0 && (
                    <p className="py-8 text-center text-xs text-slate-400">
                      Nenhuma mensagem nesta conversa.
                    </p>
                  )}
                </div>

                <div className="mt-4 flex gap-2 border-t border-slate-200 pt-3">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(event) => setMessageInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        handleSendMessage();
                      }
                    }}
                    placeholder={
                      selectedRecipient === 'all'
                        ? 'Escrever mensagem para todos os membros...'
                        : 'Digite sua mensagem privada...'
                    }
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />

                  <button
                    type="button"
                    onClick={handleSendMessage}
                    className="flex cursor-pointer items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800"
                  >
                    <Send size={16} />
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7.2 DEMAIS MÓDULOS */}
        {activeTab === 'cadastros-membros' && temPermissao('cadastros') && (
          <MembrosModule loggedUser={userEfetivo} />
        )}

        {activeTab === 'cadastros-fornecedores' && temPermissao('cadastros') && (
          <FornecedoresModule loggedUser={userEfetivo} />
        )}

        {activeTab === 'cadastros-ministerios' && temPermissao('cadastros') && (
          <MinisteriosModule loggedUser={userEfetivo} />
        )}

        {activeTab === 'acompanhamento-visitantes' && temPermissao('visitantes') && (
          <AcompanhamentoVisitantesModule loggedUser={userEfetivo} />
        )}

        {activeTab === 'celulas-modulo' && temPermissao('celulas') && (
          <CelulasModule loggedUser={userEfetivo} subAbaInicial={subAbaCelulas} />
        )}

        {activeTab.startsWith('discipulado') && temPermissao('discipulado') && (
          <DiscipuladoDEAModule loggedUser={userEfetivo} activeTab={activeTab} />
        )}

        {activeTab === 'configuracoes-usuarios' && temPermissao('configuracoes') && (
          <UsuariosModule loggedUser={userEfetivo} />
        )}

        {activeTab === 'configuracoes-igreja' && temPermissao('configuracoes') && (
          <CadastroIgrejaModule loggedUser={userEfetivo} />
        )}

        {activeTab === 'controle_registro' && temPermissao('configuracoes') && (
          <ControleRegistroModule loggedUser={userEfetivo} />
        )}

        {activeTab === 'projetos' && temPermissao('projetos') && (
          <ProjetosModule loggedUser={userEfetivo} />
        )}

        {activeTab === 'agenda' && temPermissao('agenda') && (
          <AgendaModule loggedUser={userEfetivo} />
        )}

        {activeTab === 'financeiro' && temPermissao('financeiro') && (
          <FinanceiroModule loggedUser={userEfetivo} />
        )}
      </main>

      {/* ========================================================================== */}
      /* 8. MODAL INTUITIVO MOBILE E GERADOR DE QR CODE                             */
      /* ========================================================================== */}
      {isMobileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/80 p-4">
          <div className="my-8 w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-xl font-black text-blue-900">
                  Painel Mobile e Atalhos
                </h3>
                <p className="text-xs text-slate-500">
                  Opções rápidas para dispositivos móveis
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileModalOpen(false)}
                className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600"
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
                  className="block w-full rounded-xl bg-blue-900 px-4 py-3 text-center text-sm font-bold text-white shadow transition hover:bg-blue-800"
                >
                  🔗 1. Abrir Tela de Cadastro Público
                </a>
                <p className="px-1 text-xs text-slate-500">
                  Abre a interface externa de cadastro de membros e visitantes.
                </p>
              </div>

              <div className="space-y-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileModalOpen(false);
                    selecionarAba('agenda');
                  }}
                  className="w-full rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-center text-sm font-bold text-indigo-900 transition hover:bg-indigo-100"
                >
                  📅 2. Ver Agenda e Próximos Eventos
                </button>
                <p className="px-1 text-xs text-slate-500">
                  Acesse cultos, reuniões e programações agendadas.
                </p>
              </div>

              <div className="space-y-3 border-t pt-4">
                <h4 className="text-sm font-bold text-blue-900">
                  📱 3. Gerar QR Code para Membros Escanearem
                </h4>
                <p className="text-xs leading-relaxed text-slate-600">
                  Gere um QR Code temporário, válido por 6 horas, para cadastro pelo celular.
                </p>

                {isAdmin && (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={gerarNovoQrCodeTemporario}
                      disabled={gerandoQr}
                      className="w-full rounded-xl bg-indigo-900 px-4 py-3 text-xs font-bold text-white transition hover:bg-indigo-800 disabled:opacity-50"
                    >
                      {gerandoQr ? 'Gerando QR Code...' : '⚡ Gerar QR Code na Tela'}
                    </button>

                    {qrCodeUrlDinamico && (
                      <div className="space-y-3 rounded-2xl border bg-slate-50 p-4 text-center">
                        <img
                          src={qrCodeUrlDinamico}
                          alt="QR Code temporário para cadastro"
                          className="mx-auto h-48 w-48 rounded-xl border bg-white object-contain p-2 shadow-sm"
                        />
                        <p className="text-[10px] font-semibold text-slate-500">
                          Mostre esta imagem para o membro escanear.
                        </p>
                        <button
                          type="button"
                          onClick={() => setQrCodeUrlDinamico('')}
                          className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                        >
                          ✕ Fechar QR Code
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {!isAdmin && (
                  <p className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-center text-xs font-semibold text-rose-600">
                    🔒 Recurso restrito: apenas administradores podem gerar o QR Code de cadastro.
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

/* ========================================================================== */
/* 9. SUBCOMPONENTE: DASHBOARD HOME (ESTATÍSTICAS E ANIVERSARIANTES)           */
/* ========================================================================== */
function DashboardHome({
  loggedUser,
  selecionarAba,
}: {
  loggedUser: any;
  selecionarAba: (aba: string) => void;
}) {
  const [modoAniversariantes, setModoAniversariantes] = useState<'dia' | 'mes'>('dia');
  const [aniversariantes, setAniversariantes] = useState<any[]>([]);
  const [loadingAniversariantes, setLoadingAniversariantes] = useState(false);

  const [qtdMembros, setQtdMembros] = useState(0);
  const [qtdVisitantes, setQtdVisitantes] = useState(0);
  
  const [modalListaOpen, setModalListaOpen] = useState(false);
  const [tipoListaModal, setTipoListaModal] = useState<'Membros' | 'Visitantes'>('Membros');
  const [listaPessoas, setListaPessoas] = useState<any[]>([]);
  const [buscaModal, setBuscaModal] = useState('');
  const [loadingLista, setLoadingLista] = useState(false);

  const [itemEditando, setItemEditando] = useState<any | null>(null);
  const [itemDetalhes, setItemDetalhes] = useState<any | null>(null);

  const codigoIgreja = loggedUser?.codigo_igreja || loggedUser?.igrejas?.codigo_igreja || 'IGR-001';

  const carregarTotais = useCallback(async () => {
    try {
      const { count: countMembros } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('codigo_igreja', codigoIgreja)
        .neq('tipo_cadastro', 'Visitante');

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

    const fetchAniversariantes = async () => {
      setLoadingAniversariantes(true);
      try {
        const { data, error } = await supabase
          .from('members')
          .select('id, nome, data_nascimento, celular_principal, tipo_cadastro')
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

    fetchAniversariantes();
  }, [codigoIgreja, modoAniversariantes]);

  const abrirModalLista = async (tipo: 'Membros' | 'Visitantes') => {
    setTipoListaModal(tipo);
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

      <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-2xl p-6 text-white shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-blue-700/60 pb-4">
          <div>
            <h3 className="text-lg font-black tracking-wide flex items-center gap-2">
              🎂 Aniversariantes {modoAniversariantes === 'dia' ? 'de Hoje' : 'do Mês'}
            </h3>
            <p className="text-xs text-blue-200">
              {modoAniversariantes === 'dia' ? 'Membros que sopram as velinhas hoje (Enviado automaticamente aos líderes).' : 'Todos os aniversariantes deste mês.'}
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
                    <p className="text-xs text-blue-200">📞 {m.celular_principal || 'Sem telefone'} {m.tipo_cadastro?.toLowerCase().includes('lider') && '⭐'}</p>
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
                    <option value="Lider">Líder</option>
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