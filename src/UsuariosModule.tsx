import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

interface Compromisso {
  id: string;
  descricao: string;
  data: string;
  hora: string;
  lembrete_minutos?: number;
  frequencia?: string;
  concluido?: boolean;
}

export default function AppMobileModule({ loggedUser }: { loggedUser: any }) {
  const [activeTab, setActiveTab] = useState<'perfil' | 'agenda' | 'celula' | 'igreja'>('agenda');
  const [compromissos, setCompromissos] = useState<Compromisso[]>([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingCompromisso, setEditingCompromisso] = useState<Compromisso | null>(null);

  // Campos do Formulário Expandido com Alarme
  const [descricao, setDescricao] = useState('');
  const [dataCompromisso, setDataCompromisso] = useState('');
  const [horaCompromisso, setHoraCompromisso] = useState('');
  const [lembreteMinutos, setLembreteMinutos] = useState(15);
  const [frequencia, setFrequencia] = useState('unica');

  const codigoIgreja = loggedUser?.codigo_igreja || 'IGR-001';

  // Solicitar permissão de Notificação do Navegador ao carregar
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  const fetchCompromissos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agenda_mobile')
        .select('*')
        .eq('codigo_igreja', codigoIgreja)
        .order('data', { ascending: true })
        .order('hora', { ascending: true });

      if (error) throw error;
      setCompromissos(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar agenda:', err);
    } finally {
      setLoading(false);
    }
  }, [codigoIgreja]);

  useEffect(() => {
    fetchCompromissos();
  }, [fetchCompromissos]);

  // Alarme sonoro e notificação ativa em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      const agora = new Date();
      const dataHoje = agora.toISOString().split('T')[0];
      const horaAgora = agora.toTimeString().substring(0, 5);

      compromissos.forEach((c) => {
        if (c.data === dataHoje && c.hora === horaAgora && !c.concluido) {
          // Tocar alarme sintético
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 1.5);
          } catch (e) {
            console.log('Audio Context bloqueado pelo navegador');
          }

          // Disparar notificação visual no celular
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('⏰ Lembrete de Compromisso!', {
              body: `${c.descricao} às ${c.hora}`,
              icon: '/icon.png',
            });
          }
        }
      });
    }, 30000); // Checa a cada 30 segundos

    return () => clearInterval(interval);
  }, [compromissos]);

  const handleOpenNew = () => {
    setEditingCompromisso(null);
    setDescricao('');
    const hoje = new Date().toISOString().split('T')[0];
    setDataCompromisso(hoje);
    setHoraCompromisso('08:00');
    setLembreteMinutos(15);
    setFrequencia('unica');
    setShowModal(true);
  };

  const handleOpenEdit = (item: Compromisso) => {
    setEditingCompromisso(item);
    setDescricao(item.descricao);
    setDataCompromisso(item.data);
    setHoraCompromisso(item.hora);
    setLembreteMinutos(item.lembrete_minutos || 15);
    setFrequencia(item.frequencia || 'unica');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        codigo_igreja: codigoIgreja,
        descricao,
        data: dataCompromisso,
        hora: horaCompromisso,
        lembrete_minutos: Number(lembreteMinutos),
        frequencia,
      };

      if (editingCompromisso) {
        const { error } = await supabase
          .from('agenda_mobile')
          .update(payload)
          .eq('id', editingCompromisso.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('agenda_mobile').insert([payload]);
        if (error) throw error;
      }

      setShowModal(false);
      fetchCompromissos();
    } catch (err: any) {
      alert('Erro ao salvar compromisso: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este compromisso?')) return;
    try {
      const { error } = await supabase.from('agenda_mobile').delete().eq('id', id);
      if (error) throw error;
      fetchCompromissos();
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-100 min-h-screen pb-12 shadow-2xl rounded-3xl overflow-hidden border border-slate-200">
      {/* HEADER MOBILE ORIGINAL */}
      <div className="bg-blue-900 text-white p-6 rounded-b-3xl shadow-lg space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black flex items-center gap-2">📱 App Sua Igreja</h2>
            <p className="text-xs text-blue-200 mt-0.5">Olá, {loggedUser?.nome_usuario || 'RODRIGO DUARTE LUIZ'}</p>
          </div>
          <div className="w-12 h-12 rounded-full border-2 border-white/40 overflow-hidden bg-blue-800 flex items-center justify-center font-bold text-lg">
            👤
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS DO APP */}
        <div className="grid grid-cols-4 gap-1 bg-blue-950/60 p-1.5 rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('perfil')}
            className={`py-2 rounded-xl transition ${activeTab === 'perfil' ? 'bg-blue-600 text-white shadow' : 'text-blue-200 hover:text-white'}`}
          >
            👤 Perfil
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('agenda')}
            className={`py-2 rounded-xl transition ${activeTab === 'agenda' ? 'bg-blue-600 text-white shadow' : 'text-blue-200 hover:text-white'}`}
          >
            📅 Agenda
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('celula')}
            className={`py-2 rounded-xl transition ${activeTab === 'celula' ? 'bg-blue-600 text-white shadow' : 'text-blue-200 hover:text-white'}`}
          >
            🏡 Célula
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('igreja')}
            className={`py-2 rounded-xl transition ${activeTab === 'igreja' ? 'bg-blue-600 text-white shadow' : 'text-blue-200 hover:text-white'}`}
          >
            🏛️ Igreja
          </button>
        </div>
      </div>

      {/* CONTEÚDO DA AGENDA */}
      {activeTab === 'agenda' && (
        <div className="p-4 space-y-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border flex justify-between items-center">
            <div>
              <h3 className="font-black text-blue-900 text-lg flex items-center gap-1.5">
                📅 Minha Agenda
              </h3>
              <p className="text-xs text-slate-500">Seus compromissos e alarmes</p>
            </div>
            <button
              type="button"
              onClick={handleOpenNew}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition"
            >
              + Criar
            </button>
          </div>

          {loading ? (
            <p className="text-center text-xs text-slate-500 py-6">Carregando compromissos...</p>
          ) : compromissos.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl text-center border border-dashed text-slate-400 text-xs">
              Nenhum compromisso agendado.
            </div>
          ) : (
            <div className="space-y-3">
              {compromissos.map((c) => (
                <div key={c.id} className="bg-white p-4 rounded-2xl shadow-sm border flex justify-between items-center">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                        📅 {c.data} às {c.hora}
                      </span>
                      {c.lembrete_minutos && (
                        <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-1.5 py-0.5 rounded border border-amber-200">
                          🔔 {c.lembrete_minutos}m antes
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-slate-800 text-sm">{c.descricao}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(c)}
                      className="p-2 bg-slate-100 hover:bg-blue-50 text-slate-700 rounded-xl transition"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL DE CRIAÇÃO / EDIÇÃO COM ALARME */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-black text-blue-900 border-b pb-3">
              {editingCompromisso ? '✏️ Editar Compromisso' : '📅 Novo Compromisso'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição *</label>
                <input
                  type="text"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex: Pilates, Reunião da Célula..."
                  className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data</label>
                  <input
                    type="date"
                    value={dataCompromisso}
                    onChange={(e) => setDataCompromisso(e.target.value)}
                    className="w-full border rounded-xl p-2.5 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hora</label>
                  <input
                    type="time"
                    value={horaCompromisso}
                    onChange={(e) => setHoraCompromisso(e.target.value)}
                    className="w-full border rounded-xl p-2.5 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">🔔 Notificar / Alarme Sonoro</label>
                <select
                  value={lembreteMinutos}
                  onChange={(e) => setLembreteMinutos(Number(e.target.value))}
                  className="w-full border rounded-xl p-2.5 bg-white outline-none"
                >
                  <option value={0}>Na hora exata do compromisso</option>
                  <option value={5}>5 minutos antes</option>
                  <option value={15}>15 minutos antes</option>
                  <option value={30}>30 minutos antes</option>
                  <option value={60}>1 hora antes</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">🔁 Frequência de Repetição</label>
                <select
                  value={frequencia}
                  onChange={(e) => setFrequencia(e.target.value)}
                  className="w-full border rounded-xl p-2.5 bg-white outline-none"
                >
                  <option value="unica">Única vez</option>
                  <option value="semanal">Toda semana neste dia</option>
                  <option value="mensal">Todo mês nesta data</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}