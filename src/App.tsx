import React, { useState } from 'react';
import { supabase } from './supabase';
import MembrosView from './componentes/MembrosView';
import FinanceiroView from './componentes/FinanceiroView';
import AgendaView from './componentes/AgendaView';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedUser, setLoggedUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'membros' | 'agenda' | 'financeiro'>('membros');

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

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-blue-950 text-white px-6 py-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black tracking-wider">BRSYSTEM</span>
            <span className="text-xs bg-blue-900 px-2.5 py-1 rounded-full text-blue-200">Painel Administrativo</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold">{loggedUser?.igrejas?.nome_fantasia || 'Igreja'}</p>
              <p className="text-xs text-blue-300">{loggedUser?.nome_usuario}</p>
            </div>
            <button onClick={() => setIsLoggedIn(false)} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg cursor-pointer">Sair</button>
          </div>
        </div>
      </header>

      {/* Abas de Navegação Direta */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex gap-3">
          <button 
            onClick={() => setActiveTab('membros')} 
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${activeTab === 'membros' ? 'bg-blue-900 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            👥 Módulo Membros
          </button>
          <button 
            onClick={() => setActiveTab('agenda')} 
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${activeTab === 'agenda' ? 'bg-blue-900 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            📅 Módulo Agenda
          </button>
          <button 
            onClick={() => setActiveTab('financeiro')} 
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${activeTab === 'financeiro' ? 'bg-blue-900 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            💰 Módulo Financeiro
          </button>
        </div>
      </div>

      <main className="max-w-7xl w-full mx-auto p-6 flex-1">
        {loggedUser && activeTab === 'membros' && <MembrosView codigoIgreja={loggedUser.codigo_igreja} />}
        {loggedUser && activeTab === 'agenda' && <AgendaView codigoIgreja={loggedUser.codigo_igreja} />}
        {loggedUser && activeTab === 'financeiro' && <FinanceiroView codigoIgreja={loggedUser.codigo_igreja} />}
      </main>
    </div>
  );
}