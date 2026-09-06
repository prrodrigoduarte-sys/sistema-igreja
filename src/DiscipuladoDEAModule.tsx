// src/DiscipuladoDEAModule.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

interface Membro {
  id: any;
  nome: string;
  celular_principal?: string;
}

interface EncontroDEA {
  id: number;
  data_encontro: string;
  hora_encontro: string;
  assunto_tratado: string;
  comentarios: string;
}

interface VinculoDEA {
  id: any;
  discipulador_id: any;
  discipulando_id: any;
  dia_reuniao?: string;
  status: string;
  encontros?: EncontroDEA[];
  discipulador?: Membro;
  discipulando?: Membro;
}

interface Props {
  loggedUser: any;
}

export default function DiscipuladoDEAModule({ loggedUser }: Props) {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [vinculos, setVinculos] = useState<VinculoDEA[]>([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');

  // Modais
  const [modalNovoVinculo, setModalNovoVinculo] = useState(false);
  const [modalEncontros, setModalEncontros] = useState(false);

  // Form Vínculo
  const [discipuladorId, setDiscipuladorId] = useState('');
  const [discipulandoId, setDiscipulandoId] = useState('');
  const [diaReuniao, setDiaReuniao] = useState('Segunda-feira');

  // Encontros
  const [selectedVinculo, setSelectedVinculo] = useState<VinculoDEA | null>(null);
  const [listaEncontros, setListaEncontros] = useState<EncontroDEA[]>([]);
  const [novaData, setNovaData] = useState(new Date().toISOString().split('T')[0]);
  const [novaHora, setNovaHora] = useState('19:30');
  const [novoAssunto, setNovoAssunto] = useState('');
  const [novoComentario, setNovoComentario] = useState('');

  const codigoIgreja = loggedUser?.codigo_igreja || 'IGR-001';

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const { data: dataMembros } = await supabase
        .from('members')
        .select('id, nome, celular_principal')
        .eq('codigo_igreja', codigoIgreja)
        .order('nome', { ascending: true });

      if (dataMembros) setMembros(dataMembros);

      const { data: dataDEA } = await supabase
        .from('discipulado_dea')
        .select('*')
        .eq('codigo_igreja', codigoIgreja)
        .order('id', { ascending: false });

      if (dataDEA && dataMembros) {
        const enriquecidos = dataDEA.map((v: any) => ({
          ...v,
          encontros: Array.isArray(v.encontros) ? v.encontros : [],
          discipulador: dataMembros.find((m) => String(m.id) === String(v.discipulador_id)),
          discipulando: dataMembros.find((m) => String(m.id) === String(v.discipulando_id)),
        }));
        setVinculos(enriquecidos);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [codigoIgreja]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleSalvarVinculo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discipuladorId || !discipulandoId) return alert('Selecione o Discipulador e o Discípulo.');
    if (discipuladorId === discipulandoId) return alert('O discipulador e o discípulo devem ser pessoas diferentes.');

    try {
      const { error } = await supabase.from('discipulado_dea').insert([
        {
          codigo_igreja: codigoIgreja,
          discipulador_id: discipuladorId,
          discipulando_id: discipulandoId,
          dia_reuniao: diaReuniao,
          status: 'Ativo',
          encontros: [],
        },
      ]);

      if (error) throw error;

      alert('🌱 Vínculo de discipulado criado!');
      setModalNovoVinculo(false);
      setDiscipuladorId('');
      setDiscipulandoId('');
      carregarDados();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const abrirModalEncontros = (v: VinculoDEA) => {
    setSelectedVinculo(v);
    setListaEncontros(v.encontros || []);
    setNovoAssunto('');
    setNovoComentario('');
    setModalEncontros(true);
  };

  const handleAdicionarProximoEncontro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVinculo || !novoAssunto.trim()) return alert('Informe o assunto tratado.');

    const novoItem: EncontroDEA = {
      id: Date.now(),
      data_encontro: novaData,
      hora_encontro: novaHora,
      assunto_tratado: novoAssunto.trim(),
      comentarios: novoComentario.trim(),
    };

    const novaLista = [novoItem, ...listaEncontros];

    try {
      const { error } = await supabase
        .from('discipulado_dea')
        .update({ encontros: novaLista })
        .eq('id', selectedVinculo.id);

      if (error) throw error;

      setListaEncontros(novaLista);
      setNovoAssunto('');
      setNovoComentario('');
      carregarDados();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExcluirEncontro = async (idEncontro: number) => {
    if (!selectedVinculo || !window.confirm('Excluir este encontro?')) return;
    const novaLista = listaEncontros.filter((e) => e.id !== idEncontro);

    try {
      await supabase.from('discipulado_dea').update({ encontros: novaLista }).eq('id', selectedVinculo.id);
      setListaEncontros(novaLista);
      carregarDados();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExcluirVinculo = async (id: any) => {
    if (!window.confirm('Excluir este vínculo de discipulado?')) return;
    try {
      await supabase.from('discipulado_dea').delete().eq('id', id);
      carregarDados();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtrados = vinculos.filter(
    (v) =>
      (v.discipulador?.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
      (v.discipulando?.nome || '').toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-6xl mx-auto space-y-6">
      {/* TÍTULO EXCLUSIVO DO DISCIPULADO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-3xl font-black text-blue-900 tracking-tight">🌱 D.E.A. / G.U.I.</h2>
          <p className="text-sm text-slate-600 mt-1">
            D.E.A. (Discipulado Evangelístico Apostólico) / G.U.I. (Gerando uma Identidade)
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalNovoVinculo(true)}
          className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
        >
          ➕ Novo Discipulado (Líder ➔ Discípulo)
        </button>
      </div>

      <input
        type="text"
        placeholder="🔎 Buscar por líder ou discípulo..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="w-full sm:w-72 border rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-600"
      />

      {loading ? (
        <p className="text-center py-6 text-slate-500 text-xs">Carregando discipulados...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map((v) => (
            <div key={v.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-[10px] font-black uppercase text-blue-900 bg-blue-100 px-2 py-0.5 rounded-md">
                    📅 {v.dia_reuniao || 'Encontro Regular'}
                  </span>
                  <button type="button" onClick={() => handleExcluirVinculo(v.id)} className="text-rose-600 font-bold text-xs cursor-pointer">
                    🗑️
                  </button>
                </div>

                <div className="space-y-1 text-xs">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Discipulador (Mestre)</span>
                    <p className="font-bold text-blue-900 text-sm">{v.discipulador?.nome || 'Não encontrado'}</p>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Discípulo</span>
                    <p className="font-bold text-emerald-800 text-sm">{v.discipulando?.nome || 'Não encontrado'}</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => abrirModalEncontros(v)}
                className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow cursor-pointer mt-2"
              >
                📖 Ver & Registrar Encontros ({(v.encontros || []).length})
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MODAL NOVO VÍNCULO */}
      {modalNovoVinculo && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-blue-900">Novo Vínculo de Discipulado</h3>
              <button type="button" onClick={() => setModalNovoVinculo(false)} className="text-xs font-bold text-slate-500">✕</button>
            </div>

            <form onSubmit={handleSalvarVinculo} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">1. Discipulador (Líder / Mestre)</label>
                <select value={discipuladorId} onChange={(e) => setDiscipuladorId(e.target.value)} className="w-full border rounded-xl p-2.5" required>
                  <option value="">Selecione...</option>
                  {membros.map((m) => (<option key={m.id} value={m.id}>👤 {m.nome}</option>))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">2. Discípulo</label>
                <select value={discipulandoId} onChange={(e) => setDiscipulandoId(e.target.value)} className="w-full border rounded-xl p-2.5" required>
                  <option value="">Selecione...</option>
                  {membros.map((m) => (<option key={m.id} value={m.id}>🌱 {m.nome}</option>))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Dia Regular do Encontro</label>
                <select value={diaReuniao} onChange={(e) => setDiaReuniao(e.target.value)} className="w-full border rounded-xl p-2.5">
                  <option value="Segunda-feira">Segunda-feira</option>
                  <option value="Terça-feira">Terça-feira</option>
                  <option value="Quarta-feira">Quarta-feira</option>
                  <option value="Quinta-feira">Quinta-feira</option>
                  <option value="Sexta-feira">Sexta-feira</option>
                  <option value="Sábado">Sábado</option>
                  <option value="Domingo">Domingo</option>
                </select>
              </div>

              <button type="submit" className="w-full py-3 bg-blue-900 text-white font-bold rounded-xl">⚡ Salvar Discipulado</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRO DE ENCONTROS */}
      {modalEncontros && selectedVinculo && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-blue-900">Encontros de Discipulado</h3>
              <button type="button" onClick={() => setModalEncontros(false)} className="text-xs font-bold text-slate-500">✕ Fechar</button>
            </div>

            <form onSubmit={handleAdicionarProximoEncontro} className="bg-slate-50 p-4 rounded-2xl space-y-2 text-xs border">
              <h4 className="font-bold text-blue-900 uppercase">➕ Registrar Próximo Encontro</h4>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={novaData} onChange={(e) => setNovaData(e.target.value)} className="border rounded-xl p-2" required />
                <input type="time" value={novaHora} onChange={(e) => setNovaHora(e.target.value)} className="border rounded-xl p-2" required />
              </div>
              <input type="text" placeholder="Assunto tratado / Lição..." value={novoAssunto} onChange={(e) => setNovoAssunto(e.target.value)} className="w-full border rounded-xl p-2" required />
              <textarea placeholder="Comentários / Pedidos de oração..." value={novoComentario} onChange={(e) => setNovoComentario(e.target.value)} className="w-full border rounded-xl p-2" rows={2} />
              <button type="submit" className="w-full py-2 bg-blue-900 text-white font-bold rounded-xl">⚡ Salvar Encontro</button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {listaEncontros.map((item, idx) => (
                <div key={item.id} className="bg-white border p-3 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between items-center border-b pb-1 font-bold text-blue-900">
                    <span>#{listaEncontros.length - idx} • {item.data_encontro?.split('-').reverse().join('/')} às {item.hora_encontro}</span>
                    <button type="button" onClick={() => handleExcluirEncontro(item.id)} className="text-rose-600">🗑️</button>
                  </div>
                  <p>📘 <strong>Tratado:</strong> {item.assunto_tratado}</p>
                  {item.comentarios && <p className="text-slate-500 bg-slate-50 p-2 rounded-lg">💬 {item.comentarios}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}