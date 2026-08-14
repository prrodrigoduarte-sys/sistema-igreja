import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';

interface FinanceiroViewProps {
  codigoIgreja: string;
}

export default function FinanceiroView({ codigoIgreja }: FinanceiroViewProps) {
  const [contas, setContas] = useState<any[]>([]);
  const [lancamentos, setLancamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarDados() {
      setLoading(true);
      try {
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
      } catch (err) {
        console.error("Erro ao carregar financeiro:", err);
      } finally {
        setLoading(false);
      }
    }

    if (codigoIgreja) {
      carregarDados();
    }
  }, [codigoIgreja]);

  return (
    <div className="space-y-6 p-4">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-black text-blue-900">Módulo Financeiro Ativo</h2>
        <p className="text-sm text-slate-500 mt-1">Igreja ID: {codigoIgreja}</p>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-2xl text-center shadow-sm">
          <p className="text-slate-600 font-bold">Carregando dados financeiros...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Contas Cadastradas ({contas.length})</h3>
            {contas.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhuma conta encontrada no banco.</p>
            ) : (
              <ul className="space-y-2">
                {contas.map((c) => (
                  <li key={c.id} className="p-3 bg-slate-50 rounded-xl border flex justify-between items-center">
                    <span className="font-bold text-sm text-slate-700">{c.nome_conta}</span>
                    <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">{c.codigo_conta}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Últimos Lançamentos ({lancamentos.length})</h3>
            {lancamentos.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhum lançamento encontrado.</p>
            ) : (
              <ul className="space-y-2">
                {lancamentos.slice(0, 5).map((l) => (
                  <li key={l.id} className="p-3 bg-slate-50 rounded-xl border flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-700">{l.descricao}</p>
                      <span className="text-slate-400">{l.data_lancamento}</span>
                    </div>
                    <span className={`font-bold text-sm ${l.tipo === 'entrada' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {l.tipo === 'entrada' ? '+' : '-'} R$ {parseFloat(l.valor || 0).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )import React, { useEffect, useState } from 'react';
  import { supabase } from '../supabase';
  
  interface FinanceiroViewProps {
    codigoIgreja: string;
  }
  
  export default function FinanceiroView({ codigoIgreja }: FinanceiroViewProps) {
    const [contas, setContas] = useState<any[]>([]);
    const [lancamentos, setLancamentos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      async function carregarDados() {
        setLoading(true);
        try {
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
        } catch (err) {
          console.error("Erro ao carregar financeiro:", err);
        } finally {
          setLoading(false);
        }
      }
  
      if (codigoIgreja) {
        carregarDados();
      }
    }, [codigoIgreja]);
  
    return (
      <div className="space-y-6 p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-2xl font-black text-blue-900">Módulo Financeiro Ativo</h2>
          <p className="text-sm text-slate-500 mt-1">Igreja ID: {codigoIgreja}</p>
        </div>
  
        {loading ? (
          <div className="bg-white p-12 rounded-2xl text-center shadow-sm">
            <p className="text-slate-600 font-bold">Carregando dados financeiros...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Contas Cadastradas ({contas.length})</h3>
              {contas.length === 0 ? (
                <p className="text-sm text-slate-400">Nenhuma conta encontrada no banco.</p>
              ) : (
                <ul className="space-y-2">
                  {contas.map((c) => (
                    <li key={c.id} className="p-3 bg-slate-50 rounded-xl border flex justify-between items-center">
                      <span className="font-bold text-sm text-slate-700">{c.nome_conta}</span>
                      <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">{c.codigo_conta}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
  
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Últimos Lançamentos ({lancamentos.length})</h3>
              {lancamentos.length === 0 ? (
                <p className="text-sm text-slate-400">Nenhum lançamento encontrado.</p>
              ) : (
                <ul className="space-y-2">
                  {lancamentos.slice(0, 5).map((l) => (
                    <li key={l.id} className="p-3 bg-slate-50 rounded-xl border flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-700">{l.descricao}</p>
                        <span className="text-slate-400">{l.data_lancamento}</span>
                      </div>
                      <span className={`font-bold text-sm ${l.tipo === 'entrada' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {l.tipo === 'entrada' ? '+' : '-'} R$ {parseFloat(l.valor || 0).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }