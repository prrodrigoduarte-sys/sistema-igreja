// src/logger.ts
import { supabase } from './supabase';

export async function registrarLog(
  codigoIgreja: string,
  usuarioEmail: string,
  acao: string,
  detalhes: string
) {
  try {
    await supabase.from('logs_sistema').insert([
      {
        codigo_igreja: codigoIgreja,
        usuario_email: usuarioEmail,
        acao,
        detalhes,
      },
    ]);
  } catch (err) {
    console.error('Erro ao registrar log:', err);
  }
}