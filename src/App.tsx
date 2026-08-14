import React, { useState } from 'react';
import { supabase } from './supabase';
import MembrosView from './components/MembrosView';
import FinanceiroView from './components/FinanceiroView';
import AgendaView from './components/AgendaView';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedUser, setLoggedUser] = useState<any>(null);
  const [loggedIgreja, setLoggedIgreja] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'membros' | 'financeiro' | 'agenda'>('membros');

  // Campos do Login
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
      setLoggedIgreja(data.igrejas);
      setIsLoggedIn(true);
    } catch (err: any) {
      alert('Erro no login: ' + err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 space-y-6">
          <h1 className="text-3xl font-black text-blue-900 text-center">BRSYSTEM</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder="Código Igreja" value={loginCodigo} onChange={(e) => setLoginCodigo(e.target.value)} className="w-full rounded-xl border p-3" />
            <input type="text" placeholder="Usuário" value={loginUsuario} onChange={(e) => setLoginUsuario(e.target.value)} className="w-full rounded-xl border p-3" />
            <input type="password" placeholder="Senha" value={loginSenha} onChange={(e) => setLoginSenha(e.target.value)} className="w-full rounded-xl border p-3" />
            <button type="submit" disabled={loginLoading} className="w-full py-3 bg-blue-900 text-white font-bold rounded-xl">
              {loginLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-black text-blue-900">BRSYSTEM</h1>
          <nav className="flex gap-6 font-bold text-blue-900">
            <button onClick={() => setActiveTab('membros')} className={activeTab === 'membros' ? 'text-indigo-600' : ''}>📋 Membros</button>
            <button onClick={() => setActiveTab('financeiro')} className={activeTab === 'financeiro' ? 'text-indigo-600' : ''}>💰 Financeiro</button>
            <button onClick={() => setActiveTab('agenda')} className={activeTab === 'agenda' ? 'text-indigo-600' : ''}>📅 Agenda</button>
          </nav>
          <button onClick={() => setIsLoggedIn(false)} className="text-xs bg-slate-100 px-3 py-1 rounded">Sair</button>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto p-6 flex-1">
        {activeTab === 'membros' && <MembrosView codigoIgreja={loggedUser.codigo_igreja} />}
        {activeTab === 'financeiro' && <FinanceiroView codigoIgreja={loggedUser.codigo_igreja} />}
        {activeTab === 'agenda' && <AgendaView codigoIgreja={loggedUser.codigo_igreja} />}
      </main>
    </div>
  );
}