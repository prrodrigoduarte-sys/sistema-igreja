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
    console.log("Buscando membros para a igreja:", codigoIgreja);
    
    // Ajuste o nome da coluna aqui (ex: 'codigo_igreja' ou 'igreja_id')
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('codigo_igreja', codigoIgreja);

    if (error) {
      console.error("Erro ao buscar membros:", error.message);
    } else {
      console.log("Dados recebidos:", data);
      setMembers(data || []);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    if (codigoIgreja) {
      fetchMembers();
    }
  }, [codigoIgreja]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
      <div className="border-b pb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Cadastro de Membros ({members.length})</h2>
      </div>
      
      {loading ? (
        <div className="text-center py-10 text-slate-500">Carregando dados da igreja...</div>
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
              {members.length > 0 ? (
                members.map((m) => (
                  <tr key={m.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{m.nome || 'Sem nome'}</td>
                    <td className="py-3 px-4">{m.tipo_cadastro || '-'}</td>
                    <td className="py-3 px-4 font-mono">{m.cpf || '-'}</td>
                    <td className="py-3 px-4">{m.celular_principal || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-400">Nenhum membro encontrado para esta igreja.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}