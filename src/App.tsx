import React, { useState } from 'react';
import { supabase } from './supabase';
import MembrosView from './componentes/MembrosView';
import AgendaView from './componentes/AgendaView';
import FinanceiroView from './componentes/FinanceiroView';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedUser, setLoggedUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'membros' | 'agenda' | 'financeiro'>('membros');
  const [openDropdown, setOpenDropdown] = useState<'cadastros' | null>(null);

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
      setActiveTab('membros'); 
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
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm relative z-50">
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
                    <button className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-400 cursor-not-allowed font-semibold">👤 Usuários</button>
                    <button className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-400 cursor-not-allowed font-semibold">🚚 Fornecedores</button>
                    <button className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-400 cursor-not-allowed font-semibold">📊 Relatórios</button>
                  </div>
                )}
              </div>
              <button className="hover:text-blue-900 cursor-pointer flex items-center gap-1">Células <span className="text-xs text-slate-400">∨</span></button>
              <button onClick={() => setActiveTab('agenda')} className={`cursor-pointer flex items-center gap-1 transition-all ${activeTab === 'agenda' ? 'text-blue-900 font-black' : 'hover:text-blue-900'}`}>
                Agenda <span className="text-xs text-slate-400">∨</span>
              </button>
              <button onClick={() => setActiveTab('financeiro')} className={`cursor-pointer flex items-center gap-1 transition-all ${activeTab === 'financeiro' ? 'text-blue-900 font-black' : 'hover:text-blue-900'}`}>
                Financeiro <span className="text-xs text-slate-400">∨</span>
              </button>
              <button className="hover:text-blue-900 cursor-pointer flex items-center gap-1">Controle <span className="text-xs text-slate-400">∨</span></button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-black text-slate-800">{loggedUser?.igrejas?.nome_fantasia || 'Igreja'}</p>
              <p className="text-xs text-slate-500 font-semibold">{loggedUser?.nome_usuario || 'Administrador'}</p>
            </div>
            <button onClick={() => setIsLoggedIn(false)} className="px-4 py-1.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer">Sair</button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl w-full mx-auto p-6 flex-1">
        {activeTab === 'membros' && <MembrosView codigoIgreja={loggedUser.codigo_igreja} />}
        {activeTab === 'agenda' && <AgendaView codigoIgreja={loggedUser.codigo_igreja} />}
        {activeTab === 'financeiro' && <FinanceiroView codigoIgreja={loggedUser.codigo_igreja} />}
      </main>
    </div>
  );
}
