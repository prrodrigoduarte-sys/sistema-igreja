// ==========================================
// 1. IMPORTAÇÕES E CONFIGURAÇÃO INICIAL
// ==========================================
import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';

// ==========================================
// 2. COMPONENTE PRINCIPAL E ESTADOS GLOBAIS
// ==========================================
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedUser, setLoggedUser] = useState<any>(null);
  
  const [activeTab, setActiveTab] = useState<'membros' | 'usuarios' | 'fornecedores' | 'relatorios' | 'agenda' | 'celulas' | 'financeiro' | 'igreja' | 'ministerios' | 'membros_mobile' | 'projetos'>('relatorios');
  const [openDropdown, setOpenDropdown] = useState<'cadastros' | 'controle' | 'projetos' | null>(null);

  // ==========================================
  // 2.1 SUB-ABAS DO SISTEMA
  // ==========================================
  const [relatorioSubTab, setRelatorioSubTab] = useState<'geral' | 'aniversariantes_dia' | 'aniversariantes_mes' | 'completa'>('geral');
  const [agendaSubTab, setAgendaSubTab] = useState<'lista' | 'calendario' | 'impressao'>('lista');
  const [financeiroSubTab, setFinanceiroSubTab] = useState<'extrato' | 'contas' | 'plano_contas' | 'relatorio'>('extrato');
  const [celulasSubTab, setCelulasSubTab] = useState<'lista' | 'relatorio_simples' | 'relatorio_completo' | 'relatorio_arvore'>('lista');

  const [projetoAtivo, setProjetoAtivo] = useState<'missoes' | 'proj_1' | 'proj_2' | 'proj_3' | 'proj_4' | 'proj_5'>('missoes');

  // ==========================================
  // 2.2 ESTADOS DE PROJETOS E INSCRIÇÕES
  // ==========================================
  const [inscricoesList, setInscricoesList] = useState<any[]>([]);
  const [showInscricaoModal, setShowInscricaoModal] = useState(false);
  const [editingInscricao, setEditingInscricao] = useState<any>(null);
  const [formInscricaoNome, setFormInscricaoNome] = useState('');
  const [formInscricaoCpf, setFormInscricaoCpf] = useState('');
  const [formInscricaoTel, setFormInscricaoTel] = useState('');
  const [formInscricaoEmail, setFormInscricaoEmail] = useState('');
  const [formInscricaoMembroId, setFormInscricaoMembroId] = useState<any>(null);

  // ==========================================
  // 2.3 PLANO DE CONTAS CONTÁBIL
  // ==========================================
  const [planoContasContabil, setPlanoContasContabil] = useState<any[]>([]);
  const [showPlanoContaModal, setShowPlanoContaModal] = useState(false);
  const [formPlanoCodigo, setFormPlanoCodigo] = useState('');
  const [formPlanoNome, setFormPlanoNome] = useState('');
  const [formPlanoNatureza, setFormPlanoNatureza] = useState('Receita');

  // ==========================================
  // 2.4 AUTENTICAÇÃO E DADOS DE USUÁRIO
  // ==========================================
  const [loginCodigo, setLoginCodigo] = useState('IGR-001');
  const [loginUsuario, setLoginUsuario] = useState('');
  const [loginSenha, setLoginSenha] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginModo, setLoginModo] = useState<'mobile' | 'normal'>('normal');
// ==========================================
// CONTROLE DE ACESSO DO MÓDULO MOBILE
// ==========================================
const ehUsuarioCelula =
  loggedUser?.perfil_acesso === 'celula';

const ehAdministrador =
  loggedUser?.perfil_acesso === 'admin';

const podeAcessarSistemaCompleto =
  !ehUsuarioCelula;
const obterIdCelulaDoUsuario = () => {
  return loggedUser?.celula_id || null;
};

