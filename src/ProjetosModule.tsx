// src/ProjetosModule.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

interface Projeto {
  id?: string;
  codigo_igreja: string;
  nome_projeto: string;
  tipo_projeto: string;
  descricao?: string;
  responsavel?: string;
  responsavel_financeiro?: string;
  publico_alvo?: string;
  custo: number;
  data_inicio?: string;
  data_fim?: string;
  horario?: string;
  local?: string;
  exibir_na_agenda: boolean;
  status: string;
}

interface ProjetosModuleProps {
  loggedUser: any;
}

export default function ProjetosModule({ loggedUser }: ProjetosModuleProps) {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const codigoIgreja = loggedUser?.codigo_igreja || loggedUser?.igrejas?.codigo_igreja || 'IGR-001';

  // Form State
  const [nomeProjeto, setNomeProjeto] = useState('');
  const [tipoProjeto, setTipoProjeto] = useState('Social');
  const [descricao, setDescricao] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [responsavelFinanceiro, setResponsavelFinanceiro] = useState('');
  const [publicoAlvo, setPublicoAlvo] = useState('');
  const [custo, setCusto] = useState<number | string>(0);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [horario, setHorario] = useState('19:00');
  const [local, setLocal] = useState('');
  const [exibirNaAgenda, setExibirNaAgenda] = useState(true);
  const [status, setStatus] = useState('Planejamento');

  const fetchProjetos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projetos_igreja')
        .select('*')
        .eq('codigo_igreja', codigoIgreja)
        .order('criado_em', { ascending: false });

      if (error) throw error;
      setProjetos(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar projetos:', err);
      alert('Erro ao carregar lista de projetos.');
    } finally {
      setLoading(false);
    }
  }, [codigoIgreja]);

  useEffect(() => {
    fetchProjetos();
  }, [fetchProjetos]);

  const limparFormulario = () => {
    setEditingId(null);
    setNomeProjeto('');
    setTipoProjeto('Social');
    setDescricao('');
    setResponsavel('');
    setResponsavelFinanceiro('');
    setPublicoAlvo('');
    setCusto(0);
    setDataInicio('');
    setDataFim('');
    setHorario('19:00');
    setLocal('');
    setExibirNaAgenda(true);
    setStatus('Planejamento');
  };

  const abrirModalNovo = () => {
    limparFormulario();
    setModalOpen(true);
  };

  const abrirModalEditar = (proj: Projeto) => {
    setEditingId(proj.id || null);
    setNomeProjeto(proj.nome_projeto);
    setTipoProjeto(proj.tipo_projeto || 'Social');
    setDescricao(proj.descricao || '');
    setResponsavel(proj.responsavel || '');
    setResponsavelFinanceiro(proj.responsavel_financeiro || '');
    setPublicoAlvo(proj.publico_alvo || '');
    setCusto(proj.custo || 0);
    setDataInicio(proj.data_inicio || '');
    setDataFim(proj.data_fim || '');
    setHorario(proj.horario || '19:00');
    setLocal(proj.local || '');
    setExibirNaAgenda(proj.exibir_na_agenda ?? true);
    setStatus(proj.status || 'Planejamento');
    setModalOpen(true);
  };

  // Sincronização direta com a tabela agenda
  const sincronizarComAgenda = async (
    tituloProjeto: string,
    dataEvt: string,
    horaEvt: string,
    localEvt: string,
    descEvt: string
  ) => {
    try {
      // Verifica se já existe um evento vinculado a esse projeto
      const tituloAgenda = `[PROJETO] ${tituloProjeto}`;
      const { data: eventoExistente } = await supabase
        .from('agenda')
        .select('id')
        .eq('codigo_igreja', codigoIgreja)
        .eq('titulo', tituloAgenda)
        .maybeSingle();

      const dadosAgenda = {
        codigo_igreja: codigoIgreja,
        titulo: tituloAgenda,
        data_evento: dataEvt,
        horario: horaEvt,
        local: localEvt || 'Sede da Igreja',
        descricao: descEvt || 'Evento referente a projeto da igreja.',
        tipo: 'Projeto'
      };

      if (eventoExistente) {
        await supabase.from('agenda').update(dadosAgenda).eq('id', eventoExistente.id);
      } else {
        await supabase.from('agenda').insert([dadosAgenda]);
      }
    } catch (err) {
      console.error('Erro ao sincronizar com agenda:', err);
    }
  };

  const removerDaAgenda = async (tituloProjeto: string) => {
    try {
      const tituloAgenda = `[PROJETO] ${tituloProjeto}`;
      await supabase
        .from('agenda')
        .delete()
        .eq('codigo_igreja', codigoIgreja)
        .eq('titulo', tituloAgenda);
    } catch (err) {
      console.error('Erro ao remover da agenda:', err);
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeProjeto.trim()) {
      alert('Informe o nome do projeto.');
      return;
    }

    setLoading(true);

    const dadosProjeto: Projeto = {
      codigo_igreja: codigoIgreja,
      nome_projeto: nomeProjeto.trim(),
      tipo_projeto: tipoProjeto,
      descricao: descricao.trim(),
      responsavel: responsavel.trim(),
      responsavel_financeiro: responsavelFinanceiro.trim(),
      publico_alvo: publicoAlvo.trim(),
      custo: Number(custo) || 0,
      data_inicio: dataInicio || undefined,
      data_fim: dataFim || undefined,
      horario: horario || '19:00',
      local: local.trim(),
      exibir_na_agenda: exibirNaAgenda,
      status: status,
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from('projetos_igreja')
          .update(dadosProjeto)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('projetos_igreja')
          .insert([dadosProjeto]);

        if (error) throw error;
      }

      // Sincronização condicional com a Agenda
      if (exibirNaAgenda && dataInicio && status !== 'Cancelado') {
        await sincronizarComAgenda(nomeProjeto, dataInicio, horario, local, descricao);
      } else {
        await removerDaAgenda(nomeProjeto);
      }

      setModalOpen(false);
      limparFormulario();
      fetchProjetos();
      alert('Projeto salvo com sucesso!');
    } catch (err: any) {
      console.error('Erro ao salvar projeto:', err);
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = async (proj: Projeto) => {
    if (!window.confirm(`Tem certeza que deseja excluir o projeto "${proj.nome_projeto}"?`)) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('projetos_igreja')
        .delete()
        .eq('id', proj.id);

      if (error) throw error;

      // Remove da agenda se existir
      await removerDaAgenda(proj.nome_projeto);

      fetchProjetos();
      alert('Projeto excluído com sucesso!');
    } catch (err: any) {
      console.error('Erro ao excluir projeto:', err);
      alert('Erro ao excluir: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'Em Andamento':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Concluído':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Cancelado':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 w-full max-w-6xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-blue-900 tracking-tight">
            Gestão de Projetos
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Planejamento, custos e ações sincronizadas com a agenda da igreja ({codigoIgreja})
          </p>
        </div>

        <button
          type="button"
          onClick={abrirModalNovo}
          className="px-4 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-2"
        >
          ➕ Novo Projeto
        </button>
      </div>

      {loading && <p className="text-center py-6 text-slate-500">Carregando projetos...</p>}

      {/* Lista de Projetos */}
      {!loading && (
        <>
          {projetos.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <p className="text-slate-500 text-sm">Nenhum projeto cadastrado no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projetos.map((proj) => (
                <div key={proj.id} className="border rounded-2xl p-5 bg-slate-50/50 hover:bg-white hover:shadow-md transition space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                        {proj.tipo_projeto}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(proj.status)}`}>
                        {proj.status}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-blue-900 leading-snug">{proj.nome_projeto}</h3>
                    {proj.descricao && <p className="text-xs text-slate-600 line-clamp-2">{proj.descricao}</p>}

                    <div className="text-xs space-y-1 text-slate-700 pt-2 border-t">
                      <p>👤 <strong>Líder:</strong> {proj.responsavel || 'Não informado'}</p>
                      <p>💰 <strong>Custo:</strong> R$ {Number(proj.custo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      {proj.data_inicio && (
                        <p>📅 <strong>Início:</strong> {new Date(proj.data_inicio).toLocaleDateString('pt-BR')} {proj.horario && `às ${proj.horario}`}</p>
                      )}
                      {proj.exibir_na_agenda && proj.data_inicio && (
                        <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                          ✓ Sincronizado com a Agenda
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => abrirModalEditar(proj)}
                      className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExcluir(proj)}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition cursor-pointer border border-rose-200"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal de Formulário */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 my-8">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-xl font-black text-blue-900">
                {editingId ? 'Editar Projeto' : 'Novo Projeto'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleSalvar} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome do Projeto *</label>
                  <input
                    type="text"
                    value={nomeProjeto}
                    onChange={(e) => setNomeProjeto(e.target.value)}
                    placeholder="Ex: Reforma do Templo Principal"
                    required
                    className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Projeto</label>
                  <select
                    value={tipoProjeto}
                    onChange={(e) => setTipoProjeto(e.target.value)}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Social">Social / Ação Comunitária</option>
                    <option value="Reforma">Reforma / Construção</option>
                    <option value="Evangelismo">Evangelismo / Missões</option>
                    <option value="Evento">Evento Especial</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                  >
                    <option value="Planejamento">Planejamento</option>
                    <option value="Em Andamento">Em Andamento</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Líder Responsável</label>
                  <input
                    type="text"
                    value={responsavel}
                    onChange={(e) => setResponsavel(e.target.value)}
                    placeholder="Nome do responsável"
                    className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Responsável Financeiro</label>
                  <input
                    type="text"
                    value={responsavelFinanceiro}
                    onChange={(e) => setResponsavelFinanceiro(e.target.value)}
                    placeholder="Nome do resp. financeiro"
                    className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Público-Alvo</label>
                  <input
                    type="text"
                    value={publicoAlvo}
                    onChange={(e) => setPublicoAlvo(e.target.value)}
                    placeholder="Ex: Jovens, Famílias, Bairro"
                    className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Custo Estimado (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={custo}
                    onChange={(e) => setCusto(e.target.value)}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Data de Início</label>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Data de Término</label>
                  <input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Horário</label>
                  <input
                    type="time"
                    value={horario}
                    onChange={(e) => setHorario(e.target.value)}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Local</label>
                  <input
                    type="text"
                    value={local}
                    onChange={(e) => setLocal(e.target.value)}
                    placeholder="Ex: Templo Principal / Praça"
                    className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Descrição / Objetivos</label>
                  <textarea
                    rows={3}
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Detalhes e objetivos do projeto..."
                    className="w-full border rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="sm:col-span-2 bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="chkAgenda"
                    checked={exibirNaAgenda}
                    onChange={(e) => setExibirNaAgenda(e.target.checked)}
                    className="w-5 h-5 text-blue-900 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="chkAgenda" className="text-xs font-bold text-blue-900 cursor-pointer">
                    Exibir automaticamente o lançamento deste projeto na Agenda do Sistema
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition shadow cursor-pointer"
                >
                  {loading ? 'Salvando...' : 'Salvar Projeto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}