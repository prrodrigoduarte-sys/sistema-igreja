import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';

interface MembrosViewProps {
  codigoIgreja: string;
}

export default function MembrosView({ codigoIgreja }: MembrosViewProps) {
  const [members, setMembers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('codigo_igreja', codigoIgreja);

    if (error) {
      console.error("Erro ao buscar membros:", error.message);
    } else {
      setMembers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (codigoIgreja) {
      fetchMembers();
    }
  }, [codigoIgreja]);

  const filteredMembers = members.filter(
    (m) => !searchTerm || m.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Cadastro de Membros ({filteredMembers.length})</h2>
          <p className="text-xs text-slate-500">Clique na linha do membro para editar seu cadastro completo.</p>
        </div>

        <input
          type="text"
          placeholder="Buscar por Nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-64 rounded-xl border border-slate-300 p-2 text-sm"
        />
      </div>

      {loading ? (
        <p className="text-center py-6 text-slate-500">Carregando...</p>
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
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">Nenhum membro encontrado.</td>
                </tr>
              ) : (
                filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-blue-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">{m.nome}</td>
                    <td className="py-3 px-4">{m.tipo_cadastro}</td>
                    <td className="py-3 px-4 font-mono">{m.cpf || '-'}</td>
                    <td className="py-3 px-4">{m.celular_principal || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}