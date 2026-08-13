import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

export default function App() {
  // --- ESTADOS DE AUTENTICAÇÃO E SESSÃO ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedUser, setLoggedUser] = useState<any>(null);
  const [loggedIgreja, setLoggedIgreja] = useState<any>(null);

  // Campos do Login
  const [loginCodigo, setLoginCodigo] = useState('IGR-001');
  const [loginUsuario, setLoginUsuario] = useState('');
  const [loginSenha, setLoginSenha] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Segurança: 3 Tentativas e Bloqueio de 1 hora
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState<number | null>(null);

  // --- MENU LATERAL FLUTUANTE (SIDEBAR) ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'membros' | 'usuarios' | 'fornecedores'>('membros');

  // --- MODAIS FLUTUANTES DE CADASTRO ---
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // --- LISTAS DE DADOS ---
  const [members, setMembers] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Foto / Câmera
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [useCamera, setUseCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Formulário de Membro
  const [formData, setFormData] = useState({
    tipo_cadastro: '',
    nome: '',
    cpf: '',
    sexo: '',
    nascimento: '',
    identificacao: '',
    nacionalidade: 'Brasileira',
    naturalidade: '',
    email: '',
    escolaridade: '',
    profissao: '',
    empresa: '',
    nome_contato: '',
    celular_principal: '',
    celular_secundario: '',
    telefone_fixo: ''
  });

  // Formulário de Usuário
  const [userFormData, setUserFormData] = useState({
    nome_usuario: '',
    usuario: '',
    senha: ''
  });

  // --- CHECAGEM DE BLOQUEIO DE LOGIN LOCAL ---
  useEffect(() => {
    const savedLock = localStorage.getItem('login_lock_until');
    const savedAttempts = localStorage.getItem('login_failed_attempts');
    if (savedLock) {
      const lockTime = parseInt(savedLock, 10);
      if (Date.now() < lockTime) {
        setLockUntil(lockTime);
      } else {
        localStorage.removeItem('login_lock_until');
        localStorage.removeItem('login_failed_attempts');
      }
    }
    if (savedAttempts) {
      setFailedAttempts(parseInt(savedAttempts, 10));
    }
  }, []);

  // --- LÓGICA DE LOGIN ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (lockUntil && Date.now() < lockUntil) {
      const minutesLeft = Math.ceil((lockUntil - Date.now()) / (1000 * 60));
      alert(`Acesso bloqueado por muitas tentativas incorretas. Tente novamente em ${minutesLeft} minutos.`);
      return;
    }

    setLoginLoading(true);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*, igrejas(*)')
        .eq('codigo_igreja', loginCodigo.trim())
        .eq('usuario', loginUsuario.trim())
        .eq('senha', loginSenha.trim())
        .single();

      if (error || !data) {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        localStorage.setItem('login_failed_attempts', newAttempts.toString());

        if (newAttempts >= 3) {
          const oneHour = Date.now() + 60 * 60 * 1000;
          setLockUntil(oneHour);
          localStorage.setItem('login_lock_until', oneHour.toString());
          alert('Erro no login! Você errou a senha 3 vezes. Seu acesso foi bloqueado por 1 hora.');
        } else {
          alert(`Usuário ou senha incorretos. Tentativa ${newAttempts} de 3.`);
        }
        return;
      }

      setFailedAttempts(0);
      setLockUntil(null);
      localStorage.removeItem('login_failed_attempts');
      localStorage.removeItem('login_lock_until');

      setLoggedUser(data);
      setLoggedIgreja(data.igrejas);
      setIsLoggedIn(true);

      fetchMembers(data.codigo_igreja);
      fetchUsers(data.codigo_igreja);
    } catch (err: any) {
      alert('Erro ao realizar login: ' + err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoggedUser(null);
    setLoggedIgreja(null);
    setIsSidebarOpen(false);
    setIsMemberModalOpen(false);
    setIsUserModalOpen(false);
  };

  // --- BUSCA DE DADOS ---
  const fetchMembers = async (codigoIgreja: string) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('codigo_igreja', codigoIgreja);
      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error('Erro ao buscar membros:', err);
    }
  };

  const fetchUsers = async (codigoIgreja: string) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('codigo_igreja', codigoIgreja);
      if (error) throw error;
      setUsersList(data || []);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserFormData({ ...userFormData, [e.target.name]: e.target.value });
  };

  // --- CÂMERA E FOTO ---
  const startCamera = async () => {
    setUseCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('Não foi possível acessar a câmera.');
      setUseCamera(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 300;
      canvas.height = video.videoHeight || 300;

      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setPhotoPreview(dataUrl);

        fetch(dataUrl)
          .then((res) => res.blob())
          .then((blob) => {
            const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
            setPhotoFile(file);
          });
      }
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    setUseCamera(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('membrosfotos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('membrosfotos')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (err: any) {
      console.error('Erro no upload:', err.message);
      return null;
    }
  };

  // --- SUBMIT: MEMBRO ---
  const handleRegisterMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let fotoUrl = '';
      if (photoFile) {
        const uploadedUrl = await uploadPhoto(photoFile);
        if (uploadedUrl) {
          fotoUrl = uploadedUrl;
        }
      }

      const payload = {
        ...formData,
        codigo_igreja: loggedUser.codigo_igreja,
        foto_url: fotoUrl
      };

      const { error } = await supabase.from('members').insert([payload]);
      if (error) throw error;

      alert('Membro cadastrado com sucesso!');

      setFormData({
        tipo_cadastro: '',
        nome: '',
        cpf: '',
        sexo: '',
        nascimento: '',
        identificacao: '',
        nacionalidade: 'Brasileira',
        naturalidade: '',
        email: '',
        escolaridade: '',
        profissao: '',
        empresa: '',
        nome_contato: '',
        celular_principal: '',
        celular_secundario: '',
        telefone_fixo: ''
      });
      setPhotoFile(null);
      setPhotoPreview(null);
      setIsMemberModalOpen(false);

      fetchMembers(loggedUser.codigo_igreja);
    } catch (err: any) {
      alert('Erro ao cadastrar membro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- SUBMIT: USUÁRIO ---
  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        codigo_igreja: loggedUser.codigo_igreja,
        nome_usuario: userFormData.nome_usuario,
        usuario: userFormData.usuario.trim(),
        senha: userFormData.senha.trim(),
        ativo: true
      };

      const { error } = await supabase.from('usuarios').insert([payload]);
      if (error) throw error;

      alert('Usuário cadastrado com sucesso! Já pode realizar login.');

      setUserFormData({
        nome_usuario: '',
        usuario: '',
        senha: ''
      });
      setIsUserModalOpen(false);

      fetchUsers(loggedUser.codigo_igreja);
    } catch (err: any) {
      alert('Erro ao cadastrar usuário: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.cpf?.includes(searchTerm)
  );

  // --- TELA 1: LOGIN PRINCIPAL ---
  if (!isLoggedIn) {
    const isLocked = lockUntil && Date.now() < lockUntil;

    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-extrabold text-slate-800">Sistema Igreja</h1>
            <p className="text-sm text-slate-500">Entre com as credenciais da sua instituição</p>
          </div>

          {isLocked && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-lg text-sm text-center">
              ⚠️ <strong>Acesso Bloqueado!</strong> Você excedeu 3 tentativas incorretas. Retorne após 1 hora.
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Código da Igreja</label>
              <input
                type="text"
                required
                disabled={!!isLocked}
                placeholder="Ex: IGR-001"
                value={loginCodigo}
                onChange={(e) => setLoginCodigo(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Usuário</label>
              <input
                type="text"
                required
                disabled={!!isLocked}
                placeholder="Seu usuário"
                value={loginUsuario}
                onChange={(e) => setLoginUsuario(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Senha</label>
              <input
                type="password"
                required
                disabled={!!isLocked}
                placeholder="••••••••"
                value={loginSenha}
                onChange={(e) => setLoginSenha(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading || !!isLocked}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow transition-colors disabled:opacity-50"
            >
              {loginLoading ? 'Verificando...' : 'Entrar no Sistema'}
            </button>
          </form>

          {failedAttempts > 0 && !isLocked && (
            <p className="text-xs text-center text-rose-500 font-medium">
              Aviso: {failedAttempts} de 3 tentativas utilizadas.
            </p>
          )}
        </div>
      </div>
    );
  }

  // --- TELA 2: DASHBOARD COM MENU LATERAL FLUTUANTE ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
      
      {/* CAMEÇALHO SUPERIOR */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-4">
          {/* Botão Hambúrguer para Abrir o Menu Lateral */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold transition-colors flex items-center gap-2"
          >
            <span className="text-xl">☰</span>
            <span className="text-sm hidden sm:inline">Menu</span>
          </button>

          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {loggedIgreja?.nome_fantasia || loggedIgreja?.razao_social || 'Painel Administrativo'}
            </h1>
            <p className="text-xs text-slate-500">
              Código: <span className="font-mono font-semibold">{loggedUser?.codigo_igreja}</span> | Operador: <span className="font-semibold text-slate-700">{loggedUser?.nome_usuario}</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-sm rounded-lg transition-colors"
        >
          Sair
        </button>
      </header>

      {/* --- MENU LATERAL FLUTUANTE (SIDEBAR FLUTUANTE) --- */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Fundo Escuro Clicável */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Painel do Menu Lateral */}
          <div className="relative bg-slate-900 text-white w-72 max-w-full h-full shadow-2xl p-6 flex flex-col justify-between z-10">
            <div>
              {/* Topo do Menu Lateral */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div>
                  <h2 className="font-extrabold text-lg text-indigo-400">SISTEMA IGREJA</h2>
                  <p className="text-xs text-slate-400">Navegação Principal</p>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-slate-400 hover:text-white text-2xl font-bold"
                >
                  &times;
                </button>
              </div>

              {/* GRUPO CADASTRO */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-400 tracking-wider uppercase px-2">
                  📁 CADASTRO
                </div>

                <div className="space-y-1 pl-2">
                  {/* Opção 1: Membros */}
                  <button
                    onClick={() => {
                      setActiveTab('membros');
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                      activeTab === 'membros'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>📋</span> Cadastro de Membros
                  </button>

                  {/* Opção 2: Usuários */}
                  <button
                    onClick={() => {
                      setActiveTab('usuarios');
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                      activeTab === 'usuarios'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>👤</span> Cadastro de Usuários
                  </button>

                  {/* Opção 3: Fornecedores */}
                  <button
                    onClick={() => {
                      setActiveTab('fornecedores');
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                      activeTab === 'fornecedores'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>🚚</span> Cadastro de Fornecedores
                  </button>
                </div>
              </div>
            </div>

            {/* Rodapé do Menu Lateral */}
            <div className="border-t border-slate-800 pt-4 text-xs text-slate-500 text-center">
              Igreja: {loggedUser?.codigo_igreja}
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL DA TELA */}
      <main className="max-w-6xl w-full mx-auto p-6 space-y-6 flex-1">
        
        {/* OPÇÃO 1: MEMBROS */}
        {activeTab === 'membros' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  Cadastro de Membros ({filteredMembers.length})
                </h2>
                <p className="text-xs text-slate-500">Membros, visitantes e congregados registrados.</p>
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Buscar por nome ou CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 rounded-lg border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={() => setIsMemberModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span>+</span> Novo Membro
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 text-sm font-semibold">
                    <th className="py-3 px-4">Nome</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">CPF</th>
                    <th className="py-3 px-4">Celular</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-medium text-slate-900">{m.nome}</td>
                        <td className="py-3 px-4">{m.tipo_cadastro}</td>
                        <td className="py-3 px-4">{m.cpf || '-'}</td>
                        <td className="py-3 px-4">{m.celular_principal || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        Nenhum membro cadastrado nesta igreja até o momento.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* OPÇÃO 2: USUÁRIOS */}
        {activeTab === 'usuarios' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  Cadastro de Usuários ({usersList.length})
                </h2>
                <p className="text-xs text-slate-500">Usuários autorizados a acessar o sistema desta igreja.</p>
              </div>

              <button
                onClick={() => setIsUserModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>+</span> Novo Usuário
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 text-sm font-semibold">
                    <th className="py-3 px-4">Nome Operador</th>
                    <th className="py-3 px-4">Login (Usuário)</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {usersList.length > 0 ? (
                    usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-medium text-slate-900">{u.nome_usuario || 'Não informado'}</td>
                        <td className="py-3 px-4 font-mono text-indigo-600 font-semibold">{u.usuario}</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
                            Ativo
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400">
                        Nenhum usuário cadastrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* OPÇÃO 3: FORNECEDORES */}
        {activeTab === 'fornecedores' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  Cadastro de Fornecedores
                </h2>
                <p className="text-xs text-slate-500">Fornecedores e prestadores de serviços da igreja.</p>
              </div>

              <button
                onClick={() => alert('Módulo de fornecedores em breve!')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>+</span> Novo Fornecedor
              </button>
            </div>

            <div className="py-12 text-center text-slate-400 space-y-2">
              <p className="text-lg font-semibold">Módulo de Fornecedores pronto para receber cadastros.</p>
              <p className="text-xs">Podemos criar a tabela no Supabase para esse cadastro a qualquer momento!</p>
            </div>
          </div>
        )}

      </main>

      {/* --- MODAL FLUTUANTE 1: CADASTRO DE MEMBRO --- */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white max-w-3xl w-full rounded-2xl shadow-2xl border border-slate-200 my-8 overflow-hidden">
            <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Cadastro de Membro</h3>
                <p className="text-xs text-slate-300">Igreja: {loggedIgreja?.nome_fantasia || loggedIgreja?.codigo_igreja}</p>
              </div>
              <button
                onClick={() => setIsMemberModalOpen(false)}
                className="text-slate-400 hover:text-white text-2xl font-bold leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleRegisterMember} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row items-center gap-6">
                <div className="w-28 h-28 rounded-full border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden relative flex-shrink-0">
                  {useCamera ? (
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  ) : photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-slate-400 font-medium text-center px-2">Sem foto</span>
                  )}
                </div>

                <canvas ref={canvasRef} className="hidden" />

                <div className="space-y-2 text-center sm:text-left">
                  <h4 className="text-sm font-semibold text-slate-700">Foto do Membro</h4>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
                    {!useCamera ? (
                      <>
                        <label className="cursor-pointer bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-md text-xs font-semibold">
                          Inspecionar / Arquivo
                          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        </label>
                        <button
                          type="button"
                          onClick={startCamera}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-xs font-semibold"
                        >
                          Tirar Foto
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md text-xs font-semibold"
                        >
                          Capturar Foto
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-md text-xs font-semibold"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo Cadastro *</label>
                  <select name="tipo_cadastro" value={formData.tipo_cadastro} onChange={handleChange} required className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500">
                    <option value="">Selecione...</option>
                    <option value="Membro">Membro</option>
                    <option value="Visitante">Visitante</option>
                    <option value="Congregado">Congregado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nome completo *</label>
                  <input type="text" name="nome" value={formData.nome} onChange={handleChange} required className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">CPF</label>
                  <input type="text" name="cpf" placeholder="000.000.000-00" value={formData.cpf} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Sexo *</label>
                  <select name="sexo" value={formData.sexo} onChange={handleChange} required className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500">
                    <option value="">Selecione...</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nascimento *</label>
                  <input type="date" name="nascimento" value={formData.nascimento} onChange={handleChange} required className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Identificação</label>
                  <input type="text" name="identificacao" placeholder="RG / RGM" value={formData.identificacao} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nacionalidade</label>
                  <input type="text" name="nacionalidade" value={formData.nacionalidade} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Naturalidade - Cidade</label>
                  <input type="text" name="naturalidade" value={formData.naturalidade} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Escolaridade</label>
                  <select name="escolaridade" value={formData.escolaridade} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500">
                    <option value="">Selecione...</option>
                    <option value="Fundamental">Ensino Fundamental</option>
                    <option value="Médio">Ensino Médio</option>
                    <option value="Superior">Ensino Superior</option>
                    <option value="Pós-Graduação">Pós-Graduação</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Profissão</label>
                  <input type="text" name="profissao" value={formData.profissao} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Empresa</label>
                  <input type="text" name="empresa" value={formData.empresa} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-bold text-slate-800 mb-3">Contatos</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nome Contato</label>
                    <input type="text" name="nome_contato" value={formData.nome_contato} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Celular Principal</label>
                    <input type="text" name="celular_principal" placeholder="(00) 00000-0000" value={formData.celular_principal} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Celular secundário</label>
                    <input type="text" name="celular_secundario" placeholder="(00) 00000-0000" value={formData.celular_secundario} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Telefone Fixo</label>
                    <input type="text" name="telefone_fixo" placeholder="(00) 0000-0000" value={formData.telefone_fixo} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg shadow disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar Cadastro'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* --- MODAL FLUTUANTE 2: CADASTRO DE USUÁRIO --- */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Novo Usuário do Sistema</h3>
                <p className="text-xs text-slate-300">Vincular a: {loggedIgreja?.codigo_igreja}</p>
              </div>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="text-slate-400 hover:text-white text-2xl font-bold leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleRegisterUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nome do Operador *</label>
                <input
                  type="text"
                  name="nome_usuario"
                  required
                  placeholder="Ex: João da Silva"
                  value={userFormData.nome_usuario}
                  onChange={handleUserChange}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Usuário (Login) *</label>
                <input
                  type="text"
                  name="usuario"
                  required
                  placeholder="Ex: joao"
                  value={userFormData.usuario}
                  onChange={handleUserChange}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Senha de Acesso *</label>
                <input
                  type="password"
                  name="senha"
                  required
                  placeholder="••••••••"
                  value={userFormData.senha}
                  onChange={handleUserChange}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg shadow disabled:opacity-50"
                >
                  {loading ? 'Cadastrando...' : 'Cadastrar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}