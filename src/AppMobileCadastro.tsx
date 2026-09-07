// src/AppMobileModule.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

interface Props {
  loggedUser: any;
}

interface DadosIgreja {
  nome_igreja: string;
  endereco_completo: string;
  link_instagram: string;
}

export default function AppMobileModule({ loggedUser }: Props) {
  // Aba ativa selecionada pelo usuário
  const [subAbaApp, setSubAbaApp] = useState<'perfil' | 'minha_agenda' | 'celula' | 'igreja'>('perfil');
  const [loading, setLoading] = useState(false);

  // 1. Dados do Perfil
  const [membroPerfil, setMembroPerfil] = useState<any>(null);
  const [fotoUrl, setFotoUrl] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');

  // 2. Agenda Pessoal
  const [minhaAgenda, setMinhaAgenda] = useState<any[]>([]);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaData, setNovaData] = useState(new Date().toISOString().split('T')[0]);
  const [novaHora, setNovaHora] = useState('19:00');
  const [modalNovaAgenda, setModalNovaAgenda] = useState(false);

  // 3. Dados da Igreja
  const [dadosIgreja, setDadosIgreja] = useState<DadosIgreja>({
    nome_igreja: 'Sua Igreja',
    endereco_completo: 'Teófilo Otoni - MG',
    link_instagram: 'https://instagram.com',
  });

  // 4. Célula
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

  // Carregar todos os dados de forma segura sem travar a navegação
  const carregarDadosApp = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Perfil do Membro
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

      // 2. Agenda Pessoal
      const { data: dataAgenda } = await supabase
        .from('agenda')
        .select('*')
        .eq('codigo_igreja', codigoIgreja);

      if (dataAgenda) {
        // Exibe registros do usuário ou de tipo 'Pessoal'
        const listaPessoal = dataAgenda.filter(
          (a) => String(a.usuario_id) === String(usuarioId) || a.tipo === 'Pessoal' || !a.usuario_id
        );
        setMinhaAgenda(listaPessoal);
      }

      // 3. Dados da Igreja
      const { data: dataIgr } = await supabase
        .from('dados_igreja')
        .select('*')
        .eq('codigo_igreja', codigoIgreja)
        .maybeSingle();

      if (dataIgr) setDadosIgreja(dataIgr);

      // 4. Reuniões de Célula
      const { data: dataReunioes } = await supabase
        .from('reunioes_celulas')
        .select('*')
        .eq('codigo_igreja', codigoIgreja)
        .order('data_reuniao', { ascending: false });

      if (dataReunioes) setReunioesCelula(dataReunioes);

    } catch (err: any) {
      console.error('Erro ao carregar app mobile:', err);
    } finally {
      setLoading(false);
    }
  }, [codigoIgreja, emailUsuario, usuarioId]);

  useEffect(() => {
    carregarDadosApp();
  }, [carregarDadosApp]);

  // AÇÕES PERFIL
  const handleSalvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!membroPerfil) return alert('Cadastro de membro não localizado.');

    try {
      const { error } = await supabase
        .from('members')
        .update({
          foto_url: fotoUrl.trim(),
          rua: rua.trim(),
          numero: numero.trim(),
          bairro: bairro.trim(),
          cidade: cidade.trim(),
        })
        .eq('id', membroPerfil.id);

      if (error) throw error;
      alert('📱 Seu perfil foi atualizado com sucesso!');
      carregarDadosApp();
    } catch (err: any) {
      alert('Erro ao atualizar perfil: ' + err.message);
    }
  };

  // AÇÕES AGENDA
  const handleSalvarMinhaAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoTitulo.trim()) return alert('Informe a descrição do compromisso.');

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
      alert('📅 Compromisso adicionado à sua agenda!');
      setNovoTitulo('');
      setModalNovaAgenda(false);
      carregarDadosApp();
    } catch (err: any) {
      alert('Erro ao salvar compromisso: ' + err.message);
    }
  };

  const handleExcluirCompromisso = async (id: any) => {
    if (!window.confirm('Deseja remover este compromisso da sua agenda?')) return;
    try {
      const { error } = await supabase.from('agenda').delete().eq('id', id);
      if (error) throw error;

      alert('Compromisso removido.');
      carregarDadosApp();
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  // AÇÕES CÉLULA
  const handleSalvarReuniaoCelula = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from('reunioes_celulas').insert([
        {
          codigo_igreja: codigoIgreja,
          celula_id: minhaCelula?.id || null,
          lider_id: membroPerfil?.id || null,
          data_reuniao: dataReuniao,
          hora_reuniao: horaReuniao,
          estudo_tema: temaEstudo.trim(),
          comentarios: comentariosCelula.trim(),
        },
      ]);

      if (error) throw error;
      alert('🏡 Reunião da célula registrada!');
      setTemaEstudo('');
      setComentariosCelula('');
      setModalNovaReuniao(false);
      carregarDadosApp();
    } catch (err: any) {
      alert('Erro ao registrar reunião: ' + err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-100 min-h-[85vh] rounded-3xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col">
      {/* CABEÇALHO */}
      <div className="bg-blue-900 text-white p-5 space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black">📱 App {dadosIgreja.nome_igreja}</h2>
            <p className="text-xs text-blue-200">Olá, {membroPerfil?.nome || loggedUser?.nome_usuario}</p>
          </div>
          {fotoUrl ? (
            <img src={fotoUrl} alt="Foto" className="w-10 h-10 rounded-full border-2 border-white object-cover" />
          ) : (
            <div className="w-10 h-10 bg-blue-800 rounded-full flex items-center justify-center font-bold">👤</div>
          )}
        </div>

        {/* BARRINHA DE NAVEGAÇÃO SUPERIOR */}
        <div className="grid grid-cols-4 gap-1 bg-blue-950/60 p-1 rounded-xl text-[11px] font-bold text-center">
          <button
            type="button"
            onClick={() => setSubAbaApp('perfil')}
            className={`py-2 rounded-lg transition cursor-pointer ${
              subAbaApp === 'perfil' ? 'bg-blue-600 text-white font-extrabold shadow' : 'text-blue-200 hover:text-white'
            }`}
          >
            👤 Perfil
          </button>

          <button
            type="button"
            onClick={() => setSubAbaApp('minha_agenda')}
            className={`py-2 rounded-lg transition cursor-pointer ${
              subAbaApp === 'minha_agenda' ? 'bg-blue-600 text-white font-extrabold shadow' : 'text-blue-200 hover:text-white'
            }`}
          >
            📅 Agenda
          </button>

          <button
            type="button"
            onClick={() => setSubAbaApp('celula')}
            className={`py-2 rounded-lg transition cursor-pointer ${
              subAbaApp === 'celula' ? 'bg-blue-600 text-white font-extrabold shadow' : 'text-blue-200 hover:text-white'
            }`}
          >
            🏡 Célula
          </button>

          <button
            type="button"
            onClick={() => setSubAbaApp('igreja')}
            className={`py-2 rounded-lg transition cursor-pointer ${
              subAbaApp === 'igreja' ? 'bg-blue-600 text-white font-extrabold shadow' : 'text-blue-200 hover:text-white'
            }`}
          >
            ⛪ Igreja
          </button>
        </div>
      </div>

      {/* ÁREA DE CONTEÚDO */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {loading ? (
          <p className="text-center py-8 text-xs text-slate-500">Carregando dados...</p>
        ) : (
          <>
            {/* 1. ABA PERFIL */}
            {subAbaApp === 'perfil' && (
              <div className="bg-white p-4 rounded-2xl shadow-sm border space-y-4 text-xs">
                <h3 className="font-black text-blue-900 text-sm border-b pb-2">✏️ Editar Meu Cadastro</h3>
                <p className="text-[11px] text-slate-500">
                  Atualize sua foto e seu endereço residencial.
                </p>

                <form onSubmit={handleSalvarPerfil} className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">URL / Imagem da Foto</label>
                    <input
                      type="text"
                      placeholder="Cole a URL ou base64 da imagem"
                      value={fotoUrl}
                      onChange={(e) => setFotoUrl(e.target.value)}
                      className="w-full border rounded-xl p-2.5 font-mono text-[10px]"
                    />
                  </div>

                  <div className="space-y-2 border-t pt-2">
                    <label className="block font-bold text-slate-700">Endereço Residencial</label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Rua / Av."
                        value={rua}
                        onChange={(e) => setRua(e.target.value)}
                        className="col-span-2 border rounded-xl p-2"
                      />
                      <input
                        type="text"
                        placeholder="Nº"
                        value={numero}
                        onChange={(e) => setNumero(e.target.value)}
                        className="border rounded-xl p-2"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Bairro"
                        value={bairro}
                        onChange={(e) => setBairro(e.target.value)}
                        className="border rounded-xl p-2"
                      />
                      <input
                        type="text"
                        placeholder="Cidade"
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                        className="border rounded-xl p-2"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-900 text-white font-bold rounded-xl shadow cursor-pointer mt-2"
                  >
                    💾 Atualizar Meu Cadastro
                  </button>
                </form>
              </div>
            )}

            {/* 2. ABA AGENDA */}
            {subAbaApp === 'minha_agenda' && (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl border shadow-sm">
                  <div>
                    <h3 className="font-black text-blue-900 text-sm">📅 Minha Agenda Pessoal</h3>
                    <p className="text-[10px] text-slate-500">Seus compromissos particulares</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalNovaAgenda(true)}
                    className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow cursor-pointer"
                  >
                    ➕ Novo
                  </button>
                </div>

                {minhaAgenda.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-2xl border border-dashed text-slate-400 space-y-1">
                    <p className="font-bold text-slate-600">Sua agenda está vazia.</p>
                    <p className="text-[11px]">Clique no botão "+ Novo" acima para criar um compromisso!</p>
                  </div>
                ) : (
                  minhaAgenda.map((item) => (
                    <div key={item.id} className="bg-white p-3.5 rounded-2xl border space-y-1.5 shadow-sm flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-900">
                            📅 {item.data_evento?.split('-').reverse().join('/')} às {item.hora_evento || '19:00'}
                          </span>
                          <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">
                            {item.tipo || 'Pessoal'}
                          </span>
                        </div>
                        <p className="font-bold text-slate-800 text-sm mt-0.5">{item.titulo}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleExcluirCompromisso(item.id)}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] rounded-lg cursor-pointer"
                      >
                        🗑️
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 3. ABA CÉLULA */}
            {subAbaApp === 'celula' && (
              <div className="space-y-4 text-xs">
                <div className="bg-white p-4 rounded-2xl border space-y-2">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-black text-blue-900 text-sm">🏡 {minhaCelula?.nome_celula || 'Minha Célula'}</h3>
                    <button
                      type="button"
                      onClick={() => setModalNovaReuniao(true)}
                      className="px-2.5 py-1 bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
                    >
                      ➕ Registrar Encontro
                    </button>
                  </div>

                  <p className="text-slate-500">
                    Líder: <strong>{minhaCelula?.lider || 'Não definido'}</strong> • Dia: <strong>{minhaCelula?.dia_reuniao || 'Segunda'}</strong>
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border space-y-2">
                  <h4 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">
                    👥 Integrantes da Célula ({participantesCelula.length})
                  </h4>
                  <div className="space-y-1.5">
                    {participantesCelula.map((p) => (
                      <div key={p.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-xl">
                        <span className="font-bold text-slate-800">{p.nome}</span>
                        <a
                          href={`https://wa.me/55${p.celular_principal?.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200"
                        >
                          💬 WhatsApp
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border space-y-2">
                  <h4 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">
                    📋 Histórico de Encontros & Notas
                  </h4>
                  {reunioesCelula.length === 0 ? (
                    <p className="text-slate-400 italic text-center py-2">Nenhum evento registrado.</p>
                  ) : (
                    reunioesCelula.map((r) => (
                      <div key={r.id} className="p-2.5 bg-slate-50 rounded-xl border space-y-1">
                        <span className="font-bold text-blue-900 block">
                          📅 {r.data_reuniao?.split('-').reverse().join('/')} às {r.hora_reuniao}
                        </span>
                        {r.estudo_tema && <p className="font-medium text-slate-800">📘 Estudo: {r.estudo_tema}</p>}
                        {r.comentarios && <p className="text-slate-500 italic">💬 Nota: {r.comentarios}</p>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 4. ABA IGREJA */}
            {subAbaApp === 'igreja' && (
              <div className="bg-white p-5 rounded-2xl border space-y-4 text-xs">
                <h3 className="font-black text-blue-900 text-sm border-b pb-2">⛪ Informações da Igreja</h3>

                <div className="bg-slate-50 p-4 rounded-xl border space-y-2">
                  <strong className="block text-slate-700">📍 Endereço Oficial</strong>
                  <p className="text-slate-600 font-medium">{dadosIgreja.endereco_completo}</p>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dadosIgreja.endereco_completo)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full text-center py-2.5 bg-emerald-700 text-white font-bold rounded-xl shadow cursor-pointer mt-2"
                  >
                    🗺️ Como Chegar na Igreja (GPS)
                  </a>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border space-y-2">
                  <strong className="block text-slate-700">📸 Redes Sociais</strong>
                  <a
                    href={dadosIgreja.link_instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full text-center py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow cursor-pointer"
                  >
                    📷 Acessar Instagram Oficial
                  </a>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL AGENDA PESSOAL */}
      {modalNovaAgenda && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-3xl p-5 space-y-3 text-xs">
            <h3 className="font-black text-blue-900 text-sm border-b pb-2">Novo Compromisso Pessoal</h3>
            <form onSubmit={handleSalvarMinhaAgenda} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Compromisso / Lembrete *</label>
                <input
                  type="text"
                  placeholder="Ex: Discipulado, Reunião..."
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  className="w-full border rounded-xl p-2 font-semibold"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data</label>
                  <input type="date" value={novaData} onChange={(e) => setNovaData(e.target.value)} className="w-full border rounded-xl p-2 font-semibold" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hora</label>
                  <input type="time" value={novaHora} onChange={(e) => setNovaHora(e.target.value)} className="w-full border rounded-xl p-2 font-semibold" />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModalNovaAgenda(false)} className="w-full py-2.5 bg-slate-100 font-bold rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" className="w-full py-2.5 bg-blue-900 text-white font-bold rounded-xl shadow cursor-pointer">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CÉLULA */}
      {modalNovaReuniao && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-3xl p-5 space-y-3 text-xs">
            <h3 className="font-black text-blue-900 text-sm border-b pb-2">Registrar Encontro da Célula</h3>
            <form onSubmit={handleSalvarReuniaoCelula} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Data</label>
                  <input type="date" value={dataReuniao} onChange={(e) => setDataReuniao(e.target.value)} className="w-full border rounded-xl p-2" />
                </div>
                <div>
                  <label className="block font-bold mb-1">Hora</label>
                  <input type="time" value={horaReuniao} onChange={(e) => setHoraReuniao(e.target.value)} className="w-full border rounded-xl p-2" />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Tema / Estudo</label>
                <input type="text" placeholder="Ex: Lição 4..." value={temaEstudo} onChange={(e) => setTemaEstudo(e.target.value)} className="w-full border rounded-xl p-2" />
              </div>

              <div>
                <label className="block font-bold mb-1">Comentários e Notas</label>
                <textarea placeholder="Observações..." value={comentariosCelula} onChange={(e) => setComentariosCelula(e.target.value)} className="w-full border rounded-xl p-2" rows={2} />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModalNovaReuniao(false)} className="w-full py-2.5 bg-slate-100 font-bold rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" className="w-full py-2.5 bg-emerald-700 text-white font-bold rounded-xl shadow cursor-pointer">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}