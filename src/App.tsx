import React, { useState } from 'react';
import { supabase } from './supabase';
import MembrosView from './componentes/MembrosView';
import FinanceiroView from './componentes/FinanceiroView';
import AgendaView from './componentes/AgendaView';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedUser, setLoggedUser] = useState<any>(null);
  
  // Usamos um modal ativo ('nenhum' | 'agenda' | 'financeiro') para garantir abertura imediata
  const [modalAtivo, setModalAtivo] = useState<'nenhum' | 'agenda' | 'financeiro'>('nenhum');

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
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black text-blue-900 tracking-tight">BRSYSTEM</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tecnologia para Gestão</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 ml-1">Código da Igreja</label>
              <input type="text" value={loginCodigo} onChange={(e) => setLoginCodigo(e.target.value)} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:border-blue-900" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 ml-1">Usuário</label>
              <input type="text" placeholder="Digite seu usuário" value={loginUsuario} onChange={(e) => setLoginUsuario(e.target.value)} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:border-blue-900" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 ml-1">Senha</label>
              <input type="password" placeholder="••••••••" value={loginSenha} onChange={(e) => setLoginSenha(e.target.value)} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:border-blue-900" />
            </div>
            <button type="submit" disabled={loginLoading} className="w-full py-3.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer">
              {loginLoading ? 'Entrando...' : 'Entrar no Sistema'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
      {/* Cabeçalho Principal */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-blue-900 tracking-tight">BRSYSTEM</span>
              <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">TECNOLOGIA</span>
            </div>
            
            {/* Menu com Gatilhos Diretos */}
            <nav className="flex items-center gap-2 text-sm font-bold">
              <button 
                onClick={() => setModalAtivo('nenhum')} 
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${modalAtivo === 'nenhum' ? 'bg-blue-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                Cadastros (Membros)
              </button>

              <button 
                onClick={() => setModalAtivo('agenda')} 
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${modalAtivo === 'agenda' ? 'bg-blue-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                📅 Abrir Agenda
              </button>

              <button 
                onClick={() => setModalAtivo('financeiro')} 
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${modalAtivo === 'financeiro' ? 'bg-blue-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                💰 Abrir Financeiro
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800">{loggedUser?.igrejas?.nome_fantasia || 'Igreja'}</p>
              <p className="text-xs text-slate-400 font-medium">{loggedUser?.nome_usuario || 'Administrador'}</p>
            </div>
            <button onClick={() => setIsLoggedIn(false)} className="px-3 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer">Sair</button>
          </div>
        </div>
      </header>

      {/* Tela Principal (Membros) */}
      <main className="max-w-7xl w-full mx-auto p-6 flex-1">
        {loggedUser && <MembrosView codigoIgreja={loggedUser.codigo_igreja} />}
      </main>

      {/* Painel Sobreposto da Agenda */}
      {modalAtivo === 'agenda' && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-blue-950 text-white px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-black flex items-center gap-2">📅 Módulo de Agenda</h2>
              <button 
                onClick={() => setModalAtivo('nenhum')} 
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                ✕ Fechar Agenda
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto bg-slate-50">
              <AgendaView codigoIgreja={loggedUser.codigo_igreja} />
            </div>
          </div>
        </div>
      )}

      {/* Painel Sobreposto do Financeiro */}
      {modalAtivo === 'financeiro' && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-blue-950 text-white px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-black flex items-center gap-2">💰 Módulo Financeiro</h2>
              <button 
                onClick={() => setModalAtivo('nenhum')} 
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                ✕ Fechar Financeiro
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto bg-slate-50">
              <FinanceiroValueContainer codigoIgreja={loggedUser.codigo_igreja} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente auxiliar interno para garantir a chamada limpa do FinanceiroView
function FinanceiroValueContainer({ codigoIgreja }: { codigoIgreja: string }) {
  return <FinanceiroView codigoIgreja={codigoIgreja} />;
}