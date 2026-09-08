// src/AppMobileModule.tsx

import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';

interface Props {
  loggedUser: any;
}

export default function AppMobileModule({ loggedUser }: Props) {
  const [subAba, setSubAba] = useState<'perfil' | 'agenda' | 'celula' | 'igreja'>('agenda');
  const [agenda, setAgenda] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erroAgenda, setErroAgenda] = useState<string | null>(null);

  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaData, setNovaData] = useState(new Date().toISOString().split('T')[0]);
  const [novaHora, setNovaHora] = useState('19:00');
  const [modalNovaAgenda, setModalNovaAgenda] = useState(false);

  const codigoIgreja = loggedUser?.codigo_igreja || 'IGR-001';

  const buscarAgenda = async () => {
    setCarregando(true);
    setErroAgenda(null);
    try {
      console.log('🔍 Buscando agenda para a igreja:', codigoIgreja);
      const { data, error } = await supabase
        .from('agenda')
        .select('*')
        .eq('codigo_igreja', codigoIgreja);

      if (error) {
        console.error('❌ Erro no Supabase:', error);
        setErroAgenda(error.message);
      } else {
        console.log('✅ Agenda carregada com sucesso:', data);
        setAgenda(data || []);
      }
    } catch (err: any) {
      console.error('❌ Erro inesperado:', err);
      setErroAgenda(err.message || 'Erro desconhecido');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarAgenda();
  }, [codigoIgreja]);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoTitulo.trim()) return alert('Informe o compromisso.');

    try {
      const payload = {
        codigo_igreja: codigoIgreja,
        titulo: novoTitulo.trim(),
        data_evento: novaData,
        hora_evento: novaHora,
        tipo: 'Pessoal',
      };

      const { error } = await supabase.from('agenda').insert([payload]);
      if (error) throw error;

      alert('📅 Agendado com sucesso!');
      setNovoTitulo('');
      setModalNovaAgenda(false);
      buscarAgenda();
    } catch (err: any) {
      alert('Erro ao agendar: ' + err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-100 min-h-[85vh] rounded-3xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col p-4">
      {/* CABEÇALHO */}
      <div className="bg-blue-900 text-white p-4 rounded-2xl mb-4 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-black">📱 App Mobile (Igreja)</h2>
          <span className="text-[10px] bg-emerald-500 font-bold px-2 py-0.5 rounded-full">ONLINE</span>
        </div>

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="grid grid-cols-4 gap-1 bg-blue-950 p-1 rounded-xl text-[11px] font-bold text-center">
          <button
            type="button"
            onClick={() => setSubAba('perfil')}
            className={`py-2 rounded-lg cursor-pointer ${subAba === 'perfil' ? 'bg-blue-600 text-white' : 'text-blue-300'}`}
          >
            👤 Perfil
          </button>
          <button
            type="button"
            onClick={() => setSubAba('agenda')}
            className={`py-2 rounded-lg cursor-pointer ${subAba === 'agenda' ? 'bg-blue-600 text-white' : 'text-blue-300'}`}
          >
            📅 Agenda
          </button>
          <button
            type="button"
            onClick={() => setSubAba('celula')}
            className={`py-2 rounded-lg cursor-pointer ${subAba === 'celula' ? 'bg-blue-600 text-white' : 'text-blue-300'}`}
          >
            🏡 Célula
          </button>
          <button
            type="button"
            onClick={() => setSubAba('igreja')}
            className={`py-2 rounded-lg cursor-pointer ${subAba === 'igreja' ? 'bg-blue-600 text-white' : 'text-blue-300'}`}
          >
            ⛪ Igreja
          </button>
        </div>
      </div>

      {/* CONTEÚDO DA AGENDA */}
      {subAba === 'agenda' && (
        <div className="space-y-3 flex-1 overflow-y-auto">
          <div className="flex justify-between items-center bg-white p-3 rounded-xl border shadow-sm">
            <div>
              <h3 className="font-bold text-blue-900 text-sm">📅 Sua Agenda</h3>
              <p className="text-[10px] text-slate-500">Igreja: {codigoIgreja}</p>
            </div>
            <button
              type="button"
              onClick={() => setModalNovaAgenda(true)}
              className="px-3 py-1.5 bg-blue-900 text-white font-bold rounded-lg text-xs cursor-pointer"
            >
              ➕ Criar
            </button>
          </div>

          {carregando && <p className="text-center py-4 text-xs text-slate-500">Carregando dados da agenda...</p>}

          {erroAgenda && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs space-y-1">
              <p className="font-bold">⚠️ Erro no Banco de Dados:</p>
              <p className="font-mono text-[10px]">{erroAgenda}</p>
            </div>
          )}

          {!carregando && !erroAgenda && agenda.length === 0 && (
            <div className="p-6 text-center bg-white rounded-xl border border-dashed text-slate-400 text-xs">
              Sua agenda está vazia no momento.
            </div>
          )}

          {!carregando && agenda.length > 0 && (
            <div className="space-y-2">
              {agenda.map((item) => (
                <div key={item.id} className="bg-white p-3 rounded-xl border shadow-sm text-xs">
                  <span className="font-bold text-blue-900 block">
                    📅 {item.data_evento || 'Sem data'} às {item.hora_evento || '19:00'}
                  </span>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{item.titulo}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {subAba === 'perfil' && <div className="p-4 bg-white rounded-xl border text-xs">Perfil do Usuário</div>}
      {subAba === 'celula' && <div className="p-4 bg-white rounded-xl border text-xs">Informações da Célula</div>}
      {subAba === 'igreja' && <div className="p-4 bg-white rounded-xl border text-xs">Informações da Igreja</div>}

      {/* MODAL AGENDA */}
      {modalNovaAgenda && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-2xl p-4 space-y-3 text-xs">
            <h3 className="font-bold text-blue-900 text-sm border-b pb-2">Novo Compromisso</h3>
            <form onSubmit={handleSalvar} className="space-y-3">
              <div>
                <label className="block font-bold mb-1">Título</label>
                <input
                  type="text"
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  className="w-full border rounded-lg p-2"
                  placeholder="Ex: Culto / Reunião"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Data</label>
                  <input type="date" value={novaData} onChange={(e) => setNovaData(e.target.value)} className="w-full border rounded-lg p-2" />
                </div>
                <div>
                  <label className="block font-bold mb-1">Hora</label>
                  <input type="time" value={novaHora} onChange={(e) => setNovaHora(e.target.value)} className="w-full border rounded-lg p-2" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModalNovaAgenda(false)} className="w-full py-2 bg-slate-100 font-bold rounded-lg">Cancelar</button>
                <button type="submit" className="w-full py-2 bg-blue-900 text-white font-bold rounded-lg">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}e