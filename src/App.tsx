import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedUser, setLoggedUser] = useState<any>(null);
  
  const [activeTab, setActiveTab] = useState<'membros' | 'usuarios' | 'fornecedores' | 'relatorios' | 'agenda' | 'celulas' | 'financeiro' | 'igreja'>('relatorios');
  const [openDropdown, setOpenDropdown] = useState<'cadastros' | 'controle' | null>(null);

  const [relatorioSubTab, setRelatorioSubTab] = useState<'geral' | 'aniversariantes_dia' | 'aniversariantes_mes' | 'completa'>('geral');
  const [agendaSubTab, setAgendaSubTab] = useState<'lista' | 'calendario' | 'impressao'>('lista');
  const [financeiroSubTab, setFinanceiroSubTab] = useState<'extrato' | 'contas' | 'relatorio'>('extrato');
  
  const [celulasSubTab, setCelulasSubTab] = useState<'lista' | 'relatorio_simples' | 'relatorio_completo' | 'relatorio_arvore'>('lista');

  const [loginCodigo, setLoginCodigo] = useState('IGR-001');
  const [loginUsuario, setLoginUsuario] = useState('');
  const [loginSenha, setLoginSenha] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [members, setMembers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingMembros, setLoadingMembros] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [memberModalTab, setMemberModalTab] = useState<'dados' | 'financeiro'>('dados');
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [retornarParaTab, setRetornarParaTab] = useState<string | null>(null);

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

  const [usuariosList, setUsuariosList] = useState<any[]>([]);
  const [fornecedoresList, setFornecedoresList] = useState<any[]>([]);

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

  const [celulasList, setCelulasList] = useState<any[]>([]);
  const [loadingCelulas, setLoadingCelulas] = useState(false);
  const [showCelulaModal, setShowCelulaModal] = useState(false);
  const [editingCelula, setEditingCelula] = useState<any>(null);

  const [formCelNome, setFormCelNome] = useState('');
  const [formCelLider, setFormCelLider] = useState('');
  const [formCelVice, setFormCelVice] = useState('');
  const [formCelAnfitriao, setFormCelAnfitriao] = useState('');
  const [formCelDia, setFormCelDia] = useState('Quarta-feira');
  const [formCelHora, setFormCelHora] = useState('19:30');
  const [formCelCep, setFormCelCep] = useState('');
  const [formCelRua, setFormCelRua] = useState('');
  const [formCelNumero, setFormCelNumero] = useState('');
  const [formCelBairro, setFormCelBairro] = useState('');
  const [formCelCidade, setFormCelCidade] = useState('');
  const [formCelParticipantes, setFormCelParticipantes] = useState<string[]>([]);
  const [formCelNovoParticipante, setFormCelNovoParticipante] = useState('');

  const [setoresList, setSetoresList] = useState<any[]>([]);
  const [showSetorModal, setShowSetorModal] = useState(false);
  const [formSetorNome, setFormSetorNome] = useState('');
  const [formSetorLider, setFormSetorLider] = useState('');

  const [redesList, setRedesList] = useState<any[]>([]);
  const [showRedeModal, setShowRedeModal] = useState(false);
  const [formRedeNome, setFormRedeNome] = useState('');
  const [formRedeLider, setFormRedeLider] = useState('');

  const [contasFinanceiras, setContasFinanceiras] = useState<any[]>([]);
  const [lancamentosCorrente, setLancamentosCorrente] = useState<any[]>([]);
  const [loadingFinanceiro, setLoadingFinanceiro] = useState(false);
  const [showLancamentoModal, setShowLancamentoModal] = useState(false);
  const [showContaModal, setShowContaModal] = useState(false);

  const [formLancData, setFormLancData] = useState('');
  const [formLancTipo, setFormLancTipo] = useState<'debito' | 'credito'>('credito');
  const [formLancValor, setFormLancValor] = useState('');
  const [formLancContaId, setFormLancContaId] = useState('');
  const [formLancObs, setFormLancObs] = useState('');

  const [formNomeConta, setFormNomeConta] = useState('');
  const [formTipoConta, setFormTipoConta] = useState('Caixa Geral');

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
      setLoggedUser(data); 
      setIsLoggedIn(true);
    } catch (err: any) { alert('Erro no login: ' + err.message); } finally { setLoginLoading(false); }
  };

  const carregarAgenda = async (cod: string) => {
    setLoadingAgenda(true);
    const { data } = await supabase.from('agenda_compromissos').select('*').eq('codigo_igreja', cod).order('data_compromisso', { ascending: true });
    setCompromissos(data || []);
    setLoadingAgenda(false);
  };

  const carregarCelulas = async (cod: string) => {
    setLoadingCelulas(true);
    const { data } = await supabase.from('celulas').select('*').eq('codigo_igreja', cod).order('nome', { ascending: true });
    setCelulasList(data || []);
    setLoadingCelulas(false);
  };

  const carregarSetores = async (cod: string) => {
    const { data } = await supabase.from('setores').select('*').eq('codigo_igreja', cod).order('nome', { ascending: true });
    setSetoresList(data || []);
  };

  const carregarRedes = async (cod: string) => {
    const { data } = await supabase.from('redes').select('*').eq('codigo_igreja', cod).order('nome', { ascending: true });
    setRedesList(data || []);
  };

  const carregarFinanceiro = async (cod: string) => {
    setLoadingFinanceiro(true);
    try {
      const { data: cData } = await supabase.from('contas_financeiras').select('*').eq('codigo_igreja', cod);
      const { data: lData, error } = await supabase.from('lancamentos_financeiros').select('*').eq('codigo_igreja', cod).order('data_lancamento', { ascending: true });
      if (error) console.error('Erro ao buscar lançamentos:', error.message);
      setContasFinanceiras(cData || []);
      setLancamentosCorrente(lData || []);
    } catch (err: any) {
      console.error('Erro geral:', err);
    } finally {
      setLoadingFinanceiro(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn || !loggedUser?.codigo_igreja) return;
    const cod = loggedUser.codigo_igreja;
    
    async function carregarDados() {
      setLoadingMembros(true);
      const { data: mData } = await supabase.from('members').select('*').eq('codigo_igreja', cod);
      setMembers(mData || []);
      setLoadingMembros(false);

      const { data: uData } = await supabase.from('usuarios').select('*').eq('codigo_igreja', cod);
      setUsuariosList(uData || []);

      const { data: fData } = await supabase.from('fornecedores').select('*').eq('codigo_igreja', cod);
      setFornecedoresList(fData || []);

      carregarAgenda(cod);
      carregarCelulas(cod);
      carregarSetores(cod);
      carregarRedes(cod);
      carregarFinanceiro(cod);
    }
    carregarDados();
  }, [isLoggedIn, loggedUser]);

  const handleBuscarCep = async () => {
    const cepLimpo = formCelCep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      alert('Digite um CEP válido com 8 dígitos.');
      return;
    }
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      if (data.erro) {
        alert('CEP não encontrado.');
        return;
      }
      setFormCelRua(data.logradouro || '');
      setFormCelBairro(data.bairro || '');
      setFormCelCidade(data.localidade || '');
    } catch (err) {
      alert('Erro ao buscar o CEP.');
    }
  };

  const handleOpenEditMemberFromContext = (mId: string, origemTab: string) => {
    const m = members.find(item => String(item.id) === String(mId));
    if (!m) return;
    setRetornarParaTab(origemTab);
    handleOpenEditMember(m);
  };

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
    setMemberModalTab('dados');
    setRetornarParaTab(null);
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
    setMemberModalTab('dados');
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
      if (editingMember && editingMember.id) {
        const { error } = await supabase.from('members').update(payload).eq('id', editingMember.id);
        if (error) throw error;
        alert('Membro atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('members').insert([payload]);
        if (error) throw error;
        alert('Membro cadastrado com sucesso!');
      }

      const { data } = await supabase.from('members').select('*').eq('codigo_igreja', loggedUser.codigo_igreja);
      setMembers(data || []);

      const destino = retornarParaTab;
      setShowMemberModal(false);
      setRetornarParaTab(null);
      if (destino) {
        setActiveTab(destino as any);
      }
    } catch (err: any) {
      alert('Erro ao salvar membro: ' + err.message);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    const motivo = prompt('Informe o motivo da exclusão deste membro:');
    if (!motivo) return;

    const senhaInformada = prompt('Digite a senha de administrador para confirmar a exclusão:');
    if (senhaInformada !== loggedUser?.senha) {
      alert('Senha incorreta. Exclusão cancelada.');
      return;
    }

    try {
      const { error } = await supabase.from('members').delete().eq('id', memberId);
      if (error) throw error;
      
      alert(`Membro excluído com sucesso! Motivo registrado: "${motivo}"`);
      setShowMemberModal(false);
      
      const { data } = await supabase.from('members').select('*').eq('codigo_igreja', loggedUser.codigo_igreja);
      setMembers(data || []);
    } catch (err: any) {
      alert('Erro ao excluir membro: ' + err.message);
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
    setFormAgendaMembroId(c.responsavel || ''); 
    
    const comentarioLimpo = c.descricao ? (c.descricao.includes('—') ? c.descricao.split('—').pop()?.trim() : c.descricao) : '';
    setFormAgendaComentario(comentarioLimpo);
    
    setShowAgendaModal(true);
  };

  const handleSaveAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAgendaTitulo.trim() || !formAgendaData.trim()) {
      alert('Preencha pelo menos o Título e a Data do compromisso.');
      return;
    }
  
    const comentarioLimpo = formAgendaComentario.trim();
  
    const payload: any = {
      codigo_igreja: loggedUser.codigo_igreja,
      titulo: formAgendaTitulo.trim(),
      data_compromisso: formAgendaData,
      hora_compromisso: formAgendaHoraInicio || '00:00',
      hora_fim: formAgendaHoraFim || '00:00',
      responsavel: formAgendaMembroId || null, 
      descricao: comentarioLimpo
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
      alert('Erro ao salvar: ' + err.message); 
    }
  };

  const handleDeleteAgenda = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este compromisso?')) return;
    try {
      const { error } = await supabase.from('agenda_compromissos').delete().eq('id', id);
      if (error) throw error;
      alert('Compromisso excluído com sucesso!');
      setShowAgendaModal(false);
      carregarAgenda(loggedUser.codigo_igreja);
    } catch (err: any) {
      alert('Erro ao excluir compromisso: ' + err.message);
    }
  };

  const handleOpenNewCelula = () => {
    setEditingCelula(null);
    setFormCelNome('');
    setFormCelLider('');
    setFormCelVice('');
    setFormCelAnfitriao('');
    setFormCelDia('Quarta-feira');
    setFormCelHora('19:30');
    setFormCelCep('');
    setFormCelRua('');
    setFormCelNumero('');
    setFormCelBairro('');
    setFormCelCidade('');
    setFormCelParticipantes([]);
    setFormCelNovoParticipante('');
    setShowCelulaModal(true);
  };

  const handleOpenEditCelula = (c: any) => {
    setEditingCelula(c);
    setFormCelNome(c.nome || '');
    setFormCelLider(c.lider_id || '');
    setFormCelVice(c.vice_id || '');
    setFormCelAnfitriao(c.anfitriao_id || '');
    setFormCelDia(c.dia_semana || 'Quarta-feira');
    setFormCelHora(c.horario || '19:30');
    setFormCelCep(c.cep || '');
    setFormCelRua(c.rua || '');
    setFormCelNumero(c.numero || '');
    setFormCelBairro(c.bairro || '');
    setFormCelCidade(c.cidade || '');
    setFormCelParticipantes(Array.isArray(c.participantes) ? c.participantes : []);
    setFormCelNovoParticipante('');
    setShowCelulaModal(true);
  };

  const handleAddParticipante = () => {
    if (!formCelNovoParticipante) return;
    
    if (formCelNovoParticipante === formCelLider || formCelNovoParticipante === formCelVice || formCelNovoParticipante === formCelAnfitriao) {
      alert('Já relacionado com função, insira outro novo.');
      return;
    }

    if (formCelParticipantes.includes(formCelNovoParticipante)) {
      alert('Este membro já está adicionado na célula.');
      return;
    }

    setFormCelParticipantes([...formCelParticipantes, formCelNovoParticipante]);
    setFormCelNovoParticipante('');
  };

  const handleRemoveParticipante = (membroId: string) => {
    setFormCelParticipantes(formCelParticipantes.filter(id => id !== membroId));
  };

  const handleSaveCelula = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCelNome.trim()) {
      alert('O nome da célula é obrigatório.');
      return;
    }

    const enderecoCompleto = `${formCelRua}, ${formCelNumero || 'S/N'} - ${formCelBairro}, ${formCelCidade} (CEP: ${formCelCep})`;

    const payload = {
      codigo_igreja: loggedUser.codigo_igreja,
      nome: formCelNome.trim(),
      lider_id: formCelLider || null,
      vice_id: formCelVice || null,
      anfitriao_id: formCelAnfitriao || null,
      dia_semana: formCelDia,
      horario: formCelHora,
      cep: formCelCep.trim(),
      rua: formCelRua.trim(),
      numero: formCelNumero.trim(),
      bairro: formCelBairro.trim(),
      cidade: formCelCidade.trim(),
      endereco: enderecoCompleto,
      participantes: formCelParticipantes
    };

    try {
      if (editingCelula) {
        const { error } = await supabase.from('celulas').update(payload).eq('id', editingCelula.id);
        if (error) throw error;
        alert('Célula atualizada com sucesso!');
      } else {
        const { error } = await supabase.from('celulas').insert([payload]);
        if (error) throw error;
        alert('Célula cadastrada com sucesso!');
      }
      setShowCelulaModal(false);
      carregarCelulas(loggedUser.codigo_igreja);
    } catch (err: any) {
      alert('Erro ao salvar célula: ' + err.message);
    }
  };

  const handleDeleteCelula = async (celulaId: string) => {
    const senhaInformada = prompt('Digite a senha de administrador para excluir esta célula:');
    if (!senhaInformada) return;

    if (senhaInformada !== loggedUser.senha) {
      alert('Senha de administrador incorreta. Exclusão cancelada.');
      return;
    }

    try {
      const { error } = await supabase.from('celulas').delete().eq('id', celulaId);
      if (error) throw error;
      alert('Célula excluída com sucesso!');
      setShowCelulaModal(false);
      carregarCelulas(loggedUser.codigo_igreja);
    } catch (err: any) {
      alert('Erro ao excluir célula: ' + err.message);
    }
  };

  const handleSaveSetor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSetorNome.trim()) { alert('Informe o nome do setor.'); return; }
    const payload = {
      codigo_igreja: loggedUser.codigo_igreja,
      nome: formSetorNome.trim(),
      lider_id: formSetorLider ? formSetorLider : null
    };
    try {
      const { error } = await supabase.from('setores').insert([payload]);
      if (error) throw error;
      alert('Setor cadastrado com sucesso!');
      setShowSetorModal(false);
      setFormSetorNome('');
      setFormSetorLider('');
      carregarSetores(loggedUser.codigo_igreja);
    } catch (err: any) {
      alert('Erro ao salvar setor: ' + err.message);
    }
  };

  const handleSaveRede = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRedeNome.trim()) { alert('Informe o nome da rede.'); return; }
    const payload = {
      codigo_igreja: loggedUser.codigo_igreja,
      nome: formRedeNome.trim(),
      lider_id: formRedeLider ? formRedeLider : null
    };
    try {
      const { error } = await supabase.from('redes').insert([payload]);
      if (error) throw error;
      alert('Rede cadastrada com sucesso!');
      setShowRedeModal(false);
      setFormRedeNome('');
      setFormRedeLider('');
      carregarRedes(loggedUser.codigo_igreja);
    } catch (err: any) {
      alert('Erro ao salvar rede: ' + err.message);
    }
  };

  const handleSaveConta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNomeConta.trim()) { alert('Informe o nome da conta.'); return; }
    const payload = {
      codigo_igreja: loggedUser.codigo_igreja,
      nome_conta: formNomeConta.trim(),
      codigo_conta: formTipoConta
    };
    try {
      const { error } = await supabase.from('contas_financeiras').insert([payload]);
      if (error) throw error;
      alert('Conta cadastrada com sucesso!');
      setShowContaModal(false);
      setFormNomeConta('');
      carregarFinanceiro(loggedUser.codigo_igreja);
    } catch (err: any) {
      alert('Erro ao cadastrar conta: ' + err.message);
    }
  };

  const handleSaveLancamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLancData || !formLancValor) {
      alert('Preencha a data e o valor do lançamento.');
      return;
    }

    const payload = {
      codigo_igreja: loggedUser.codigo_igreja,
      data_lancamento: formLancData,
      tipo: formLancTipo === 'credito' ? 'entrada' : 'saida',
      valor: parseFloat(formLancValor),
      conta_id: formLancContaId || null,
      membro_id: editingMember ? editingMember.id : null,
      descricao: formLancObs.trim() || 'Lançamento financeiro'
    };

    try {
      const { error } = await supabase.from('lancamentos_financeiros').insert([payload]);
      if (error) throw error;
      alert('Lançamento salvo com sucesso!');
      setShowLancamentoModal(false);
      setFormLancData('');
      setFormLancValor('');
      setFormLancObs('');
      setFormLancContaId('');
      carregarFinanceiro(loggedUser.codigo_igreja);
    } catch (err: any) {
      alert('Erro ao salvar lançamento: ' + err.message);
    }
  };

  const handleDeleteLancamento = async (lancamentoId: any) => {
    const senhaInformada = prompt('Digite a senha de administrador para excluir este lançamento:');
    if (!senhaInformada) return;

    if (senhaInformada !== loggedUser.senha) {
      alert('Senha de administrador incorreta. Exclusão cancelada.');
      return;
    }

    try {
      const { error } = await supabase.from('lancamentos_financeiros').delete().eq('id', lancamentoId);
      if (error) throw error;
      alert('Lançamento excluído com sucesso!');
      carregarFinanceiro(loggedUser.codigo_igreja);
    } catch (err: any) {
      alert('Erro ao excluir lançamento: ' + err.message);
    }
  };

  const handleAnexarComprovante = async (lancamentoId: any, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const { error } = await supabase.from('lancamentos_financeiros').update({ comprovante_url: base64Data }).eq('id', lancamentoId);
        if (error) throw error;
        alert('Comprovante anexado com sucesso!');
        carregarFinanceiro(loggedUser.codigo_igreja);
      };
    } catch (err: any) {
      alert('Erro ao anexar comprovante: ' + err.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredMembers = members.filter((m) => !searchTerm || m.nome?.toLowerCase().includes(searchTerm.toLowerCase()));

  let saldoAcumulado = 0;
  const lancamentosComSaldo = lancamentosCorrente.map((l: any) => {
    const valor = parseFloat(l.valor || 0);
    const isCredito = l.tipo === 'entrada';
    if (isCredito) {
      saldoAcumulado += valor;
    } else {
      saldoAcumulado -= valor;
    }
    return {
      ...l,
      isCredito,
      valorNum: valor,
      saldoAtual: saldoAcumulado
    };
  });

  const saldoFinalRelatorio = lancamentosComSaldo.length > 0 
    ? lancamentosComSaldo[lancamentosComSaldo.length - 1].saldoAtual 
    : 0;

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
    <div className="min-h-screen bg-slate-100 flex flex-col relative overflow-x-hidden">
      {/* Marca D'água Otimizada (Centralizada, proporcional e suave) */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0 opacity-4 overflow-hidden select-none">
        <span className="text-[10vw] font-black uppercase tracking-widest text-center text-blue-900 px-4 whitespace-nowrap">
          {loggedUser?.igrejas?.nome_fantasia || 'BRSYSTEM'}
        </span>
      </div>

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

              <button onClick={() => { setActiveTab('celulas'); setOpenDropdown(null); }} className={`cursor-pointer flex items-center gap-1 transition-all ${activeTab === 'celulas' ? 'text-blue-900 font-black' : 'hover:text-blue-900'}`}>
                Células / Redes
              </button>
              
              <button onClick={() => { setActiveTab('agenda'); setOpenDropdown(null); }} className={`cursor-pointer flex items-center gap-1 transition-all ${activeTab === 'agenda' ? 'text-blue-900 font-black' : 'hover:text-blue-900'}`}>
                Agenda <span className="text-xs text-slate-400">∨</span>
              </button>

              <button onClick={() => { setActiveTab('financeiro'); setOpenDropdown(null); }} className={`cursor-pointer flex items-center gap-1 transition-all ${activeTab === 'financeiro' ? 'text-blue-900 font-black' : 'hover:text-blue-900'}`}>
                Financeiro
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

      <main className="max-w-7xl w-full mx-auto p-6 flex-1 relative z-10 print:p-0 print:max-w-none">
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

        {activeTab === 'celulas' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 print:border-none print:shadow-none print:p-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 print:hidden">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">🌱 Células, Setores e Redes</h2>
                <p className="text-xs text-slate-500">Gerenciamento completo de células, setores, redes e relatórios.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex bg-slate-100 p-1 rounded-xl flex-wrap">
                  <button onClick={() => setCelulasSubTab('lista')} className={`px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${celulasSubTab === 'lista' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-white'}`}>Células</button>
                  <button onClick={() => setCelulasSubTab('relatorio_simples')} className={`px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${celulasSubTab === 'relatorio_simples' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-white'}`}>Rel. Simples</button>
                  <button onClick={() => setCelulasSubTab('relatorio_completo')} className={`px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${celulasSubTab === 'relatorio_completo' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-white'}`}>Rel. Completo</button>
                  <button onClick={() => setCelulasSubTab('relatorio_arvore')} className={`px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${celulasSubTab === 'relatorio_arvore' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-white'}`}>🌳 Árvore</button>
                </div>
                <button onClick={handleOpenNewCelula} className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-sm cursor-pointer whitespace-nowrap">+ Nova Célula</button>
                <button onClick={() => setShowSetorModal(true)} className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm cursor-pointer whitespace-nowrap">+ Novo Setor</button>
                <button onClick={() => setShowRedeModal(true)} className="px-4 py-2 bg-indigo-800 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-sm cursor-pointer whitespace-nowrap">+ Nova Rede</button>
              </div>
            </div>

            <div className="hidden print:block text-center mb-6 pb-4 border-b-2 border-slate-800">
              <h1 className="text-2xl font-black text-slate-900">BRSYSTEM — {loggedUser?.igrejas?.nome_fantasia || 'Igreja'}</h1>
              <p className="text-sm font-bold text-slate-600 uppercase tracking-widest mt-1">
                {celulasSubTab === 'relatorio_simples' ? 'Relatório Simples de Células' : celulasSubTab === 'relatorio_completo' ? 'Relatório Completo de Células' : 'Relatório Árvore (Ordem Alfabética)'}
              </p>
            </div>

            {celulasSubTab === 'lista' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base mb-3 flex items-center justify-between">
                      <span>📁 Setores Cadastrados ({setoresList.length})</span>
                    </h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {setoresList.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Nenhum setor cadastrado.</p>
                      ) : (
                        setoresList.map((s: any) => {
                          const liderObj = members.find((m: any) => String(m.id) === String(s.lider_id));
                          return (
                            <div key={s.id} className="p-3 bg-white border rounded-xl shadow-2xs flex justify-between items-center text-xs">
                              <div>
                                <span className="font-bold text-slate-900 text-sm block">{s.nome}</span>
                                <span className="text-slate-500">Líder: <strong className="text-slate-700">{liderObj ? liderObj.nome : 'Não informado'}</strong></span>
                              </div>
                              {liderObj && (
                                <button onClick={() => handleOpenEditMemberFromContext(liderObj.id, 'celulas')} className="px-2.5 py-1 bg-blue-50 text-blue-800 font-bold rounded-lg hover:bg-blue-100 cursor-pointer">Ver Membro</button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-800 text-base mb-3 flex items-center justify-between">
                      <span>🌐 Redes Cadastradas ({redesList.length})</span>
                    </h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {redesList.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Nenhuma rede cadastrada.</p>
                      ) : (
                        redesList.map((r: any) => {
                          const liderObj = members.find((m: any) => String(m.id) === String(r.lider_id));
                          return (
                            <div key={r.id} className="p-3 bg-white border rounded-xl shadow-2xs flex justify-between items-center text-xs">
                              <div>
                                <span className="font-bold text-slate-900 text-sm block">{r.nome}</span>
                                <span className="text-slate-500">Líder: <strong className="text-slate-700">{liderObj ? liderObj.nome : 'Não informado'}</strong></span>
                              </div>
                              {liderObj && (
                                <button onClick={() => handleOpenEditMemberFromContext(liderObj.id, 'celulas')} className="px-2.5 py-1 bg-indigo-50 text-indigo-800 font-bold rounded-lg hover:bg-indigo-100 cursor-pointer">Ver Membro</button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-800 text-lg mb-4">🌱 Células Cadastradas</h3>
                  {loadingCelulas ? (
                    <p className="text-center py-6 text-slate-500">Carregando células...</p>
                  ) : celulasList.length === 0 ? (
                    <p className="text-center py-6 text-slate-400">Nenhuma célula cadastrada.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {celulasList.map((c: any) => {
                        const liderObj = members.find((m: any) => String(m.id) === String(c.lider_id));
                        const viceObj = members.find((m: any) => String(m.id) === String(c.vice_id));
                        const anfitriaoObj = members.find((m: any) => String(m.id) === String(c.anfitriao_id));
                        const totalParticipantes = Array.isArray(c.participantes) ? c.participantes.length : 0;
                        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.endereco || c.rua || '')}`;

                        return (
                          <div key={c.id} className="p-5 border rounded-2xl shadow-sm space-y-3 bg-white border-slate-200 flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start border-b pb-2">
                                <h4 className="font-bold text-blue-900 text-base">{c.nome}</h4>
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-100 text-emerald-800">
                                  {c.dia_semana} às {c.horario}
                                </span>
                              </div>

                              <div className="text-xs text-slate-600 space-y-1.5 font-semibold pt-1">
                                <div className="flex justify-between items-center">
                                  <span>👑 Líder: <span className="text-slate-900 font-bold">{liderObj ? liderObj.nome : 'Não informado'}</span></span>
                                  {liderObj && <button onClick={() => handleOpenEditMemberFromContext(liderObj.id, 'celulas')} className="text-[10px] text-blue-700 underline font-bold cursor-pointer">Ver</button>}
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>🥈 Vice-Líder: <span className="text-slate-900 font-bold">{viceObj ? viceObj.nome : 'Não informado'}</span></span>
                                  {viceObj && <button onClick={() => handleOpenEditMemberFromContext(viceObj.id, 'celulas')} className="text-[10px] text-blue-700 underline font-bold cursor-pointer">Ver</button>}
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>🏠 Anfitrião: <span className="text-slate-900 font-bold">{anfitriaoObj ? anfitriaoObj.nome : 'Não informado'}</span></span>
                                  {anfitriaoObj && <button onClick={() => handleOpenEditMemberFromContext(anfitriaoObj.id, 'celulas')} className="text-[10px] text-blue-700 underline font-bold cursor-pointer">Ver</button>}
                                </div>
                                <div>📍 Endereço: <span className="text-slate-700">{c.endereco || 'Não informado'}</span></div>
                                <div>👥 Participantes: <span className="text-blue-900 font-bold">{totalParticipantes} cadastrados</span></div>
                              </div>
                            </div>

                            <div className="pt-3 border-t flex flex-col gap-2">
                              <a 
                                href={googleMapsUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="w-full text-center py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                              >
                                📍 Abrir Localização no Google Maps
                              </a>
                              <div className="flex gap-2">
                                <button onClick={() => handleOpenEditCelula(c)} className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer">
                                  Editar / Detalhes
                                </button>
                                <button onClick={() => handleDeleteCelula(c.id)} className="px-3 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer" title="Excluir Célula">
                                  Excluir
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {celulasSubTab === 'relatorio_simples' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center print:hidden">
                  <h3 className="font-bold text-slate-800 text-lg">Relatório Simples (Nome, Líder, Anfitrião e Endereço)</h3>
                  <button onClick={handlePrint} className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1">🖨️ Imprimir Relatório</button>
                </div>
                <div className="overflow-x-auto border rounded-xl print:border-none">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b text-slate-600 print:bg-slate-200">
                      <tr>
                        <th className="p-3">Nome da Célula</th>
                        <th className="p-3">Líder</th>
                        <th className="p-3">Anfitrião</th>
                        <th className="p-3">Endereço / Localização</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-700">
                      {celulasList.map((c: any) => {
                        const liderObj = members.find((m: any) => String(m.id) === String(c.lider_id));
                        const anfitriaoObj = members.find((m: any) => String(m.id) === String(c.anfitriao_id));
                        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.endereco || c.rua || '')}`;

                        return (
                          <tr key={c.id} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-900">{c.nome}</td>
                            <td className="p-3">
                              {liderObj ? (
                                <button onClick={() => handleOpenEditMemberFromContext(liderObj.id, 'celulas')} className="text-blue-900 font-bold underline cursor-pointer hover:text-blue-700">
                                  {liderObj.nome} (Líder)
                                </button>
                              ) : '-'}
                            </td>
                            <td className="p-3">
                              {anfitriaoObj ? (
                                <button onClick={() => handleOpenEditMemberFromContext(anfitriaoObj.id, 'celulas')} className="text-blue-900 font-bold underline cursor-pointer hover:text-blue-700">
                                  {anfitriaoObj.nome} (Anfitrião)
                                </button>
                              ) : '-'}
                            </td>
                            <td className="p-3 flex items-center justify-between gap-2">
                              <span>{c.endereco || '-'}</span>
                              <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold rounded text-[10px] whitespace-nowrap print:hidden">
                                📍 Mapa
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {celulasSubTab === 'relatorio_completo' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center print:hidden">
                  <h3 className="font-bold text-slate-800 text-lg">Relatório Completo (Incluindo Vice e Lista de Participantes)</h3>
                  <button onClick={handlePrint} className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1">🖨️ Imprimir Relatório</button>
                </div>
                <div className="space-y-4">
                  {celulasList.map((c: any) => {
                    const liderObj = members.find((m: any) => String(m.id) === String(c.lider_id));
                    const viceObj = members.find((m: any) => String(m.id) === String(c.vice_id));
                    const anfitriaoObj = members.find((m: any) => String(m.id) === String(c.anfitriao_id));
                    const parts = Array.isArray(c.participantes) ? c.participantes : [];
                    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.endereco || c.rua || '')}`;

                    return (
                      <div key={c.id} className="border p-4 rounded-xl space-y-3 bg-white">
                        <div className="flex justify-between border-b pb-2">
                          <h4 className="font-bold text-blue-900 text-base">{c.nome} ({c.dia_semana} às {c.horario})</h4>
                          <span className="text-xs font-mono font-bold text-slate-600">{parts.length} Participantes</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-700">
                          <div>👑 <strong>Líder:</strong> {liderObj ? <button onClick={() => handleOpenEditMemberFromContext(liderObj.id, 'celulas')} className="text-blue-800 underline font-bold cursor-pointer">{liderObj.nome}</button> : 'Não definido'}</div>
                          <div>🥈 <strong>Vice:</strong> {viceObj ? <button onClick={() => handleOpenEditMemberFromContext(viceObj.id, 'celulas')} className="text-blue-800 underline font-bold cursor-pointer">{viceObj.nome}</button> : 'Não definido'}</div>
                          <div>🏠 <strong>Anfitrião:</strong> {anfitriaoObj ? <button onClick={() => handleOpenEditMemberFromContext(anfitriaoObj.id, 'celulas')} className="text-blue-800 underline font-bold cursor-pointer">{anfitriaoObj.nome}</button> : 'Não definido'}</div>
                        </div>
                        <div className="text-xs text-slate-600 flex items-center justify-between">
                          <span>📍 <strong>Endereço:</strong> {c.endereco || 'Not informed'}</span>
                          <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold rounded text-[10px] print:hidden">
                            📍 Abrir no Mapa
                          </a>
                        </div>
                        <div>
                          <strong className="text-xs text-slate-800 block mb-1">👥 Membros Participantes:</strong>
                          {parts.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">Nenhum participante adicionado.</p>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {parts.map((pId: string) => {
                                const mObj = members.find((m: any) => String(m.id) === String(pId));
                                return (
                                  <button key={pId} onClick={() => mObj && handleOpenEditMemberFromContext(mObj.id, 'celulas')} className="px-2.5 py-1 bg-slate-100 hover:bg-blue-100 rounded-md text-xs font-semibold text-slate-700 cursor-pointer">
                                    {mObj ? `${mObj.nome}` : 'Membro ID: ' + pId}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {celulasSubTab === 'relatorio_arvore' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center print:hidden">
                  <h3 className="font-bold text-slate-800 text-lg">🌳 Relatório Árvore (Células em Ordem Alfabética)</h3>
                  <button onClick={handlePrint} className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1">🖨️ Imprimir Relatório Árvore</button>
                </div>
                <div className="space-y-4">
                  {[...celulasList]
                    .sort((a, b) => (a.nome || '').localeCompare(b.nome || ''))
                    .map((c: any) => {
                      const liderObj = members.find((m: any) => String(m.id) === String(c.lider_id));
                      const viceObj = members.find((m: any) => String(m.id) === String(c.vice_id));
                      const anfitriaoObj = members.find((m: any) => String(m.id) === String(c.anfitriao_id));
                      const parts = Array.isArray(c.participantes) ? c.participantes : [];
                      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.endereco || c.rua || '')}`;

                      return (
                        <div key={c.id} className="border-l-4 border-l-emerald-600 bg-white p-4 rounded-xl shadow-xs space-y-2">
                          <div className="flex justify-between items-center border-b pb-1">
                            <h4 className="font-black text-blue-950 text-base">🌱 {c.nome}</h4>
                            <span className="text-xs font-bold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full">{c.dia_semana} — {c.horario}</span>
                          </div>
                          <div className="text-xs text-slate-700 pl-4 space-y-1.5 border-l-2 border-slate-100 ml-2">
                            <div>👑 <strong>Líder:</strong> {liderObj ? <button onClick={() => handleOpenEditMemberFromContext(liderObj.id, 'celulas')} className="text-blue-800 underline font-bold cursor-pointer">{liderObj.nome}</button> : 'Não definido'}</div>
                            <div>🥈 <strong>Vice:</strong> {viceObj ? <button onClick={() => handleOpenEditMemberFromContext(viceObj.id, 'celulas')} className="text-blue-800 underline font-bold cursor-pointer">{viceObj.nome}</button> : 'Não definido'}</div>
                            <div>🏠 <strong>Anfitrião:</strong> {anfitriaoObj ? <button onClick={() => handleOpenEditMemberFromContext(anfitriaoObj.id, 'celulas')} className="text-blue-800 underline font-bold cursor-pointer">{anfitriaoObj.nome}</button> : 'Não definido'}</div>
                            <div className="flex items-center gap-3">
                              <span>📍 <strong>Endereço:</strong> {c.endereco || 'Não informado'}</span>
                              <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold rounded text-[10px] print:hidden">
                                📍 Abrir no Mapa
                              </a>
                            </div>
                            <div>👥 <strong>Participantes ({parts.length}):</strong> {parts.length === 0 ? 'Nenhum' : parts.map((pId: string) => members.find((m: any) => String(m.id) === String(pId))?.nome).filter(Boolean).join(', ')}</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3">
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
                    {compromissos.map((c: any) => {
                      const membroResp = members.find((m: any) => String(m.id) === String(c.responsavel));
                      const comentarioExibicao = c.descricao 
                        ? (c.descricao.includes('—') ? c.descricao.split('—').pop()?.trim() : c.descricao) 
                        : 'Nenhum comentário registrado.';

                      return (
                        <div 
                          key={c.id} 
                          className="p-5 border rounded-2xl shadow-sm space-y-3 bg-white border-slate-200 flex flex-col justify-between"
                        >
                          <div onClick={() => handleOpenEditAgenda(c)} className="cursor-pointer space-y-2">
                            <div className="flex justify-between items-start border-b pb-2">
                              <h4 className="font-bold text-blue-900 text-base">{c.titulo}</h4>
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider bg-blue-100 text-blue-800">
                                Compromisso
                              </span>
                            </div>
                            
                            <div className="text-xs text-slate-600 space-y-1 pt-2 font-semibold">
                              <div>🗓️ Data: <span className="font-mono text-blue-900 font-bold">{c.data_compromisso}</span></div>
                              <div>⏰ Início: <span className="font-mono text-slate-700">{c.hora_compromisso || '00:00'}</span> | Fim: <span className="font-mono text-slate-700">{c.hora_fim || '00:00'}</span></div>
                              <div className="flex justify-between items-center">
                                <span>👤 Responsável: <span className="text-blue-900 font-bold">{membroResp ? membroResp.nome : 'Não vinculado'}</span></span>
                                {membroResp && <button onClick={(e) => { e.stopPropagation(); handleOpenEditMemberFromContext(membroResp.id, 'agenda'); }} className="text-[10px] text-blue-700 underline font-bold cursor-pointer">Ver</button>}
                              </div>
                            </div>

                            <div className="pt-2 mt-2 border-t text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <strong className="text-slate-900 block mb-1">💬 Comentário / Relatório:</strong>
                              <p className="text-slate-600 italic">{comentarioExibicao}</p>
                            </div>
                          </div>

                          <div className="pt-2 flex gap-2">
                            <button 
                              onClick={() => handleOpenEditAgenda(c)}
                              className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                            >
                              Editar / Ver Detalhes
                            </button>
                            <button 
                              onClick={() => handleDeleteAgenda(c.id)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                              title="Excluir Compromisso"
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      );
                    })}
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
                      <div key={c.id} onClick={() => handleOpenEditAgenda(c)} className="p-4 border rounded-2xl bg-white shadow-xs space-y-2 cursor-pointer hover:border-blue-900 transition-all border-l-4 border-l-blue-900">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-mono font-bold bg-blue-50 text-blue-900 px-2 py-0.5 rounded">{c.data_compromisso}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm">{c.titulo}</h4>
                        <p className="text-xs text-slate-600 truncate">{c.descricao}</p>
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
                        <th className="p-3">Relatório / Comentário</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-700">
                      {compromissos.map((c: any) => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono font-bold">{c.data_compromisso}</td>
                          <td className="p-3 font-mono">{c.hora_compromisso} - {c.hora_fim}</td>
                          <td className="p-3 font-bold text-slate-900">{c.titulo}</td>
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
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 print:border-none print:shadow-none print:p-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 print:hidden">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">💰 Módulo Financeiro — Conta Corrente</h2>
                <p className="text-xs text-slate-500">Controle financeiro com extrato padrão, gestão de contas e relatórios.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button onClick={() => setFinanceiroSubTab('extrato')} className={`px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${financeiroSubTab === 'extrato' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-white'}`}>Extrato</button>
                  <button onClick={() => setFinanceiroSubTab('contas')} className={`px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${financeiroSubTab === 'contas' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-white'}`}>🏦 Contas</button>
                  <button onClick={() => setFinanceiroSubTab('relatorio')} className={`px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${financeiroSubTab === 'relatorio' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-white'}`}>📊 Relatório</button>
                </div>
                {financeiroSubTab === 'extrato' && (
                  <button onClick={() => setShowLancamentoModal(true)} className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-sm cursor-pointer whitespace-nowrap">+ Novo Lançamento</button>
                )}
                {financeiroSubTab === 'contas' && (
                  <button onClick={() => setShowContaModal(true)} className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-sm cursor-pointer whitespace-nowrap">+ Nova Conta</button>
                )}
                {financeiroSubTab === 'relatorio' && (
                  <button onClick={handlePrint} className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-sm cursor-pointer whitespace-nowrap flex items-center gap-1">🖨️ Imprimir Relatório</button>
                )}
              </div>
            </div>

            <div className="hidden print:block text-center mb-6 pb-4 border-b-2 border-slate-800">
              <h1 className="text-2xl font-black text-slate-900">BRSYSTEM — {loggedUser?.igrejas?.nome_fantasia || 'Igreja'}</h1>
              <p className="text-sm font-bold text-slate-600 uppercase tracking-widest mt-1">Relatório Financeiro — Extrato da Conta Corrente</p>
            </div>

            {financeiroSubTab === 'extrato' && (
              <div className="space-y-4">
                {loadingFinanceiro ? (
                  <p className="text-center py-6 text-slate-500">Carregando extrato...</p>
                ) : (
                  <div className="overflow-x-auto border rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b text-slate-600 font-semibold">
                          <th className="p-3">Data</th>
                          <th className="p-3">Débito (Saída)</th>
                          <th className="p-3">Crédito (Entrada)</th>
                          <th className="p-3">Descrição</th>
                          <th className="p-3">Saldo</th>
                          <th className="p-3 text-center print:hidden">Ações (Excluir / Anexar)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-slate-700">
                        {lancamentosComSaldo.length === 0 ? (
                          <tr><td colSpan={6} className="py-8 text-center text-slate-400">Nenhum lançamento registrado nesta conta corrente.</td></tr>
                        ) : (
                          lancamentosComSaldo.map((l: any) => (
                            <tr key={l.id} className="hover:bg-slate-50">
                              <td className="p-3 font-mono">{l.data_lancamento}</td>
                              <td className="p-3 font-mono font-bold text-rose-600">
                                {!l.isCredito ? `R$ ${l.valorNum.toFixed(2)}` : '-'}
                              </td>
                              <td className="p-3 font-mono font-bold text-emerald-600">
                                {l.isCredito ? `R$ ${l.valorNum.toFixed(2)}` : '-'}
                              </td>
                              <td className="p-3 font-bold text-slate-900">
                                {l.descricao}
                              </td>
                              <td className={`p-3 font-mono font-bold ${l.saldoAtual >= 0 ? 'text-blue-950' : 'text-rose-600'}`}>
                                R$ {l.saldoAtual.toFixed(2)}
                              </td>
                              <td className="p-3 text-center print:hidden">
                                <div className="flex items-center justify-center gap-2">
                                  <button 
                                    onClick={() => handleDeleteLancamento(l.id)}
                                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white font-bold rounded-lg transition-all cursor-pointer text-[11px]"
                                    title="Excluir lançamento"
                                  >
                                    Excluir
                                  </button>

                                  <label className="px-2.5 py-1 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold rounded-lg transition-all cursor-pointer text-[11px] inline-flex items-center gap-1" title="Carregar comprovante">
                                    📁 Anexar
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      className="hidden" 
                                      onChange={(e) => handleAnexarComprovante(l.id, e)}
                                    />
                                  </label>

                                  {l.comprovante_url && (
                                    <a 
                                      href={l.comprovante_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="text-emerald-700 font-bold text-[11px] underline"
                                    >
                                      Abrir
                                    </a>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {financeiroSubTab === 'contas' && (
              <div className="space-y-4">
                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b text-slate-600 font-semibold">
                        <th className="p-3">Nome da Conta</th>
                        <th className="p-3">Tipo / Categoria</th>
                        <th className="p-3">Saldo Atual</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-700">
                      {contasFinanceiras.length === 0 ? (
                        <tr><td colSpan={3} className="py-8 text-center text-slate-400">Nenhuma conta cadastrada. Clique em "+ Nova Conta" acima.</td></tr>
                      ) : (
                        contasFinanceiras.map((c: any) => {
                          const lancamentosDaConta = lancamentosCorrente.filter((l: any) => 
                            String(l.conta_id) === String(c.id) || !l.conta_id
                          );
                          const saldoConta = lancamentosDaConta.reduce((acc, l: any) => {
                            const val = parseFloat(l.valor || 0);
                            return l.tipo === 'entrada' ? acc + val : acc - val;
                          }, 0);

                          return (
                            <tr key={c.id} className="hover:bg-slate-50">
                              <td className="p-3 font-bold text-slate-900">{c.nome_conta}</td>
                              <td className="p-3">{c.codigo_conta}</td>
                              <td className="p-3 font-mono font-bold">R$ {saldoConta.toFixed(2)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {financeiroSubTab === 'relatorio' && (
              <div className="space-y-6">
                <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl flex justify-between items-center print:border-slate-400">
                  <div>
                    <h3 className="font-bold text-blue-950 text-base">Saldo Atual da Conta Corrente</h3>
                    <p className="text-xs text-blue-700">Calculado através do último resultado acumulado.</p>
                  </div>
                  <div className={`text-2xl font-black font-mono ${saldoFinalRelatorio >= 0 ? 'text-blue-900' : 'text-rose-600'}`}>
                    R$ {saldoFinalRelatorio.toFixed(2)}
                  </div>
                </div>

                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b text-slate-700 font-bold">
                        <th className="p-3">Data</th>
                        <th className="p-3">Débito (Saída)</th>
                        <th className="p-3">Crédito (Entrada)</th>
                        <th className="p-3">Descrição</th>
                        <th className="p-3">Saldo Parcial</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-700">
                      {lancamentosComSaldo.length === 0 ? (
                        <tr><td colSpan={5} className="py-8 text-center text-slate-400">Nenhum registro para exibir no relatório.</td></tr>
                      ) : (
                        lancamentosComSaldo.map((l: any) => (
                          <tr key={l.id} className="hover:bg-slate-50">
                            <td className="p-3 font-mono">{l.data_lancamento}</td>
                            <td className="p-3 font-mono text-rose-600 font-bold">{!l.isCredito ? `R$ ${l.valorNum.toFixed(2)}` : '-'}</td>
                            <td className="p-3 font-mono text-emerald-600 font-bold">{l.isCredito ? `R$ ${l.valorNum.toFixed(2)}` : '-'}</td>
                            <td className="p-3 font-bold text-slate-900">{l.descricao}</td>
                            <td className={`p-3 font-mono font-bold ${l.saldoAtual >= 0 ? 'text-blue-950' : 'text-rose-600'}`}>R$ {l.saldoAtual.toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Novo Setor */}
      {showSetorModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-lg font-black text-blue-900">Cadastrar Novo Setor</h3>
              <button onClick={() => setShowSetorModal(false)} className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer">✕ Fechar</button>
            </div>
            <form onSubmit={handleSaveSetor} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 ml-1">Nome do Setor *</label>
                <input type="text" required value={formSetorNome} onChange={(e) => setFormSetorNome(e.target.value)} placeholder="Ex: Setor Centro" className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 ml-1">Líder do Setor</label>
                <select value={formSetorLider} onChange={(e) => setFormSetorLider(e.target.value)} className="w-full rounded-xl border p-3 text-sm bg-white focus:outline-none focus:border-blue-900">
                  <option value="">Selecione o líder...</option>
                  {members.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.nome}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowSetorModal(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer">Salvar Setor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nova Rede */}
      {showRedeModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-lg font-black text-blue-900">Cadastrar Nova Rede</h3>
              <button onClick={() => setShowRedeModal(false)} className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer">✕ Fechar</button>
            </div>
            <form onSubmit={handleSaveRede} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 ml-1">Nome da Rede *</label>
                <input type="text" required value={formRedeNome} onChange={(e) => setFormRedeNome(e.target.value)} placeholder="Ex: Rede de Casais" className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 ml-1">Líder da Rede</label>
                <select value={formRedeLider} onChange={(e) => setFormRedeLider(e.target.value)} className="w-full rounded-xl border p-3 text-sm bg-white focus:outline-none focus:border-blue-900">
                  <option value="">Selecione o líder...</option>
                  {members.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.nome}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowRedeModal(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-800 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer">Salvar Rede</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLancamentoModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-lg font-black text-blue-900">Novo Lançamento (Conta Corrente)</h3>
              <button onClick={() => setShowLancamentoModal(false)} className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer">✕ Fechar</button>
            </div>
            <form onSubmit={handleSaveLancamento} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 ml-1">Data *</label>
                <input type="date" required value={formLancData} onChange={(e) => setFormLancData(e.target.value)} className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 ml-1">Tipo *</label>
                  <select value={formLancTipo} onChange={(e: any) => setFormLancTipo(e.target.value)} className="w-full rounded-xl border p-3 text-sm font-bold bg-white focus:outline-none focus:border-blue-900">
                    <option value="credito">Crédito (Entrada)</option>
                    <option value="debito">Débito (Saída)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 ml-1">Valor (R$) *</label>
                  <input type="number" step="0.01" required value={formLancValor} onChange={(e) => setFormLancValor(e.target.value)} placeholder="0.00" className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 ml-1">Conta Financeira</label>
                <select value={formLancContaId} onChange={(e) => setFormLancContaId(e.target.value)} className="w-full rounded-xl border p-3 text-sm bg-white focus:outline-none focus:border-blue-900">
                  <option value="">Selecione a conta cadastrada...</option>
                  {contasFinanceiras.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.nome_conta} ({c.codigo_conta})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 ml-1">Descrição / Observação</label>
                <textarea rows={2} value={formLancObs} onChange={(e) => setFormLancObs(e.target.value)} placeholder="Detalhes do lançamento..." className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowLancamentoModal(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer">Salvar Lançamento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showContaModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-lg font-black text-blue-900">Cadastrar Nova Conta</h3>
              <button onClick={() => setShowContaModal(false)} className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer">✕ Fechar</button>
            </div>
            <form onSubmit={handleSaveConta} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 ml-1">Nome da Conta *</label>
                <input type="text" required value={formNomeConta} onChange={(e) => setFormNomeConta(e.target.value)} placeholder="Ex: Banco Sicoob, Caixa Geral" className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 ml-1">Categoria / Tipo</label>
                <select value={formTipoConta} onChange={(e) => setFormTipoConta(e.target.value)} className="w-full rounded-xl border p-3 text-sm bg-white focus:outline-none focus:border-blue-900">
                  <option value="Caixa Geral">Caixa Geral</option>
                  <option value="Conta Bancária">Conta Bancária</option>
                  <option value="Aplicação">Aplicação</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowContaModal(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer">Salvar Conta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAgendaModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 space-y-6">
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
                <label className="text-xs font-bold text-slate-600 ml-1">Responsável pelo Compromisso</label>
                <select value={formAgendaMembroId} onChange={(e) => setFormAgendaMembroId(e.target.value)} className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900 bg-white">
                  <option value="">Selecione o responsável...</option>
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

              <div className="flex items-center justify-between pt-4 border-t">
                {editingCompromisso ? (
                  <button 
                    type="button" 
                    onClick={() => handleDeleteAgenda(editingCompromisso.id)}
                    className="px-4 py-2.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white font-bold text-sm rounded-xl transition-all cursor-pointer"
                  >
                    Excluir Compromisso
                  </button>
                ) : <div />}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowAgendaModal(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl cursor-pointer">Cancelar</button>
                  <button type="submit" className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer">
                    {editingCompromisso ? 'Salvar Alterações' : 'Salvar Compromisso'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCelulaModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-lg font-black text-blue-900">
                {editingCelula ? 'Alterar Célula' : 'Nova Célula'}
              </h3>
              <button onClick={() => setShowCelulaModal(false)} className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer">✕ Fechar</button>
            </div>

            <form onSubmit={handleSaveCelula} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 ml-1">Nome da Célula *</label>
                <input type="text" required value={formCelNome} onChange={(e) => setFormCelNome(e.target.value)} placeholder="Ex: Célula Betel" className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 ml-1">Líder (Membro Cadastrado)</label>
                  <select value={formCelLider} onChange={(e) => setFormCelLider(e.target.value)} className="w-full rounded-xl border p-3 text-sm bg-white focus:outline-none focus:border-blue-900">
                    <option value="">Selecione o líder...</option>
                    {members.map((m: any) => (
                      <option key={m.id} value={m.id}>{m.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 ml-1">Vice-Líder (Membro Cadastrado)</label>
                  <select value={formCelVice} onChange={(e) => setFormCelVice(e.target.value)} className="w-full rounded-xl border p-3 text-sm bg-white focus:outline-none focus:border-blue-900">
                    <option value="">Selecione o vice...</option>
                    {members.map((m: any) => (
                      <option key={m.id} value={m.id}>{m.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 ml-1">Anfitrião (Membro Cadastrado)</label>
                  <select value={formCelAnfitriao} onChange={(e) => setFormCelAnfitriao(e.target.value)} className="w-full rounded-xl border p-3 text-sm bg-white focus:outline-none focus:border-blue-900">
                    <option value="">Selecione o anfitrião...</option>
                    {members.map((m: any) => (
                      <option key={m.id} value={m.id}>{m.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 ml-1">Dia da Semana</label>
                  <select value={formCelDia} onChange={(e) => setFormCelDia(e.target.value)} className="w-full rounded-xl border p-3 text-sm bg-white focus:outline-none focus:border-blue-900">
                    <option value="Segunda-feira">Segunda-feira</option>
                    <option value="Terça-feira">Terça-feira</option>
                    <option value="Quarta-feira">Quarta-feira</option>
                    <option value="Quinta-feira">Quinta-feira</option>
                    <option value="Sexta-feira">Sexta-feira</option>
                    <option value="Sábado">Sábado</option>
                    <option value="Domingo">Domingo</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 ml-1">Horário</label>
                  <input type="time" value={formCelHora} onChange={(e) => setFormCelHora(e.target.value)} className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900" />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border rounded-2xl space-y-3">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Endereço da Célula & CEP</h4>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[11px] font-bold text-slate-500 ml-1">CEP</label>
                    <input type="text" value={formCelCep} onChange={(e) => setFormCelCep(e.target.value)} placeholder="00000-000" className="w-full rounded-xl border p-2.5 text-sm bg-white focus:outline-none focus:border-blue-900 font-mono" />
                  </div>
                  <div className="flex items-end">
                    <button type="button" onClick={handleBuscarCep} className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl cursor-pointer">Buscar CEP</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-500 ml-1">Rua / Logradouro</label>
                    <input type="text" value={formCelRua} onChange={(e) => setFormCelRua(e.target.value)} placeholder="Nome da rua" className="w-full rounded-xl border p-2.5 text-sm bg-white focus:outline-none focus:border-blue-900" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 ml-1">Número</label>
                    <input type="text" value={formCelNumero} onChange={(e) => setFormCelNumero(e.target.value)} placeholder="Nº" className="w-full rounded-xl border p-2.5 text-sm bg-white focus:outline-none focus:border-blue-900" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 ml-1">Bairro</label>
                    <input type="text" value={formCelBairro} onChange={(e) => setFormCelBairro(e.target.value)} placeholder="Bairro" className="w-full rounded-xl border p-2.5 text-sm bg-white focus:outline-none focus:border-blue-900" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 ml-1">Cidade</label>
                    <input type="text" value={formCelCidade} onChange={(e) => setFormCelCidade(e.target.value)} placeholder="Cidade" className="w-full rounded-xl border p-2.5 text-sm bg-white focus:outline-none focus:border-blue-900" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <label className="text-xs font-bold text-slate-700 block">Participantes da Célula (Vincular Membros)</label>
                <div className="flex gap-2">
                  <select value={formCelNovoParticipante} onChange={(e) => setFormCelNovoParticipante(e.target.value)} className="flex-1 rounded-xl border p-2.5 text-sm bg-white focus:outline-none focus:border-blue-900">
                    <option value="">Selecione um membro para adicionar...</option>
                    {members.map((m: any) => (
                      <option key={m.id} value={m.id}>{m.nome}</option>
                    ))}
                  </select>
                  <button type="button" onClick={handleAddParticipante} className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl cursor-pointer">Adicionar</button>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {formCelParticipantes.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Nenhum participante adicionado ainda.</p>
                  ) : (
                    formCelParticipantes.map((pId) => {
                      const mObj = members.find((m: any) => String(m.id) === String(pId));
                      return (
                        <span key={pId} className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 border rounded-xl text-xs font-bold text-slate-700">
                          {mObj ? mObj.nome : 'Membro ID: ' + pId}
                          <button type="button" onClick={() => handleRemoveParticipante(pId)} className="text-rose-600 hover:text-rose-800 font-black cursor-pointer">✕</button>
                        </span>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                {editingCelula ? (
                  <button type="button" onClick={() => handleDeleteCelula(editingCelula.id)} className="px-4 py-2.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white font-bold text-sm rounded-xl transition-all cursor-pointer">
                    Excluir Célula
                  </button>
                ) : <div />}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowCelulaModal(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl cursor-pointer">Cancelar</button>
                  <button type="submit" className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer">
                    {editingCelula ? 'Salvar Alterações' : 'Salvar Célula'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMemberModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="text-lg font-black text-blue-900">
                  {editingMember ? `Ficha do Membro: ${editingMember.nome}` : 'Novo Cadastro de Membro'}
                </h3>
                {editingMember && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setMemberModalTab('dados')} className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${memberModalTab === 'dados' ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-700'}`}>📁 Dados Cadastrais</button>
                    <button onClick={() => setMemberModalTab('financeiro')} className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${memberModalTab === 'financeiro' ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-700'}`}>💰 Financeiro (Conta Corrente)</button>
                  </div>
                )}
              </div>
              <button onClick={() => setShowMemberModal(false)} className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer">✕ Fechar</button>
            </div>

            {memberModalTab === 'financeiro' && editingMember ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800 text-base">Extrato Financeiro Individual</h4>
                  <button onClick={() => setShowLancamentoModal(true)} className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer">+ Novo Lançamento</button>
                </div>

                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b text-slate-600 font-semibold">
                        <th className="p-3">Data</th>
                        <th className="p-3">Débito (Saída)</th>
                        <th className="p-3">Crédito (Entrada)</th>
                        <th className="p-3">Descrição</th>
                        <th className="p-3">Saldo</th>
                        <th className="p-3 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-700">
                      {(() => {
                        const lancsDoMembro = lancamentosCorrente.filter((l: any) => String(l.membro_id) === String(editingMember.id));
                        let saldoMembro = 0;
                        const comSaldo = lancsDoMembro.map((l: any) => {
                          const val = parseFloat(l.valor || 0);
                          const isCred = l.tipo === 'entrada';
                          if (isCred) saldoMembro += val; else saldoMembro -= val;
                          return { ...l, isCred, valorNum: val, saldoAtual: saldoMembro };
                        });

                        if (comSaldo.length === 0) {
                          return <tr><td colSpan={6} className="py-6 text-center text-slate-400">Nenhum lançamento financeiro vinculado a este membro.</td></tr>;
                        }

                        return comSaldo.map((l: any) => (
                          <tr key={l.id} className="hover:bg-slate-50">
                            <td className="p-3 font-mono">{l.data_lancamento}</td>
                            <td className="p-3 font-mono font-bold text-rose-600">{!l.isCred ? `R$ ${l.valorNum.toFixed(2)}` : '-'}</td>
                            <td className="p-3 font-mono font-bold text-emerald-600">{l.isCred ? `R$ ${l.valorNum.toFixed(2)}` : '-'}</td>
                            <td className="p-3 font-bold text-slate-900">{l.descricao}</td>
                            <td className={`p-3 font-mono font-bold ${l.saldoAtual >= 0 ? 'text-blue-950' : 'text-rose-600'}`}>R$ {l.saldoAtual.toFixed(2)}</td>
                            <td className="p-3 text-center">
                              <button onClick={() => handleDeleteLancamento(l.id)} className="px-2 py-1 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white font-bold rounded text-[10px] cursor-pointer">Excluir</button>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
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
                      <div className="flex-1 space-y-2">
                        <label className="text-xs font-bold text-slate-600 ml-1">Foto do Membro</label>
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="px-3 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-all inline-flex items-center gap-1 shadow-sm">
                            📸 Tirar Foto (Câmera)
                            <input 
                              type="file" 
                              accept="image/*" 
                              capture="user" 
                              className="hidden" 
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.readAsDataURL(file);
                                reader.onload = () => {
                                  setFormFotoUrl(reader.result as string);
                                };
                              }}
                            />
                          </label>

                          <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all inline-flex items-center gap-1 shadow-sm">
                            📁 Enviar Arquivo
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.readAsDataURL(file);
                                reader.onload = () => {
                                  setFormFotoUrl(reader.result as string);
                                };
                              }}
                            />
                          </label>

                          {formFotoUrl && (
                            <button 
                              type="button" 
                              onClick={() => setFormFotoUrl('')} 
                              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl cursor-pointer transition-all"
                            >
                              Remover
                            </button>
                          )}
                        </div>
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

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setFormStep(1)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl cursor-pointer">← Voltar</button>
                        {editingMember && (
                          <button 
                            type="button" 
                            onClick={() => handleDeleteMember(editingMember.id)}
                            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white font-bold text-sm rounded-xl transition-all cursor-pointer"
                          >
                            Excluir Membro
                          </button>
                        )}
                      </div>
                      <button type="submit" className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer">
                        {editingMember ? 'Salvar Alterações' : 'Cadastrar Membro'}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}