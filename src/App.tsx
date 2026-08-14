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

  // Modais Financeiro e Agenda
  const [isLancamentoModalOpen, setIsLancamentoModalOpen] = useState(false);
  const [isContaModalOpen, setIsContaModalOpen] = useState(false);
  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);

  // --- ESTADOS DE EDIÇÃO E LISTAS ---
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
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

  // --- ATALHO ESC ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMemberModalOpen(false);
        setIsUserModalOpen(false);
        setIsSupplierModalOpen(false);
        setIsChurchModalOpen(false);
        setIsLancamentoModalOpen(false);
        setIsContaModalOpen(false);
        setIsAgendaModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- LOGIN E SESSÃO ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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
        alert('Usuário ou senha incorretos.');
        return;
      }

      setLoggedUser(data);
      setLoggedIgreja(data.igrejas);
      setIsLoggedIn(true);

      fetchMembers(data.codigo_igreja);
      fetchUsers(data.codigo_igreja);
      fetchSuppliers(data.codigo_igreja);
      fetchChurches();
      fetchFinanceiro(data.codigo_igreja);
      fetchAgenda(data.codigo_igreja);
    } catch (err: any) {
      alert('Erro no login: ' + err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoggedUser(null);
    setLoggedIgreja(null);
  };

  // --- BUSCA NO SUPABASE ---
  const fetchMembers = async (codigoIgreja: string) => {
    const { data } = await supabase.from('members').select('*').eq('codigo_igreja', codigoIgreja);
    setMembers(data || []);
  };

  const fetchUsers = async (codigoIgreja: string) => {
    const { data } = await supabase.from('usuarios').select('*').eq('codigo_igreja', codigoIgreja);
    setUsersList(data || []);
  };

  const fetchSuppliers = async (codigoIgreja: string) => {
    const { data } = await supabase.from('fornecedores').select('*').eq('codigo_igreja', codigoIgreja);
    setSuppliersList(data || []);
  };

  const fetchChurches = async () => {
    const { data } = await supabase.from('igrejas').select('*');
    setChurchesList(data || []);
  };

  const fetchFinanceiro = async (codigoIgreja: string) => {
    let { data: contas } = await supabase.from('contas_financeiras').select('*').eq('codigo_igreja', codigoIgreja);
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
  };

  const fetchAgenda = async (codigoIgreja: string) => {
    const { data } = await supabase
      .from('agenda_compromissos')
      .select('*')
      .eq('codigo_igreja', codigoIgreja)
      .order('data_compromisso', { ascending: true });
    setCompromissos(data || []);
  };

  // --- AÇÕES DO FINANCEIRO ---
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
      alert('Banco cadastrado!');
      setIsContaModalOpen(false);
      setContaForm(initialContaForm);
      fetchFinanceiro(loggedUser.codigo_igreja);
    } catch (err: any) {
      alert('Erro: ' + err.message);
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
      alert('Lançamento realizado!');
      setIsLancamentoModalOpen(false);
      setLancamentoForm(initialLancamentoForm);
      fetchFinanceiro(loggedUser.codigo_igreja);
    } catch (err: any) {
      alert('Erro: ' + err.message);
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
      if (l.tipo === 'entrada') saldos[l.codigo_conta] = (saldos[l.codigo_conta] || 0) + v;
      else if (l.tipo === 'saida') saldos[l.codigo_conta] = (saldos[l.codigo_conta] || 0) - v;
    });
    const saldoTotalConsolidado = Object.values(saldos).reduce((acc, curr) => acc + curr, 0);
    return { saldos, saldoTotalConsolidado };
  };

  // --- AÇÕES DA AGENDA ---
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
      alert('Compromisso agendado!');
      setIsAgendaModalOpen(false);
      setAgendaForm(initialAgendaForm);
      fetchAgenda(loggedUser.codigo_igreja);
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendWhatsAppLembrete = (c: any) => {
    if (!c.whatsapp_notificacao) {
      alert('Sem número de WhatsApp.');
      return;
    }
    const cleanPhone = c.whatsapp_notificacao.replace(/\D/g, '');
    const mensagem = encodeURIComponent(`Olá! 📅 Compromisso: *${c.titulo}*\n🗓️ Data: ${c.data_compromisso} às ${c.hora_compromisso}\n📍 Local: ${c.local_evento || 'Igreja'}`);
    window.open(`https://wa.me/55${cleanPhone}?text=${mensagem}`, '_blank');
  };

  // --- AÇÕES DE MEMBROS ---
  const handleOpenNewMemberModal = () => {
    setMemberModalSubTab('dados');
    setEditingMemberId(null);
    setFormData(initialMemberFormData);
    setIsMemberModalOpen(true);
  };

  const handleOpenEditMemberModal = (member: any) => {
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
    setIsMemberModalOpen(true);
  };

  const handleRegisterMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData, codigo_igreja: loggedUser.codigo_igreja, ativo: true };
      if (editingMemberId) {
        await supabase.from('members').update(payload).eq('id', editingMemberId);
      } else {
        await supabase.from('members').insert([payload]);
      }
      setIsMemberModalOpen(false);
      fetchMembers(loggedUser.codigo_igreja);
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleDropdown = (name: string) => setOpenDropdown(openDropdown === name ? null : name);

  // FILTRAGENS
  const filteredMembers = members.filter((m) => !searchTerm || m.nome?.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredLancamentos = lancamentos.filter((l) => filterConta === 'todas' || l.codigo_conta === filterConta);
  const filteredCompromissos = compromissos.filter((c) => agendaFilterDono === 'todos' || c.dono_codigo.toLowerCase().includes(agendaFilterDono.toLowerCase()));

  const { saldos, saldoTotalConsolidado } = getSaldosProcessados();

  // --- LOGIN ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 space-y-6">
          <div className="text-center">
            <span className="text-3xl font-black text-blue-900 block">BRSYSTEM</span>
            <p className="text-xs text-slate-500 font-semibold mt-1">Gestão de Igrejas</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Código Igreja</label>
              <input type="text" required value={loginCodigo} onChange={(e) => setLoginCodigo(e.target.value)} className="w-full rounded-xl border p-3 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Usuário</label>
              <input type="text" required value={loginUsuario} onChange={(e) => setLoginUsuario(e.target.value)} className="w-full rounded-xl border p-3 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Senha</label>
              <input type="password" required value={loginSenha} onChange={(e) => setLoginSenha(e.target.value)} className="w-full rounded-xl border p-3 text-sm" />
            </div>
            <button type="submit" disabled={loginLoading} className="w-full py-3.5 bg-blue-900 text-white font-bold rounded-xl shadow-lg">
              {loginLoading ? 'Acessando...' : 'Entrar no Sistema'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- TELA PRINCIPAL ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" onClick={() => openDropdown && setOpenDropdown(null)}>
      
      {/* BARRA SUPERIOR DE NAVEGAÇÃO CORRIGIDA */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 shadow-xs relative z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center gap-8">
            <div onClick={() => setActiveTab('membros')} className="flex items-center gap-2 cursor-pointer">
              <span className="text-xl font-black text-blue-900">BRSYSTEM</span>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-blue-900">
              
              {/* DROPDOWN CADASTROS */}
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

              {/* BOTÃO AGENDA (DIRETO) */}
              <button
                type="button"
                onClick={() => { setActiveTab('agenda'); setOpenDropdown(null); }}
                className={`py-2 hover:text-indigo-600 transition-colors ${activeTab === 'agenda' ? 'text-indigo-600 font-black border-b-2 border-indigo-600' : ''}`}
              >
                📅 Agenda
              </button>

              {/* BOTÃO FINANCEIRO (DIRETO) */}
              <button
                type="button"
                onClick={() => { setActiveTab('financeiro'); setOpenDropdown(null); }}
                className={`py-2 hover:text-indigo-600 transition-colors ${activeTab === 'financeiro' ? 'text-indigo-600 font-black border-b-2 border-indigo-600' : ''}`}
              >
                💰 Financeiro
              </button>

              {/* DROPDOWN CONTROLE */}
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

      {/* ÁREA DE CONTEÚDO ALTERNADA POR ACTIVE_TAB */}
      <main className="max-w-7xl w-full mx-auto p-6 space-y-6 flex-1">

        {/* --- TELA 1: MEMBROS --- */}
        {activeTab === 'membros' && (
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Cadastro de Membros ({filteredMembers.length})</h2>
                <p className="text-xs text-slate-500">Clique no membro para ver e alterar os dados.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="Buscar por Nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 rounded-xl border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-600"
                />
                <button onClick={handleOpenNewMemberModal} className="px-4 py-2 bg-gradient-to-r from-blue-900 to-indigo-700 text-white font-bold text-sm rounded-xl shadow">
                  + Novo Membro
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-slate-600 text-sm font-semibold">
                    <th className="py-3 px-4">Nome</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">CPF</th>
                    <th className="py-3 px-4">Celular</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm text-slate-700">
                  {filteredMembers.map((m) => (
                    <tr key={m.id} onClick={() => handleOpenEditMemberModal(m)} className="hover:bg-blue-50/50 cursor-pointer">
                      <td className="py-3 px-4 font-bold text-slate-900">{m.nome}</td>
                      <td className="py-3 px-4">{m.tipo_cadastro}</td>
                      <td className="py-3 px-4 font-mono">{m.cpf || '-'}</td>
                      <td className="py-3 px-4">{m.celular_principal || '-'}</td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => handleOpenEditMemberModal(m)} className="px-3 py-1 bg-blue-100 text-blue-800 font-bold text-xs rounded-lg">Alterar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- TELA 2: FINANCEIRO (CAIXA 001 + BANCOS) --- */}
        {activeTab === 'financeiro' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white p-5 rounded-2xl shadow-md">
                <p className="text-xs font-bold text-blue-200 uppercase">Saldo Total Consolidado</p>
                <h3 className="text-2xl font-black mt-1">R$ {saldoTotalConsolidado.toFixed(2)}</h3>
                <span className="text-[10px] bg-blue-800 px-2 py-0.5 rounded-full mt-2 inline-block">Caixa + Bancos</span>
              </div>

              {contasFinanceiras.map((c) => {
                const s = saldos[c.codigo_conta] || 0;
                return (
                  <div key={c.id} className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">Código: {c.codigo_conta}</span>
                    <h4 className="text-sm font-bold text-slate-800 mt-1">{c.nome_conta}</h4>
                    <p className={`text-xl font-bold mt-3 ${s >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>R$ {s.toFixed(2)}</p>
                  </div>
                );
              })}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Módulo Financeiro (Caixa e Bancos)</h2>
                  <p className="text-xs text-slate-500">Lançamento de Dízimos, Ofertas e Despesas com atualização de saldo em tempo real.</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setIsContaModalOpen(true)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border">+ Criar Banco</button>
                  <button onClick={() => setIsLancamentoModalOpen(true)} className="px-4 py-2 bg-blue-900 text-white font-bold text-xs rounded-xl shadow">+ Novo Lançamento</button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b text-slate-600 text-xs font-bold uppercase">
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4">Conta</th>
                      <th className="py-3 px-4">Tipo</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4">Descrição</th>
                      <th className="py-3 px-4 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs text-slate-700">
                    {filteredLancamentos.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono">{l.data_lancamento}</td>
                        <td className="py-3 px-4 font-bold">{l.codigo_conta} - {contasFinanceiras.find((c) => c.codigo_conta === l.codigo_conta)?.nome_conta || 'Caixa'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 font-bold rounded-full text-[10px] uppercase ${l.tipo === 'entrada' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{l.tipo}</span>
                        </td>
                        <td className="py-3 px-4">{l.categoria}</td>
                        <td className="py-3 px-4">{l.descricao}</td>
                        <td className={`py-3 px-4 text-right font-bold text-sm ${l.tipo === 'entrada' ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {l.tipo === 'entrada' ? '+' : '-'} R$ {parseFloat(l.valor).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- TELA 3: AGENDA (AVISO WHATSAPP) --- */}
        {activeTab === 'agenda' && (
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">📅 Agenda Integrada de Compromissos</h2>
                <p className="text-xs text-slate-500">Acesse a agenda de pastores, membros ou agendas gerais da igreja.</p>
              </div>
              <button onClick={() => setIsAgendaModalOpen(true)} className="px-4 py-2 bg-blue-900 text-white font-bold text-xs rounded-xl shadow">+ Agendar Evento</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCompromissos.map((c) => (
                <div key={c.id} className="p-4 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-indigo-100 text-indigo-900 rounded-md">Dono: {c.dono_codigo}</span>
                    <span className="text-xs font-mono font-bold text-blue-900">{c.hora_compromisso}</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900">{c.titulo}</h4>
                  <p className="text-xs text-slate-600">{c.descricao || 'Sem descrição.'}</p>
                  <div className="text-xs text-slate-500 pt-2 border-t">🗓️ {c.data_compromisso} • 📍 {c.local_evento || 'Igreja'}</div>
                  {c.whatsapp_notificacao && (
                    <button onClick={() => handleSendWhatsAppLembrete(c)} className="w-full py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs">
                      🔔 Notificar via WhatsApp
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* --- MODAIS DE CADASTRO (EXEMPLO: LANÇAMENTO FINANCEIRO) --- */}
      {isLancamentoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold">Novo Lançamento Financeiro</h3>
              <button onClick={() => setIsLancamentoModalOpen(false)} className="text-2xl font-bold">&times;</button>
            </div>
            <form onSubmit={handleSaveLancamento} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Conta *</label>
                <select value={lancamentoForm.codigo_conta} onChange={(e) => setLancamentoForm({ ...lancamentoForm, codigo_conta: e.target.value })} required className="w-full rounded-lg border p-2 text-sm">
                  {contasFinanceiras.map((c) => <option key={c.id} value={c.codigo_conta}>{c.codigo_conta} - {c.nome_conta}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Tipo *</label>
                  <select value={lancamentoForm.tipo} onChange={(e) => setLancamentoForm({ ...lancamentoForm, tipo: e.target.value })} required className="w-full rounded-lg border p-2 text-sm">
                    <option value="entrada">🟢 Entrada</option>
                    <option value="saida">🔴 Saída</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Categoria *</label>
                  <select value={lancamentoForm.categoria} onChange={(e) => setLancamentoForm({ ...lancamentoForm, categoria: e.target.value })} required className="w-full rounded-lg border p-2 text-sm">
                    <option value="Dízimo">Dízimo</option>
                    <option value="Oferta">Oferta</option>
                    <option value="Energia/Água">Energia/Água</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Descrição *</label>
                <input type="text" required value={lancamentoForm.descricao} onChange={(e) => setLancamentoForm({ ...lancamentoForm, descricao: e.target.value })} className="w-full rounded-lg border p-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Valor (R$) *</label>
                  <input type="number" step="0.01" required value={lancamentoForm.valor} onChange={(e) => setLancamentoForm({ ...lancamentoForm, valor: e.target.value })} className="w-full rounded-lg border p-2 text-sm font-bold text-blue-900" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Data *</label>
                  <input type="date" required value={lancamentoForm.data_lancamento} onChange={(e) => setLancamentoForm({ ...lancamentoForm, data_lancamento: e.target.value })} className="w-full rounded-lg border p-2 text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={() => setIsLancamentoModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-900 text-white font-bold text-sm rounded-lg shadow">Salvar Lançamento</button>
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

      {/* --- MODAL BANCO --- */}
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

    </div>
  )import React, { useState, useEffect, useRef } from 'react';
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
  
    // Modais Financeiro e Agenda
    const [isLancamentoModalOpen, setIsLancamentoModalOpen] = useState(false);
    const [isContaModalOpen, setIsContaModalOpen] = useState(false);
    const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
  
    // --- ESTADOS DE EDIÇÃO E LISTAS ---
    const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
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
  
    // --- ATALHO ESC ---
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsMemberModalOpen(false);
          setIsUserModalOpen(false);
          setIsSupplierModalOpen(false);
          setIsChurchModalOpen(false);
          setIsLancamentoModalOpen(false);
          setIsContaModalOpen(false);
          setIsAgendaModalOpen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
  
    // --- LOGIN E SESSÃO ---
    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
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
          alert('Usuário ou senha incorretos.');
          return;
        }
  
        setLoggedUser(data);
        setLoggedIgreja(data.igrejas);
        setIsLoggedIn(true);
  
        fetchMembers(data.codigo_igreja);
        fetchUsers(data.codigo_igreja);
        fetchSuppliers(data.codigo_igreja);
        fetchChurches();
        fetchFinanceiro(data.codigo_igreja);
        fetchAgenda(data.codigo_igreja);
      } catch (err: any) {
        alert('Erro no login: ' + err.message);
      } finally {
        setLoginLoading(false);
      }
    };
  
    const handleLogout = () => {
      setIsLoggedIn(false);
      setLoggedUser(null);
      setLoggedIgreja(null);
    };
  
    // --- BUSCA NO SUPABASE ---
    const fetchMembers = async (codigoIgreja: string) => {
      const { data } = await supabase.from('members').select('*').eq('codigo_igreja', codigoIgreja);
      setMembers(data || []);
    };
  
    const fetchUsers = async (codigoIgreja: string) => {
      const { data } = await supabase.from('usuarios').select('*').eq('codigo_igreja', codigoIgreja);
      setUsersList(data || []);
    };
  
    const fetchSuppliers = async (codigoIgreja: string) => {
      const { data } = await supabase.from('fornecedores').select('*').eq('codigo_igreja', codigoIgreja);
      setSuppliersList(data || []);
    };
  
    const fetchChurches = async () => {
      const { data } = await supabase.from('igrejas').select('*');
      setChurchesList(data || []);
    };
  
    const fetchFinanceiro = async (codigoIgreja: string) => {
      let { data: contas } = await supabase.from('contas_financeiras').select('*').eq('codigo_igreja', codigoIgreja);
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
    };
  
    const fetchAgenda = async (codigoIgreja: string) => {
      const { data } = await supabase
        .from('agenda_compromissos')
        .select('*')
        .eq('codigo_igreja', codigoIgreja)
        .order('data_compromisso', { ascending: true });
      setCompromissos(data || []);
    };
  
    // --- AÇÕES DO FINANCEIRO ---
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
        alert('Banco cadastrado!');
        setIsContaModalOpen(false);
        setContaForm(initialContaForm);
        fetchFinanceiro(loggedUser.codigo_igreja);
      } catch (err: any) {
        alert('Erro: ' + err.message);
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
        alert('Lançamento realizado!');
        setIsLancamentoModalOpen(false);
        setLancamentoForm(initialLancamentoForm);
        fetchFinanceiro(loggedUser.codigo_igreja);
      } catch (err: any) {
        alert('Erro: ' + err.message);
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
        if (l.tipo === 'entrada') saldos[l.codigo_conta] = (saldos[l.codigo_conta] || 0) + v;
        else if (l.tipo === 'saida') saldos[l.codigo_conta] = (saldos[l.codigo_conta] || 0) - v;
      });
      const saldoTotalConsolidado = Object.values(saldos).reduce((acc, curr) => acc + curr, 0);
      return { saldos, saldoTotalConsolidado };
    };
  
    // --- AÇÕES DA AGENDA ---
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
        alert('Compromisso agendado!');
        setIsAgendaModalOpen(false);
        setAgendaForm(initialAgendaForm);
        fetchAgenda(loggedUser.codigo_igreja);
      } catch (err: any) {
        alert('Erro: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
  
    const handleSendWhatsAppLembrete = (c: any) => {
      if (!c.whatsapp_notificacao) {
        alert('Sem número de WhatsApp.');
        return;
      }
      const cleanPhone = c.whatsapp_notificacao.replace(/\D/g, '');
      const mensagem = encodeURIComponent(`Olá! 📅 Compromisso: *${c.titulo}*\n🗓️ Data: ${c.data_compromisso} às ${c.hora_compromisso}\n📍 Local: ${c.local_evento || 'Igreja'}`);
      window.open(`https://wa.me/55${cleanPhone}?text=${mensagem}`, '_blank');
    };
  
    // --- AÇÕES DE MEMBROS ---
    const handleOpenNewMemberModal = () => {
      setMemberModalSubTab('dados');
      setEditingMemberId(null);
      setFormData(initialMemberFormData);
      setIsMemberModalOpen(true);
    };
  
    const handleOpenEditMemberModal = (member: any) => {
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
      setIsMemberModalOpen(true);
    };
  
    const handleRegisterMember = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        const payload = { ...formData, codigo_igreja: loggedUser.codigo_igreja, ativo: true };
        if (editingMemberId) {
          await supabase.from('members').update(payload).eq('id', editingMemberId);
        } else {
          await supabase.from('members').insert([payload]);
        }
        setIsMemberModalOpen(false);
        fetchMembers(loggedUser.codigo_igreja);
      } catch (err: any) {
        alert('Erro ao salvar: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
  
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };
  
    const toggleDropdown = (name: string) => setOpenDropdown(openDropdown === name ? null : name);
  
    // FILTRAGENS
    const filteredMembers = members.filter((m) => !searchTerm || m.nome?.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredLancamentos = lancamentos.filter((l) => filterConta === 'todas' || l.codigo_conta === filterConta);
    const filteredCompromissos = compromissos.filter((c) => agendaFilterDono === 'todos' || c.dono_codigo.toLowerCase().includes(agendaFilterDono.toLowerCase()));
  
    const { saldos, saldoTotalConsolidado } = getSaldosProcessados();
  
    // --- LOGIN ---
    if (!isLoggedIn) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 space-y-6">
            <div className="text-center">
              <span className="text-3xl font-black text-blue-900 block">BRSYSTEM</span>
              <p className="text-xs text-slate-500 font-semibold mt-1">Gestão de Igrejas</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Código Igreja</label>
                <input type="text" required value={loginCodigo} onChange={(e) => setLoginCodigo(e.target.value)} className="w-full rounded-xl border p-3 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Usuário</label>
                <input type="text" required value={loginUsuario} onChange={(e) => setLoginUsuario(e.target.value)} className="w-full rounded-xl border p-3 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Senha</label>
                <input type="password" required value={loginSenha} onChange={(e) => setLoginSenha(e.target.value)} className="w-full rounded-xl border p-3 text-sm" />
              </div>
              <button type="submit" disabled={loginLoading} className="w-full py-3.5 bg-blue-900 text-white font-bold rounded-xl shadow-lg">
                {loginLoading ? 'Acessando...' : 'Entrar no Sistema'}
              </button>
            </form>
          </div>
        </div>
      );
    }
  
    // --- TELA PRINCIPAL ---
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col" onClick={() => openDropdown && setOpenDropdown(null)}>
        
        {/* BARRA SUPERIOR DE NAVEGAÇÃO CORRIGIDA */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 shadow-xs relative z-30">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            
            <div className="flex items-center gap-8">
              <div onClick={() => setActiveTab('membros')} className="flex items-center gap-2 cursor-pointer">
                <span className="text-xl font-black text-blue-900">BRSYSTEM</span>
              </div>
  
              <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-blue-900">
                
                {/* DROPDOWN CADASTROS */}
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
  
                {/* BOTÃO AGENDA (DIRETO) */}
                <button
                  type="button"
                  onClick={() => { setActiveTab('agenda'); setOpenDropdown(null); }}
                  className={`py-2 hover:text-indigo-600 transition-colors ${activeTab === 'agenda' ? 'text-indigo-600 font-black border-b-2 border-indigo-600' : ''}`}
                >
                  📅 Agenda
                </button>
  
                {/* BOTÃO FINANCEIRO (DIRETO) */}
                <button
                  type="button"
                  onClick={() => { setActiveTab('financeiro'); setOpenDropdown(null); }}
                  className={`py-2 hover:text-indigo-600 transition-colors ${activeTab === 'financeiro' ? 'text-indigo-600 font-black border-b-2 border-indigo-600' : ''}`}
                >
                  💰 Financeiro
                </button>
  
                {/* DROPDOWN CONTROLE */}
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
  
        {/* ÁREA DE CONTEÚDO ALTERNADA POR ACTIVE_TAB */}
        <main className="max-w-7xl w-full mx-auto p-6 space-y-6 flex-1">
  
          {/* --- TELA 1: MEMBROS --- */}
          {activeTab === 'membros' && (
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Cadastro de Membros ({filteredMembers.length})</h2>
                  <p className="text-xs text-slate-500">Clique no membro para ver e alterar os dados.</p>
                </div>
  
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    placeholder="Buscar por Nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64 rounded-xl border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-600"
                  />
                  <button onClick={handleOpenNewMemberModal} className="px-4 py-2 bg-gradient-to-r from-blue-900 to-indigo-700 text-white font-bold text-sm rounded-xl shadow">
                    + Novo Membro
                  </button>
                </div>
              </div>
  
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b text-slate-600 text-sm font-semibold">
                      <th className="py-3 px-4">Nome</th>
                      <th className="py-3 px-4">Tipo</th>
                      <th className="py-3 px-4">CPF</th>
                      <th className="py-3 px-4">Celular</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm text-slate-700">
                    {filteredMembers.map((m) => (
                      <tr key={m.id} onClick={() => handleOpenEditMemberModal(m)} className="hover:bg-blue-50/50 cursor-pointer">
                        <td className="py-3 px-4 font-bold text-slate-900">{m.nome}</td>
                        <td className="py-3 px-4">{m.tipo_cadastro}</td>
                        <td className="py-3 px-4 font-mono">{m.cpf || '-'}</td>
                        <td className="py-3 px-4">{m.celular_principal || '-'}</td>
                        <td className="py-3 px-4 text-right">
                          <button onClick={() => handleOpenEditMemberModal(m)} className="px-3 py-1 bg-blue-100 text-blue-800 font-bold text-xs rounded-lg">Alterar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
  
          {/* --- TELA 2: FINANCEIRO (CAIXA 001 + BANCOS) --- */}
          {activeTab === 'financeiro' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white p-5 rounded-2xl shadow-md">
                  <p className="text-xs font-bold text-blue-200 uppercase">Saldo Total Consolidado</p>
                  <h3 className="text-2xl font-black mt-1">R$ {saldoTotalConsolidado.toFixed(2)}</h3>
                  <span className="text-[10px] bg-blue-800 px-2 py-0.5 rounded-full mt-2 inline-block">Caixa + Bancos</span>
                </div>
  
                {contasFinanceiras.map((c) => {
                  const s = saldos[c.codigo_conta] || 0;
                  return (
                    <div key={c.id} className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">Código: {c.codigo_conta}</span>
                      <h4 className="text-sm font-bold text-slate-800 mt-1">{c.nome_conta}</h4>
                      <p className={`text-xl font-bold mt-3 ${s >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>R$ {s.toFixed(2)}</p>
                    </div>
                  );
                })}
              </div>
  
              <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Módulo Financeiro (Caixa e Bancos)</h2>
                    <p className="text-xs text-slate-500">Lançamento de Dízimos, Ofertas e Despesas com atualização de saldo em tempo real.</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setIsContaModalOpen(true)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border">+ Criar Banco</button>
                    <button onClick={() => setIsLancamentoModalOpen(true)} className="px-4 py-2 bg-blue-900 text-white font-bold text-xs rounded-xl shadow">+ Novo Lançamento</button>
                  </div>
                </div>
  
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b text-slate-600 text-xs font-bold uppercase">
                        <th className="py-3 px-4">Data</th>
                        <th className="py-3 px-4">Conta</th>
                        <th className="py-3 px-4">Tipo</th>
                        <th className="py-3 px-4">Categoria</th>
                        <th className="py-3 px-4">Descrição</th>
                        <th className="py-3 px-4 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-xs text-slate-700">
                      {filteredLancamentos.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono">{l.data_lancamento}</td>
                          <td className="py-3 px-4 font-bold">{l.codigo_conta} - {contasFinanceiras.find((c) => c.codigo_conta === l.codigo_conta)?.nome_conta || 'Caixa'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 font-bold rounded-full text-[10px] uppercase ${l.tipo === 'entrada' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{l.tipo}</span>
                          </td>
                          <td className="py-3 px-4">{l.categoria}</td>
                          <td className="py-3 px-4">{l.descricao}</td>
                          <td className={`py-3 px-4 text-right font-bold text-sm ${l.tipo === 'entrada' ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {l.tipo === 'entrada' ? '+' : '-'} R$ {parseFloat(l.valor).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
  
          {/* --- TELA 3: AGENDA (AVISO WHATSAPP) --- */}
          {activeTab === 'agenda' && (
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">📅 Agenda Integrada de Compromissos</h2>
                  <p className="text-xs text-slate-500">Acesse a agenda de pastores, membros ou agendas gerais da igreja.</p>
                </div>
                <button onClick={() => setIsAgendaModalOpen(true)} className="px-4 py-2 bg-blue-900 text-white font-bold text-xs rounded-xl shadow">+ Agendar Evento</button>
              </div>
  
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCompromissos.map((c) => (
                  <div key={c.id} className="p-4 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-indigo-100 text-indigo-900 rounded-md">Dono: {c.dono_codigo}</span>
                      <span className="text-xs font-mono font-bold text-blue-900">{c.hora_compromisso}</span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900">{c.titulo}</h4>
                    <p className="text-xs text-slate-600">{c.descricao || 'Sem descrição.'}</p>
                    <div className="text-xs text-slate-500 pt-2 border-t">🗓️ {c.data_compromisso} • 📍 {c.local_evento || 'Igreja'}</div>
                    {c.whatsapp_notificacao && (
                      <button onClick={() => handleSendWhatsAppLembrete(c)} className="w-full py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs">
                        🔔 Notificar via WhatsApp
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
  
        </main>
  
        {/* --- MODAIS DE CADASTRO (EXEMPLO: LANÇAMENTO FINANCEIRO) --- */}
        {isLancamentoModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center">
                <h3 className="text-lg font-bold">Novo Lançamento Financeiro</h3>
                <button onClick={() => setIsLancamentoModalOpen(false)} className="text-2xl font-bold">&times;</button>
              </div>
              <form onSubmit={handleSaveLancamento} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Conta *</label>
                  <select value={lancamentoForm.codigo_conta} onChange={(e) => setLancamentoForm({ ...lancamentoForm, codigo_conta: e.target.value })} required className="w-full rounded-lg border p-2 text-sm">
                    {contasFinanceiras.map((c) => <option key={c.id} value={c.codigo_conta}>{c.codigo_conta} - {c.nome_conta}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Tipo *</label>
                    <select value={lancamentoForm.tipo} onChange={(e) => setLancamentoForm({ ...lancamentoForm, tipo: e.target.value })} required className="w-full rounded-lg border p-2 text-sm">
                      <option value="entrada">🟢 Entrada</option>
                      <option value="saida">🔴 Saída</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Categoria *</label>
                    <select value={lancamentoForm.categoria} onChange={(e) => setLancamentoForm({ ...lancamentoForm, categoria: e.target.value })} required className="w-full rounded-lg border p-2 text-sm">
                      <option value="Dízimo">Dízimo</option>
                      <option value="Oferta">Oferta</option>
                      <option value="Energia/Água">Energia/Água</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Descrição *</label>
                  <input type="text" required value={lancamentoForm.descricao} onChange={(e) => setLancamentoForm({ ...lancamentoForm, descricao: e.target.value })} className="w-full rounded-lg border p-2 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Valor (R$) *</label>
                    <input type="number" step="0.01" required value={lancamentoForm.valor} onChange={(e) => setLancamentoForm({ ...lancamentoForm, valor: e.target.value })} className="w-full rounded-lg border p-2 text-sm font-bold text-blue-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Data *</label>
                    <input type="date" required value={lancamentoForm.data_lancamento} onChange={(e) => setLancamentoForm({ ...lancamentoForm, data_lancamento: e.target.value })} className="w-full rounded-lg border p-2 text-sm" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 border-t pt-4">
                  <button type="button" onClick={() => setIsLancamentoModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
                  <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-900 text-white font-bold text-sm rounded-lg shadow">Salvar Lançamento</button>
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
  
        {/* --- MODAL BANCO --- */}
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
  
      </div>
    );
  }