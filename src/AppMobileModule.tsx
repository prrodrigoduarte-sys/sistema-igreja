// src/AppMobileModule.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

interface Props {
  loggedUser: any;
}

export default function AppMobileModule({ loggedUser }: Props) {
  // Estado simples para alternar as abas
  const [subAbaApp, setSubAbaApp] = useState<'perfil' | 'agenda' | 'celula' | 'igreja'>('agenda');

  // Estados da Agenda
  const [minhaAgenda, setMinhaAgenda] = useState<any[]>([]);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaData, setNovaData] = useState(new Date().toISOString().split('T')[0]);
  const [novaHora, setNovaHora] = useState('19:00');
  const [modalNovaAgenda, setModalNovaAgenda] = useState(false);
  const [carregandoAgenda, setCarregandoAgenda] = useState(false);

  // Estados de Perfil
  const [fotoUrl, setFotoUrl] = useState('');
  const [rua, setRua] = useState('Rua Coronel Antônio Barbosa');
  const [numero, setNumero] = useState('379');
  const [bairro, setBairro] = useState('São Francisco');
  const [cidade, setCidade] = useState('Teófilo Otoni');

  const codigoIgreja = loggedUser?.codigo_igreja || 'IGR-001';

  // Buscar compromissos da Agenda
  const carregarAgenda = useCallback(async () => {
    setCarregandoAgenda(true);
    try {
      const { data, error } = await supabase
        .from('agenda')
        .select('*')
        .eq('codigo_igreja', codigoIgreja);

      if (!error && data) {
        setMinhaAgenda(data);
      }
    } catch (err) {
      console.error('Erro ao buscar agenda:', err);
    } finally {
      setCarregandoAgenda(false);
    }
  }, [codigoIgreja]);

  useEffect(() => {
    carregarAgenda();
  }, [carregarAgenda]);

  const handleSalvarAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoTitulo.trim()) return alert('Digite a descrição do compromisso.');

    try {
      const { error } = await supabase.from('agenda').insert([
        {
          codigo_igreja: codigoIgreja,
          titulo: novoTitulo.trim(),
          data_evento: novaData,
          hora_evento: novaHora,
          tipo: 'Pessoal',
        },
      ]);

      if (error) throw error;

      alert('📅 Agendado com sucesso!');
      setNovoTitulo('');
      setModalNovaAgenda(false);
      carregarAgenda();
    } catch (err: any) {
      alert('Erro ao agendar: ' + err.message);
    }
  };

  const handleExcluirAgenda = async (id: any) => {
    if (!window.confirm('Deseja excluir este compromisso?')) return;
    try {
      const { error } = await supabase.from('agenda').delete().eq('id', id);
      if (error) throw error;
      carregarAgenda();
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-100 min-h-[85vh] rounded-3xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col">
      {/* CABEÇALHO AZUL DO APP */}
      <div className="bg-blue-900 text-white p-5 space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black">📱 App Sua Igreja</h2>
            <p className="text-xs text-blue-200">Olá, {loggedUser?.nome_usuario || 'RODRIGO DUARTE LUIZ'}</p>
          </div>
          <div className="w-10 h-10 bg-blue-800 rounded-full flex items-center justify-center font-bold border-2 border-white">
            👤
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="grid grid-cols-4 gap-1 bg-blue-950/60 p-1 rounded-xl text-[11px] font-bold text-center">
          <button
            type="button"
            onClick={() => setSubAbaApp('perfil')}
            className={`py-2 rounded-lg transition cursor-pointer ${
              subAbaApp === 'perfil' ? 'bg-blue-600 text-white font-extrabold shadow' : 'text-blue-200 hover:text-white'
            }`}
          >
            👤 Perfil
          </button>

          <button
            type="button"
            onClick={() => setSubAbaApp('agenda')}
            className={`py-2 rounded-lg transition cursor-pointer ${
              subAbaApp === 'agenda' ? 'bg-blue-600 text-white font-extrabold shadow' : 'text-blue-200 hover:text-white'
            }`}
          >
            📅 Agenda
          </button>

          <button
            type="button"
            onClick={() => setSubAbaApp('celula')}
            className={`py-2 rounded-lg transition cursor-pointer ${
              subAbaApp === 'celula' ? 'bg-blue-600 text-white font-extrabold shadow' : 'text-blue-200 hover:text-white'
            }`}
          >
            🏡 Célula
          </button>

          <button
            type="button"
            onClick={() => setSubAbaApp('igreja')}
            className={`py-2 rounded-lg transition cursor-pointer ${
              subAbaApp === 'igreja' ? 'bg-blue-600 text-white font-extrabold shadow' : 'text-blue-200 hover:text-white'
            }`}
          >
            ⛪ Igreja
          </button>
        </div>
      </div>

      {/* ÁREA DE CONTEÚDO */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {/* ABA AGENDA */}
        {subAbaApp === 'agenda' && (
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl border shadow-sm">
              <div>
                <h3 className="font-black text-blue-900 text-sm">📅 Minha Agenda</h3>
                <p className="text-[10px] text-slate-500">Seus compromissos agendados</p>
              </div>
              <button
                type="button"
                onClick={() => setModalNovaAgenda(true)}
                className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow cursor-pointer text-xs"
              >
                ➕ Criar
              </button>
            </div>

            {carregandoAgenda ? (
              <p className="text-center py-6 text-slate-400">Carregando compromissos...</p>
            ) : minhaAgenda.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-dashed text-slate-400 space-y-2">
                <p className="font-bold text-slate-700 text-xs">Sua agenda está vazia.</p>
                <p className="text-[11px] text-slate-500">Clique em "+ Criar" para agendar um compromisso!</p>
              </div>
            ) : (
              minhaAgenda.map((item) => (
                <div key={item.id} className="bg-white p-3.5 rounded-2xl border shadow-sm flex justify-between items-center">
                  <div>
                    <span className="font-bold text-blue-900 block">
                      📅 {item.data_evento} às {item.hora_evento || '19:00'}
                    </span>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{item.titulo}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleExcluirAgenda(item.id)}
                    className="px-2.5 py-1 bg-rose-50 text-rose-700 font-bold text-[10px] rounded-lg cursor-pointer"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ABA PERFIL */}
        {subAbaApp === 'perfil' && (
          <div className="bg-white p-4 rounded-2xl shadow-sm border space-y-4 text-xs">
            <h3 className="font-black text-blue-900 text-sm border-b pb-2">✏️ Editar Meu Cadastro</h3>
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">URL da Foto de Perfil</label>
                <input
                  type="text"
                  value={fotoUrl}
                  onChange={(e) => setFotoUrl(e.target.value)}
                  className="w-full border rounded-xl p-2.5 font-mono text-[10px]"
                  placeholder="Cole a URL da foto"
                />
              </div>

              <div className="space-y-2 border-t pt-2">
                <label className="block font-bold text-slate-700">Endereço Residencial</label>
                <div className="grid grid-cols-3 gap-2">
                  <input type="text" value={rua} onChange={(e) => setRua(e.target.value)} className="col-span-2 border rounded-xl p-2" />
                  <input type="text" value={numero} onChange={(e) => setNumero(e.target.value)} className="border rounded-xl p-2" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={bairro} onChange={(e) => setBairro(e.target.value)} className="border rounded-xl p-2" />
                  <input type="text" value={cidade} onChange={(e) => setCidade(e.target.value)} className="border rounded-xl p-2" />
                </div>
              </div>

              <button
                type="button"
                onClick={() => alert('Perfil salvo!')}
                className="w-full py-3 bg-blue-900 text-white font-bold rounded-xl shadow cursor-pointer mt-2"
              >
                💾 Atualizar Meu Cadastro
              </button>
            </div>
          </div>
        )}

        {/* ABA CÉLULA */}
        {subAbaApp === 'celula' && (
          <div className="bg-white p-5 rounded-2xl border space-y-2 text-xs">
            <h3 className="font-black text-blue-900 text-sm border-b pb-2">🏡 Minha Célula</h3>
            <p className="text-slate-600">Acesse e gerencie reuniões da sua célula.</p>
          </div>
        )}

        {/* ABA IGREJA */}
        {subAbaApp === 'igreja' && (
          <div className="bg-white p-5 rounded-2xl border space-y-3 text-xs">
            <h3 className="font-black text-blue-900 text-sm border-b pb-2">⛪ Informações da Igreja</h3>
            <p className="text-slate-600">📍 Endereço: Teófilo Otoni - MG</p>
          </div>
        )}
      </div>

      {/* MODAL AGENDA */}
      {modalNovaAgenda && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-3xl p-5 space-y-3 text-xs">
            <h3 className="font-black text-blue-900 text-sm border-b pb-2">Novo Compromisso</h3>
            <form onSubmit={handleSalvarAgenda} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição *</label>
                <input
                  type="text"
                  placeholder="Ex: Discipulado / Reunião"
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  className="w-full border rounded-xl p-2 font-semibold"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data</label>
                  <input type="date" value={novaData} onChange={(e) => setNovaData(e.target.value)} className="w-full border rounded-xl p-2" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hora</label>
                  <input type="time" value={novaHora} onChange={(e) => setNovaHora(e.target.value)} className="w-full border rounded-xl p-2" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModalNovaAgenda(false)} className="w-full py-2.5 bg-slate-100 font-bold rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" className="w-full py-2.5 bg-blue-900 text-white font-bold rounded-xl shadow cursor-pointer">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}