// src/ProjetosModule.tsx

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from './supabase';

interface Membro {
  id: any;
  nome: string;
  celular_principal?: string;
  email?: string;
}

interface Projeto {
  id: any;
  codigo_igreja: string;
  nome_projeto: string;
  descricao?: string;
  data_evento?: string;
  hora_evento?: string;
  local_evento?: string;
  valor_estimado: number;
  status?: string;
  created_at?: string;
}

interface Inscricao {
  id: any;
  codigo_igreja: string;
  projeto_id: any;
  membro_id?: any;
  nome_participante: string;
  celular?: string;
  email?: string;
  valor_participacao: number;
  status_pagamento: 'Pendente' | 'Pago' | 'Cancelado';
  forma_pagamento?: string;
  data_pagamento?: string;
  observacoes?: string;
  created_at?: string;
}

interface DespesaProjeto {
  id: any;
  codigo_igreja: string;
  projeto_id: any;
  descricao: string;
  categoria?: string;
  valor: number;
  data_despesa: string;
  created_at?: string;
}

interface Props {
  loggedUser: any;
}

export default function ProjetosModule({ loggedUser }: Props) {
  // Estados de Dados
  const [membros, setMembros] = useState<Membro[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [despesas, setDespesas] = useState<DespesaProjeto[]>([]);
  const [loading, setLoading] = useState(false);
  const [projetoSelecionado, setProjetoSelecionado] = useState<Projeto | null>(null);

  // Sub-abas do Projeto
  const [subAbaAtiva, setSubAbaAtiva] = useState<'visao_geral' | 'inscritos' | 'despesas'>('visao_geral');

  // Filtros
  const [buscaProjeto, setBuscaProjeto] = useState('');
  const [buscaInscrito, setBuscaInscrito] = useState('');
  const [filtroStatusPagamento, setFiltroStatusPagamento] = useState<'Todos' | 'Pago' | 'Pendente' | 'Cancelado'>('Todos');

  // Modais
  const [modalNovoProjeto, setModalNovoProjeto] = useState(false);
  const [projetoEmEdicao, setProjetoEmEdicao] = useState<Projeto | null>(null);
  
  const [modalInscricao, setModalInscricao] = useState(false);
  const [inscricaoEdicao, setInscricaoEdicao] = useState<Inscricao | null>(null);

  const [modalDespesa, setModalDespesa] = useState(false);

  // Form Projeto
  const [nomeProjeto, setNomeProjeto] = useState('');
  const [descricaoProjeto, setDescricaoProjeto] = useState('');
  const [dataEvento, setDataEvento] = useState('');
  const [horaEvento, setHoraEvento] = useState('19:30');
  const [localEvento, setLocalEvento] = useState('');
  const [valorEstimado, setValorEstimado] = useState<number | ''>('');
  const [statusProjeto, setStatusProjeto] = useState('Em Andamento');

  // Form Inscrição
  const [membroSelecionadoId, setMembroSelecionadoId] = useState('');
  const [nomeParticipante, setNomeParticipante] = useState('');
  const [celularParticipante, setCelularParticipante] = useState('');
  const [emailParticipante, setEmailParticipante] = useState('');
  const [valorParticipacao, setValorParticipacao] = useState<number | ''>('');
  const [statusPagamento, setStatusPagamento] = useState<'Pendente' | 'Pago' | 'Cancelado'>('Pendente');
  const [formaPagamento, setFormaPagamento] = useState('Pix');
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split('T')[0]);
  const [obsInscricao, setObsInscricao] = useState('');

  // Form Despesa
  const [descricaoDespesa, setDescricaoDespesa] = useState('');
  const [categoriaDespesa, setCategoriaDespesa] = useState('Alimentação');
  const [valorDespesa, setValorDespesa] = useState<number | ''>('');
  const [dataDespesa, setDataDespesa] = useState(new Date().toISOString().split('T')[0]);

  const codigoIgreja = loggedUser?.codigo_igreja || 'IGR-001';

  // CARREGAR DADOS (SEM LOOP INFINITO & COM TRATAMENTO DE ERROS)
  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Membros
      const { data: dataMembros } = await supabase
        .from('members')
        .select('id, nome, celular_principal, email')
        .eq('codigo_igreja', codigoIgreja)
        .order('nome', { ascending: true });

      if (dataMembros) setMembros(dataMembros);

      // 2. Projetos
      const { data: dataProjetos } = await supabase
        .from('projetos')
        .select('*')
        .eq('codigo_igreja', codigoIgreja)
        .order('id', { ascending: false });

      if (dataProjetos) {
        setProjetos(dataProjetos);
        
        setProjetoSelecionado((prev) => {
          if (!prev && dataProjetos.length > 0) return dataProjetos[0];
          if (prev) {
            const atualizado = dataProjetos.find((p) => String(p.id) === String(prev.id));
            return atualizado || prev;
          }
          return null;
        });
      }

      // 3. Inscrições
      const { data: dataInsc } = await supabase
        .from('inscricoes_projetos')
        .select('*')
        .eq('codigo_igreja', codigoIgreja)
        .order('id', { ascending: false });

      if (dataInsc) setInscricoes(dataInsc);

      // 4. Despesas (Tratado caso a tabela não exista ainda)
      try {
        const { data: dataDesp } = await supabase
          .from('despesas_projetos')
          .select('*')
          .eq('codigo_igreja', codigoIgreja)
          .order('id', { ascending: false });

        if (dataDesp) setDespesas(dataDesp);
      } catch (errDesp) {
        console.warn('Tabela despesas_projetos ainda não configurada.');
      }

    } catch (err: any) {
      console.error('Erro ao carregar módulo de projetos:', err);
    } finally {
      setLoading(false);
    }
  }, [codigoIgreja]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // PROJETOS FILTRADOS
  const projetosFiltrados = useMemo(() => {
    return projetos.filter((p) =>
      p.nome_projeto.toLowerCase().includes(buscaProjeto.toLowerCase())
    );
  }, [projetos, buscaProjeto]);

  // PARTICIPANTES DO PROJETO ATUAL
  const inscricoesDoProjeto = useMemo(() => {
    if (!projetoSelecionado) return [];
    return inscricoes.filter((i) => String(i.projeto_id) === String(projetoSelecionado.id));
  }, [inscricoes, projetoSelecionado]);

  const inscricoesFiltradas = useMemo(() => {
    return inscricoesDoProjeto.filter((i) => {
      const matchBusca =
        (i.nome_participante || '').toLowerCase().includes(buscaInscrito.toLowerCase()) ||
        (i.celular || '').includes(buscaInscrito) ||
        (i.email || '').toLowerCase().includes(buscaInscrito.toLowerCase());
      const matchStatus =
        filtroStatusPagamento === 'Todos' || i.status_pagamento === filtroStatusPagamento;
      return matchBusca && matchStatus;
    });
  }, [inscricoesDoProjeto, buscaInscrito, filtroStatusPagamento]);

  // DESPESAS DO PROJETO SELECIONADO
  const despesasDoProjeto = useMemo(() => {
    if (!projetoSelecionado) return [];
    return despesas.filter((d) => String(d.projeto_id) === String(projetoSelecionado.id));
  }, [despesas, projetoSelecionado]);

  // CÁLCULOS FINANCIAL METRICS (CONFRONTO DE VALORES)
  const totalArrecadadoPago = useMemo(() => {
    return inscricoesDoProjeto
      .filter((i) => i.status_pagamento === 'Pago')
      .reduce((acc, cur) => acc + (Number(cur.valor_participacao) || 0), 0);
  }, [inscricoesDoProjeto]);

  const totalPendente = useMemo(() => {
    return inscricoesDoProjeto
      .filter((i) => i.status_pagamento === 'Pendente')
      .reduce((acc, cur) => acc + (Number(cur.valor_participacao) || 0), 0);
  }, [inscricoesDoProjeto]);

  const totalDespesasExecutadas = useMemo(() => {
    return despesasDoProjeto.reduce((acc, cur) => acc + (Number(cur.valor) || 0), 0);
  }, [despesasDoProjeto]);

  const valorCustoEstimado = Number(projetoSelecionado?.valor_estimado) || 0;
  
  // Confronto: Total Pago vs Custo Estimado
  const balancoComCustoEstimado = totalArrecadadoPago - valorCustoEstimado;
  
  // Confronto: Total Pago vs Despesas Lançadas
  const balancoComDespesasReais = totalArrecadadoPago - totalDespesasExecutadas;

  const isSuperavitEstimado = balancoComCustoEstimado >= 0;
  const isSuperavitReal = balancoComDespesasReais >= 0;

  // 1. SALVAR / EDITAR PROJETO + SINCRONIZAR AGENDA
  const handleAbrirCriarProjeto = () => {
    setProjetoEmEdicao(null);
    setNomeProjeto('');
    setDescricaoProjeto('');
    setDataEvento('');
    setHoraEvento('19:30');
    setLocalEvento('');
    setValorEstimado('');
    setStatusProjeto('Em Andamento');
    setModalNovoProjeto(true);
  };

  const handleAbrirEdicaoProjeto = (p: Projeto) => {
    setProjetoEmEdicao(p);
    setNomeProjeto(p.nome_projeto);
    setDescricaoProjeto(p.descricao || '');
    setDataEvento(p.data_evento || '');
    setHoraEvento(p.hora_evento || '19:30');
    setLocalEvento(p.local_evento || '');
    setValorEstimado(p.valor_estimado || '');
    setStatusProjeto(p.status || 'Em Andamento');
    setModalNovoProjeto(true);
  };

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
        status: statusProjeto,
      };

      let projSalvo: Projeto | null = null;

      if (projetoEmEdicao) {
        const { data, error } = await supabase
          .from('projetos')
          .update(payloadProjeto)
          .eq('id', projetoEmEdicao.id)
          .select()
          .single();

        if (error) throw error;
        projSalvo = data;
        alert('✅ Projeto atualizado com sucesso!');
      } else {
        const { data, error } = await supabase
          .from('projetos')
          .insert([payloadProjeto])
          .select()
          .single();

        if (error) throw error;
        projSalvo = data;
        alert('🚀 Projeto criado com sucesso!');
      }

      // SINCRONIZAÇÃO COM A AGENDA
      if (dataEvento) {
        const tituloAgenda = `🚀 [PROJETO] ${nomeProjeto.trim()}`;
        const payloadAgenda = {
          codigo_igreja: codigoIgreja,
          titulo: tituloAgenda,
          data_evento: dataEvento,
          hora_evento: horaEvento || '19:30',
          local: localEvento.trim() || 'Templo Sede',
          descricao: `Projeto: ${descricaoProjeto.trim()} | Custo orçado: R$ ${Number(valorEstimado || 0).toFixed(2)}`,
          tipo: 'Projeto',
        };

        const { data: eventoExiste } = await supabase
          .from('agenda')
          .select('id')
          .eq('codigo_igreja', codigoIgreja)
          .eq('titulo', tituloAgenda)
          .maybeSingle();

        if (eventoExiste) {
          await supabase.from('agenda').update(payloadAgenda).eq('id', eventoExiste.id);
        } else {
          await supabase.from('agenda').insert([payloadAgenda]);
        }
      }

      setModalNovoProjeto(false);
      if (projSalvo) setProjetoSelecionado(projSalvo);
      carregarDados();
    } catch (err: any) {
      alert('Erro ao salvar projeto: ' + err.message);
    }
  };

  const handleExcluirProjeto = async (id: any, nome: string) => {
    if (!window.confirm(`Deseja realmente excluir o projeto "${nome}"? Todas as inscrições serão removidas.`)) return;

    try {
      await supabase.from('projetos').delete().eq('id', id);
      await supabase.from('agenda').delete().eq('codigo_igreja', codigoIgreja).eq('titulo', `🚀 [PROJETO] ${nome}`);

      alert('Projeto excluído com sucesso.');
      setProjetoSelecionado(null);
      carregarDados();
    } catch (err: any) {
      alert('Erro ao excluir projeto: ' + err.message);
    }
  };

  // 2. GESTÃO DE INSCRIÇÕES DE PARTICIPANTES
  const handleAbrirNovaInscricao = () => {
    setInscricaoEdicao(null);
    setMembroSelecionadoId('');
    setNomeParticipante('');
    setCelularParticipante('');
    setEmailParticipante('');
    setValorParticipacao('');
    setStatusPagamento('Pendente');
    setFormaPagamento('Pix');
    setDataPagamento(new Date().toISOString().split('T')[0]);
    setObsInscricao('');
    setModalInscricao(true);
  };

  const handleAbrirEdicaoInscricao = (item: Inscricao) => {
    setInscricaoEdicao(item);
    setMembroSelecionadoId(item.membro_id ? String(item.membro_id) : '');
    setNomeParticipante(item.nome_participante);
    setCelularParticipante(item.celular || '');
    setEmailParticipante(item.email || '');
    setValorParticipacao(item.valor_participacao);
    setStatusPagamento(item.status_pagamento);
    setFormaPagamento(item.forma_pagamento || 'Pix');
    setDataPagamento(item.data_pagamento || new Date().toISOString().split('T')[0]);
    setObsInscricao(item.observacoes || '');
    setModalInscricao(true);
  };

  const handleSelecionarMembro = (membroId: string) => {
    setMembroSelecionadoId(membroId);
    const enc = membros.find((m) => String(m.id) === String(membroId));
    if (enc) {
      setNomeParticipante(enc.nome);
      setCelularParticipante(enc.celular_principal || '');
      setEmailParticipante(enc.email || '');
    }
  };

  const handleSalvarInscricao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projetoSelecionado) return alert('Selecione um projeto.');
    if (!nomeParticipante.trim()) return alert('Informe o nome do participante.');

    try {
      const payload = {
        codigo_igreja: codigoIgreja,
        projeto_id: projetoSelecionado.id,
        membro_id: membroSelecionadoId ? membroSelecionadoId : null,
        nome_participante: nomeParticipante.trim(),
        celular: celularParticipante.trim(),
        email: emailParticipante.trim(),
        valor_participacao: Number(valorParticipacao) || 0,
        status_pagamento: statusPagamento,
        forma_pagamento: statusPagamento === 'Pago' ? formaPagamento : null,
        data_pagamento: statusPagamento === 'Pago' ? dataPagamento : null,
        observacoes: obsInscricao.trim(),
      };

      if (inscricaoEdicao) {
        const { error } = await supabase
          .from('inscricoes_projetos')
          .update(payload)
          .eq('id', inscricaoEdicao.id);

        if (error) throw error;
        alert('Inscrição atualizada com sucesso!');
      } else {
        const { error } = await supabase.from('inscricoes_projetos').insert([payload]);
        if (error) throw error;
        alert('Participante inscrito com sucesso!');
      }

      setModalInscricao(false);
      carregarDados();
    } catch (err: any) {
      alert('Erro ao salvar inscrição: ' + err.message);
    }
  };

  const handleExcluirInscricao = async (id: any, nome: string) => {
    if (!window.confirm(`Deseja realmente remover a inscrição de "${nome}"?`)) return;
    try {
      const { error } = await supabase.from('inscricoes_projetos').delete().eq('id', id);
      if (error) throw error;

      alert('Inscrição removida!');
      carregarDados();
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  // 3. GESTÃO DE DESPESAS DO PROJETO
  const handleAbrirNovaDespesa = () => {
    setDescricaoDespesa('');
    setCategoriaDespesa('Alimentação');
    setValorDespesa('');
    setDataDespesa(new Date().toISOString().split('T')[0]);
    setModalDespesa(true);
  };

  const handleSalvarDespesa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projetoSelecionado) return alert('Selecione um projeto.');
    if (!descricaoDespesa.trim()) return alert('Informe a descrição da despesa.');

    try {
      const payload = {
        codigo_igreja: codigoIgreja,
        projeto_id: projetoSelecionado.id,
        descricao: descricaoDespesa.trim(),
        categoria: categoriaDespesa,
        valor: Number(valorDespesa) || 0,
        data_despesa: dataDespesa,
      };

      const { error } = await supabase.from('despesas_projetos').insert([payload]);
      if (error) throw error;

      alert('Despesa lançada com sucesso!');
      setModalDespesa(false);
      carregarDados();
    } catch (err: any) {
      alert('Erro ao lançar despesa: ' + err.message);
    }
  };

  const handleExcluirDespesa = async (id: any) => {
    if (!window.confirm('Deseja excluir esta despesa lançada?')) return;
    try {
      const { error } = await supabase.from('despesas_projetos').delete().eq('id', id);
      if (error) throw error;

      alert('Despesa excluída!');
      carregarDados();
    } catch (err: any) {
      alert('Erro ao excluir despesa: ' + err.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-6xl mx-auto space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-3xl font-black text-blue-900 tracking-tight">🚀 Módulo de Projetos & Eventos</h2>
          <p className="text-sm text-slate-600 mt-1">
            Gestão Financeira, Inscrições de Participantes e Balanço em Tempo Real
          </p>
        </div>

        <button
          type="button"
          onClick={handleAbrirCriarProjeto}
          className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition flex items-center gap-1"
        >
          ➕ Criar Novo Projeto
        </button>
      </div>

      {loading ? (
        <p className="text-center py-8 text-slate-500 text-xs">Carregando informações do módulo...</p>
      ) : projetos.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed text-slate-500 text-xs space-y-2">
          <p className="font-bold text-slate-700 text-sm">Nenhum projeto cadastrado na sua igreja.</p>
          <p>Clique no botão acima para criar o primeiro projeto e gerenciar as inscrições e o orçamento!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* BARRA LATERAL: SELETOR DE PROJETOS */}
          <div className="space-y-3 lg:col-span-1 border-r pr-0 lg:pr-4">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-xs text-slate-400 uppercase tracking-wider">Seus Projetos</h3>
              <span className="text-[10px] bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded-full">
                {projetos.length}
              </span>
            </div>

            <input
              type="text"
              placeholder="🔎 Buscar projeto..."
              value={buscaProjeto}
              onChange={(e) => setBuscaProjeto(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50"
            />

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {projetosFiltrados.map((p) => {
                const isSelected = String(p.id) === String(projetoSelecionado?.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProjetoSelecionado(p)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition cursor-pointer space-y-1 ${
                      isSelected
                        ? 'bg-blue-900 text-white border-blue-900 font-bold shadow-md'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 font-medium'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-sm truncate max-w-[130px]">{p.nome_projeto}</p>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          isSelected ? 'bg-blue-800 text-blue-100' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {p.status || 'Ativo'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] pt-1">
                      <span className={isSelected ? 'text-blue-200' : 'text-slate-500'}>
                        Custo: R$ {Number(p.valor_estimado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      {p.data_evento && (
                        <span className={isSelected ? 'text-blue-100 font-bold' : 'text-blue-900 font-bold'}>
                          📅 {p.data_evento.split('-').reverse().join('/')}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PAINEL DE DETALHES DO PROJETO SELECIONADO */}
          {projetoSelecionado && (
            <div className="lg:col-span-3 space-y-6">
              {/* CABEÇALHO DO PROJETO SELECIONADO */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-black text-blue-900">{projetoSelecionado.nome_projeto}</h3>
                      <span className="bg-blue-100 text-blue-900 font-bold text-xs px-2.5 py-0.5 rounded-lg border border-blue-200">
                        {projetoSelecionado.status || 'Em Andamento'}
                      </span>
                    </div>

                    {projetoSelecionado.data_evento && (
                      <p className="text-xs font-bold text-blue-800 mt-1">
                        📅 Data: {projetoSelecionado.data_evento.split('-').reverse().join('/')} às {projetoSelecionado.hora_evento || '19:30'}
                        {projetoSelecionado.local_evento && ` • 📍 Local: ${projetoSelecionado.local_evento}`}
                      </p>
                    )}

                    {projetoSelecionado.descricao && (
                      <p className="text-xs text-slate-600 mt-1">{projetoSelecionado.descricao}</p>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleAbrirNovaInscricao}
                      className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center gap-1"
                    >
                      👤 Adicionar Inscrito
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

                {/* SUB-ABAS NAVEGÁVEIS */}
                <div className="flex border-b border-slate-200 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSubAbaAtiva('visao_geral')}
                    className={`px-4 py-2 font-bold text-xs rounded-t-xl transition cursor-pointer border-b-2 ${
                      subAbaAtiva === 'visao_geral'
                        ? 'border-blue-900 text-blue-900 bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    📊 Visão Geral & Balanço
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubAbaAtiva('inscritos')}
                    className={`px-4 py-2 font-bold text-xs rounded-t-xl transition cursor-pointer border-b-2 ${
                      subAbaAtiva === 'inscritos'
                        ? 'border-blue-900 text-blue-900 bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    👥 Participantes Inscritos ({inscricoesDoProjeto.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubAbaAtiva('despesas')}
                    className={`px-4 py-2 font-bold text-xs rounded-t-xl transition cursor-pointer border-b-2 ${
                      subAbaAtiva === 'despesas'
                        ? 'border-blue-900 text-blue-900 bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    💸 Despesas Executadas ({despesasDoProjeto.length})
                  </button>
                </div>
              </div>

              {/* SUB-ABA 1: BALANÇO FINANCEIRO COMPLETO */}
              {subAbaAtiva === 'visao_geral' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200">
                      <p className="text-[10px] font-bold uppercase text-slate-500">Valor Orçado (Custo Estimado)</p>
                      <p className="text-xl font-black text-slate-800 mt-1">
                        R$ {valorCustoEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                      <p className="text-[10px] font-bold uppercase text-emerald-700">Total Arrecadado (Pagos)</p>
                      <p className="text-xl font-black text-emerald-800 mt-1">
                        R$ {totalArrecadadoPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-semibold mt-1">
                        {inscricoesDoProjeto.filter((i) => i.status_pagamento === 'Pago').length} quitado(s)
                      </p>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                      <p className="text-[10px] font-bold uppercase text-amber-700">Valores a Receber (Pendentes)</p>
                      <p className="text-xl font-black text-amber-800 mt-1">
                        R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-amber-600 font-semibold mt-1">
                        {inscricoesDoProjeto.filter((i) => i.status_pagamento === 'Pendente').length} aguardando
                      </p>
                    </div>

                    <div
                      className={`p-4 rounded-2xl border ${
                        isSuperavitEstimado
                          ? 'bg-blue-900 text-white border-blue-900'
                          : 'bg-rose-900 text-white border-rose-900'
                      }`}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                        Balanço (Arrecadado vs Custo)
                      </p>
                      <p className="text-xl font-black mt-1">
                        {isSuperavitEstimado ? '🟢 +' : '🔴 -'} R${' '}
                        {Math.abs(balancoComCustoEstimado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] mt-1 font-semibold opacity-90">
                        {isSuperavitEstimado ? 'Superávit (Lucro para o Projeto)' : 'Déficit (Prejuízo no Orçamento)'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 border p-5 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h4 className="font-bold text-xs text-blue-900 uppercase">
                        ⚖️ Balanço Real Executado (Arrecadação Pago vs Despesas Lançadas)
                      </h4>
                      <button
                        type="button"
                        onClick={handleAbrirNovaDespesa}
                        className="px-3 py-1 bg-blue-900 text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        ➕ Lançar Despesa Real
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-xl border">
                        <span className="text-slate-500 font-bold block">Entradas Confirmadas</span>
                        <span className="font-black text-emerald-700 text-base">
                          R$ {totalArrecadadoPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border">
                        <span className="text-slate-500 font-bold block">Despesas Executadas</span>
                        <span className="font-black text-rose-700 text-base">
                          R$ {totalDespesasExecutadas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className={`p-3 rounded-xl border ${isSuperavitReal ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-rose-50 text-rose-900 border-rose-200'}`}>
                        <span className="font-bold block">Saldo Final Real</span>
                        <span className="font-black text-base">
                          {isSuperavitReal ? '🟢 +' : '🔴 -'} R$ {Math.abs(balancoComDespesasReais).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-ABA 2: INSCRITOS / PARTICIPANTES */}
              {subAbaAtiva === 'inscritos' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                      Participantes Cadastrados ({inscricoesDoProjeto.length})
                    </h4>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <input
                        type="text"
                        placeholder="🔎 Buscar participante..."
                        value={buscaInscrito}
                        onChange={(e) => setBuscaInscrito(e.target.value)}
                        className="border rounded-xl px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-600 w-full sm:w-48"
                      />

                      <select
                        value={filtroStatusPagamento}
                        onChange={(e) => setFiltroStatusPagamento(e.target.value as any)}
                        className="border rounded-xl px-2.5 py-1.5 text-xs bg-white font-bold"
                      >
                        <option value="Todos">Todos os Status</option>
                        <option value="Pago">✅ Pago</option>
                        <option value="Pendente">⏳ Pendente</option>
                        <option value="Cancelado">❌ Cancelado</option>
                      </select>
                    </div>
                  </div>

                  {inscricoesFiltradas.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-dashed rounded-2xl text-xs text-slate-500">
                      Nenhum participante encontrado com os filtros selecionados.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border rounded-2xl shadow-sm">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 uppercase font-bold border-b">
                            <th className="p-3">Participante</th>
                            <th className="p-3">Contato</th>
                            <th className="p-3">Valor (R$)</th>
                            <th className="p-3">Status / Pagamento</th>
                            <th className="p-3">Observação</th>
                            <th className="p-3 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {inscricoesFiltradas.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50">
                              <td className="p-3 font-bold text-slate-800">{item.nome_participante}</td>
                              <td className="p-3 text-slate-600">
                                <div>📞 {item.celular || '-'}</div>
                                {item.email && <div className="text-[10px] text-slate-400">{item.email}</div>}
                              </td>
                              <td className="p-3 font-bold text-slate-800">
                                R$ {Number(item.valor_participacao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                    item.status_pagamento === 'Pago'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : item.status_pagamento === 'Pendente'
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                                  }`}
                                >
                                  {item.status_pagamento}
                                </span>
                                {item.status_pagamento === 'Pago' && item.forma_pagamento && (
                                  <span className="block text-[10px] text-slate-500 font-semibold mt-0.5">
                                    {item.forma_pagamento} {item.data_pagamento && `(${item.data_pagamento.split('-').reverse().join('/')})`}
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-slate-500 italic max-w-[150px] truncate">
                                {item.observacoes || '-'}
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
                                  onClick={() => handleExcluirInscricao(item.id, item.nome_participante)}
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
              )}

              {/* SUB-ABA 3: DESPESAS EXECUTADAS */}
              {subAbaAtiva === 'despesas' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                      Despesas do Projeto ({despesasDoProjeto.length})
                    </h4>

                    <button
                      type="button"
                      onClick={handleAbrirNovaDespesa}
                      className="px-3.5 py-1.5 bg-blue-900 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                    >
                      ➕ Lançar Nova Despesa
                    </button>
                  </div>

                  {despesasDoProjeto.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-dashed rounded-2xl text-xs text-slate-500">
                      Nenhuma despesa executada foi lançada neste projeto ainda.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border rounded-2xl shadow-sm">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 uppercase font-bold border-b">
                            <th className="p-3">Data</th>
                            <th className="p-3">Descrição da Despesa</th>
                            <th className="p-3">Categoria</th>
                            <th className="p-3">Valor (R$)</th>
                            <th className="p-3 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {despesasDoProjeto.map((d) => (
                            <tr key={d.id} className="hover:bg-slate-50">
                              <td className="p-3 font-bold text-slate-800 whitespace-nowrap">
                                📅 {d.data_despesa?.split('-').reverse().join('/')}
                              </td>
                              <td className="p-3 font-semibold text-slate-800">{d.descricao}</td>
                              <td className="p-3">
                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                                  {d.categoria || 'Geral'}
                                </span>
                              </td>
                              <td className="p-3 font-bold text-rose-700">
                                R$ {Number(d.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleExcluirDespesa(d.id)}
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
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: CRIAR / EDITAR PROJETO */}
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
                <label className="block font-bold text-slate-700 mb-1">Status do Projeto</label>
                <select
                  value={statusProjeto}
                  onChange={(e) => setStatusProjeto(e.target.value)}
                  className="w-full border rounded-xl p-2.5 bg-white font-bold"
                >
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Concluído">Concluído</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
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
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
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
                  <label className="block font-bold text-slate-700 mb-1">Membro Cadastrado (Opcional)</label>
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

              <div className="grid grid-cols-2 gap-2">
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
                  <label className="block font-bold text-slate-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={emailParticipante}
                    onChange={(e) => setEmailParticipante(e.target.value)}
                    className="w-full border rounded-xl p-2.5"
                  />
                </div>
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
                  onChange={(e) => setStatusPagamento(e.target.value as any)}
                  className="w-full border rounded-xl p-2.5 bg-white font-bold"
                >
                  <option value="Pendente">⏳ Pendente</option>
                  <option value="Pago">✅ Pago</option>
                  <option value="Cancelado">❌ Cancelado</option>
                </select>
              </div>

              {statusPagamento === 'Pago' && (
                <div className="grid grid-cols-2 gap-2 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  <div>
                    <label className="block font-bold text-emerald-900 mb-1">Forma de Pagamento</label>
                    <select
                      value={formaPagamento}
                      onChange={(e) => setFormaPagamento(e.target.value)}
                      className="w-full border rounded-xl p-2 bg-white font-bold"
                    >
                      <option value="Pix">Pix</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Cartão de Débito">Cartão de Débito</option>
                      <option value="Transferência">Transferência</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-emerald-900 mb-1">Data do Pagamento</label>
                    <input
                      type="date"
                      value={dataPagamento}
                      onChange={(e) => setDataPagamento(e.target.value)}
                      className="w-full border rounded-xl p-2 bg-white font-bold"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observações</label>
                <textarea
                  placeholder="Observações do inscrito..."
                  value={obsInscricao}
                  onChange={(e) => setObsInscricao(e.target.value)}
                  className="w-full border rounded-xl p-2.5"
                  rows={2}
                />
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

      {/* MODAL 3: LANÇAR DESPESA REAL */}
      {modalDespesa && projetoSelecionado && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-lg font-black text-blue-900">Lançar Despesa no Projeto</h3>
                <p className="text-xs text-slate-500">Projeto: {projetoSelecionado.nome_projeto}</p>
              </div>
              <button
                type="button"
                onClick={() => setModalDespesa(false)}
                className="text-xs font-bold text-slate-500 hover:text-rose-600 cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleSalvarDespesa} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição da Despesa *</label>
                <input
                  type="text"
                  placeholder="Ex: Compra de materiais, aluguel..."
                  value={descricaoDespesa}
                  onChange={(e) => setDescricaoDespesa(e.target.value)}
                  className="w-full border rounded-xl p-2.5 font-bold text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoria</label>
                  <select
                    value={categoriaDespesa}
                    onChange={(e) => setCategoriaDespesa(e.target.value)}
                    className="w-full border rounded-xl p-2.5 bg-white font-bold"
                  >
                    <option value="Alimentação">Alimentação</option>
                    <option value="Transporte">Transporte</option>
                    <option value="Locação de Espaço">Locação de Espaço</option>
                    <option value="Som e Iluminação">Som e Iluminação</option>
                    <option value="Material Grafico">Material Gráfico</option>
                    <option value="Decoração">Decoração</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={valorDespesa}
                    onChange={(e) => setValorDespesa(e.target.value ? Number(e.target.value) : '')}
                    className="w-full border rounded-xl p-2.5 font-bold text-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Data</label>
                <input
                  type="date"
                  value={dataDespesa}
                  onChange={(e) => setDataDespesa(e.target.value)}
                  className="w-full border rounded-xl p-2.5 bg-white font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow cursor-pointer mt-2"
              >
                💾 Lançar Despesa
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}