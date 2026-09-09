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
  data_batismo: string;
  conjuge: string;
  filhos: string | string[];
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

interface Ministerio {
  id: string;
  nome_ministerio?: string;
  nome?: string;
  descricao?: string;
}

interface TransacaoFinanceira {
  id: string;
  descricao: string;
  valor: number;
  tipo: 'receita' | 'despesa';
  data_lancamento: string;
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
  data_batismo: '',
  conjuge: '',
  filhos: [''] as string[],
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
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [editingMember, setEditingMember] = useState<Membro | null>(null);
  const [membroSelecionado, setMembroSelecionado] = useState<Membro | null>(null);
  const [membroParaExcluir, setMembroParaExcluir] = useState<{ id: string; nome: string } | null>(null);
  
  const [senhaExclusao, setSenhaExclusao] = useState('');
  const [formMembro, setFormMembro] = useState(formInicial);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  // Estados para o Extrato Financeiro do Membro
  const [extratoMembro, setExtratoMembro] = useState<TransacaoFinanceira[]>([]);
  const [loadingExtrato, setLoadingExtrato] = useState(false);

  const codigoIgreja =
    loggedUser?.codigo_igreja ||
    loggedUser?.igrejas?.codigo_igreja;

  // Buscar Membros e Ministérios
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
        .eq('codigo_igreja', codigoIgreja)
        .neq('tipo_cadastro', 'Visitante');

      if (termoBusca.trim() !== '') {
        query = query.ilike('nome', `%${termoBusca.trim()}%`);
      } else {
        query = query.limit(35);
      }

      const { data, error: erroConsulta } = await query;
      if (erroConsulta) throw erroConsulta;
      setMembros(data || []);

      const resMin = await supabase
        .from('ministerios')
        .select('*')
        .eq('codigo_igreja', codigoIgreja);

