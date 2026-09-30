// src/FinanceiroModule.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { carregarPermissoesFinanceiro, FINANCEIRO_PADRAO, PermissoesFinanceiro } from './permissoesFinanceiro';

interface Lancamento {
  id: string;
  codigo_igreja: string;
  data_lancamento: string;
  tipo: 'receita' | 'despesa';
  descricao: string;
  valor: number;
  conta_corrente_id: string;
  id_conta_contabil: string;
  membro_id?: string;
  documento_url?: string;
  agradecimento_enviado?: boolean;
}

interface ContaContabil {
  id: string;
  codigo_conta: string;
  nome_conta: string;
  tipo_natureza: string;
  conta_pai?: string;
}

interface ContaFinanceiraAdm {
  id: string;
  codigo_conta: string;
  nome_conta: string;
  agencia?: string;
  numero_conta?: string;
}

interface Membro {
  id: string;
  nome: string;
  email?: string;
  celular_principal?: string;
}

interface Transferencia {
  id: string;
  codigo_igreja: string;
  data_transferencia: string;
  conta_origem_id: string;
  conta_destino_id: string;
  valor: number;
  descricao?: string;
  documento_url?: string;
}

// Uma linha do extrato: lançamento comum ou uma das duas pontas de uma transferência
interface Movimento {
  id: string;
  data: string;
  contaId: string;
  descricao: string;
  entrada: number;
  saida: number;
  transferencia: boolean;
}

interface FinanceiroModuleProps {
  loggedUser: any;
}

