// src/MembrosModule.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from './supabase'; // Importa a instância do Supabase

interface MembrosModuleProps {
  loggedUser: any; // O usuário logado pode ser útil para permissões futuras
}

interface Membro {
  id: string;
  nome: string;
  email: string;
  // Adicione outros campos da sua tabela 'members' aqui
}

export default function MembrosModule({ loggedUser }: MembrosModuleProps) {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembros = async () => {
      setLoading(true);
      setError(null);
      try {
        // Supondo que sua tabela de membros se chame 'members'
        const { data, error } = await supabase
          .from('members') // Nome da sua tabela de membros
          .select('id, nome, email'); // Selecione os campos que você quer exibir

        if (error) {
          throw error;
        }
        setMembros(data || []);
      } catch (err: any) {
        console.error('Erro ao buscar membros:', err.message);
        setError('Não foi possível carregar os membros: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMembros();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-black text-blue-900 tracking-tight">Cadastros: Membros</h2>
        <p>Carregando membros...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 max-w-5xl mx-auto text-red-600">
        <h2 className="text-3xl font-black text-blue-900 tracking-tight">Cadastros: Membros</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 max-w-5xl mx-auto">
      <h2 className="text-3xl font-black text-blue-900 tracking-tight">Cadastros: Membros</h2>
      <p className="text-slate-600 mt-2">Aqui você pode gerenciar os membros da sua igreja.</p>

      {membros.length === 0 ? (
        <p>Nenhum membro encontrado na tabela 'members'.</p>
      ) : (
        <ul className="space-y-2">
          {membros.map((membro) => (
            <li key={membro.id} className="p-3 border rounded-lg bg-slate-50">
              <p className="font-semibold">{membro.nome}</p>
              <p className="text-sm text-slate-600">{membro.email}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}