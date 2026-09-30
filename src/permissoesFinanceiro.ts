// Sub-permissões do Financeiro. Ficam na mesma tabela "permissoes_usuario" (uma linha por opção),
// marcadas na tela de Usuários e respeitadas no FinanceiroModule.
import { supabase } from './supabase';

export type ChaveFinanceiro = 'fin_lancar' | 'fin_transferir' | 'fin_ver' | 'fin_editar' | 'fin_agradecer' | 'fin_relatorios' | 'fin_contas';
export type PermissoesFinanceiro = Record<ChaveFinanceiro, boolean>;

export const SUBMODULOS_FINANCEIRO: { chave: ChaveFinanceiro; rotulo: string; descricao: string }[] = [
  { chave: 'fin_lancar', rotulo: '➕ Registrar lançamentos', descricao: 'Criar novas entradas e saídas' },
  { chave: 'fin_transferir', rotulo: '🔁 Transferir entre contas', descricao: 'Mover saldo de uma conta para outra (Caixa ↔ Banco)' },
  { chave: 'fin_ver', rotulo: '👁️ Ver lançamentos e recibos', descricao: 'Lista de lançamentos e impressão de recibo' },
  { chave: 'fin_editar', rotulo: '✏️ Editar e excluir lançamentos', descricao: 'Pede a senha de quem está logado' },
  { chave: 'fin_agradecer', rotulo: '💬 Agradecer no chat', descricao: 'Mensagem de agradecimento por dízimo/oferta' },
  { chave: 'fin_relatorios', rotulo: '📈 Relatórios', descricao: 'Extrato, Diário, Balancete e DRE' },
  { chave: 'fin_contas', rotulo: '🏦 Contas e Plano de Contas', descricao: 'Cadastrar, editar e excluir contas' },
];

export const FINANCEIRO_TOTAL: PermissoesFinanceiro = {
  fin_lancar: true,
  fin_transferir: true,
  fin_ver: true,
  fin_editar: true,
  fin_agradecer: true,
  fin_relatorios: true,
  fin_contas: true,
};

export const FINANCEIRO_SOMENTE_LANCAMENTO: PermissoesFinanceiro = {
  fin_lancar: true,
  fin_transferir: false,
  fin_ver: false,
  fin_editar: false,
  fin_agradecer: false,
  fin_relatorios: false,
  fin_contas: false,
};

// Para quem tem "Financeiro" liberado mas ainda não teve as sub-opções configuradas
export const FINANCEIRO_PADRAO: PermissoesFinanceiro = {
  fin_lancar: true,
  fin_transferir: true, // hoje quem lança também transfere; restrinja na tela de Usuários quando quiser
  fin_ver: true,
  fin_editar: false,
  fin_agradecer: true,
  fin_relatorios: true,
  fin_contas: false,
};

export const CHAVES_FINANCEIRO = SUBMODULOS_FINANCEIRO.map((s) => s.chave);

// Lê as sub-permissões do usuário logado. Administrador pode tudo.
export async function carregarPermissoesFinanceiro(usuarioId: any, ehAdmin: boolean): Promise<PermissoesFinanceiro> {
  if (ehAdmin) return { ...FINANCEIRO_TOTAL };
  if (!usuarioId) return { ...FINANCEIRO_PADRAO };

  const { data, error } = await supabase
    .from('permissoes_usuario')
    .select('modulo, permitido')
    .eq('usuario_id', usuarioId)
    .in('modulo', CHAVES_FINANCEIRO);

  if (error || !data || data.length === 0) return { ...FINANCEIRO_PADRAO };

  const perms: PermissoesFinanceiro = { ...FINANCEIRO_SOMENTE_LANCAMENTO, fin_lancar: false };
  data.forEach((p: any) => {
    if (CHAVES_FINANCEIRO.includes(p.modulo)) perms[p.modulo as ChaveFinanceiro] = !!p.permitido;
  });

  // Usuário configurado antes de existir "Transferir": herda o que ele já podia (quem lança, transfere)
  // até o administrador marcar ou desmarcar a opção na tela de Usuários.
  if (!data.some((p: any) => p.modulo === 'fin_transferir')) perms.fin_transferir = perms.fin_lancar;

  return perms;
}
