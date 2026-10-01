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
import ChatModule from './ChatModule';
import DevocionalModule from './DevocionalModule';
import { podeEditarDevocional } from './devocionalUtil';
import CadastroIgrejaModule from './CadastroIgrejaModule';
import { MessageSquare, Bell } from 'lucide-react';
import ConfiguracoesModule from './ConfiguracoesModule';
import DashboardHome from './DashboardModule';

function getOrCreateDeviceToken() {
  let token = localStorage.getItem('app_device_token');
  if (!token) {
    token = 'DEV-' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('app_device_token', token);
  }
  return token;
}

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
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [codigoIgreja, setCodigoIgreja] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  // Membros (usado para os aniversariantes do dia; o chat agora fica no ChatModule)
  const [membrosChat, setMembrosChat] = useState<any[]>([]);

  const [qrCodeUrlDinamico, setQrCodeUrlDinamico] = useState('');
  const [gerandoQr, setGerandoQr] = useState(false);

  const isAdmin = loggedUser?.perfil === 'admin' || loggedUser?.perfil === 'administrador';
  // Devocional: administrador e pastor (a mesma regra do aplicativo)
  const podeDevocional = podeEditarDevocional(loggedUser);
  const igrejaAtual = loggedUser?.codigo_igreja || 'IGR-001';

  useEffect(() => {
    if (window.location.hostname.startsWith('app.')) {
      setIsMobileSubdomain(true);
    }
  }, []);

  useEffect(() => {
    const carregarMembros = async () => {
      const { data: membrosData, error: membrosError } = await supabase
        .from('members')
        .select('id, nome, tipo_cadastro, celular_principal, data_nascimento')
        .eq('codigo_igreja', igrejaAtual)
        .order('nome', { ascending: true });

      if (!membrosError && membrosData) {
        const membrosFormatados = membrosData.map((m: any) => ({
          id: m.id.toString(),
          nome: m.nome,
          type: m.tipo_cadastro || 'Membro',
          celular_principal: m.celular_principal,
          data_nascimento: m.data_nascimento,
        }));
        setMembrosChat(membrosFormatados);
      }
    };

    if (loggedUser) {
      carregarMembros();
    }
  }, [igrejaAtual, loggedUser]);

  // mês-dia de hoje no fuso do aparelho (toISOString usava o horário de Londres)
  const todayStr = `${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
  const todaysBirthdays = membrosChat.filter(m => (m.data_nascimento || '').slice(5, 10) === todayStr);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    const emailLimpo = email.trim().toLowerCase();

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: emailLimpo,
      password,
    });

    if (error) {
      alert('E-mail ou senha incorretos. Tente novamente.');
      return;
    }

    setSession(authData.session);
  };

  const gerarNovoQrCodeTemporario = async () => {
    if (!isAdmin) {
      alert('Apenas administradores podem gerar o QR Code temporário.');
      return;
    }
    if (!loggedUser) return;
    setGerandoQr(true);
    try {
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
        setIsConfigModalOpen(false);
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

    if (data.perfil === 'admin' || data.perfil === 'administrador') {
      setPermissoesAtivas(['dashboard', 'app-mobile', 'chat-mobile', 'cadastros', 'visitantes', 'celulas', 'discipulado', 'agenda', 'financeiro', 'projetos', 'configuracoes']);
      setPrecisaCompletarCadastro(false);
    } else {
      const { data: permData } = await supabase
        .from('permissoes_usuario')
        .select('modulo, permitido')
        .eq('usuario_id', data.id);

      const mods = permData ? permData.filter((p) => p.permitido).map((p) => p.modulo) : [];
      setPermissoesAtivas(mods);

      const { data: membroInfo } = await supabase
        .from('members')
        .select('id, cadastro_concluido')
        .eq('email', emailUsuario)
        .eq('codigo_igreja', data.codigo_igreja)
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

    if (!password || password.length < 6) {
      alert('⚠️ A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    const emailLimpo = email.trim().toLowerCase();

    const { count, error: countError } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true })
      .eq('codigo_igreja', codigoIgreja.toUpperCase().trim());

    const isPrimeiro = countError || count === 0;
    const perfilInicial = isPrimeiro ? 'administrador' : 'comum';

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: emailLimpo,
      password,
    });

    if (authError) {
      alert('Erro no cadastro (Auth): ' + authError.message);
      return;
    }

    const authUserId = authData.user?.id || authData.session?.user?.id;

    if (!authUserId) {
      alert('⚠️ Cadastro realizado, mas o Supabase exigiu confirmação por e-mail ou gerou sessão pendente. Verifique sua caixa de entrada ou faça login.');
      setIsLogin(true);
      return;
    }

    const { data: novoUsuario, error: profileError } = await supabase.from('usuarios').insert([
      {
        auth_user_id: authUserId,
        email: emailLimpo,
        nome_usuario: nomeUsuario.trim(),
        codigo_igreja: codigoIgreja.toUpperCase().trim(),
        perfil: perfilInicial,
        ativo: true,
      },
    ]).select().single();

    if (profileError) {
      alert('Erro ao criar perfil do usuário: ' + profileError.message);
      return;
    }

    if (novoUsuario && !isPrimeiro) {
      const modulosList = ['dashboard', 'cadastros', 'celulas', 'discipulado', 'agenda', 'financeiro', 'projetos', 'app_mobile'];
      const permissoesIniciais = modulosList.map((mod) => ({
        usuario_id: novoUsuario.id,
        modulo: mod,
        permitido: mod === 'app_mobile',
        codigo_igreja: codigoIgreja.toUpperCase().trim(),
      }));

      await supabase.from('permissoes_usuario').upsert(permissoesIniciais, { onConflict: 'usuario_id,modulo' });
    }

    if (authData.session) {
      setSession(authData.session);
      alert(isPrimeiro
        ? '🎉 Cadastro realizado! Como primeiro usuário desta igreja, você é o Administrador.'
        : '👤 Conta criada e logada com sucesso!');
    } else {
      alert('✅ Conta criada com sucesso! Por favor, faça login com suas credenciais.');
      setIsLogin(true);
    }
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
    let usuarioIdCriado = null;

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
        .eq('id', registroExistente.id)
        .select()
        .single();
      error = res.error;
      usuarioIdCriado = registroExistente.id;
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
      ]).select().single();
      error = res.error;
      usuarioIdCriado = res.data?.id;
    }

    if (error) {
      alert('Erro ao salvar perfil: ' + error.message);
      return;
    }

    if (usuarioIdCriado) {
      const modulosList = ['dashboard', 'cadastros', 'celulas', 'discipulado', 'agenda', 'financeiro', 'projetos', 'app_mobile'];
      const permissoesIniciais = modulosList.map((mod) => ({
        usuario_id: usuarioIdCriado,
        modulo: mod,
        permitido: mod === 'app_mobile',
        codigo_igreja: codigoIgreja.toUpperCase().trim(),
      }));

      await supabase.from('permissoes_usuario').upsert(permissoesIniciais, { onConflict: 'usuario_id,modulo' });
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

  if (isMobileSubdomain) {
    return (
      <div className="min-h-screen bg-slate-100 p-2 sm:p-4 w-full">
        <AppMobileModule loggedUser={userEfetivo} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Cabeçalho Mobile */}
      <header className="lg:hidden bg-blue-900 text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div>
          <h1 className="text-lg font-black">SISTEMA IGREJA</h1>
          <p className="text-[10px] text-blue-200">{userEfetivo.nome_usuario} ({userEfetivo.codigo_igreja})</p>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileModalOpen(true)}
          className="bg-blue-800 px-3 py-2 rounded-xl text-xs font-bold shadow cursor-pointer"
        >
          ☰ Menu & Módulos
        </button>
      </header>

      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-64 bg-blue-900 text-white flex-col shrink-0">
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

          {podeDevocional && (
            <button
              type="button"
              onClick={() => selecionarAba('devocional')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition cursor-pointer flex items-center justify-between ${
                activeTab === 'devocional' ? 'bg-blue-700 font-bold' : 'hover:bg-blue-800'
              }`}
            >
              <span className="flex items-center gap-2">📖 Devocional</span>
              <span className="text-[10px] bg-emerald-500 text-white font-black px-2 py-0.5 rounded-full">APP</span>
            </button>
          )}

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
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(true)}
              className="w-full text-left px-4 py-3 rounded-lg font-medium transition cursor-pointer hover:bg-blue-800 flex items-center gap-2"
            >
              <span>⚙️ Configurações & Backup</span>
            </button>
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

      {/* Main Content Adaptativo */}
      <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-8">
        {activeTab === 'dashboard' && temPermissao('dashboard') && (
          <DashboardHome loggedUser={userEfetivo} selecionarAba={selecionarAba} />
        )}

        {activeTab === 'app-mobile' && temPermissao('app-mobile') && (
          <div className="mx-auto w-full max-w-4xl">
            <AppMobileModule loggedUser={userEfetivo} />
          </div>
        )}

        {/* Chat: o mesmo do aplicativo (mesmas conversas, quem está online e chamadas) */}
        {activeTab === 'chat-mobile' && (
          <div className="mx-auto flex h-[80vh] min-h-[520px] max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow">
            <div className="flex shrink-0 items-center justify-between gap-3 bg-blue-900 px-4 py-3 text-white">
              <div className="min-w-0">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <MessageSquare size={20} />
                  Chat da Igreja
                </h2>
                <p className="truncate text-xs text-blue-200">
                  As mesmas conversas do aplicativo: mensagens, quem está online e chamadas.
                </p>
              </div>

              {todaysBirthdays.length > 0 && (
                <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-slate-900">
                  <Bell size={14} />
                  🎂 {todaysBirthdays.length} aniversariante(s) hoje
                </div>
              )}
            </div>

            <ChatModule loggedUser={userEfetivo} />
          </div>
        )}

        {activeTab === 'devocional' && podeDevocional && (
          <DevocionalModule loggedUser={userEfetivo} />
        )}

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

      {/* Modal / Tela Flutuante de Configurações & Backup */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-4 shrink-0">
              <div>
                <h3 className="text-2xl font-black text-blue-900">⚙️ Painel de Configurações & Backup</h3>
                <p className="text-xs text-slate-500 mt-0.5">Gerenciamento unificado da igreja, usuários e segurança dos dados</p>
              </div>
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl cursor-pointer transition"
              >
                ✕ Fechar
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-1">
              <ConfiguracoesModule loggedUser={userEfetivo} />
            </div>
          </div>
        </div>
      )}

      {/* Modal Mobile e Atalhos */}
      {isMobileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/80 p-4">
          <div className="my-8 w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-xl font-black text-blue-900">
                  Menu & Navegação de Módulos
                </h3>
                <p className="text-xs text-slate-500">
                  Selecione a seção desejada
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileModalOpen(false)}
                className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {temPermissao('dashboard') && (
                <button
                  type="button"
                  onClick={() => { selecionarAba('dashboard'); setIsMobileModalOpen(false); }}
                  className="w-full text-left px-4 py-3 rounded-xl bg-slate-100 font-bold text-slate-800 hover:bg-blue-900 hover:text-white transition"
                >
                  🏠 Dashboard
                </button>
              )}

              {temPermissao('app-mobile') && (
                <button
                  type="button"
                  onClick={() => { selecionarAba('app-mobile'); setIsMobileModalOpen(false); }}
                  className="w-full text-left px-4 py-3 rounded-xl bg-slate-100 font-bold text-slate-800 hover:bg-blue-900 hover:text-white transition"
                >
                  📱 Aplicativo Mobile
                </button>
              )}

              <button
                type="button"
                onClick={() => { selecionarAba('chat-mobile'); setIsMobileModalOpen(false); }}
                className="w-full text-left px-4 py-3 rounded-xl bg-slate-100 font-bold text-slate-800 hover:bg-blue-900 hover:text-white transition"
              >
                💬 Chat & Aniversários
              </button>

              {podeDevocional && (
                <button
                  type="button"
                  onClick={() => { selecionarAba('devocional'); setIsMobileModalOpen(false); }}
                  className="w-full text-left px-4 py-3 rounded-xl bg-slate-100 font-bold text-slate-800 hover:bg-blue-900 hover:text-white transition"
                >
                  📖 Devocional
                </button>
              )}

              {temPermissao('cadastros') && (
                <>
                  <button
                    type="button"
                    onClick={() => { selecionarAba('cadastros-membros'); setIsMobileModalOpen(false); }}
                    className="w-full text-left px-4 py-3 rounded-xl bg-slate-100 font-bold text-slate-800 hover:bg-blue-900 hover:text-white transition"
                  >
                    👥 Membros
                  </button>
                  <button
                    type="button"
                    onClick={() => { selecionarAba('cadastros-fornecedores'); setIsMobileModalOpen(false); }}
                    className="w-full text-left px-4 py-3 rounded-xl bg-slate-100 font-bold text-slate-800 hover:bg-blue-900 hover:text-white transition"
                  >
                    🏢 Fornecedores
                  </button>
                  <button
                    type="button"
                    onClick={() => { selecionarAba('cadastros-ministerios'); setIsMobileModalOpen(false); }}
                    className="w-full text-left px-4 py-3 rounded-xl bg-slate-100 font-bold text-slate-800 hover:bg-blue-900 hover:text-white transition"
                  >
                    🏛️ Ministérios
                  </button>
                </>
              )}

              {temPermissao('visitantes') && (
                <button
                  type="button"
                  onClick={() => { selecionarAba('acompanhamento-visitantes'); setIsMobileModalOpen(false); }}
                  className="w-full text-left px-4 py-3 rounded-xl bg-slate-100 font-bold text-slate-800 hover:bg-blue-900 hover:text-white transition"
                >
                  🤝 Acompanhamento Visitantes
                </button>
              )}

              {temPermissao('celulas') && (
                <button
                  type="button"
                  onClick={() => { setSubAbaCelulas('celulas'); selecionarAba('celulas-modulo'); setIsMobileModalOpen(false); }}
                  className="w-full text-left px-4 py-3 rounded-xl bg-slate-100 font-bold text-slate-800 hover:bg-blue-900 hover:text-white transition"
                >
                  🏡 Células
                </button>
              )}

              {temPermissao('discipulado') && (
                <button
                  type="button"
                  onClick={() => { selecionarAba('discipulado-dea'); setIsMobileModalOpen(false); }}
                  className="w-full text-left px-4 py-3 rounded-xl bg-slate-100 font-bold text-slate-800 hover:bg-blue-900 hover:text-white transition"
                >
                  🌱 Discipulado (D.E.A.)
                </button>
              )}

              {temPermissao('agenda') && (
                <button
                  type="button"
                  onClick={() => { selecionarAba('agenda'); setIsMobileModalOpen(false); }}
                  className="w-full text-left px-4 py-3 rounded-xl bg-slate-100 font-bold text-slate-800 hover:bg-blue-900 hover:text-white transition"
                >
                  📅 Agenda
                </button>
              )}

              {temPermissao('financeiro') && (
                <button
                  type="button"
                  onClick={() => { selecionarAba('financeiro'); setIsMobileModalOpen(false); }}
                  className="w-full text-left px-4 py-3 rounded-xl bg-slate-100 font-bold text-slate-800 hover:bg-blue-900 hover:text-white transition"
                >
                  💰 Financeiro
                </button>
              )}

              {temPermissao('projetos') && (
                <button
                  type="button"
                  onClick={() => { selecionarAba('projetos'); setIsMobileModalOpen(false); }}
                  className="w-full text-left px-4 py-3 rounded-xl bg-slate-100 font-bold text-slate-800 hover:bg-blue-900 hover:text-white transition"
                >
                  🚀 Projetos
                </button>
              )}

              {temPermissao('configuracoes') && (
                <button
                  type="button"
                  onClick={() => { setIsMobileModalOpen(false); setIsConfigModalOpen(true); }}
                  className="w-full text-left px-4 py-3 rounded-xl bg-indigo-50 font-bold text-indigo-900 hover:bg-indigo-100 transition"
                >
                  ⚙️ Configurações & Backup
                </button>
              )}
            </div>

            <div className="space-y-3 border-t pt-4">
              <h4 className="text-sm font-bold text-blue-900">
                📱 Gerar QR Code para Membros
              </h4>
              <p className="text-xs leading-relaxed text-slate-600">
                Gere um QR Code temporário para cadastro rápido pelo telemóvel.
              </p>

              {isAdmin && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={gerarNovoQrCodeTemporario}
                    disabled={gerandoQr}
                    className="w-full rounded-xl bg-indigo-900 px-4 py-3 text-xs font-bold text-white transition hover:bg-indigo-800 disabled:opacity-50 cursor-pointer"
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
                      <button
                        type="button"
                        onClick={() => setQrCodeUrlDinamico('')}
                        className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 cursor-pointer"
                      >
                        ✕ Fechar QR Code
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
