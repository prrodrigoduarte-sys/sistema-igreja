// Edge Function: só o ADMINISTRADOR CHEFE define uma nova senha para outro usuário da MESMA igreja.
// "Chefe" = e-mail listado no segredo ADM_CHEFE_EMAILS (separado por vírgula). É um segredo do servidor de propósito:
// se fosse uma coluna na tabela, qualquer um poderia se marcar como chefe, já que as regras do banco estão abertas.
//
// Configurar:  supabase secrets set ADM_CHEFE_EMAILS="prrodrigoduarte@gmail.com"
//   (mais de um chefe: separe por vírgula. Depois de trocar o segredo, não precisa publicar de novo.)
// Roda no servidor porque trocar a senha de outra pessoa exige a chave "service_role", que nunca pode ir para o navegador.
//
// Publicar:  supabase functions deploy admin-redefinir-senha
// (SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY já existem por padrão nas Edge Functions.)
//
// PREMISSAS sobre o seu banco (confira): tabela "usuarios" com as colunas email, perfil ('admin'|'administrador')
// e codigo_igreja; e login pelo Supabase Auth usando esse mesmo e-mail.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const responder = (corpo: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return responder({ erro: 'Método não permitido.' }, 405);

  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // 1) Quem está chamando? (valida o token de login enviado pelo app)
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    if (!token) return responder({ erro: 'Não autenticado.' }, 401);
    const { data: quem, error: erroQuem } = await admin.auth.getUser(token);
    if (erroQuem || !quem?.user?.email) return responder({ erro: 'Sessão inválida. Entre novamente.' }, 401);
    const emailAdmin = quem.user.email.toLowerCase();

    // 2) Quem chama precisa ser o administrador CHEFE (e continuar sendo administrador na tabela)
    const chefes = (Deno.env.get('ADM_CHEFE_EMAILS') || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const { data: chamador } = await admin
      .from('usuarios')
      .select('email, perfil, codigo_igreja')
      .ilike('email', emailAdmin)
      .maybeSingle();
    const ehAdmin = chamador && ['admin', 'administrador'].includes(String(chamador.perfil || '').toLowerCase());
    const ehChefe = !!ehAdmin && chefes.includes(emailAdmin);

    // 3) Dados enviados
    const { acao, email_alvo, nova_senha } = await req.json();

    // A tela usa isto para decidir se mostra o campo de senha
    if (acao === 'verificar') return responder({ chefe: ehChefe });

    if (!ehChefe) return responder({ erro: 'Só o administrador chefe pode redefinir senhas.' }, 403);
    const emailAlvo = String(email_alvo || '').trim().toLowerCase();
    const senha = String(nova_senha || '');
    if (!emailAlvo) return responder({ erro: 'Informe o usuário.' }, 400);
    if (senha.length < 8) return responder({ erro: 'A senha precisa ter pelo menos 8 caracteres.' }, 400);
    if (senha.length > 72) return responder({ erro: 'A senha pode ter no máximo 72 caracteres.' }, 400);

    // 4) O alvo precisa ser da MESMA igreja do administrador (multiempresa)
    const { data: alvo } = await admin
      .from('usuarios')
      .select('email, codigo_igreja')
      .ilike('email', emailAlvo)
      .maybeSingle();
    if (!alvo) return responder({ erro: 'Usuário não encontrado.' }, 404);
    if (alvo.codigo_igreja !== chamador!.codigo_igreja) return responder({ erro: 'Este usuário é de outra igreja.' }, 403);

    // 5) Localiza o usuário no Supabase Auth pelo e-mail e troca a senha
    let idAuth: string | null = null;
    for (let pagina = 1; pagina <= 20 && !idAuth; pagina++) {
      const { data: lista, error } = await admin.auth.admin.listUsers({ page: pagina, perPage: 1000 });
      if (error) throw error;
      idAuth = lista.users.find((u) => (u.email || '').toLowerCase() === emailAlvo)?.id ?? null;
      if (lista.users.length < 1000) break;
    }
    if (!idAuth) return responder({ erro: 'Este e-mail não tem login no sistema (Supabase Auth).' }, 404);

    const { error: erroTroca } = await admin.auth.admin.updateUserById(idAuth, { password: senha });
    if (erroTroca) return responder({ erro: erroTroca.message }, 400);

    // 6) Registro de auditoria (nunca grava a senha)
    await admin.from('logs_sistema').insert([
      {
        codigo_igreja: chamador!.codigo_igreja,
        usuario_email: emailAdmin,
        acao: 'REDEFINIR_SENHA_USUARIO',
        detalhes: `Administrador redefiniu a senha de ${emailAlvo}`,
      },
    ]);

    return responder({ ok: true });
  } catch (e) {
    return responder({ erro: (e as Error).message || 'Erro inesperado.' }, 500);
  }
});
