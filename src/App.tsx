import React, { useState } from 'react';
import { supabase } from './supabase';
import MembrosView from './componentes/MembrosView';
import AgendaView from './componentes/AgendaView';
import FinanceiroView from './componentes/FinanceiroView'; 

export default function App() {
const [isLoggedIn, setIsLoggedIn] = useState(false);
const [loggedUser, setLoggedUser] = useState(null);
const [activeTab, setActiveTab] = useState<'membros' | 'agenda' | 'financeiro'>('membros'); 

// Estados para controlar a abertura dos menus suspensos (dropdowns)
const [openDropdown, setOpenDropdown] = useState<'cadastros' | 'agenda' | 'financeiro' | 'controle' | null>(null); 

const [loginCodigo, setLoginCodigo] = useState('IGR-001');
const [loginUsuario, setLoginUsuario] = useState('');
const [loginSenha, setLoginSenha] = useState('');
const [loginLoading, setLoginLoading] = useState(false); 

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
} catch (err: any) {
alert('Erro no login: ' + err.message);
} finally {
setLoginLoading(false);
}

}; 

const toggleDropdown = (menu: 'cadastros' | 'agenda' | 'financeiro' | 'controle') => {
if (openDropdown === menu) {
setOpenDropdown(null);
} else {
setOpenDropdown(menu);
}
}; 

if (!isLoggedIn) {
return ( 

);
} 

return ( 

);
}