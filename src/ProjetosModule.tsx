// src/ProjetosModule.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

interface Membro {
  id: any;
  nome: string;
  celular_principal?: string;
}

interface Projeto {
  id: any;
  nome_projeto: string;
  descricao?: string;
  data_evento?: string;
  hora_evento?: string;
  local_evento?: string;
  valor_estimado: number;
  status?: string;
}

interface Inscricao {
  id: any;
  projeto_id: any;
  nome_participante: string;
  celular?: string;
  valor_participacao: number;
  status_pagamento: 'Pendente' | 'Pago';
}

interface Props {
  loggedUser: any;
}

export default function ProjetosModule({ loggedUser }: Props) {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [loading, setLoading] = useState(false);
  const [projetoSelecionado, setProjetoSelecionado] = useState<Projeto | null>(null);

  // Modais
  const [modalNovoProjeto, setModalNovoProjeto] = useState(false);
  const [modalInscricao, setModalInscricao] = useState(false);

  // Form Projeto (Criar / Editar)
  const [projetoEmEdicao, setProjetoEmEdicao] = useState<Projeto | null>(null);
  const [nomeProjeto, setNomeProjeto] = useState('');
  const [descricaoProjeto, setDescricaoProjeto] = useState('');
  const [dataEvento, setDataEvento] = useState('');
  const [horaEvento, setHoraEvento] = useState('19:30');
  const [localEvento, setLocalEvento] = useState('');
  const [valorEstimado, setValorEstimado] = useState<number | ''>('');

  // Form Inscrição (Criar / Editar)
  const [inscricaoEdicao, setInscricaoEdicao] = useState<Inscricao | null>(null);
  const [membroSelecionadoId, setMembroSelecionadoId] = useState('');
  const [nomeParticipante, setNomeParticipante] = useState('');
  const [celularParticipante, setCelularParticipante] = useState('');
  const [valorParticipacao, setValorParticipacao] = useState<number | ''>('');
  const [statusPagamento, setStatusPagamento] = useState<'Pendente' | 'Pago'>('Pendente');

  const codigoIgreja = loggedUser?.codigo_igreja || 'IGR-001';

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      // Carregar Membros
      const { data: dataMembros } = await supabase
        .from('members')
        .select('id, nome, celular_principal')
        .eq('codigo_igreja', codigoIgreja)
        .order('nome', { ascending: true });

      if (dataMembros) setMembros(dataMembros);

      // Carregar Projetos
      const { data: dataProjetos } = await supabase
        .from('projetos')
        .select('*')
        .eq('codigo_igreja', codigoIgreja)
        .order('id', { ascending: false });

      if (dataProjetos) {
        setProjetos(dataProjetos);
        if (dataProjetos.length > 0 && !projetoSelecionado) {
          setProjetoSelecionado(dataProjetos[0]);
        }
      }

      // Carregar Inscrições
      const { data: dataInsc } = await supabase
        .from('inscricoes_projetos')
        .select('*')
        .eq('codigo_igreja', codigoIgreja)
        .order('id', { ascending: false });

      if (dataInsc) setInscricoes(dataInsc);
    } catch (err: any) {
      console.error('Erro ao carregar dados do projeto:', err);
    } finally {
      setLoading(false);
    }
  }, [codigoIgreja, projetoSelecionado]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // 1. CRIAR OU EDITAR PROJETO + SINCRONIZAR AUTOMATICAMENTE COM A AGENDA
  const handleSalvarProjeto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeProjeto.trim()) return alert('Informe o nome do projeto.');

    try {
      const payloadProjeto = {
        codigo_igreja: codigoIgreja,
        nome_projeto: nomeProjeto.trim(),
        descricao: descricaoProjeto.trim(),
        data_evento: dataEvento || null,
        hora_evento: horaEvento || null,
        local_evento: localEvento.trim() || null,
        valor_estimado: Number(valorEstimado) || 0,
        status: 'Em Andamento',
      };

      let projId = projetoEmEdicao?.id;

      if (projetoEmEdicao) {
        const { error } = await supabase
          .from('projetos')
          .update(payloadProjeto)
          .eq('id', projetoEmEdicao.id);

        if (error) throw error;
      } else {
        const { data: novoProj, error } = await supabase
          .from('projetos')
          .insert([payloadProjeto])
          .select()
          .single();

        if (error) throw error;
        if (novoProj) {
          projId = novoProj.id;
          setProjetoSelecionado(novoProj);
        }
      }

      // SINCRONIZAÇÃO AUTOMÁTICA COM A TABELA DE AGENDA DO SISTEMA
      if (dataEvento) {
        const payloadAgenda = {
          codigo_igreja: codigoIgreja,
          titulo: `🚀 [PROJETO] ${nomeProjeto.trim()}`,
          data_evento: dataEvento,
          hora_evento: horaEvento || '19:30',
          local: localEvento.trim() || 'Templo Sede',
          descricao: `Projeto/Evento: ${descricaoProjeto.trim()} | Custo estimado: R$ ${Number(valorEstimado || 0).toFixed(2)}`,
          tipo: 'Projeto',
        };

        // Verifica se já existe um evento na agenda com este título/data ou insere um novo
        const { data: eventoExiste } = await supabase
          .from('agenda')
          .select('id')
          .eq('codigo_igreja', codigoIgreja)
          .eq('titulo', `🚀 [PROJETO] ${nomeProjeto.trim()}`)
          .maybeSingle();

        if (eventoExiste) {
          await supabase.from('agenda').update(payloadAgenda).eq('id', eventoExiste.id);
        } else {
          await supabase.from('agenda').insert([payloadAgenda]);
        }
      }

      alert('🚀 Projeto salvo e sincronizado com a Agenda!');
      setModalNovoProjeto(false);
      setProjetoEmEdicao(null);
      setNomeProjeto('');
      setDescricaoProjeto('');
      setDataEvento('');
      setHoraEvento('19:30');
      setLocalEvento('');
      setValorEstimado('');
      carregarDados();
    } catch (err: any) {
      alert('Erro ao salvar projeto: ' + err.message);
    }
  };

  const handleAbrirEdicaoProjeto = (p: Projeto) => {
    setProjetoEmEdicao(p);
    setNomeProjeto(p.nome_projeto);
    setDescricaoProjeto(p.descricao || '');
    setDataEvento(p.data_evento || '');
    setHoraEvento(p.hora_evento || '19:30');
    setLocalEvento(p.local_evento || '');
    setValorEstimado(p.valor_estimado || '');
    setModalNovoProjeto(true);
  };

  const handleExcluirProjeto = async (id: any, nome: string) => {
    if (!window.confirm(`Deseja excluir o projeto "${nome}" e todas as suas inscrições?`)) return;
    try {
      // Exclui projeto
      await supabase.from('projetos').delete().eq('id', id);

      // Remove item correspondente da agenda
      await supabase
        .from('agenda')
        .delete()
        .eq('codigo_igreja', codigoIgreja)
        .eq('titulo', `🚀 [PROJETO] ${nome}`);

      alert('Projeto e agendamento excluídos.');
      setProjetoSelecionado(null);
      carregarDados();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Preencher dados automaticamente ao selecionar membro cadastrado
  const handleSelecionarMembro = (membroId: string) => {
    setMembroSelecionadoId(membroId);
    const enc = membros.find((m) => String(m.id) === String(membroId));
    if (enc) {
      setNomeParticipante(enc.nome);
      setCelularParticipante(enc.celular_principal || '');
    }
  };

  // 2. SALVAR / EDITAR INSCRIÇÃO DE PARTICIPANTE
  const handleSalvarInscricao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projetoSelecionado) return alert('Selecione um projeto.');
    if (!nomeParticipante.trim()) return alert('Informe o nome do participante.');

    try {
      const payload = {
        codigo_igreja: codigoIgreja,
        projeto_id: projetoSelecionado.id,
        nome_participante: nomeParticipante.trim(),
        celular: celularParticipante.trim(),
        valor_participacao: Number(valorParticipacao) || 0,
        status_pagamento: statusPagamento,
      };

      if (inscricaoEdicao) {
        const { error } = await supabase
          .from('inscricoes_projetos')
          .update(payload)
          .eq('id', inscricaoEdicao.id);

        if (error) throw error;
        alert('Inscrição do participante atualizada!');
      } else {
        const { error } = await supabase.from('inscricoes_projetos').insert([payload]);
        if (error) throw error;
        alert('Participante inscrito com sucesso!');
      }

      setModalInscricao(false);
      setInscricaoEdicao(null);
      setMembroSelecionadoId('');
      setNomeParticipante('');
      setCelularParticipante('');
      setValorParticipacao('');
      setStatusPagamento('Pendente');
      carregarDados();
    } catch (err: any) {
      alert('Erro ao salvar inscrição: ' + err.message);
    }
  };

  const handleAbrirEdicaoInscricao = (item: Inscricao) => {
    setInscricaoEdicao(item);
    setMembroSelecionadoId('');
    setNomeParticipante(item.nome_participante);
    setCelularParticipante(item.celular || '');
    setValorParticipacao(item.valor_participacao);
    setStatusPagamento(item.status_pagamento);
    setModalInscricao(true);
  };

  const handleExcluirInscricao = async (id: any) => {
    if (!window.confirm('Excluir a inscrição deste participante?')) return;
    try {
      const { error } = await supabase.from('inscricoes_projetos').delete().eq('id', id);
      if (error) throw error;

      alert('Inscrição removida!');
      carregarDados();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Cálculos Financeiros (Confronto Arrecadação vs Custo do Projeto)
  const inscricoesDoProjeto = inscricoes.filter(
    (i) => String(i.projeto_id) === String(projetoSelecionado?.id)
  );

  const totalPago = inscricoesDoProjeto
    .filter((i) => i.status_pagamento === 'Pago')
    .reduce((acc, cur) => acc + (Number(cur.valor_participacao) || 0), 0);

  const totalPendente = inscricoesDoProjeto
    .filter((i) => i.status_pagamento === 'Pendente')
    .reduce((acc, cur) => acc + (Number(cur.valor_participacao) || 0), 0);

  const valorCustoProjeto = Number(projetoSelecionado?.valor_estimado) || 0;
  const saldoDiferenca = totalPago - valorCustoProjeto;
  const isSuperavit = saldoDiferenca >= 0;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-6xl mx-auto space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-3xl font-black text-blue-900 tracking-tight">🚀 Módulo de Projetos</h2>
          <p className="text-sm text-slate-600 mt-1">
            Projetos sincronizados com a Agenda, Inscrições e Balanço Financeiro
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setProjetoEmEdicao(null);
            setNomeProjeto('');
            setDescricaoProjeto('');
            setDataEvento('');
            setHoraEvento('19:30');
            setLocalEvento('');
            setValorEstimado('');
            setModalNovoProjeto(true);
          }}
          className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
        >
          ➕ Criar Novo Projeto
        </button>
      </div>

      {loading ? (
        <p className="text-center py-8 text-slate-500 text-xs">Carregando projetos...</p>
      ) : projetos.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed text-slate-500 text-xs">
          Nenhum projeto cadastrado. Clique no botão acima para registrar o primeiro!
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* SELETOR DE PROJETOS */}
          <div className="space-y-2 lg:col-span-1 border-r pr-0 lg:pr-4">
            <h3 className="font-black text-xs text-slate-400 uppercase tracking-wider mb-3">Selecione o Projeto</h3>
            {projetos.map((p) => {
              const isSelected = String(p.id) === String(projetoSelecionado?.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProjetoSelecionado(p)}
                  className={`w-full text-left p-3 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-blue-900 text-white border-blue-900 font-bold shadow'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 font-medium'
                  }`}
                >
                  <p className="text-sm truncate">{p.nome_projeto}</p>
                  <p className={`text-[10px] mt-1 ${isSelected ? 'text-blue-200' : 'text-slate-500'}`}>
                    Custo: R$ {Number(p.valor_estimado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </button>
              );
            })}
          </div>

          {/* ÁREA DETALHADA DO PROJETO SELECIONADO */}
          {projetoSelecionado && (
            <div className="lg:col-span-3 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-50 p-4 rounded-2xl border">
                <div>
                  <h3 className="text-xl font-black text-blue-900">{projetoSelecionado.nome_projeto}</h3>
                  {projetoSelecionado.data_evento && (
                    <p className="text-xs font-bold text-blue-800 mt-1">
                      📅 Data: {projetoSelecionado.data_evento.split('-').reverse().join('/')} às {projetoSelecionado.hora_evento || '19:30'}
                      {projetoSelecionado.local_evento && ` • 📍 ${projetoSelecionado.local_evento}`}
                    </p>
                  )}
                  {projetoSelecionado.descricao && (
                    <p className="text-xs text-slate-600 mt-0.5">{projetoSelecionado.descricao}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setInscricaoEdicao(null);
                      setMembroSelecionadoId('');
                      setNomeParticipante('');
                      setCelularParticipante('');
                      setValorParticipacao('');
                      setStatusPagamento('Pendente');
                      setModalInscricao(true);
                    }}
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                  >
                    👤 Adicionar Inscrição
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAbrirEdicaoProjeto(projetoSelecionado)}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    ✏️ Editar Projeto
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExcluirProjeto(projetoSelecionado.id, projetoSelecionado.nome_projeto)}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    🗑️ Excluir
                  </button>
                </div>
              </div>

              {/* CONFRONTO DE VALORES (BALANÇO DE SUPERÁVIT OU DÉFICIT) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="bg-slate-100 p-3.5 rounded-2xl border">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Valor do Projeto (Custo)</p>
                  <p className="text-lg font-black text-slate-800 mt-1">
                    R$ {valorCustoProjeto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200">
                  <p className="text-[10px] font-bold uppercase text-emerald-700">Arrecadado (Pago)</p>
                  <p className="text-lg font-black text-emerald-800 mt-1">
                    R$ {totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200">
                  <p className="text-[10px] font-bold uppercase text-amber-700">A Receber (Pendente)</p>
                  <p className="text-lg font-black text-amber-800 mt-1">
                    R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div
                  className={`p-3.5 rounded-2xl border ${
                    isSuperavit
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-rose-900 text-white border-rose-900'
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                    Balanço Final
                  </p>
                  <p className="text-lg font-black mt-1">
                    {isSuperavit ? '🟢 +' : '🔴 -'} R$ {Math.abs(saldoDiferenca).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[9px] mt-0.5 opacity-80">
                    {isSuperavit ? 'Superávit (Lucro)' : 'Prejuízo (Déficit)'}
                  </p>
                </div>
              </div>

              {/* LISTA DE INSCRITOS NO PROJETO */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                  Participantes Inscritos ({inscricoesDoProjeto.length})
                </h4>

                {inscricoesDoProjeto.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 border border-dashed rounded-2xl text-xs text-slate-500">
                    Nenhum participante inscrito ainda. Clique em "Adicionar Inscrição" para inscrever.
                  </div>
                ) : (
                  <div className="overflow-x-auto border rounded-2xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 uppercase font-bold border-b">
                          <th className="p-3">Participante</th>
                          <th className="p-3">Telefone</th>
                          <th className="p-3">Valor (R$)</th>
                          <th className="p-3">Status Pagamento</th>
                          <th className="p-3 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {inscricoesDoProjeto.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-800">{item.nome_participante}</td>
                            <td className="p-3 text-slate-600">{item.celular || '-'}</td>
                            <td className="p-3 font-bold text-slate-800">
                              R$ {Number(item.valor_participacao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${
                                  item.status_pagamento === 'Pago'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {item.status_pagamento}
                              </span>
                            </td>
                            <td className="p-3 text-right space-x-1 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleAbrirEdicaoInscricao(item)}
                                className="px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold rounded-lg cursor-pointer"
                              >
                                ✏️ Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleExcluirInscricao(item.id)}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg cursor-pointer"
                              >
                                🗑️ Excluir
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: CRIAR OU EDITAR PROJETO */}
      {modalNovoProjeto && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-blue-900">
                {projetoEmEdicao ? 'Editar Projeto' : 'Novo Projeto'}
              </h3>
              <button
                type="button"
                onClick={() => setModalNovoProjeto(false)}
                className="text-xs font-bold text-slate-500 hover:text-rose-600 cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleSalvarProjeto} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome do Projeto *</label>
                <input
                  type="text"
                  placeholder="Ex: Acampamento de Verão 2026"
                  value={nomeProjeto}
                  onChange={(e) => setNomeProjeto(e.target.value)}
                  className="w-full border rounded-xl p-2.5 font-bold text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data do Evento</label>
                  <input
                    type="date"
                    value={dataEvento}
                    onChange={(e) => setDataEvento(e.target.value)}
                    className="w-full border rounded-xl p-2.5 bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hora</label>
                  <input
                    type="time"
                    value={horaEvento}
                    onChange={(e) => setHoraEvento(e.target.value)}
                    className="w-full border rounded-xl p-2.5 bg-white font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Local do Evento</label>
                <input
                  type="text"
                  placeholder="Ex: Templo Sede, Sitio Recanto..."
                  value={localEvento}
                  onChange={(e) => setLocalEvento(e.target.value)}
                  className="w-full border rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Custo Estimado / Orçado (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={valorEstimado}
                  onChange={(e) => setValorEstimado(e.target.value ? Number(e.target.value) : '')}
                  className="w-full border rounded-xl p-2.5 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição / Observações</label>
                <textarea
                  placeholder="Detalhes adicionais..."
                  value={descricaoProjeto}
                  onChange={(e) => setDescricaoProjeto(e.target.value)}
                  className="w-full border rounded-xl p-2.5"
                  rows={2}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-900 text-white font-bold text-xs rounded-xl shadow cursor-pointer mt-2"
              >
                ⚡ {projetoEmEdicao ? 'Salvar Alterações' : 'Criar & Sincronizar com Agenda'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: INSCRIÇÃO DE PARTICIPANTE */}
      {modalInscricao && projetoSelecionado && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-lg font-black text-blue-900">
                  {inscricaoEdicao ? 'Editar Inscrição' : 'Adicionar Inscrição'}
                </h3>
                <p className="text-xs text-slate-500">Projeto: {projetoSelecionado.nome_projeto}</p>
              </div>
              <button
                type="button"
                onClick={() => setModalInscricao(false)}
                className="text-xs font-bold text-slate-500 hover:text-rose-600 cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleSalvarInscricao} className="space-y-3 text-xs">
              {!inscricaoEdicao && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Selecionar Membro Cadastrado (Opcional)</label>
                  <select
                    value={membroSelecionadoId}
                    onChange={(e) => handleSelecionarMembro(e.target.value)}
                    className="w-full border rounded-xl p-2.5 bg-white font-medium"
                  >
                    <option value="">Selecione da lista ou digite abaixo...</option>
                    {membros.map((m) => (
                      <option key={m.id} value={m.id}>
                        👤 {m.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome do Participante *</label>
                <input
                  type="text"
                  placeholder="Nome do inscrito"
                  value={nomeParticipante}
                  onChange={(e) => setNomeParticipante(e.target.value)}
                  className="w-full border rounded-xl p-2.5 font-bold text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={celularParticipante}
                  onChange={(e) => setCelularParticipante(e.target.value)}
                  className="w-full border rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Valor da Participação (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={valorParticipacao}
                  onChange={(e) => setValorParticipacao(e.target.value ? Number(e.target.value) : '')}
                  className="w-full border rounded-xl p-2.5 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status do Pagamento</label>
                <select
                  value={statusPagamento}
                  onChange={(e) => setStatusPagamento(e.target.value as 'Pendente' | 'Pago')}
                  className="w-full border rounded-xl p-2.5 bg-white font-bold"
                >
                  <option value="Pendente">⏳ Pendente</option>
                  <option value="Pago">✅ Pago</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow cursor-pointer mt-2"
              >
                💾 {inscricaoEdicao ? 'Salvar Alterações' : 'Confirmar Inscrição'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}