import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';

interface FinanceiroViewProps {
  codigoIgreja: string;
}

export default function FinanceiroView({ codigoIgreja }: FinanceiroViewProps) {
  const [contas, setContas] = useState<any[]>([]);
  const [lancamentos, setLancamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    // Busca Contas
    const { data: contasData } = await supabase.from('contas_financeiras').select('*').eq('codigo_igreja', codigoIgreja);
    setContas(contasData || []);

    // Busca Lançamentos
    const { data: lancsData } = await supabase
      .from('lancamentos_financeiros')
      .select('*')
      .eq('codigo_igreja', codigoIgreja)
      .order('data_lancamento', { ascending: false });
    setLancamentos(lancsData || []);
    setLoading(false);
  };

  useEffect(() => {
    if (codigoIgreja) fetchData();
  }, [codigoIgreja]);

  // Cálculo de Saldos
  const getSaldos = () => {
    const saldos: { [key: string]: number } = {};
    contas.forEach((c) => (saldos[c.codigo_conta] = parseFloat(c.saldo_inicial) || 0));
    lancamentos.forEach((l) => {
      const v = parseFloat(l.valor) || 0;
      if (l.tipo === 'entrada') saldos[l.codigo_conta] = (saldos[l.codigo_conta] || 0) + v;
      else if (l.tipo === 'saida') saldos[l.codigo_conta] = (saldos[l.codigo_conta] || 0) - v;
    });
    const total = Object.values(saldos).reduce((acc, curr) => acc + curr, 0);
    return { saldos, total };
  };

  const { saldos, total } = getSaldos();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white p-5 rounded-2xl shadow-md">
          <p className="text-xs font-bold text-blue-200 uppercase">Saldo Consolidado</p>
          <h3 className="text-2xl font-black mt-1">R$ {total.toFixed(2)}</h3>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold mb-4">Lançamentos Recentes</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-600 text-xs uppercase border-b">
              <th className="py-2">Data</th>
              <th className="py-2">Descrição</th>
              <th className="py-2 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {lancamentos.map((l) => (
              <tr key={l.id}>
                <td className="py-3 font-mono">{l.data_lancamento}</td>
                <td className="py-3">{l.descricao}</td>
                <td className={`py-3 text-right font-bold ${l.tipo === 'entrada' ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {l.tipo === 'entrada' ? '+' : '-'} R$ {parseFloat(l.valor).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}