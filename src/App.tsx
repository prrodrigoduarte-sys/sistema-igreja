import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedUser, setLoggedUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'membros' | 'usuarios' | 'fornecedores' | 'relatorios' | 'agenda' | 'financeiro' | 'igreja'>('membros');
  const [openDropdown, setOpenDropdown] = useState<'cadastros' | 'controle' | null>(null);

  // Sub-abas de Relatórios
  const [relatorioSubTab, setRelatorioSubTab] = useState<'geral' | 'aniversariantes_dia' | 'aniversariantes_mes' | 'completa'>('geral');

  // Sub-abas da Agenda
  const [agendaSubTab, setAgendaSubTab] = useState<'lista' | 'calendario' | 'impressao'>('lista');

  // Login
  const [loginCodigo, setLoginCodigo] = useState('IGR-001');
  const [loginUsuario, setLoginUsuario] = useState('');
  const [loginSenha, setLoginSenha] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Membros
  const [members, setMembers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingMembros, setLoadingMembros] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [formStep, setFormStep] = useState<1 | 2>(1);

  // Campos do Membro
  const [formNome, setFormNome] = useState('');
  const [formTipo, setFormTipo] = useState('Membro');
  const [formCpf, setFormCpf] = useState('');
  const [formRg, setFormRg] = useState('');
  const [formNascimento, setFormNascimento] = useState('');
  const [formCelular, setFormCelular] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formEstadoCivil, setFormEstadoCivil] = useState('Solteiro(a)');
  const [formEndereco, setFormEndereco] = useState('');
  const [formFotoUrl, setFormFotoUrl] = useState('');

  // Usuários e Fornecedores
  const [usuariosList, setUsuariosList] = useState<any[]>([]);
  const [fornecedoresList, setFornecedoresList] = useState<any[]>([]);

  // Agenda & Compromissos
  const [compromissos, setCompromissos] = useState<any[]>([]);
  const [loadingAgenda, setLoadingAgenda] = useState(false);
  const [showAgendaModal, setShowAgendaModal] = useState(false);
  const [editingCompromisso, setEditingCompromisso] = useState<any>(null);
  const [formAgendaTitulo, setFormAgendaTitulo] = useState('');
  const [formAgendaData, setFormAgendaData] = useState('');
  const [formAgendaHoraInicio, setFormAgendaHoraInicio] = useState('');
  const [formAgendaHoraFim, setFormAgendaHoraFim] = useState('');
  const [formAgendaComentario, setFormAgendaComentario] = useState('');
  const [formAgendaMembroId, setFormAgendaMembroId] = useState('');
  const [formAgendaStatus, setFormAgendaStatus] = useState('Pendente');

  // Financeiro
  const [contas, setContas] = useState<any[]>([]);
  const [lancamentos, setLancamentos] = useState<any[]>([]);
  const [loadingFinanceiro, setLoadingFinanceiro] = useState(false);

  // Aniversariantes
  const hoje = new Date();
  const diaAtual = String(hoje.getDate()).padStart(2, '0');
  const mesAtual = String(hoje.getMonth() + 1).padStart(2, '0');

  const aniversariantesDoDia = members.filter((m) => {
    if (!m.data_nascimento) return false;
    const partes = m.data_nascimento.split('-');
    return partes.length === 3 && partes[2] === diaAtual && partes[1] === mesAtual;
  });

  const aniversariantesDoMes = members.filter((m) => {
    if (!m.data_nascimento) return false;
    const partes = m.data_nascimento.split('-');
    return partes.length === 3 && partes[1] === mesAtual;
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const { data, error } = await supabase.from('usuarios').select('*, igrejas(*)').eq('codigo_igreja', loginCodigo.trim()).eq('usuario', loginUsuario.trim()).eq('senha', loginSenha.trim()).eq('ativo', true).single();
      if (error || !data) { alert('Usuário ou senha incorretos.'); return; }
      setLoggedUser(data); setIsLoggedIn(true); setActiveTab('membros'); 
    } catch (err: any) { alert('Erro no login: ' + err.message); } finally { setLoginLoading(false); }
  };

  const carregarAgenda = async (cod: string) => {
    setLoadingAgenda(true);
    const { data } = await supabase.from('agenda_compromissos').select('*').eq('codigo_igreja', cod).order('data_compromisso', { ascending: true }).order('hora_compromisso', { ascending: true });
    setCompromissos(data || []);
    setLoadingAgenda(false);
  };

  useEffect(() => {
    if (!isLoggedIn || !loggedUser?.codigo_igreja) return;
    const cod = loggedUser.codigo_igreja;
    
    async function carregarDados() {
      if (activeTab === 'membros' || activeTab === 'relatorios' || activeTab === 'agenda') {
        setLoadingMembros(true);
        const { data } = await supabase.from('members').select('*').eq('codigo_igreja', cod);
        setMembers(data || []);
        setLoadingMembros(false);
      }
      if (activeTab === 'usuarios') {
        const { data } = await supabase.from('usuarios').select('*').eq('codigo_igreja', cod);
        setUsuariosList(data || []);
      }
      if (activeTab === 'fornecedores') {
        const { data } = await supabase.from('fornecedores').select('*').eq('codigo_igreja', cod);
        setFornecedoresList(data || []);
      }
      if (activeTab === 'agenda') {
        carregarAgenda(cod);
      }
      if (activeTab === 'financeiro') {
        setLoadingFinanceiro(true);
        const { data: c } = await supabase.from('contas_financeiras').select('*').eq('codigo_igreja', cod);
        const { data: l } = await supabase.from('lancamentos_financeiros').select('*').eq('codigo_igreja', cod).order('data_lancamento', { ascending: false });
        setContas(c || []);
        setLancamentos(l || []);
        setLoadingFinanceiro(false);
      }
    }
    carregarDados();
  }, [isLoggedIn, activeTab, loggedUser]);

  const handleOpenNewMember = () => {
    setEditingMember(null);
    setFormNome('');
    setFormTipo('Membro');
    setFormCpf('');
    setFormRg('');
    setFormNascimento('');
    setFormCelular('');
    setFormEmail('');
    setFormEstadoCivil('Solteiro(a)');
    setFormEndereco('');
    setFormFotoUrl('');
    setFormStep(1);
    setShowMemberModal(true);
  };

  const handleOpenEditMember = (m: any) => {
    setEditingMember(m);
    setFormNome(m.nome || '');
    setFormTipo(m.tipo_cadastro || 'Membro');
    setFormCpf(m.cpf || '');
    setFormRg(m.rg || '');
    setFormNascimento(m.data_nascimento || '');
    setFormCelular(m.celular_principal || '');
    setFormEmail(m.email || '');
    setFormEstadoCivil(m.estado_civil || 'Solteiro(a)');
    setFormEndereco(m.endereco || '');
    setFormFotoUrl(m.foto_url || '');
    setFormStep(1);
    setShowMemberModal(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim()) { alert('O nome é obrigatório.'); return; }

    const payload = {
      codigo_igreja: loggedUser.codigo_igreja,
      nome: formNome.trim(),
      tipo_cadastro: formTipo,
      cpf: formCpf.trim(),
      rg: formRg.trim(),
      data_nascimento: formNascimento || null,
      celular_principal: formCelular.trim(),
      email: formEmail.trim(),
      estado_civil: formEstadoCivil,
      endereco: formEndereco.trim(),
      foto_url: formFotoUrl.trim()
    };

    try {
      if (editingMember) {
        const { error } = await supabase.from('members').update(payload).eq('id', editingMember.id);
        if (error) throw error;
        alert('Membro atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('members').insert([payload]);
        if (error) throw error;
        alert('Membro cadastrado com sucesso!');
      }

      setShowMemberModal(false);
      const { data } = await supabase.from('members').select('*').eq('codigo_igreja', loggedUser.codigo_igreja);
      setMembers(data || []);
    } catch (err: any) {
      alert('Erro ao salvar membro: ' + err.message);
    }
  };

  const handleOpenNewAgenda = () => {
    setEditingCompromisso(null);
    setFormAgendaTitulo('');
    setFormAgendaData('');
    setFormAgendaHoraInicio('');
    setFormAgendaHoraFim('');
    setFormAgendaComentario('');
    setFormAgendaMembroId('');
    setFormAgendaStatus('Pendente');
    setShowAgendaModal(true);
  };

  const handleOpenEditAgenda = (c: any) => {
    setEditingCompromisso(c);
    setFormAgendaTitulo(c.titulo || '');
    setFormAgendaData(c.data_compromisso || '');
    setFormAgendaHoraInicio(c.hora_compromisso || '');
    setFormAgendaHoraFim(c.hora_fim || '');
    setFormAgendaComentario(c.descricao || '');
    setFormAgendaMembroId('');
    setFormAgendaStatus(c.status || 'Pendente');
    setShowAgendaModal(true);
  };

  const handleSaveAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAgendaTitulo.trim() || !formAgendaData.trim()) {
      alert('Preencha pelo menos o Assunto e a Data do compromisso.');
      return;
    }

    let nomeMembroVinculado = editingCompromisso?.responsavel || 'A definir';
    if (formAgendaMembroId) {
      const membroEncontrado = members.find((m) => String(m.id) === String(formAgendaMembroId));
      if (membroEncontrado) {
        nomeMembroVinculado = membroEncontrado.nome;
      }
    }

    const payload = {
      codigo_igreja: loggedUser.codigo_igreja,
      titulo: formAgendaTitulo.trim(),
      data_compromisso: formAgendaData,
      hora_compromisso: formAgendaHoraInicio || '00:00',
      hora_fim: formAgendaHoraFim || null,
      descricao: formAgendaComentario.trim(),
      responsavel: nomeMembroVinculado,
      status: formAgendaStatus
    };

    try {
      if (editingCompromisso) {
        const { error } = await supabase.from('agenda_compromissos').update(payload).eq('id', editingCompromisso.id);
        if (error) throw error;
        alert('Compromisso atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('agenda_compromissos').insert([payload]);
        if (error) throw error;
        alert('Compromisso cadastrado com sucesso!');
      }

      setShowAgendaModal(false);
      carregarAgenda(loggedUser.codigo_igreja);
    } catch (err: any) {
      alert('Erro ao salvar compromisso: ' + err.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredMembers = members.filter((m) => !searchTerm || m.nome?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-black text-blue-900">BRSYSTEM</h1>
            <p className="text-xs text-slate-400 font-bold tracking-widest uppercase">Tecnologia para Gestão</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 ml-1">Código da Igreja</label>
              <input type="text" value={loginCodigo} onChange={(e) => setLoginCodigo(e.target.value)} className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 ml-1">Usuário</label>
              <input type="text" placeholder="Digite seu usuário" value={loginUsuario} onChange={(e) => setLoginUsuario(e.target.value)} className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 ml-1">Senha</label>
              <input type="password" placeholder="••••••••" value={loginSenha} onChange={(e) => setLoginSenha(e.target.value)} className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900" />
            </div>
            <button type="submit" disabled={loginLoading} className="w-full py-3.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow-lg cursor-pointer transition-all">
              {loginLoading ? 'Entrando...' : 'Entrar no Sistema'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm relative z-50 print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-xl font-black text-blue-900 leading-none">BRSYSTEM</span>
              <span className="text-[10px] tracking-widest text-blue-500 font-bold">TECNOLOGIA</span>
            </div>
            <nav className="flex items-center gap-6 text-sm font-bold text-slate-700">
              <div className="relative">
                <button onClick={() => setOpenDropdown(openDropdown === 'cadastros' ? null : 'cadastros')} className="hover:text-blue-900 cursor-pointer flex items-center gap-1">
                  Cadastros <span className="text-xs text-slate-400">∨</span>
                </button>
                {openDropdown === 'cadastros' && (
                  <div className="absolute left-0 mt-2 w-48 bg-white border rounded-xl shadow-xl py-2 z-50">
                    <button onClick={() => { setActiveTab('membros'); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-semibold text-slate-700">📁 Membros</button>
                    <button onClick={() => { setActiveTab('usuarios'); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-semibold text-slate-700">👤 Usuários</button>
                    <button onClick={() => { setActiveTab('fornecedores'); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-semibold text-slate-700">🚚 Fornecedores</button>
                    <button onClick={() => { setActiveTab('relatorios'); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-semibold text-slate-700">📊 Relatórios</button>
                  </div>
                )}
              </div>

              <button className="hover:text-blue-900 cursor-pointer flex items-center gap-1">Células <span className="text-xs text-slate-400">∨</span></button>
              
              <button onClick={() => { setActiveTab('agenda'); setOpenDropdown(null); }} className={`cursor-pointer flex items-center gap-1 transition-all ${activeTab === 'agenda' ? 'text-blue-900 font-black' : 'hover:text-blue-900'}`}>
                Agenda <span className="text-xs text-slate-400">∨</span>
              </button>
              
              <button onClick={() => { setActiveTab('financeiro'); setOpenDropdown(null); }} className={`cursor-pointer flex items-center gap-1 transition-all ${activeTab === 'financeiro' ? 'text-blue-900 font-black' : 'hover:text-blue-900'}`}>
                Financeiro <span className="text-xs text-slate-400">∨</span>
              </button>

              <div className="relative">
                <button onClick={() => setOpenDropdown(openDropdown === 'controle' ? null : 'controle')} className={`cursor-pointer flex items-center gap-1 transition-all ${activeTab === 'igreja' ? 'text-blue-900 font-black' : 'hover:text-blue-900'}`}>
                  Controle <span className="text-xs text-slate-400">∨</span>
                </button>
                {openDropdown === 'controle' && (
                  <div className="absolute left-0 mt-2 w-48 bg-white border rounded-xl shadow-xl py-2 z-50">
                    <button onClick={() => { setActiveTab('igreja'); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-semibold text-slate-700">🏛️ Cadastro da Igreja</button>
                  </div>
                )}
              </div>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-black text-slate-800">{loggedUser?.igrejas?.nome_fantasia || 'Igreja'}</p>
              <p className="text-xs text-slate-500 font-semibold">{loggedUser?.nome_usuario || 'Administrador'}</p>
            </div>
            <button onClick={() => setIsLoggedIn(false)} className="px-4 py-1.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer transition-all">Sair</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto p-6 flex-1 print:p-0 print:max-w-none">
        {activeTab === 'membros' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Cadastro de Membros ({filteredMembers.length})</h2>
                <p className="text-xs text-slate-500">Clique na linha do membro para alterar os dados completos.</p>
              </div>
              <div className="flex items-center gap-3">
                <input type="text" placeholder="Buscar por Nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:w-64 rounded-xl border border-slate-300 p-2 text-sm focus:outline-none focus:border-blue-900" />
                <button onClick={handleOpenNewMember} className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-sm cursor-pointer whitespace-nowrap">+ Novo Membro</button>
              </div>
            </div>
            
            {loadingMembros ? (
              <p className="text-center py-6 text-slate-500 font-medium">Carregando membros...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b text-slate-600 text-sm font-semibold">
                      <th className="py-3 px-4">Foto</th>
                      <th className="py-3 px-4">Nome</th>
                      <th className="py-3 px-4">Tipo</th>
                      <th className="py-3 px-4">CPF</th>
                      <th className="py-3 px-4">Celular</th>
                      <th className="py-3 px-4">E-mail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm text-slate-700">
                    {filteredMembers.length === 0 ? (
                      <tr><td colSpan={6} className="py-6 text-center text-slate-400">Nenhum membro encontrado.</td></tr>
                    ) : (
                      filteredMembers.map((m: any) => (
                        <tr key={m.id} onClick={() => handleOpenEditMember(m)} className="hover:bg-blue-50/50 cursor-pointer transition-colors">
                          <td className="py-3 px-4">
                            {m.foto_url ? (
                              <img src={m.foto_url} alt={m.nome} className="w-10 h-10 rounded-full object-cover border" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                                {m.nome?.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">{m.nome}</td>
                          <td className="py-3 px-4">{m.tipo_cadastro}</td>
                          <td className="py-3 px-4 font-mono">{m.cpf || '-'}</td>
                          <td className="py-3 px-4">{m.celular_principal || '-'}</td>
                          <td className="py-3 px-4">{m.email || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'usuarios' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-bold text-slate-800">👤 Usuários do Sistema ({usuariosList.length})</h2>
              <p className="text-xs text-slate-500">Credenciais de acesso vinculadas a esta igreja.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-slate-600 text-sm font-semibold">
                    <th className="py-3 px-4">Nome de Usuário</th>
                    <th className="py-3 px-4">Login</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm text-slate-700">
                  {usuariosList.map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{u.nome_usuario}</td>
                      <td className="py-3 px-4 font-mono">{u.usuario}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${u.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {u.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'fornecedores' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-bold text-slate-800">🚚 Fornecedores ({fornecedoresList.length})</h2>
              <p className="text-xs text-slate-500">Parceiros e fornecedores cadastrados.</p>
            </div>
            {fornecedoresList.length === 0 ? (
              <p className="py-6 text-center text-slate-400">Nenhum fornecedor cadastrado no momento.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b text-slate-600 text-sm font-semibold">
                      <th className="py-3 px-4">Nome / Razão Social</th>
                      <th className="py-3 px-4">Contato</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm text-slate-700">
                    {fornecedoresList.map((f: any) => (
                      <tr key={f.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900">{f.nome}</td>
                        <td className="py-3 px-4">{f.contato || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ABA CADASTRO DA IGREJA COMPLETA */}
        {activeTab === 'igreja' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 max-w-3xl mx-auto">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-bold text-slate-800">🏛️ Cadastro Oficial da Instituição (Igreja)</h2>
              <p className="text-xs text-slate-500">Dados institucionais cadastrados e vinculados ao sistema.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
              <div className="p-4 bg-slate-50 rounded-xl border flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-400">Código da Igreja</span>
                <span className="font-mono text-base font-bold text-blue-900">{loggedUser?.igrejas?.codigo_igreja || 'IGR-001'}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-400">Nome / Razão Social</span>
                <span className="font-bold text-slate-800">{loggedUser?.igrejas?.nome_fantasia || 'Igreja Sede'}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-400">CNPJ</span>
                <span className="font-mono text-slate-800">{loggedUser?.igrejas?.cnpj || '00.000.000/0001-00'}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-400">E-mail Institucional</span>
                <span className="text-slate-800">{loggedUser?.igrejas?.email || 'contato@igreja.com'}</span>
              </div>
              <div className="md:col-span-2 p-4 bg-slate-50 rounded-xl border flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-400">Endereço Completo</span>
                <span className="text-slate-800">{loggedUser?.igrejas?.endereco || 'Endereço não cadastrado'}</span>
              </div>
            </div>
          </div>
        )}

        {/* ABA RELATÓRIOS / DASHBOARD */}
        {activeTab === 'relatorios' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 print:border-none print:shadow-none print:p-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 print:hidden">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">📊 Relatórios e Dashboard</h2>
                <p className="text-xs text-slate-500">Selecione o relatório desejado abaixo.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setRelatorioSubTab('geral')} className={`px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${relatorioSubTab === 'geral' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-white'}`}>Dashboard Geral</button>
                <button onClick={() => setRelatorioSubTab('aniversariantes_dia')} className={`px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${relatorioSubTab === 'aniversariantes_dia' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-white'}`}>🎂 Aniversariantes do Dia</button>
                <button onClick={() => setRelatorioSubTab('aniversariantes_mes')} className={`px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${relatorioSubTab === 'aniversariantes_mes' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-white'}`}>📅 Aniversariantes do Mês</button>
                <button onClick={() => setRelatorioSubTab('completa')} className={`px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${relatorioSubTab === 'completa' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-white'}`}>📋 Lista Completa</button>
                <button onClick={handlePrint} className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1">🖨️ Imprimir A4</button>
              </div>
            </div>

            <div className="hidden print:block text-center mb-6 pb-4 border-b-2 border-slate-800">
              <h1 className="text-2xl font-black text-slate-900">BRSYSTEM — {loggedUser?.igrejas?.nome_fantasia || 'Igreja'}</h1>
              <p className="text-sm font-bold text-slate-600 uppercase tracking-widest mt-1">
                {relatorioSubTab === 'aniversariantes_dia' ? 'Relatório de Aniversariantes do Dia' : relatorioSubTab === 'aniversariantes_mes' ? 'Relatório de Aniversariantes do Mês' : relatorioSubTab === 'completa' ? 'Relatório de Lista Completa de Membros' : 'Dashboard Geral'}
              </p>
            </div>

            {relatorioSubTab === 'geral' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 print:grid-cols-4">
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl print:border-slate-400">
                    <h4 className="font-bold text-blue-950">Total de Membros</h4>
                    <p className="text-3xl font-black text-slate-800 mt-2">{members.length}</p>
                  </div>
                  <div 
                    onClick={() => setRelatorioSubTab('aniversariantes_dia')}
                    className="p-5 bg-blue-50 border border-blue-200 rounded-2xl cursor-pointer hover:bg-blue-100 transition-all shadow-sm print:border-slate-400"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-blue-900">🎂 Aniversariantes Hoje</h4>
                      <span className="text-xs font-bold bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full">Ver Lista</span>
                    </div>
                    <p className="text-3xl font-black text-blue-950 mt-2">{aniversariantesDoDia.length}</p>
                    <p className="text-[11px] text-blue-700 mt-1">Clique para abrir a listagem do dia.</p>
                  </div>
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl print:border-slate-400">
                    <h4 className="font-bold text-blue-950">Compromissos na Agenda</h4>
                    <p className="text-3xl font-black text-slate-800 mt-2">{compromissos.length}</p>
                  </div>
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl print:border-slate-400">
                    <h4 className="font-bold text-blue-950">Contas Financeiras</h4>
                    <p className="text-3xl font-black text-slate-800 mt-2">{contas.length}</p>
                  </div>
                </div>
              </div>
            )}

            {relatorioSubTab === 'aniversariantes_dia' && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 text-lg print:hidden">🎂 Aniversariantes do Dia ({aniversariantesDoDia.length})</h3>
                <div className="overflow-x-auto border rounded-xl print:border-none">
                  <table className="w-full text-left text-sm print:text-xs">
                    <thead className="bg-slate-50 border-b text-slate-600 print:bg-slate-200">
                      <tr>
                        <th className="p-3">Nome</th>
                        <th className="p-3">Data de Nascimento</th>
                        <th className="p-3">Celular</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-700">
                      {aniversariantesDoDia.length === 0 ? (
                        <tr><td colSpan={3} className="py-6 text-center text-slate-400">Nenhum aniversariante encontrado para hoje.</td></tr>
                      ) : (
                        aniversariantesDoDia.map((m: any) => (
                          <tr key={m.id} className="hover:bg-slate-50">
                            <td className="p-3 font-bold">{m.nome}</td>
                            <td className="p-3 font-mono">{new Date(m.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                            <td className="p-3">{m.celular_principal || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {relatorioSubTab === 'aniversariantes_mes' && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 text-lg print:hidden">📅 Aniversariantes do Mês ({aniversariantesDoMes.length})</h3>
                <div className="overflow-x-auto border rounded-xl print:border-none">
                  <table className="w-full text-left text-sm print:text-xs">
                    <thead className="bg-slate-50 border-b text-slate-600 print:bg-slate-200">
                      <tr>
                        <th className="p-3">Nome</th>
                        <th className="p-3">Data de Nascimento</th>
                        <th className="p-3">Celular</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-700">
                      {aniversariantesDoMes.length === 0 ? (
                        <tr><td colSpan={3} className="py-6 text-center text-slate-400">Nenhum aniversariante cadastrado para este mês.</td></tr>
                      ) : (
                        aniversariantesDoMes.map((m: any) => (
                          <tr key={m.id} className="hover:bg-slate-50">
                            <td className="p-3 font-bold">{m.nome}</td>
                            <td className="p-3 font-mono">{new Date(m.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                            <td className="p-3">{m.celular_principal || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {relatorioSubTab === 'completa' && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 text-lg print:hidden">Relatório de Lista Completa de Membros</h3>
                <div className="overflow-x-auto border rounded-xl print:border-none">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b text-slate-600 print:bg-slate-200">
                      <tr>
                        <th className="p-2">Nome</th>
                        <th className="p-2">Tipo</th>
                        <th className="p-2">CPF</th>
                        <th className="p-2">RG</th>
                        <th className="p-2">Estado Civil</th>
                        <th className="p-2">Celular</th>
                        <th className="p-2">E-mail</th>
                        <th className="p-2">Endereço</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-700">
                      {members.map((m: any) => (
                        <tr key={m.id} className="hover:bg-slate-50">
                          <td className="p-2 font-bold">{m.nome}</td>
                          <td className="p-2">{m.tipo_cadastro}</td>
                          <td className="p-2 font-mono">{m.cpf || '-'}</td>
                          <td className="p-2 font-mono">{m.rg || '-'}</td>
                          <td className="p-2">{m.estado_civil || '-'}</td>
                          <td className="p-2">{m.celular_principal || '-'}</td>
                          <td className="p-2">{m.email || '-'}</td>
                          <td className="p-2">{m.endereco || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- ABA AGENDA COM EDIÇÃO E INDICADOR DE STATUS --- */}
        {activeTab === 'agenda' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 print:border-none print:shadow-none print:p-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 print:hidden">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">📅 Agenda de Compromissos e Visitas</h2>
                <p className="text-xs text-slate-500">Clique em qualquer compromisso para alterar dados, relatórios ou status.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button onClick={() => setAgendaSubTab('lista')} className={`px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${agendaSubTab === 'lista' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-white'}`}>Lista</button>
                  <button onClick={() => setAgendaSubTab('calendario')} className={`px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${agendaSubTab === 'calendario' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-white'}`}>🗓️ Calendário</button>
                  <button onClick={() => setAgendaSubTab('impressao')} className={`px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${agendaSubTab === 'impressao' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-white'}`}>🖨️ Relatório A4</button>
                </div>
                <button onClick={handleOpenNewAgenda} className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-sm cursor-pointer whitespace-nowrap">+ Novo Compromisso</button>
              </div>
            </div>

            <div className="hidden print:block text-center mb-6 pb-4 border-b-2 border-slate-800">
              <h1 className="text-2xl font-black text-slate-900">BRSYSTEM — {loggedUser?.igrejas?.nome_fantasia || 'Igreja'}</h1>
              <p className="text-sm font-bold text-slate-600 uppercase tracking-widest mt-1">Relatório de Compromissos e Visitas por Ordem de Data e Hora</p>
            </div>

            {agendaSubTab === 'lista' && (
              <div>
                {loadingAgenda ? (
                  <p className="text-center py-6 text-slate-500">Carregando agenda...</p>
                ) : compromissos.length === 0 ? (
                  <p className="text-center py-6 text-slate-400">Nenhum compromisso agendado para esta igreja.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {compromissos.map((c: any) => (
                      <div 
                        key={c.id} 
                        onClick={() => handleOpenEditAgenda(c)}
                        className={`p-5 border rounded-2xl shadow-sm space-y-3 cursor-pointer hover:shadow-md transition-all bg-white ${c.status === 'Cumprido' ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200'}`}
                      >
                        <div className="flex justify-between items-start border-b pb-2">
                          <h4 className="font-bold text-blue-900 text-base">{c.titulo}</h4>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${c.status === 'Cumprido' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {c.status || 'Pendente'}
                          </span>
                        </div>
                        
                        <div className="text-xs text-slate-600 space-y-1 pt-1 font-semibold">
                          <div>🗓️ Data: <span className="font-mono text-blue-900 font-bold">{c.data_compromisso}</span></div>
                          <div>⏰ Horário: <span className="font-mono text-slate-700">{c.hora_compromisso || '00:00'} {c.hora_fim ? `às ${c.hora_fim}` : ''}</span></div>
                          <div>👤 Membro: <span className="text-blue-800 font-bold">{c.responsavel || 'Não vinculado'}</span></div>
                        </div>

                        <div className="pt-2 border-t text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <strong className="text-slate-900 block mb-1">💬 Relatório / Comentário:</strong>
                          <p className="text-slate-600 italic">{c.descricao || 'Nenhum comentário registrado. Clique para editar.'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {agendaSubTab === 'calendario' && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between">
                  <h3 className="font-bold text-blue-950 text-base">🗓️ Calendário de Compromissos (Visão Mensal)</h3>
                  <span className="text-xs font-bold bg-blue-200 text-blue-900 px-3 py-1 rounded-xl">Total: {compromissos.length} agendados</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                  {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((dia) => (
                    <div key={dia} className="p-3 bg-slate-100 text-slate-700 font-bold text-center text-xs rounded-xl">{dia}</div>
                  ))}
                  
                  <div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                    {compromissos.map((c: any) => (
                      <div key={c.id} onClick={() => handleOpenEditAgenda(c)} className={`p-4 border rounded-2xl bg-white shadow-xs space-y-2 cursor-pointer hover:border-blue-900 transition-all border-l-4 ${c.status === 'Cumprido' ? 'border-l-emerald-600' : 'border-l-blue-900'}`}>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-mono font-bold bg-blue-50 text-blue-900 px-2 py-0.5 rounded">{c.data_compromisso}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${c.status === 'Cumprido' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{c.status || 'Pendente'}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm">{c.titulo}</h4>
                        <p className="text-xs text-slate-600">👤 {c.responsavel || 'Sem vínculo'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {agendaSubTab === 'impressao' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center print:hidden">
                  <h3 className="font-bold text-slate-800 text-lg">Visualização para Impressão (Ordem de Data e Hora)</h3>
                  <button onClick={handlePrint} className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1">🖨️ Imprimir Agenda A4</button>
                </div>

                <div className="overflow-x-auto border rounded-xl print:border-none">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b text-slate-600 print:bg-slate-200">
                      <tr>
                        <th className="p-3">Data</th>
                        <th className="p-3">Horário</th>
                        <th className="p-3">Assunto</th>
                        <th className="p-3">Membro</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Relatório / Comentário</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-700">
                      {compromissos.map((c: any) => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono font-bold">{c.data_compromisso}</td>
                          <td className="p-3 font-mono">{c.hora_compromisso} {c.hora_fim ? `- ${c.hora_fim}` : ''}</td>
                          <td className="p-3 font-bold text-slate-900">{c.titulo}</td>
                          <td className="p-3">{c.responsavel || '-'}</td>
                          <td className="p-3 font-semibold">{c.status || 'Pendente'}</td>
                          <td className="p-3 italic text-slate-600">{c.descricao || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'financeiro' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-2xl font-black text-blue-900">Módulo Financeiro Ativo</h2>
              <p className="text-sm text-slate-500 mt-1">Igreja ID: {loggedUser?.codigo_igreja || 'IGR-001'}</p>
            </div>
            {loadingFinanceiro ? (
              <div className="bg-white p-12 rounded-2xl text-center shadow-sm">
                <p className="text-slate-600 font-bold">Carregando dados financeiros...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Contas Cadastradas ({contas.length})</h3>
                  {contas.length === 0 ? (
                    <p className="text-sm text-slate-400">Nenhuma conta encontrada no banco.</p>
                  ) : (
                    <ul className="space-y-2">
                      {contas.map((c: any) => (
                        <li key={c.id} className="p-3 bg-slate-50 rounded-xl border flex justify-between items-center">
                          <span className="font-bold text-sm text-slate-700">{c.nome_conta}</span>
                          <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">{c.codigo_conta}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Últimos Lançamentos ({lancamentos.length})</h3>
                  {lancamentos.length === 0 ? (
                    <p className="text-sm text-slate-400">Nenhum lançamento encontrado.</p>
                  ) : (
                    <ul className="space-y-2">
                      {lancamentos.slice(0, 5).map((l: any) => (
                        <li key={l.id} className="p-3 bg-slate-50 rounded-xl border flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-slate-700">{l.descricao || 'Sem descrição'}</p>
                            <span className="text-slate-400">{l.data_lancamento}</span>
                          </div>
                          <span className={`font-bold text-sm ${l.tipo === 'entrada' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {l.tipo === 'entrada' ? '+' : '-'} R$ {parseFloat(l.valor || 0).toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL DE CADASTRO / EDIÇÃO DE COMPROMISSO NA AGENDA */}
      {showAgendaModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-lg font-black text-blue-900">
                {editingCompromisso ? 'Alterar Compromisso / Visita' : 'Novo Compromisso / Visita'}
              </h3>
              <button onClick={() => setShowAgendaModal(false)} className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer">✕ Fechar</button>
            </div>

            <form onSubmit={handleSaveAgenda} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 ml-1">Assunto / Título *</label>
                <input type="text" required value={formAgendaTitulo} onChange={(e) => setFormAgendaTitulo(e.target.value)} placeholder="Ex: Visita pastoral ou Reunião" className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 ml-1">Vincular Membro (Opcional - Busca do Cadastro)</label>
                <select value={formAgendaMembroId} onChange={(e) => setFormAgendaMembroId(e.target.value)} className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900 bg-white">
                  <option value="">Selecione um membro cadastrado...</option>
                  {members.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.nome} ({m.tipo_cadastro})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 ml-1">Data *</label>
                <input type="date" required value={formAgendaData} onChange={(e) => setFormAgendaData(e.target.value)} className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 ml-1">Horário Inicial</label>
                  <input type="time" value={formAgendaHoraInicio} onChange={(e) => setFormAgendaHoraInicio(e.target.value)} className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 ml-1">Horário Final</label>
                  <input type="time" value={formAgendaHoraFim} onChange={(e) => setFormAgendaHoraFim(e.target.value)} className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 ml-1">Status do Compromisso</label>
                <select value={formAgendaStatus} onChange={(e) => setFormAgendaStatus(e.target.value)} className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900 bg-white font-bold text-slate-700">
                  <option value="Pendente">Pendente</option>
                  <option value="Cumprido">Cumprido</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 ml-1">Comentário / Relatório de como foi</label>
                <textarea rows={3} value={formAgendaComentario} onChange={(e) => setFormAgendaComentario(e.target.value)} placeholder="Registre os detalhes, observações ou como foi a visita..." className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowAgendaModal(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer">
                  {editingCompromisso ? 'Salvar Alterações' : 'Salvar Compromisso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE MEMBRO */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="text-lg font-black text-blue-900">
                  {editingMember ? 'Alterar Cadastro de Membro' : 'Novo Cadastro de Membro'}
                </h3>
                <p className="text-xs text-slate-400">Etapa {formStep} de 2 — {formStep === 1 ? 'Dados Principais & Foto' : 'Documentos & Contato'}</p>
              </div>
              <button onClick={() => setShowMemberModal(false)} className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer">✕ Fechar</button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-4">
              {formStep === 1 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border">
                    <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border shrink-0">
                      {formFotoUrl ? (
                        <img src={formFotoUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-slate-400">Foto</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-bold text-slate-600 ml-1">URL da Foto do Membro</label>
                      <input type="url" value={formFotoUrl} onChange={(e) => setFormFotoUrl(e.target.value)} placeholder="https://exemplo.com/foto.jpg" className="w-full rounded-xl border p-2.5 text-sm mt-1 focus:outline-none focus:border-blue-900" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 ml-1">Nome Completo *</label>
                    <input type="text" required value={formNome} onChange={(e) => setFormNome(e.target.value)} placeholder="Nome do membro" className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 ml-1">Tipo de Cadastro</label>
                      <select value={formTipo} onChange={(e) => setFormTipo(e.target.value)} className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900 bg-white">
                        <option value="Membro">Membro</option>
                        <option value="Congregado">Congregado</option>
                        <option value="Visitante">Visitante</option>
                        <option value="Liderança">Liderança</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 ml-1">Estado Civil</label>
                      <select value={formEstadoCivil} onChange={(e) => setFormEstadoCivil(e.target.value)} className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900 bg-white">
                        <option value="Solteiro(a)">Solteiro(a)</option>
                        <option value="Casado(a)">Casado(a)</option>
                        <option value="Divorciado(a)">Divorciado(a)</option>
                        <option value="Viúvo(a)">Viúvo(a)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <button type="button" onClick={() => setFormStep(2)} className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl cursor-pointer">Avançar para Próxima Tela ➔</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 ml-1">CPF</label>
                      <input type="text" value={formCpf} onChange={(e) => setFormCpf(e.target.value)} placeholder="000.000.000-00" className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 ml-1">RG</label>
                      <input type="text" value={formRg} onChange={(e) => setFormRg(e.target.value)} placeholder="00.000.000-0" className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 ml-1">Data de Nascimento</label>
                      <input type="date" value={formNascimento} onChange={(e) => setFormNascimento(e.target.value)} className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 ml-1">Celular Principal</label>
                      <input type="text" value={formCelular} onChange={(e) => setFormCelular(e.target.value)} placeholder="(00) 00000-0000" className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 ml-1">E-mail</label>
                      <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@exemplo.com" className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 ml-1">Endereço Residencial</label>
                    <input type="text" value={formEndereco} onChange={(e) => setFormEndereco(e.target.value)} placeholder="Rua, número, bairro" className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900" />
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <button type="button" onClick={() => setFormStep(1)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl cursor-pointer">← Voltar</button>
                    <button type="submit" className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer">
                      {editingMember ? 'Salvar Alterações' : 'Cadastrar Membro'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}