import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';

interface AgendaViewProps {
  codigoIgreja: string;
}

export default function AgendaView({ codigoIgreja }: AgendaViewProps) {
  const [compromissos, setCompromissos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgenda = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('agenda_compromissos')
          .select('*')
          .eq('codigo_igreja', codigoIgreja)
          .order('data_compromisso', { ascending: true });

        if (error) throw error;
        setCompromissos(data || []);
      } catch (err) {
        console.error("Erro ao carregar agenda:", err);
      } finally {
        setLoading(false);
      }
    };

    if (codigoIgreja) fetchAgenda();
  }, [codigoIgreja]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">📅 Agenda de Compromissos</h2>
      
      {loading ? (
        <p className="text-center py-6 text-slate-500">Carregando agenda...</p>
      ) : compromissos.length === 0 ? (
        <p className="text-center py-6 text-slate-400">Nenhum compromisso agendado para esta igreja.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {compromissos.map((c) => (
            <div key={c.id} className="p-4 border border-slate-200 rounded-2xl bg-slate-50 space-y-2">
              <h4 className="font-bold text-slate-900">{c.titulo}</h4>
              <p className="text-xs text-slate-600">{c.descricao || 'Sem descrição.'}</p>
              <div className="text-xs text-slate-500 font-mono pt-2 border-t">
                🗓️ {c.data_compromisso} às {c.hora_compromisso || '00:00'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