const membroPodeAcessarCelula = (membro: any) => {
  const celulaId = obterIdCelulaDoUsuario();

  if (!ehUsuarioCelula || !celulaId || !membro) {
    return true;
  }

  const participantes = Array.isArray(loggedUser?.participantes_celula)
    ? loggedUser.participantes_celula.map((id: any) => String(id))
    : [];

  return participantes.includes(String(membro.id));
};
  // ==========================================
  // CARREGAMENTO DO PLANO DE CONTAS (UNIFICADO)
  // ==========================================
  const carregarPlanoContas = async () => {
    const codigoIgrejaAtual = loggedUser?.codigo_igreja || loginCodigo || 'IGR-001';

    try {
      console.log('Buscando plano de contas da igreja:', codigoIgrejaAtual);

      const { data, error } = await supabase
        .from('plano_contas_contabil')
        .select('*')
        .eq('codigo_igreja', codigoIgrejaAtual)
        .order('codigo_conta', { ascending: true });

      if (error) {
        console.error('Erro ao buscar plano de contas:', error.message);
        setPlanoContasContabil([]);
        return;
      }

      console.log('Plano de contas carregado:', data);
      setPlanoContasContabil(data || []);
    } catch (err: any) {
      console.error('Erro geral ao carregar plano de contas:', err.message);
      setPlanoContasContabil([]);
    }
  };

  // ==========================================
  // SALVAMENTO DE NOVA CONTA CONTÁBIL
  // ==========================================
  const salvarPlanoConta = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formPlanoCodigo.trim() || !formPlanoNome.trim()) {
      alert('Preencha o código e o nome da conta contábil.');
      return;
    }

    const codigoIgrejaAtual = loggedUser?.codigo_igreja || loginCodigo || 'IGR-001';

    try {
      const { error } = await supabase
        .from('plano_contas_contabil')
        .insert([
          {
            codigo_igreja: codigoIgrejaAtual,
            codigo_conta: formPlanoCodigo.trim(),
            nome_conta: formPlanoNome.trim(),
            tipo_natureza: formPlanoNatureza,
          },
        ]);

      if (error) {
        throw error;
      }

      alert('Conta contábil cadastrada com sucesso!');

      setShowPlanoContaModal(false);
      setFormPlanoCodigo('');
      setFormPlanoNome('');
      setFormPlanoNatureza('Receita');

      await carregarPlanoContas();
    } catch (err: any) {
      alert('Erro ao salvar conta contábil: ' + err.message);
    }
  };

  // Carrega automaticamente ao acessar a sub-aba Plano de Contas
  useEffect(() => {
    if (isLoggedIn && loggedUser?.codigo_igreja && financeiroSubTab === 'plano_contas') {
      carregarPlanoContas();
    }
  }, [financeiroSubTab, isLoggedIn, loggedUser?.codigo_igreja]);

  // ==========================================
  // 2.5 MEMBROS E FORMULÁRIOS
  // ==========================================
  const [members, setMembers] = useState<any[]>([]);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingMembros, setLoadingMembros] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [memberModalTab, setMemberModalTab] = useState<'dados' | 'financeiro' | 'evolucao'>('dados');
  const [retornarParaTab, setRetornarParaTab] = useState<string | null>(null);

  const [novoMinisterioEvolucao, setNovoMinisterioEvolucao] = useState('');

  // ==========================================
  // 2.6 MINISTÉRIOS
  // ==========================================
  const [ministeriosList, setMinisteriosList] = useState<any[]>([]);
  const [showMinisterioModal, setShowMinisterioModal] = useState(false);
  const [editingMinisterio, setEditingMinisterio] = useState<any>(null);
  const [formMinisterioNome, setFormMinisterioNome] = useState('');
  const [formMinisterioDesc, setFormMinisterioDesc] = useState('');

  // ==========================================
  // 3. MÁSCARAS E FORMATAÇÕES DE DADOS
  // ==========================================
  const aplicarMascaraCelular = (valor: string) => {
    const apenasDigitos = valor.replace(/\D/g, '').substring(0, 11);
    let formatado = apenasDigitos;
    if (apenasDigitos.length > 2) {
      formatado = `(${apenasDigitos.substring(0, 2)}) ${apenasDigitos.substring(2)}`;
    }
    if (apenasDigitos.length > 7) {
      formatado = `(${apenasDigitos.substring(0, 2)}) ${apenasDigitos.substring(2, 7)}-${apenasDigitos.substring(7)}`;
    }
    return formatado;
  };

  const aplicarMascaraCpf = (valor: string) => {
    const apenasDigitos = valor.replace(/\D/g, '').slice(0, 11);
    if (apenasDigitos.length <= 3) {
      return apenasDigitos;
    } else if (apenasDigitos.length <= 6) {
      return `${apenasDigitos.slice(0, 3)}.${apenasDigitos.slice(3)}`;
    } else if (apenasDigitos.length <= 9) {
      return `${apenasDigitos.slice(0, 3)}.${apenasDigitos.slice(3, 6)}.${apenasDigitos.slice(6)}`;
    } else {
      return `${apenasDigitos.slice(0, 3)}.${apenasDigitos.slice(3, 6)}.${apenasDigitos.slice(6, 9)}-${apenasDigitos.slice(9, 11)}`;
    }
  };

  const [formMember, setFormMember] = useState({
    nome: '',
    tipo_cadastro: 'Membro',
    cpf: '',
    rg: '',
    data_nascimento: '',
    celular_principal: '',
    email: '',
    estado_civil: 'Solteiro(a)',
    cep: '',
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    endereco: '',
    foto_url: '',
    ministerio_id: ''
  });

  const [dataNascDisplay, setDataNascDisplay] = useState('');

  const [usuariosList, setUsuariosList] = useState<any[]>([]);
  const [fornecedoresList, setFornecedoresList] = useState<any[]>([]);

  // ==========================================
  // 3.1 AGENDA E COMPROMISSOS
  // ==========================================
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

  // ==========================================
  // 3.2 CÉLULAS, SETORES E REDES
  // ==========================================
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

  // ==========================================
  // 3.3 MÓDULO FINANCEIRO
  // ==========================================
  const [contasFinanceiras, setContasFinanceiras] = useState<any[]>([]);
  const [lancamentosCorrente, setLancamentosCorrente] = useState<any[]>([]);
  const [loadingFinanceiro, setLoadingFinanceiro] = useState(false);
  const [showLancamentoModal, setShowLancamentoModal] = useState(false);
  const [showContaModal, setShowContaModal] = useState(false);

  const [formLancData, setFormLancData] = useState('');
  const [formLancValor, setFormLancValor] = useState('');
  const [formLancContaDebitoId, setFormLancContaDebitoId] = useState('');
  const [formLancContaCreditoId, setFormLancContaCreditoId] = useState('');
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

  // ==========================================
  // 4. FUNÇÕES DE SUPABASE E BANCO DE DADOS
  // ==========================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
  
    try {
      const codigoIgreja = loginCodigo.trim().toUpperCase();
      const identificador = loginUsuario.trim();
      const senha = loginSenha.trim();
  
      if (!codigoIgreja || !identificador || !senha) {
        alert('Preencha todos os campos.');
        return;
      }
  
     // ==========================================
// LOGIN MOBILE
// CPF + senha padrão 123456
// ==========================================
if (loginModo === 'mobile') {
  const cpfNumeros = identificador.replace(/\D/g, '');

  if (cpfNumeros.length !== 11) {
    alert('Digite um CPF válido com 11 números.');
    return;
  }

  if (senha !== '123456') {
    alert('A senha do Mobile deve ser 123456.');
    return;
  }

  const { data: membrosIgreja, error: erroMembro } = await supabase
    .from('members')
    .select('id, nome, cpf, codigo_igreja')
    .eq('codigo_igreja', codigoIgreja);

  if (erroMembro) {
    alert('Erro ao consultar membros: ' + erroMembro.message);
    return;
  }

  const membro = (membrosIgreja || []).find((item: any) => {
    const cpfBanco = String(item.cpf || '').replace(/\D/g, '');
    return cpfBanco === cpfNumeros;
  });

  if (!membro) {
    alert('CPF não encontrado no cadastro de membros.');
    return;
  }

  const { data: celulasDaIgreja, error: erroCelula } = await supabase
    .from('celulas')
    .select('*')
    .eq('codigo_igreja', codigoIgreja);

  if (erroCelula) {
    alert('Erro ao consultar células: ' + erroCelula.message);
    return;
  }

  const celula = (celulasDaIgreja || []).find((item: any) => {
    const membroId = String(membro.id);
    const liderId = String(item.lider_id ?? '');
    const viceId = String(item.vice_id ?? '');

    return liderId === membroId || viceId === membroId;
  });

  if (!celula) {
    alert(
      'Acesso negado. Este CPF não é de líder ou vice-líder de célula.'
    );
    return;
  }

  const funcaoCelula =
    String(celula.lider_id) === String(membro.id)
      ? 'lider'
      : 'vice_lider';

  const participantes = Array.isArray(celula.participantes)
    ? celula.participantes
    : [];

    const idsPermitidos = Array.from(
      new Set(
        [
          ...participantes,
          celula.lider_id,
          celula.vice_id,
          celula.anfitriao_id
        ]
          .map((item: any) => {
            if (
              item &&
              typeof item === 'object' &&
              'id' in item
            ) {
              return item.id;
            }
    
            return item;
          })
          .filter(
            (id: any) =>
              id !== null &&
              id !== undefined &&
              String(id).trim() !== ''
          )
          .map((id: any) => String(id))
      )
    );
  setLoggedUser({
    perfil_acesso: 'celula',
    funcao_celula: funcaoCelula,
    membro_id: membro.id,
    membro_nome: membro.nome,
    celula_id: celula.id,
    celula_nome: celula.nome,
    participantes_celula: idsPermitidos,
    codigo_igreja: codigoIgreja,
    nome_usuario: membro.nome
  });

  setActiveTab('membros_mobile');
  setIsLoggedIn(true);
  return;
}
      // ==========================================
      // LOGIN NORMAL ANTIGO
      // Usuário e senha da tabela usuarios
      // ==========================================
      const { data: usuario, error: erroUsuario } = await supabase
        .from('usuarios')
        .select('*, igrejas(*)')
        .eq('codigo_igreja', codigoIgreja)
        .eq('usuario', identificador)
        .eq('senha', senha)
        .eq('ativo', true)
        .maybeSingle();
  
      if (erroUsuario || !usuario) {
        alert('Usuário ou senha incorretos.');
        return;
      }
  
      const ehAdministrador =
        usuario.usuario === 'admin' ||
        usuario.perfil === 'admin' ||
        usuario.tipo_usuario === 'admin';
  
      setLoggedUser({
        ...usuario,
        perfil_acesso: ehAdministrador ? 'admin' : 'usuario'
      });
  
      setActiveTab('relatorios');
      setIsLoggedIn(true);
    } catch (err: any) {
      alert('Erro no login: ' + err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const carregarMembros = async (cod: string) => {
    console.log('Código usado para buscar membros:', cod);
  
    if (!cod) {
      console.warn('Código da igreja não informado.');
      setMembers([]);
      return;
    }
  
    setLoadingMembros(true);
  
    try {
      const codigoNormalizado = cod.trim().toUpperCase();
  
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('codigo_igreja', codigoNormalizado)
        .order('nome', { ascending: true });
  
      console.log('Membros retornados:', data);
      console.log('Erro Supabase:', error);
  
      if (error) {
        console.error('Erro ao carregar membros:', error.message);
        setMembers([]);
        return;
      }
  
      setMembers(data || []);
    } catch (err: any) {
      console.error('Erro inesperado ao carregar membros:', err);
      setMembers([]);
    } finally {
      setLoadingMembros(false);
    }
  };

  const carregarMinisterios = async (cod: string) => {
  const { data, error } = await supabase
    .from('ministerios')
    .select('*')
    .eq('codigo_igreja', cod)
    .order('nome', { ascending: true });

  if (error) {
    console.error('Erro ao carregar ministérios:', error.message);
    setMinisteriosList([]);
    return;
  }

  setMinisteriosList(data || []);
};

  const salvarMinisterio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMinisterioNome.trim()) { alert('O nome do ministério é obrigatório.'); return; }

    const payload = {
      codigo_igreja: loggedUser.codigo_igreja,
      nome: formMinisterioNome.trim().toUpperCase(),
      descricao: formMinisterioDesc.trim().toUpperCase()
    };

    try {
      if (editingMinisterio && editingMinisterio.id) {
        const { error } = await supabase.from('ministerios').update(payload).eq('id', editingMinisterio.id);
        if (error) throw error;
        alert('Ministério atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('ministerios').insert([payload]);
        if (error) throw error;
        alert('Ministério cadastrado com sucesso!');
      }
      setShowMinisterioModal(false);
      carregarMinisterios(loggedUser.codigo_igreja);
    } catch (err: any) {
      alert('Erro ao salvar ministério: ' + err.message);
    }
  };

  const deletarMinisterio = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este ministério?')) return;
    try {
      const { error } = await supabase.from('ministerios').delete().eq('id', id);
      if (error) throw error;
      alert('Ministério excluído com sucesso!');
      carregarMinisterios(loggedUser.codigo_igreja);
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
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

  const carregarInscricoes = async (cod: string) => {
    const { data } = await supabase.from('inscricoes_projetos').select('*').eq('codigo_igreja', cod);
    setInscricoesList(data || []);
  };

  const carregarFinanceiro = async (cod: string) => {
    if (!cod) return;
    setLoadingFinanceiro(true);
    try {
      const { data: cData } = await supabase.from('contas_financeiras').select('*').eq('codigo_igreja', cod);
      setContasFinanceiras(cData || []);

      const { data: lData } = await supabase.from('lancamentos_financeiros').select('*').eq('codigo_igreja', cod).order('data_lancamento', { ascending: true });
      setLancamentosCorrente(lData || []);
    } catch (err: any) {
      console.error('Erro na carregarFinanceiro:', err);
    } finally {
      setLoadingFinanceiro(false);
    }
  };

  // Carregamento Geral Unificado
  useEffect(() => {
    if (!isLoggedIn || !loggedUser?.codigo_igreja) return;
    const cod = loggedUser.codigo_igreja;
    
    async function carregarDados() {
      await Promise.all([
        carregarMembros(cod),
        carregarMinisterios(cod),
        carregarInscricoes(cod),
        carregarPlanoContas(),
        carregarAgenda(cod),
        carregarCelulas(cod),
        carregarSetores(cod),
        carregarRedes(cod),
        carregarFinanceiro(cod)
      ]);

      const { data: uData } = await supabase.from('usuarios').select('*').eq('codigo_igreja', cod);
      setUsuariosList(uData || []);
      
      const { data: fData } = await supabase.from('fornecedores').select('*').eq('codigo_igreja', cod);
      setFornecedoresList(fData || []);
    }
    carregarDados();
  }, [isLoggedIn, loggedUser]);

  const handleBuscarCep = async () => {
    const cepLimpo = formCelCep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) { alert('Digite um CEP válido com 8 dígitos.'); return; }
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      if (data.erro) { alert('CEP não encontrado.'); return; }
      setFormCelRua(data.logradouro || '');
      setFormCelBairro(data.bairro || '');
      setFormCelCidade(data.localidade || '');
    } catch (err) { alert('Erro ao buscar o CEP.'); }
  };

  const handleBuscarCepMembro = async () => {
    const cepLimpo = formMember.cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) { alert('Digite um CEP válido com 8 dígitos.'); return; }
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      if (data.erro) { alert('CEP não encontrado.'); return; }
      const enderecoCompletoCalc = `${data.logradouro || ''}, ${formMember.numero || 'S/N'} - ${data.bairro || ''}, ${data.localidade || ''} - ${data.uf || ''} (CEP: ${formMember.cep})`;
      setFormMember({
        ...formMember,
        rua: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        estado: data.uf || '',
        endereco: enderecoCompletoCalc
      });
    } catch (err) { alert('Erro ao buscar o CEP.'); }
  };

  const aplicarMascaraData = (valor: string) => {
    const apenasDigitos = valor.replace(/\D/g, '').substring(0, 8);
    let dataFormatada = apenasDigitos;
    if (apenasDigitos.length > 2) dataFormatada = apenasDigitos.substring(0, 2) + '/' + apenasDigitos.substring(2);
    if (apenasDigitos.length > 4) dataFormatada = dataFormatada.substring(0, 5) + '/' + apenasDigitos.substring(4);
    return dataFormatada;
  };

  const converterDataParaBanco = (dataBr: string) => {
    if (!dataBr || dataBr.length !== 10) return null;
    const [dia, mes, ano] = dataBr.split('/');
    if (!dia || !mes || !ano) return null;
    return `${ano}-${mes}-${dia}`;
  };

  const converterDataParaDisplay = (dataIso: string) => {
    if (!dataIso) return '';
    const partes = dataIso.split('-');
    if (partes.length !== 3) return dataIso;
    const [ano, mes, dia] = partes;
    return `${dia}/${mes}/${ano}`;
  };

  const abrirModalMembro = (m?: any) => {
    if (m) {
      setEditingMember(m);
      setFormMember({
        nome: m.nome || '',
        tipo_cadastro: m.tipo_cadastro || 'Membro',
        cpf: m.cpf || '',
        rg: m.rg || '',
        data_nascimento: m.data_nascimento || '',
        celular_principal: m.celular_principal || '',
        email: m.email || '',
        estado_civil: m.estado_civil || 'Solteiro(a)',
        cep: m.cep || '',
        rua: m.rua || '',
        numero: m.numero || '',
        bairro: m.bairro || '',
        cidade: m.cidade || '',
        estado: m.estado || '',
        endereco: m.endereco || '',
        foto_url: m.foto_url || '',
        ministerio_id: m.ministerio_id || ''
      });
      setDataNascDisplay(converterDataParaDisplay(m.data_nascimento || ''));
      setNovoMinisterioEvolucao(m.ministerio_id || '');
    } else {
      setEditingMember(null);
      setFormMember({
        nome: '',
        tipo_cadastro: 'Membro',
        cpf: '',
        rg: '',
        data_nascimento: '',
        celular_principal: '',
        email: '',
        estado_civil: 'Solteiro(a)',
        cep: '',
        rua: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: '',
        endereco: '',
        foto_url: '',
        ministerio_id: ''
      });
      setDataNascDisplay('');
      setNovoMinisterioEvolucao('');
    }
    setMemberModalTab('dados');
    setRetornarParaTab(null);
    setShowMemberModal(true);
  };

  const handleOpenEditMemberFromContext = (mId: string, origemTab: string) => {
    const m = members.find(item => String(item.id) === String(mId));
    if (!m) return;
    setRetornarParaTab(origemTab);
    abrirModalMembro(m);
  };

  const salvarMembro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMember.nome.trim()) { alert('O nome é obrigatório.'); return; }

    const cpfLimpo = formMember.cpf.replace(/\D/g, '');
    const duplicado = members.find(m => {
      const nomeIgual = m.nome.toLowerCase() === formMember.nome.trim().toLowerCase();
      const cpfIgual = cpfLimpo && m.cpf && m.cpf.replace(/\D/g, '') === cpfLimpo;
      return (nomeIgual || cpfIgual) && (!editingMember || m.id !== editingMember.id);
    });

    if (duplicado) { alert('ERRO: Já existe um membro com este Nome ou CPF cadastrado.'); return; }
    
    const enderecoFinal = formMember.endereco.trim() || `${formMember.rua}, ${formMember.numero || 'S/N'} - ${formMember.bairro}, ${formMember.cidade} - ${formMember.estado} (CEP: ${formMember.cep})`;

    const payload = {
      codigo_igreja: loggedUser.codigo_igreja,
      nome: formMember.nome.trim(),
      tipo_cadastro: formMember.tipo_cadastro,
      cpf: formMember.cpf.trim() || null,
      rg: formMember.rg.trim() || null,
      data_nascimento: formMember.data_nascimento || null,
      celular_principal: formMember.celular_principal.trim() || null,
      email: formMember.email.trim() || null,
      estado_civil: formMember.estado_civil || null,
      cep: formMember.cep.trim() || null,
      rua: formMember.rua.trim() || null,
      numero: formMember.numero.trim() || null,
      bairro: formMember.bairro.trim() || null,
      cidade: formMember.cidade.trim() || null,
      estado: formMember.estado.trim() || null,
      endereco: enderecoFinal,
      foto_url: formMember.foto_url.trim() || null,
      ministerio_id: formMember.ministerio_id || null
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

      await carregarMembros(loggedUser.codigo_igreja);

      const destino = retornarParaTab;
      setShowMemberModal(false);
      setRetornarParaTab(null);
      if (destino) setActiveTab(destino as any);
    } catch (err: any) {
      alert('Erro ao gravar membro: ' + err.message);
    }
  };

  const salvarEvolucaoMinisterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editingMember.id) return;

    try {
      const { error } = await supabase
        .from('members')
        .update({ ministerio_id: novoMinisterioEvolucao || null })
        .eq('id', editingMember.id);

      if (error) throw error;
      alert('Evolução ministerial salva com sucesso!');
      await carregarMembros(loggedUser.codigo_igreja);
      setShowMemberModal(false);
    } catch (err: any) {
      alert('Erro ao atualizar evolução ministerial: ' + err.message);
    }
  };

  const handleAtualizarPermissaoUsuario = async (userId: string, campo: 'permissao_mobile' | 'permissao_computador', valorAtual: boolean) => {
    const senhaAdmin = prompt('Digite a senha de ADMINISTRADOR para alterar as permissões de acesso deste usuário:');
    if (!senhaAdmin) return;
    if (senhaAdmin !== loggedUser.senha) {
      alert('Senha incorreta. Apenas o administrador pode alterar esta função.');
      return;
    }

    const novoValor = !valorAtual;
    try {
      const { error } = await supabase.from('usuarios').update({ [campo]: novoValor }).eq('id', userId);
      if (error) throw error;
      alert('Permissão atualizada com sucesso!');
      const { data: uData } = await supabase.from('usuarios').select('*').eq('codigo_igreja', loggedUser.codigo_igreja);
      setUsuariosList(uData || []);
    } catch (err: any) {
      alert('Erro ao atualizar permissão: ' + err.message);
    }
  };

  const deletarMembrosSelecionados = async () => {
    if (selecionados.length === 0) { alert('Selecione pelo menos um membro para excluir.'); return; }
    const motivo = prompt('Informe o motivo da exclusão em massa:');
    if (!motivo) return;
    const senhaInformada = prompt('Digite a senha de administrador para confirmar a exclusão de ' + selecionados.length + ' membros:');
    if (senhaInformada !== loggedUser?.senha) { alert('Senha incorreta. Exclusão cancelada.'); return; }

    try {
      const { error } = await supabase.from('members').delete().in('id', selecionados);
      if (error) throw error;
      alert(`Membros excluídos com sucesso! Motivo: "${motivo}"`);
      setSelecionados([]);
      await carregarMembros(loggedUser.codigo_igreja);
    } catch (err: any) {
      alert('Erro ao excluir membros: ' + err.message);
    }
  };

  const handleDeleteMember = async (id: any) => {
    const senhaInformada = prompt('Digite a senha de administrador para excluir este membro:');
    if (!senhaInformada) return;
    if (senhaInformada !== loggedUser.senha) { alert('Senha incorreta. Exclusão cancelada.'); return; }

    try {
      const { error } = await supabase.from('members').delete().eq('id', id);
      if (error) throw error;
      alert('Membro excluído com sucesso!');
      setShowMemberModal(false);
      await carregarMembros(loggedUser.codigo_igreja);
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
    setShowAgendaModal(true);
  };

  const handleOpenEditAgenda = (c: any) => {
    setEditingCompromisso(c);
    setFormAgendaTitulo(c.titulo || '');
    setFormAgendaData(c.data_compromisso || '');
    setFormAgendaHoraInicio(c.hora_compromisso || '');
    setFormAgendaHoraFim(c.hora_fim || '');
    setFormAgendaMembroId(c.responsavel ? String(c.responsavel) : ''); 
    const comentarioLimpo = c.descricao ? (c.descricao.includes('—') ? c.descricao.split('—').pop()?.trim() : c.descricao) : '';
    setFormAgendaComentario(comentarioLimpo);
    setShowAgendaModal(true);
  };

  const handleSaveAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAgendaTitulo.trim() || !formAgendaData.trim()) { alert('Preencha pelo menos o Título e a Data do compromisso.'); return; }
  
    const payload: any = {
      codigo_igreja: loggedUser.codigo_igreja,
      titulo: formAgendaTitulo.trim(),
      data_compromisso: formAgendaData,
      hora_compromisso: formAgendaHoraInicio || '00:00',
      hora_fim: formAgendaHoraFim || '00:00',
      responsavel: formAgendaMembroId && formAgendaMembroId !== "" ? parseInt(formAgendaMembroId, 10) : null, 
      descricao: formAgendaComentario.trim()
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
    } catch (err: any) { alert('Erro ao salvar: ' + err.message); }
  };

  const handleDeleteAgenda = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este compromisso?')) return;
    try {
      const { error } = await supabase.from('agenda_compromissos').delete().eq('id', id);
      if (error) throw error;
      alert('Compromisso excluído com sucesso!');
      setShowAgendaModal(false);
      carregarAgenda(loggedUser.codigo_igreja);
    } catch (err: any) { alert('Erro ao excluir compromisso: ' + err.message); }
  };

  const abrirModalCelula = (c?: any) => {
    if (c) {
      setEditingCelula(c);
      setFormCelNome(c.nome || '');
      setFormCelLider(c.lider_id ? String(c.lider_id) : '');
      setFormCelVice(c.vice_id ? String(c.vice_id) : '');
      setFormCelAnfitriao(c.anfitriao_id ? String(c.anfitriao_id) : '');
      setFormCelDia(c.dia_semana || 'Quarta-feira');
      setFormCelHora(c.horario || '19:30');
      setFormCelCep(c.cep || '');
      setFormCelRua(c.rua || '');
      setFormCelNumero(c.numero || '');
      setFormCelBairro(c.bairro || '');
      setFormCelCidade(c.cidade || '');
      setFormCelParticipantes(Array.isArray(c.participantes) ? c.participantes : []);
    } else {
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
    }
    setFormCelNovoParticipante('');
    setShowCelulaModal(true);
  };

  const handleAddParticipante = () => {
    if (!formCelNovoParticipante) return;
    if (formCelParticipantes.includes(formCelNovoParticipante)) { alert('Este membro já está adicionado na célula.'); return; }
    setFormCelParticipantes([...formCelParticipantes, formCelNovoParticipante]);
    setFormCelNovoParticipante('');
  };

  const handleRemoveParticipante = (membroId: string) => {
    setFormCelParticipantes(formCelParticipantes.filter(id => id !== membroId));
  };

  const salvarCelula = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCelNome.trim()) { alert('O nome da célula é obrigatório.'); return; }

    const enderecoCompleto = `${formCelRua}, ${formCelNumero || 'S/N'} - ${formCelBairro}, ${formCelCidade} (CEP: ${formCelCep})`;

    const payload = {
      codigo_igreja: loggedUser.codigo_igreja,
      nome: formCelNome.trim(),
      lider_id: formCelLider && formCelLider !== "" ? parseInt(formCelLider, 10) : null,
      vice_id: formCelVice && formCelVice !== "" ? parseInt(formCelVice, 10) : null,
      anfitriao_id: formCelAnfitriao && formCelAnfitriao !== "" ? parseInt(formCelAnfitriao, 10) : null,
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
      if (editingCelula && editingCelula.id) {
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
    } catch (err: any) { alert('Erro ao salvar célula: ' + err.message); }
  };

  const handleDeleteCelula = async (celulaId: string) => {
    const senhaInformada = prompt('Digite a senha de administrador para excluir esta célula:');
    if (!senhaInformada) return;
    if (senhaInformada !== loggedUser.senha) { alert('Senha incorreta.'); return; }

    try {
      const { error } = await supabase.from('celulas').delete().eq('id', celulaId);
      if (error) throw error;
      alert('Célula excluída com sucesso!');
      setShowCelulaModal(false);
      carregarCelulas(loggedUser.codigo_igreja);
    } catch (err: any) { alert('Erro ao excluir: ' + err.message); }
  };

  const handleSaveSetor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSetorNome.trim()) { alert('Informe o nome do setor.'); return; }
    const payload = {
      codigo_igreja: loggedUser.codigo_igreja,
      nome: formSetorNome.trim(),
      lider_id: formSetorLider && formSetorLider !== "" ? parseInt(formSetorLider, 10) : null
    };
    try {
      const { error } = await supabase.from('setores').insert([payload]);
      if (error) throw error;
      alert('Setor cadastrado com sucesso!');
      setShowSetorModal(false);
      setFormSetorNome('');
      setFormSetorLider('');
      carregarSetores(loggedUser.codigo_igreja);
    } catch (err: any) { alert('Erro: ' + err.message); }
  };

  const handleSaveRede = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRedeNome.trim()) { alert('Informe o nome da rede.'); return; }
    const payload = {
      codigo_igreja: loggedUser.codigo_igreja,
      nome: formRedeNome.trim(),
      lider_id: formRedeLider && formRedeLider !== "" ? parseInt(formRedeLider, 10) : null
    };
    try {
      const { error } = await supabase.from('redes').insert([payload]);
      if (error) throw error;
      alert('Rede cadastrada com sucesso!');
      setShowRedeModal(false);
      setFormRedeNome('');
      setFormRedeLider('');
      carregarRedes(loggedUser.codigo_igreja);
    } catch (err: any) { alert('Erro: ' + err.message); }
  };

  const handleSaveConta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNomeConta.trim()) { alert('Informe o nome da conta.'); return; }
    
    const payload = {
      codigo_igreja: loggedUser.codigo_igreja,
      nome_conta: formNomeConta.trim().toUpperCase(),
      codigo_conta: formTipoConta
    };
  
    try {
      const { error } = await supabase.from('contas_financeiras').insert([payload]);
      if (error) {
        alert('Erro ao salvar conta: ' + error.message);
        return;
      }
      
      alert('Conta cadastrada com sucesso!');
      setShowContaModal(false);
      setFormNomeConta('');
      carregarFinanceiro(loggedUser.codigo_igreja);
    } catch (err: any) { 
      alert('Erro: ' + err.message); 
    }
  };

  const handleSaveLancamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLancData || !formLancValor || !formLancContaDebitoId || !formLancContaCreditoId) {
      alert('Preencha a data, o valor, a conta a débito e a conta a crédito.');
      return;
    }

    const payload = {
      codigo_igreja: loggedUser.codigo_igreja,
      data_lancamento: formLancData,
      valor: parseFloat(formLancValor),
      conta_debito_id: formLancContaDebitoId,
      conta_credito_id: formLancContaCreditoId,
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
      setFormLancContaDebitoId('');
      setFormLancContaCreditoId('');
      carregarFinanceiro(loggedUser.codigo_igreja);
    } catch (err: any) { alert('Erro: ' + err.message); }
  };

  const handleDeleteLancamento = async (lancamentoId: any) => {
    const senhaInformada = prompt('Digite a senha de administrador para excluir este lançamento:');
    if (!senhaInformada) return;
    if (senhaInformada !== loggedUser.senha) { alert('Senha incorreta.'); return; }

    try {
      const { error } = await supabase.from('lancamentos_financeiros').delete().eq('id', lancamentoId);
      if (error) throw error;
      alert('Lançamento excluído com sucesso!');
      carregarFinanceiro(loggedUser.codigo_igreja);
    } catch (err: any) { alert('Erro: ' + err.message); }
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
    } catch (err: any) { alert('Erro: ' + err.message); }
  };

  const handlePrint = () => { window.print(); };

  const membrosVisiveis =
  loggedUser?.perfil_acesso === 'celula'
    ? members.filter((m: any) => membroPodeAcessarCelula(m))
    : members;

