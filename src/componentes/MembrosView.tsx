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
    console.log("Tentando buscar membros...");

    // Buscando tudo sem filtro para testar a tabela
    const { data, error } = await supabase
      .from('members')
      .select('*');

    if (error) {
      console.error("ERRO DO SUPABASE:", error);
      alert("Erro ao buscar dados: " + error.message);
    } else {
      console.log("DADOS RECEBIDOS:", data);
      setMembers(data || []);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">Cadastro de Membros</h2>
      
      {loading ? (
        <p className="text-center">Carregando...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-slate-600 text-sm">
                <th className="py-2">Nome</th>
                <th className="py-2">CPF</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700">
              {members.map((m) => (
                <tr key={m.id} className="border-b">
                  <td className="py-2 font-bold">{m.nome || 'Sem nome'}</td>
                  <td className="py-2">{m.cpf || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}