// Data de hoje no fuso do aparelho (toISOString usa o horário de Londres: depois das 21h no Brasil já dava o dia seguinte)
const hojeLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Primeiro e último dia de um mês, no formato AAAA-MM-DD
const inicioDoMes = (ano: number, mes: number) => {
  const d = new Date(ano, mes, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};
const fimDoMes = (ano: number, mes: number) => {
  const d = new Date(ano, mes + 1, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const dataBR = (iso?: string) => (iso ? iso.split('-').reverse().join('/') : '');
const moeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formLancamentoInicial = {
  data_lancamento: hojeLocal(),
  tipo: 'receita' as 'receita' | 'despesa',
  descricao: '',
  valor: '',
  conta_corrente_id: '',
  id_conta_contabil: '',
  membro_id: '',
  documento_url: '',
};

const formTransfInicial = () => ({
  data_transferencia: hojeLocal(),
  conta_origem_id: '',
  conta_destino_id: '',
  valor: '',
  descricao: '',
});

const formContaContabilInicial = {
  codigo_conta: '',
  nome_conta: '',
  conta_pai: '',
  tipo_natureza: 'Despesa',
};

const formContaAdmInicial = {
  codigo_conta: '',
  nome_conta: '',
  agencia: '',
  numero_conta: '',
};

export default function FinanceiroModule({ loggedUser }: FinanceiroModuleProps) {
  const [subAba, setSubAba] = useState<'lancamentos' | 'contas_adm' | 'plano_contas' | 'relatorios'>('lancamentos');
  const [tipoRelatorio, setTipoRelatorio] = useState<'conta_corrente' | 'diario' | 'balancete' | 'dre'>('conta_corrente');

  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [contasContabeis, setContasContabeis] = useState<ContaContabil[]>([]);
  const [contasAdmList, setContasAdmList] = useState<ContaFinanceiraAdm[]>([]);
  const [membrosList, setMembrosList] = useState<Membro[]>([]);
  const [transferencias, setTransferencias] = useState<Transferencia[]>([]);
  const [semTabelaTransf, setSemTabelaTransf] = useState(false);
  const [permFin, setPermFin] = useState<PermissoesFinanceiro>(FINANCEIRO_PADRAO);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modais Lançamentos
  const [showModalLancamento, setShowModalLancamento] = useState(false);
  const [editingLancamento, setEditingLancamento] = useState<Lancamento | null>(null);
  const [formLancamento, setFormLancamento] = useState(formLancamentoInicial);
  const [relacionadoMembro, setRelacionadoMembro] = useState(false);
  const [arquivoDocumento, setArquivoDocumento] = useState<File | null>(null);

  // Modal Transferência entre contas
  const [showModalTransf, setShowModalTransf] = useState(false);
  const [formTransf, setFormTransf] = useState(formTransfInicial);
  const [arquivoTransf, setArquivoTransf] = useState<File | null>(null);
  const [salvandoTransf, setSalvandoTransf] = useState(false);

  // Modais Plano de Contas
  const [showModalConta, setShowModalConta] = useState(false);
  const [editingConta, setEditingConta] = useState<ContaContabil | null>(null);
  const [formConta, setFormConta] = useState(formContaContabilInicial);

  // Modais Conta Adm
  const [showModalAdm, setShowModalAdm] = useState(false);
  const [editingAdm, setEditingAdm] = useState<ContaFinanceiraAdm | null>(null);
  const [formAdm, setFormAdm] = useState(formContaAdmInicial);

  // Exclusão / Senha
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemParaExcluir, setItemParaExcluir] = useState<{ id: string; tipo: 'lancamento' | 'conta_contabil' | 'conta_adm' | 'transferencia'; nome: string } | null>(null);
  const [senhaExclusao, setSenhaExclusao] = useState('');

  // Modal Impressão de Comprovante / Recibo
  const [showModalRecibo, setShowModalRecibo] = useState(false);
  const [lancamentoParaRecibo, setLancamentoParaRecibo] = useState<Lancamento | null>(null);

  // Filtros dos relatórios (padrão: mês atual, todas as contas)
  const [dataInicio, setDataInicio] = useState(() => inicioDoMes(new Date().getFullYear(), new Date().getMonth()));
  const [dataFim, setDataFim] = useState(() => fimDoMes(new Date().getFullYear(), new Date().getMonth()));
  const [contaExtrato, setContaExtrato] = useState(''); // '' = todas as contas

  const codigoIgreja = loggedUser?.codigo_igreja || loggedUser?.igrejas?.codigo_igreja || 'IGR-001';

  // Só o administrador edita ou exclui lançamentos e cadastra/edita contas
  const isAdmin = loggedUser?.perfil === 'admin' || loggedUser?.perfil === 'administrador';
  const exigirAdmin = () => {
    if (isAdmin) return true;
    alert('🔒 Apenas o administrador pode fazer esta alteração.');
    return false;
  };
  const emailUsuarioLogado = loggedUser?.usuario || loggedUser?.email || 'admin@sistema.com';

  // Sub-permissões do Financeiro (administrador pode tudo)
  useEffect(() => {
    if (!loggedUser) return;
    let ativo = true;
    carregarPermissoesFinanceiro(loggedUser.id, isAdmin)
      .then((p) => ativo && setPermFin(p))
      .catch(() => ativo && setPermFin(FINANCEIRO_PADRAO));
    return () => {
      ativo = false;
    };
  }, [loggedUser, isAdmin]);
  const podeTransferir = isAdmin || permFin.fin_transferir;
  const verTransferencias = podeTransferir || permFin.fin_ver;

  const registrarLog = async (acao: string, detalhes: string) => {
    try {
      await supabase.from('logs_sistema').insert([
        {
          codigo_igreja: codigoIgreja,
          usuario_email: emailUsuarioLogado,
          acao,
          detalhes,
        },
      ]);
    } catch (err) {
      console.error('Erro ao registrar log:', err);
    }
  };

  const fetchDados = useCallback(async () => {
    if (!codigoIgreja) return;
    setLoading(true);
    setError(null);

    try {
      const resLanc = await supabase
        .from('lancamentos_financeiros')
        .select('*')
        .eq('codigo_igreja', codigoIgreja)
        .order('data_lancamento', { ascending: true });

      if (!resLanc.error) setLancamentos(resLanc.data || []);

      const resPlano = await supabase
        .from('plano_contas_contabil')
        .select('*')
        .eq('codigo_igreja', codigoIgreja)
        .order('codigo_conta', { ascending: true });

      if (!resPlano.error) setContasContabeis(resPlano.data || []);

      const resAdm = await supabase
        .from('contas_financeiras')
        .select('*')
        .eq('codigo_igreja', codigoIgreja);

      if (!resAdm.error) setContasAdmList(resAdm.data || []);

      // Transferências entre contas (se a tabela ainda não existir, o resto do módulo segue funcionando)
      const resTransf = await supabase
        .from('transferencias_financeiras')
        .select('*')
        .eq('codigo_igreja', codigoIgreja)
        .order('data_transferencia', { ascending: true });

      if (resTransf.error) {
        const falta = resTransf.error.code === '42P01' || resTransf.error.code === 'PGRST205' || /transferencias_financeiras/.test(resTransf.error.message || '');
        setSemTabelaTransf(falta);
        setTransferencias([]);
      } else {
        setSemTabelaTransf(false);
        setTransferencias(resTransf.data || []);
      }

      // BUSCA DE MEMBROS RESTRITA EXATAMENTE À IGREJA ATUAL
      const resMemb = await supabase
        .from('members')
        .select('id, nome, email, celular_principal')
        .eq('codigo_igreja', codigoIgreja)
        .order('nome', { ascending: true });

      if (resMemb.error) {
        throw resMemb.error;
      }

      setMembrosList(resMemb.data || []);

    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [codigoIgreja]);

  useEffect(() => {
    if (!loggedUser) return;
    fetchDados();
  }, [loggedUser, fetchDados]);

  const handleSubmitLancamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLancamento && !exigirAdmin()) return;
    try {
      if (editingLancamento) {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: emailUsuarioLogado,
          password: senhaExclusao,
        });

        if (authError) {
          alert('Senha de administrador incorreta! A operação foi cancelada.');
          return;
        }
      }

      let docUrl = formLancamento.documento_url;

      if (arquivoDocumento) {
        const nomeArquivo = `${codigoIgreja}/${Date.now()}_${arquivoDocumento.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documentos_financeiros')
          .upload(nomeArquivo, arquivoDocumento);

        if (uploadError || !uploadData) {
          const continuar = window.confirm(
            `Não foi possível enviar o comprovante (${uploadError?.message || 'erro desconhecido'}).\n\nDeseja salvar o lançamento mesmo assim, sem o comprovante?`
          );
          if (!continuar) return;
        } else {
          const { data: urlData } = supabase.storage
            .from('documentos_financeiros')
            .getPublicUrl(nomeArquivo);
          docUrl = urlData.publicUrl;
        }
      }

      const payload = {
        codigo_igreja: codigoIgreja,
        data_lancamento: formLancamento.data_lancamento,
        tipo: formLancamento.tipo,
        descricao: formLancamento.descricao,
        valor: parseFloat(formLancamento.valor as string),
        conta_corrente_id: formLancamento.conta_corrente_id || null,
        id_conta_contabil: formLancamento.id_conta_contabil || null,
        membro_id: relacionadoMembro && formLancamento.membro_id ? formLancamento.membro_id : null,
        documento_url: docUrl || null,
      };

      if (editingLancamento) {
        const { error } = await supabase
          .from('lancamentos_financeiros')
          .update(payload)
          .eq('id', editingLancamento.id);

        if (error) throw error;
        await registrarLog('EDITAR_LANCAMENTO', `Atualizou o lançamento: "${payload.descricao}" (R$ ${payload.valor})`);
        alert('Lançamento atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('lancamentos_financeiros').insert([payload]);
        if (error) throw error;
        await registrarLog('NOVO_LANCAMENTO', `Criou o lançamento: "${payload.descricao}" (R$ ${payload.valor})`);
        alert('Lançamento realizado com sucesso!');
      }

      setShowModalLancamento(false);
      setEditingLancamento(null);
      setFormLancamento({ ...formLancamentoInicial, data_lancamento: hojeLocal() });
      setArquivoDocumento(null);
      setRelacionadoMembro(false);
      setSenhaExclusao('');
      fetchDados();
    } catch (err: any) {
      alert('Erro ao salvar lançamento: ' + err.message);
    }
  };

  const handleSubmitTransferencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (salvandoTransf) return;
    if (!podeTransferir) {
      alert('🔒 Você não tem permissão para transferir entre contas. Peça ao administrador.');
      return;
    }

    const valor = parseFloat(formTransf.valor);
    if (!formTransf.conta_origem_id || !formTransf.conta_destino_id) {
      alert('Escolha a conta de origem e a conta de destino.');
      return;
    }
    if (formTransf.conta_origem_id === formTransf.conta_destino_id) {
      alert('A conta de origem e a de destino precisam ser diferentes.');
      return;
    }
    if (!Number.isFinite(valor) || valor <= 0) {
      alert('Informe um valor maior que zero.');
      return;
    }

    // Aviso (não bloqueia): a conta de origem ficaria negativa na data escolhida
    const saldoOrigem = saldoContaAte(formTransf.conta_origem_id, formTransf.data_transferencia);
    if (saldoOrigem - valor < 0) {
      const ok = window.confirm(
        `O saldo de ${getNomeContaAdm(formTransf.conta_origem_id)} em ${dataBR(formTransf.data_transferencia)} é ${moeda(saldoOrigem)}.\n` +
          `Depois desta transferência ele ficaria em ${moeda(saldoOrigem - valor)}.\n\nDeseja continuar mesmo assim?`
      );
      if (!ok) return;
    }

    setSalvandoTransf(true);
    try {
      let docUrl: string | null = null;
      if (arquivoTransf) {
        const nomeArquivo = `${codigoIgreja}/transferencias/${Date.now()}_${arquivoTransf.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documentos_financeiros')
          .upload(nomeArquivo, arquivoTransf);
        if (uploadError || !uploadData) {
          const continuar = window.confirm(
            `Não foi possível enviar o comprovante (${uploadError?.message || 'erro desconhecido'}).\n\nDeseja salvar a transferência mesmo assim, sem o comprovante?`
          );
          if (!continuar) return;
        } else {
          docUrl = supabase.storage.from('documentos_financeiros').getPublicUrl(nomeArquivo).data.publicUrl;
        }
      }

      const payload = {
        codigo_igreja: codigoIgreja,
        data_transferencia: formTransf.data_transferencia,
        conta_origem_id: formTransf.conta_origem_id,
        conta_destino_id: formTransf.conta_destino_id,
        valor,
        descricao: formTransf.descricao.trim() || null,
        documento_url: docUrl,
        created_by: emailUsuarioLogado,
      };

      const { error } = await supabase.from('transferencias_financeiras').insert([payload]);
      if (error) throw error;

      await registrarLog(
        'NOVA_TRANSFERENCIA',
        `Transferiu ${moeda(valor)} de ${getNomeContaAdm(payload.conta_origem_id)} para ${getNomeContaAdm(payload.conta_destino_id)}`
      );
      alert('Transferência registrada com sucesso!');
      setShowModalTransf(false);
      setFormTransf(formTransfInicial());
      setArquivoTransf(null);
      fetchDados();
    } catch (err: any) {
      alert('Erro ao salvar transferência: ' + err.message);
    } finally {
      setSalvandoTransf(false);
    }
  };

  const handleSubmitConta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exigirAdmin()) return;
    try {
      const payload = { ...formConta, codigo_igreja: codigoIgreja };

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: emailUsuarioLogado,
        password: senhaExclusao,
      });

      if (authError) {
        alert('Senha incorreta! A operação foi cancelada.');
        return;
      }

      if (editingConta) {
        const { error } = await supabase
          .from('plano_contas_contabil')
          .update(payload)
          .eq('id', editingConta.id);

        if (error) throw error;
        await registrarLog('EDITAR_CONTA_CONTABIL', `Atualizou a conta contábil: ${payload.codigo_conta} - ${payload.nome_conta}`);
        alert('Conta contábil atualizada com sucesso!');
      } else {
        const { error } = await supabase.from('plano_contas_contabil').insert([payload]);
        if (error) throw error;
        await registrarLog('NOVA_CONTA_CONTABIL', `Cadastrou a conta contábil: ${payload.codigo_conta} - ${payload.nome_conta}`);
        alert('Conta cadastrada com sucesso!');
      }

      setShowModalConta(false);
      setEditingConta(null);
      setFormConta(formContaContabilInicial);
      setSenhaExclusao('');
      fetchDados();
    } catch (err: any) {
      alert('Erro ao salvar conta: ' + err.message);
    }
  };

  const handleSubmitAdm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exigirAdmin()) return;
    try {
      const payload = { ...formAdm, codigo_igreja: codigoIgreja };

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: emailUsuarioLogado,
        password: senhaExclusao,
      });

      if (authError) {
        alert('Senha incorreta! A operação foi cancelada.');
        return;
      }

      if (editingAdm) {
        const { error } = await supabase
          .from('contas_financeiras')
          .update(payload)
          .eq('id', editingAdm.id);

        if (error) throw error;
        await registrarLog('EDITAR_CONTA_ADM', `Atualizou a conta adm: ${payload.codigo_conta} (${payload.nome_conta})`);
        alert('Conta administrativa atualizada com sucesso!');
      } else {
        const { error } = await supabase.from('contas_financeiras').insert([payload]);
        if (error) throw error;
        await registrarLog('NOVA_CONTA_ADM', `Cadastrou a conta adm: ${payload.codigo_conta} (${payload.nome_conta})`);
        alert('Conta administrativa cadastrada com sucesso!');
      }

      setShowModalAdm(false);
      setEditingAdm(null);
      setFormAdm(formContaAdmInicial);
      setSenhaExclusao('');
      fetchDados();
    } catch (err: any) {
      alert('Erro ao salvar conta administrativa: ' + err.message);
    }
  };

  const confirmarExclusao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemParaExcluir) return;
    if (!exigirAdmin()) return;

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: emailUsuarioLogado,
        password: senhaExclusao,
      });

      if (authError) {
        alert('Senha incorreta! Exclusão cancelada.');
        return;
      }

      let tabela = 'lancamentos_financeiros';
      if (itemParaExcluir.tipo === 'conta_contabil') tabela = 'plano_contas_contabil';
      if (itemParaExcluir.tipo === 'conta_adm') tabela = 'contas_financeiras';
      if (itemParaExcluir.tipo === 'transferencia') tabela = 'transferencias_financeiras';

      const { error } = await supabase.from(tabela).delete().eq('id', itemParaExcluir.id);
      if (error) throw error;

      await registrarLog('EXCLUSAO', `Excluiu o item [${itemParaExcluir.tipo}]: ${itemParaExcluir.nome}`);
      alert('Item excluído com sucesso!');
      setShowDeleteModal(false);
      setItemParaExcluir(null);
      setSenhaExclusao('');
      fetchDados();
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const handleEnviarChatInterno = async (lanc: Lancamento) => {
    if (!lanc.membro_id) {
      alert(
        'Este lançamento não possui um membro vinculado. Clique em Editar e selecione o membro antes de enviar o agradecimento.'
      );
      return;
    }

    const membro = membrosList.find(
      (membroAtual) => String(membroAtual.id) === String(lanc.membro_id)
    );

    if (!membro) {
      alert(
        'O membro vinculado não foi encontrado na igreja atual. Atualize a lista ou edite o lançamento.'
      );
      return;
    }

    const descricao = (lanc.descricao || '').toLowerCase();
    const ehDizimoOuOferta =
      descricao.includes('dizimo') ||
      descricao.includes('dízimo') ||
      descricao.includes('oferta');

    if (!ehDizimoOuOferta) {
      alert('O agradecimento é exclusivo para lançamentos de Dízimo ou Oferta.');
      return;
    }

    // No chat, a conversa é identificada pelo e-mail: sem e-mail no cadastro, a mensagem não chega
    const emailMembro = (membro.email || '').trim().toLowerCase();
    if (!emailMembro) {
      alert(
        `${membro.nome} não tem e-mail no cadastro, então a mensagem não chegaria no chat. Cadastre o e-mail do membro e tente de novo.`
      );
      return;
    }

    if (lanc.agradecimento_enviado && !window.confirm(`O agradecimento já foi enviado para ${membro.nome}. Enviar de novo?`)) {
      return;
    }

    try {
      const textoMensagem = `Olá, ${membro.nome}! Recebemos a sua contribuição (${lanc.descricao}) no valor de R$ ${Number(
        lanc.valor
      ).toFixed(2)}. Deus abençoe ricamente a sua casa e a sua vida! 🙏✨`;

      // Mesmas colunas usadas pelo chat do app e do sistema (ChatModule)
      const { error: chatError } = await supabase
        .from('chat_mensagens')
        .insert([
          {
            codigo_igreja: codigoIgreja,
            sender: String(emailUsuarioLogado).trim().toLowerCase(),
            recipient_id: emailMembro,
            text: textoMensagem,
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            is_broadcast: false,
          },
        ]);

      if (chatError) throw chatError;

      const { error: lancamentoError } = await supabase
        .from('lancamentos_financeiros')
        .update({ agradecimento_enviado: true })
        .eq('id', lanc.id)
        .eq('codigo_igreja', codigoIgreja);

      if (lancamentoError) throw lancamentoError;

      alert(`Mensagem enviada com sucesso para ${membro.nome}!`);

      await registrarLog(
        'ENVIO_CHAT',
        `Enviou mensagem de agradecimento para ${membro.nome}`
      );

      await fetchDados();
    } catch (err: any) {
      alert('Erro ao enviar mensagem no chat: ' + err.message);
    }
  };

  const getNomeContaContabil = (id: string) => {
    const c = contasContabeis.find((x) => x.id === id);
    return c ? `${c.codigo_conta} - ${c.nome_conta}` : 'Não vinculada';
  };

  const getNomeContaAdm = (id: string) => {
    const adm = contasAdmList.find((x) => x.id === id);
    return adm ? `${adm.codigo_conta} (${adm.nome_conta})` : 'Caixa Geral';
  };

  const getNomeMembroVinculado = (membroId?: string | number) => {
    if (!membroId) return null;
    const m = membrosList.find((x) => String(x.id) === String(membroId));
    return m ? m.nome : null;
  };

  // ── RELATÓRIOS: período e conta ──
  // (datas no formato AAAA-MM-DD podem ser comparadas como texto)
  const noPeriodo = (l: Lancamento) =>
    (!dataInicio || (l.data_lancamento || '') >= dataInicio) && (!dataFim || (l.data_lancamento || '') <= dataFim);
  const antesDoPeriodo = (l: Lancamento) => !!dataInicio && (l.data_lancamento || '') < dataInicio;
  const sinal = (l: Lancamento) => (l.tipo === 'receita' ? 1 : -1) * Number(l.valor || 0);
  const daConta = (l: Lancamento) => !contaExtrato || (l.conta_corrente_id || '') === contaExtrato;

  const lancamentosPeriodo = lancamentos.filter(noPeriodo);

  const dadosBalancete = contasContabeis.map((conta) => {
    const lancsDaConta = lancamentosPeriodo.filter((l) => l.id_conta_contabil === conta.id);
    const total = lancsDaConta.reduce((acc, l) => acc + Number(l.valor || 0), 0);
    return { ...conta, total };
  }).filter((c) => c.total > 0);

  const totalReceitas = lancamentosPeriodo
    .filter((l) => l.tipo === 'receita')
    .reduce((acc, l) => acc + Number(l.valor || 0), 0);

  const totalDespesas = lancamentosPeriodo
    .filter((l) => l.tipo === 'despesa')
    .reduce((acc, l) => acc + Number(l.valor || 0), 0);

  const resultadoLiquido = totalReceitas - totalDespesas;

  // ── MOVIMENTOS DAS CONTAS ADM ──
  // Lançamentos (receita/despesa) e transferências entre contas. A transferência tira de uma conta e põe na outra,
  // então muda o saldo de cada conta, mas NÃO conta como receita nem despesa (DRE, Balancete e Diário não mudam).
  const nomeConta = (id: string) => (id ? getNomeContaAdm(id) : 'Sem conta informada');
  const movimentos: Movimento[] = [
    ...lancamentos.map((l): Movimento => ({
      id: l.id,
      data: l.data_lancamento || '',
      contaId: l.conta_corrente_id || '',
      descricao: l.descricao,
      entrada: l.tipo === 'receita' ? Number(l.valor || 0) : 0,
      saida: l.tipo === 'receita' ? 0 : Number(l.valor || 0),
      transferencia: false,
    })),
    ...transferencias.flatMap((t): Movimento[] => {
      const v = Number(t.valor || 0);
      const obs = t.descricao ? ` · ${t.descricao}` : '';
      return [
        { id: `${t.id}:s`, data: t.data_transferencia || '', contaId: t.conta_origem_id, descricao: `Transferência enviada para ${nomeConta(t.conta_destino_id)}${obs}`, entrada: 0, saida: v, transferencia: true },
        { id: `${t.id}:e`, data: t.data_transferencia || '', contaId: t.conta_destino_id, descricao: `Transferência recebida de ${nomeConta(t.conta_origem_id)}${obs}`, entrada: v, saida: 0, transferencia: true },
      ];
    }),
  ].sort((a, b) => a.data.localeCompare(b.data)); // estável: na mesma data, lançamentos vêm antes das transferências

  const movNoPeriodo = (m: Movimento) => (!dataInicio || m.data >= dataInicio) && (!dataFim || m.data <= dataFim);
  const movAntesDoPeriodo = (m: Movimento) => !!dataInicio && m.data < dataInicio;
  const liquido = (m: Movimento) => m.entrada - m.saida;
  const movDaConta = (m: Movimento) => !contaExtrato || m.contaId === contaExtrato;

  // Saldo de uma conta até uma data (usado para avisar antes de deixar a conta negativa)
  const saldoContaAte = (id: string, ate: string) =>
    movimentos.filter((m) => m.contaId === id && (!ate || m.data <= ate)).reduce((acc, m) => acc + liquido(m), 0);
  const saldoContaAtual = (id: string) => movimentos.filter((m) => m.contaId === id).reduce((acc, m) => acc + liquido(m), 0);

  // Extrato: começa pelo saldo de tudo o que houve antes da data inicial
  const saldoAnterior = movimentos.filter((m) => movAntesDoPeriodo(m) && movDaConta(m)).reduce((acc, m) => acc + liquido(m), 0);
  let saldoAcumulado = saldoAnterior;
  const movimentosComSaldo = movimentos.filter((m) => movNoPeriodo(m) && movDaConta(m)).map((m) => {
    saldoAcumulado += liquido(m);
    return { ...m, saldoParcial: saldoAcumulado };
  });
  const saldoFinalExtrato = saldoAcumulado;

  // Resumo por conta (aparece quando o extrato está em "Todas as contas")
  const idsContas = Array.from(new Set([...contasAdmList.map((c) => c.id), ...movimentos.map((m) => m.contaId)]));
  const resumoPorConta = idsContas.map((id) => {
    const daquela = movimentos.filter((m) => m.contaId === id);
    const anterior = daquela.filter(movAntesDoPeriodo).reduce((acc, m) => acc + liquido(m), 0);
    const periodo = daquela.filter(movNoPeriodo);
    const soma = (lista: Movimento[], campo: 'entrada' | 'saida') => lista.reduce((acc, m) => acc + m[campo], 0);
    const entradas = soma(periodo.filter((m) => !m.transferencia), 'entrada');
    const saidas = soma(periodo.filter((m) => !m.transferencia), 'saida');
    const transfRecebidas = soma(periodo.filter((m) => m.transferencia), 'entrada');
    const transfEnviadas = soma(periodo.filter((m) => m.transferencia), 'saida');
    return {
      id,
      nome: nomeConta(id),
      anterior,
      entradas,
      saidas,
      transfRecebidas,
      transfEnviadas,
      saldo: anterior + entradas - saidas + transfRecebidas - transfEnviadas,
    };
  });

  const transferenciasPeriodo = transferencias.filter((t) => (!dataInicio || t.data_transferencia >= dataInicio) && (!dataFim || t.data_transferencia <= dataFim));

  const hojeData = new Date();
  const atalhosPeriodo = [
    { rotulo: 'Este mês', ini: inicioDoMes(hojeData.getFullYear(), hojeData.getMonth()), fim: fimDoMes(hojeData.getFullYear(), hojeData.getMonth()) },
    { rotulo: 'Mês passado', ini: inicioDoMes(hojeData.getFullYear(), hojeData.getMonth() - 1), fim: fimDoMes(hojeData.getFullYear(), hojeData.getMonth() - 1) },
    { rotulo: 'Este ano', ini: `${hojeData.getFullYear()}-01-01`, fim: `${hojeData.getFullYear()}-12-31` },
    { rotulo: 'Tudo', ini: '', fim: '' },
  ];
  const textoPeriodo =
    dataInicio || dataFim
      ? `Período: ${dataInicio ? dataBR(dataInicio) : 'início'} a ${dataFim ? dataBR(dataFim) : 'hoje'}`
      : 'Período: todos os lançamentos';

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 w-full max-w-6xl mx-auto space-y-6">

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-area, .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white !important;
          }
          .receipt-print, .receipt-print * {
            visibility: visible;
          }
          .receipt-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 50vh;
            padding: 20px;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Cabeçalho e Abas */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4 no-print">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-blue-900 tracking-tight">
            Gestão Financeira & Contábil
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Controle Administrativo e Contábil ({codigoIgreja})
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => { setSubAba('lancamentos'); fetchDados(); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              subAba === 'lancamentos' ? 'bg-blue-900 text-white shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            💸 Lançamentos
          </button>
          <button
            type="button"
            onClick={() => { setSubAba('contas_adm'); fetchDados(); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              subAba === 'contas_adm' ? 'bg-blue-900 text-white shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🏦 Contas Adm
          </button>
          <button
            type="button"
            onClick={() => { setSubAba('plano_contas'); fetchDados(); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              subAba === 'plano_contas' ? 'bg-blue-900 text-white shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 Plano de Contas
          </button>
          <button
            type="button"
            onClick={() => { setSubAba('relatorios'); fetchDados(); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              subAba === 'relatorios' ? 'bg-blue-900 text-white shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📈 Relatórios
          </button>
        </div>
      </div>

      {/* BOTÕES DE AÇÃO SUPERIOR */}
      <div className="flex justify-end no-print">
        {subAba === 'lancamentos' && (
          <div className="flex flex-wrap justify-end gap-2">
          {podeTransferir && (
          <button
            type="button"
            onClick={() => {
              setFormTransf(formTransfInicial());
              setArquivoTransf(null);
              setShowModalTransf(true);
            }}
            className="px-4 py-3 bg-sky-700 hover:bg-sky-600 text-white font-bold text-sm rounded-xl shadow transition cursor-pointer"
          >
            🔁 Transferir entre contas
          </button>
          )}
          <button
            type="button"
            onClick={() => {
              setEditingLancamento(null);
              setFormLancamento({ ...formLancamentoInicial, data_lancamento: hojeLocal() });
              setArquivoDocumento(null);
              setRelacionadoMembro(false);
              setSenhaExclusao('');
              setShowModalLancamento(true);
            }}
            className="px-4 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow transition cursor-pointer"
          >
            + Novo Lançamento
          </button>
          </div>
        )}

        {subAba === 'contas_adm' && (
          <button
            type="button"
            onClick={() => {
              if (!exigirAdmin()) return;
              setEditingAdm(null);
              setFormAdm(formContaAdmInicial);
              setSenhaExclusao('');
              setShowModalAdm(true);
            }}
            className="px-4 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow transition cursor-pointer"
          >
            + Nova Conta Adm
          </button>
        )}

        {subAba === 'plano_contas' && (
          <button
            type="button"
            onClick={() => {
              if (!exigirAdmin()) return;
              setEditingConta(null);
              setFormConta(formContaContabilInicial);
              setSenhaExclusao('');
              setShowModalConta(true);
            }}
            className="px-4 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow transition cursor-pointer"
          >
            + Nova Conta Contábil
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs no-print">
          🔒 Você pode registrar lançamentos e ver os relatórios. <strong>Editar, excluir e cadastrar contas</strong> é só para o administrador.
        </div>
      )}

      {loading && <p className="text-center py-6 text-slate-500">Carregando dados financeiros...</p>}
      {error && <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">{error}</div>}

      {/* CONTEÚDO DA ABA: LANÇAMENTOS */}
      {!loading && subAba === 'lancamentos' && (
        <>
          {lancamentos.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <p className="text-slate-500 text-sm">Nenhum lançamento financeiro registrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-700 text-xs uppercase font-bold">
                    <th className="p-3">Data</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Descrição</th>
                    <th className="p-3">Membro Vinculado</th>
                    <th className="p-3">Conta Adm</th>
                    <th className="p-3 text-right">Valor</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {lancamentos.map((l) => {
                    const isReceita = l.tipo === 'receita';
                    const nomeMembro = getNomeMembroVinculado(l.membro_id);
                    const descLower = (l.descricao || '').toLowerCase();
                    const ehDizimoOuOferta = descLower.includes('dizimo') || descLower.includes('dízimo') || descLower.includes('oferta');

                    return (
                      <tr key={l.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 whitespace-nowrap text-slate-600">
                          {l.data_lancamento ? l.data_lancamento.split('-').reverse().join('/') : '-'}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            isReceita ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {isReceita ? '🟢 Receita' : '🔴 Despesa'}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-800">{l.descricao}</td>
                        <td className="p-3">
                          {nomeMembro ? (
                            <span className="px-2 py-1 bg-blue-50 text-blue-800 font-bold text-xs rounded-lg border border-blue-100">
                              👤 {nomeMembro}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-600 text-xs">{getNomeContaAdm(l.conta_corrente_id)}</td>
                        <td className={`p-3 text-right font-black ${isReceita ? 'text-emerald-700' : 'text-rose-700'}`}>
                          R$ {Number(l.valor || 0).toFixed(2)}
                        </td>
                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setLancamentoParaRecibo(l);
                              setShowModalRecibo(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg transition cursor-pointer"
                            title="Imprimir Recibo"
                          >
                            🖨️ Recibo
                          </button>

                          {ehDizimoOuOferta && (
                            <button
                              type="button"
                              onClick={() => handleEnviarChatInterno(l)}
                              className={`px-2.5 py-1 font-bold text-xs rounded-lg transition cursor-pointer border ${
                                l.agradecimento_enviado
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              }`}
                              title={l.agradecimento_enviado ? "Agradecimento já enviado no chat" : "Enviar agradecimento no chat interno"}
                            >
                              {l.agradecimento_enviado ? '🟢 Agradecido' : '💬 Agradecer'}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (!exigirAdmin()) return;
                              setEditingLancamento(l);
                              setFormLancamento({
                                data_lancamento: l.data_lancamento || '',
                                tipo: l.tipo || 'receita',
                                descricao: l.descricao || '',
                                valor: l.valor?.toString() || '',
                                conta_corrente_id: l.conta_corrente_id || '',
                                id_conta_contabil: l.id_conta_contabil || '',
                                membro_id: l.membro_id || '',
                                documento_url: l.documento_url || '',
                              });
                              setArquivoDocumento(null);
                              setRelacionadoMembro(Boolean(l.membro_id));
                              setSenhaExclusao('');
                              setShowModalLancamento(true);
                            }}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-lg transition cursor-pointer"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (!exigirAdmin()) return;
                              setItemParaExcluir({ id: l.id, tipo: 'lancamento', nome: l.descricao });
                              setSenhaExclusao('');
                              setShowDeleteModal(true);
                            }}
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

          {/* TRANSFERÊNCIAS ENTRE CONTAS */}
          {verTransferencias && (
          <div className="space-y-2 no-print">
            <h3 className="font-black text-blue-900 text-base">🔁 Transferências entre contas</h3>
            {semTabelaTransf ? (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs">
                A tabela <code>transferencias_financeiras</code> ainda não existe no Supabase. Rode o arquivo <code>transferencias_financeiras.sql</code> no SQL Editor e recarregue.
              </div>
            ) : transferencias.length === 0 ? (
              <div className="p-5 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-500 text-sm">Nenhuma transferência registrada.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-slate-50 text-slate-700 text-xs uppercase font-bold">
                      <th className="p-3">Data</th>
                      <th className="p-3">De</th>
                      <th className="p-3">Para</th>
                      <th className="p-3">Descrição</th>
                      <th className="p-3 text-right">Valor</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {[...transferencias].reverse().map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 whitespace-nowrap text-slate-600">{dataBR(t.data_transferencia) || '-'}</td>
                        <td className="p-3 text-xs text-slate-700">{nomeConta(t.conta_origem_id)}</td>
                        <td className="p-3 text-xs text-slate-700">➜ {nomeConta(t.conta_destino_id)}</td>
                        <td className="p-3 text-slate-600">{t.descricao || '-'}</td>
                        <td className="p-3 text-right font-black text-sky-700">{moeda(Number(t.valor || 0))}</td>
                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          {t.documento_url && (
                            <a
                              href={t.documento_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-lg transition"
                            >
                              📄 Comprovante
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (!exigirAdmin()) return;
                              setItemParaExcluir({
                                id: t.id,
                                tipo: 'transferencia',
                                nome: `transferência de ${moeda(Number(t.valor || 0))} (${nomeConta(t.conta_origem_id)} ➜ ${nomeConta(t.conta_destino_id)})`,
                              });
                              setSenhaExclusao('');
                              setShowDeleteModal(true);
                            }}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition cursor-pointer"
                          >
                            Excluir
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
        </>
      )}

      {/* CONTEÚDO DA ABA: CONTAS ADM */}
      {!loading && subAba === 'contas_adm' && (
        <>
          {contasAdmList.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <p className="text-slate-500 text-sm">Nenhuma conta administrativa cadastrada.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-700 text-xs uppercase font-bold">
                    <th className="p-3">Tipo / Descrição (Código Conta)</th>
                    <th className="p-3">Nome / Banco</th>
                    <th className="p-3">Agência</th>
                    <th className="p-3">Número da Conta</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {contasAdmList.map((adm) => (
                    <tr key={adm.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-bold text-blue-900">{adm.codigo_conta}</td>
                      <td className="p-3 font-semibold text-slate-800">{adm.nome_conta}</td>
                      <td className="p-3 text-slate-600">{adm.agencia || '-'}</td>
                      <td className="p-3 text-slate-600">{adm.numero_conta || '-'}</td>
                      <td className="p-3 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            if (!exigirAdmin()) return;
                            setEditingAdm(adm);
                            setFormAdm({
                              codigo_conta: adm.codigo_conta,
                              nome_conta: adm.nome_conta,
                              agencia: adm.agencia || '',
                              numero_conta: adm.numero_conta || '',
                            });
                            setSenhaExclusao('');
                            setShowModalAdm(true);
                          }}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-lg transition cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!exigirAdmin()) return;
                            setItemParaExcluir({ id: adm.id, tipo: 'conta_adm', nome: `${adm.codigo_conta} - ${adm.nome_conta}` });
                            setSenhaExclusao('');
                            setShowDeleteModal(true);
                          }}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition cursor-pointer"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* CONTEÚDO DA ABA: PLANO DE CONTAS */}
      {!loading && subAba === 'plano_contas' && (
        <>
          {contasContabeis.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <p className="text-slate-500 text-sm">Nenhuma conta cadastrada no plano de contas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-700 text-xs uppercase font-bold">
                    <th className="p-3">Código</th>
                    <th className="p-3">Nome da Conta</th>
                    <th className="p-3">Natureza</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {contasContabeis.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-bold text-blue-900">{c.codigo_conta}</td>
                      <td className="p-3 font-semibold text-slate-800">{c.nome_conta}</td>
                      <td className="p-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border">
                          {c.tipo_natureza}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            if (!exigirAdmin()) return;
                            setEditingConta(c);
                            setFormConta({
                              codigo_conta: c.codigo_conta,
                              nome_conta: c.nome_conta,
                              conta_pai: c.conta_pai || '',
                              tipo_natureza: c.tipo_natureza,
                            });
                            setSenhaExclusao('');
                            setShowModalConta(true);
                          }}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-lg transition cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!exigirAdmin()) return;
                            setItemParaExcluir({ id: c.id, tipo: 'conta_contabil', nome: c.nome_conta });
                            setSenhaExclusao('');
                            setShowDeleteModal(true);
                          }}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition cursor-pointer"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* CONTEÚDO DA ABA: RELATÓRIOS */}
      {!loading && subAba === 'relatorios' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2 rounded-2xl border no-print">
            <button
              type="button"
              onClick={() => setTipoRelatorio('conta_corrente')}
              className={`py-3 px-2 rounded-xl text-xs font-bold transition cursor-pointer text-center ${
                tipoRelatorio === 'conta_corrente' ? 'bg-blue-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              1) Conta Corrente
            </button>
            <button
              type="button"
              onClick={() => setTipoRelatorio('diario')}
              className={`py-3 px-2 rounded-xl text-xs font-bold transition cursor-pointer text-center ${
                tipoRelatorio === 'diario' ? 'bg-blue-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              2) Diário
            </button>
            <button
              type="button"
              onClick={() => setTipoRelatorio('balancete')}
              className={`py-3 px-2 rounded-xl text-xs font-bold transition cursor-pointer text-center ${
                tipoRelatorio === 'balancete' ? 'bg-blue-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              3) Balancete
            </button>
            <button
              type="button"
              onClick={() => setTipoRelatorio('dre')}
              className={`py-3 px-2 rounded-xl text-xs font-bold transition cursor-pointer text-center ${
                tipoRelatorio === 'dre' ? 'bg-blue-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              4) DRE
            </button>
          </div>

          {/* FILTRO DE PERÍODO */}
          <div className="bg-white border rounded-2xl p-3 sm:p-4 space-y-3 no-print">
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-xs font-bold text-slate-700">
                De
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="block mt-1 border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white"
                />
              </label>
              <label className="text-xs font-bold text-slate-700">
                Até
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="block mt-1 border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white"
                />
              </label>
              <div className="flex flex-wrap gap-1.5">
                {atalhosPeriodo.map((a) => {
                  const ativo = dataInicio === a.ini && dataFim === a.fim;
                  return (
                    <button
                      key={a.rotulo}
                      type="button"
                      onClick={() => {
                        setDataInicio(a.ini);
                        setDataFim(a.fim);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        ativo ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {a.rotulo}
                    </button>
                  );
                })}
              </div>
            </div>
            {dataInicio && dataFim && dataInicio > dataFim && (
              <p className="text-xs font-bold text-rose-700">A data inicial está depois da data final: nenhum lançamento vai aparecer.</p>
            )}
          </div>

          <div className="printable-area bg-slate-50 border rounded-2xl p-4 sm:p-6 space-y-4">

            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Igreja ID: {codigoIgreja}</span>
                <p className="text-sm font-black text-blue-900">{textoPeriodo}</p>
                <p className="text-xs text-slate-500">Emitido em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="no-print px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-2"
              >
                🖨️ Imprimir / Salvar PDF
              </button>
            </div>

            {/* RELATÓRIO 1: CONTA CORRENTE */}
            {tipoRelatorio === 'conta_corrente' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                  <div>
                    <h3 className="font-black text-blue-900 text-lg mb-1">Relatório Administrativo: Extrato por Conta Adm</h3>
                    <p className="text-xs text-slate-500">
                      {contaExtrato ? `Conta: ${getNomeContaAdm(contaExtrato)}` : 'Todas as contas'} · saldo parcial acumulado por linha.
                    </p>
                  </div>
                  <label className="text-xs font-bold text-slate-700 no-print">
                    Conta
                    <select
                      value={contaExtrato}
                      onChange={(e) => setContaExtrato(e.target.value)}
                      className="block mt-1 border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white font-medium min-w-[220px]"
                    >
                      <option value="">Todas as contas</option>
                      {contasAdmList.map((adm) => (
                        <option key={adm.id} value={adm.id}>
                          {adm.codigo_conta} ({adm.nome_conta})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* Resumo por conta (só em "Todas as contas") */}
                {!contaExtrato && resumoPorConta.length > 0 && (
                  <div className="overflow-x-auto bg-white rounded-xl border">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b bg-slate-100 text-slate-700 text-xs font-bold uppercase">
                          <th className="p-3">Conta</th>
                          <th className="p-3 text-right">Saldo anterior</th>
                          <th className="p-3 text-right">Entradas</th>
                          <th className="p-3 text-right">Saídas</th>
                          <th className="p-3 text-right">Transf. recebidas</th>
                          <th className="p-3 text-right">Transf. enviadas</th>
                          <th className="p-3 text-right">Saldo final</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {resumoPorConta.map((c) => (
                          <tr key={c.id || 'sem-conta'}>
                            <td className="p-3 font-semibold text-slate-800">{c.nome}</td>
                            <td className="p-3 text-right text-slate-600">{moeda(c.anterior)}</td>
                            <td className="p-3 text-right font-bold text-emerald-700">{moeda(c.entradas)}</td>
                            <td className="p-3 text-right font-bold text-rose-700">{moeda(c.saidas)}</td>
                            <td className="p-3 text-right font-bold text-sky-700">{moeda(c.transfRecebidas)}</td>
                            <td className="p-3 text-right font-bold text-sky-700">{moeda(c.transfEnviadas)}</td>
                            <td className={`p-3 text-right font-black ${c.saldo >= 0 ? 'text-blue-900' : 'text-rose-700'}`}>{moeda(c.saldo)}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50 font-black">
                          <td className="p-3 text-slate-800">Total geral</td>
                          <td className="p-3 text-right text-slate-700">{moeda(resumoPorConta.reduce((acc, c) => acc + c.anterior, 0))}</td>
                          <td className="p-3 text-right text-emerald-700">{moeda(resumoPorConta.reduce((acc, c) => acc + c.entradas, 0))}</td>
                          <td className="p-3 text-right text-rose-700">{moeda(resumoPorConta.reduce((acc, c) => acc + c.saidas, 0))}</td>
                          <td className="p-3 text-right text-sky-700">{moeda(resumoPorConta.reduce((acc, c) => acc + c.transfRecebidas, 0))}</td>
                          <td className="p-3 text-right text-sky-700">{moeda(resumoPorConta.reduce((acc, c) => acc + c.transfEnviadas, 0))}</td>
                          <td className="p-3 text-right text-blue-900">{moeda(resumoPorConta.reduce((acc, c) => acc + c.saldo, 0))}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="overflow-x-auto bg-white rounded-xl border">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b bg-slate-100 text-slate-700 text-xs font-bold uppercase">
                        <th className="p-3">Data</th>
                        <th className="p-3">Conta Adm</th>
                        <th className="p-3">Histórico</th>
                        <th className="p-3 text-right">Entrada</th>
                        <th className="p-3 text-right">Saída</th>
                        <th className="p-3 text-right">Saldo Parcial</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {dataInicio && (
                        <tr className="bg-slate-50">
                          <td className="p-3 text-slate-600 whitespace-nowrap">{dataBR(dataInicio)}</td>
                          <td className="p-3" />
                          <td className="p-3 font-bold text-slate-700">Saldo anterior</td>
                          <td className="p-3" />
                          <td className="p-3" />
                          <td className={`p-3 text-right font-black ${saldoAnterior >= 0 ? 'text-blue-900' : 'text-rose-700'}`}>{moeda(saldoAnterior)}</td>
                        </tr>
                      )}
                      {movimentosComSaldo.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-xs text-slate-400">Nenhum movimento neste período.</td>
                        </tr>
                      )}
                      {movimentosComSaldo.map((m) => (
                        <tr key={m.id} className={m.transferencia ? 'bg-sky-50/60' : ''}>
                          <td className="p-3 text-slate-600 whitespace-nowrap">{dataBR(m.data)}</td>
                          <td className="p-3 font-semibold text-slate-800">{nomeConta(m.contaId)}</td>
                          <td className="p-3 text-slate-600">
                            {m.transferencia && (
                              <span className="mr-1.5 px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 text-[10px] font-bold">🔁 TRANSF.</span>
                            )}
                            {m.descricao}
                          </td>
                          <td className="p-3 text-right font-bold text-emerald-700">{m.entrada > 0 ? moeda(m.entrada) : '-'}</td>
                          <td className="p-3 text-right font-bold text-rose-700">{m.saida > 0 ? moeda(m.saida) : '-'}</td>
                          <td className={`p-3 text-right font-black ${m.saldoParcial >= 0 ? 'text-blue-900' : 'text-rose-700'}`}>
                            {moeda(m.saldoParcial)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50">
                        <td colSpan={5} className="p-3 text-right font-black text-slate-800">Saldo final</td>
                        <td className={`p-3 text-right font-black ${saldoFinalExtrato >= 0 ? 'text-blue-900' : 'text-rose-700'}`}>{moeda(saldoFinalExtrato)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* RELATÓRIO 2: DIÁRIO */}
            {tipoRelatorio === 'diario' && (
              <div>
                <h3 className="font-black text-blue-900 text-lg mb-1">Relatório Contábil: Livro Diário</h3>
                <p className="text-xs text-slate-500 mb-4">Registro cronológico de todas as operações contábeis da igreja.</p>
                {transferenciasPeriodo.length > 0 && (
                  <p className="text-xs text-sky-800 bg-sky-50 border border-sky-200 rounded-xl p-2.5 mb-4">
                    {transferenciasPeriodo.length} {transferenciasPeriodo.length === 1 ? 'transferência entre contas' : 'transferências entre contas'} no período não aparece{transferenciasPeriodo.length === 1 ? '' : 'm'} aqui, pois não são receita nem despesa. Veja em Conta Corrente.
                  </p>
                )}

                <div className="overflow-x-auto bg-white rounded-xl border">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b bg-slate-100 text-slate-700 text-xs font-bold uppercase">
                        <th className="p-3">Data</th>
                        <th className="p-3">Descrição da Operação</th>
                        <th className="p-3">Conta Contábil Vinculada</th>
                        <th className="p-3 text-right">Valor (R$)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {lancamentosPeriodo.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-xs text-slate-400">Nenhum lançamento neste período.</td>
                        </tr>
                      )}
                      {lancamentosPeriodo.map((l) => (
                        <tr key={l.id}>
                          <td className="p-3 text-slate-600 whitespace-nowrap">{l.data_lancamento?.split('-').reverse().join('/')}</td>
                          <td className="p-3 font-medium text-slate-800">{l.descricao}</td>
                          <td className="p-3 text-blue-900 font-semibold">{getNomeContaContabil(l.id_conta_contabil)}</td>
                          <td className="p-3 text-right font-black">R$ {Number(l.valor).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* RELATÓRIO 3: BALANCETE */}
            {tipoRelatorio === 'balancete' && (
              <div>
                <h3 className="font-black text-blue-900 text-lg mb-1">Relatório Contábil: Balancete de Verificação</h3>
                <p className="text-xs text-slate-500 mb-4">Saldo acumulado por conta do plano de contas.</p>

                <div className="overflow-x-auto bg-white rounded-xl border">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b bg-slate-100 text-slate-700 text-xs font-bold uppercase">
                        <th className="p-3">Código</th>
                        <th className="p-3">Nome da Conta</th>
                        <th className="p-3">Natureza</th>
                        <th className="p-3 text-right">Saldo Movimentado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {dadosBalancete.map((c) => (
                        <tr key={c.id}>
                          <td className="p-3 font-bold text-blue-900">{c.codigo_conta}</td>
                          <td className="p-3 font-semibold text-slate-800">{c.nome_conta}</td>
                          <td className="p-3">{c.tipo_natureza}</td>
                          <td className="p-3 text-right font-black text-slate-800">{moeda(c.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* RELATÓRIO 4: DRE */}
            {tipoRelatorio === 'dre' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-black text-blue-900 text-lg">Demonstração do Resultado do Exercício (DRE)</h3>
                  <p className="text-xs text-slate-500">Resumo oficial de receitas, despesas e superávit/déficit do período.</p>
                </div>

                <div className="bg-white rounded-2xl border p-6 space-y-4 shadow-sm">
                  <div className="flex justify-between items-center border-b pb-3">
                    <span className="font-bold text-emerald-800 text-sm">🟢 Total de Receitas</span>
                    <span className="font-black text-emerald-700 text-base">{moeda(totalReceitas)}</span>
                  </div>

                  <div className="flex justify-between items-center border-b pb-3">
                    <span className="font-bold text-rose-800 text-sm">🔴 Total de Despesas</span>
                    <span className="font-black text-rose-700 text-base">{moeda(totalDespesas)}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="font-black text-blue-900 text-base"> Resultado Líquido (Superávit / Déficit):</span>
                    <span className={`font-black text-lg ${resultadoLiquido >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {moeda(resultadoLiquido)}
                    </span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* MODAL DE NOVO / EDITAR LANÇAMENTO */}
      {showModalLancamento && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4 mb-6 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-black text-blue-900">
                {editingLancamento ? 'Editar Lançamento Financeiro' : 'Novo Lançamento Financeiro'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModalLancamento(false)}
                className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleSubmitLancamento} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo *</label>
                  <select
                    value={formLancamento.tipo}
                    onChange={(e) => setFormLancamento({ ...formLancamento, tipo: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none bg-white font-medium"
                    required
                  >
                    <option value="receita">🟢 Receita (Entrada)</option>
                    <option value="despesa">🔴 Despesa (Saída)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Data *</label>
                  <input
                    type="date"
                    value={formLancamento.data_lancamento}
                    onChange={(e) => setFormLancamento({ ...formLancamento, data_lancamento: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Descrição *</label>
                <input
                  type="text"
                  value={formLancamento.descricao}
                  onChange={(e) => setFormLancamento({ ...formLancamento, descricao: e.target.value })}
                  placeholder="Ex: Dízimos do Culto, Conta de Luz"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Valor (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formLancamento.valor}
                  onChange={(e) => setFormLancamento({ ...formLancamento, valor: e.target.value })}
                  placeholder="0.00"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none font-bold text-blue-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  🏦 Conta Adm (Caixa / Banco) *
                </label>
                <select
                  value={formLancamento.conta_corrente_id}
                  onChange={(e) => setFormLancamento({ ...formLancamento, conta_corrente_id: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none bg-white font-medium"
                  required
                >
                  <option value="">Selecione a conta administrativa...</option>
                  {contasAdmList.map((adm) => (
                    <option key={adm.id} value={adm.id}>{adm.codigo_conta} ({adm.nome_conta})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  📊 Conta do Plano de Contas (Contábil / DRE) *
                </label>
                <select
                  value={formLancamento.id_conta_contabil}
                  onChange={(e) => setFormLancamento({ ...formLancamento, id_conta_contabil: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none bg-white font-medium"
                  required
                >
                  <option value="">Selecione a conta do plano contábil...</option>
                  {contasContabeis.map((c) => (
                    <option key={c.id} value={c.id}>{c.codigo_conta} - {c.nome_conta} ({c.tipo_natureza})</option>
                  ))}
                </select>
              </div>

              {/* VÍNCULO COM MEMBRO */}
              <div className="bg-slate-50 border p-4 rounded-2xl space-y-3">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 text-xs">
                  <input
                    type="checkbox"
                    checked={relacionadoMembro}
                    onChange={(e) => {
                      setRelacionadoMembro(e.target.checked);
                      if (!e.target.checked) setFormLancamento({ ...formLancamento, membro_id: '' });
                    }}
                    className="w-4 h-4 rounded text-blue-900 cursor-pointer"
                  />
                  <span>Está relacionado a algum membro?</span>
                </label>

                {relacionadoMembro && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-slate-700 uppercase">Selecionar Membro *</label>
                    </div>
                    <select
                      value={formLancamento.membro_id || ''}
                      onChange={(e) =>
                        setFormLancamento((prev) => ({
                          ...prev,
                          membro_id: e.target.value,
                        }))
                      }
                      className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none bg-white font-semibold text-blue-900 cursor-pointer shadow-sm"
                      required={relacionadoMembro}
                    >
                      <option value="">-- Selecione o membro --</option>

                      {membrosList.map((membro) => (
                        <option key={membro.id} value={membro.id}>
                          {membro.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* INSERIR DOCUMENTO / COMPROVANTE */}
              <div className="bg-blue-50/50 border border-blue-200 p-4 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-blue-900 uppercase">
                  📎 Inserir Documento / Comprovante (Foto ou Arquivo)
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setArquivoDocumento(e.target.files[0]);
                    }
                  }}
                  className="w-full border border-blue-300 rounded-xl px-3 py-2 text-xs bg-white font-medium cursor-pointer"
                />
                {arquivoDocumento && (
                  <p className="text-xs text-emerald-700 font-bold">
                    Selecionado: {arquivoDocumento.name}
                  </p>
                )}
                {!arquivoDocumento && formLancamento.documento_url && (
                  <a
                    href={formLancamento.documento_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-xs font-bold text-blue-800 underline"
                  >
                    📄 Ver comprovante já anexado
                  </a>
                )}
              </div>

              {/* SENHA APENAS NA EDIÇÃO */}
              {editingLancamento && (
                <div className="pt-2 border-t">
                  <label className="block text-xs font-bold text-rose-700 mb-1">Senha do Administrador para Salvar *</label>
                  <input
                    type="password"
                    value={senhaExclusao}
                    onChange={(e) => setSenhaExclusao(e.target.value)}
                    placeholder="Sua senha atual"
                    className="w-full border border-rose-300 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModalLancamento(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-900 text-white font-bold text-sm rounded-xl shadow cursor-pointer"
                >
                  {editingLancamento ? 'Salvar Alterações' : 'Salvar Lançamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE TRANSFERÊNCIA ENTRE CONTAS */}
      {showModalTransf && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4 mb-6">
              <h3 className="text-xl font-black text-blue-900">🔁 Transferência entre contas</h3>
              <button
                type="button"
                onClick={() => setShowModalTransf(false)}
                className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            {contasAdmList.length < 2 ? (
              <p className="text-sm text-slate-600 bg-amber-50 border border-amber-200 rounded-xl p-4">
                Para transferir é preciso ter pelo menos duas contas administrativas cadastradas (por exemplo, Caixa e Banco). Cadastre a outra na aba <strong>Contas Adm</strong>.
              </p>
            ) : (
              <form onSubmit={handleSubmitTransferencia} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Data *</label>
                    <input
                      type="date"
                      value={formTransf.data_transferencia}
                      onChange={(e) => setFormTransf({ ...formTransf, data_transferencia: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Valor (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formTransf.valor}
                      onChange={(e) => setFormTransf({ ...formTransf, valor: e.target.value })}
                      placeholder="0.00"
                      className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none font-bold text-blue-900"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">De (sai desta conta) *</label>
                  <select
                    value={formTransf.conta_origem_id}
                    onChange={(e) =>
                      setFormTransf({
                        ...formTransf,
                        conta_origem_id: e.target.value,
                        conta_destino_id: formTransf.conta_destino_id === e.target.value ? '' : formTransf.conta_destino_id,
                      })
                    }
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none bg-white font-medium"
                    required
                  >
                    <option value="">Selecione a conta de origem...</option>
                    {contasAdmList.map((adm) => (
                      <option key={adm.id} value={adm.id}>{adm.codigo_conta} ({adm.nome_conta})</option>
                    ))}
                  </select>
                  {formTransf.conta_origem_id && (
                    <p className="text-xs text-slate-500 mt-1">
                      Saldo atual: <strong className={saldoContaAtual(formTransf.conta_origem_id) >= 0 ? 'text-blue-900' : 'text-rose-700'}>{moeda(saldoContaAtual(formTransf.conta_origem_id))}</strong>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Para (entra nesta conta) *</label>
                  <select
                    value={formTransf.conta_destino_id}
                    onChange={(e) => setFormTransf({ ...formTransf, conta_destino_id: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none bg-white font-medium"
                    required
                  >
                    <option value="">Selecione a conta de destino...</option>
                    {contasAdmList
                      .filter((adm) => adm.id !== formTransf.conta_origem_id)
                      .map((adm) => (
                        <option key={adm.id} value={adm.id}>{adm.codigo_conta} ({adm.nome_conta})</option>
                      ))}
                  </select>
                  {formTransf.conta_destino_id && (
                    <p className="text-xs text-slate-500 mt-1">
                      Saldo atual: <strong className={saldoContaAtual(formTransf.conta_destino_id) >= 0 ? 'text-blue-900' : 'text-rose-700'}>{moeda(saldoContaAtual(formTransf.conta_destino_id))}</strong>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Descrição (opcional)</label>
                  <input
                    type="text"
                    value={formTransf.descricao}
                    onChange={(e) => setFormTransf({ ...formTransf, descricao: e.target.value })}
                    placeholder="Ex: Depósito do caixa no banco"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none"
                  />
                </div>

                <div className="bg-blue-50/50 border border-blue-200 p-4 rounded-2xl space-y-2">
                  <label className="block text-xs font-bold text-blue-900 uppercase">📎 Comprovante (opcional)</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setArquivoTransf(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                    className="w-full border border-blue-300 rounded-xl px-3 py-2 text-xs bg-white font-medium cursor-pointer"
                  />
                  {arquivoTransf && <p className="text-xs text-emerald-700 font-bold">Selecionado: {arquivoTransf.name}</p>}
                </div>

                <p className="text-xs text-slate-500 bg-slate-50 border rounded-xl p-3">
                  A transferência muda o saldo das duas contas, mas <strong>não é receita nem despesa</strong>: não altera o DRE, o Balancete nem o Diário.
                </p>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={() => setShowModalTransf(false)} className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl cursor-pointer">
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={salvandoTransf}
                    className="px-6 py-2.5 bg-sky-700 text-white font-bold text-sm rounded-xl shadow cursor-pointer disabled:opacity-60"
                  >
                    {salvandoTransf ? 'Salvando…' : 'Registrar Transferência'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE RECIBO */}
      {showModalRecibo && lancamentoParaRecibo && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4 no-print">
              <h3 className="text-lg font-black text-blue-900">Visualizar Comprovante / Recibo</h3>
              <button
                type="button"
                onClick={() => setShowModalRecibo(false)}
                className="px-3 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 font-bold text-xs rounded-xl"
              >
                ✕ Fechar
              </button>
            </div>

            <div className="receipt-print border-2 border-dashed border-slate-300 p-6 rounded-2xl bg-white space-y-6 text-slate-800">
              <div className="text-center space-y-1 border-b pb-4">
                <h2 className="text-xl font-black text-blue-900 uppercase">
                  Comprovante de {lancamentoParaRecibo.tipo === 'receita' ? 'Recebimento' : 'Pagamento'}
                </h2>
                <p className="text-xs text-slate-500">Igreja ID: {codigoIgreja}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <span className="text-slate-400 block uppercase">Data do Lançamento:</span>
                  <span className="text-sm font-bold">{lancamentoParaRecibo.data_lancamento?.split('-').reverse().join('/')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase">Valor:</span>
                  <span className={`text-lg font-black ${lancamentoParaRecibo.tipo === 'receita' ? 'text-emerald-700' : 'text-rose-700'}`}>
                    R$ {Number(lancamentoParaRecibo.valor).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="text-xs space-y-2">
                <div>
                  <span className="text-slate-400 block uppercase">Histórico / Descrição:</span>
                  <p className="text-sm font-bold text-slate-800 bg-slate-50 p-3 rounded-xl border">
                    {lancamentoParaRecibo.descricao}
                  </p>
                </div>

                {lancamentoParaRecibo.membro_id && (
                  <div>
                    <span className="text-slate-400 block uppercase">Contribuinte / Membro:</span>
                    <p className="text-sm font-bold text-blue-900">
                      {getNomeMembroVinculado(lancamentoParaRecibo.membro_id)}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-12 flex justify-between items-center text-center text-xs border-t">
                <div className="w-1/2">
                  <div className="border-t border-slate-400 w-48 mx-auto mb-1"></div>
                  <p className="font-semibold text-slate-600">Tesouraria / Administração</p>
                </div>
                <div className="w-1/2">
                  <div className="border-t border-slate-400 w-48 mx-auto mb-1"></div>
                  <p className="font-semibold text-slate-600">Assinatura do Contribuinte</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
              >
                🖨️ Imprimir Comprovante (Meia Folha A4)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONTA ADM */}
      {showModalAdm && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-8 space-y-4">
            <h3 className="text-xl font-black text-blue-900">
              {editingAdm ? 'Editar Conta Adm' : 'Nova Conta Adm'}
            </h3>

            <form onSubmit={handleSubmitAdm} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo / Descrição (Código da Conta) *</label>
                <input
                  type="text"
                  value={formAdm.codigo_conta}
                  onChange={(e) => setFormAdm({ ...formAdm, codigo_conta: e.target.value })}
                  placeholder="Ex: Caixa Geral, Conta Bancária"
                  className="w-full border rounded-xl px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome / Banco *</label>
                <input
                  type="text"
                  value={formAdm.nome_conta}
                  onChange={(e) => setFormAdm({ ...formAdm, nome_conta: e.target.value })}
                  placeholder="Ex: CAIXA, BANCO SICOOB CREDIVALE"
                  className="w-full border rounded-xl px-3 py-2 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Agência</label>
                  <input
                    type="text"
                    value={formAdm.agencia}
                    onChange={(e) => setFormAdm({ ...formAdm, agencia: e.target.value })}
                    placeholder="0000"
                    className="w-full border rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Número da Conta</label>
                  <input
                    type="text"
                    value={formAdm.numero_conta}
                    onChange={(e) => setFormAdm({ ...formAdm, numero_conta: e.target.value })}
                    placeholder="00000-0"
                    className="w-full border rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="pt-2 border-t">
                <label className="block text-xs font-bold text-rose-700 mb-1">Senha do Administrador para Salvar *</label>
                <input
                  type="password"
                  value={senhaExclusao}
                  onChange={(e) => setSenhaExclusao(e.target.value)}
                  placeholder="Sua senha atual"
                  className="w-full border border-rose-300 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModalAdm(false); setEditingAdm(null); }}
                  className="px-4 py-2 bg-slate-100 text-sm font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 text-white text-sm font-bold rounded-xl cursor-pointer shadow"
                >
                  {editingAdm ? 'Salvar Alterações' : 'Cadastrar Conta Adm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE PLANO DE CONTAS */}
      {showModalConta && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-8 space-y-4">
            <h3 className="text-xl font-black text-blue-900">
              {editingConta ? 'Editar Conta Contábil' : 'Nova Conta Contábil'}
            </h3>

            <form onSubmit={handleSubmitConta} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Código da Conta *</label>
                <input
                  type="text"
                  value={formConta.codigo_conta}
                  onChange={(e) => setFormConta({ ...formConta, codigo_conta: e.target.value })}
                  placeholder="Ex: 3.1.01.01"
                  className="w-full border rounded-xl px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome da Conta *</label>
                <input
                  type="text"
                  value={formConta.nome_conta}
                  onChange={(e) => setFormConta({ ...formConta, nome_conta: e.target.value })}
                  placeholder="Ex: Dízimos Recebidos"
                  className="w-full border rounded-xl px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Natureza *</label>
                <select
                  value={formConta.tipo_natureza}
                  onChange={(e) => setFormConta({ ...formConta, tipo_natureza: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 text-sm bg-white"
                  required
                >
                  <option value="Receita">Receita</option>
                  <option value="Despesa">Despesa</option>
                  <option value="Ativo">Ativo</option>
                  <option value="Passivo">Passivo</option>
                </select>
              </div>

              <div className="pt-2 border-t">
                <label className="block text-xs font-bold text-rose-700 mb-1">Senha do Administrador para Salvar *</label>
                <input
                  type="password"
                  value={senhaExclusao}
                  onChange={(e) => setSenhaExclusao(e.target.value)}
                  placeholder="Sua senha atual"
                  className="w-full border border-rose-300 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModalConta(false); setEditingConta(null); }}
                  className="px-4 py-2 bg-slate-100 text-sm font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 text-white text-sm font-bold rounded-xl cursor-pointer shadow"
                >
                  {editingConta ? 'Salvar Alterações' : 'Cadastrar Conta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EXCLUSÃO */}
      {showDeleteModal && itemParaExcluir && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-8 space-y-4">
            <h3 className="text-xl font-black text-rose-700">Confirmar Exclusão</h3>
            <p className="text-sm text-slate-600">
              Você vai excluir <strong className="text-slate-800">{itemParaExcluir.nome}</strong>. Digite sua senha para confirmar:
            </p>
            <form onSubmit={confirmarExclusao} className="space-y-4">
              <input
                type="password"
                value={senhaExclusao}
                onChange={(e) => setSenhaExclusao(e.target.value)}
                placeholder="Sua senha atual"
                className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-500"
                required
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-slate-100 text-sm font-bold rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-rose-600 text-white text-sm font-bold rounded-xl cursor-pointer">Confirmar Exclusão</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
