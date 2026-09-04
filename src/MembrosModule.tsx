// src/MembrosModule.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

interface Membro {
  id: string;
  codigo_igreja: string;
  tipo_cadastro: string;
  nome: string;
  cpf: string;
  rg: string;
  data_nascimento: string;
  estado_civil: string;
  celular_principal: string;
  email: string;
  endereco: string;
  bairro: string;
  rua: string;
  numero: string;
  cidade: string;
  estado: string;
  cep: string;
  foto_url: string;
  ministerio_id: string;
}

interface MembrosModuleProps {
  loggedUser: any;
}

const formInicial = {
  tipo_cadastro: 'Membro',
  nome: '',
  cpf: '',
  rg: '',
  data_nascimento: '',
  estado_civil: 'Solteiro(a)',
  celular_principal: '',
  email: '',
  endereco: '',
  bairro: '',
  rua: '',
  numero: '',
  cidade: '',
  estado: '',
  cep: '',
  foto_url: '',
  ministerio_id: '',
};

export default function MembrosModule({ loggedUser }: MembrosModuleProps) {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Membro | null>(null);
  const [formMembro, setFormMembro] = useState(formInicial);

  const codigoIgreja =
    loggedUser?.igrejas?.codigo_igreja ||
    loggedUser?.codigo_igreja;

  const fetchMembros = useCallback(async () => {
    setLoading(true);
    setError(null);
  
    try {
      if (!codigoIgreja) {
        throw new Error('Código da igreja não encontrado.');
      }
  
      const { data, error: erroConsulta } = await supabase
        .from('members')
        .select('*')
        .eq('codigo_igreja', codigoIgreja);
  
      if (erroConsulta) throw erroConsulta;
  
      setMembros(data || []);
    } catch (erro: any) {
      console.error('Erro ao carregar membros:', erro);
      setMembros([]);
      setError(erro?.message || 'Erro ao carregar membros.');
    } finally {
      setLoading(false);
    }
  }, [codigoIgreja]);

  useEffect(() => {
    // Se o usuário do maestro ainda estiver carregando, aguarda
    if (!loggedUser) {
      return;
    }
  
    if (!codigoIgreja) {
      setLoading(false);
      setError('Código da igreja não encontrado para este usuário.');
      return;
    }
  
    fetchMembros();
  }, [loggedUser, codigoIgreja, fetchMembros]);

  const handleOpenNewMemberModal = () => {
    setEditingMember(null);
    setFormMembro(formInicial);
    setShowMemberModal(true);
  };

  const handleOpenEditMemberModal = (membro: Membro) => {
    setEditingMember(membro);
    setFormMembro({
      tipo_cadastro: membro.tipo_cadastro || 'Membro',
      nome: membro.nome || '',
      cpf: membro.cpf || '',
      rg: membro.rg || '',
      data_nascimento: membro.data_nascimento || '',
      estado_civil: membro.estado_civil || 'Solteiro(a)',
      celular_principal: membro.celular_principal || '',
      email: membro.email || '',
      endereco: membro.endereco || '',
      bairro: membro.bairro || '',
      rua: membro.rua || '',
      numero: membro.numero || '',
      cidade: membro.cidade || '',
      estado: membro.estado || '',
      cep: membro.cep || '',
      foto_url: membro.foto_url || '',
      ministerio_id: membro.ministerio_id || '',
    });
    setShowMemberModal(true);
  };

  const handleCloseModal = () => {
    setShowMemberModal(false);
    setEditingMember(null);
    setFormMembro(formInicial);
  };

  const handleChange = (campo: string, valor: string) => {
    setFormMembro((formAtual) => ({
      ...formAtual,
      [campo]: valor,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!codigoIgreja) {
      alert('Erro: Código da igreja não identificado.');
      return;
    }

    try {
      const payload = {
        ...formMembro,
        codigo_igreja: codigoIgreja,
        ministerio_id: formMembro.ministerio_id || null,
      };

      if (editingMember) {
        const { error: updateError } = await supabase
          .from('members')
          .update(payload)
          .eq('id', editingMember.id);

        if (updateError) throw updateError;
        alert('Membro atualizado com sucesso!');
      } else {
        const { error: insertError } = await supabase
          .from('members')
          .insert([payload]);

        if (insertError) throw insertError;
        alert('Membro cadastrado com sucesso!');
      }

      handleCloseModal();
      fetchMembros();
    } catch (err: any) {
      console.error('Erro ao salvar membro:', err);
      alert('Erro ao salvar membro: ' + (err.message || 'Erro desconhecido'));
    }
  };

  if (!loggedUser) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-6xl mx-auto">
        <p className="text-slate-500">Carregando informações do usuário...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-black text-blue-900 tracking-tight">
            Cadastros: Membros
          </h2>
          <p className="text-slate-600 mt-1">
            Gerenciamento completo dos registros de membros da instituição.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNewMemberModal}
          className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer"
        >
          + Novo Membro
        </button>
      </div>

      {loading && <p className="text-slate-500">Carregando membros...</p>}
      {error && <p className="text-red-500">Erro: {error}</p>}

      {!loading && !error && membros.length === 0 && (
        <p className="text-slate-500 mt-4">Nenhum membro encontrado.</p>
      )}

      {!loading && !error && membros.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-slate-50 text-slate-700 text-xs uppercase font-bold">
                <th className="p-3">Nome</th>
                <th className="p-3">E-mail</th>
                <th className="p-3">Celular</th>
                <th className="p-3">Tipo</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {membros.map((membro) => (
                <tr key={membro.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 font-semibold text-slate-800">{membro.nome}</td>
                  <td className="p-3 text-slate-600">{membro.email || '-'}</td>
                  <td className="p-3 text-slate-600">{membro.celular_principal || '-'}</td>
                  <td className="p-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-lg">
                      {membro.tipo_cadastro}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleOpenEditMemberModal(membro)}
                      className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-lg transition"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showMemberModal && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl p-8 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4 mb-6 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-black text-blue-900">
                {editingMember ? 'Editar Membro' : 'Novo Membro'}
              </h3>
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl transition"
              >
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Cadastro</label>
                  <select
                    value={formMembro.tipo_cadastro}
                    onChange={(e) => handleChange('tipo_cadastro', e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Membro">Membro</option>
                    <option value="Visitante">Visitante</option>
                    <option value="Congregado">Congregado</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    value={formMembro.nome}
                    onChange={(e) => handleChange('nome', e.target.value)}
                    placeholder="Nome completo"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">CPF</label>
                  <input
                    type="text"
                    value={formMembro.cpf}
                    onChange={(e) => handleChange('cpf', e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">RG</label>
                  <input
                    type="text"
                    value={formMembro.rg}
                    onChange={(e) => handleChange('rg', e.target.value)}
                    placeholder="Número do RG"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Data de Nascimento</label>
                  <input
                    type="date"
                    value={formMembro.data_nascimento}
                    onChange={(e) => handleChange('data_nascimento', e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Estado Civil</label>
                  <select
                    value={formMembro.estado_civil}
                    onChange={(e) => handleChange('estado_civil', e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Solteiro(a)">Solteiro(a)</option>
                    <option value="Casado(a)">Casado(a)</option>
                    <option value="Divorciado(a)">Divorciado(a)</option>
                    <option value="Viúvo(a)">Viúvo(a)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Celular Principal</label>
                  <input
                    type="text"
                    value={formMembro.celular_principal}
                    onChange={(e) => handleChange('celular_principal', e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">E-mail</label>
                  <input
                    type="email"
                    value={formMembro.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="email@exemplo.com"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">CEP</label>
                  <input
                    type="text"
                    value={formMembro.cep}
                    onChange={(e) => handleChange('cep', e.target.value)}
                    placeholder="00000-000"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Rua</label>
                  <input
                    type="text"
                    value={formMembro.rua}
                    onChange={(e) => handleChange('rua', e.target.value)}
                    placeholder="Nome da rua / avenida"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Número</label>
                  <input
                    type="text"
                    value={formMembro.numero}
                    onChange={(e) => handleChange('numero', e.target.value)}
                    placeholder="Número"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Bairro</label>
                  <input
                    type="text"
                    value={formMembro.bairro}
                    onChange={(e) => handleChange('bairro', e.target.value)}
                    placeholder="Bairro"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cidade</label>
                  <input
                    type="text"
                    value={formMembro.cidade}
                    onChange={(e) => handleChange('cidade', e.target.value)}
                    placeholder="Cidade"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Estado</label>
                  <input
                    type="text"
                    value={formMembro.estado}
                    onChange={(e) => handleChange('estado', e.target.value)}
                    placeholder="UF (ex: MG)"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Endereço Completo / Complemento</label>
                  <input
                    type="text"
                    value={formMembro.endereco}
                    onChange={(e) => handleChange('endereco', e.target.value)}
                    placeholder="Complemento, bloco, apartamento, etc."
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">URL da Foto</label>
                  <input
                    type="text"
                    value={formMembro.foto_url}
                    onChange={(e) => handleChange('foto_url', e.target.value)}
                    placeholder="https://exemplo.com/foto.jpg"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

              </div>

              <div className="flex justify-end gap-3 pt-6 mt-6 border-t sticky bottom-0 bg-white z-10">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md transition"
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