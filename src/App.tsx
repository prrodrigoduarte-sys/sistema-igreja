import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';

export default function App() {
  // Estados de Autenticação e Navegação Central
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedUser, setLoggedUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'membros' | 'agenda' | 'financeiro'>('membros');
  const [openDropdown, setOpenDropdown] = useState<'cadastros' | null>(null);

  // Estados do Formulário de Login
  const [loginCodigo, setLoginCodigo] = useState('IGR-001');
  const [loginUsuario, setLoginUsuario] = useState('');
  const [loginSenha, setLoginSenha] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Estados do Módulo de Membros (Tabela: members)
  const [members, setMembers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingMembros, setLoadingMembros] = useState(false);

  // Estados do Módulo da Agenda (Tabela: agenda_compromissos)
  const [compromissos, setCompromissos] = useState<any[]>([]);
  const [loadingAgenda, setLoadingAgenda] = useState(false);

  // Estados do Módulo Financeiro (Tabelas: contas_financeiras e lancamentos_financeiros)
  const [contas, setContas] = useState<any[]>([]);
  const [lancamentos, setLancamentos] = useState<any[]>([]);
  const [loadingFinanceiro, setLoadingFinanceiro] = useState(false);

  // --- FUNÇÃO DE LOGIN ---
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
      setIsLoggedIn(true);
      setActiveTab('membros'); 
    } catch (err: any) {
      alert('Erro no login: ' + err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  // --- CARREGAMENTO DE DADOS DO BANCO (SUPABASE) ---
  useEffect(() => {
    if (!isLoggedIn || !loggedUser?.codigo_igreja) return;
    const codigoIgreja = loggedUser.codigo_igreja;

    async function fetchMembers() {
      setLoadingMembros(true);
      const { data, error } = await supabase.from('members').select('*').eq('codigo_igreja', codigoIgreja);
      if (!error) setMembers(data || []);
      setLoadingMembros(false);
    }

    async function fetchAgenda() {
      setLoadingAgenda(true);
      const { data, error } = await supabase.from('agenda_compromissos').select('*').eq('codigo_igreja', codigoIgreja).order('data_compromisso', { ascending: true });
      if (!error) setCompromissos(data || []);
      setLoadingAgenda(false);
    }

    async function fetchFinanceiro() {
      setLoadingFinanceiro(true);
      try {
        const { data: contasData } = await supabase.from('contas_financeiras').select('*').eq('codigo_igreja', codigoIgreja);
        setContas(contasData || []);
        const { data: lancsData } = await supabase.from('lancamentos_financeiros').select('*').eq('codigo_igreja', codigoIgreja).order('data_lancamento', { ascending: false });
        setLancamentos(lancsData || []);
      } catch (err) {
        console.error(err);
      }
      setLoadingFinanceiro(false);
    }

    if (activeTab === 'membros') fetchMembers();
    if (activeTab === 'agenda') fetchAgenda();
    if (activeTab === 'financeiro') fetchFinanceiro();
  }, [isLoggedIn, activeTab, loggedUser]);

  const filteredMembers = members.filter(
    (m) => !searchTerm || m.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 space-y-6">
          <h1 className="text-3xl font-black text-blue-900 text-center">BRSYSTEM</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder="Código Igreja" value={loginCodigo} onChange={(e) => setLoginCodigo(e.target.value)} className="w-full rounded-xl border p-3" />
            <input type="text" placeholder="Usuário" value={loginUsuario} onChange={(e) => setLoginUsuario(e.target.value)} className="w-full rounded-xl border p-3" />
            <input type="password" placeholder="Senha" value={loginSenha} onChange={(e) => setLoginSenha(e.target.value)} className="w-full rounded-xl border p-3" />
            <button type="submit" disabled={loginLoading} className="w-full py-3 bg-blue-900 text-white font-bold rounded-xl shadow-lg cursor-pointer">
              {loginLoading ? 'Entrando...' : 'Entrar no Sistema'}
            </button>
          </form>
        </div>
      </div>
    );
  }
