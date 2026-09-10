import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

interface Props {
  loggedUser: any;
}

interface Compromisso {
  id: string;
  descricao: string;
  data: string;
  hora: string;
  lembrete_minutos?: number;
  frequencia?: string;
  concluido?: boolean;
}

interface DadosIgreja {
  nome_igreja: string;
  endereco_completo: string;
  link_instagram: string;
  chave_pix?: string;
}

interface Devocional {
  versiculo: string;
  referencia: string;
  reflexao: string;
  data: string;
}

export default function AppMobileModule({ loggedUser }: Props) {
  // Controle de Abas (Perfil, Agenda, Célula, Igreja, Cadastro, Contribua, Devocional)
  const [subAbaApp, setSubAbaApp] = useState<'perfil' | 'minha_agenda' | 'celula' | 'igreja' | 'cadastro' | 'contribua' | 'devocional'>('minha_agenda');
  const [loading, setLoading] = useState(false);

  // 1. Dados do Perfil Pessoal
  const [membroPerfil, setMembroPerfil] = useState<any>(null);
  const [fotoUrl, setFotoUrl] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');

  // 1.1 Estados do Formulário de Cadastro Único do Membro
  const [nomeMembro, setNomeMembro] = useState('');
  const [celularMembro, setCelularMembro] = useState('');
  const [dataNascMembro, setDataNascMembro] = useState('');
  const [bairroMembro, setBairroMembro] = useState('');
  const [jaCadastrado, setJaCadastrado] = useState(false);
  const [carregandoCadastro, setCarregandoCadastro] = useState(false);

  // 2. Agenda Pessoal (Criação e Edição com Alarme)
  const [minhaAgenda, setMinhaAgenda] = useState<Compromisso[]>([]);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaData, setNovaData] = useState(new Date().toISOString().split('T')[0]);
  const [novaHora, setNovaHora] = useState('08:00');
  const [lembreteMinutos, setLembreteMinutos] = useState(15);
  const [frequencia, setFrequencia] = useState('unica');
  const [modalNovaAgenda, setModalNovaAgenda] = useState(false);
  const [itemEditandoAgenda, setItemEditandoAgenda] = useState<Compromisso | null>(null);

  // 3. Dados da Igreja
  const [dadosIgreja, setDadosIgreja] = useState<DadosIgreja>({
    nome_igreja: 'Sua Igreja',
    endereco_completo: 'Teófilo Otoni - MG',
    link_instagram: 'https://instagram.com',
    chave_pix: 'contato@suaigreja.com.br (PIX)',
  });

  // 3.1 Devocional Dinâmico (Puxando do Supabase)
  const [devocionalDoDia, setDevocionalDoDia] = useState<Devocional>({
    versiculo: 'Carregando palavra do dia...',
    referencia: '',
    reflexao: 'Aguarde um momento.',
    data: new Date().toLocaleDateString('pt-BR'),
  });

  // 4. Controle de Célula (Criação e Edição)
  const [minhaCelula, setMinhaCelula] = useState<any>(null);
  const [participantesCelula, setParticipantesCelula] = useState<any[]>([]);
  const [reunioesCelula, setReunioesCelula] = useState<any[]>([]);
  
  const [modalNovaReuniao, setModalNovaReuniao] = useState(false);
  const [itemEditandoReuniao, setItemEditandoReuniao] = useState<any | null>(null);
  const [dataReuniao, setDataReuniao] = useState(new Date().toISOString().split('T')[0]);
  const [horaReuniao, setHoraReuniao] = useState('19:30');
  const [temaEstudo, setTemaEstudo] = useState('');
  const [comentariosCelula, setComentariosCelula] = useState('');

  const codigoIgreja = loggedUser?.codigo_igreja || 'IGR-001';
  const emailUsuario = loggedUser?.email?.trim().toLowerCase();
  const isAdminOuLider = loggedUser?.perfil === 'admin' || loggedUser?.perfil === 'administrador' || loggedUser?.perfil === 'lider';

  // Solicitar permissão de Notificação do Navegador ao carregar
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  // Verificar status do cadastro único na tabela members
  const verificarStatusCadastro = async () => {
    if (!emailUsuario) return;
    setCarregandoCadastro(true);
    try {
      const { data } = await supabase
        .from('members')
        .select('*')
        .eq('email', emailUsuario)
        .maybeSingle();

      if (data) {
        setNomeMembro(data.nome || '');
        setCelularMembro(data.celular_principal || '');
        setDataNascMembro(data.data_nascimento || '');
        setBairroMembro(data.bairro || '');

        if (data.cadastro_concluido && !isAdminOuLider) {
          setJaCadastrado(true);
        }
      }
    } catch (err) {
      console.error('Erro ao verificar cadastro:', err);
    } finally {
      setCarregandoCadastro(false);
    }
  };

  // Carregar todos os dados das abas (incluindo o Devocional do Supabase)
  const carregarDadosApp = useCallback(async () => {
    setLoading(true);
    try {
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

      const { data: dataAgenda } = await supabase
        .from('agenda_mobile')
        .select('*')
        .eq('codigo_igreja', codigoIgreja)
        .order('data', { ascending: true })
        .order('hora', { ascending: true });

      if (dataAgenda) setMinhaAgenda(dataAgenda);

      const { data: dataIgr } = await supabase
        .from('dados_igreja')
        .select('*')
        .eq('codigo_igreja', codigoIgreja)
        .maybeSingle();

      if (dataIgr) setDadosIgreja(dataIgr);

      // Carregar o Devocional mais recente cadastrado na tabela 'devocionais'
      const { data: dataDev } = await supabase
        .from('devocionais')
        .select('*')
        .eq('codigo_igreja', codigoIgreja)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (dataDev) {
        setDevocionalDoDia({
          versiculo: dataDev.versiculo || 'O Senhor é o meu pastor...',
          referencia: dataDev.referencia || 'Salmos 23:1',
          reflexao: dataDev.reflexao || 'Reflexão diária...',
          data: dataDev.data ? dataDev.data.split('-').reverse().join('/') : new Date().toLocaleDateString('pt-BR'),
        });
      }

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
  }, [codigoIgreja, emailUsuario]);

  useEffect(() => {
    carregarDadosApp();
    verificarStatusCadastro();
  }, [carregarDadosApp]);

  // Alarme sonoro e notificação ativa em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      const agora = new Date();
      const dataHoje = agora.toISOString().split('T')[0];
      const horaAgora = agora.toTimeString().substring(0, 5);

      minhaAgenda.forEach((c) => {
        if (c.data === dataHoje && c.hora === horaAgora && !c.concluido) {
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 1.5);
          } catch (e) {
            console.log('Audio Context bloqueado pelo navegador');
          }

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('⏰ Lembrete de Compromisso!', {
              body: `${c.descricao} às ${c.hora}`,
              icon: '/icon.png',
            });
          }
        }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [minhaAgenda]);

  // AÇÃO 1: SALVAR / ATUALIZAR PERFIL
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

  // LÓGICA DO CADASTRO ÚNICO (Com trava para membros comuns)
  const handleSalvarCadastroUnico = async (e: React.FormEvent) => {
    e.preventDefault();

    if (jaCadastrado && !isAdminOuLider) {
      alert('Dados já confirmados. Procure a secretaria.');
      return;
    }

    if (!nomeMembro.trim()) return alert('Informe seu nome completo.');

    try {
      const { data: membroAtual } = await supabase
        .from('members')
        .select('id, cadastro_concluido')
        .eq('email', emailUsuario)
        .maybeSingle();

      if (membroAtual && membroAtual.cadastro_concluido && !isAdminOuLider) {
        alert('Dados já confirmados. Procure a secretaria.');
        setJaCadastrado(true);
        return;
      }

      const payload = {
        codigo_igreja: codigoIgreja,
        email: emailUsuario,
        nome: nomeMembro.trim(),
        celular_principal: celularMembro.trim(),
        data_nascimento: dataNascMembro || null,
        bairro: bairroMembro.trim(),
        tipo_cadastro: 'Membro',
        cadastro_concluido: true,
        status_acesso: 'Ativo',
      };

      if (membroAtual?.id) {
        const { error } = await supabase
          .from('members')
          .update(payload)
          .eq('id', membroAtual.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('members').insert([payload]);
        if (error) throw error;
      }

      alert('✅ Cadastro realizado com sucesso!');
      setJaCadastrado(true);
      carregarDadosApp();
    } catch (err: any) {
      alert('Erro ao salvar cadastro: ' + err.message);
    }
  };

  // AÇÃO 2: ABRIR MODAL AGENDA (CRIAR)
  const handleAbrirCriarAgenda = () => {
    setItemEditandoAgenda(null);
    setNovoTitulo('');
    setNovaData(new Date().toISOString().split('T')[0]);
    setNovaHora('08:00');
    setLembreteMinutos(15);
    setFrequencia('unica');
    setModalNovaAgenda(true);
  };

  // AÇÃO 3: ABRIR MODAL AGENDA (EDITAR)
  const handleAbrirEditarAgenda = (item: Compromisso) => {
    setItemEditandoAgenda(item);
    setNovoTitulo(item.descricao || '');
    setNovaData(item.data || new Date().toISOString().split('T')[0]);
    setNovaHora(item.hora || '08:00');
    setLembreteMinutos(item.lembrete_minutos || 15);
    setFrequencia(item.frequencia || 'unica');
    setModalNovaAgenda(true);
  };

  // AÇÃO 4: SALVAR / ATUALIZAR AGENDA
  const handleSalvarMinhaAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoTitulo.trim()) return alert('Informe a descrição do compromisso.');

    try {
      const payload = {
        codigo_igreja: codigoIgreja,
        descricao: novoTitulo.trim(),
        data: novaData,
        hora: novaHora,
        lembrete_minutos: Number(lembreteMinutos),
        frequencia,
      };

      if (itemEditandoAgenda) {
        const { error } = await supabase
          .from('agenda_mobile')
          .update(payload)
          .eq('id', itemEditandoAgenda.id);

        if (error) throw error;
        alert('✏️ Compromisso atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('agenda_mobile').insert([payload]);
        if (error) throw error;
        alert('📅 Compromisso adicionado!');
      }

      setModalNovaAgenda(false);
      setItemEditandoAgenda(null);
      setNovoTitulo('');
      carregarDadosApp();
    } catch (err: any) {
      alert('Erro ao salvar compromisso: ' + err.message);
    }
  };

  // AÇÃO 5: EXCLUIR AGENDA
  const handleExcluirCompromisso = async (id: string) => {
    if (!window.confirm('Deseja remover este compromisso da sua agenda?')) return;
    try {
      const { error } = await supabase.from('agenda_mobile').delete().eq('id', id);
      if (error) throw error;

      alert('Compromisso removido.');
      carregarDadosApp();
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  // AÇÃO 6: ABRIR MODAL CÉLULA (CRIAR)
  const handleAbrirCriarReuniao = () => {
    setItemEditandoReuniao(null);
    setDataReuniao(new Date().toISOString().split('T')[0]);
    setHoraReuniao('19:30');
    setTemaEstudo('');
    setComentariosCelula('');
    setModalNovaReuniao(true);
  };

  // AÇÃO 7: ABRIR MODAL CÉLULA (EDITAR)
  const handleAbrirEditarReuniao = (item: any) => {
    setItemEditandoReuniao(item);
    setDataReuniao(item.data_reuniao || new Date().toISOString().split('T')[0]);
    setHoraReuniao(item.hora_reuniao ? item.hora_reuniao.substring(0, 5) : '19:30');
    setTemaEstudo(item.estudo_tema || '');
    setComentariosCelula(item.comentarios || '');
    setModalNovaReuniao(true);
  };

  // AÇÃO 8: SALVAR / ATUALIZAR REUNIÃO CÉLULA
  const handleSalvarReuniaoCelula = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        codigo_igreja: codigoIgreja,
        celula_id: minhaCelula?.id || null,
        lider_id: membroPerfil?.id || null,
        data_reuniao: dataReuniao,
        hora_reuniao: horaReuniao,
        estudo_tema: temaEstudo.trim(),
        comentarios: comentariosCelula.trim(),
      };

      if (itemEditandoReuniao) {
        const { error } = await supabase
          .from('reunioes_celulas')
          .update(payload)
          .eq('id', itemEditandoReuniao.id);

        if (error) throw error;
        alert('✏️ Encontro da célula atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('reunioes_celulas').insert([payload]);
        if (error) throw error;
        alert('🏡 Reunião da célula registrada!');
      }

      setTemaEstudo('');
      setComentariosCelula('');
      setItemEditandoReuniao(null);
      setModalNovaReuniao(false);
      carregarDadosApp();
    } catch (err: any) {
      alert('Erro ao salvar reunião: ' + err.message);
    }
  };

  // AÇÃO 9: EXCLUIR REUNIÃO CÉLULA
  const handleExcluirReuniao = async (id: any) => {
    if (!window.confirm('Excluir este registro de reunião?')) return;
    try {
      const { error } = await supabase.from('reunioes_celulas').delete().eq('id', id);
      if (error) throw error;
      carregarDadosApp();
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-100 min-h-[85vh] rounded-3xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col">
      {/* CABEÇALHO */}
      <div className="bg-blue-900 text-white p-4 space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black">📱 App {dadosIgreja.nome_igreja}</h2>
            <p className="text-[11px] text-blue-200">Olá, {membroPerfil?.nome || loggedUser?.nome_usuario || 'Membro'}</p>
          </div>
          {fotoUrl ? (
            <img src={fotoUrl} alt="Foto" className="w-9 h-9 rounded-full border-2 border-white object-cover" />
          ) : (
            <div className="w-9 h-9 bg-blue-800 rounded-full flex items-center justify-center font-bold border-2 border-white text-xs">👤</div>
          )}
        </div>

        {/* NAVEGAÇÃO DE ABAS (7 OPÇÕES) */}
        <div className="grid grid-cols-7 gap-0.5 bg-blue-950/60 p-1 rounded-xl text-[9px] font-bold text-center">
          <button
            type="button"
            onClick={() => setSubAbaApp('perfil')}
            className={`py-1.5 rounded-lg transition cursor-pointer ${
              subAbaApp === 'perfil' ? 'bg-blue-600 text-white font-extrabold shadow' : 'text-blue-200 hover:text-white'
            }`}
          >
            👤 Perfil
          </button>

          <button
            type="button"
            onClick={() => setSubAbaApp('minha_agenda')}
            className={`py-1.5 rounded-lg transition cursor-pointer ${
              subAbaApp === 'minha_agenda' ? 'bg-blue-600 text-white font-extrabold shadow' : 'text-blue-200 hover:text-white'
            }`}
          >
            📅 Agenda
          </button>

          <button
            type="button"
            onClick={() => setSubAbaApp('celula')}
            className={`py-1.5 rounded-lg transition cursor-pointer ${
              subAbaApp === 'celula' ? 'bg-blue-600 text-white font-extrabold shadow' : 'text-blue-200 hover:text-white'
            }`}
          >
            🏡 Célula
          </button>

          <button
            type="button"
            onClick={() => setSubAbaApp('igreja')}
            className={`py-1.5 rounded-lg transition cursor-pointer ${
              subAbaApp === 'igreja' ? 'bg-blue-600 text-white font-extrabold shadow' : 'text-blue-200 hover:text-white'
            }`}
          >
            ⛪ Igreja
          </button>

          <button
            type="button"
            onClick={() => setSubAbaApp('cadastro')}
            className={`py-1.5 rounded-lg transition cursor-pointer ${
              subAbaApp === 'cadastro' ? 'bg-blue-600 text-white font-extrabold shadow' : 'text-blue-200 hover:text-white'
            }`}
          >
            📝 Cadastro
          </button>

          <button
            type="button"
            onClick={() => setSubAbaApp('contribua')}
            className={`py-1.5 rounded-lg transition cursor-pointer ${
              subAbaApp === 'contribua' ? 'bg-blue-600 text-white font-extrabold shadow' : 'text-blue-200 hover:text-white'
            }`}
          >
            💖 Contribua
          </button>

          <button
            type="button"
            onClick={() => setSubAbaApp('devocional')}
            className={`py-1.5 rounded-lg transition cursor-pointer ${
              subAbaApp === 'devocional' ? 'bg-blue-600 text-white font-extrabold shadow' : 'text-blue-200 hover:text-white'
            }`}
          >
            📖 Devocional
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
                  Você pode atualizar sua foto de perfil e seu endereço residencial.
                </p>

                <form onSubmit={handleSalvarPerfil} className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">URL da Foto de Perfil</label>
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

            {/* 2. ABA AGENDA & ALARMES */}
            {subAbaApp === 'minha_agenda' && (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl border shadow-sm">
                  <div>
                    <h3 className="font-black text-blue-900 text-sm flex items-center gap-1.5">
                      📅 Minha Agenda & Alarmes
                    </h3>
                    <p className="text-[10px] text-slate-500">Seus compromissos com alerta sonoro</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAbrirCriarAgenda}
                    className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow cursor-pointer text-xs flex items-center gap-1"
                  >
                    ➕ Criar
                  </button>
                </div>

                {minhaAgenda.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-2xl border border-dashed text-slate-400 space-y-2">
                    <p className="font-bold text-slate-700 text-xs">Sua agenda está vazia.</p>
                    <p className="text-[11px] text-slate-500">Clique em "+ Criar" para agendar um compromisso!</p>
                  </div>
                ) : (
                  minhaAgenda.map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-2xl border space-y-1 shadow-sm flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-900 text-xs">
                            📅 {item.data} às {item.hora}
                          </span>
                          {item.lembrete_minutos !== undefined && (
                            <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-1.5 py-0.5 rounded border border-amber-200">
                              🔔 {item.lembrete_minutos}m antes
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-slate-800 text-sm mt-0.5">{item.descricao}</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAbrirEditarAgenda(item)}
                          title="Editar compromisso"
                          className="w-8 h-8 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-xl flex items-center justify-center cursor-pointer transition"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExcluirCompromisso(item.id)}
                          title="Excluir compromisso"
                          className="w-8 h-8 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl flex items-center justify-center cursor-pointer transition"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 3. ABA CÉLULA */}
            {subAbaApp === 'celula' && (
              <div className="space-y-4 text-xs">
                <div className="bg-white p-4 rounded-2xl border space-y-2 shadow-sm">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-black text-blue-900 text-sm">🏡 {minhaCelula?.nome_celula || 'Minha Célula'}</h3>
                    <button
                      type="button"
                      onClick={handleAbrirCriarReuniao}
                      className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg cursor-pointer"
                    >
                      ➕ Registrar Encontro
                    </button>
                  </div>

                  <p className="text-slate-500">
                    Líder: <strong>{minhaCelula?.lider || 'Não definido'}</strong> • Dia: <strong>{minhaCelula?.dia_reuniao || 'Segunda'}</strong>
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border space-y-2 shadow-sm">
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

                <div className="bg-white p-4 rounded-2xl border space-y-2 shadow-sm">
                  <h4 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">
                    📋 Histórico de Encontros & Notas
                  </h4>
                  {reunioesCelula.length === 0 ? (
                    <p className="text-slate-400 italic text-center py-2">Nenhum evento registrado.</p>
                  ) : (
                    reunioesCelula.map((r) => (
                      <div key={r.id} className="p-3 bg-slate-50 rounded-xl border space-y-1 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-blue-900 block">
                            📅 {r.data_reuniao?.split('-').reverse().join('/')} às {r.hora_reuniao}
                          </span>
                          {r.estudo_tema && <p className="font-medium text-slate-800">📘 Estudo: {r.estudo_tema}</p>}
                          {r.comentarios && <p className="text-slate-500 italic">💬 Nota: {r.comentarios}</p>}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAbrirEditarReuniao(r)}
                            className="w-7 h-7 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold rounded-lg flex items-center justify-center cursor-pointer"
                            title="Editar Reunião"
                          >
                            ✏️
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExcluirReuniao(r.id)}
                            className="w-7 h-7 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold rounded-lg flex items-center justify-center cursor-pointer"
                            title="Excluir Reunião"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 4. ABA IGREJA */}
            {subAbaApp === 'igreja' && (
              <div className="bg-white p-5 rounded-2xl border space-y-4 text-xs shadow-sm">
                <h3 className="font-black text-blue-900 text-sm border-b pb-2">⛪ Informações da Igreja</h3>

                <div className="bg-slate-50 p-4 rounded-xl border space-y-2">
                  <strong className="block text-slate-700">📍 Endereço Oficial</strong>
                  <p className="text-slate-600 font-medium">{dadosIgreja.endereco_completo}</p>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dadosIgreja.endereco_completo)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full text-center py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow cursor-pointer mt-2"
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

            {/* 5. ABA CADASTRO (COM A TRAVA DE PREENCHIMENTO ÚNICO) */}
            {subAbaApp === 'cadastro' && (
              <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-4 text-xs">
                <div>
                  <h3 className="font-black text-blue-900 text-sm">📝 Ficha de Cadastro</h3>
                  <p className="text-[11px] text-slate-500">
                    {jaCadastrado && !isAdminOuLider 
                      ? 'Dados já confirmados. Procure a secretaria.' 
                      : 'Preencha seus dados oficiais abaixo. Este preenchimento é feito apenas uma vez.'}
                  </p>
                </div>

                {carregandoCadastro ? (
                  <p className="text-center text-xs text-slate-500 py-6">Carregando informações...</p>
                ) : (
                  <form onSubmit={handleSalvarCadastroUnico} className="space-y-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Nome Completo *</label>
                      <input
                        type="text"
                        value={nomeMembro}
                        onChange={(e) => setNomeMembro(e.target.value)}
                        disabled={jaCadastrado && !isAdminOuLider}
                        className="w-full border rounded-xl p-2.5 font-bold text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Celular / WhatsApp</label>
                      <input
                        type="text"
                        value={celularMembro}
                        onChange={(e) => setCelularMembro(e.target.value)}
                        disabled={jaCadastrado && !isAdminOuLider}
                        className="w-full border rounded-xl p-2.5 disabled:bg-slate-100 disabled:text-slate-500"
                        placeholder="(00) 00000-0000"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Data de Nascimento</label>
                      <input
                        type="date"
                        value={dataNascMembro}
                        onChange={(e) => setDataNascMembro(e.target.value)}
                        disabled={jaCadastrado && !isAdminOuLider}
                        className="w-full border rounded-xl p-2.5 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Bairro</label>
                      <input
                        type="text"
                        value={bairroMembro}
                        onChange={(e) => setBairroMembro(e.target.value)}
                        disabled={jaCadastrado && !isAdminOuLider}
                        className="w-full border rounded-xl p-2.5 disabled:bg-slate-100 disabled:text-slate-500"
                      />
                    </div>

                    {jaCadastrado && !isAdminOuLider ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-center font-bold text-xs">
                        🔒 Dados já confirmados. Procure a secretaria.
                      </div>
                    ) : (
                      <button
                        type="submit"
                        className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow cursor-pointer transition"
                      >
                        💾 Confirmar e Salvar Cadastro
                      </button>
                    )}
                  </form>
                )}
              </div>
            )}

            {/* 6. ABA CONTRIBUA */}
            {subAbaApp === 'contribua' && (
              <div className="bg-white p-5 rounded-2xl border space-y-4 text-xs shadow-sm">
                <h3 className="font-black text-blue-900 text-sm border-b pb-2">💖 Contribua com a Obra</h3>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  "Cada um contribua segundo propôs no seu coração; não com tristeza, ou por necessidade; porque Deus ama ao que dá com alegria." (2 Coríntios 9:7)
                </p>

                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-2 text-center">
                  <span className="text-2xl">💠</span>
                  <strong className="block text-amber-900 font-bold">Chave PIX da Igreja</strong>
                  <p className="font-mono text-xs bg-white p-2.5 rounded-lg border text-slate-700 select-all">
                    {dadosIgreja.chave_pix || 'contato@suaigreja.com.br'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(dadosIgreja.chave_pix || 'contato@suaigreja.com.br');
                      alert('Chave PIX copiada para a área de transferência!');
                    }}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow cursor-pointer transition text-xs"
                  >
                    📋 Copiar Chave PIX
                  </button>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border text-[11px] text-slate-500 text-center">
                  Após realizar sua contribuição por dízimo ou oferta, guarde o comprovante. Deus abençoe sua vida e sua generosidade!
                </div>
              </div>
            )}

            {/* 7. ABA DEVOCIONAL (DINÂMICO DO SUPABASE) */}
            {subAbaApp === 'devocional' && (
              <div className="bg-white p-5 rounded-2xl border space-y-4 text-xs shadow-sm">
                <div className="border-b pb-2 flex justify-between items-center">
                  <h3 className="font-black text-blue-900 text-sm">📖 Devocional Diário</h3>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                    {devocionalDoDia.data}
                  </span>
                </div>

                <div className="space-y-3 bg-gradient-to-br from-blue-900 to-indigo-950 text-white p-4 rounded-2xl shadow">
                  <span className="text-xs uppercase font-bold tracking-wider text-blue-300">Palavra do Dia</span>
                  <h4 className="font-black text-base text-yellow-300">"{devocionalDoDia.versiculo}"</h4>
                  <p className="text-[11px] text-blue-100 italic">{devocionalDoDia.referencia}</p>
                </div>

                <div className="space-y-2 text-slate-700 leading-relaxed">
                  <strong className="block text-blue-900 font-bold">Reflexão:</strong>
                  <p className="text-xs whitespace-pre-wrap">
                    {devocionalDoDia.reflexao}
                  </p>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-center font-medium text-[11px]">
                  ✨ Compartilhe esta palavra com alguém hoje e leve esperança!
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL AGENDA MOBILE COM ALARME */}
      {modalNovaAgenda && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-3xl p-5 space-y-3 text-xs shadow-2xl">
            <h3 className="font-black text-blue-900 text-sm border-b pb-2">
              {itemEditandoAgenda ? '✏️ Editar Compromisso' : '➕ Novo Compromisso'}
            </h3>
            <form onSubmit={handleSalvarMinhaAgenda} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição *</label>
                <input
                  type="text"
                  placeholder="Ex: Reunião, Culto..."
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  className="w-full border rounded-xl p-2.5 font-semibold text-slate-800"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data</label>
                  <input
                    type="date"
                    value={novaData}
                    onChange={(e) => setNovaData(e.target.value)}
                    className="w-full border rounded-xl p-2 font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hora</label>
                  <input
                    type="time"
                    value={novaHora}
                    onChange={(e) => setNovaHora(e.target.value)}
                    className="w-full border rounded-xl p-2 font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">🔔 Alarme Sonoro</label>
                <select
                  value={lembreteMinutos}
                  onChange={(e) => setLembreteMinutos(Number(e.target.value))}
                  className="w-full border rounded-xl p-2.5 bg-white outline-none"
                >
                  <option value={0}>Na hora exata</option>
                  <option value={5}>5 minutos antes</option>
                  <option value={15}>15 minutos antes</option>
                  <option value={30}>30 minutos antes</option>
                  <option value={60}>1 hora antes</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNovaAgenda(false)}
                  className="w-full py-2.5 bg-slate-100 font-bold rounded-xl cursor-pointer hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow cursor-pointer"
                >
                  {itemEditandoAgenda ? 'Salvar Alterações' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CÉLULA */}
      {modalNovaReuniao && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-3xl p-5 space-y-3 text-xs shadow-2xl">
            <h3 className="font-black text-blue-900 text-sm border-b pb-2">
              {itemEditandoReuniao ? '✏️ Editar Encontro da Célula' : 'Registrar Encontro da Célula'}
            </h3>
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
                <button
                  type="button"
                  onClick={() => {
                    setItemEditandoReuniao(null);
                    setModalNovaReuniao(false);
                  }}
                  className="w-full py-2.5 bg-slate-100 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button type="submit" className="w-full py-2.5 bg-emerald-700 text-white font-bold rounded-xl shadow cursor-pointer">
                  {itemEditandoReuniao ? 'Salvar Alterações' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}