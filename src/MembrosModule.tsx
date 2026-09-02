// src/MembrosModule.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

interface Membro {
  id: string;
  nome: string;
  email: string;
  // Adicione outros campos da sua tabela 'members' aqui
  // Para a próxima etapa, vamos precisar de todos os campos do seu App.tsx antigo
  // Por enquanto, manteremos simples para focar na estrutura do modal.
}

interface MembrosModuleProps {
  loggedUser: any;
  // Por enquanto, não precisamos de ministeriosList ou onRefreshMembers aqui,
  // mas vamos adicioná-los quando implementarmos o formulário completo.
}

export default function MembrosModule({ loggedUser }: MembrosModuleProps) {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false); // Novo estado para controlar o modal
  const [editingMember, setEditingMember] = useState<Membro | null>(null); // Para edição

  const fetchMembros = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Usando o código da igreja do usuário logado para filtrar
      const codigoIgreja = loggedUser?.igrejas?.codigo_igreja || 'IGR-001'; // Fallback para 'IGR-001' se não houver
      console.log('Tentando buscar membros para a igreja:', codigoIgreja);

      const { data, error } = await supabase
        .from('members')
        .select('id, nome, email') // Selecionando apenas os campos que estamos usando agora
        .eq('codigo_igreja', codigoIgreja)
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro retornado pelo Supabase:', error);
        setError(error.message);
        setMembros([]);
      } else {
        console.log('Dados de membros recebidos:', data);
        setMembros(data || []);
      }
    } catch (err: any) {
      console.error('Erro ao buscar membros (catch):', err);
      setError('Erro ao carregar membros: ' + err.message);
      setMembros([]);
    } finally {
      setLoading(false);
    }
  }, [loggedUser]); // Dependência para recarregar se o loggedUser mudar

  useEffect(() => {
    if (loggedUser) { // Só busca se o usuário estiver logado
      fetchMembros();
    }
  }, [loggedUser, fetchMembros]);

  // Função para abrir o modal para um novo membro
  const handleOpenNewMemberModal = () => {
    setEditingMember(null); // Limpa qualquer membro em edição
    setShowMemberModal(true);
  };

  // Função para abrir o modal para editar um membro existente
  const handleOpenEditMemberModal = (member: Membro) => {
    setEditingMember(member);
    setShowMemberModal(true);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-black text-blue-900 tracking-tight">Cadastros: Membros</h2>
        <button
          onClick={handleOpenNewMemberModal} // Botão para abrir o modal de novo membro
          className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer"
        >
          + Novo Membro
        </button>
      </div>
      <p className="text-slate-600 mt-2">Aqui você pode gerenciar os membros da sua igreja.</p>

      {loading && <p>Carregando membros...</p>}
      {error && <p className="text-red-500">Erro: {error}</p>}

      {!loading && !error && membros.length === 0 ? (
        <p>Nenhum membro encontrado na tabela 'members'.</p>
      ) : (
        <ul className="space-y-2 mt-4">
          {membros.map((membro) => (
            <li key={membro.id} className="p-3 border rounded-lg bg-slate-50 flex justify-between items-center">
              <div>
                <p className="font-semibold">{membro.nome}</p>
                <p className="text-sm text-slate-600">{membro.email}</p>
              </div>
              <button
                onClick={() => handleOpenEditMemberModal(membro)} // Botão para editar
                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold text-xs rounded-lg"
              >
                Editar
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Modal de Cadastro/Edição de Membro */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-lg font-black text-blue-900">
                {editingMember ? 'Editar Membro' : 'Novo Membro'}
              </h3>
              <button
                onClick={() => setShowMemberModal(false)}
                className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            {/* Conteúdo do formulário virá aqui */}
            <p className="text-slate-600">
              Aqui será o formulário para {editingMember ? 'editar' : 'cadastrar'} o membro.
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowMemberModal(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              {/* O botão de salvar virá aqui quando tivermos o formulário */}
              <button
                type="submit" // Este type="submit" só funcionará dentro de um <form>
                className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer"
                disabled // Desabilitado por enquanto
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}