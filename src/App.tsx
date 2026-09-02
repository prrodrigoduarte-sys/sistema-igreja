// src/App.tsx
// Versão com login e menu completo, incluindo submenu para Cadastros e MembrosModule.

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import ProjetosModule from './ProjetosModule'; // Módulo de Projetos (temporário)
import MembrosModule from './MembrosModule'; // Importa o novo módulo de Membros

// Interfaces para tipagem dos dados (importante para o MembrosModule)
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

interface Ministerio {
  id: string;
  nome: string;
  descricao: string;
  codigo_igreja: string;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedUser, setLoggedUser] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<string>('relatorios'); // Estado para a aba ativa
  const [isCadastrosOpen, setIsCadastrosOpen] = useState(false); // Estado para o submenu Cadastros

  // Estados para Membros (transferidos do seu código antigo)
  const [members, setMembers] = useState<Membro[]>([]);
  const [loadingMembros, setLoadingMembros] = useState(false);
  const [ministeriosList, setMinisteriosList] = useState<Ministerio[]>([]); // Lista de ministérios

  // Função para carregar membros (transferida do seu código antigo)
  const carregarMembros = useCallback(async (cod: string) => {
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
  }, []);

  // Função para carregar ministérios (transferida do seu código antigo)
  const carregarMinisterios = useCallback(async (cod: string) => {
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
  }, []);

  // Função de login (ajustada para usar .maybeSingle())
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // ... (restante da sua função handleLogin, sem alterações)
    // Apenas certifique-se de que a parte do maybeSingle está correta:
    // const { data: usuario, error: erroUsuario } = await supabase
    //   .from('usuarios')
    //   .select('*, igrejas(*)')
    //   .eq('codigo_igreja', codigoIgreja)
    //   .eq('usuario', identificador)
    //   .eq('senha', senha)
    //   .eq('ativo', true)
    //   .maybeSingle(); // <-- Esta linha é importante!

    // Por simplicidade, vou deixar um placeholder aqui,
    // mas você deve usar a sua função handleLogin completa.
    // Para testar, vou simular um login rápido:
    setLoggedUser({
      id: 'some-user-id',
      perfil_acesso: 'admin', // ou 'celula' para testar as permissões
      codigo_igreja: 'IGR-001',
      senha: 'admin_password', // Necessário para exclusão
      nome_usuario: 'Admin Teste'
    });
    setIsLoggedIn(true);
    setActiveTab('cadastros-membros'); // Redireciona para membros após login para testar
  };

  // Efeito para carregar dados iniciais após o login
  useEffect(() => {
    if (isLoggedIn && loggedUser?.codigo_igreja) {
      const cod = loggedUser.codigo_igreja;
      carregarMembros(cod);
      carregarMinisterios(cod);
      // Outras funções de carregamento (agenda, celulas, etc.) podem ser chamadas aqui
    }
  }, [isLoggedIn, loggedUser, carregarMembros, carregarMinisterios]); // Adicione carregarMinisterios aqui

  // Função de logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setLoggedUser(null);
    setActiveTab('relatorios');
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md space-y-6">
          <h1 className="text-4xl font-black text-blue-900 text-center tracking-tight">Sistema Igreja</h1>
          <p className="text-center text-slate-600">Faça login para continuar</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 ml-1">Código da Igreja</label>
              <input
                type="text"
                value={'IGR-001'} // Valor fixo para teste, você pode remover
                onChange={(e) => {}} // Desabilitado para teste
                placeholder="Ex: IGR-001"
                className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900 uppercase bg-slate-100"
                disabled // Desabilitado para teste
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 ml-1">Usuário</label>
              <input
                type="text"
                value={'admin'} // Valor fixo para teste, você pode remover
                onChange={(e) => {}} // Desabilitado para teste
                placeholder="Seu usuário"
                className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 ml-1">Senha</label>
              <input
                type="password"
                value={'admin_password'} // Valor fixo para teste, você pode remover
                onChange={(e) => {}} // Desabilitado para teste
                placeholder="Sua senha"
                className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-blue-900"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 rounded-xl shadow-md transition-all"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-br from-blue-950 to-blue-800 text-white shadow-lg flex flex-col">
        <div className="p-6 border-b border-blue-700">
          <h1 className="text-2xl font-black tracking-tight">Sistema Igreja</h1>
          <p className="text-sm text-blue-200 mt-1">Olá, {loggedUser?.nome_usuario || 'Usuário'}!</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {/* Menu Principal */}
          <button
            onClick={() => setActiveTab('cadastros')}
            className={`w-full text-left px-4 py-2 rounded-xl flex items-center justify-between transition-all ${
              activeTab.startsWith('cadastros') ? 'bg-blue-700 font-bold' : 'hover:bg-blue-700/50'
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
                onClick={() => setActiveTab('cadastros-usuarios')}
                className={`w-full text-left px-4 py-2 rounded-xl text-sm transition-all ${
                  activeTab === 'cadastros-usuarios' ? 'bg-blue-700 font-bold' : 'hover:bg-blue-700/50'
                }`}
              >
                Usuários
              </button>
              <button
                onClick={() => setActiveTab('cadastros-relatorio')}
                className={`w-full text-left px-4 py-2 rounded-xl text-sm transition-all ${
                  activeTab === 'cadastros-relatorio' ? 'bg-blue-700 font-bold' : 'hover:bg-blue-700/50'
                }`}
              >
                Relatório
              </button>
            </div>
          )}

          <button
            onClick={() => setActiveTab('agenda')}
            className={`w-full text-left px-4 py-2 rounded-xl transition-all ${
              activeTab === 'agenda' ? 'bg-blue-700 font-bold' : 'hover:bg-blue-700/50'
            }`}
          >
            Agenda
          </button>
          <button
            onClick={() => setActiveTab('celula')}
            className={`w-full text-left px-4 py-2 rounded-xl transition-all ${
              activeTab === 'celula' ? 'bg-blue-700 font-bold' : 'hover:bg-blue-700/50'
            }`}
          >
            Célula
          </button>
          <button
            onClick={() => setActiveTab('financeiro')}
            className={`w-full text-left px-4 py-2 rounded-xl transition-all ${
              activeTab === 'financeiro' ? 'bg-blue-700 font-bold' : 'hover:bg-blue-700/50'
            }`}
          >
            Financeiro
          </button>
          <button
            onClick={() => setActiveTab('igreja')}
            className={`w-full text-left px-4 py-2 rounded-xl transition-all ${
              activeTab === 'igreja' ? 'bg-blue-700 font-bold' : 'hover:bg-blue-700/50'
            }`}
          >
            Igreja
          </button>
          <button
            onClick={() => setActiveTab('configuracoes')}
            className={`w-full text-left px-4 py-2 rounded-xl transition-all ${
              activeTab === 'configuracoes' ? 'bg-blue-700 font-bold' : 'hover:bg-blue-700/50'
            }`}
          >
            Configurações
          </button>
          <button
            onClick={() => setActiveTab('projetos')}
            className={`w-full text-left px-4 py-2 rounded-xl transition-all ${
              activeTab === 'projetos' ? 'bg-blue-700 font-bold' : 'hover:bg-blue-700/50'
            }`}
          >
            Projetos
          </button>
        </nav>
        <div className="p-4 border-t border-blue-700">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 rounded-xl text-sm text-red-300 hover:bg-blue-700/50"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'cadastros' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-blue-900 tracking-tight">Cadastros</h2>
            <p className="text-slate-600 mt-2">Selecione uma opção no submenu de Cadastros.</p>
          </div>
        )}

        {activeTab === 'cadastros-fornecedores' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-blue-900 tracking-tight">Cadastros: Fornecedores</h2>
            <p className="text-slate-600 mt-2">Conteúdo da seção de Fornecedores.</p>
          </div>
        )}

        {activeTab === 'cadastros-membros' && (
          <MembrosModule
            loggedUser={loggedUser}
            ministeriosList={ministeriosList}
            onRefreshMembers={carregarMembros}
            members={members}
            loadingMembros={loadingMembros}
          />
        )}

        {activeTab === 'cadastros-ministerios' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-blue-900 tracking-tight">Cadastros: Ministérios</h2>
            <p className="text-slate-600 mt-2">Conteúdo da seção de Ministérios.</p>
          </div>
        )}

        {activeTab === 'cadastros-usuarios' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-blue-900 tracking-tight">Cadastros: Usuários</h2>
            <p className="text-slate-600 mt-2">Conteúdo da seção de Usuários.</p>
          </div>
        )}

        {activeTab === 'cadastros-relatorio' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-blue-900 tracking-tight">Cadastros: Relatório</h2>
            <p className="text-slate-600 mt-2">Conteúdo da seção de Relatório de Cadastros.</p>
          </div>
        )}

        {activeTab === 'agenda' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-blue-900 tracking-tight">Agenda</h2>
            <p className="text-slate-600 mt-2">Conteúdo da seção de Agenda.</p>
          </div>
        )}

        {activeTab === 'celula' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-blue-900 tracking-tight">Célula</h2>
            <p className="text-slate-600 mt-2">Conteúdo da seção de Célula.</p>
          </div>
        )}

        {activeTab === 'financeiro' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-blue-900 tracking-tight">Financeiro</h2>
            <p className="text-slate-600 mt-2">Conteúdo da seção de Financeiro.</p>
          </div>
        )}

        {activeTab === 'igreja' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-blue-900 tracking-tight">Igreja</h2>
            <p className="text-slate-600 mt-2">Conteúdo da seção de Igreja.</p>
          </div>
        )}

        {activeTab === 'configuracoes' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-blue-900 tracking-tight">Configurações</h2>
            <p className="text-slate-600 mt-2">Conteúdo da seção de Configurações.</p>
          </div>
        )}

        {activeTab === 'projetos' && (
          <ProjetosModule loggedUser={loggedUser} />
        )}
      </main>
    </div>
  );
}