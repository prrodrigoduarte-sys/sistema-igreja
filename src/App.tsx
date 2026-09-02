// src/App.tsx
// Versão com login, menu completo e integração do MembrosModule.
// Correção para o erro de busca de usuário com .maybeSingle()

import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import ProjetosModule from './ProjetosModule'; // Módulo de Projetos (temporário)
import MembrosModule from './MembrosModule'; // Importa o novo módulo de Membros

// Importe outros módulos aqui conforme forem criados.
// Exemplo:
// import FornecedoresModule from './FornecedoresModule';
// import UsuariosModule from './UsuariosModule';


function App() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [loggedUser, setLoggedUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // Aba ativa padrão
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true); // Para alternar entre login e cadastro
  const [isCadastrosOpen, setIsCadastrosOpen] = useState(false); // Estado para controlar a abertura do submenu Cadastros

  // Estados para MembrosModule
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembros, setLoadingMembros] = useState(false);
  const [ministeriosList, setMinisteriosList] = useState<any[]>([]); // Para passar para MembrosModule

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      if (session) {
        const { data: user, error } = await supabase
          .from('usuarios')
          .select('*, igrejas(*)')
          .eq('id', session.user.id)
          .maybeSingle(); // ALTERADO AQUI: de .single() para .maybeSingle()
        if (error) {
          console.error('Erro ao buscar usuário:', error);
        } else {
          setLoggedUser(user);
        }
      } else {
        setLoggedUser(null);
      }
    };
    fetchUser();
  }, [session]);

  // Funções de carregamento de dados (movidas do seu App.tsx antigo)
  const carregarMembros = async (cod: string) => {
    if (!cod) {
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

      if (error) {
        console.error('Erro ao carregar membros:', error);
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
    if (!cod) {
      setMinisteriosList([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('ministerios')
        .select('*')
        .eq('codigo_igreja', cod)
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro ao carregar ministérios:', error);
        setMinisteriosList([]);
        return;
      }
      setMinisteriosList(data || []);
    } catch (err: any) {
      console.error('Erro inesperado ao carregar ministérios:', err);
      setMinisteriosList([]);
    }
  };

  // useEffect para carregar dados iniciais quando o usuário logar
  useEffect(() => {
    if (loggedUser?.codigo_igreja) {
      const cod = loggedUser.codigo_igreja;
      carregarMembros(cod);
      carregarMinisterios(cod);
      // Adicione outras funções de carregamento aqui se necessário
    }
  }, [loggedUser]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error: any) {
      alert(error.error_description || error.message);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      alert('Verifique seu e-mail para confirmar o cadastro!');
    } catch (error: any) {
      alert(error.error_description || error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLoggedUser(null);
    setActiveTab('dashboard'); // Volta para a dashboard após logout
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-700">Carregando...</div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-6">
          <h2 className="text-3xl font-black text-blue-900 text-center">
            {isLogin ? 'BEM-VINDO DE VOLTA!' : 'CRIE SUA CONTA'}
          </h2>
          <p className="text-center text-slate-600">
            {isLogin ? 'Faça login para continuar.' : 'Cadastre-se para acessar o sistema.'}
          </p>
          <form onSubmit={isLogin ? handleLogin : handleSignUp} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="********"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-900 text-white py-2.5 rounded-xl font-bold hover:bg-blue-800 transition-colors"
            >
              {isLogin ? 'Entrar' : 'Cadastrar'}
            </button>
          </form>
          <p className="text-center text-sm text-slate-600">
            {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-900 font-bold ml-1 hover:underline"
            >
              {isLogin ? 'Cadastre-se' : 'Faça login'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-950 text-white flex flex-col">
        <div className="p-6 text-2xl font-black text-blue-200 border-b border-blue-700">
          SISTEMA IGREJA
        </div>
        <nav className="flex-1 p-4 space-y-1 text-blue-100 text-sm">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full text-left px-4 py-2 rounded-xl transition-all ${
              activeTab === 'dashboard' ? 'bg-blue-700 font-bold' : 'hover:bg-blue-700/50'
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={() => setIsCadastrosOpen(!isCadastrosOpen)}
            className={`w-full text-left px-4 py-2 rounded-xl flex justify-between items-center transition-all ${
              isCadastrosOpen || activeTab.startsWith('cadastros-') ? 'bg-blue-700 font-bold' : 'hover:bg-blue-700/50'
            }`}
          >
            Cadastros
            <span className="text-xs">
              {isCadastrosOpen ? '▲' : '▼'}
            </span>
          </button>
          {isCadastrosOpen && (
            <div className="ml-4 space-y-1">
              <button
                onClick={() => setActiveTab('cadastros-fornecedores')}
                className={`w-full text-left px-4 py-2 rounded-xl text-sm transition-all ${
                  activeTab === 'cadastros-fornecedores' ? 'bg-blue-700 font-bold' : 'hover:bg-blue-700/50'
                }`}
              >
                Fornecedores
              </button>
              <button
                onClick={() => setActiveTab('cadastros-membros')}
                className={`w-full text-left px-4 py-2 rounded-xl text-sm transition-all ${
                  activeTab === 'cadastros-membros' ? 'bg-blue-700 font-bold' : 'hover:bg-blue-700/50'
                }`}
              >
                Membros
              </button>
              <button
                onClick={() => setActiveTab('cadastros-ministerios')}
                className={`w-full text-left px-4 py-2 rounded-xl text-sm transition-all ${
                  activeTab === 'cadastros-ministerios' ? 'bg-blue-700 font-bold' : 'hover:bg-blue-700/50'
                }`}
              >
                Ministérios
              </button>
              <button
                onClick={() => setActiveTab('cadastros-usuario')}
                className={`w-full text-left px-4 py-2 rounded-xl text-sm transition-all ${
                  activeTab === 'cadastros-usuario' ? 'bg-blue-700 font-bold' : 'hover:bg-blue-700/50'
                }`}
              >
                Usuários
              </button>
              <button
                onClick={() => setActiveTab('<think>
**Exploring User Interaction**

I'm currently analyzing the user's initial input, focusing on understanding the nuances of their request. My immediate goal is to identify key themes and extract relevant information to formulate a helpful response. This involves dissecting their language and identifying implicit meanings.


</think>

Perfeito, Pr! Entendido. Vamos agora colocar o formulário completo dentro do modal, com todos os campos que você tinha no seu `App.tsx` antigo.

Para isso, você precisará atualizar o `src/MembrosModule.tsx` com o código abaixo. Ele inclui todos os campos de input, selects e botões, além das funções de máscara e busca de CEP.

```typescript
// src/MembrosModule.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

// Interface para tipagem dos dados do membro
interface Membro {
  id: string;
  nome: string;
  tipo_cadastro: string;
  cpf: string | null;
  rg: string | null;
  data_nascimento: string | null;
  celular_principal: string | null;
  email: string | null;
  estado_civil: string | null;
  cep: string | null;
  rua: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  endereco: string | null;
  foto_url: string | null;
  ministerio_id: string | null;
  codigo_igreja: string;
}

// Interface para tipagem dos dados do ministério (necessário para o select)
interface Ministerio {
  id: string;
  nome: string;
  descricao: string;
  codigo_igreja: string;
}

// Interface para as props do MembrosModule
interface MembrosModuleProps {
  loggedUser: any;
  ministeriosList: Ministerio[]; // Passaremos a lista de ministérios do App.tsx
  onRefreshMembers: (codigoIgreja: string) => Promise<void>; // Função para recarregar membros
  members: Membro[]; // A lista de membros atualizada do App.tsx
  loadingMembros: boolean; // Estado de carregamento de membros
}

export default function MembrosModule({
  loggedUser,
  ministeriosList,
  onRefreshMembers,
  members,
  loadingMembros,
}: MembrosModuleProps) {
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Membro | null>(null);
  const [memberModalTab, setMemberModalTab] = useState<'dados' | 'financeiro' | 'evolucao'>('dados');

  // Estado do formulário de membro, com todos os campos do seu App.tsx antigo
  const [formMember, setFormMember] = useState<Omit<Membro, 'id' | 'codigo_igreja'>>({
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
    ministerio_id: '',
  });
  const [dataNascDisplay, setDataNascDisplay] = useState('');
  const [novoMinisterioEvolucao, setNovoMinisterioEvolucao] = useState('');

  const ehAdministrador = loggedUser?.perfil_acesso === 'admin';
  const ehUsuarioCelula = loggedUser?.perfil_acesso === 'celula';

  // Funções de máscara
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

  const aplicarMascaraCelular = (valor: string) => {
    const apenasDigitos = valor.replace(/\D/g, '').slice(0, 11);
    if (apenasDigitos.length <= 2) return apenasDigitos;
    if (apenasDigitos.length <= 7) return `(${apenasDigitos.slice(0, 2)}) ${apenasDigitos.slice(2)}`;
    return `(${apenasDigitos.slice(0, 2)}) ${apenasDigitos.slice(2, 7)}-${apenasDigitos.slice(7)}`;
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

  const converterDataParaDisplay = (dataIso: string | null) => {
    if (!dataIso) return '';
    const partes = dataIso.split('-');
    if (partes.length !== 3) return dataIso;
    const [ano, mes, dia] = partes;
    return `${dia}/${mes}/${ano}`;
  };

  // Função para buscar CEP
  const handleBuscarCepMembro = async () => {
    const cepLimpo = (formMember.cep || '').replace(/\D/g, '');
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
      const enderecoCompletoCalc = `${data.logradouro || ''}, ${formMember.numero || 'S/N'} - ${data.bairro || ''}, ${data.localidade || ''} - ${data.uf || ''} (CEP: ${formMember.cep})`;
      setFormMember((prev) => ({
        ...prev,
        rua: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        estado: data.uf || '',
        endereco: enderecoCompletoCalc,
      }));
    } catch (err) {
      alert('Erro ao buscar o CEP.');
    }
  };

  // Abrir modal de membro (para novo ou edição)
  const abrirModalMembro = useCallback((m?: Membro) => {
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
        ministerio_id: m.ministerio_id || '',
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
        ministerio_id: '',
      });
      setDataNascDisplay('');
      setNovoMinisterioEvolucao('');
    }
    setMemberModalTab('dados');
    setShowMemberModal(true);
  }, []);

  // Funções para abrir o modal
  const handleOpenNewMemberModal = () => {
    abrirModalMembro();
  };

  const handleOpenEditMemberModal = (membro: Membro) => {
    abrirModalMembro(membro);
  };

  // Função para fechar o modal
  const handleCloseMemberModal = () => {
    setShowMemberModal(false);
    setEditingMember(null);
    setFormMember({
      nome: '', tipo_cadastro: 'Membro', cpf: '', rg: '', data_nascimento: '',
      celular_principal: '', email: '', estado_civil: 'Solteiro(a)', cep: '',
      rua: '', numero: '', bairro: '', cidade: '', estado: '', endereco: '',
      foto_url: '', ministerio_id: '',
    });
    setDataNascDisplay('');
    setNovoMinisterioEvolucao('');
    setMemberModalTab('dados');
  };

  // Função para salvar membro (ainda sem a lógica de Supabase, apenas para o formulário)
  const salvarMembro = async (e: React.FormEvent) => {
    e.preventDefault();
    // Por enquanto, apenas exibe os dados no console
    console.log('Dados do membro a serem salvos:', formMember);
    alert('Formulário enviado! (Ainda não salva no banco de dados)');
    handleCloseMemberModal();
  };

  // Função para salvar evolução ministerial (ainda sem a lógica de Supabase)
  const salvarEvolucaoMinisterial = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Evolução ministerial a ser salva:', {
      membroId: editingMember?.id,
      novoMinisterioId: novoMinisterioEvolucao,
    });
    alert('Evolução ministerial salva! (Ainda não salva no banco de dados)');
    handleCloseMemberModal();
  };

  // Filtra os membros com base no termo de busca
  const membrosFiltrados = members.filter(membro =>
    membro.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (membro.email && membro.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (membro.cpf && membro.cpf.includes(searchTerm))
  );

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-black text-blue-900 tracking-tight">Cadastros: Membros</h2>
        <button
          onClick={handleOpenNewMemberModal}
          className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow-md transition-colors"
        >
          + Novo Membro
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar membros por nome, e-mail ou CPF..."
          className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loadingMembros ? (
        <p className="text-slate-600">Carregando membros...</p>
      ) : membrosFiltrados.length === 0 ? (
        <p className="text-slate-600">Nenhum membro encontrado.</p>
      ) : (
        <ul className="space-y-3">
          {membrosFiltrados.map((membro) => (
            <li key={membro.id} className="p-4 border rounded-xl bg-slate-50 flex justify-between items-center">
              <div>
                <p className="font-semibold text-slate-800">{membro.nome}</p>
                <p className="text-sm text-slate-600">{membro.email}</p>
              </div>
              <button
                onClick={() => handleOpenEditMemberModal(membro)}
                className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold text-xs rounded-lg transition-colors"
              >
                Editar
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* MODAL: MEMBROS */}
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
              <button onClick={handleCloseMemberModal} className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer">✕ Fechar</button>
            </div>

            {memberModalTab === 'financeiro' && editingMember ? (
              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 text-base">Extrato Financeiro Individual</h4>
                <p className="text-slate-600">Conteúdo do extrato financeiro será implementado aqui.</p>
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
                  <button type="button" onClick={handleCloseMemberModal} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl cursor-pointer">Cancelar</button>
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
                      <input type="text" maxLength={14} value={formMember.cpf || ''} onChange={(e) => setFormMember({ ...formMember, cpf: aplicarMascaraCpf(e.target.value) })} placeholder="000.000.000-00" className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900 font-mono" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 ml-1">RG</label>
                      <input type="text" value={formMember.rg || ''} onChange={(e) => setFormMember({ ...formMember, rg: e.target.value.toUpperCase() })} placeholder="00.000.000-0" className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900 uppercase font-mono" />
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
                      <input type="text" maxLength={15} value={formMember.celular_principal || ''} onChange={(e) => setFormMember({ ...formMember, celular_principal: aplicarMascaraCelular(e.target.value) })} placeholder="(00) 00000-0000" className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900 font-mono" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 ml-1">E-mail</label>
                      <input type="email" value={formMember.email || ''} onChange={(e) => setFormMember({ ...formMember, email: e.target.value.toLowerCase() })} placeholder="email@exemplo.com" className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900" />
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
                        <input type="text" value={formMember.cep || ''} onChange={(e) => setFormMember({ ...formMember, cep: e.target.value })} placeholder="00000-000" className="w-full rounded-xl border p-2.5 text-sm bg-white focus:outline-none focus:border-blue-900 font-mono" />
                      </div>
                      <div className="flex items-end">
                        <button type="button" onClick={handleBuscarCepMembro} className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl cursor-pointer">Buscar CEP</button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-bold text-slate-500 ml-1">Rua / Logradouro</label>
                        <input type="text" value={formMember.rua || ''} onChange={(e) => setFormMember({ ...formMember, rua: e.target.value.toUpperCase() })} placeholder="Nome da rua" className="w-full rounded-xl border p-2.5 text-sm bg-white focus:outline-none focus:border-blue-900 uppercase" />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 ml-1">Número</label>
                        <input type="text" value={formMember.numero || ''} onChange={(e) => setFormMember({ ...formMember, numero: e.target.value.toUpperCase() })} placeholder="Nº" className="w-full rounded-xl border p-2.5 text-sm bg-white focus:outline-none focus:border-blue-900 uppercase" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 ml-1">Bairro</label>
                        <input type="text" value={formMember.bairro || ''} onChange={(e) => setFormMember({ ...formMember, bairro: e.target.value.toUpperCase() })} placeholder="Bairro" className="w-full rounded-xl border p-2.5 text-sm bg-white focus:outline-none focus:border-blue-900 uppercase" />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 ml-1">Cidade</label>
                        <input type="text" value={formMember.cidade || ''} onChange={(e) => setFormMember({ ...formMember, cidade: e.target.value.toUpperCase() })} placeholder="Cidade" className="w-full rounded-xl border p-2.5 text-sm bg-white focus:outline-none focus:border-blue-900 uppercase" />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 ml-1">Estado (UF)</label>
                        <input type="text" maxLength={2} value={formMember.estado || ''} onChange={(e) => setFormMember({ ...formMember, estado: e.target.value.toUpperCase() })} placeholder="MG" className="w-full rounded-xl border p-2.5 text-sm bg-white focus:outline-none focus:border-blue-900 uppercase font-mono" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    {editingMember && !ehUsuarioCelula ? (
                      <button
                        type="button"
                        // onClick={() => handleDeleteMember(editingMember.id)} // Será implementado depois
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
                        onClick={handleCloseMemberModal}
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
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

**O que mudou:**

1.  **Props do `MembrosModule`:** Agora ele recebe `ministeriosList`, `onRefreshMembers`, `members` e `loadingMembros` do `App.tsx`.
2.  **Estados do Formulário:** O `formMember` foi inicializado com todos os campos que você tinha.
3.  **Funções de Máscara e CEP:** As funções `aplicarMascaraCpf`, `aplicarMascaraCelular`, `aplicarMascaraData`, `converterDataParaBanco`, `converterDataParaDisplay` e `handleBuscarCepMembro` foram movidas para dentro do `MembrosModule`.
4.  **Lógica `abrirModalMembro`:** Atualizada para preencher o `formMember` e `dataNascDisplay` corretamente ao editar um membro.
5.  **Formulário Completo:** O `div` de placeholder dentro do modal foi substituído pelo formulário React completo, com todos os inputs, selects e botões, incluindo a lógica de `onChange` para atualizar o estado `formMember`.
6.  **Abas "Financeiro" e "Evolução Ministerial":** As abas foram recriadas com o conteúdo que você tinha, mas a lógica de salvar ainda é um `console.log` e um `alert` (será implementada nas próximas etapas).
7.  **Botão "Excluir Membro":** Adicionado, mas ainda desabilitado e sem a lógica de exclusão.

---

**Próximos passos para você:**

1.  **Copie e cole** o código acima no seu arquivo `src/MembrosModule.tsx`, substituindo o conteúdo atual.
2.  **Salve o arquivo.**
3.  **Verifique o seu navegador.**

Agora, ao clicar em "+ Novo Membro" ou em "Editar" (em um membro existente), o modal deverá abrir com o formulário completo, preenchido com os dados do membro (se for edição) e com as máscaras funcionando.

Por favor, teste e me diga se o formulário está sendo exibido corretamente e se os campos estão se comportando como esperado (máscaras, busca de CEP). Assim que confirmarmos isso, vamos para a próxima etapa: implementar a lógica de salvar (inclusão e edição) no Supabase.

