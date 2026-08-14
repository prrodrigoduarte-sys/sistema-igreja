import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function App() {
  // --- SESSÃO E AUTENTICAÇÃO ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedUser, setLoggedUser] = useState<any>(null);
  const [loggedIgreja, setLoggedIgreja] = useState<any>(null);

  // Campos do Login
  const [loginCodigo, setLoginCodigo] = useState('IGR-001');
  const [loginUsuario, setLoginUsuario] = useState('');
  const [loginSenha, setLoginSenha] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // --- NAVEGAÇÃO E TABS ---
  const [activeTab, setActiveTab] = useState<'membros' | 'financeiro' | 'agenda'>('membros');

  // --- LOGIN ---
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

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoggedUser(null);
    setLoggedIgreja(null);
  };

  // Se não estiver logado, mostra a tela de login
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 space-y-6">
          <div className="text-center">
            <span className="text-3xl font-black text-blue-900 block">BRSYSTEM</span>
            <p className="text-xs text-slate-500 font-semibold mt-1">Gestão de Igrejas</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Código Igreja</label>
              <input type="text" required value={loginCodigo} onChange={(e) => setLoginCodigo(e.target.value)} className="w-full rounded-xl border p-3 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Usuário</label>
              <input type="text" required value={loginUsuario} onChange={(e) => setLoginUsuario(e.target.value)} className="w-full rounded-xl border p-3 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Senha</label>
              <input type="password" required value={loginSenha} onChange={(e) => setLoginSenha(e.target.value)} className="w-full rounded-xl border p-3 text-sm" />
            </div>
            <button type="submit" disabled={loginLoading} className="w-full py-3.5 bg-blue-900 text-white font-bold rounded-xl shadow-lg">
              {loginLoading ? 'Acessando...' : 'Entrar no Sistema'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Tela Principal após o Login
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* BARRA SUPERIOR */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="text-xl font-black text-blue-900">BRSYSTEM</span>
            <nav className="flex items-center gap-6 text-sm font-bold text-blue-900">
              <button 
                onClick={() => setActiveTab('membros')} 
                className={`py-2 ${activeTab === 'membros' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'hover:text-indigo-600'}`}
              >
                📋 Membros
              </button>
              <button 
                onClick={() => setActiveTab('financeiro')} 
                className={`py-2 ${activeTab === 'financeiro' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'hover:text-indigo-600'}`}
              >
                💰 Financeiro
              </button>
              <button 
                onClick={() => setActiveTab('agenda')} 
                className={`py-2 ${activeTab === 'agenda' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'hover:text-indigo-600'}`}
              >
                📅 Agenda
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800">{loggedIgreja?.nome_fantasia || 'Igreja'}</p>
              <p className="text-xs text-slate-500 font-medium">{loggedUser?.nome_usuario}</p>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl">Sair</button>
          </div>
        </div>
      </header>

      {/* ÁREA DE CONTEÚDO */}
      <main className="max-w-7xl w-full mx-auto p-6 flex-1">
        {activeTab === 'membros' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">Módulo de Membros</h2>
            <p className="text-sm text-slate-500 mt-2">Tela de membros carregada com sucesso!</p>
          </div>
        )}

        {activeTab === 'financeiro' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">Módulo Financeiro</h2>
            <p className="text-sm text-slate-500 mt-2">Tela financeira pronta para receber os dados.</p>
          </div>
        )}

        {activeTab === 'agenda' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">Módulo de Agenda</h2>
            <p className="text-sm text-slate-500 mt-2">Tela de agenda pronta para receber os dados.</p>
          </div>
        )}
      </main>
    </div>
  );
}