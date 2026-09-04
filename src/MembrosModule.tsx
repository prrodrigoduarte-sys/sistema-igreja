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
  const [termoBusca, setTermoBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Membro | null>(null);
  const [membroSelecionado, setMembroSelecionado] = useState<Membro | null>(null);
  const [formMembro, setFormMembro] = useState(formInicial);

  const codigoIgreja =
    loggedUser?.codigo_igreja ||
    loggedUser?.igrejas?.codigo_igreja;

  // Função de busca sob demanda (consulta)
  const handlePesquisar = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!codigoIgreja) {
      setError('Código da igreja não encontrado.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('members')
        .select('*')
        .eq('codigo_igreja', codigoIgreja);

      if (termoBusca.trim() !== '') {
        query = query.ilike('nome', `%${termoBusca.trim()}%`);
      } else {
        // Limita a quantidade inicial caso busque vazio para manter leve
        query = query.limit(15);
      }

      const { data, error: erroConsulta } = await query;

      if (erroConsulta) throw erroConsulta;

      setMembros(data || []);
    } catch (erro: any) {
      console.error('Erro ao buscar membros:', erro);
      setMembros([]);
      setError(erro?.message || 'Erro ao buscar membros.');
    } finally {
      setLoading(false);
    }
  }, [codigoIgreja, termoBusca]);

  // Carregamento inicial leve (opcional: traz os primeiros cadastros ou deixa vazio)
  useEffect(() => {
    if (!loggedUser || !codigoIgreja) return;
    handlePesquisar();
  }, [loggedUser, codigoIgreja, handlePesquisar]);

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

  const handleVerDetalhes = (membro: Membro) => {
    setMembroSelecionado(membro);
    setShowDetalhesModal(true);
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
      handlePesquisar();
    } catch (err: any) {
      console.error('Erro ao salvar membro:', err);
      alert('Erro ao salvar membro: ' + (err.message || 'Erro desconhecido'));
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    const confirmou = window.confirm(`Deseja realmente excluir o membro "${nome}"?`);
    if (!confirmou) return;

    try {
      const { error: deleteError } = await supabase
        .from('members')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      alert('Membro excluído com sucesso!');
      handlePesquisar();
    } catch (err: any) {
      console.error('Erro ao excluir membro:', err);
      alert('Erro ao excluir membro: ' + (err.message || 'Erro desconhecido'));
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
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-6xl mx-auto space-y-6">
      
      {/* Cabeçalho e Ação de Cadastro */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-blue-900 tracking-tight">
            Consulta de Membros
          </h2>
          <p className="text-slate-600 mt-1">
            Pesquise por nome ou cadastre novos membros na instituição.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNewMemberModal}
          className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer shrink-0"
        >
          + Novo Membro
        </button>
      </div>

      {/* Barra de Pesquisa */}
      <form onSubmit={handlePesquisar} className="flex gap-2">
        <input
          type="text"
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
          placeholder="Digite o nome do membro para pesquisar..."
          className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded-xl transition cursor-pointer"
        >
          Pesquisar
        </button>
      </form>

      {/* Listagem Simples (Nome, Endereço, Telefone, E-mail) */}
      {loading && <p className="text-slate-500 py-4">Buscando membros...</p>}
      {error && <p className="text-red-500 py-4">Erro: {error}</p>}

      {!loading && !error && membros.length === 0 && (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <p className="text-slate-500">Nenhum membro encontrado com esse critério.</p>
        </div>
      )}

      {!loading && !error && membros.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-slate-50 text-slate-700 text-xs uppercase font-bold">
                <th className="p-3">Nome</th>
                <th className="p-3">Endereço</th>
                <th className="p-3">Telefone</th>
                <th className="p-3">E-mail</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {membros.map((m) => {
                const enderecoResumido = [m.rua, m.numero, m.bairro, m.cidade]
                  .filter(Boolean)
                  .join(', ') || m.endereco || '-';

                return (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-semibold text-slate-800">{m.nome}</td>
                    <td className="p-3 text-slate-600 truncate max-w-xs">{enderecoResumido}</td>
                    <td className="p-3 text-slate-600">{m.celular_principal || '-'}</td>
                    <td className="p-3 text-slate-600">{m.email || '-'}</td>
                    <td className="p-3 text-right space-x-1 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleVerDetalhes(m)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition cursor-pointer"
                        title="Lista Completa / Detalhes"
                      >
                        Ver Completo
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditMemberModal(m)}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-lg transition cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(m.id, m.nome)}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition cursor-pointer"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE CADASTRO / EDIÇÃO COMPLETO */}
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
                className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
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

              </div>

              <div className="flex justify-end gap-3 pt-6 mt-6 border-t sticky bottom-0 bg-white z-10">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer"
                >
                  {editingMember ? 'Salvar alterações' : 'Cadastrar membro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE LISTA COMPLETA / DETALHES DO MEMBRO */}
      {showDetalhesModal && membroSelecionado && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 my-8 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="text-xl font-black text-blue-900">Ficha Completa do Membro</h3>
                <p className="text-xs text-slate-500">Visualização detalhada dos dados cadastrados.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDetalhesModal(false)}
                className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="block text-xs font-bold text-slate-400 uppercase">Nome Completo</span>
                <span className="font-semibold text-slate-800">{membroSelecionado.nome || '-'}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="block text-xs font-bold text-slate-400 uppercase">Tipo de Cadastro</span>
                <span className="font-semibold text-slate-800">{membroSelecionado.tipo_cadastro || '-'}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="block text-xs font-bold text-slate-400 uppercase">CPF</span>
                <span className="font-semibold text-slate-800">{membroSelecionado.cpf || '-'}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="block text-xs font-bold text-slate-400 uppercase">RG</span>
                <span className="font-semibold text-slate-800">{membroSelecionado.rg || '-'}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="block text-xs font-bold text-slate-400 uppercase">Data de Nascimento</span>
                <span className="font-semibold text-slate-800">{membroSelecionado.data_nascimento || '-'}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="block text-xs font-bold text-slate-400 uppercase">Estado Civil</span>
                <span className="font-semibold text-slate-800">{membroSelecionado.estado_civil || '-'}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="block text-xs font-bold text-slate-400 uppercase">Celular Principal</span>
                <span className="font-semibold text-slate-800">{membroSelecionado.celular_principal || '-'}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="block text-xs font-bold text-slate-400 uppercase">E-mail</span>
                <span className="font-semibold text-slate-800">{membroSelecionado.email || '-'}</span>
              </div>

              <div className="sm:col-span-2 bg-slate-50 p-3 rounded-xl">
                <span className="block text-xs font-bold text-slate-400 uppercase">Endereço Residencial</span>
                <span className="font-semibold text-slate-800">
                  {[membroSelecionado.rua, membroSelecionado.numero, membroSelecionado.bairro, membroSelecionado.cidade, membroSelecionado.estado].filter(Boolean).join(', ') || membroSelecionado.endereco || '-'}
                  {membroSelecionado.cep ? ` (CEP: ${membroSelecionado.cep})` : ''}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowDetalhesModal(false)}
                className="px-5 py-2.5 bg-blue-900 text-white font-bold text-sm rounded-xl shadow-md hover:bg-blue-800 transition cursor-pointer"
              >
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}