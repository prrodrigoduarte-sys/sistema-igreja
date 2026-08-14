import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase'; 

interface AgendaViewProps {
codigoIgreja: string;
} 

export default function AgendaView({ codigoIgreja }: AgendaViewProps) {
const [compromissos, setCompromissos] = useState<any[]>([]);
const [loading, setLoading] = useState(true); 

const fetchAgenda = async () => {
setLoading(true);
try {
const { data, error } = await supabase
.from('agenda_compromissos')
.select('*')
.eq('codigo_igreja', codigoIgreja)
.order('data_compromisso', { ascending: true }); 

if (error) throw error;
setCompromissos(data || []);
} catch (err) {
console.error("Erro ao carregar agenda:", err);
} finally {
setLoading(false);
}
}; 

useEffect(() => {
if (codigoIgreja) fetchAgenda();
}, [codigoIgreja]); 

return ( 

);
}