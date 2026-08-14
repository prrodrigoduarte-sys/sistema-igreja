import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

export default function App() {
  // --- SESSÃO E AUTENTICAÇÃO ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedUser, setLoggedUser] = useState<any>(null);
  const [loggedIgreja, setLoggedIgreja] = useState<any>(null);

  // Campos do Login
  const [loginCodigo, setLoginCodigo] = useState('IGR-001');
  const [loginUsuario, setLoginUsuario] = useState('');
  const [loginSenha, setLoginSenha] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Bloqueio de Login
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState<number | null>(null);

  // --- NAVEGAÇÃO E TABS ---
  const [activeTab, setActiveTab] = useState<'membros' | 'usuarios' | 'fornecedores' | 'relatorios' | 'igreja' | 'financeiro' | 'agenda'>('membros');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Relatórios
  const [reportType, setReportType] = useState<'aniversariantes' | 'completo'>('aniversariantes');
  const [filterMonth, setFilterMonth] = useState<string>('todos');

  // --- MODAIS FLUTUANTES ---
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberModalSubTab, setMemberModalSubTab] = useState<'dados' | 'endereco_outros'>('dados');

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isChurchModalOpen, setIsChurchModalOpen] = useState(false);
  const [isDeleteMemberModalOpen, setIsDeleteMemberModalOpen] = useState(false);

  // Modais Módulo Financeiro
  const [isLancamentoModalOpen, setIsLancamentoModalOpen] = useState(false);
  const [isContaModalOpen, setIsContaModalOpen] = useState(false);

  // Modais Módulo Agenda
  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);

  // --- ESTADOS DE EDIÇÃO E LISTAS ---
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [editingChurchId, setEditingChurchId] = useState<string | null>(null);

  const [deletingMember, setDeletingMember] = useState<any>(null);
  const [showInactives, setShowInactives] = useState(false);

  const [motivoExclusao, setMotivoExclusao] = useState('');
  const [detalheExclusao, setDetalheExclusao] = useState('');

  const [members, setMembers] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [churchesList, setChurchesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Financeiro
  const [contasFinanceiras, setContasFinanceiras] = useState<any[]>([]);
  const [lancamentos, setLancamentos] = useState<any[]>([]);
  const [filterConta, setFilterConta] = useState<string>('todas');

  // Agenda
  const [compromissos, setCompromissos] = useState<any[]>([]);
  const [agendaFilterDono, setAgendaFilterDono] = useState<string>('todos');

  // Câmera / Foto
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

  const initialUserFormData = { nome_usuario: '', usuario: '', senha: '' };
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

  // Financeiro & Agenda Forms
  const initialLancamentoForm = {
    codigo_conta: '001',
    tipo: 'entrada',
    categoria: 'Dízimo',
    descricao: '',
    valor: '',
    data_lancamento: new Date().toISOString().split('T')[0],
    forma_pagamento: 'Dinheiro'
  };
  const [lancamentoForm, setLancamentoForm] = useState(initialLancamentoForm);

  const initialContaForm = {
    codigo_conta: '',
    nome_conta: '',
    agencia: '',
    numero_conta: '',
    saldo_inicial: '0'
  };
  const [contaForm, setContaForm] = useState(initialContaForm);

  const initialAgendaForm = {
    dono_codigo: '',
    dono_tipo: 'pastor',
    titulo: '',
    descricao: '',
    data_compromisso: new Date().toISOString().split('T')[0],
    hora_compromisso: '09:00',
    local_evento: '',
    whatsapp_notificacao: ''
  };
  const [agendaForm, setAgendaForm] = useState(initialAgendaForm);

  // --- ATALHO ESC PARA FECHAR MODAIS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMemberModalOpen(false);
        setIsUserModalOpen(false);
        setIsSupplierModalOpen(false);
        setIsChurchModalOpen(false);
        setIsDeleteMemberModalOpen(false);
        setIsLancamentoModalOpen(false);
        setIsContaModalOpen(false);
        setIsAgendaModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- BLOQUEIO LOCAL DE TENTATIVAS DE LOGIN ---
  useEffect(() => {
    const savedLock = localStorage.getItem('login_lock_until');
    const savedAttempts = localStorage.getItem('login_failed_attempts');
    if (savedLock) {
      const lockTime = parseInt(savedLock, 10);
      if (Date.now() < lockTime) setLockUntil(lockTime);
      else {
        localStorage.removeItem('login_lock_until');
        localStorage.removeItem('login_failed_attempts');
      }
    }
    if (savedAttempts) setFailedAttempts(parseInt(savedAttempts, 10));
  }, []);

  const handleGoHome = () => {
    setActiveTab('membros');
    setOpenDropdown(null);
    setShowInactives(false);
    setSearchTerm('');
  };

  // --- LOGIN E LOGOUT ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (lockUntil && Date.now() < lockUntil) {
      const minutesLeft = Math.ceil((lockUntil - Date.now()) / (1000 * 60));
      alert(`Acesso bloqueado por muitas tentativas incorretas. Retorne em ${minutesLeft} minutos.`);
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

      // Carrega os Módulos
      fetchMembers(data.codigo_igreja);
      fetchUsers(data.codigo_igreja);
      fetchSuppliers(data.codigo_igreja);
      fetchChurches();
      fetchFinanceiro(data.codigo_igreja);
      fetchAgenda(data.codigo_igreja);
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
  };

  // --- CARREGAMENTO DE DADOS DAS TABELAS DO SUPABASE ---
  const fetchMembers = async (codigoIgreja: string) => {
    try {
      const { data } = await supabase.from('members').select('*').eq('codigo_igreja', codigoIgreja);
      setMembers(data || []);
    } catch (err) { console.error(err); }
  };

  const fetchUsers = async (codigoIgreja: string) => {
    try {
      const { data } = await supabase.from('usuarios').select('*').eq('codigo_igreja', codigoIgreja);
      setUsersList(data || []);
    } catch (err) { console.error(err); }
  };

  const fetchSuppliers = async (codigoIgreja: string) => {
    try {
      const { data } = await supabase.from('fornecedores').select('*').eq('codigo_igreja', codigoIgreja);
      setSuppliersList(data || []);
    } catch (err) { console.error(err); }
  };

  const fetchChurches = async () => {
    try {
      const { data } = await supabase.from('igrejas').select('*');
      setChurchesList(data || []);
    } catch (err) { console.error(err); }
  };

  const fetchFinanceiro = async (codigoIgreja: string) => {
    try {
      let { data: contas } = await supabase.from('contas_financeiras').select('*').eq('codigo_igreja', codigoIgreja);
      
      // Cria a conta 001 Caixa Geral por padrão se não existir
      if (!contas || contas.length === 0) {
        const caixaDefault = {
          codigo_igreja: codigoIgreja,
          codigo_conta: '001',
          nome_conta: 'Caixa Geral (Dinheiro em Espécie)',
          saldo_inicial: 0
        };
        await supabase.from('contas_financeiras').insert([caixaDefault]);
        const res = await supabase.from('contas_financeiras').select('*').eq('codigo_igreja', codigoIgreja);
        contas = res.data;
      }
      setContasFinanceiras(contas || []);

      const { data: lancs } = await supabase
        .from('lancamentos_financeiros')
        .select('*')
        .eq('codigo_igreja', codigoIgreja)
        .order('data_lancamento', { ascending: false });
      setLancamentos(lancs || []);
    } catch (err) { console.error(err); }
  };

  const fetchAgenda = async (codigoIgreja: string) => {
    try {
      const { data } = await supabase
        .from('agenda_compromissos')
        .select('*')
        .eq('codigo_igreja', codigoIgreja)
        .order('data_compromisso', { ascending: true });
      setCompromissos(data || []);
    } catch (err) { console.error(err); }
  };

  // --- OPERAÇÕES DO FINANCEIRO ---
  const handleSaveConta = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        codigo_igreja: loggedUser.codigo_igreja,
        codigo_conta: contaForm.codigo_conta.trim(),
        nome_conta: contaForm.nome_conta.trim(),
        agencia: contaForm.agencia.trim(),
        numero_conta: contaForm.numero_conta.trim(),
        saldo_inicial: parseFloat(contaForm.saldo_inicial) || 0
      };

      const { error } = await supabase.from('contas_financeiras').insert([payload]);
      if (error) throw error;

      alert('Conta/Banco cadastrado com sucesso!');
      setIsContaModalOpen(false);
      setContaForm(initialContaForm);
      fetchFinanceiro(loggedUser.codigo_igreja);
    } catch (err: any) {
      alert('Erro ao cadastrar banco: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLancamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        codigo_igreja: loggedUser.codigo_igreja,
        codigo_conta: lancamentoForm.codigo_conta,
        tipo: lancamentoForm.tipo,
        categoria: lancamentoForm.categoria,
        descricao: lancamentoForm.descricao.trim(),
        valor: parseFloat(lancamentoForm.valor),
        data_lancamento: lancamentoForm.data_lancamento,
        forma_pagamento: lancamentoForm.forma_pagamento,
        usuario_responsavel: loggedUser.nome_usuario
      };

      const { error } = await supabase.from('lancamentos_financeiros').insert([payload]);
      if (error) throw error;

      alert('Lançamento registrado com sucesso!');
      setIsLancamentoModalOpen(false);
      setLancamentoForm(initialLancamentoForm);
      fetchFinanceiro(loggedUser.codigo_igreja);
    } catch (err: any) {
      alert('Erro ao salvar lançamento: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSaldosProcessados = () => {
    const saldos: { [key: string]: number } = {};

    contasFinanceiras.forEach((c) => {
      saldos[c.codigo_conta] = parseFloat(c.saldo_inicial) || 0;
    });

    lancamentos.forEach((l) => {
      const v = parseFloat(l.valor) || 0;
      if (l.tipo === 'entrada') {
        saldos[l.codigo_conta] = (saldos[l.codigo_conta] || 0) + v;
      } else if (l.tipo === 'saida') {
        saldos[l.codigo_conta] = (saldos[l.codigo_conta] || 0) - v;
      }
    });

    const saldoTotalConsolidado = Object.values(saldos).reduce((acc, curr) => acc + curr, 0);
    return { saldos, saldoTotalConsolidado };
  };

  // --- OPERAÇÕES DA AGENDA ---
  const handleSaveCompromisso = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        codigo_igreja: loggedUser.codigo_igreja,
        dono_codigo: agendaForm.dono_codigo.trim() || loggedUser.nome_usuario,
        dono_tipo: agendaForm.dono_tipo,
        titulo: agendaForm.titulo.trim(),
        descricao: agendaForm.descricao.trim(),
        data_compromisso: agendaForm.data_compromisso,
        hora_compromisso: agendaForm.hora_compromisso,
        local_evento: agendaForm.local_evento.trim(),
        whatsapp_notificacao: agendaForm.whatsapp_notificacao.trim()
      };

      const { error } = await supabase.from('agenda_compromissos').insert([payload]);
      if (error) throw error;

      alert('Compromisso agendado com sucesso!');
      setIsAgendaModalOpen(false);
      setAgendaForm(initialAgendaForm);
      fetchAgenda(loggedUser.codigo_igreja);
    } catch (err: any) {
      alert('Erro ao agendar compromisso: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendWhatsAppLembrete = (c: any) => {
    if (!c.whatsapp_notificacao) {
      alert('Nenhum número de WhatsApp cadastrado para este evento.');
      return;
    }
    const cleanPhone = c.whatsapp_notificacao.replace(/\D/g, '');
    const mensagem = encodeURIComponent(
      `Olá! 📅 Lembrete de Compromisso da Igreja:\n\n📌 *${c.titulo}*\n🗓️ Data: ${c.data_compromisso}\n⏰ Horário: ${c.hora_compromisso}\n📍 Local: ${c.local_evento || 'Templo/Igreja'}\n\n📝 Descrição: ${c.descricao || 'Presença confirmada!'}`
    );
    window.open(`https://wa.me/55${cleanPhone}?text=${mensagem}`, '_blank');
  };

  // --- CÂMERA E FOTOS ---
  const startCamera = async () => {
    setUseCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
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
      const { error: uploadError } = await supabase.storage.from('membrosfotos').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('membrosfotos').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (err: any) {
      console.error('Erro upload foto:', err.message);
      return null;
    }
  };

  // --- GERENCIAMENTO DE MEMBROS E MODAL COM 2 ABAS ---
  const handleOpenNewMemberModal = (fromTab: 'membros' | 'relatorios' = 'membros') => {
    setMemberModalSubTab('dados');
    setEditingMemberId(null);
    setFormData(initialMemberFormData);
    setPhotoFile(null);
    setPhotoPreview(null);
    setIsMemberModalOpen(true);
  };

  const handleOpenEditMemberModal = (member: any, fromTab: 'membros' | 'relatorios' = 'membros') => {
    setMemberModalSubTab('dados');
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

  const handleRegisterMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let fotoUrl = photoPreview;
      if (photoFile) {
        const uploadedUrl = await uploadPhoto(photoFile);
        if (uploadedUrl) fotoUrl = uploadedUrl;
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
        alert('Membro atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('members').insert([payload]);
        if (error) throw error;
        alert('Membro cadastrado com sucesso!');
      }

      setIsMemberModalOpen(false);
      fetchMembers(loggedUser.codigo_igreja);
    } catch (err: any) {
      alert('Erro ao salvar membro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleDropdown = (name: string) => setOpenDropdown(openDropdown === name ? null : name);

  // FILTROS DE LISTAGEM
  const filteredMembers = members.filter((m) => !searchTerm || m.nome?.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredLancamentos = lancamentos.filter((l) => filterConta === 'todas' || l.codigo_conta === filterConta);
  const filteredCompromissos = compromissos.filter(
    (c) => agendaFilterDono === 'todos' || c.dono_codigo.toLowerCase().includes(agendaFilterDono.toLowerCase())
  );

  const { saldos, saldoTotalConsolidado } = getSaldosProcessados();

  // --- TELA DE LOGIN ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 space-y-6 border border-slate-100">
          <div className="text-center space-y-2">
            <span className="text-3xl font-black text-blue-900 tracking-tight block">BRSYSTEM</span>
            <p className="text-xs text-slate-500 font-semibold">Gestão Integrada para Igrejas e Instituições</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Código da Igreja</label>
              <input type="text" required value={loginCodigo} onChange={(e) => setLoginCodigo(e.target.value)} className="w-full rounded-xl border p-3 text-sm focus:ring-2 focus:ring-blue-600" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Usuário</label>
              <input type="text" required value={loginUsuario} onChange={(e) => setLoginUsuario(e.target.value)} className="w-full rounded-xl border p-3 text-sm focus:ring-2 focus:ring-blue-600" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Senha</label>
              <input type="password" required value={loginSenha} onChange={(e) => setLoginSenha(e.target.value)} className="w-full rounded-xl border p-3 text-sm focus:ring-2 focus:ring-blue-600" />
            </div>

            <button type="submit" disabled={loginLoading} className="w-full py-3.5 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-700 text-white font-bold rounded-xl shadow-lg hover:opacity-95 transition-all">
              {loginLoading ? 'Acessando...' : 'Entrar no Sistema'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- DASHBOARD PRINCIPAL DA APLICAÇÃO ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" onClick={() => openDropdown && setOpenDropdown(null)}>
      
      {/* NAVEGAÇÃO SUPERIOR */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 shadow-xs relative z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center gap-8">
            <div onClick={handleGoHome} className="flex items-center gap-2 cursor-pointer">
              <span className="text-xl font-black text-blue-900 tracking-tight">BRSYSTEM</span>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-blue-900">
              
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => toggleDropdown('cadastros')} className="flex items-center gap-1 hover:text-indigo-600 py-2">
                  <span>Cadastros</span><span>∨</span>
                </button>
                {openDropdown === 'cadastros' && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50">
                    <button onClick={() => { setActiveTab('membros'); setOpenDropdown(null); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 font-semibold">📋 Membros</button>
                    <button onClick={() => { setActiveTab('usuarios'); setOpenDropdown(null); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 font-semibold">👤 Usuários</button>
                    <button onClick={() => { setActiveTab('fornecedores'); setOpenDropdown(null); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 font-semibold">🚚 Fornecedores</button>
                    <button onClick={() => { setActiveTab('relatorios'); setOpenDropdown(null); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 font-semibold border-t">📊 Relatórios</button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setActiveTab('agenda')}
                className={`hover:text-indigo-600 py-2 transition-colors ${activeTab === 'agenda' ? 'text-indigo-600 font-extrabold border-b-2 border-indigo-600' : ''}`}
              >
                📅 Agenda
              </button>

              <button
                onClick={() => setActiveTab('financeiro')}
                className={`hover:text-indigo-600 py-2 transition-colors ${activeTab === 'financeiro' ? 'text-indigo-600 font-extrabold border-b-2 border-indigo-600' : ''}`}
              >
                💰 Financeiro
              </button>

              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => toggleDropdown('controle')} className="flex items-center gap-1 hover:text-indigo-600 py-2">
                  <span>Controle</span><span>∨</span>
                </button>
                {openDropdown === 'controle' && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50">
                    <button onClick={() => { setActiveTab('igreja'); setOpenDropdown(null); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 font-semibold">⛪ Cadastro da Igreja</button>
                  </div>
                )}
              </div>

            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800">{loggedIgreja?.nome_fantasia || 'Igreja'}</p>
              <p className="text-xs text-slate-500 font-medium">{loggedUser?.nome_usuario}</p>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl">Sair</button>
          </div>

        </div>
      </header>

      {/* PAINEL PRINCIPAL */}
      <main className="max-w-7xl w-full mx-auto p-6 space-y-6 flex-1">

        {/* --- ABA MEMBROS --- */}
        {activeTab === 'membros' && (
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Cadastro de Membros ({filteredMembers.length})</h2>
                <p className="text-xs text-slate-500">Gerencie todos os membros, congregados e visitantes da igreja.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="Buscar por Nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 rounded-xl border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-600"
                />
                <button onClick={() => handleOpenNewMemberModal('membros')} className="px-4 py-2 bg-gradient-to-r from-blue-900 to-indigo-700 text-white font-bold text-sm rounded-xl shadow hover:opacity-95">
                  + Novo Membro
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-slate-600 text-sm font-semibold">
                    <th className="py-3 px-4">Foto</th>
                    <th className="py-3 px-4">Nome</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">CPF</th>
                    <th className="py-3 px-4">Celular</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm text-slate-700">
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((m) => (
                      <tr key={m.id} onClick={() => handleOpenEditMemberModal(m, 'membros')} className="hover:bg-blue-50/50 cursor-pointer">
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
                          <button onClick={() => handleOpenEditMemberModal(m, 'membros')} className="px-3 py-1 bg-blue-100 text-blue-800 font-bold text-xs rounded-lg hover:bg-blue-200">Alterar</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={6} className="py-8 text-center text-slate-400">Nenhum membro cadastrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- ABA FINANCEIRO (CAIXA + BANCOS) --- */}
        {activeTab === 'financeiro' && (
          <div className="space-y-6">
            
            {/* CARDS DE SALDOS DAS CONTAS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white p-5 rounded-2xl shadow-md">
                <p className="text-xs font-bold text-blue-200 uppercase tracking-wider">Saldo Total Consolidado</p>
                <h3 className="text-2xl font-black mt-1">R$ {saldoTotalConsolidado.toFixed(2)}</h3>
                <span className="text-[10px] bg-blue-800 px-2 py-0.5 rounded-full mt-2 inline-block font-semibold">Caixa Geral + Bancos</span>
              </div>

              {contasFinanceiras.map((c) => {
                const s = saldos[c.codigo_conta] || 0;
                const isCaixa = c.codigo_conta === '001';
                return (
                  <div key={c.id} className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-slate-100 rounded-md text-slate-600 font-mono">
                          Código: {c.codigo_conta}
                        </span>
                        <h4 className="text-sm font-bold text-slate-800 mt-1">{c.nome_conta}</h4>
                      </div>
                      <span className="text-xl">{isCaixa ? '💵' : '🏦'}</span>
                    </div>
                    <p className={`text-xl font-bold mt-3 ${s >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      R$ {s.toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* PAINEL DE LANÇAMENTOS */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Lançamentos de Caixa e Bancos</h2>
                  <p className="text-xs text-slate-500">Módulo de entradas (dízimos, ofertas) e saídas de recursos.</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button onClick={() => setIsContaModalOpen(true)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border">
                    + Cadastrar Banco
                  </button>
                  <button onClick={() => setIsLancamentoModalOpen(true)} className="px-4 py-2 bg-gradient-to-r from-blue-900 to-indigo-700 text-white font-bold text-xs rounded-xl shadow">
                    + Novo Lançamento
                  </button>
                </div>
              </div>

              {/* FILTROS POR CONTA */}
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-600 uppercase">Filtrar por Conta:</label>
                <select value={filterConta} onChange={(e) => setFilterConta(e.target.value)} className="rounded-xl border p-2 text-xs font-bold bg-slate-50">
                  <option value="todas">Todas as Contas (Consolidado)</option>
                  {contasFinanceiras.map((c) => (
                    <option key={c.id} value={c.codigo_conta}>
                      {c.codigo_conta} - {c.nome_conta}
                    </option>
                  ))}
                </select>
              </div>

              {/* TABELA DE REGISTROS */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b text-slate-600 text-xs font-bold uppercase">
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4">Conta</th>
                      <th className="py-3 px-4">Tipo</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4">Descrição</th>
                      <th className="py-3 px-4">Forma Pagto</th>
                      <th className="py-3 px-4 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs text-slate-700">
                    {filteredLancamentos.length > 0 ? (
                      filteredLancamentos.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono">{l.data_lancamento}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {l.codigo_conta} - {contasFinanceiras.find((c) => c.codigo_conta === l.codigo_conta)?.nome_conta || 'Caixa'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 font-bold rounded-full text-[10px] uppercase ${l.tipo === 'entrada' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              {l.tipo}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold">{l.categoria}</td>
                          <td className="py-3 px-4">{l.descricao}</td>
                          <td className="py-3 px-4">{l.forma_pagamento || 'Dinheiro'}</td>
                          <td className={`py-3 px-4 text-right font-bold text-sm ${l.tipo === 'entrada' ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {l.tipo === 'entrada' ? '+' : '-'} R$ {parseFloat(l.valor).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={7} className="py-8 text-center text-slate-400">Nenhum lançamento registrado.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- ABA AGENDA --- */}
        {activeTab === 'agenda' && (
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">📅 Agenda Integrada</h2>
                <p className="text-xs text-slate-500">Agendamentos individuais e institucionais com envio de lembrete via WhatsApp.</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <input
                  type="text"
                  placeholder="Filtrar por Dono..."
                  value={agendaFilterDono}
                  onChange={(e) => setAgendaFilterDono(e.target.value)}
                  className="rounded-xl border p-2 text-xs font-bold"
                />
                <button onClick={() => setIsAgendaModalOpen(true)} className="px-4 py-2 bg-gradient-to-r from-blue-900 to-indigo-700 text-white font-bold text-xs rounded-xl shadow">
                  + Novo Compromisso
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCompromissos.length > 0 ? (
                filteredCompromissos.map((c) => (
                  <div key={c.id} className="p-4 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-3 relative hover:border-indigo-300 transition-colors">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-indigo-100 text-indigo-900 rounded-md">
                        Dono: {c.dono_codigo} ({c.dono_tipo})
                      </span>
                      <span className="text-xs font-mono font-bold text-blue-900">{c.hora_compromisso}</span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-slate-900">{c.titulo}</h4>
                      <p className="text-xs text-slate-600 mt-1">{c.descricao || 'Sem pauta informada.'}</p>
                    </div>

                    <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-200">
                      <p>🗓️ <b>Data:</b> {c.data_compromisso}</p>
                      <p>📍 <b>Local:</b> {c.local_evento || 'Templo/Igreja'}</p>
                    </div>

                    {c.whatsapp_notificacao && (
                      <button
                        onClick={() => handleSendWhatsAppLembrete(c)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <span>🔔</span> Notificar via WhatsApp
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-slate-400">
                  Nenhum compromisso encontrado na agenda.
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* --- MODAL DE MEMBRO (DIVIDIDO EM 2 ABAS PERFEITAS) --- */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setIsMemberModalOpen(false)}>
          <div className="bg-white max-w-3xl w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto" onClick={(e) => e.stopPropagation()}>
            
            <div className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center flex-shrink-0">
              <h3 className="text-lg font-bold">{editingMemberId ? 'Alterar Cadastro de Membro' : 'Novo Cadastro de Membro'}</h3>
              <button onClick={() => setIsMemberModalOpen(false)} className="text-slate-300 hover:text-white text-2xl font-bold">&times;</button>
            </div>

            {/* BARRA DE SUB-ABAS */}
            <div className="flex border-b border-slate-200 bg-slate-100 px-6 pt-3 gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setMemberModalSubTab('dados')}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-t border-x ${
                  memberModalSubTab === 'dados' ? 'bg-white text-blue-900 border-slate-200 shadow-xs -mb-px' : 'text-slate-600 hover:text-blue-900 border-transparent'
                }`}
              >
                📋 1. Dados Pessoais & Foto
              </button>

              <button
                type="button"
                onClick={() => setMemberModalSubTab('endereco_outros')}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-t border-x ${
                  memberModalSubTab === 'endereco_outros' ? 'bg-white text-blue-900 border-slate-200 shadow-xs -mb-px' : 'text-slate-600 hover:text-blue-900 border-transparent'
                }`}
              >
                🏠 2. Endereço & Contatos
              </button>
            </div>

            <form onSubmit={handleRegisterMember} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-6 overflow-y-auto max-h-[65vh]">
                
                {memberModalSubTab === 'dados' && (
                  <div className="space-y-6">
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-6">
                      <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden relative flex-shrink-0">
                        {useCamera ? (
                          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        ) : photoPreview ? (
                          <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium text-center px-2">Sem foto</span>
                        )}
                      </div>

                      <canvas ref={canvasRef} className="hidden" />

                      <div className="space-y-2 text-center sm:text-left">
                        <h4 className="text-xs font-bold text-slate-700 uppercase">Foto do Membro</h4>
                        <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
                          {!useCamera ? (
                            <>
                              <label className="cursor-pointer bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold">
                                Inspecionar / Arquivo
                                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                              </label>
                              <button type="button" onClick={startCamera} className="bg-blue-800 hover:bg-blue-900 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">Tirar Foto</button>
                            </>
                          ) : (
                            <>
                              <button type="button" onClick={capturePhoto} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">Capturar</button>
                              <button type="button" onClick={stopCamera} className="bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">Cancelar</button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo Cadastro *</label>
                        <select name="tipo_cadastro" value={formData.tipo_cadastro} onChange={handleChange} required className="w-full rounded-xl border p-2.5 text-sm">
                          <option value="">Selecione...</option>
                          <option value="Membro">Membro</option>
                          <option value="Visitante">Visitante</option>
                          <option value="Congregado">Congregado</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Nome completo *</label>
                        <input type="text" name="nome" value={formData.nome} onChange={handleChange} required className="w-full rounded-xl border p-2.5 text-sm" />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">CPF</label>
                        <input type="text" name="cpf" placeholder="000.000.000-00" value={formData.cpf} onChange={handleChange} className="w-full rounded-xl border p-2.5 text-sm" />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Sexo *</label>
                        <select name="sexo" value={formData.sexo} onChange={handleChange} required className="w-full rounded-xl border p-2.5 text-sm">
                          <option value="">Selecione...</option>
                          <option value="Masculino">Masculino</option>
                          <option value="Feminino">Feminino</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Data de Nascimento *</label>
                        <input type="date" name="nascimento" value={formData.nascimento} onChange={handleChange} required className="w-full rounded-xl border p-2.5 text-sm" />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Identificação / RG</label>
                        <input type="text" name="identificacao" placeholder="RG / RGM" value={formData.identificacao} onChange={handleChange} className="w-full rounded-xl border p-2.5 text-sm" />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Nacionalidade</label>
                        <input type="text" name="nacionalidade" value={formData.nacionalidade} onChange={handleChange} className="w-full rounded-xl border p-2.5 text-sm" />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Naturalidade</label>
                        <input type="text" name="naturalidade" placeholder="Ex: Teófilo Otoni" value={formData.naturalidade} onChange={handleChange} className="w-full rounded-xl border p-2.5 text-sm" />
                      </div>
                    </div>
                  </div>
                )}

                {memberModalSubTab === 'endereco_outros' && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-blue-900 uppercase border-b pb-1">Endereço & Localização</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Rua / Logradouro</label>
                        <input type="text" name="rua" placeholder="Rua Epaminondas Otoni" value={formData.rua} onChange={handleChange} className="w-full rounded-xl border p-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Número</label>
                        <input type="text" name="numero" placeholder="123" value={formData.numero} onChange={handleChange} className="w-full rounded-xl border p-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Bairro</label>
                        <input type="text" name="bairro" placeholder="Centro" value={formData.bairro} onChange={handleChange} className="w-full rounded-xl border p-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Cidade</label>
                        <input type="text" name="cidade" value={formData.cidade} onChange={handleChange} className="w-full rounded-xl border p-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">UF</label>
                        <input type="text" name="uf" value={formData.uf} onChange={handleChange} className="w-full rounded-xl border p-2 text-sm" />
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-blue-900 uppercase border-b pb-1 pt-2">Telefones & Contatos</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Celular / WhatsApp *</label>
                        <input type="text" name="celular_principal" placeholder="(33) 90000-0000" value={formData.celular_principal} onChange={handleChange} required className="w-full rounded-xl border p-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Celular 2</label>
                        <input type="text" name="celular_secundario" value={formData.celular_secundario} onChange={handleChange} className="w-full rounded-xl border p-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Telefone Fixo</label>
                        <input type="text" name="telefone_fixo" value={formData.telefone_fixo} onChange={handleChange} className="w-full rounded-xl border p-2 text-sm" />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">E-mail</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full rounded-xl border p-2 text-sm" />
                      </div>
                    </div>
                  </div>
                )}

              </div>

              <div className="flex items-center justify-between border-t bg-slate-50 px-6 py-4 flex-shrink-0">
                {memberModalSubTab === 'dados' ? (
                  <button type="button" onClick={() => setMemberModalSubTab('endereco_outros')} className="px-4 py-2 bg-blue-100 text-blue-900 font-bold text-xs rounded-xl">
                    Avançar para Endereço →
                  </button>
                ) : (
                  <button type="button" onClick={() => setMemberModalSubTab('dados')} className="px-4 py-2 bg-slate-200 text-slate-800 font-bold text-xs rounded-xl">
                    ← Voltar para Dados Pessoais
                  </button>
                )}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsMemberModalOpen(false)} className="px-4 py-2 border rounded-xl bg-white text-slate-700 font-semibold text-xs">Cancelar</button>
                  <button type="submit" disabled={loading} className="px-6 py-2 bg-gradient-to-r from-blue-900 to-indigo-700 text-white font-bold text-xs rounded-xl shadow">
                    {loading ? 'Salvando...' : 'Salvar Cadastro'}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* --- MODAL LANÇAMENTO FINANCEIRO --- */}
      {isLancamentoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold">Novo Lançamento Financeiro</h3>
              <button onClick={() => setIsLancamentoModalOpen(false)} className="text-white text-2xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleSaveLancamento} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Conta Destino / Origem *</label>
                <select value={lancamentoForm.codigo_conta} onChange={(e) => setLancamentoForm({ ...lancamentoForm, codigo_conta: e.target.value })} required className="w-full rounded-lg border p-2 text-sm">
                  {contasFinanceiras.map((c) => (
                    <option key={c.id} value={c.codigo_conta}>
                      {c.codigo_conta} - {c.nome_conta}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Tipo *</label>
                  <select value={lancamentoForm.tipo} onChange={(e) => setLancamentoForm({ ...lancamentoForm, tipo: e.target.value })} required className="w-full rounded-lg border p-2 text-sm">
                    <option value="entrada">🟢 Entrada (Receita)</option>
                    <option value="saida">🔴 Saída (Despesa)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Categoria *</label>
                  <select value={lancamentoForm.categoria} onChange={(e) => setLancamentoForm({ ...lancamentoForm, categoria: e.target.value })} required className="w-full rounded-lg border p-2 text-sm">
                    <option value="Dízimo">Dízimo</option>
                    <option value="Oferta">Oferta</option>
                    <option value="Doação">Doação</option>
                    <option value="Energia/Água">Energia/Água</option>
                    <option value="Fornecedores">Fornecedores</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Prebenda/Salários">Prebenda/Salários</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Descrição / Histórico *</label>
                <input type="text" required placeholder="Ex: Dízimo Irmão João / Conta de Luz" value={lancamentoForm.descricao} onChange={(e) => setLancamentoForm({ ...lancamentoForm, descricao: e.target.value })} className="w-full rounded-lg border p-2 text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Valor (R$) *</label>
                  <input type="number" step="0.01" required placeholder="0.00" value={lancamentoForm.valor} onChange={(e) => setLancamentoForm({ ...lancamentoForm, valor: e.target.value })} className="w-full rounded-lg border p-2 text-sm font-bold text-blue-900" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Data *</label>
                  <input type="date" required value={lancamentoForm.data_lancamento} onChange={(e) => setLancamentoForm({ ...lancamentoForm, data_lancamento: e.target.value })} className="w-full rounded-lg border p-2 text-sm" />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={() => setIsLancamentoModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-900 text-white font-bold text-sm rounded-lg shadow">Confirmar Lançamento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL NOVO BANCO --- */}
      {isContaModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold">Cadastrar Novo Banco</h3>
              <button onClick={() => setIsContaModalOpen(false)} className="text-white text-2xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleSaveConta} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Código do Banco *</label>
                <input type="text" required placeholder="Ex: 002, 003, 004..." value={contaForm.codigo_conta} onChange={(e) => setContaForm({ ...contaForm, codigo_conta: e.target.value })} className="w-full rounded-lg border p-2 text-sm font-mono" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nome da Conta / Banco *</label>
                <input type="text" required placeholder="Ex: Banco Sicoob, Itaú..." value={contaForm.nome_conta} onChange={(e) => setContaForm({ ...contaForm, nome_conta: e.target.value })} className="w-full rounded-lg border p-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Agência</label>
                  <input type="text" value={contaForm.agencia} onChange={(e) => setContaForm({ ...contaForm, agencia: e.target.value })} className="w-full rounded-lg border p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Conta</label>
                  <input type="text" value={contaForm.numero_conta} onChange={(e) => setContaForm({ ...contaForm, numero_conta: e.target.value })} className="w-full rounded-lg border p-2 text-sm" />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={() => setIsContaModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-900 text-white font-bold text-sm rounded-lg shadow">Cadastrar Banco</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL NOVO AGENDAMENTO AGENDA --- */}
      {isAgendaModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold">Agendar Compromisso</h3>
              <button onClick={() => setIsAgendaModalOpen(false)} className="text-white text-2xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleSaveCompromisso} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Dono da Agenda *</label>
                  <input type="text" required placeholder="Ex: Pastor, Membro João..." value={agendaForm.dono_codigo} onChange={(e) => setAgendaForm({ ...agendaForm, dono_codigo: e.target.value })} className="w-full rounded-lg border p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Tipo Dono</label>
                  <select value={agendaForm.dono_tipo} onChange={(e) => setAgendaForm({ ...agendaForm, dono_tipo: e.target.value })} className="w-full rounded-lg border p-2 text-sm">
                    <option value="pastor">Pastor</option>
                    <option value="membro">Membro</option>
                    <option value="lider">Líder</option>
                    <option value="geral">Agenda Geral</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Título do Evento *</label>
                <input type="text" required placeholder="Ex: Reunião de Oração" value={agendaForm.titulo} onChange={(e) => setAgendaForm({ ...agendaForm, titulo: e.target.value })} className="w-full rounded-lg border p-2 text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Data *</label>
                  <input type="date" required value={agendaForm.data_compromisso} onChange={(e) => setAgendaForm({ ...agendaForm, data_compromisso: e.target.value })} className="w-full rounded-lg border p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Horário *</label>
                  <input type="time" required value={agendaForm.hora_compromisso} onChange={(e) => setAgendaForm({ ...agendaForm, hora_compromisso: e.target.value })} className="w-full rounded-lg border p-2 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">WhatsApp para Notificação</label>
                <input type="text" placeholder="(33) 90000-0000" value={agendaForm.whatsapp_notificacao} onChange={(e) => setAgendaForm({ ...agendaForm, whatsapp_notificacao: e.target.value })} className="w-full rounded-lg border p-2 text-sm" />
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={() => setIsAgendaModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-900 text-white font-bold text-sm rounded-lg shadow">Confirmar Agendamento</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}