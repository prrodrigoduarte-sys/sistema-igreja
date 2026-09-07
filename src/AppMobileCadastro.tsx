// src/AppMobileModule.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

interface Props {
  loggedUser: any;
}

export default function AppMobileModule({ loggedUser }: Props) {
  // Força a entrada direta na aba da Agenda para testar
  const [subAbaApp, setSubAbaApp] = useState<'perfil' | 'minha_agenda' | 'celula' | 'igreja'>('minha_agenda');

  // Estados gerais
  const [membroPerfil, setMembroPerfil] = useState<any>(null);
  const [fotoUrl, setFotoUrl] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');

  // Agenda Pessoal
  const [minhaAgenda, setMinhaAgenda] = useState<any[]>([]);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaData, setNovaData] = useState(new Date().toISOString().split('T')[0]);
  const [novaHora, setNovaHora] = useState('19:00');
  const [modalNovaAgenda, setModalNovaAgenda] = useState(false);

  // Igreja & Célula
  const [dadosIgreja, setDadosIgreja] = useState<any>({
    nome_igreja: 'Sua Igreja',
    endereco_completo: 'Teófilo Otoni - MG',
    link_instagram: 'https://instagram.com',
  });
  const [minhaCelula, setMinhaCelula] = useState<any>(null);
  const [participantesCelula, setParticipantesCelula] = useState<any[]>([]);
  const [reunioesCelula, setReunioesCelula] = useState<any[]>([]);
  
  const [modalNovaReuniao, setModalNovaReuniao] = useState(false);
  const [dataReuniao, setDataReuniao] = useState(new Date().toISOString().split('T')[0]);
  const [horaReuniao, setHoraReuniao] = useState('19:30');
  const [temaEstudo, setTemaEstudo] = useState('');
  const [comentariosCelula, setComentariosCelula] = useState('');

  const codigoIgreja = loggedUser?.codigo_igreja || 'IGR-001';
  const emailUsuario = loggedUser?.email;
  const usuarioId = loggedUser?.id || loggedUser?.auth_user_id || loggedUser?.email;

  const carregarDadosApp = useCallback(async () => {
    try {
      // 1. Agenda
      const { data: dataAgenda, error: errAgenda } = await supabase
        .from('agenda')
        .select('*')
        .eq('codigo_igreja', codigoIgreja);

      if (!errAgenda && dataAgenda) {
        setMinhaAgenda(dataAgenda);
      }

      // 2. Perfil
      if (emailUsuario) {
        const { data: dataMembro } = await supabase
          .from('members')
          .select('*')
          .eq('codigo_igreja', codigoIgreja)
          .eq('email', emailUsuario)
          .maybeSingle();

        if (dataMembro) {
          setMembroPerfil(dataMembro);
          setFotoUrl(dataMembro.foto_url || '');
          setRua(dataMembro.rua || '');
          setNumero(dataMembro.numero || '');
          setBairro(dataMembro.bairro || '');
          setCidade(dataMembro.cidade || '');

          if (dataMembro.celula_id) {
            const { data: dataCel } = await supabase
              .from('celulas')
              .select('*')
              .eq('id', dataMembro.celula_id)
              .maybeSingle();

            if (dataCel) setMinhaCelula(dataCel);

            const { data: dataPart } = await supabase
              .from('members')
              .select('id, nome, celular_principal, foto_url')
              .eq('celula_id', dataMembro.celula_id);

            if (dataPart) setParticipantesCelula(dataPart);
          }
        }
      }

      // 3. Igreja
      const { data: dataIgr } = await supabase
        .from('dados_igreja')
        .select('*')
        .eq('codigo_igreja', codigoIgreja)
        .maybeSingle();

      if (dataIgr) setDadosIgreja(dataIgr);

      // 4. Célula Reuniões
      const { data: dataReunioes } = await supabase
        .from('reunioes_celulas')
        .select('*')
        .eq('codigo_igreja', codigoIgreja)
        .order('data_reuniao', { ascending: false });

      if (dataReunioes) setReunioesCelula(dataReunioes);

    } catch (err: any) {
      console.error('Erro na carga dos dados:', err);
    }
  }, [codigoIgreja, emailUsuario]);

  useEffect(() => {
    carregarDadosApp();
  }, [carregarDadosApp]);

  // Ações da Agenda
  const handleSalvarMinhaAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoTitulo.trim()) return alert('Informe o título.');

    try {
      const payload = {
        codigo_igreja: codigoIgreja,
        usuario_id: usuarioId,
        titulo: novoTitulo.trim(),
        data_evento: novaData,
        hora_evento: novaHora,
        tipo: 'Pessoal',
      };

      const { error } = await supabase.from('agenda').insert([payload]);

      if (error) throw error;
      alert('📅 Agendado com sucesso!');
      setNovoTitulo('');
      setModalNovaAgenda(false);
      carregarDadosApp();
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    }
  };

  const handleExcluirCompromisso = async (id: any) => {
    if (!window.confirm('Excluir compromisso?')) return;
    try {
      const { error } = await supabase.from('agenda').delete().eq('id', id);
      if (error) throw error;
      carregarDadosApp();
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-100 min-h-[85vh] rounded-3xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col">
      {/* HEADER E BARRINHA DE MENU */}
      <div className="bg-blue-900 text-white p-5 space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black">📱 App {dadosIgreja.nome_igreja}</h2>
            <p className="text-xs text-blue-200">Olá, {membroPerfil?.nome || loggedUser?.nome_usuario}</p>
          </div>
        </div>

        {/* BOTOES DE ABA COM ALTERACAO DIRETA */}
        <div className="grid grid-cols-4 gap-1 bg-blue-950/60 p-1 rounded-xl text-[11px] font-bold text-center">
          <button
            type="button"
            onClick={() => setSubAbaApp('perfil')}
            className={`py-2 rounded-lg transition cursor-pointer ${
              subAbaApp === 'perfil' ? 'bg-blue-600 text-white font-extrabold shadow' : 'text-blue-200'
            }`}
          >
            👤 Perfil
          </button>

          <button
            type="button"
            onClick={() => setSubAbaApp('minha_agenda')}
            className={`py-2 rounded-lg transition cursor-pointer ${
              subAbaApp === 'minha_agenda' ? 'bg-blue-600 text-white font-extrabold shadow' : 'text-blue-200'
            }`}
          >
            📅 Agenda
          </button>

          <button
            type="button"
            onClick={() => setSubAbaApp('celula')}
            className={`py-2 rounded-lg transition cursor-pointer ${
              subAbaApp === 'celula' ? 'bg-blue-600 text-white font-extrabold shadow' : 'text-blue-200'
            }`}
          >
            🏡 Célula
          </button>

          <button
            type="button"
            onClick={() => setSubAbaApp('igreja')}
            className={`py-2 rounded-lg transition cursor-pointer ${
              subAbaApp === 'igreja' ? 'bg-blue-600 text-white font-extrabold shadow' : 'text-blue-200'
            }`}
          >
            ⛪ Igreja
          </button>
        </div>
      </div>

      {/* CONTEUDO */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {/* ABA AGENDA */}
        {subAbaApp === 'minha_agenda' && (
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl border shadow-sm">
              <div>
                <h3 className="font-black text-blue-900 text-sm">📅 Agenda e Eventos</h3>
                <p className="text-[10px] text-slate-500">Seus compromissos</p>
              </div>
              <button
                type="button"
                onClick={() => setModalNovaAgenda(true)}
                className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow cursor-pointer text-xs"
              >
                ➕ Criar
              </button>
            </div>

            {minhaAgenda.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-dashed text-slate-400 space-y-2">
                <p className="font-bold text-slate-700 text-xs">Nenhum evento cadastrado.</p>
                <p className="text-[11px] text-slate-500">Clique no botão "+ Criar" acima.</p>
              </div>
            ) : (
              minhaAgenda.map((item) => (
                <div key={item.id} className="bg-white p-3.5 rounded-2xl border shadow-sm flex justify-between items-center">
                  <div>
                    <span className="font-bold text-blue-900 block">
                      📅 {item.data_evento} às {item.hora_evento || '19:00'}
                    </span>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{item.titulo}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExcluirCompromisso(item.id)}
                    className="px-2.5 py-1 bg-rose-50 text-rose-700 font-bold text-[10px] rounded-lg"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* DEMAIS ABAS */}
        {subAbaApp === 'perfil' && <div className="bg-white p-4 rounded-2xl border text-xs">Aba Perfil em carregamento.</div>}
        {subAbaApp === 'celula' && <div className="bg-white p-4 rounded-2xl border text-xs">Aba Célula em carregamento.</div>}
        {subAbaApp === 'igreja' && <div className="bg-white p-4 rounded-2xl border text-xs">Aba Igreja em carregamento.</div>}
      </div>

      {/* MODAL CRIAR AGENDA */}
      {modalNovaAgenda && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-3xl p-5 space-y-3 text-xs">
            <h3 className="font-black text-blue-900 text-sm border-b pb-2">Novo Evento</h3>
            <form onSubmit={handleSalvarMinhaAgenda} className="space-y-3">
              <div>
                <label className="block font-bold mb-1">Título / Descrição *</label>
                <input
                  type="text"
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  className="w-full border rounded-xl p-2 font-semibold"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Data</label>
                  <input type="date" value={novaData} onChange={(e) => setNovaData(e.target.value)} className="w-full border rounded-xl p-2" />
                </div>
                <div>
                  <label className="block font-bold mb-1">Hora</label>
                  <input type="time" value={novaHora} onChange={(e) => setNovaHora(e.target.value)} className="w-full border rounded-xl p-2" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModalNovaAgenda(false)} className="w-full py-2 bg-slate-100 font-bold rounded-xl">Cancelar</button>
                <button type="submit" className="w-full py-2 bg-blue-900 text-white font-bold rounded-xl">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}