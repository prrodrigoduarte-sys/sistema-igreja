import React, { useEffect, useState } from 'react';
import { supabase } from './supabase'; 

export default function App() {
// Estados de Autenticação e Navegação
const [isLoggedIn, setIsLoggedIn] = useState(false);
const [loggedUser, setLoggedUser] = useState(null);
const [activeTab, setActiveTab] = useState<'membros' | 'agenda' | 'financeiro'>('membros'); 

// Estados do Formulário de Login
const [loginCodigo, setLoginCodigo] = useState('IGR-001');
const [loginUsuario, setLoginUsuario] = useState('');
const [loginSenha, setLoginSenha] = useState('');
const [loginLoading, setLoginLoading] = useState(false); 

// Estados do Módulo de Membros
const [members, setMembers] = useState<any[]>([]);
const [searchTerm, setSearchTerm] = useState('');
const [loadingMembros, setLoadingMembros] = useState(false); 

// Estados do Módulo da Agenda
const [compromissos, setCompromissos] = useState<any[]>([]);
const [loadingAgenda, setLoadingAgenda] = useState(false); 

// Estados do Módulo Financeiro
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

// --- CARREGAMENTO DE DADOS (EFEITO CENTRAL) ---
useEffect(() => {
if (!isLoggedIn || !loggedUser?.codigo_igreja) return; 

const codigoIgreja = loggedUser.codigo_igreja;

// Busca Membros
async function fetchMembers() {
setLoadingMembros(true);
const { data, error } = await supabase
.from('members')
.select('*')
.eq('codigo_igreja', codigoIgreja);
if (!error) setMembers(data || []);
setLoadingMembros(false);
}

// Busca Agenda
async function fetchAgenda() {
setLoadingAgenda(true);
const { data, error } = await supabase
.from('agenda_compromissos')
.select('*')
.eq('codigo_igreja', codigoIgreja)
.order('data_compromisso', { ascending: true });
if (!error) setCompromissos(data || []);
setLoadingAgenda(false);
}

// Busca Financeiro
async function fetchFinanceiro() {
setLoadingFinanceiro(true);
try {
const { data: contasData } = await supabase
.from('contas_financeiras')
.select('*')
.eq('codigo_igreja', codigoIgreja);
setContas(contasData || []);
const { data: lancsData } = await supabase
  .from('lancamentos_financeiros')
  .select('*')
  .eq('codigo_igreja', codigoIgreja)
  .order('data_lancamento', { ascending: false });
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

// --- TELA DE LOGIN ---
if (!isLoggedIn) {
return ( 

);
} 

// --- DASHBOARD PRINCIPAL ---
return (