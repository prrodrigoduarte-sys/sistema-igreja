import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';

interface FinanceiroViewProps {
  codigoIgreja: string;
}

export default function FinanceiroView({ codigoIgreja }: FinanceiroViewProps) {
  const [contas, setContas] = useState<any[]>([]);
  const [lancamentos, setLancamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFinanceiro = async () => {
    setLoading(true);
    
    const { data: contasData } = await supabase
      .from('contas_financeiras')
      .select('*')
      .eq('codigo_igreja', codigoIgreja);

    setContas(contasData || []);

    const { data: lancsData } = await supabase
      .from('lancamentos_financeiros')
      .select('*')
      .eq('codigo_igreja', codigoIgreja)
      .order('data_lancamento', { ascending: false });

    setLancamentos(lancsData || []);
    setLoading(false);
  };

  useEffect(() => {
    if (codigoIgreja) {
      fetchFinanceiro();
    }
  }, [codigoIgreja]);

  const getSaldosProcessados = () => {
    const saldos: { [key: string]: number } = {};
    contas.forEach((c) => {
      saldos[c.codigo_conta] = parseFloat(c.saldo_inicial) || 0;
    });
    lancamentos.forEach((l) => {
      const v = parseFloat(l.valor) || 0;
      if (l.tipo === 'entrada') {
        saldos[l.codigo_conta] = (saldos[l.codigo_conta] || 0) + v;
      } else if (l.tipo === 'saida') {
        saldos[l.codigo_conta] = (saldos[l.codigo_conta] || 0) - v;
      }
    });
    const saldoTotalConsolidado = Object.values(saldos).reduce((acc, curr) => acc + curr, 0);
    return { saldos, saldoTotalConsolidado };
  };

  const { saldos, saldoTotalConsolidado } = getSaldosProcessados();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white p-5 rounded-2xl shadow-md">
          <p className="text-xs font-bold text-blue-200 uppercase">Saldo Consolidado</p>
          <h3 className="text-2xl font-black mt-1">R$ {saldoTotalConsolidado.toFixed(2)}</h3>
        </div>
        {contas.map((c) => {
          const s = saldos[c.codigo_conta] || 0;
          return (
            <div key={c.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">Conta: {c.codigo_conta}</span>
              <h4 className="text-sm font-bold text-slate-800 mt-1">{c.nome_conta}</h4>
              <p className={`text-xl font-bold mt-3 ${s >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>R$ {s.toFixed(2)}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Módulo Financeiro</h2>
            <p className="text-xs text-slate-500">Histórico de entradas e saídas</p>
          </div>
        </div>

        {loading ? (
          <p className="text-center py-6 text-slate-500">Carregando financeiro...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-slate-600 text-xs font-bold uppercase">
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Conta</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs text-slate-700">
                {lancamentos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">Nenhum lançamento encontrado.</td>
                  </tr>
                ) : (
                  lancamentos.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono">{l.data_lancamento}</td>
                      <td className="py-3 px-4 font-bold">{l.codigo_conta}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 font-bold rounded-full text-[10px] uppercase ${l.tipo === 'entrada' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{l.tipo}</span>
                      </td>
                      <td className="py-3 px-4">{l.categoria}</td>
                      <td className="py-3 px-4">{l.descricao}</td>
                      <td className={`py-3 px-4 text-right font-bold text-sm ${l.tipo === 'entrada' ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {l.tipo === 'entrada' ? '+' : '-'} R$ {parseFloat(l.valor).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}