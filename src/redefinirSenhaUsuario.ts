// Chamada do app para a Edge Function "admin-redefinir-senha". Só funciona para o administrador CHEFE
// (o servidor confere; esconder o campo na tela é só conforto).
import { supabase } from './supabase';

export async function redefinirSenhaUsuario(emailAlvo: string, novaSenha: string): Promise<{ ok: boolean; erro?: string }> {
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
  return data?.ok ? { ok: true } : { ok: false, erro: data?.erro || 'Não foi possível alterar a senha.' };
}

// A tela chama isto ao abrir: só mostra o campo "Nova senha" se voltar true.
export async function souAdmChefe(): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('admin-redefinir-senha', { body: { acao: 'verificar' } });
    return !error && !!data?.chefe;
  } catch {
    return false;
  }
}