const filteredMembers = membrosVisiveis.filter((m: any) =>
  !searchTerm ||
  m.nome?.toLowerCase().includes(searchTerm.toLowerCase())
);

  let saldoAcumulado = 0;
  const lancamentosComSaldo = lancamentosCorrente.map((l: any) => {
    const valor = parseFloat(l.valor || 0);
    const isCredito = l.tipo === 'entrada';
    if (isCredito) saldoAcumulado += valor; else saldoAcumulado -= valor;
    return { ...l, isCredito, valorNum: valor, saldoAtual: saldoAcumulado };
  });

  const saldoFinalRelatorio = lancamentosComSaldo.length > 0 ? lancamentosComSaldo[lancamentosComSaldo.length - 1].saldoAtual : 0;

 /// ==========================================
// 5. TELA DE LOGIN DO SISTEMA
// ==========================================
if (!isLoggedIn) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-black text-blue-900">
            BRSYSTEM
          </h1>

          <p className="text-xs text-slate-400 font-bold tracking-widest uppercase">
            Tecnologia para Gestão
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setLoginModo('mobile');
              setLoginUsuario('');
              setLoginSenha('');
            }}
            className={`py-2.5 rounded-lg text-xs font-black transition-all ${
              loginModo === 'mobile'
                ? 'bg-blue-900 text-white shadow'
                : 'text-slate-600 hover:bg-white'
            }`}
          >
            1 — MOBILE
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginModo('normal');
              setLoginUsuario('');
              setLoginSenha('');
            }}
            className={`py-2.5 rounded-lg text-xs font-black transition-all ${
              loginModo === 'normal'
                ? 'bg-blue-900 text-white shadow'
                : 'text-slate-600 hover:bg-white'
            }`}
          >
            2 — NORMAL
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-600 ml-1">
              Código da Igreja
            </label>

            <input
              type="text"
              value={loginCodigo}
              onChange={(e) =>
                setLoginCodigo(e.target.value.toUpperCase())
              }
              className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 ml-1">
              {loginModo === 'mobile'
                ? 'CPF do Líder ou Vice-líder'
                : 'Usuário'}
            </label>

            <input
              type="text"
              placeholder={
                loginModo === 'mobile'
                  ? '000.000.000-00'
                  : 'Digite seu usuário'
              }
              maxLength={loginModo === 'mobile' ? 14 : undefined}
              value={loginUsuario}
              onChange={(e) =>
                setLoginUsuario(
                  loginModo === 'mobile'
                    ? aplicarMascaraCpf(e.target.value)
                    : e.target.value
                )
              }
              className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 ml-1">
              Senha
            </label>

            <input
              type="password"
              placeholder={
                loginModo === 'mobile'
                  ? 'Senha padrão: 123456'
                  : 'Digite sua senha'
              }
              value={loginSenha}
              onChange={(e) => setLoginSenha(e.target.value)}
              className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900"
            />
          </div>

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full py-3.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow-lg cursor-pointer transition-all disabled:opacity-60"
          >
            {loginLoading ? 'Entrando...' : 'Entrar no Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}
console.log('DEBUG loginModo:', loginModo, 'isLoggedIn:', isLoggedIn);
// ==========================================
// 6. ESTRUTURA PRINCIPAL E HEADER
// ==========================================

return (
  <div className="min-h-screen bg-slate-100 flex flex-col relative overflow-x-hidden">

    {isLoggedIn && loginModo === 'normal' && (
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm relative z-50 print:hidden">
        <div className="max-w-7xl mx-auto flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('relatorios')}
            className="px-4 py-2 bg-blue-900 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            📊 Relatórios
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('membros')}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-blue-100 cursor-pointer"
          >
            👥 Membros
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('usuarios')}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-blue-100 cursor-pointer"
          >
            👤 Usuários
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fornecedores')}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-blue-100 cursor-pointer"
          >
            🚚 Fornecedores
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ministerios')}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-blue-100 cursor-pointer"
          >
            🙌 Ministérios
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('celulas')}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-blue-100 cursor-pointer"
          >
            🌱 Células
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('agenda')}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-blue-100 cursor-pointer"
          >
            📅 Agenda
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('financeiro')}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-blue-100 cursor-pointer"
          >
            💰 Financeiro
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('igreja')}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-blue-100 cursor-pointer"
          >
            🏛️ Igreja
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('projetos')}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-blue-100 cursor-pointer"
          >
            🚀 Projetos
          </button>

          <button
            type="button"
            onClick={() => {
              setIsLoggedIn(false);
              setLoggedUser(null);
              setActiveTab('relatorios');
            }}
            className="ml-auto px-4 py-2 bg-rose-50 text-rose-700 font-bold text-xs rounded-xl hover:bg-rose-600 hover:text-white cursor-pointer"
          >
            Sair
          </button>
        </div>
      </header>
    )}

    <main className="max-w-7xl w-full mx-auto p-6 flex-1 relative z-10 print:p-0 print:max-w-none">
      {/* 7. CORPO PRINCIPAL E EXIBIÇÃO DE ABAS      */}
      {/* ========================================== */}
      
        {/* ========================================== */}
        {/* 7.1 MÓDULO: MEMBROS MOBILE                 */}
        {/* ========================================== */}
        {activeTab === 'membros_mobile' && ehUsuarioCelula && (
          <div className="max-w-md mx-auto bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden flex flex-col my-2">
            <div className="bg-blue-900 text-white p-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black">📱 Cadastro Mobile Compacto</h2>
                <p className="text-[10px] text-blue-200">Versão otimizada para toque e telas verticais</p>
              </div>
            </div>
            <div className="p-4 space-y-4 flex-1">
              <div className="flex gap-2">
                <input type="text" placeholder="Buscar membro..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:outline-none focus:border-blue-900" />
                <button onClick={() => abrirModalMembro()} className="px-3 py-2 bg-blue-900 text-white font-bold text-xs rounded-xl shadow-sm whitespace-nowrap cursor-pointer">+ Novo</button>
              </div>
              <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
                {filteredMembers.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-400">Nenhum membro cadastrado.</p>
                ) : (
                  filteredMembers.map((m: any) => (
                    <div key={m.id} onClick={() => abrirModalMembro(m)} className="p-3 bg-slate-50 hover:bg-blue-50/50 border rounded-2xl flex items-center justify-between cursor-pointer transition-all">
                      <div className="flex items-center gap-3">
                        {m.foto_url ? (
                          <img src={m.foto_url} alt={m.nome} className="w-10 h-10 rounded-full object-cover border" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                            {m.nome?.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs">{m.nome}</h4>
                          <p className="text-[10px] text-slate-500 font-mono">{m.celular_principal || 'Sem celular'} • {m.tipo_cadastro}</p>
                        </div>
                      </div>
                      <span className="text-xs text-blue-900 font-bold">Editar ➔</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 7.2 MÓDULO: MEMBROS COMPUTADOR             */}
        {/* ========================================== */}
        {activeTab === 'membros' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Cadastro de Membros ({filteredMembers.length})</h2>
                <p className="text-xs text-slate-500">Clique na linha do membro para alterar os dados completos ou use o menu para o modo Mobile.</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => {
                  if (loggedUser.usuario !== 'admin' && !loggedUser.permissao_mobile) {
                    alert('Acesso negado. O administrador não autorizou o uso do módulo Mobile para este usuário.');
                    return;
                  }
                  setActiveTab('membros_mobile');
                }} className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm cursor-pointer whitespace-nowrap">
                  📱 Mudar para Modo Mobile
                </button>
                <input type="text" placeholder="Buscar por Nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:w-64 rounded-xl border border-slate-300 p-2 text-sm focus:outline-none focus:border-blue-900" />
                <button onClick={() => abrirModalMembro()} className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-sm cursor-pointer whitespace-nowrap">+ Novo Membro</button>
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
                      <th className="py-3 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm text-slate-700">
                    {filteredMembers.length === 0 ? (
                      <tr><td colSpan={7} className="py-6 text-center text-slate-400">Nenhum membro encontrado.</td></tr>
                    ) : (
                      filteredMembers.map((m: any) => (
                        <tr key={m.id} className="hover:bg-blue-50/50 transition-colors">
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
                          <td className="py-3 px-4 text-center">
                            <button onClick={() => abrirModalMembro(m)} className="px-3 py-1 bg-blue-50 hover:bg-blue-900 hover:text-white text-blue-900 font-bold text-xs rounded-lg transition-all cursor-pointer">
                              Editar
                            </button>
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

        {/* ========================================== */}
        {/* 7.3 MÓDULO: MINISTÉRIOS                    */}
        {/* ========================================== */}
        {activeTab === 'ministerios' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">🙌 Gestão de Ministérios ({ministeriosList.length})</h2>
                <p className="text-xs text-slate-500">Cadastre, edite ou exclua os ministérios da igreja.</p>
              </div>
              <button onClick={() => { setEditingMinisterio(null); setFormMinisterioNome(''); setFormMinisterioDesc(''); setShowMinisterioModal(true); }} className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-sm cursor-pointer">
                + Novo Ministério
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-600 font-semibold">
                    <th className="p-3">Nome do Ministério</th>
                    <th className="p-3">Descrição</th>
                    <th className="p-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700">
                  {ministeriosList.length === 0 ? (
                    <tr><td colSpan={3} className="py-6 text-center text-slate-400">Nenhum ministério cadastrado.</td></tr>
                  ) : (
                    ministeriosList.map((min: any) => (
                      <tr key={min.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{min.nome}</td>
                        <td className="p-3 text-slate-600">{min.descricao || '-'}</td>
                        <td className="p-3 text-center space-x-2">
                          <button onClick={() => { setEditingMinisterio(min); setFormMinisterioNome(min.nome); setFormMinisterioDesc(min.descricao || ''); setShowMinisterioModal(true); }} className="px-3 py-1 bg-blue-50 hover:bg-blue-900 hover:text-white text-blue-900 font-bold text-xs rounded-lg transition-all cursor-pointer">
                            Editar
                          </button>
                          <button onClick={() => deletarMinisterio(min.id)} className="px-3 py-1 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 font-bold text-xs rounded-lg transition-all cursor-pointer">
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 7.4 MÓDULO: USUÁRIOS E PERMISSÕES          */}
        {/* ========================================== */}
        {activeTab === 'usuarios' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <div className="border-b pb-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">👤 Usuários e Permissões de Acesso ({usuariosList.length})</h2>
                <p className="text-xs text-slate-500">Apenas o administrador pode autorizar o acesso aos módulos Mobile e Computador.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-slate-600 text-sm font-semibold">
                    <th className="py-3 px-4">Nome de Usuário</th>
                    <th className="py-3 px-4">Login</th>
                    <th className="py-3 px-4 text-center">Permissão Mobile</th>
                    <th className="py-3 px-4 text-center">Permissão Computador</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm text-slate-700">
                  {usuariosList.map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{u.nome_usuario}</td>
                      <td className="py-3 px-4 font-mono">{u.usuario}</td>
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => handleAtualizarPermissaoUsuario(u.id, 'permissao_mobile', u.permissao_mobile)} className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all ${u.permissao_mobile ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
                          {u.permissao_mobile ? '✔ Autorizado Mobile' : '✖ Bloqueado'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => handleAtualizarPermissaoUsuario(u.id, 'permissao_computador', u.permissao_computador)} className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all ${u.permissao_computador !== false ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
                          {u.permissao_computador !== false ? '✔ Autorizado PC' : '✖ Bloqueado'}
                        </button>
                      </td>
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

        {/* ========================================== */}
        {/* 7.5 MÓDULO: FORNECEDORES                   */}
        {/* ========================================== */}
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

        {/* ========================================== */}
        {/* 7.6 MÓDULO: RELATÓRIOS                     */}
        {/* ========================================== */}
        {activeTab === 'relatorios' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 print:border-none print:shadow-none print:p-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 print:hidden">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">📊 Relatórios e Listagens</h2>
                <p className="text-xs text-slate-500">Geração de relatórios gerenciais e aniversariantes.</p>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl flex-wrap">
                <button onClick={() => setRelatorioSubTab('geral')} className={`px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${relatorioSubTab === 'geral' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-white'}`}>Geral</button>
                <button onClick={() => setRelatorioSubTab('aniversariantes_dia')} className={`px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${relatorioSubTab === 'aniversariantes_dia' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-white'}`}>Aniversariantes do Dia</button>
                <button onClick={() => setRelatorioSubTab('aniversariantes_mes')} className={`px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${relatorioSubTab === 'aniversariantes_mes' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-white'}`}>Aniversariantes do Mês</button>
                <button onClick={() => setRelatorioSubTab('completa')} className={`px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${relatorioSubTab === 'completa' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-white'}`}>Lista Completa</button>
              </div>
            </div>

            {relatorioSubTab === 'geral' && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 text-lg">Visão Geral dos Membros</h3>
                <p className="text-sm text-slate-600">Total de membros cadastrados: <strong className="text-blue-900">{members.length}</strong></p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <div className="p-4 bg-blue-50 border rounded-2xl">
                    <span className="text-xs font-bold text-blue-700 uppercase">Total de Membros</span>
                    <p className="text-2xl font-black text-blue-950 mt-1">{members.filter(m => m.tipo_cadastro === 'Membro').length}</p>
                  </div>
                  <div className="p-4 bg-emerald-50 border rounded-2xl">
                    <span className="text-xs font-bold text-emerald-700 uppercase">Congregados & Visitantes</span>
                    <p className="text-2xl font-black text-emerald-950 mt-1">{members.filter(m => m.tipo_cadastro !== 'Membro').length}</p>
                  </div>
                  <div className="p-4 bg-purple-50 border rounded-2xl">
                    <span className="text-xs font-bold text-purple-700 uppercase">Aniversariantes deste Mês</span>
                    <p className="text-2xl font-black text-purple-950 mt-1">{aniversariantesDoMes.length}</p>
                  </div>
                </div>
              </div>
            )}

            {relatorioSubTab === 'aniversariantes_dia' && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 text-lg">🎂 Aniversariantes do Dia ({aniversariantesDoDia.length})</h3>
                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b text-slate-600">
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
                <h3 className="font-bold text-slate-800 text-lg">📅 Aniversariantes do Mês ({aniversariantesDoMes.length})</h3>
                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b text-slate-600">
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
                <div className="flex justify-between items-center print:hidden">
                  <h3 className="font-bold text-slate-800 text-lg">Lista Completa ({members.length})</h3>
                  {selecionados.length > 0 && (
                    <button onClick={deletarMembrosSelecionados} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-all">
                      🗑️ Deletar {selecionados.length} Selecionados
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="p-3 text-center w-12 print:hidden">
                          <input type="checkbox" onChange={(e) => setSelecionados(e.target.checked ? members.map(m => String(m.id)) : [])} checked={members.length > 0 && selecionados.length === members.length} className="cursor-pointer" />
                        </th>
                        <th className="p-3">Nome</th>
                        <th className="p-3">CPF</th>
                        <th className="p-3">E-mail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-700">
                      {members.map((m: any) => (
                        <tr key={m.id} className="hover:bg-slate-50">
                          <td className="p-3 text-center print:hidden">
                            <input type="checkbox" checked={selecionados.includes(String(m.id))} onChange={(e) => {
                              if (e.target.checked) setSelecionados([...selecionados, String(m.id)]);
                              else setSelecionados(selecionados.filter(id => id !== String(m.id)));
                            }} className="cursor-pointer" />
                          </td>
                          <td className="p-3 font-bold">{m.nome}</td>
                          <td className="p-3 font-mono">{m.cpf || '-'}</td>
                          <td className="p-3">{m.email || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* 7.7 MÓDULO: CÉLULAS, SETORES E REDES       */}
        {/* ========================================== */}
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
                <button onClick={() => abrirModalCelula()} className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-sm cursor-pointer whitespace-nowrap">+ Nova Célula</button>
                <button onClick={() => setShowSetorModal(true)} className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm cursor-pointer whitespace-nowrap">+ Novo Setor</button>
                <button onClick={() => setShowRedeModal(true)} className="px-4 py-2 bg-indigo-800 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-sm cursor-pointer whitespace-nowrap">+ Nova Rede</button>
              </div>
            </div>

            {celulasSubTab === 'lista' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base mb-3">📁 Setores Cadastrados ({setoresList.length})</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {setoresList.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Nenhum setor cadastrado.</p>
                      ) : (
                        setoresList.map((s: any) => {
                          const liderObj = members.find((m: any) => String(m.id) === String(s.lider_id));
                          return (
                            <div key={s.id} className="p-3 bg-white border rounded-xl flex justify-between items-center text-xs">
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
                    <h3 className="font-bold text-slate-800 text-base mb-3">🌐 Redes Cadastradas ({redesList.length})</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {redesList.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Nenhuma rede cadastrada.</p>
                      ) : (
                        redesList.map((r: any) => {
                          const liderObj = members.find((m: any) => String(m.id) === String(r.lider_id));
                          return (
                            <div key={r.id} className="p-3 bg-white border rounded-xl flex justify-between items-center text-xs">
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
                              <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="w-full text-center py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5">
                                📍 Abrir Localização no Google Maps
                              </a>
                              <div className="flex gap-2">
                                <button onClick={() => abrirModalCelula(c)} className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer">
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
                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b text-slate-600">
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
                          <span>📍 <strong>Endereço:</strong> {c.endereco || 'Não informado'}</span>
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

        {/* ========================================== */}
        {/* 7.8 MÓDULO: CADASTRO DA IGREJA             */}
        {/* ========================================== */}
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

        {/* ========================================== */}
        {/* 7.9 MÓDULO: AGENDA E COMPROMISSOS          */}
        {/* ========================================== */}
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
                      const comentarioExibicao = c.descricao ? (c.descricao.includes('—') ? c.descricao.split('—').pop()?.trim() : c.descricao) : 'Nenhum comentário registrado.';

                      return (
                        <div key={c.id} className="p-5 border rounded-2xl shadow-sm space-y-3 bg-white border-slate-200 flex flex-col justify-between">
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
                            <button onClick={() => handleOpenEditAgenda(c)} className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer">
                              Editar / Ver Detalhes
                            </button>
                            <button onClick={() => handleDeleteAgenda(c.id)} className="px-3 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer" title="Excluir Compromisso">
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

                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b text-slate-600">
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

        {/* ========================================== */}
        {/* 7.10 MÓDULO: FINANCEIRO E CONTÁBIL         */}
        {/* ========================================== */}
        {activeTab === 'financeiro' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 print:border-none print:shadow-none print:p-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 print:hidden">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">💰 Controle Financeiro & Contábil</h2>
                <p className="text-xs text-slate-500">Gestão de contas, extratos, lançamentos e plano de contas.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex bg-slate-100 p-1 rounded-xl flex-wrap">
                  <button onClick={() => setFinanceiroSubTab('extrato')} className={`px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${financeiroSubTab === 'extrato' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-white'}`}>Extrato Geral</button>
                  <button onClick={() => setFinanceiroSubTab('contas')} className={`px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${financeiroSubTab === 'contas' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-white'}`}>Contas</button>
                  <button onClick={() => setFinanceiroSubTab('plano_contas')} className={`px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${financeiroSubTab === 'plano_contas' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-white'}`}>Plano de Contas</button>
                  <button onClick={() => setFinanceiroSubTab('relatorio')} className={`px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${financeiroSubTab === 'relatorio' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-white'}`}>Relatório</button>
                </div>
                <button onClick={() => setShowLancamentoModal(true)} className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-sm cursor-pointer whitespace-nowrap">+ Novo Lançamento</button>
                <button onClick={() => setShowContaModal(true)} className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm cursor-pointer whitespace-nowrap">+ Nova Conta</button>
              </div>
            </div>

            {financeiroSubTab === 'plano_contas' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 text-lg">Plano de Contas Contábil</h3>
                  <button onClick={() => setShowPlanoContaModal(true)} className="px-4 py-2 bg-blue-900 text-white text-xs font-bold rounded-xl cursor-pointer">+ Nova Conta Contábil</button>
                </div>
                <div className="overflow-x-auto border rounded-xl bg-white">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 border-b">
                      <tr>
                        <th className="p-3 font-bold">Código</th>
                        <th className="p-3 font-bold">Conta Pai</th>
                        <th className="p-3 font-bold">Conta</th>
                        <th className="p-3 font-bold">Natureza</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-700">
                      {planoContasContabil && planoContasContabil.length > 0 ? (
                        planoContasContabil.map((pc) => (
                          <tr key={pc.id || pc.codigo_conta} className="hover:bg-slate-50">
                            <td className="p-3 font-mono text-blue-900 font-bold">{pc.codigo_conta}</td>
                            <td className="p-3 font-mono text-slate-500">{pc.conta_pai || '-'}</td>
                            <td className="p-3 font-semibold text-slate-900">{pc.nome_conta}</td>
                            <td className="p-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                pc.tipo_natureza === 'Receita' ? 'bg-emerald-100 text-emerald-800' :
                                pc.tipo_natureza === 'Despesa' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'
                              }`}>
                                {pc.tipo_natureza}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-400">
                            Nenhuma conta contábil encontrada para esta igreja.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

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
                              <td className="p-3 font-mono font-bold text-rose-600">{!l.isCredito ? `R$ ${l.valorNum.toFixed(2)}` : '-'}</td>
                              <td className="p-3 font-mono font-bold text-emerald-600">{l.isCredito ? `R$ ${l.valorNum.toFixed(2)}` : '-'}</td>
                              <td className="p-3 font-bold text-slate-900">{l.descricao}</td>
                              <td className={`p-3 font-mono font-bold ${l.saldoAtual >= 0 ? 'text-blue-950' : 'text-rose-600'}`}>R$ {l.saldoAtual.toFixed(2)}</td>
                              <td className="p-3 text-center print:hidden">
                                <div className="flex items-center justify-center gap-2">
                                  <button onClick={() => handleDeleteLancamento(l.id)} className="px-2.5 py-1 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white font-bold rounded-lg transition-all cursor-pointer text-[11px]" title="Excluir lançamento">
                                    Excluir
                                  </button>
                                  <label className="px-2.5 py-1 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold rounded-lg transition-all cursor-pointer text-[11px] inline-flex items-center gap-1" title="Carregar comprovante">
                                    📁 Anexar
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAnexarComprovante(l.id, e)} />
                                  </label>
                                  {l.comprovante_url && (
                                    <a href={l.comprovante_url} target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-bold text-[11px] underline">
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
                          const lancamentosDaConta = lancamentosCorrente.filter((l: any) => String(l.conta_id) === String(c.id) || !l.conta_id);
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

        {/* ========================================== */}
        {/* 7.11 MÓDULO: PROJETOS                      */}
        {/* ========================================== */}
        {activeTab === 'projetos' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  🚀 Gestão de Projetos: {
                    projetoAtivo === 'missoes' ? 'Missões' :
                    projetoAtivo === 'proj_1' ? 'Proj 1 - Ilimitados' :
                    projetoAtivo === 'proj_2' ? 'Proj 2 - Casais' :
                    projetoAtivo === 'proj_3' ? 'Proj 3 - Escola de Célula' :
                    projetoAtivo === 'proj_4' ? 'Proj 4 - Escola de Líderes' : 'Proj 5 - Escola de Pastores'
                  }
                </h2>
                <p className="text-xs text-slate-500">Inscrições e participantes vinculados a este projeto.</p>
              </div>
              <button onClick={() => {
                setEditingInscricao(null);
                setFormInscricaoNome('');
                setFormInscricaoCpf('');
                setFormInscricaoTel('');
                setFormInscricaoEmail('');
                setFormInscricaoMembroId('');
                setShowInscricaoModal(true);
              }} className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-sm cursor-pointer">
                + Nova Inscrição
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-600 font-semibold">
                    <th className="p-3">Nome</th>
                    <th className="p-3">CPF</th>
                    <th className="p-3">Telefone</th>
                    <th className="p-3">E-mail</th>
                    <th className="p-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700">
                  {inscricoesList.filter(i => i.tipo_projeto === projetoAtivo).length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-400">Nenhuma inscrição registrada para este projeto.</td></tr>
                  ) : (
                    inscricoesList.filter(i => i.tipo_projeto === projetoAtivo).map((insc: any) => (
                      <tr key={insc.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{insc.nome}</td>
                        <td className="p-3 font-mono">{insc.cpf || '-'}</td>
                        <td className="p-3">{insc.telefone || '-'}</td>
                        <td className="p-3">{insc.email || '-'}</td>
                        <td className="p-3 text-center">
                          <button onClick={async () => {
                            if (!window.confirm('Excluir esta inscrição?')) return;
                            const { error } = await supabase.from('inscricoes_projetos').delete().eq('id', insc.id);
                            if (error) { alert('Erro: ' + error.message); return; }
                            carregarInscricoes(loggedUser.codigo_igreja);
                          }} className="px-2.5 py-1 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 font-bold text-xs rounded-lg transition-all cursor-pointer">
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* ========================================== */}
      {/* 8. MODAIS DE CADASTRO E EDIÇÃO             */}
      {/* ========================================== */}

      {/* 8.1 MODAL: PLANO DE CONTAS */}
      {showPlanoContaModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-lg font-black text-blue-900">Cadastrar Conta Contábil</h3>
              <button onClick={() => setShowPlanoContaModal(false)} className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl cursor-pointer">✕</button>
            </div>
            <form onSubmit={salvarPlanoConta} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 ml-1">Código da Conta *</label>
                <input type="text" required value={formPlanoCodigo} onChange={(e) => setFormPlanoCodigo(e.target.value)} placeholder="Ex: 1.1.1.01" className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900 font-mono" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 ml-1">Nome da Conta *</label>
                <input type="text" required value={formPlanoNome} onChange={(e) => setFormPlanoNome(e.target.value.toUpperCase())} placeholder="Ex: Dízimos e Ofertas" className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900 uppercase" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 ml-1">Natureza *</label>
                <select value={formPlanoNatureza} onChange={(e) => setFormPlanoNatureza(e.target.value)} className="w-full rounded-xl border p-3 text-sm bg-white focus:outline-none focus:border-blue-900">
                  <option value="Receita">Receita</option>
                  <option value="Despesa">Despesa</option>
                  <option value="Ativo">Ativo</option>
                  <option value="Passivo">Passivo</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowPlanoContaModal(false)} className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-900 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer">Salvar Conta Contábil</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8.2 MODAL: SETORES */}
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
                <input type="text" required value={formSetorNome} onChange={(e) => setFormSetorNome(e.target.value.toUpperCase())} placeholder="Ex: Setor Centro" className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900 uppercase" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 ml-1">Líder do Setor</label>
                <select value={formSetorLider} onChange={(e) => setFormSetorLider(e.target.value)} className="w-full rounded-xl border p-3 text-sm bg-white focus:outline-none focus:border-blue-900">
                  <option value="">Selecione o líder...</option>
                  {members.map((m: any) => (<option key={m.id} value={m.id}>{m.nome}</option>))}
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

      {/* 8.3 MODAL: REDES */}
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
                <input type="text" required value={formRedeNome} onChange={(e) => setFormRedeNome(e.target.value.toUpperCase())} placeholder="Ex: Rede de Casais" className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900 uppercase" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 ml-1">Líder da Rede</label>
                <select value={formRedeLider} onChange={(e) => setFormRedeLider(e.target.value)} className="w-full rounded-xl border p-3 text-sm bg-white focus:outline-none focus:border-blue-900">
                  <option value="">Selecione o líder...</option>
                  {members.map((m: any) => (<option key={m.id} value={m.id}>{m.nome}</option>))}
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

      {/* 8.4 MODAL: LANÇAMENTO FINANCEIRO */}
      {showLancamentoModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-lg font-black text-blue-900">Novo Lançamento (Débito e Crédito)</h3>
              <button onClick={() => setShowLancamentoModal(false)} className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl cursor-pointer">✕</button>
            </div>
            
            <form onSubmit={handleSaveLancamento} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 ml-1">Data *</label>
                <input type="date" required value={formLancData} onChange={(e) => setFormLancData(e.target.value)} className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900" />
              </div>
              <div>
                <label className="text-xs font-bold text-rose-700 ml-1">Conta a Débito (Origem/Saída) *</label>
                <select required value={formLancContaDebitoId} onChange={(e) => setFormLancContaDebitoId(e.target.value)} className="w-full rounded-xl border p-3 text-sm bg-white focus:outline-none focus:border-blue-900 font-bold text-rose-700">
                  <option value="">Selecione a conta a débito...</option>
                  {contasFinanceiras.map((c: any) => (<option key={c.id} value={c.id}>{c.nome_conta} ({c.codigo_conta})</option>))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-emerald-700 ml-1">Conta a Crédito (Destino/Entrada) *</label>
                <select required value={formLancContaCreditoId} onChange={(e) => setFormLancContaCreditoId(e.target.value)} className="w-full rounded-xl border p-3 text-sm bg-white focus:outline-none focus:border-blue-900 font-bold text-emerald-700">
                  <option value="">Selecione a conta a crédito...</option>
                  {contasFinanceiras.map((c: any) => (<option key={c.id} value={c.id}>{c.nome_conta} ({c.codigo_conta})</option>))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 ml-1">Valor (R$) *</label>
                <input type="number" step="0.01" required value={formLancValor} onChange={(e) => setFormLancValor(e.target.value)} placeholder="0.00" className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 ml-1">Descrição / Histórico</label>
                <textarea rows={2} value={formLancObs} onChange={(e) => setFormLancObs(e.target.value.toUpperCase())} placeholder="Detalhes do lançamento..." className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900 uppercase" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowLancamentoModal(false)} className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-900 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer">Salvar Lançamento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8.5 MODAL: CONTA FINANCEIRA */}
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
                <input type="text" required value={formNomeConta} onChange={(e) => setFormNomeConta(e.target.value.toUpperCase())} placeholder="Ex: Banco Sicoob, Caixa Geral" className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900 uppercase" />
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

      {/* 8.6 MODAL: AGENDA */}
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
                <input type="text" required value={formAgendaTitulo} onChange={(e) => setFormAgendaTitulo(e.target.value.toUpperCase())} placeholder="Ex: Visita pastoral ou Reunião" className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900 uppercase" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 ml-1">Responsável pelo Compromisso</label>
                <select value={formAgendaMembroId} onChange={(e) => setFormAgendaMembroId(e.target.value)} className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900 bg-white">
                  <option value="">Selecione o responsável...</option>
                  {members.map((m: any) => (<option key={m.id} value={m.id}>{m.nome} ({m.tipo_cadastro})</option>))}
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
                <label className="text-xs font-bold text-slate-600 ml-1">Comentário / Relatório de como foi</label>
                <textarea rows={3} value={formAgendaComentario} onChange={(e) => setFormAgendaComentario(e.target.value.toUpperCase())} placeholder="Registre os detalhes, observações ou como foi a visita..." className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900 uppercase" />
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                {editingCompromisso ? (
                  <button type="button" onClick={() => handleDeleteAgenda(editingCompromisso.id)} className="px-4 py-2.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white font-bold text-sm rounded-xl transition-all cursor-pointer">
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

      {/* 8.7 MODAL: CÉLULAS */}
      {showCelulaModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-lg font-black text-blue-900">
                {editingCelula ? 'Alterar Célula' : 'Nova Célula'}
              </h3>
              <button onClick={() => setShowCelulaModal(false)} className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer">✕ Fechar</button>
            </div>

            <form onSubmit={salvarCelula} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 ml-1">Nome da Célula *</label>
                <input type="text" required value={formCelNome} onChange={(e) => setFormCelNome(e.target.value.toUpperCase())} placeholder="Ex: Célula Betel" className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900 uppercase" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 ml-1">Líder</label>
                  <select value={formCelLider} onChange={(e) => setFormCelLider(e.target.value)} className="w-full rounded-xl border p-3 text-sm bg-white focus:outline-none focus:border-blue-900">
                    <option value="">Selecione o líder...</option>
                    {members.map((m: any) => (<option key={m.id} value={m.id}>{m.nome}</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 ml-1">Vice-Líder</label>
                  <select value={formCelVice} onChange={(e) => setFormCelVice(e.target.value)} className="w-full rounded-xl border p-3 text-sm bg-white focus:outline-none focus:border-blue-900">
                    <option value="">Selecione o vice...</option>
                    {members.map((m: any) => (<option key={m.id} value={m.id}>{m.nome}</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 ml-1">Anfitrião</label>
                  <select value={formCelAnfitriao} onChange={(e) => setFormCelAnfitriao(e.target.value)} className="w-full rounded-xl border p-3 text-sm bg-white focus:outline-none focus:border-blue-900">
                    <option value="">Selecione o anfitrião...</option>
                    {members.map((m: any) => (<option key={m.id} value={m.id}>{m.nome}</option>))}
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
                    <input type="text" value={formCelRua} onChange={(e) => setFormCelRua(e.target.value.toUpperCase())} placeholder="Nome da rua" className="w-full rounded-xl border p-2.5 text-sm bg-white focus:outline-none focus:border-blue-900 uppercase" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 ml-1">Número</label>
                    <input type="text" value={formCelNumero} onChange={(e) => setFormCelNumero(e.target.value.toUpperCase())} placeholder="Nº" className="w-full rounded-xl border p-2.5 text-sm bg-white focus:outline-none focus:border-blue-900 uppercase" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 ml-1">Bairro</label>
                    <input type="text" value={formCelBairro} onChange={(e) => setFormCelBairro(e.target.value.toUpperCase())} placeholder="Bairro" className="w-full rounded-xl border p-2.5 text-sm bg-white focus:outline-none focus:border-blue-900 uppercase" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 ml-1">Cidade</label>
                    <input type="text" value={formCelCidade} onChange={(e) => setFormCelCidade(e.target.value.toUpperCase())} placeholder="Cidade" className="w-full rounded-xl border p-2.5 text-sm bg-white focus:outline-none focus:border-blue-900 uppercase" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <label className="text-xs font-bold text-slate-700 block">Participantes da Célula</label>
                <div className="flex gap-2">
                  <select value={formCelNovoParticipante} onChange={(e) => setFormCelNovoParticipante(e.target.value)} className="flex-1 rounded-xl border p-2.5 text-sm bg-white focus:outline-none focus:border-blue-900">
                    <option value="">Selecione um membro para adicionar...</option>
                    {members.map((m: any) => (<option key={m.id} value={m.id}>{m.nome}</option>))}
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
                          <button type="button" onClick={() => handleRemoveParticipante(pId)} className="text-rose-600 font-black cursor-pointer">✕</button>
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

      {/* 8.8 MODAL: MINISTÉRIOS */}
      {showMinisterioModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-lg font-black text-blue-900">{editingMinisterio ? 'Editar Ministério' : 'Novo Ministério'}</h3>
              <button onClick={() => setShowMinisterioModal(false)} className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl cursor-pointer">✕</button>
            </div>
            <form onSubmit={salvarMinisterio} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 ml-1">Nome do Ministério *</label>
                <input type="text" required value={formMinisterioNome} onChange={(e) => setFormMinisterioNome(e.target.value.toUpperCase())} placeholder="Ex: Louvor, Diaconato, Infantil" className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900 uppercase" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 ml-1">Descrição / Observações</label>
                <textarea rows={3} value={formMinisterioDesc} onChange={(e) => setFormMinisterioDesc(e.target.value.toUpperCase())} placeholder="Detalhes..." className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900 uppercase" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowMinisterioModal(false)} className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-900 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer">Salvar Ministério</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8.9 MODAL: MEMBROS */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="text-lg font-black text-blue-900">
                  {editingMember ? `Ficha do Membro: ${formMember.nome || editingMember.nome}` : 'Novo Cadastro de Membro'}
                </h3>
                {editingMember && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <button onClick={() => setMemberModalTab('dados')} className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${memberModalTab === 'dados' ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-700'}`}>📁 Dados Cadastrais</button>
                    <button onClick={() => setMemberModalTab('financeiro')} className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${memberModalTab === 'financeiro' ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-700'}`}>💰 Financeiro</button>
                    <button onClick={() => setMemberModalTab('evolucao')} className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${memberModalTab === 'evolucao' ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-700'}`}>🚀 Evolução Ministerial</button>
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
            ) : memberModalTab === 'evolucao' && editingMember ? (
              <form onSubmit={salvarEvolucaoMinisterial} className="space-y-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-4">
                  <h4 className="font-bold text-blue-950 text-base">🚀 Acompanhamento e Evolução Ministerial</h4>
                  <p className="text-xs text-blue-800">Acompanhe o ministério atual do membro e promova para um novo ministério cadastrado.</p>
                  
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">1º Ministério Atual Cadastrado</label>
                      <select disabled value={formMember.ministerio_id || ''} className="w-full rounded-xl border p-3 text-sm bg-slate-100 text-slate-600 font-bold cursor-not-allowed">
                        <option value="">Nenhum ministério atual</option>
                        {ministeriosList.map((min: any) => (
                          <option key={min.id} value={min.id}>{min.nome}</option>
                        ))}
                      </select>
                      <span className="text-[10px] text-slate-500 mt-1 block">Este é o ministério atual vinculado ao membro.</span>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-blue-900 block mb-1">2º Ministério que vai Evoluir *</label>
                      <select value={novoMinisterioEvolucao} onChange={(e) => setNovoMinisterioEvolucao(e.target.value)} className="w-full rounded-xl border p-3 text-sm bg-white focus:outline-none focus:border-blue-900 font-bold text-blue-900 shadow-sm">
                        <option value="">Selecione o novo ministério para evolução...</option>
                        {ministeriosList.map((min: any) => (
                          <option key={min.id} value={min.id}>{min.nome}</option>
                        ))}
                      </select>
                      <span className="text-[10px] text-blue-700 mt-1 block">Selecione na lista o próximo nível ou novo ministério para evolução.</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={() => setShowMemberModal(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl cursor-pointer">Cancelar</button>
                  <button type="submit" className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer">
                    Salvar Evolução Ministerial
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={salvarMembro} className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 ml-1">Foto do Membro</label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 border flex items-center justify-center overflow-hidden shrink-0">
                        {formMember.foto_url ? (
                          <img src={formMember.foto_url} alt="Foto" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">👤</span>
                        )}
                      </div>

                      <div className="flex-1 flex gap-2">
                        <label className="flex-1 py-2.5 px-4 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl text-center cursor-pointer transition-all flex items-center justify-center gap-2 shadow-sm">
                          <span>📸 Tirar / Escolher Foto</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setFormMember((prev) => ({ ...prev, foto_url: reader.result as string }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }} />
                        </label>
                        {formMember.foto_url && (
                          <button type="button" onClick={() => setFormMember({ ...formMember, foto_url: '' })} className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl cursor-pointer">
                            Remover
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 ml-1">Nome Completo *</label>
                    <input type="text" required value={formMember.nome} onChange={(e) => setFormMember({ ...formMember, nome: e.target.value.toUpperCase() })} placeholder="Nome do membro" className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900 uppercase" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 ml-1">Tipo de Cadastro</label>
                      <select value={formMember.tipo_cadastro} onChange={(e) => setFormMember({ ...formMember, tipo_cadastro: e.target.value })} className="w-full rounded-xl border p-3 text-sm bg-white focus:outline-none focus:border-blue-900">
                        <option value="Membro">Membro</option>
                        <option value="Congregado">Congregado</option>
                        <option value="Visitante">Visitante</option>
                        <option value="Liderança">Liderança</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 ml-1">Estado Civil</label>
                      <select value={formMember.estado_civil} onChange={(e) => setFormMember({ ...formMember, estado_civil: e.target.value })} className="w-full rounded-xl border p-3 text-sm bg-white focus:outline-none focus:border-blue-900">
                        <option value="Solteiro(a)">Solteiro(a)</option>
                        <option value="Casado(a)">Casado(a)</option>
                        <option value="Divorciado(a)">Divorciado(a)</option>
                        <option value="Viúvo(a)">Viúvo(a)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 ml-1">CPF</label>
                      <input type="text" maxLength={14} value={formMember.cpf} onChange={(e) => setFormMember({ ...formMember, cpf: aplicarMascaraCpf(e.target.value) })} placeholder="000.000.000-00" className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900 font-mono" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 ml-1">RG</label>
                      <input type="text" value={formMember.rg} onChange={(e) => setFormMember({ ...formMember, rg: e.target.value.toUpperCase() })} placeholder="00.000.000-0" className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900 uppercase font-mono" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 ml-1">Data de Nascimento</label>
                      <input type="text" maxLength={10} value={dataNascDisplay} onChange={(e) => {
                        const formatada = aplicarMascaraData(e.target.value);
                        setDataNascDisplay(formatada);
                        setFormMember({ ...formMember, data_nascimento: converterDataParaBanco(formatada) || '' });
                      }} placeholder="dd/mm/aaaa" className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900 font-mono" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 ml-1">Celular Principal</label>
                      <input type="text" maxLength={15} value={formMember.celular_principal} onChange={(e) => setFormMember({ ...formMember, celular_principal: aplicarMascaraCelular(e.target.value) })} placeholder="(00) 00000-0000" className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900 font-mono" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 ml-1">E-mail</label>
                      <input type="email" value={formMember.email} onChange={(e) => setFormMember({ ...formMember, email: e.target.value.toLowerCase() })} placeholder="email@exemplo.com" className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 ml-1">Ministério</label>
                    <select value={formMember.ministerio_id || ''} onChange={(e) => setFormMember({ ...formMember, ministerio_id: e.target.value || null })} className="w-full rounded-xl border p-3 text-sm bg-white focus:outline-none focus:border-blue-900 font-bold text-blue-900">
                      <option value="">Nenhum ministério vinculado...</option>
                      {ministeriosList.map((min: any) => (<option key={min.id} value={min.id}>{min.nome}</option>))}
                    </select>
                  </div>

                  <div className="p-4 bg-slate-50 border rounded-2xl space-y-3">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Endereço Residencial & CEP</h4>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[11px] font-bold text-slate-500 ml-1">CEP</label>
                        <input type="text" value={formMember.cep} onChange={(e) => setFormMember({ ...formMember, cep: e.target.value })} placeholder="00000-000" className="w-full rounded-xl border p-2.5 text-sm bg-white focus:outline-none focus:border-blue-900 font-mono" />
                      </div>
                      <div className="flex items-end">
                        <button type="button" onClick={handleBuscarCepMembro} className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl cursor-pointer">Buscar CEP</button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-bold text-slate-500 ml-1">Rua / Logradouro</label>
                        <input type="text" value={formMember.rua} onChange={(e) => setFormMember({ ...formMember, rua: e.target.value.toUpperCase() })} placeholder="Nome da rua" className="w-full rounded-xl border p-2.5 text-sm bg-white focus:outline-none focus:border-blue-900 uppercase" />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 ml-1">Número</label>
                        <input type="text" value={formMember.numero} onChange={(e) => setFormMember({ ...formMember, numero: e.target.value.toUpperCase() })} placeholder="Nº" className="w-full rounded-xl border p-2.5 text-sm bg-white focus:outline-none focus:border-blue-900 uppercase" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 ml-1">Bairro</label>
                        <input type="text" value={formMember.bairro} onChange={(e) => setFormMember({ ...formMember, bairro: e.target.value.toUpperCase() })} placeholder="Bairro" className="w-full rounded-xl border p-2.5 text-sm bg-white focus:outline-none focus:border-blue-900 uppercase" />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 ml-1">Cidade</label>
                        <input type="text" value={formMember.cidade} onChange={(e) => setFormMember({ ...formMember, cidade: e.target.value.toUpperCase() })} placeholder="Cidade" className="w-full rounded-xl border p-2.5 text-sm bg-white focus:outline-none focus:border-blue-900 uppercase" />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 ml-1">Estado (UF)</label>
                        <input type="text" maxLength={2} value={formMember.estado} onChange={(e) => setFormMember({ ...formMember, estado: e.target.value.toUpperCase() })} placeholder="MG" className="w-full rounded-xl border p-2.5 text-sm bg-white focus:outline-none focus:border-blue-900 uppercase font-mono" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
  {editingMember && !ehUsuarioCelula ? (
    <button
      type="button"
      onClick={() => handleDeleteMember(editingMember.id)}
      className="px-4 py-2.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white font-bold text-sm rounded-xl transition-all cursor-pointer"
    >
      Excluir Membro
    </button>
  ) : (
    <div />
  )}

  <div className="flex gap-3">
    <button
      type="button"
      onClick={() => setShowMemberModal(false)}
      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl cursor-pointer"
    >
      Cancelar
    </button>

    <button
      type="submit"
      className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer"
    >
      {editingMember ? 'Gravar Alterações' : 'Gravar Novo Membro'}
      </button>
  </div>
</div>

    </form>
  </div>
</div>
      )}

  </div>
);
}