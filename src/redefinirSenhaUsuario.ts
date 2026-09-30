// Chamada do app para a Edge Function "admin-redefinir-senha". Só funciona para o administrador CHEFE
// (o servidor confere; esconder o campo na tela é só conforto).
import { supabase } from './supabase';

export async function redefinirSenhaUsuario(emailAlvo: string, novaSenha: string): Promise<{ ok: boolean; erro?: string; criado?: boolean }> {
  const { data, error } = await supabase.functions.invoke('admin-redefinir-senha', {
    body: { email_alvo: emailAlvo, nova_senha: novaSenha },
  });
  if (error) {
    // quando a função responde 4xx, a mensagem útil vem no corpo
    try {
      const corpo = await (error as any).context?.json?.();
      if (corpo?.erro) return { ok: false, erro: corpo.erro };
    } catch {}
    return { ok: false, erro: error.message };
  }
  return data?.ok ? { ok: true, criado: !!data.criado } : { ok: false, erro: data?.erro || 'Não foi possível alterar a senha.' };
}

// A tela chama isto ao abrir: só mostra o campo "Nova senha" se chefe for true.
// "motivo" explica, em português, por que o campo não apareceu (útil para diagnosticar).
export async function verificarChefe(): Promise<{ chefe: boolean; motivo: string }> {
  try {
    let { data, error } = await supabase.functions.invoke('admin-redefinir-senha', { body: { acao: 'verificar' } });
    // Token vencido: renova a sessão e tenta mais uma vez antes de desistir
    if (error && (error as any).context?.status === 401) {
      await supabase.auth.refreshSession();
      ({ data, error } = await supabase.functions.invoke('admin-redefinir-senha', { body: { acao: 'verificar' } }));
    }
    if (!error) {
      if (data?.chefe) return { chefe: true, motivo: '' };
      return {
        chefe: false,
        motivo: 'A função respondeu que você não é o administrador chefe: confira se o seu e-mail de login está em ADM_CHEFE_EMAILS e se o seu perfil na tabela usuarios é "administrador".',
      };
    }
    const status = (error as any).context?.status;
    if (status === 404) return { chefe: false, motivo: 'A função admin-redefinir-senha não está publicada neste projeto do Supabase.' };
    if (status === 401) return { chefe: false, motivo: 'O Supabase não reconheceu a sua sessão de login (saia e entre de novo; se persistir, desligue "Verify JWT" na função). Se o login do sistema não usa o Supabase Auth, este recurso não consegue identificar você.' };
    return { chefe: false, motivo: `Não foi possível consultar a função (${status || error.message}).` };
  } catch (e: any) {
    return { chefe: false, motivo: `Falha ao consultar a função: ${e?.message || e}` };
  }
}

export async function souAdmChefe(): Promise<boolean> {
  return (await verificarChefe()).chefe;
}
