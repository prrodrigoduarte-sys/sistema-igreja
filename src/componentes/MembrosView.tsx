import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';

interface MembrosViewProps {
  codigoIgreja: string;
}

export default function MembrosView({ codigoIgreja }: MembrosViewProps) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('members')
      .select('*')
      .eq('codigo_igreja', codigoIgreja);
    setMembers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (codigoIgreja) fetchMembers();
  }, [codigoIgreja]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-slate-800">Cadastro de Membros ({members.length})</h2>
      </div>
      
      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-slate-600 text-sm font-semibold">
                <th className="py-3 px-4">Nome</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">CPF</th>
                <th className="py-3 px-4">Celular</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm text-slate-700">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-blue-50/50">
                  <td className="py-3 px-4 font-bold">{m.nome}</td>
                  <td className="py-3 px-4">{m.tipo_cadastro}</td>
                  <td className="py-3 px-4 font-mono">{m.cpf || '-'}</td>
                  <td className="py-3 px-4">{m.celular_principal || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}