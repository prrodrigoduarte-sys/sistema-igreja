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
const { data: contasData, error: errorContas } = await supabase
.from('contas_financeiras')
.select('*')
.eq('codigo_igreja', codigoIgreja); 

if (errorContas) throw errorContas;
setContas(contasData || []);

const { data: lancsData, error: errorLancs } = await supabase
  .from('lancamentos_financeiros')
  .select('*')
  .eq('codigo_igreja', codigoIgreja)
  .order('data_lancamento', { ascending: false });

if (errorLancs) throw errorLancs;
setLancamentos(lancsData || []);

} catch (err) {
console.error("Erro ao carregar dados financeiros do Supabase:", err);
} finally {
setLoading(false);
}
}

if (codigoIgreja) {
carregarDados();
}

}, [codigoIgreja]); 

return ( 

);
}