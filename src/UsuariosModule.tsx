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

export default function UsuariosModule({ loggedUser }: { loggedUser: any }) {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);

  const [activeTab, setActiveTab] = useState<'usuarios' | 'agenda' | 'perfil' | 'celula' | 'igreja'>('usuarios');
  const [compromissos, setCompromissos] = useState<Compromisso[]>([]);
  const [loadingAgenda, setLoadingAgenda] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingCompromisso, setEditingCompromisso] = useState<Compromisso | null>(null);

  // Campos do Formulário
  const [descricao, setDescricao] = useState('');
  const [dataCompromisso, setDataCompromisso] = useState('');
  const [horaCompromisso, setHoraCompromisso] = useState('');
  const [lembreteMinutos, setLembreteMinutos] = useState(15);
  const [frequencia, setFrequencia] = useState('unica');

  const codigoIgreja = loggedUser?.codigo_igreja || 'IGR-001';

  // Carregar Usuários
  const carregarUsuarios = useCallback(async () => {
    setLoadingUsuarios(true);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('codigo_igreja', codigoIgreja);

      if (error) throw error;
      setUsuarios(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar usuários:', err.message);
    } finally {
      setLoadingUsuarios(false);
    }
  }, [codigoIgreja]);

  // Carregar Agenda
  const fetchCompromissos = useCallback(async () => {
    setLoadingAgenda(true);
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
      setLoadingAgenda(false);
    }
  }, [codigoIgreja]);

  useEffect(() => {
    carregarUsuarios();
    fetchCompromissos();
  }, [carregarUsuarios, fetchCompromissos]);

  // Solicitar permissão de Notificação
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  // Alarme sonoro em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      const agora = new Date();
      const dataHoje = agora.toISOString().split('T')[0];
      const horaAgora = agora.toTimeString().substring(0, 5);

      compromissos.forEach((c) => {
        if (c.data === dataHoje && c.hora === horaAgora && !c.concluido) {
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

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('⏰ Lembrete de Compromisso!', {
              body: `${c.descricao} às ${c.hora}`,
              icon: '/icon.png',
            });
          }
        }
      });
    }, 30000);

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
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 max-w-4xl mx-auto">
      {/* Abas Internas para alternar entre Gestão e Ferramentas */}
      <div className="flex gap-2 border-b pb-4">
        <button
          type="button"
          onClick={() => setActiveTab('usuarios')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'usuarios' ? 'bg-blue-900 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          👥 Controle de Usuários
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('agenda')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'agenda' ? 'bg-blue-900 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          📅 Módulo Agenda / Alarme
        </button>
      </div>

      {/* CONTEÚDO 1: CONTROLE DE USUÁRIOS */}
      {activeTab === 'usuarios' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h2 className="text-xl font-black text-blue-900">👥 Controle de Usuários</h2>
              <p className="text-xs text-slate-500">Gerencie os acessos dos membros da igreja ({codigoIgreja})</p>
            </div>
          </div>

          {loadingUsuarios ? (
            <p className="text-center py-8 text-xs text-slate-500">Carregando usuários...</p>
          ) : usuarios.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs border border-dashed rounded-2xl">
              Nenhum usuário cadastrado encontrado para esta igreja.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 uppercase">
                  <tr>
                    <th className="p-3">Nome</th>
                    <th className="p-3">E-mail</th>
                    <th className="p-3">Perfil</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usuarios.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-800">{u.nome_usuario || 'Sem nome'}</td>
                      <td className="p-3 text-slate-600">{u.email}</td>
                      <td className="p-3 font-semibold text-blue-900">{u.perfil || 'comum'}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-200">
                          Ativo
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CONTEÚDO 2: AGENDA / ALARME */}
      {activeTab === 'agenda' && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-5 rounded-2xl shadow-sm border flex justify-between items-center">
            <div>
              <h3 className="font-black text-blue-900 text-lg flex items-center gap-1.5">
                📅 Minha Agenda & Alarmes
              </h3>
              <p className="text-xs text-slate-500">Seus compromissos agendados com alerta</p>
            </div>
            <button
              type="button"
              onClick={handleOpenNew}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
            >
              + Criar
            </button>
          </div>

          {loadingAgenda ? (
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
                      className="p-2 bg-slate-100 hover:bg-blue-50 text-slate-700 rounded-xl transition cursor-pointer"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition cursor-pointer"
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

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE COMPROMISSO */}
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
                  placeholder="Ex: Reunião, Culto..."
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
                <label className="block font-bold text-slate-700 mb-1">🔔 Alarme Sonoro</label>
                <select
                  value={lembreteMinutos}
                  onChange={(e) => setLembreteMinutos(Number(e.target.value))}
                  className="w-full border rounded-xl p-2.5 bg-white outline-none"
                >
                  <option value={0}>Na hora exata</option>
                  <option value={5}>5 minutos antes</option>
                  <option value={15}>15 minutos antes</option>
                  <option value={30}>30 minutos antes</option>
                  <option value={60}>1 hora antes</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}