      if (!resMin.error) {
        setMinisterios(resMin.data || []);
      }
    } catch (erro: any) {
      console.error('Erro ao buscar dados:', erro);
      setMembros([]);
      setError(erro?.message || 'Erro ao buscar dados.');
    } finally {
      setLoading(false);
    }
  }, [codigoIgreja, termoBusca]);

  useEffect(() => {
    if (!loggedUser || !codigoIgreja) return;
    handlePesquisar();
  }, [loggedUser, codigoIgreja, handlePesquisar]);

  // Carregar Extrato Financeiro do Membro selecionado (ÚNICO E LIMPO)
  useEffect(() => {
    const carregarExtratoFinanceiro = async () => {
      if (!membroSelecionado?.id) return;
      setLoadingExtrato(true);
      try {
        const { data, error } = await supabase
          .from('lancamentos_financeiros')
          .select('*')
          .eq('membro_id', membroSelecionado.id)
          .order('data_lancamento', { ascending: false });

        if (!error && data) {
          setExtratoMembro(data);
        } else {
          setExtratoMembro([]);
        }
      } catch (err) {
        console.error('Erro ao carregar extrato financeiro:', err);
        setExtratoMembro([]);
      } finally {
        setLoadingExtrato(false);
      }
    };

    if (showDetalhesModal && membroSelecionado) {
      carregarExtratoFinanceiro();
    }
  }, [showDetalhesModal, membroSelecionado]);

  const handleOpenNewMemberModal = () => {
    setEditingMember(null);
    setFormMembro(formInicial);
    setShowMemberModal(true);
  };

  const handleOpenEditMemberModal = (membro: Membro) => {
    setEditingMember(membro);
    
    let filhosFormatados = [''];
    try {
      if (typeof membro.filhos === 'string' && membro.filhos.trim() !== '') {
        const parsed = JSON.parse(membro.filhos);
        if (Array.isArray(parsed) && parsed.length > 0) filhosFormatados = parsed;
      } else if (Array.isArray(membro.filhos) && membro.filhos.length > 0) {
        filhosFormatados = membro.filhos;
      }
    } catch (e) {
      filhosFormatados = [''];
    }

    setFormMembro({
      tipo_cadastro: membro.tipo_cadastro || 'Membro',
      nome: membro.nome || '',
      cpf: membro.cpf || '',
      rg: membro.rg || '',
      data_nascimento: membro.data_nascimento || '',
      data_batismo: membro.data_batismo || '',
      conjuge: membro.conjuge || '',
      filhos: filhosFormatados,
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

  const handleAddFilho = () => {
    setFormMembro((prev) => ({
      ...prev,
      filhos: [...prev.filhos, ''],
    }));
  };

  const handleFilhoChange = (index: number, valor: string) => {
    const novosFilhos = [...formMembro.filhos];
    novosFilhos[index] = valor;
    setFormMembro((prev) => ({ ...prev, filhos: novosFilhos }));
  };

  const handleRemoveFilho = (index: number) => {
    const novosFilhos = formMembro.filhos.filter((_, i) => i !== index);
    setFormMembro((prev) => ({
      ...prev,
      filhos: novosFilhos.length > 0 ? novosFilhos : [''],
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `membros/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('membros-fotos')
        .upload(filePath, file);

      if (uploadError) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormMembro((prev) => ({ ...prev, foto_url: reader.result as string }));
          setUploadingFoto(false);
        };
        reader.readAsDataURL(file);
        return;
      }

      const { data: publicURLData } = supabase.storage
        .from('membros-fotos')
        .getPublicUrl(filePath);

      setFormMembro((prev) => ({ ...prev, foto_url: publicURLData.publicUrl }));
    } catch (err) {
      console.error('Erro no upload:', err);
      alert('Erro ao carregar imagem.');
    } finally {
      setUploadingFoto(false);
    }
  };

  const handleCloseModal = () => {
    setShowMemberModal(false);
    setEditingMember(null);
    setFormMembro(formInicial);
  };

  const handleChange = (campo: string, valor: any) => {
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
      const filhosValidos = formMembro.filhos.filter((f) => f.trim() !== '');

      const payload = {
        ...formMembro,
        codigo_igreja: codigoIgreja,
        filhos: JSON.stringify(filhosValidos),
        data_nascimento: formMembro.data_nascimento?.trim() !== '' ? formMembro.data_nascimento : null,
        data_batismo: formMembro.data_batismo?.trim() !== '' ? formMembro.data_batismo : null,
        ministerio_id: formMembro.ministerio_id?.trim() !== '' ? formMembro.ministerio_id : null,
        conjuge: formMembro.conjuge?.trim() || null,
        cpf: formMembro.cpf?.trim() || null,
        rg: formMembro.rg?.trim() || null,
        email: formMembro.email?.trim() || null,
        celular_principal: formMembro.celular_principal?.trim() || null,
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

  const handleIniciarExclusao = (id: string, nome: string) => {
    setMembroParaExcluir({ id, nome });
    setSenhaExclusao('');
    setShowDeleteModal(true);
  };

  const confirmarExclusaoComSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!membroParaExcluir) return;

    try {
      const emailUsuario = loggedUser?.usuario || loggedUser?.email;
      
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: emailUsuario,
        password: senhaExclusao,
      });

      if (authError) {
        alert('Senha incorreta! A exclusão foi cancelada por segurança.');
        return;
      }

      const { error: deleteError } = await supabase
        .from('members')
        .delete()
        .eq('id', membroParaExcluir.id);

      if (deleteError) throw deleteError;

      alert('Membro excluído com sucesso!');
      setShowDeleteModal(false);
      setMembroParaExcluir(null);
      setSenhaExclusao('');
      handlePesquisar();
    } catch (err: any) {
      console.error('Erro ao excluir:', err);
      alert('Erro ao excluir membro: ' + (err.message || 'Erro desconhecido'));
    }
  };

  const getNomeMinisterio = (ministerioId?: string) => {
    if (!ministerioId) return '-';
    const m = ministerios.find((x) => String(x.id) === String(ministerioId));
    return m ? (m.nome_ministerio || m.nome || m.descricao || 'Ministério') : '-';
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
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-blue-900 tracking-tight">
            Consulta de Membros
          </h2>
          <p className="text-slate-600 mt-1">
            Pesquise por nome, gerencie familiares e acompanhe o extrato financeiro.
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
                <th className="p-3">Foto</th>
                <th className="p-3">Nome</th>
                <th className="p-3">Ministério</th>
                <th className="p-3">Telefone</th>
                <th className="p-3">E-mail</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {membros.map((m) => {
                return (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-500 text-xs">
                        {m.foto_url ? (
                          <img src={m.foto_url} alt={m.nome} className="w-full h-full object-cover" />
                        ) : (
                          m.nome?.charAt(0) || '?'
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{m.nome}</td>
                    <td className="p-3 font-medium text-blue-900 text-xs">{getNomeMinisterio(m.ministerio_id)}</td>
                    <td className="p-3 text-slate-600">{m.celular_principal || '-'}</td>
                    <td className="p-3 text-slate-600">{m.email || '-'}</td>
                    <td className="p-3 text-right space-x-1 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => { setMembroSelecionado(m); setShowDetalhesModal(true); }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition cursor-pointer"
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
                        onClick={() => handleIniciarExclusao(m.id, m.nome)}
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

      {/* MODAL DE CADASTRO / EDIÇÃO */}
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
              
              {/* Seção de Foto */}
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border">
                <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-slate-400 font-bold">
                  {formMembro.foto_url ? (
                    <img src={formMembro.foto_url} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    'Foto'
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Carregar ou Tirar Foto</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-900 file:text-white hover:file:bg-blue-800 cursor-pointer"
                  />
                  {uploadingFoto && <p className="text-xs text-blue-600 mt-1">Carregando imagem...</p>}
                </div>
              </div>

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

                {/* MINISTÉRIO */}
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">🏛️ Ministério</label>
                  <select
                    value={formMembro.ministerio_id}
                    onChange={(e) => handleChange('ministerio_id', e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-blue-900"
                  >
                    <option value="">Selecione o ministério (opcional)...</option>
                    {ministerios.map((min) => (
                      <option key={min.id} value={min.id}>
                        {min.nome_ministerio || min.nome || min.descricao || 'Ministério'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* DATAS & FAMÍLIA */}
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
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Data do Batismo</label>
                  <input
                    type="date"
                    value={formMembro.data_batismo}
                    onChange={(e) => handleChange('data_batismo', e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome do Cônjuge</label>
                  <input
                    type="text"
                    value={formMembro.conjuge}
                    onChange={(e) => handleChange('conjuge', e.target.value)}
                    placeholder="Esposo(a)"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* ROL DINÂMICO DE FILHOS */}
                <div className="sm:col-span-3 bg-slate-50 p-4 rounded-2xl border space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-slate-700 uppercase">Filhos (+1)</label>
                    <button
                      type="button"
                      onClick={handleAddFilho}
                      className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg transition cursor-pointer"
                    >
                      + Adicionar Filho
                    </button>
                  </div>

                  <div className="space-y-2">
                    {formMembro.filhos.map((filho, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={filho}
                          onChange={(e) => handleFilhoChange(index, e.target.value)}
                          placeholder={`Nome do ${index + 1}º filho(a)`}
                          className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none bg-white font-medium"
                        />
                        {formMembro.filhos.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFilho(index)}
                            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition cursor-pointer"
                            title="Remover filho"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
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

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO POR SENHA */}
      {showDeleteModal && membroParaExcluir && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-4">
            <h3 className="text-xl font-black text-rose-700">Confirmar Exclusão</h3>
            <p className="text-sm text-slate-600">
              Você está prestes a excluir o membro <strong className="text-slate-800">{membroParaExcluir.nome}</strong>. Por segurança, digite sua senha de acesso para continuar:
            </p>

            <form onSubmit={confirmarExclusaoComSenha} className="space-y-4">
              <input
                type="password"
                value={senhaExclusao}
                onChange={(e) => setSenhaExclusao(e.target.value)}
                placeholder="Digite sua senha atual"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-500"
                required
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowDeleteModal(false); setMembroParaExcluir(null); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE DETALHES + EXTRATO FINANCEIRO DO MEMBRO */}
      {showDetalhesModal && membroSelecionado && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl p-8 my-8 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-600">
                  {membroSelecionado.foto_url ? (
                    <img src={membroSelecionado.foto_url} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    membroSelecionado.nome?.charAt(0)
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-black text-blue-900">Ficha do Membro & Extrato</h3>
                  <p className="text-xs text-slate-500">{membroSelecionado.nome}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDetalhesModal(false)}
                className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            {/* DADOS CADASTRAIS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-50 p-3 rounded-xl"><span className="block text-xs font-bold text-slate-400 uppercase">Tipo</span>{membroSelecionado.tipo_cadastro}</div>
              <div className="bg-slate-50 p-3 rounded-xl"><span className="block text-xs font-bold text-slate-400 uppercase">Ministério</span>{getNomeMinisterio(membroSelecionado.ministerio_id)}</div>
              <div className="bg-slate-50 p-3 rounded-xl"><span className="block text-xs font-bold text-slate-400 uppercase">Nascimento</span>{membroSelecionado.data_nascimento || '-'}</div>
              <div className="bg-slate-50 p-3 rounded-xl"><span className="block text-xs font-bold text-slate-400 uppercase">Batismo</span>{membroSelecionado.data_batismo || '-'}</div>
              <div className="bg-slate-50 p-3 rounded-xl"><span className="block text-xs font-bold text-slate-400 uppercase">Cônjuge</span>{membroSelecionado.conjuge || '-'}</div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="block text-xs font-bold text-slate-400 uppercase">Filhos</span>
                {(() => {
                  try {
                    const fList = typeof membroSelecionado.filhos === 'string' ? JSON.parse(membroSelecionado.filhos) : membroSelecionado.filhos;
                    return Array.isArray(fList) && fList.length > 0 ? fList.join(', ') : '-';
                  } catch (e) {
                    return '-';
                  }
                })()}
              </div>
              <div className="bg-slate-50 p-3 rounded-xl"><span className="block text-xs font-bold text-slate-400 uppercase">Celular</span>{membroSelecionado.celular_principal || '-'}</div>
              <div className="bg-slate-50 p-3 rounded-xl"><span className="block text-xs font-bold text-slate-400 uppercase">E-mail</span>{membroSelecionado.email || '-'}</div>
              <div className="sm:col-span-2 bg-slate-50 p-3 rounded-xl"><span className="block text-xs font-bold text-slate-400 uppercase">Endereço</span>{[membroSelecionado.rua, membroSelecionado.numero, membroSelecionado.bairro, membroSelecionado.cidade, membroSelecionado.estado].filter(Boolean).join(', ') || '-'}</div>
            </div>

            {/* EXTRATO FINANCEIRO DO MEMBRO */}
            <div className="border-t pt-4 space-y-3">
              <h4 className="font-black text-blue-900 text-sm">💰 Extrato de Caixa do Membro (Dízimos, Ofertas e Lançamentos)</h4>
              
              {loadingExtrato ? (
                <p className="text-xs text-slate-400 py-2">Carregando extrato financeiro...</p>
              ) : extratoMembro.length === 0 ? (
                <div className="bg-slate-50 p-4 rounded-xl text-center text-slate-400 text-xs border border-dashed">
                  Nenhum registro financeiro vinculado a este membro.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-48 overflow-y-auto border rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 uppercase text-slate-600 sticky top-0">
                      <tr>
                        <th className="p-2.5">Data</th>
                        <th className="p-2.5">Descrição</th>
                        <th className="p-2.5">Tipo</th>
                        <th className="p-2.5 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {extratoMembro.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50">
                          <td className="p-2.5 text-slate-600">{t.data_lancamento ? new Date(t.data_lancamento + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</td>
                          <td className="p-2.5 font-bold text-slate-800">{t.descricao}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${t.tipo === 'receita' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                              {t.tipo}
                            </span>
                          </td>
                          <td className={`p-2.5 text-right font-black ${t.tipo === 'receita' ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {t.tipo === 'receita' ? '+ ' : '- '}
                            R$ {Number(t.valor || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}