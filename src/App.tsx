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
  const [activeTab, setActiveTab] = useState<'membros' | 'usuarios' | 'fornecedores' | 'relatorios' | 'igreja'>('membros');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // --- CONTROLADOR DE ORIGEM DA EDIÇÃO ---
  const [editSource, setEditSource] = useState<'membros' | 'relatorios'>('membros');

  // --- TIPOS DE RELATÓRIO ---
  const [reportType, setReportType] = useState<'aniversariantes' | 'completo'>('aniversariantes');
  const [filterMonth, setFilterMonth] = useState<string>('todos');

  // --- MODAIS FLUTUANTES DE CADASTRO ---
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isChurchModalOpen, setIsChurchModalOpen] = useState(false);
  const [isDeleteMemberModalOpen, setIsDeleteMemberModalOpen] = useState(false);

  // --- ESTADOS DE EDIÇÃO ---
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [editingChurchId, setEditingChurchId] = useState<string | null>(null);

  const [deletingMember, setDeletingMember] = useState<any>(null);
  const [showInactives, setShowInactives] = useState(false);

  // Motivos de Exclusão para Membro
  const [motivoExclusao, setMotivoExclusao] = useState('');
  const [detalheExclusao, setDetalheExclusao] = useState('');

  // --- LISTAS DE DADOS ---
  const [members, setMembers] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [churchesList, setChurchesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Foto / Câmera
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [useCamera, setUseCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- FORMULÁRIOS ---
  const initialMemberFormData = {
    tipo_cadastro: '',
    nome: '',
    cpf: '',
    sexo: '',
    nascimento: '',
    identificacao: '',
    nacionalidade: 'Brasileira',
    naturalidade: '',
    rua: '',
    numero: '',
    bairro: '',
    cidade: 'Teófilo Otoni',
    uf: 'MG',
    email: '',
    escolaridade: '',
    profissao: '',
    empresa: '',
    nome_contato: '',
    celular_principal: '',
    celular_secundario: '',
    telefone_fixo: ''
  };
  const [formData, setFormData] = useState(initialMemberFormData);

  const initialUserFormData = {
    nome_usuario: '',
    usuario: '',
    senha: ''
  };
  const [userFormData, setUserFormData] = useState(initialUserFormData);

  const initialSupplierFormData = {
    razao_social: '',
    nome_fantasia: '',
    cnpj_cpf: '',
    categoria: '',
    telefone: '',
    email: '',
    contato_responsavel: '',
    cidade_uf: '',
    observacoes: ''
  };
  const [supplierFormData, setSupplierFormData] = useState(initialSupplierFormData);

  const initialChurchFormData = {
    nome_fantasia: '',
    razao_social: '',
    cnpj: '',
    codigo_igreja: '',
    endereco: '',
    telefone: '',
    email: '',
    responsavel_nome: '',
    tesoureiro_nome: '',
    contador_nome: ''
  };
  const [churchFormData, setChurchFormData] = useState(initialChurchFormData);

  // --- ATALHO ESC PARA RETORNAR AO MENU / SAIR ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMemberModalOpen) {
          handleCloseMemberModal();
        } else if (isUserModalOpen) {
          setIsUserModalOpen(false);
        } else if (isSupplierModalOpen) {
          setIsSupplierModalOpen(false);
        } else if (isChurchModalOpen) {
          setIsChurchModalOpen(false);
        } else if (isDeleteMemberModalOpen) {
          setIsDeleteMemberModalOpen(false);
        } else if (activeTab === 'relatorios') {
          handleGoHome();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isMemberModalOpen,
    isUserModalOpen,
    isSupplierModalOpen,
    isChurchModalOpen,
    isDeleteMemberModalOpen,
    activeTab,
    editSource
  ]);

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

  // --- NAVEGAÇÃO HOME VIA LOGO ---
  const handleGoHome = () => {
    setActiveTab('membros');
    setOpenDropdown(null);
    setShowInactives(false);
    setSearchTerm('');
  };

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
        .eq('ativo', true)
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
          alert(`Usuário ou senha incorretos ou inativos. Tentativa ${newAttempts} de 3.`);
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
      fetchSuppliers(data.codigo_igreja);
      fetchChurches();
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
    setIsSupplierModalOpen(false);
    setIsChurchModalOpen(false);
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

  const fetchSuppliers = async (codigoIgreja: string) => {
    try {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .eq('codigo_igreja', codigoIgreja);
      if (error) throw error;
      setSuppliersList(data || []);
    } catch (err) {
      console.error('Erro ao buscar fornecedores:', err);
    }
  };

  const fetchChurches = async () => {
    try {
      const { data, error } = await supabase.from('igrejas').select('*');
      if (error) throw error;
      setChurchesList(data || []);
    } catch (err) {
      console.error('Erro ao buscar igrejas:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserFormData({ ...userFormData, [e.target.name]: e.target.value });
  };

  const handleSupplierChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSupplierFormData({ ...supplierFormData, [e.target.name]: e.target.value });
  };

  const handleChurchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChurchFormData({ ...churchFormData, [e.target.name]: e.target.value });
  };

  // --- IGREJA: MODAL / SUBMIT / EXCLUSÃO ---
  const generateChurchCode = () => {
    const count = churchesList.length + 1;
    return `IGR-${count.toString().padStart(3, '0')}`;
  };

  const handleOpenNewChurchModal = () => {
    setEditingChurchId(null);
    setChurchFormData({
      ...initialChurchFormData,
      codigo_igreja: generateChurchCode()
    });
    setIsChurchModalOpen(true);
  };

  const handleOpenEditChurchModal = (church: any) => {
    setEditingChurchId(church.id);
    setChurchFormData({
      nome_fantasia: church.nome_fantasia || '',
      razao_social: church.razao_social || '',
      cnpj: church.cnpj || '',
      codigo_igreja: church.codigo_igreja || '',
      endereco: church.endereco || '',
      telefone: church.telefone || '',
      email: church.email || '',
      responsavel_nome: church.responsavel_nome || '',
      tesoureiro_nome: church.tesoureiro_nome || '',
      contador_nome: church.contador_nome || ''
    });
    setIsChurchModalOpen(true);
  };

  const handleRegisterChurch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...churchFormData,
        ativo: true
      };

      if (editingChurchId) {
        const { error } = await supabase.from('igrejas').update(payload).eq('id', editingChurchId);
        if (error) throw error;
        alert('Cadastro da igreja atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('igrejas').insert([payload]);
        if (error) throw error;
        alert('Igreja cadastrada com sucesso! Código gerado: ' + payload.codigo_igreja);
      }

      setChurchFormData(initialChurchFormData);
      setEditingChurchId(null);
      setIsChurchModalOpen(false);
      fetchChurches();
    } catch (err: any) {
      alert('Erro ao salvar igreja: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChurchDirect = async (church: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (church.codigo_igreja === loggedIgreja?.codigo_igreja) {
      alert('Ação negada! Não é possível inativar a igreja que está logada no momento.');
      return;
    }
    if (!confirm(`Tem certeza que deseja inativar a igreja "${church.nome_fantasia}" (${church.codigo_igreja})?`)) return;

    try {
      const { error } = await supabase
        .from('igrejas')
        .update({ ativo: false, data_exclusao: new Date().toISOString() })
        .eq('id', church.id);

      if (error) throw error;

      alert('Igreja inativada com sucesso!');
      fetchChurches();
    } catch (err: any) {
      alert('Erro ao inativar igreja: ' + err.message);
    }
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

  // --- MEMBROS: MODAL / SUBMIT / FECHAMENTO COM RETORNO INTELIGENTE ---
  const handleOpenNewMemberModal = (fromTab: 'membros' | 'relatorios' = 'membros') => {
    setEditSource(fromTab);
    setEditingMemberId(null);
    setFormData(initialMemberFormData);
    setPhotoFile(null);
    setPhotoPreview(null);
    setIsMemberModalOpen(true);
  };

  const handleOpenEditMemberModal = (member: any, fromTab: 'membros' | 'relatorios' = 'membros') => {
    setEditSource(fromTab);
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
      rua: member.rua || '',
      numero: member.numero || '',
      bairro: member.bairro || '',
      cidade: member.cidade || 'Teófilo Otoni',
      uf: member.uf || 'MG',
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

  const handleCloseMemberModal = () => {
    setIsMemberModalOpen(false);
    setEditingMemberId(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    if (editSource === 'relatorios') {
      setActiveTab('relatorios');
    }
  };

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
        const { error } = await supabase.from('members').update(payload).eq('id', editingMemberId);
        if (error) throw error;
        alert('Cadastro do membro atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('members').insert([payload]);
        if (error) throw error;
        alert('Membro cadastrado com sucesso!');
      }

      setFormData(initialMemberFormData);
      handleCloseMemberModal();
      fetchMembers(loggedUser.codigo_igreja);
    } catch (err: any) {
      alert('Erro ao salvar membro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- EXCLUSÃO DE MEMBRO ---
  const handleOpenDeleteMemberModal = (member: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingMember(member);
    setMotivoExclusao('');
    setDetalheExclusao('');
    setIsDeleteMemberModalOpen(true);
  };

  const handleConfirmDeleteMember = async () => {
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
      setIsDeleteMemberModalOpen(false);
      setDeletingMember(null);
      fetchMembers(loggedUser.codigo_igreja);
    } catch (err: any) {
      alert('Erro ao inativar membro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- USUÁRIOS: MODAL / SUBMIT / EXCLUSÃO ---
  const handleOpenNewUserModal = () => {
    setEditingUserId(null);
    setUserFormData(initialUserFormData);
    setIsUserModalOpen(true);
  };

  const handleOpenEditUserModal = (user: any) => {
    const isTargetAdmin = user.nome_usuario?.trim().toLowerCase() === 'administrador';
    const isCurrentAdmin = loggedUser?.nome_usuario?.trim().toLowerCase() === 'administrador';

    if (isTargetAdmin && !isCurrentAdmin) {
      alert('Acesso negado! Apenas o operador Administrador master pode alterar o usuário Administrador.');
      return;
    }

    setEditingUserId(user.id);
    setUserFormData({
      nome_usuario: user.nome_usuario || '',
      usuario: user.usuario || '',
      senha: user.senha || ''
    });
    setIsUserModalOpen(true);
  };

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();

    const targetOperadorClean = userFormData.nome_usuario.trim().toLowerCase();
    const isTargetAdmin = targetOperadorClean === 'administrador';
    const isCurrentAdmin = loggedUser?.nome_usuario?.trim().toLowerCase() === 'administrador';

    if (isTargetAdmin && !isCurrentAdmin) {
      alert('Ação não permitida! Você não tem permissão para atribuir o nome de operador Administrador.');
      return;
    }

    if (isTargetAdmin) {
      const existsAdmin = usersList.find(
        (u) => u.id !== editingUserId && u.nome_usuario?.trim().toLowerCase() === 'administrador'
      );
      if (existsAdmin) {
        alert('Já existe um operador "Administrador" no sistema!');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        codigo_igreja: loggedUser.codigo_igreja,
        nome_usuario: userFormData.nome_usuario.trim(),
        usuario: userFormData.usuario.trim(),
        senha: userFormData.senha.trim(),
        ativo: true
      };

      if (editingUserId) {
        const { error } = await supabase.from('usuarios').update(payload).eq('id', editingUserId);
        if (error) throw error;
        alert('Usuário atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('usuarios').insert([payload]);
        if (error) throw error;
        alert('Usuário cadastrado com sucesso!');
      }

      setUserFormData(initialUserFormData);
      setEditingUserId(null);
      setIsUserModalOpen(false);
      fetchUsers(loggedUser.codigo_igreja);
    } catch (err: any) {
      alert('Erro ao salvar usuário: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUserDirect = async (user: any, e: React.MouseEvent) => {
    e.stopPropagation();

    const isTargetAdmin = user.nome_usuario?.trim().toLowerCase() === 'administrador';
    if (isTargetAdmin) {
      alert('Operação negada! O operador Administrador master não pode ser inativado ou excluído do sistema.');
      return;
    }

    if (!confirm(`Tem certeza que deseja inativar o usuário "${user.nome_usuario || user.usuario}"?`)) return;

    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ ativo: false, data_exclusao: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;

      alert('Usuário inativado com sucesso!');
      fetchUsers(loggedUser.codigo_igreja);
    } catch (err: any) {
      alert('Erro ao inativar usuário: ' + err.message);
    }
  };

  // --- FORNECEDORES: MODAL / SUBMIT / EXCLUSÃO ---
  const handleOpenNewSupplierModal = () => {
    setEditingSupplierId(null);
    setSupplierFormData(initialSupplierFormData);
    setIsSupplierModalOpen(true);
  };

  const handleOpenEditSupplierModal = (supplier: any) => {
    setEditingSupplierId(supplier.id);
    setSupplierFormData({
      razao_social: supplier.razao_social || '',
      nome_fantasia: supplier.nome_fantasia || '',
      cnpj_cpf: supplier.cnpj_cpf || '',
      categoria: supplier.categoria || '',
      telefone: supplier.telefone || '',
      email: supplier.email || '',
      contato_responsavel: supplier.contato_responsavel || '',
      cidade_uf: supplier.cidade_uf || '',
      observacoes: supplier.observacoes || ''
    });
    setIsSupplierModalOpen(true);
  };

  const handleRegisterSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...supplierFormData,
        codigo_igreja: loggedUser.codigo_igreja,
        ativo: true
      };

      if (editingSupplierId) {
        const { error } = await supabase.from('fornecedores').update(payload).eq('id', editingSupplierId);
        if (error) throw error;
        alert('Fornecedor atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('fornecedores').insert([payload]);
        if (error) throw error;
        alert('Fornecedor cadastrado com sucesso!');
      }

      setSupplierFormData(initialSupplierFormData);
      setEditingSupplierId(null);
      setIsSupplierModalOpen(false);
      fetchSuppliers(loggedUser.codigo_igreja);
    } catch (err: any) {
      alert('Erro ao salvar fornecedor: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSupplierDirect = async (supplier: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Tem certeza que deseja inativar o fornecedor "${supplier.razao_social}"?`)) return;

    try {
      const { error } = await supabase
        .from('fornecedores')
        .update({ ativo: false, data_exclusao: new Date().toISOString() })
        .eq('id', supplier.id);

      if (error) throw error;

      alert('Fornecedor inativado com sucesso!');
      fetchSuppliers(loggedUser.codigo_igreja);
    } catch (err: any) {
      alert('Erro ao inativar fornecedor: ' + err.message);
    }
  };

  // --- RESTAURAR REGISTRO INATIVO ---
  const handleRestoreItem = async (id: string, type: 'membro' | 'usuario' | 'fornecedor' | 'igreja', e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Deseja reativar este registro no sistema?')) return;

    try {
      const tableName =
        type === 'membro'
          ? 'members'
          : type === 'usuario'
          ? 'usuarios'
          : type === 'fornecedor'
          ? 'fornecedores'
          : 'igrejas';

      const { error } = await supabase
        .from(tableName)
        .update({
          ativo: true,
          motivo_exclusao: null,
          detalhe_exclusao: null,
          data_exclusao: null
        })
        .eq('id', id);

      if (error) throw error;

      alert('Registro restaurado e reativado com sucesso!');
      if (type === 'membro') fetchMembers(loggedUser.codigo_igreja);
      if (type === 'usuario') fetchUsers(loggedUser.codigo_igreja);
      if (type === 'fornecedor') fetchSuppliers(loggedUser.codigo_igreja);
      if (type === 'igreja') fetchChurches();
    } catch (err: any) {
      alert('Erro ao restaurar registro: ' + err.message);
    }
  };

  // --- FUNÇÕES AUXILIARES DE DATA E ENDEREÇO ---
  const formatBirthday = (dateStr: string) => {
    if (!dateStr) return { formatted: '-', monthNum: 0 };
    const parts = dateStr.split('-');
    if (parts.length !== 3) return { formatted: '-', monthNum: 0 };
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    const year = parseInt(parts[0], 10);

    const today = new Date();
    let age = today.getFullYear() - year;
    const m = today.getMonth() + 1 - month;
    if (m < 0 || (m === 0 && today.getDate() < day)) {
      age--;
    }

    return {
      formatted: `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')} (${age} anos)`,
      monthNum: month
    };
  };

  const buildAddress = (m: any) => {
    const parts = [];
    if (m.rua) parts.push(m.rua);
    if (m.numero) parts.push(`Nº ${m.numero}`);
    if (m.bairro) parts.push(m.bairro);
    if (m.cidade) parts.push(`${m.cidade}${m.uf ? '-' + m.uf : ''}`);
    return parts.length > 0 ? parts.join(', ') : m.naturalidade || 'Endereço não informado';
  };

  // --- FILTRAGENS INTELIGENTES ---
  const filteredMembers = members.filter((m) => {
    const isStatusMatch = showInactives ? m.ativo === false : m.ativo !== false;
    const term = searchTerm.toLowerCase().trim();
    const isSearchMatch =
      !term ||
      m.nome?.toLowerCase().includes(term) ||
      m.cpf?.replaceAll('.', '').replaceAll('-', '').includes(term.replaceAll('.', '').replaceAll('-', ''));

    if (!isStatusMatch || !isSearchMatch) return false;

    if (activeTab === 'relatorios' && reportType === 'aniversariantes' && filterMonth !== 'todos') {
      const bdayInfo = formatBirthday(m.nascimento);
      return bdayInfo.monthNum === parseInt(filterMonth, 10);
    }

    return true;
  });

  const filteredUsers = usersList.filter((u) => {
    const isStatusMatch = showInactives ? u.ativo === false : u.ativo !== false;
    const term = searchTerm.toLowerCase().trim();
    const isSearchMatch =
      !term ||
      u.nome_usuario?.toLowerCase().includes(term) ||
      u.usuario?.toLowerCase().includes(term);
    return isStatusMatch && isSearchMatch;
  });

  const filteredSuppliers = suppliersList.filter((s) => {
    const isStatusMatch = showInactives ? s.ativo === false : s.ativo !== false;
    const term = searchTerm.toLowerCase().trim();
    const isSearchMatch =
      !term ||
      s.razao_social?.toLowerCase().includes(term) ||
      s.nome_fantasia?.toLowerCase().includes(term) ||
      s.cnpj_cpf?.replaceAll('.', '').replaceAll('-', '').replaceAll('/', '').includes(term.replaceAll('.', '').replaceAll('-', '').replaceAll('/', ''));
    return isStatusMatch && isSearchMatch;
  });

  const filteredChurches = churchesList.filter((c) => {
    const isStatusMatch = showInactives ? c.ativo === false : c.ativo !== false;
    const term = searchTerm.toLowerCase().trim();
    const isSearchMatch =
      !term ||
      c.nome_fantasia?.toLowerCase().includes(term) ||
      c.codigo_igreja?.toLowerCase().includes(term) ||
      c.cnpj?.replaceAll('.', '').replaceAll('-', '').replaceAll('/', '').includes(term.replaceAll('.', '').replaceAll('-', '').replaceAll('/', ''));
    return isStatusMatch && isSearchMatch;
  });

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const handlePrintReport = () => {
    window.print();
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
    <div className="min-h-screen bg-slate-50 flex flex-col" onClick={() => openDropdown && setOpenDropdown(null)}>
      
      {/* CABEÇALHO SUPERIOR */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 shadow-xs relative z-30 print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center gap-8">
            <div onClick={handleGoHome} className="flex items-center gap-2.5 cursor-pointer group" title="Ir para o menu inicial">
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
              
              <div className="relative" onClick={(e) => e.stopPropagation()}>
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

              <div className="relative"><button onClick={() => toggleDropdown('celulas')} className="flex items-center gap-1 hover:text-indigo-600 py-2"><span>Células</span><span className="text-xs">∨</span></button></div>
              <div className="relative"><button onClick={() => toggleDropdown('agenda')} className="flex items-center gap-1 hover:text-indigo-600 py-2"><span>Agenda</span><span className="text-xs">∨</span></button></div>
              <div className="relative"><button onClick={() => toggleDropdown('financeiro')} className="flex items-center gap-1 hover:text-indigo-600 py-2"><span>Financeiro</span><span className="text-xs">∨</span></button></div>
              
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => toggleDropdown('controle')}
                  className="flex items-center gap-1 hover:text-indigo-600 transition-colors py-2"
                >
                  <span>Controle</span>
                  <span className="text-xs">∨</span>
                </button>

                {openDropdown === 'controle' && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50">
                    <button
                      onClick={() => { setActiveTab('igreja'); setOpenDropdown(null); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-semibold"
                    >
                      ⛪ Cadastro da Igreja
                    </button>
                  </div>
                )}
              </div>

            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-slate-800">{loggedIgreja?.nome_fantasia || 'Igreja'}</p>
              <p className="text-xs text-slate-500 font-medium">{loggedUser?.nome_usuario}</p>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors">Sair</button>
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
                <button
                  onClick={() => setShowInactives(!showInactives)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors ${
                    showInactives ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {showInactives ? '← Ver Membros Ativos' : '📂 Ver Desligados'}
                </button>

                <input
                  type="text"
                  placeholder="Buscar por Nome ou CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 rounded-xl border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-600"
                />

                {!showInactives && (
                  <button onClick={() => handleOpenNewMemberModal('membros')} className="px-4 py-2 bg-gradient-to-r from-blue-900 to-indigo-700 text-white font-bold text-sm rounded-xl shadow hover:opacity-95 transition-all">
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
                      <tr key={m.id} onClick={() => handleOpenEditMemberModal(m, 'membros')} className="hover:bg-blue-50/50 cursor-pointer transition-colors">
                        <td className="py-3 px-4">
                          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border">
                            {m.foto_url ? <img src={m.foto_url} alt={m.nome} className="w-full h-full object-cover" /> : <span className="text-[10px] text-slate-400 flex items-center justify-center h-full">Sem foto</span>}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">{m.nome}</td>
                        <td className="py-3 px-4">{m.tipo_cadastro}</td>
                        <td className="py-3 px-4 font-mono">{m.cpf || '-'}</td>
                        <td className="py-3 px-4">{m.celular_principal || '-'}</td>
                        <td className="py-3 px-4 text-right">
                          {!showInactives ? (
                            <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => handleOpenEditMemberModal(m, 'membros')} className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold text-xs rounded-lg">Alterar</button>
                              <button onClick={(e) => handleOpenDeleteMemberModal(m, e)} className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs rounded-lg">Excluir</button>
                            </div>
                          ) : (
                            <button onClick={(e) => handleRestoreItem(m.id, 'membro', e)} className="px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs rounded-lg">♻️ Restaurar</button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={6} className="py-8 text-center text-slate-400">Nenhum membro encontrado.</td></tr>
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
                  {showInactives ? 'Usuários Inativos' : 'Cadastro de Usuários'} ({filteredUsers.length})
                </h2>
                <p className="text-xs text-slate-500">O operador <b>Administrador</b> é o controlador master de permissões do sistema.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowInactives(!showInactives)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors ${
                    showInactives ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {showInactives ? '← Ver Usuários Ativos' : '📂 Ver Inativos'}
                </button>

                <input
                  type="text"
                  placeholder="Buscar por Operador ou Login..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 rounded-xl border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-600"
                />

                {!showInactives && (
                  <button onClick={handleOpenNewUserModal} className="px-4 py-2 bg-gradient-to-r from-blue-900 to-indigo-700 text-white font-bold text-sm rounded-xl shadow hover:opacity-95 transition-all">
                    <span>+</span> Novo Usuário
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 text-sm font-semibold">
                    <th className="py-3 px-4">Nome Operador (Permissão)</th>
                    <th className="py-3 px-4">Login (Usuário)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => {
                      const isAdminMaster = u.nome_usuario?.trim().toLowerCase() === 'administrador';
                      return (
                        <tr key={u.id} onClick={() => handleOpenEditUserModal(u)} className="hover:bg-blue-50/50 cursor-pointer transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                            <span>{u.nome_usuario || 'Não informado'}</span>
                            {isAdminMaster && (
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-extrabold text-[10px] rounded-full uppercase">
                                Master
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-blue-800 font-bold">{u.usuario}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 font-bold text-xs rounded-full ${u.ativo !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              {u.ativo !== false ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {!showInactives ? (
                              <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => handleOpenEditUserModal(u)} className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold text-xs rounded-lg">Alterar</button>
                                {!isAdminMaster && (
                                  <button onClick={(e) => handleDeleteUserDirect(u, e)} className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs rounded-lg">Excluir</button>
                                )}
                              </div>
                            ) : (
                              <button onClick={(e) => handleRestoreItem(u.id, 'usuario', e)} className="px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs rounded-lg">♻️ Restaurar</button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan={4} className="py-8 text-center text-slate-400">Nenhum usuário encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA 3: FORNECEDORES */}
        {activeTab === 'fornecedores' && (
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {showInactives ? 'Fornecedores Inativos' : 'Cadastro de Fornecedores'} ({filteredSuppliers.length})
                </h2>
                <p className="text-xs text-slate-500">Gestão de parceiros comerciais e prestadores de serviço.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowInactives(!showInactives)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors ${
                    showInactives ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {showInactives ? '← Ver Fornecedores Ativos' : '📂 Ver Inativos'}
                </button>

                <input
                  type="text"
                  placeholder="Buscar por Nome ou CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 rounded-xl border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-600"
                />

                {!showInactives && (
                  <button onClick={handleOpenNewSupplierModal} className="px-4 py-2 bg-gradient-to-r from-blue-900 to-indigo-700 text-white font-bold text-sm rounded-xl shadow hover:opacity-95 transition-all">
                    <span>+</span> Novo Fornecedor
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 text-sm font-semibold">
                    <th className="py-3 px-4">Razão Social</th>
                    <th className="py-3 px-4">Nome Fantasia</th>
                    <th className="py-3 px-4">CNPJ/CPF</th>
                    <th className="py-3 px-4">Telefone</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map((s) => (
                      <tr key={s.id} onClick={() => handleOpenEditSupplierModal(s)} className="hover:bg-blue-50/50 cursor-pointer transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{s.razao_social}</td>
                        <td className="py-3 px-4">{s.nome_fantasia || '-'}</td>
                        <td className="py-3 px-4 font-mono">{s.cnpj_cpf || '-'}</td>
                        <td className="py-3 px-4">{s.telefone || '-'}</td>
                        <td className="py-3 px-4">{s.categoria || '-'}</td>
                        <td className="py-3 px-4 text-right">
                          {!showInactives ? (
                            <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => handleOpenEditSupplierModal(s)} className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold text-xs rounded-lg">Alterar</button>
                              <button onClick={(e) => handleDeleteSupplierDirect(s, e)} className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs rounded-lg">Excluir</button>
                            </div>
                          ) : (
                            <button onClick={(e) => handleRestoreItem(s.id, 'fornecedor', e)} className="px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs rounded-lg">♻️ Restaurar</button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={6} className="py-8 text-center text-slate-400">Nenhum fornecedor encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA 4: RELATÓRIOS DIVERSOS */}
        {activeTab === 'relatorios' && (
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-6">
            
            {/* CABEÇALHO DO RELATÓRIO */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 print:border-b-2 print:border-slate-800">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {reportType === 'aniversariantes' ? '🎂 Relatório de Aniversariantes & Contatos' : '📜 Relatório Cadastral Completo de Membros'}
                </h2>
                <p className="text-xs text-slate-500">
                  Igreja: <b className="text-blue-900">{loggedIgreja?.nome_fantasia}</b> ({loggedIgreja?.codigo_igreja}) • <span className="text-blue-700 font-semibold">Clique no nome para editar. Pressione ESC para sair.</span>
                </p>
              </div>

              {/* CONTROLES DE FILTRO E IMPRESSÃO */}
              <div className="flex flex-wrap items-center gap-3 print:hidden">
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="rounded-xl border border-slate-300 p-2 text-xs font-bold bg-slate-50 text-slate-700"
                >
                  <option value="aniversariantes">1) Relatório Aniversariantes (1 Linha)</option>
                  <option value="completo">2) Relatório Completo de Dados</option>
                </select>

                {reportType === 'aniversariantes' && (
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="rounded-xl border border-slate-300 p-2 text-xs font-bold bg-slate-50 text-slate-700"
                  >
                    <option value="todos">Todos os Meses</option>
                    <option value="1">Janeiro</option>
                    <option value="2">Fevereiro</option>
                    <option value="3">Março</option>
                    <option value="4">Abril</option>
                    <option value="5">Maio</option>
                    <option value="6">Junho</option>
                    <option value="7">Julho</option>
                    <option value="8">Agosto</option>
                    <option value="9">Setembro</option>
                    <option value="10">Outubro</option>
                    <option value="11">Novembro</option>
                    <option value="12">Dezembro</option>
                  </select>
                )}

                <button
                  onClick={handlePrintReport}
                  className="px-4 py-2 bg-gradient-to-r from-blue-900 to-indigo-700 text-white font-bold text-xs rounded-xl shadow hover:opacity-95 transition-all flex items-center gap-1.5"
                >
                  <span>🖨️</span> Imprimir Relatório
                </button>

                <button
                  onClick={handleGoHome}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                  title="Sair do Relatório"
                >
                  ✕ Sair
                </button>
              </div>
            </div>

            {/* TABELA TIPO 1: ANIVERSARIANTES (1 LINHA - CLICÁVEL PARA EDIÇÃO) */}
            {reportType === 'aniversariantes' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider">
                      <th className="py-2 px-3">Nome do Membro</th>
                      <th className="py-2 px-3">Celular / WhatsApp</th>
                      <th className="py-2 px-3">Endereço Completo</th>
                      <th className="py-2 px-3">Aniversário</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {filteredMembers.length > 0 ? (
                      filteredMembers.map((m) => {
                        const bday = formatBirthday(m.nascimento);
                        return (
                          <tr
                            key={m.id}
                            onClick={() => handleOpenEditMemberModal(m, 'relatorios')}
                            className="hover:bg-blue-50/80 cursor-pointer font-medium transition-colors"
                            title="Clique para editar o cadastro deste membro"
                          >
                            <td className="py-2.5 px-3 font-bold text-slate-900 hover:underline hover:text-blue-900">{m.nome}</td>
                            <td className="py-2.5 px-3 font-mono">{m.celular_principal || m.celular_secundario || '-'}</td>
                            <td className="py-2.5 px-3">{buildAddress(m)}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-900">{bday.formatted}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan={4} className="py-8 text-center text-slate-400">Nenhum membro encontrado para o filtro.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TABELA TIPO 2: RELATÓRIO COMPLETO (CLICÁVEL PARA EDIÇÃO) */}
            {reportType === 'completo' && (
              <div className="space-y-6">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => handleOpenEditMemberModal(m, 'relatorios')}
                      className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3 hover:bg-blue-50/50 cursor-pointer transition-colors print:break-inside-avoid"
                      title="Clique para editar este membro"
                    >
                      <div className="flex items-center gap-4 border-b pb-2">
                        <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden border">
                          {m.foto_url ? <img src={m.foto_url} alt={m.nome} className="w-full h-full object-cover" /> : <span className="text-[9px] text-slate-400 flex items-center justify-center h-full">Sem foto</span>}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900 hover:underline hover:text-blue-900">{m.nome}</h3>
                          <p className="text-xs text-blue-800 font-semibold">{m.tipo_cadastro} • {m.sexo}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div><span className="font-bold text-slate-500">CPF:</span> {m.cpf || '-'}</div>
                        <div><span className="font-bold text-slate-500">Nascimento:</span> {m.nascimento || '-'}</div>
                        <div><span className="font-bold text-slate-500">RG/Identificação:</span> {m.identificacao || '-'}</div>
                        <div><span className="font-bold text-slate-500">Nacionalidade:</span> {m.nacionalidade || '-'}</div>
                        <div><span className="font-bold text-slate-500">Naturalidade:</span> {m.naturalidade || '-'}</div>
                        <div><span className="font-bold text-slate-500">Endereço:</span> {buildAddress(m)}</div>
                        <div><span className="font-bold text-slate-500">Escolaridade:</span> {m.escolaridade || '-'}</div>
                        <div><span className="font-bold text-slate-500">Profissão:</span> {m.profissao || '-'}</div>
                        <div><span className="font-bold text-slate-500">Empresa:</span> {m.empresa || '-'}</div>
                        <div><span className="font-bold text-slate-500">Celular 1:</span> {m.celular_principal || '-'}</div>
                        <div><span className="font-bold text-slate-500">Celular 2:</span> {m.celular_secundario || '-'}</div>
                        <div><span className="font-bold text-slate-500">Telefone Fixo:</span> {m.telefone_fixo || '-'}</div>
                        <div><span className="font-bold text-slate-500">E-mail:</span> {m.email || '-'}</div>
                        <div><span className="font-bold text-slate-500">Contato Emergência:</span> {m.nome_contato || '-'}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-8 text-center text-slate-400">Nenhum membro cadastrado.</p>
                )}
              </div>
            )}

          </div>
        )}

        {/* ABA 5: CADASTRO DA IGREJA */}
        {activeTab === 'igreja' && (
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {showInactives ? 'Igrejas Inativas' : 'Cadastro de Igrejas'} ({filteredChurches.length})
                </h2>
                <p className="text-xs text-slate-500">Gestão das instituições cadastradas na plataforma.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowInactives(!showInactives)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors ${
                    showInactives ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {showInactives ? '← Ver Igrejas Ativas' : '📂 Ver Inativas'}
                </button>

                <input
                  type="text"
                  placeholder="Buscar por Nome ou Código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 rounded-xl border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-600"
                />

                {!showInactives && (
                  <button onClick={handleOpenNewChurchModal} className="px-4 py-2 bg-gradient-to-r from-blue-900 to-indigo-700 text-white font-bold text-sm rounded-xl shadow hover:opacity-95 transition-all">
                    <span>+</span> Nova Igreja
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 text-sm font-semibold">
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Nome Fantasia</th>
                    <th className="py-3 px-4">CNPJ</th>
                    <th className="py-3 px-4">Responsável</th>
                    <th className="py-3 px-4">Tesoureiro</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {filteredChurches.length > 0 ? (
                    filteredChurches.map((c) => (
                      <tr key={c.id} onClick={() => handleOpenEditChurchModal(c)} className="hover:bg-blue-50/50 cursor-pointer transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-blue-900">{c.codigo_igreja}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{c.nome_fantasia}</td>
                        <td className="py-3 px-4 font-mono">{c.cnpj || '-'}</td>
                        <td className="py-3 px-4">{c.responsavel_nome || '-'}</td>
                        <td className="py-3 px-4">{c.tesoureiro_nome || '-'}</td>
                        <td className="py-3 px-4 text-right">
                          {!showInactives ? (
                            <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => handleOpenEditChurchModal(c)} className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold text-xs rounded-lg">Alterar</button>
                              <button onClick={(e) => handleDeleteChurchDirect(c, e)} className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs rounded-lg">Excluir</button>
                            </div>
                          ) : (
                            <button onClick={(e) => handleRestoreItem(c.id, 'igreja', e)} className="px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs rounded-lg">♻️ Restaurar</button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={6} className="py-8 text-center text-slate-400">Nenhuma igreja encontrada.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* --- MODAL 1: CADASTRO / EDIÇÃO COMPLETO DE MEMBRO (ESTRUTURA DE ROLAGEM 100% GARANTIDA) --- */}
      {isMemberModalOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleCloseMemberModal}
        >
          <div
            className="bg-white max-w-4xl w-full max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CABEÇALHO DO MODAL */}
            <div className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold">{editingMemberId ? 'Alterar Cadastro de Membro' : 'Novo Cadastro de Membro'}</h3>
                <p className="text-xs text-blue-200">Igreja: {loggedIgreja?.nome_fantasia || loggedIgreja?.codigo_igreja}</p>
              </div>
              <button onClick={handleCloseMemberModal} className="text-slate-300 hover:text-white text-2xl font-bold">&times;</button>
            </div>

            {/* FORMULÁRIO COM ROLAGEM INTERNA */}
            <form onSubmit={handleRegisterMember} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                
                {/* FOTO */}
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

                {/* DADOS PESSOAIS */}
                <div>
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-3 border-b pb-1">1. Dados Pessoais Principais</h4>
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
                    <div><label className="block text-xs font-semibold text-slate-600 mb-1">Nome completo *</label><input type="text" name="nome" value={formData.nome} onChange={handleChange} required className="w-full rounded-md border p-2 text-sm" /></div>
                    <div><label className="block text-xs font-semibold text-slate-600 mb-1">CPF</label><input type="text" name="cpf" placeholder="000.000.000-00" value={formData.cpf} onChange={handleChange} className="w-full rounded-md border p-2 text-sm" /></div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Sexo *</label>
                      <select name="sexo" value={formData.sexo} onChange={handleChange} required className="w-full rounded-md border p-2 text-sm">
                        <option value="">Selecione...</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                      </select>
                    </div>
                    <div><label className="block text-xs font-semibold text-slate-600 mb-1">Nascimento *</label><input type="date" name="nascimento" value={formData.nascimento} onChange={handleChange} required className="w-full rounded-md border p-2 text-sm" /></div>
                    <div><label className="block text-xs font-semibold text-slate-600 mb-1">Identificação / RG</label><input type="text" name="identificacao" placeholder="RG / RGM" value={formData.identificacao} onChange={handleChange} className="w-full rounded-md border p-2 text-sm" /></div>
                    <div><label className="block text-xs font-semibold text-slate-600 mb-1">Nacionalidade</label><input type="text" name="nacionalidade" value={formData.nacionalidade} onChange={handleChange} className="w-full rounded-md border p-2 text-sm" /></div>
                    <div><label className="block text-xs font-semibold text-slate-600 mb-1">Naturalidade</label><input type="text" name="naturalidade" placeholder="Ex: Teófilo Otoni" value={formData.naturalidade} onChange={handleChange} className="w-full rounded-md border p-2 text-sm" /></div>
                  </div>
                </div>

                {/* ENDEREÇO */}
                <div>
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-3 border-b pb-1">2. Endereço e Localização</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="sm:col-span-2"><label className="block text-xs font-semibold text-slate-600 mb-1">Rua / Logradouro</label><input type="text" name="rua" placeholder="Ex: Rua Epaminondas Otoni" value={formData.rua} onChange={handleChange} className="w-full rounded-md border p-2 text-sm" /></div>
                    <div><label className="block text-xs font-semibold text-slate-600 mb-1">Número</label><input type="text" name="numero" placeholder="Ex: 123" value={formData.numero} onChange={handleChange} className="w-full rounded-md border p-2 text-sm" /></div>
                    <div><label className="block text-xs font-semibold text-slate-600 mb-1">Bairro</label><input type="text" name="bairro" placeholder="Ex: Centro" value={formData.bairro} onChange={handleChange} className="w-full rounded-md border p-2 text-sm" /></div>
                    <div><label className="block text-xs font-semibold text-slate-600 mb-1">Cidade</label><input type="text" name="cidade" value={formData.cidade} onChange={handleChange} className="w-full rounded-md border p-2 text-sm" /></div>
                    <div><label className="block text-xs font-semibold text-slate-600 mb-1">UF</label><input type="text" name="uf" value={formData.uf} onChange={handleChange} className="w-full rounded-md border p-2 text-sm" /></div>
                  </div>
                </div>

                {/* CONTATOS */}
                <div>
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-3 border-b pb-1">3. Telefone e Contatos</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div><label className="block text-xs font-semibold text-slate-600 mb-1">Celular / WhatsApp *</label><input type="text" name="celular_principal" placeholder="(33) 90000-0000" value={formData.celular_principal} onChange={handleChange} required className="w-full rounded-md border p-2 text-sm" /></div>
                    <div><label className="block text-xs font-semibold text-slate-600 mb-1">Celular Secundário</label><input type="text" name="celular_secundario" placeholder="(33) 90000-0000" value={formData.celular_secundario} onChange={handleChange} className="w-full rounded-md border p-2 text-sm" /></div>
                    <div><label className="block text-xs font-semibold text-slate-600 mb-1">Telefone Fixo</label><input type="text" name="telefone_fixo" placeholder="(33) 3521-0000" value={formData.telefone_fixo} onChange={handleChange} className="w-full rounded-md border p-2 text-sm" /></div>
                    <div className="sm:col-span-2"><label className="block text-xs font-semibold text-slate-600 mb-1">E-mail</label><input type="email" name="email" placeholder="membro@email.com" value={formData.email} onChange={handleChange} className="w-full rounded-md border p-2 text-sm" /></div>
                  </div>
                </div>

                {/* PROFISSIONAL E EMERGÊNCIA */}
                <div>
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-3 border-b pb-1">4. Dados Profissionais & Emergência</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div><label className="block text-xs font-semibold text-slate-600 mb-1">Escolaridade</label><input type="text" name="escolaridade" placeholder="Ex: Superior Completo" value={formData.escolaridade} onChange={handleChange} className="w-full rounded-md border p-2 text-sm" /></div>
                    <div><label className="block text-xs font-semibold text-slate-600 mb-1">Profissão</label><input type="text" name="profissao" value={formData.profissao} onChange={handleChange} className="w-full rounded-md border p-2 text-sm" /></div>
                    <div><label className="block text-xs font-semibold text-slate-600 mb-1">Empresa</label><input type="text" name="empresa" value={formData.empresa} onChange={handleChange} className="w-full rounded-md border p-2 text-sm" /></div>
                    <div className="sm:col-span-2"><label className="block text-xs font-semibold text-slate-600 mb-1">Nome do Contato de Emergência</label><input type="text" name="nome_contato" placeholder="Nome e parentesco" value={formData.nome_contato} onChange={handleChange} className="w-full rounded-md border p-2 text-sm" /></div>
                  </div>
                </div>

              </div>

              {/* RODA PÉ FIXO DE BOTÕES DE AÇÃO */}
              <div className="flex justify-end gap-3 border-t bg-slate-50 px-6 py-4 flex-shrink-0">
                <button type="button" onClick={handleCloseMemberModal} className="px-4 py-2 border rounded-lg text-sm bg-white hover:bg-slate-100">
                  {editSource === 'relatorios' ? 'Sair e Voltar ao Relatório' : 'Cancelar'}
                </button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-lg shadow">
                  {loading ? 'Salvando...' : editingMemberId ? 'Salvar Cadastro' : 'Salvar Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: CADASTRO / EDIÇÃO DE USUÁRIO --- */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsUserModalOpen(false)}>
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">{editingUserId ? 'Alterar Usuário' : 'Novo Usuário do Sistema'}</h3>
                <p className="text-xs text-blue-200">Vincular a: {loggedIgreja?.codigo_igreja}</p>
              </div>
              <button onClick={() => setIsUserModalOpen(false)} className="text-white text-2xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleRegisterUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nome do Operador (Permissão) *</label>
                <input
                  type="text"
                  name="nome_usuario"
                  required
                  placeholder="Ex: Administrador, Tesoureiro, Secretária..."
                  value={userFormData.nome_usuario}
                  onChange={handleUserChange}
                  className="w-full rounded-lg border p-2.5 text-sm focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Usuário (Login) *</label>
                <input
                  type="text"
                  name="usuario"
                  required
                  placeholder="Ex: admin"
                  value={userFormData.usuario}
                  onChange={handleUserChange}
                  className="w-full rounded-lg border p-2.5 text-sm focus:ring-2 focus:ring-blue-600"
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
                  className="w-full rounded-lg border p-2.5 text-sm focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-900 text-white font-bold text-sm rounded-lg shadow">
                  {loading ? 'Cadastrando...' : editingUserId ? 'Salvar Alterações' : 'Cadastrar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: CADASTRO / EDIÇÃO DE FORNECEDOR --- */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setIsSupplierModalOpen(false)}>
          <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8" onClick={(e) => e.stopPropagation()}>
            <div className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">{editingSupplierId ? 'Alterar Fornecedor' : 'Novo Cadastro de Fornecedor'}</h3>
                <p className="text-xs text-blue-200">Gestão de parceiros comerciais e prestadores</p>
              </div>
              <button onClick={() => setIsSupplierModalOpen(false)} className="text-white text-2xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleRegisterSupplier} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">1. Razão Social *</label>
                  <input type="text" name="razao_social" required value={supplierFormData.razao_social} onChange={handleSupplierChange} className="w-full rounded-lg border p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">2. Nome Fantasia</label>
                  <input type="text" name="nome_fantasia" value={supplierFormData.nome_fantasia} onChange={handleSupplierChange} className="w-full rounded-lg border p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">3. CNPJ ou CPF</label>
                  <input type="text" name="cnpj_cpf" placeholder="00.000.000/0001-00" value={supplierFormData.cnpj_cpf} onChange={handleSupplierChange} className="w-full rounded-lg border p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">4. Categoria / Ramo</label>
                  <input type="text" name="categoria" placeholder="Ex: Gráfica, Som, Limpeza..." value={supplierFormData.categoria} onChange={handleSupplierChange} className="w-full rounded-lg border p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">5. Telefone / WhatsApp</label>
                  <input type="text" name="telefone" placeholder="(00) 00000-0000" value={supplierFormData.telefone} onChange={handleSupplierChange} className="w-full rounded-lg border p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">6. E-mail de Contato</label>
                  <input type="email" name="email" value={supplierFormData.email} onChange={handleSupplierChange} className="w-full rounded-lg border p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">7. Nome do Responsável</label>
                  <input type="text" name="contato_responsavel" value={supplierFormData.contato_responsavel} onChange={handleSupplierChange} className="w-full rounded-lg border p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">8. Cidade / UF</label>
                  <input type="text" name="cidade_uf" placeholder="Ex: Teófilo Otoni - MG" value={supplierFormData.cidade_uf} onChange={handleSupplierChange} className="w-full rounded-lg border p-2 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">9. Observações Gerais</label>
                <textarea rows={2} name="observacoes" value={supplierFormData.observacoes} onChange={handleSupplierChange} className="w-full rounded-lg border p-2 text-xs" />
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={() => setIsSupplierModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-900 text-white font-bold text-sm rounded-lg shadow">
                  {loading ? 'Salvando...' : editingSupplierId ? 'Salvar Alterações' : 'Salvar Fornecedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: CADASTRO / EDIÇÃO DE IGREJA --- */}
      {isChurchModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setIsChurchModalOpen(false)}>
          <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8" onClick={(e) => e.stopPropagation()}>
            <div className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">{editingChurchId ? 'Alterar Igreja' : 'Nova Igreja'}</h3>
                <p className="text-xs text-blue-200">Código automático: {churchFormData.codigo_igreja}</p>
              </div>
              <button onClick={() => setIsChurchModalOpen(false)} className="text-white text-2xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleRegisterChurch} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Código da Igreja *</label>
                  <input type="text" name="codigo_igreja" readOnly value={churchFormData.codigo_igreja} className="w-full rounded-lg border p-2 text-sm bg-slate-100 font-mono font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nome Fantasia / Igreja *</label>
                  <input type="text" name="nome_fantasia" required value={churchFormData.nome_fantasia} onChange={handleChurchChange} className="w-full rounded-lg border p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Razão Social</label>
                  <input type="text" name="razao_social" value={churchFormData.razao_social} onChange={handleChurchChange} className="w-full rounded-lg border p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">CNPJ</label>
                  <input type="text" name="cnpj" placeholder="00.000.000/0001-00" value={churchFormData.cnpj} onChange={handleChurchChange} className="w-full rounded-lg border p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Endereço Completo</label>
                  <input type="text" name="endereco" value={churchFormData.endereco} onChange={handleChurchChange} className="w-full rounded-lg border p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Telefone / WhatsApp</label>
                  <input type="text" name="telefone" placeholder="(00) 00000-0000" value={churchFormData.telefone} onChange={handleChurchChange} className="w-full rounded-lg border p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">E-mail Institucional</label>
                  <input type="email" name="email" value={churchFormData.email} onChange={handleChurchChange} className="w-full rounded-lg border p-2 text-sm" />
                </div>
              </div>

              <div className="border-t pt-3">
                <h4 className="text-xs font-bold text-blue-900 uppercase mb-2">Quadro de Responsáveis</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Responsável Principal</label>
                    <input type="text" name="responsavel_nome" value={churchFormData.responsavel_nome} onChange={handleChurchChange} className="w-full rounded-lg border p-2 text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Tesoureiro Principal</label>
                    <input type="text" name="tesoureiro_nome" value={churchFormData.tesoureiro_nome} onChange={handleChurchChange} className="w-full rounded-lg border p-2 text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Contador Responsável</label>
                    <input type="text" name="contador_nome" value={churchFormData.contador_nome} onChange={handleChurchChange} className="w-full rounded-lg border p-2 text-xs" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={() => setIsChurchModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-900 text-white font-bold text-sm rounded-lg shadow">
                  {loading ? 'Salvando...' : editingChurchId ? 'Salvar Alterações' : 'Cadastrar Igreja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 5: INBOX DE MOTIVO DE EXCLUSÃO (MEMBROS) --- */}
      {isDeleteMemberModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsDeleteMemberModalOpen(false)}>
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-rose-700 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Desligamento de Membro</h3>
                <p className="text-xs text-rose-200">Informe o motivo da exclusão/desligamento</p>
              </div>
              <button onClick={() => setIsDeleteMemberModalOpen(false)} className="text-white text-2xl font-bold">&times;</button>
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
                  onClick={() => setIsDeleteMemberModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-slate-700 font-medium text-xs hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteMember}
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

    </div>
  );
}