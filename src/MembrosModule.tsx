// src/MembrosModule.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

interface Membro {
  id: string;
  nome: string;
  email: string;
}

interface MembrosModuleProps {
  loggedUser: any;
}

interface FormMembro {
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
}

const formInicial: FormMembro = {
  nome: '',
  email: '',
  telefone: '',
  cpf: '',
};

export default function MembrosModule({
  loggedUser,
}: MembrosModuleProps) {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Membro | null>(null);

  const [formMembro, setFormMembro] =
    useState<FormMembro>(formInicial);

    const fetchMembros = useCallback(async () => {
      setLoading(true);
      setError(null);
    
      try {
        const codigoIgreja =
          loggedUser?.igrejas?.codigo_igreja ||
          loggedUser?.codigo_igreja;
    
        console.log('Usuário no módulo:', loggedUser);
        console.log('Código da igreja:', codigoIgreja);
    
        if (!codigoIgreja) {
          throw new Error(
            'Código da igreja não encontrado.'
          );
        }
    
        const { data, error: erroConsulta } = await supabase
          .from('members')
          .select('*')
          .eq('codigo_igreja', codigoIgreja);
    
        if (erroConsulta) {
          throw erroConsulta;
        }
    
        console.log('Membros recebidos:', data);
    
        setMembros(data || []);
      } catch (erro: any) {
        console.error('Erro ao carregar membros:', erro);
    
        setMembros([]);
        setError(
          erro?.message || 'Erro ao carregar membros.'
        );
      } finally {
        setLoading(false);
      }
    }, [loggedUser]);

    useEffect(() => {
      const codigoIgreja =
        loggedUser?.igrejas?.codigo_igreja ||
        loggedUser?.codigo_igreja;
    
      if (!loggedUser) {
        setLoading(false);
        setError('Usuário não carregado.');
        return;
      }
    
      if (!codigoIgreja) {
        setLoading(false);
        setError(
          'Código da igreja não encontrado para este usuário.'
        );
        return;
      }
    
      fetchMembros();
    }, [loggedUser, fetchMembros]);

  const handleOpenNewMemberModal = () => {
    setEditingMember(null);
    setFormMembro(formInicial);
    setShowMemberModal(true);
  };

  const handleOpenEditMemberModal = (membro: Membro) => {
    setEditingMember(membro);

    setFormMembro({
      nome: membro.nome || '',
      email: membro.email || '',
      telefone: '',
      cpf: '',
    });

    setShowMemberModal(true);
  };

  const handleCloseModal = () => {
    setShowMemberModal(false);
    setEditingMember(null);
    setFormMembro(formInicial);
  };

  const handleChange = (
    campo: keyof FormMembro,
    valor: string
  ) => {
    setFormMembro((formAtual) => ({
      ...formAtual,
      [campo]: valor,
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    alert(
      editingMember
        ? 'Formulário de edição preenchido. O salvamento será feito na próxima etapa.'
        : 'Formulário de novo membro preenchido. O salvamento será feito na próxima etapa.'
    );
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-3xl font-black text-blue-900 tracking-tight">
            Cadastros: Membros
          </h2>

          <p className="text-slate-600 mt-2">
            Gerencie os membros da sua igreja.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNewMemberModal}
          className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer"
        >
          + Novo Membro
        </button>
      </div>

      {loading && (
        <p className="text-slate-500">
          Carregando membros...
        </p>
      )}

      {error && (
        <p className="text-red-500">
          Erro: {error}
        </p>
      )}

      {!loading && !error && membros.length === 0 && (
        <p className="text-slate-500 mt-4">
          Nenhum membro encontrado.
        </p>
      )}

      {!loading && !error && membros.length > 0 && (
        <ul className="space-y-2 mt-4">
          {membros.map((membro) => (
            <li
              key={membro.id}
              className="p-3 border rounded-lg bg-slate-50 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">
                  {membro.nome}
                </p>

                <p className="text-sm text-slate-600">
                  {membro.email}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenEditMemberModal(membro)}
                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold text-xs rounded-lg"
              >
                Editar
              </button>
            </li>
          ))}
        </ul>
      )}

      {showMemberModal && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8">
            <div className="flex justify-between items-center border-b pb-4 mb-6">
              <h3 className="text-xl font-black text-blue-900">
                {editingMember ? 'Editar Membro' : 'Novo Membro'}
              </h3>

              <button
                type="button"
                onClick={handleCloseModal}
                className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl"
              >
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Nome completo
                  </label>

                  <input
                    type="text"
                    value={formMembro.nome}
                    onChange={(event) =>
                      handleChange('nome', event.target.value)
                    }
                    placeholder="Digite o nome completo"
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    E-mail
                  </label>

                  <input
                    type="email"
                    value={formMembro.email}
                    onChange={(event) =>
                      handleChange('email', event.target.value)
                    }
                    placeholder="nome@email.com"
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Telefone
                  </label>

                  <input
                    type="text"
                    value={formMembro.telefone}
                    onChange={(event) =>
                      handleChange('telefone', event.target.value)
                    }
                    placeholder="(00) 00000-0000"
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    CPF
                  </label>

                  <input
                    type="text"
                    value={formMembro.cpf}
                    onChange={(event) =>
                      handleChange('cpf', event.target.value)
                    }
                    placeholder="000.000.000-00"
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md"
                >
                  {editingMember ? 'Salvar alterações' : 'Cadastrar membro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}