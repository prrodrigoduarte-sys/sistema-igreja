// src/ControleRegistroModule.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

interface LogSistema {
  id: string;
  codigo_igreja: string;
  usuario_email: string;
  acao: string;
  detalhes: string;
  ip_maquina?: string;
  created_at: string;
}

interface ControleRegistroProps {
  loggedUser: any;
}

export default function ControleRegistroModule({ loggedUser }: ControleRegistroProps) {
  const [autenticado, setAutenticado] = useState(false);
  const [senhaAdmin, setSenhaAdmin] = useState('');
  const [logs, setLogs] = useState<LogSistema[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const codigoIgreja = loggedUser?.codigo_igreja || loggedUser?.igrejas?.codigo_igreja || 'IGR-001';
  const emailUsuario = loggedUser?.usuario || loggedUser?.email;

  const verificarSenhaAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: emailUsuario,
        password: senhaAdmin,
      });

      if (authError) {
        alert('Senha de administrador incorreta!');
        setLoading(false);
        return;
      }

      setAutenticado(true);
      fetchLogs();
    } catch (err: any) {
      alert('Erro ao autenticar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: erroConsulta } = await supabase
        .from('logs_sistema')
        .select('*')
        .eq('codigo_igreja', codigoIgreja)
        .order('created_at', { ascending: false });

      if (erroConsulta) throw erroConsulta;
      setLogs(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar logs:', err);
      setError(err.message || 'Erro ao carregar registros.');
    } finally {
      setLoading(false);
    }
  }, [codigoIgreja]);

  useEffect(() => {
    if (autenticado) {
      fetchLogs();
    }
  }, [autenticado, fetchLogs]);

  // Se não estiver autenticado com a senha do admin, mostra a tela de bloqueio
  if (!autenticado) {
    return (
      <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-slate-200 w-full max-w-md mx-auto my-12 space-y-6 text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-900 rounded-2xl mx-auto flex items-center justify-center text-2xl font-black">
          🔒
        </div>
        <div>
          <h2 className="text-2xl font-black text-blue-900 tracking-tight">Controle de Registro</h2>
          <p className="text-xs text-slate-500 mt-1">Área restrita de auditoria do sistema. Digite sua senha de administrador para continuar.</p>
        </div>

        <form onSubmit={verificarSenhaAdmin} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Senha do Administrador *</label>
            <input
              type="password"
              value={senhaAdmin}
              onChange={(e) => setSenhaAdmin(e.target.value)}
              placeholder="Digite sua senha atual"
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer"
          >
            {loading ? 'Verificando...' : 'Acessar Registros'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 w-full max-w-6xl mx-auto space-y-6">
      
      {/* Estilo CSS para Impressão */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-logs, .printable-logs * {
            visibility: visible;
          }
          .printable-logs {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4 no-print">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-blue-900 tracking-tight">
            Controle de Registro (Auditoria)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Histórico analítico de acessos e alterações no sistema ({codigoIgreja})
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-2"
        >
          🖨️ Imprimir / Salvar PDF
        </button>
      </div>

      {loading && <p className="text-center py-6 text-slate-500">Carregando registros de auditoria...</p>}
      {error && <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">{error}</div>}

      {/* ÁREA IMPRESSÍVEL */}
      {!loading && !error && (
        <div className="printable-logs space-y-4">
          <div className="hidden print:block pb-4 border-b">
            <h2 className="text-xl font-black text-blue-900">Relatório de Controle de Registro (Logs)</h2>
            <p className="text-xs text-slate-500">Igreja ID: {codigoIgreja} | Emitido em: {new Date().toLocaleString('pt-BR')}</p>
          </div>

          {logs.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <p className="text-slate-500 text-sm">Nenhum registro de log encontrado no sistema.</p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-xl border">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-slate-100 text-slate-700 text-xs font-bold uppercase">
                    <th className="p-3">Data / Hora</th>
                    <th className="p-3">Usuário</th>
                    <th className="p-3">Ação</th>
                    <th className="p-3">Detalhes</th>
                    <th className="p-3">IP da Máquina</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs sm:text-sm">
                  {logs.map((log) => {
                    const dataFormatada = log.created_at
                      ? new Date(log.created_at).toLocaleString('pt-BR')
                      : '-';

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 whitespace-nowrap text-slate-600 font-medium">{dataFormatada}</td>
                        <td className="p-3 font-semibold text-slate-800">{log.usuario_email}</td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-900 border">
                            {log.acao}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">{log.detalhes}</td>
                        <td className="p-3 text-slate-500 font-mono text-xs">{log.ip_maquina || '127.0.0.1'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}