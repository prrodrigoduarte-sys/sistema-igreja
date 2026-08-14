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

  // --- MENU SUPERIOR E DROPDOWNS ---
  const [activeTab, setActiveTab] = useState<'membros' | 'usuarios' | 'fornecedores' | 'relatorios'>('membros');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- MODAIS FLUTUANTES ---
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // --- ESTADOS DE MEMBRO (EDIÇÃO / EXCLUSÃO) ---
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [deletingMember, setDeletingMember] = useState<any>(null);
  const [showInactives, setShowInactives] = useState(false);

  // Motivos de Exclusão
  const [motivoExclusao, setMotivoExclusao] = useState('');
  const [detalheExclusao, setDetalheExclusao] = useState('');

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
  const initialFormData = {
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
  };
  const [formData, setFormData] = useState(initialFormData);

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

  // --- ABRIR MODAL PARA NOVO MEMBRO ---
  const handleOpenNewMemberModal = () => {
    setEditingMemberId(null);
    setFormData(initialFormData);
    setPhotoFile(null);
    setPhotoPreview(null);
    setIsMemberModalOpen(true);
  };

  // --- ABRIR MODAL PARA EDITAR MEMBRO ---
  const handleOpenEditMemberModal = (member: any) => {
    setEditingMemberId(member.id);
    setFormData({
      tipo_cadastro: member.tipo_cadastro || '',
      nome: member.nome || '',
      cpf: member.cpf || '',
      sexo: member.sexo || '',
      nascimento: member.nascimento || '',
      identificacao: member.identificacao || '',
      nacionalidade: member.nacionalidade || 'Brasileira',
      naturalidade: member.naturalidade || '',
      email: member.email || '',
      escolaridade: member.escolaridade || '',
      profissao: member.profissao || '',
      empresa: member.empresa || '',
      nome_contato: member.nome_contato || '',
      celular_principal: member.celular_principal || '',
      celular_secundario: member.celular_secundario || '',
      telefone_fixo: member.telefone_fixo || ''
    });
    setPhotoPreview(member.foto_url || null);
    setPhotoFile(null);
    setIsMemberModalOpen(true);
  };

  // --- SUBMIT: SALVAR / ATUALIZAR MEMBRO ---
  const handleRegisterMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let fotoUrl = photoPreview;
      if (photoFile) {
        const uploadedUrl = await uploadPhoto(photoFile);
        if (uploadedUrl) {
          fotoUrl = uploadedUrl;
        }
      }

      const payload = {
        ...formData,
        codigo_igreja: loggedUser.codigo_igreja,
        foto_url: fotoUrl,
        ativo: true
      };

      if (editingMemberId) {
        // Atualiza membro existente
        const { error } = await supabase
          .from('members')
          .update(payload)
          .eq('id', editingMemberId);
        if (error) throw error;
        alert('Cadastro do membro atualizado com sucesso!');
      } else {
        // Insere novo membro
        const { error } = await supabase.from('members').insert([payload]);
        if (error) throw error;
        alert('Membro cadastrado com sucesso!');
      }

      setFormData(initialFormData);
      setPhotoFile(null);
      setPhotoPreview(null);
      setEditingMemberId(null);
      setIsMemberModalOpen(false);

      fetchMembers(loggedUser.codigo_igreja);
    } catch (err: any) {
      alert('Erro ao salvar membro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- INATIVAR MEMBRO (EXCLUSÃO LÓGICA COM MOTIVO) ---
  const handleOpenDeleteModal = (member: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingMember(member);
    setMotivoExclusao('');
    setDetalheExclusao('');
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!motivoExclusao) {
      alert('Selecione o motivo da exclusão.');
      return;
    }
    if (motivoExclusao === 'outros' && !detalheExclusao.trim()) {
      alert('Por favor, informe os detalhes do motivo.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('members')
        .update({
          ativo: false,
          motivo_exclusao: motivoExclusao,
          detalhe_exclusao: motivoExclusao === 'outros' ? detalheExclusao.trim() : null,
          data_exclusao: new Date().toISOString()
        })
        .eq('id', deletingMember.id);

      if (error) throw error;

      alert('Membro inativado/desligado com sucesso!');
      setIsDeleteModalOpen(false);
      setDeletingMember(null);
      fetchMembers(loggedUser.codigo_igreja);
    } catch (err: any) {
      alert('Erro ao inativar membro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- RESTAURAR MEMBRO ---
  const handleRestoreMember = async (memberId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Deseja reativar este membro no sistema?')) return;

    try {
      const { error } = await supabase
        .from('members')
        .update({
          ativo: true,
          motivo_exclusao: null,
          detalhe_exclusao: null,
          data_exclusao: null
        })
        .eq('id', memberId);

      if (error) throw error;

      alert('Membro restaurado e reativado com sucesso!');
      fetchMembers(loggedUser.codigo_igreja);
    } catch (err: any) {
      alert('Erro ao restaurar membro: ' + err.message);
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

  // --- FILTRAGEM INTELIGENTE (NOME OU CPF) E STATUS ---
  const filteredMembers = members.filter((m) => {
    const isStatusMatch = showInactives ? m.ativo === false : m.ativo !== false;
    const term = searchTerm.toLowerCase().trim();
    const isSearchMatch =
      !term ||
      m.nome?.toLowerCase().includes(term) ||
      m.cpf?.replaceAll('.', '').replaceAll('-', '').includes(term.replaceAll('.', '').replaceAll('-', ''));

    return isStatusMatch && isSearchMatch;
  });

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  // --- TELA 1: LOGIN PRINCIPAL COM LOGO BRSYSTEM ---
  if (!isLoggedIn) {
    const isLocked = lockUntil && Date.now() < lockUntil;

    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 space-y-6 border border-slate-100">
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center gap-2.5">
              <div className="w-12 h-12 bg-gradient-to-tr from-blue-900 via-blue-700 to-indigo-600 rounded-2xl shadow-lg flex items-center justify-center text-white transform rotate-3">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="text-left">
                <span className="text-2xl font-black text-blue-900 tracking-tight block leading-none">BRSYSTEM</span>
                <span className="text-[10px] font-bold text-indigo-600 tracking-widest uppercase">Gestão & Tecnologia</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium">Acesse a plataforma da sua instituição</p>
          </div>

          {isLocked && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-xs text-center font-semibold">
              ⚠️ Acesso bloqueado por 3 tentativas incorretas. Retorne após 1 hora.
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Código da Igreja</label>
              <input
                type="text"
                required
                disabled={!!isLocked}
                placeholder="Ex: IGR-001"
                value={loginCodigo}
                onChange={(e) => setLoginCodigo(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Usuário</label>
              <input
                type="text"
                required
                disabled={!!isLocked}
                placeholder="Seu usuário"
                value={loginUsuario}
                onChange={(e) => setLoginUsuario(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Senha</label>
              <input
                type="password"
                required
                disabled={!!isLocked}
                placeholder="••••••••"
                value={loginSenha}
                onChange={(e) => setLoginSenha(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading || !!isLocked}
              className="w-full py-3.5 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-700 hover:opacity-95 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
            >
              {loginLoading ? 'Acessando...' : 'Entrar no Sistema'}
            </button>
          </form>

          {failedAttempts > 0 && !isLocked && (
            <p className="text-xs text-center text-rose-500 font-semibold">
              Aviso: {failedAttempts} de 3 tentativas utilizadas.
            </p>
          )}
        </div>
      </div>
    );
  }

  // --- TELA 2: DASHBOARD PRINCIPAL ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* CABEÇALHO SUPERIOR */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 shadow-xs relative z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5 cursor-pointer group">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-900 via-blue-700 to-indigo-600 rounded-xl shadow-md flex items-center justify-center text-white transform group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-blue-900 tracking-tight leading-none">BRSYSTEM</span>
                <span className="text-[9px] font-extrabold text-indigo-600 tracking-widest uppercase">Tecnologia</span>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-blue-900">
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('cadastros')}
                  className="flex items-center gap-1 hover:text-indigo-600 transition-colors py-2"
                >
                  <span>Cadastros</span>
                  <span className="text-xs">∨</span>
                </button>

                {openDropdown === 'cadastros' && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50">
                    <button
                      onClick={() => { setActiveTab('membros'); setOpenDropdown(null); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-semibold"
                    >
                      📋 Membros
                    </button>
                    <button
                      onClick={() => { setActiveTab('usuarios'); setOpenDropdown(null); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-semibold"
                    >
                      👤 Usuários
                    </button>
                    <button
                      onClick={() => { setActiveTab('fornecedores'); setOpenDropdown(null); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-semibold"
                    >
                      🚚 Fornecedores
                    </button>
                    <button
                      onClick={() => { setActiveTab('relatorios'); setOpenDropdown(null); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-semibold border-t border-slate-100"
                    >
                      📊 Relatórios
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <button onClick={() => toggleDropdown('celulas')} className="flex items-center gap-1 hover:text-indigo-600 transition-colors py-2">
                  <span>Células</span>
                  <span className="text-xs">∨</span>
                </button>
              </div>

              <div className="relative">
                <button onClick={() => toggleDropdown('agenda')} className="flex items-center gap-1 hover:text-indigo-600 transition-colors py-2">
                  <span>Agenda</span>
                  <span className="text-xs">∨</span>
                </button>
              </div>

              <div className="relative">
                <button onClick={() => toggleDropdown('financeiro')} className="flex items-center gap-1 hover:text-indigo-600 transition-colors py-2">
                  <span>Financeiro</span>
                  <span className="text-xs">∨</span>
                </button>
              </div>

              <div className="relative">
                <button onClick={() => toggleDropdown('controle')} className="flex items-center gap-1 hover:text-indigo-600 transition-colors py-2">
                  <span>Controle</span>
                  <span className="text-xs">∨</span>
                </button>
              </div>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-slate-800">{loggedIgreja?.nome_fantasia || 'Igreja'}</p>
              <p className="text-xs text-slate-500 font-medium">{loggedUser?.nome_usuario}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
            >
              Sair
            </button>
          </div>

        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL DA TELA */}
      <main className="max-w-7xl w-full mx-auto p-6 space-y-6 flex-1">
        
        {/* ABA 1: MEMBROS */}
        {activeTab === 'membros' && (
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {showInactives ? 'Membros Inativos / Desligados' : 'Cadastro de Membros'} ({filteredMembers.length})
                </h2>
                <p className="text-xs text-slate-500">Clique na linha do membro para editar seu cadastro completo.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* BOTÃO ALTERNAR ATIVOS / INATIVOS */}
                <button
                  onClick={() => setShowInactives(!showInactives)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors ${
                    showInactives
                      ? 'bg-amber-100 border-amber-300 text-amber-800'
                      : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {showInactives ? '← Ver Membros Ativos' : '📂 Ver Desligados'}
                </button>

                {/* CAMPO DE PESQUISA POR NOME OU CPF */}
                <input
                  type="text"
                  placeholder="Buscar por Nome ou CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 rounded-xl border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-600"
                />

                {!showInactives && (
                  <button
                    onClick={handleOpenNewMemberModal}
                    className="px-4 py-2 bg-gradient-to-r from-blue-900 to-indigo-700 hover:opacity-95 text-white font-bold text-sm rounded-xl shadow transition-all flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <span>+</span> Novo Membro
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 text-sm font-semibold">
                    <th className="py-3 px-4">Foto</th>
                    <th className="py-3 px-4">Nome</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">CPF</th>
                    <th className="py-3 px-4">Celular</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((m) => (
                      <tr
                        key={m.id}
                        onClick={() => handleOpenEditMemberModal(m)}
                        className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border">
                            {m.foto_url ? (
                              <img src={m.foto_url} alt={m.nome} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] text-slate-400 flex items-center justify-center h-full">Sem foto</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">{m.nome}</td>
                        <td className="py-3 px-4">{m.tipo_cadastro}</td>
                        <td className="py-3 px-4 font-mono">{m.cpf || '-'}</td>
                        <td className="py-3 px-4">{m.celular_principal || '-'}</td>
                        <td className="py-3 px-4 text-right">
                          {!showInactives ? (
                            <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleOpenEditMemberModal(m)}
                                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold text-xs rounded-lg"
                              >
                                Alterar
                              </button>
                              <button
                                onClick={(e) => handleOpenDeleteModal(m, e)}
                                className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs rounded-lg"
                              >
                                Excluir
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => handleRestoreMember(m.id, e)}
                              className="px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs rounded-lg"
                            >
                              ♻️ Restaurar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        {showInactives ? 'Nenhum membro desligado encontrado.' : 'Nenhum membro cadastrado.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA 2: USUÁRIOS */}
        {activeTab === 'usuarios' && (
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  Cadastro de Usuários ({usersList.length})
                </h2>
                <p className="text-xs text-slate-500">Usuários autorizados a acessar o sistema desta igreja.</p>
              </div>

              <button
                onClick={() => setIsUserModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-900 to-indigo-700 hover:opacity-95 text-white font-bold text-sm rounded-xl shadow transition-all flex items-center gap-1.5 whitespace-nowrap"
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
                        <td className="py-3 px-4 font-semibold text-slate-900">{u.nome_usuario || 'Não informado'}</td>
                        <td className="py-3 px-4 font-mono text-blue-800 font-bold">{u.usuario}</td>
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

        {/* ABA 3: FORNECEDORES */}
        {activeTab === 'fornecedores' && (
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-2xl font-bold text-slate-800">Cadastro de Fornecedores</h2>
              <button onClick={() => alert('Módulo em breve!')} className="px-4 py-2 bg-blue-800 text-white font-bold text-sm rounded-xl">
                + Novo Fornecedor
              </button>
            </div>
            <p className="text-center py-8 text-slate-400">Módulo de Fornecedores em breve...</p>
          </div>
        )}

        {/* ABA 4: RELATÓRIOS */}
        {activeTab === 'relatorios' && (
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-2xl font-bold text-slate-800">Relatórios e Estatísticas Gerais</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
                <p className="text-xs font-bold text-blue-600 uppercase">Membros Ativos</p>
                <p className="text-3xl font-extrabold text-blue-900 mt-2">{members.filter(m => m.ativo !== false).length}</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl">
                <p className="text-xs font-bold text-amber-600 uppercase">Membros Desligados</p>
                <p className="text-3xl font-extrabold text-amber-900 mt-2">{members.filter(m => m.ativo === false).length}</p>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl">
                <p className="text-xs font-bold text-indigo-600 uppercase">Usuários no Sistema</p>
                <p className="text-3xl font-extrabold text-indigo-900 mt-2">{usersList.length}</p>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* --- MODAL 1: CADASTRO / EDIÇÃO DE MEMBRO --- */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white max-w-3xl w-full rounded-2xl shadow-2xl border border-slate-200 my-8 overflow-hidden">
            <div className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">{editingMemberId ? 'Alterar Cadastro de Membro' : 'Novo Cadastro de Membro'}</h3>
                <p className="text-xs text-blue-200">Igreja: {loggedIgreja?.nome_fantasia || loggedIgreja?.codigo_igreja}</p>
              </div>
              <button onClick={() => setIsMemberModalOpen(false)} className="text-slate-300 hover:text-white text-2xl font-bold">&times;</button>
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
                        <button type="button" onClick={startCamera} className="bg-blue-800 text-white px-3 py-1.5 rounded-md text-xs font-semibold">Tirar Foto</button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={capturePhoto} className="bg-emerald-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold">Capturar</button>
                        <button type="button" onClick={stopCamera} className="bg-rose-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold">Cancelar</button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo Cadastro *</label>
                  <select name="tipo_cadastro" value={formData.tipo_cadastro} onChange={handleChange} required className="w-full rounded-md border p-2 text-sm">
                    <option value="">Selecione...</option>
                    <option value="Membro">Membro</option>
                    <option value="Visitante">Visitante</option>
                    <option value="Congregado">Congregado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nome completo *</label>
                  <input type="text" name="nome" value={formData.nome} onChange={handleChange} required className="w-full rounded-md border p-2 text-sm" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">CPF</label>
                  <input type="text" name="cpf" placeholder="000.000.000-00" value={formData.cpf} onChange={handleChange} className="w-full rounded-md border p-2 text-sm" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Sexo *</label>
                  <select name="sexo" value={formData.sexo} onChange={handleChange} required className="w-full rounded-md border p-2 text-sm">
                    <option value="">Selecione...</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nascimento *</label>
                  <input type="date" name="nascimento" value={formData.nascimento} onChange={handleChange} required className="w-full rounded-md border p-2 text-sm" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Identificação</label>
                  <input type="text" name="identificacao" placeholder="RG / RGM" value={formData.identificacao} onChange={handleChange} className="w-full rounded-md border p-2 text-sm" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nacionalidade</label>
                  <input type="text" name="nacionalidade" value={formData.nacionalidade} onChange={handleChange} className="w-full rounded-md border p-2 text-sm" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Naturalidade - Cidade</label>
                  <input type="text" name="naturalidade" value={formData.naturalidade} onChange={handleChange} className="w-full rounded-md border p-2 text-sm" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full rounded-md border p-2 text-sm" />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-bold text-slate-800 mb-3">Contatos</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nome Contato</label>
                    <input type="text" name="nome_contato" value={formData.nome_contato} onChange={handleChange} className="w-full rounded-md border p-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Celular Principal</label>
                    <input type="text" name="celular_principal" placeholder="(00) 00000-0000" value={formData.celular_principal} onChange={handleChange} className="w-full rounded-md border p-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Celular secundário</label>
                    <input type="text" name="celular_secundario" placeholder="(00) 00000-0000" value={formData.celular_secundario} onChange={handleChange} className="w-full rounded-md border p-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Telefone Fixo</label>
                    <input type="text" name="telefone_fixo" placeholder="(00) 0000-0000" value={formData.telefone_fixo} onChange={handleChange} className="w-full rounded-md border p-2 text-sm" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={() => setIsMemberModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-900 text-white font-bold text-sm rounded-lg shadow">
                  {loading ? 'Salvando...' : editingMemberId ? 'Salvar Alterações' : 'Salvar Cadastro'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: INBOX DE MOTIVO DE EXCLUSÃO --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-rose-700 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Desligamento de Membro</h3>
                <p className="text-xs text-rose-200">Informe o motivo da exclusão/desligamento</p>
              </div>
              <button onClick={() => setIsDeleteModalOpen(false)} className="text-white text-2xl font-bold">&times;</button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm font-semibold text-slate-800">
                Membro: <span className="text-blue-900 font-extrabold">{deletingMember?.nome}</span>
              </p>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase">Selecione o Motivo *</label>
                
                <label className="flex items-center gap-2 p-3 border rounded-xl hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="motivo"
                    value="1) Saiu da igreja sem dar informações"
                    checked={motivoExclusao === '1) Saiu da igreja sem dar informações'}
                    onChange={(e) => setMotivoExclusao(e.target.value)}
                  />
                  <span className="text-xs font-medium text-slate-700">1) Saiu da igreja sem dar informações</span>
                </label>

                <label className="flex items-center gap-2 p-3 border rounded-xl hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="motivo"
                    value="2) Afastou-se por criar problemas"
                    checked={motivoExclusao === '2) Afastou-se por criar problemas'}
                    onChange={(e) => setMotivoExclusao(e.target.value)}
                  />
                  <span className="text-xs font-medium text-slate-700">2) Afastou-se por criar problemas</span>
                </label>

                <label className="flex items-center gap-2 p-3 border rounded-xl hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="motivo"
                    value="outros"
                    checked={motivoExclusao === 'outros'}
                    onChange={(e) => setMotivoExclusao(e.target.value)}
                  />
                  <span className="text-xs font-medium text-slate-700">3) Outros (Informações livres)</span>
                </label>
              </div>

              {/* CAMPO LIVRE PARA MOTIVO OUTROS */}
              {motivoExclusao === 'outros' && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Especifique o Motivo *</label>
                  <textarea
                    rows={3}
                    placeholder="Digite aqui as observações sobre o desligamento..."
                    value={detalheExclusao}
                    onChange={(e) => setDetalheExclusao(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-slate-700 font-medium text-xs hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={loading}
                  className="px-6 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-lg shadow"
                >
                  {loading ? 'Processando...' : 'Confirmar Exclusão'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: CADASTRO DE USUÁRIO --- */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Novo Usuário do Sistema</h3>
                <p className="text-xs text-slate-300">Vincular a: {loggedIgreja?.codigo_igreja}</p>
              </div>
              <button onClick={() => setIsUserModalOpen(false)} className="text-white text-2xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleRegisterUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nome do Operador *</label>
                <input type="text" name="nome_usuario" required placeholder="Ex: João da Silva" value={userFormData.nome_usuario} onChange={handleUserChange} className="w-full rounded-lg border p-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Usuário (Login) *</label>
                <input type="text" name="usuario" required placeholder="Ex: joao" value={userFormData.usuario} onChange={handleUserChange} className="w-full rounded-lg border p-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Senha de Acesso *</label>
                <input type="password" name="senha" required placeholder="••••••••" value={userFormData.senha} onChange={handleUserChange} className="w-full rounded-lg border p-2.5 text-sm" />
              </div>
              <div className="flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-900 text-white font-bold text-sm rounded-lg shadow">
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