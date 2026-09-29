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
  cnpj?: string;
  chave_pix?: string;
}

interface Devocional {
  id?: string;
  titulo: string;
  referencia: string;
  versiculo: string;
  reflexao: string;
  autor: string;
  data: string;
}

export default function AppMobileModule({ loggedUser }: Props) {
  const [subAbaApp, setSubAbaApp] = useState<'perfil' | 'minha_agenda' | 'celula' | 'igreja' | 'cadastro' | 'contribua' | 'devocional' | 'chat'>('minha_agenda');
  const [loading, setLoading] = useState(false);

  const [membroPerfil, setMembroPerfil] = useState<any>(null);
  const [fotoUrl, setFotoUrl] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');

  const [etapaCadastro, setEtapaCadastro] = useState<1 | 2 | 3>(1);
  const [nomeMembro, setNomeMembro] = useState('');
  const [celularMembro, setCelularMembro] = useState('');
  const [dataNascMembro, setDataNascMembro] = useState('');
  const [estadoCivil, setEstadoCivil] = useState('Solteiro(a)');
  const [cepMembro, setCepMembro] = useState('');
  const [bairroMembro, setBairroMembro] = useState('');
  const [ruaMembro, setRuaMembro] = useState('');
  const [numeroMembro, setNumeroMembro] = useState('');
  const [batizado, setBatizado] = useState('Sim');
  const [observacoesMembro, setObservacoesMembro] = useState('');

  const [jaCadastrado, setJaCadastrado] = useState(false);
  const [carregandoCadastro, setCarregandoCadastro] = useState(false);

  const [minhaAgenda, setMinhaAgenda] = useState<Compromisso[]>([]);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaData, setNovaData] = useState(new Date().toISOString().split('T')[0]);
  const [novaHora, setNovaHora] = useState('08:00');
  const [lembreteMinutos, setLembreteMinutos] = useState(15);
  const [frequencia, setFrequencia] = useState('unica');
  const [modalNovaAgenda, setModalNovaAgenda] = useState(false);
  const [itemEditandoAgenda, setItemEditandoAgenda] = useState<Compromisso | null>(null);

  const [dadosIgreja, setDadosIgreja] = useState<DadosIgreja>({
    nome_igreja: 'Sua Igreja',
    endereco_completo: 'Teófilo Otoni - MG',
    link_instagram: 'https://instagram.com',
    cnpj: '',
    chave_pix: '',
  });

  const [devocionalDoDia, setDevocionalDoDia] = useState<Devocional>({
    titulo: 'A carregar palavra do dia...',
    referencia: '',
    versiculo: '',
    reflexao: 'Aguarde um momento.',
    autor: 'Pastor / Equipe Pastoral',
    data: new Date().toLocaleDateString('pt-BR'),
  });

  const [modalDevocionalOpen, setModalDevocionalOpen] = useState(false);
  const [editDevData, setEditDevData] = useState(new Date().toISOString().split('T')[0]);
  const [editDevTitulo, setEditDevTitulo] = useState('');
  const [editDevRef, setEditDevRef] = useState('');
  const [editDevVersiculo, setEditDevVersiculo] = useState('');
  const [editDevReflexao, setEditDevReflexao] = useState('');
  const [editDevAutor, setEditDevAutor] = useState('Pastor / Equipe Pastoral');
  const [savingDevocional, setSavingDevocional] = useState(false);

  const [gerandoImagem, setGerandoImagem] = useState(false);
  const [modalStoryGeradoOpen, setModalStoryGeradoOpen] = useState(false);
  const [imagemStoryDataUrl, setImagemStoryDataUrl] = useState('');

  const [minhaCelula, setMinhaCelula] = useState<any>(null);
  const [participantesCelula, setParticipantesCelula] = useState<any[]>([]);
  const [reunioesCelula, setReunioesCelula] = useState<any[]>([]);
  
  const [modalNovaReuniao, setModalNovaReuniao] = useState(false);
  const [itemEditandoReuniao, setItemEditandoReuniao] = useState<any | null>(null);
  const [dataReuniao, setDataReuniao] = useState(new Date().toISOString().split('T')[0]);
  const [horaReuniao, setHoraReuniao] = useState('19:30');
  const [temaEstudo, setTemaEstudo] = useState('');
  const [comentariosCelula, setComentariosCelula] = useState('');

  const [listaMembrosChat, setListaMembrosChat] = useState<any[]>([]);
  const [membroSelecionadoChat, setMembroSelecionadoChat] = useState<any>(null);
  const [mensagensChat, setMensagensChat] = useState<any[]>([]);
  const [novaMensagemChat, setNovaMensagemChat] = useState('');

  const codigoIgreja = loggedUser?.codigo_igreja || loggedUser?.igrejas?.codigo_igreja || 'IGR-001';
  const emailUsuario = loggedUser?.email?.trim().toLowerCase() || loggedUser?.usuario || 'admin@sistema.com';
  const isAdminOuLider = loggedUser?.perfil === 'admin' || loggedUser?.perfil === 'administrador' || loggedUser?.perfil === 'lider' || loggedUser?.funcao === 'admin' || loggedUser?.cargo === 'Pastor';

  const formatarWhatsapp = (num: string) => {
    if (!num) return '';
    const limpo = num.replace(/\D/g, '');
    return limpo.startsWith('55') ? limpo : `55${limpo}`;
  };

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

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
        setEstadoCivil(data.estado_civil || 'Solteiro(a)');
        setCepMembro(data.cep || '');
        setBairroMembro(data.bairro || '');
        setRuaMembro(data.rua || '');
        setNumeroMembro(data.numero || '');
        setBatizado(data.batizado || 'Sim');
        setObservacoesMembro(data.observacoes || '');

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

  // BUSCA EXCLUSIVA DE MEMBROS REAIS ORDENADOS POR CONVERSAS RECENTES (SEM FALLBACKS FICTÍCIOS)
  const carregarMembrosChat = useCallback(async () => {
    try {
      const { data: membros, error: errMembros } = await supabase
        .from('members')
        .select('id, nome, email, celular_principal, tipo_cadastro, foto_url');

      if (errMembros) throw errMembros;

      const { data: mensagens } = await supabase
        .from('chat_mensagens')
        .select('sender, recipient_id, created_at')
        .order('created_at', { ascending: false });

      if (membros && membros.length > 0) {
        const ultimaConversaMap = new Map<string, string>();
        if (mensagens) {
          mensagens.forEach((msg) => {
            const outroEmail = msg.sender?.trim().toLowerCase();
            const recipientId = msg.recipient_id;
            
            membros.forEach((m) => {
              const matchEmail = m.email?.trim().toLowerCase() === outroEmail;
              const matchId = m.id === recipientId;
              if ((matchEmail || matchId) && !ultimaConversaMap.has(m.id)) {
                ultimaConversaMap.set(m.id, msg.created_at);
              }
            });
          });
        }

        const membrosOrdenados = [...membros].sort((a, b) => {
          const dataA = ultimaConversaMap.get(a.id) ? new Date(ultimaConversaMap.get(a.id)!).getTime() : 0;
          const dataB = ultimaConversaMap.get(b.id) ? new Date(ultimaConversaMap.get(b.id)!).getTime() : 0;
          if (dataA !== dataB) return dataB - dataA;
          return (a.nome || '').localeCompare(b.nome || '');
        });

        const membrosFinais = membrosOrdenados.filter((m) => m.email?.trim().toLowerCase() !== emailUsuario);
        setListaMembrosChat(membrosFinais);
      } else {
        setListaMembrosChat([]);
      }
    } catch (err) {
      console.error('Erro ao carregar membros:', err);
      setListaMembrosChat([]);
    }
  }, [emailUsuario]);

  const carregarMensagensChat = useCallback(async () => {
    try {
      let query = supabase
        .from('chat_mensagens')
        .select('*')
        .order('created_at', { ascending: true });

      if (membroSelecionadoChat) {
        const emailDestinatario = membroSelecionadoChat.email?.trim().toLowerCase();
        const meuId = membroPerfil?.id || '0';
        const meuEmail = emailUsuario;

        query = query.or(
          `and(sender.eq.${meuEmail},recipient_id.eq.${membroSelecionadoChat.id}),` +
          `and(sender.eq.${emailDestinatario},recipient_id.eq.${meuId}),` +
          `and(sender.eq.${emailDestinatario},is_broadcast.eq.false)`
        );
      } else {
        query = query.eq('is_broadcast', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      if (data) {
        const unicas = Array.from(new Map(data.map(m => [m.id, m])).values());
        setMensagensChat(unicas);
      }
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
    }
  }, [membroSelecionadoChat, emailUsuario, membroPerfil]);

  useEffect(() => {
    if (subAbaApp === 'chat') {
      carregarMembrosChat();
      carregarMensagensChat();

      const channel = supabase
        .channel('chat_realtime_mobile_v13')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_mensagens' },
          (payload) => {
            const nova = payload.new;
            setMensagensChat((prev) => {
              if (prev.some((m) => m.id === nova.id)) return prev;
              return [...prev, nova];
            });
            carregarMembrosChat();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [subAbaApp, carregarMembrosChat, carregarMensagensChat]);

  const carregarDadosApp = useCallback(async () => {
    setLoading(true);
    try {
      if (emailUsuario) {
        const { data: dataMembro } = await supabase
          .from('members')
          .select('*')
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
        .order('data', { ascending: true })
        .order('hora', { ascending: true });

      if (dataAgenda) setMinhaAgenda(dataAgenda);

      const { data: dataIgr } = await supabase
        .from('igrejas')
        .select('*')
        .maybeSingle();

      if (dataIgr) {
        setDadosIgreja({
          nome_igreja: dataIgr.nome_fantasia || dataIgr.razao_social || 'Sua Igreja',
          endereco_completo: `${dataIgr.logradouro || ''}, ${dataIgr.numero || ''} - CEP: ${dataIgr.cep || ''}`.trim(),
          link_instagram: dataIgr.link_instagram || 'https://instagram.com',
          cnpj: dataIgr.cnpj || '',
          chave_pix: dataIgr.cnpj || dataIgr.chave_pix || '',
        });
      }

      const hojeStr = new Date().toISOString().split('T')[0];
      const { data: dataDev } = await supabase
        .from('devotionals')
        .select('*')
        .eq('is_published', true)
        .lte('publish_date', hojeStr)
        .order('publish_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (dataDev) {
        setDevocionalDoDia({
          id: dataDev.id,
          titulo: dataDev.title || 'Palavra de Hoje',
          referencia: dataDev.verse_reference || '',
          versiculo: dataDev.passage_text || '',
          reflexao: dataDev.content_html || '',
          autor: dataDev.author_name || 'Pastor / Equipe Pastoral',
          data: dataDev.publish_date ? dataDev.publish_date.split('-').reverse().join('/') : new Date().toLocaleDateString('pt-BR'),
        });
      }

      const { data: dataReunioes } = await supabase
        .from('reunioes_celulas')
        .select('*')
        .order('data_reuniao', { ascending: false });

      if (dataReunioes) setReunioesCelula(dataReunioes);

    } catch (err: any) {
      console.error('Erro ao carregar app mobile:', err);
    } finally {
      setLoading(false);
    }
  }, [emailUsuario]);

  useEffect(() => {
    carregarDadosApp();
    verificarStatusCadastro();
  }, [carregarDadosApp]);

  const handleEnviarMensagemChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMensagemChat.trim()) return;

    try {
      const payload: any = {
        codigo_igreja: codigoIgreja,
        sender: emailUsuario,
        text: novaMensagemChat.trim(),
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        is_broadcast: !membroSelecionadoChat,
      };

      if (membroSelecionadoChat) {
        payload.recipient_id = membroSelecionadoChat.id;
      }

      const { error } = await supabase.from('chat_mensagens').insert([payload]);
      if (error) throw error;

      setNovaMensagemChat('');
      carregarMensagensChat();
      carregarMembrosChat();
    } catch (err: any) {
      alert('Erro ao enviar mensagem: ' + err.message);
    }
  };

  const handleExcluirMensagemChat = async (id: string) => {
    if (!window.confirm('Deseja excluir esta mensagem?')) return;
    try {
      const { error } = await supabase.from('chat_mensagens').delete().eq('id', id);
      if (error) throw error;
      carregarMensagensChat();
    } catch (err: any) {
      alert('Erro ao excluir mensagem: ' + err.message);
    }
  };

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

  const handleFinalizarCadastroUnico = async (e: React.FormEvent) => {
    e.preventDefault();

    if (jaCadastrado && !isAdminOuLider) {
      alert('Dados já confirmados. Procure a secretaria.');
      return;
    }

    if (!nomeMembro.trim()) return alert('Informe seu nome completo na Etapa 1.');

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
        estado_civil: estadoCivil,
        cep: cepMembro.trim(),
        bairro: bairroMembro.trim(),
        rua: ruaMembro.trim(),
        numero: numeroMembro.trim(),
        batizado,
        observacoes: observacoesMembro.trim(),
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

      alert('✅ Cadastro concluído com sucesso!');
      setJaCadastrado(true);
      carregarDadosApp();
    } catch (err: any) {
      alert('Erro ao salvar cadastro: ' + err.message);
    }
  };

  const handleAbrirCriarAgenda = () => {
    setItemEditandoAgenda(null);
    setNovoTitulo('');
    setNovaData(new Date().toISOString().split('T')[0]);
    setNovaHora('08:00');
    setLembreteMinutos(15);
    setFrequencia('unica');
    setModalNovaAgenda(true);
  };

  const handleAbrirEditarAgenda = (item: Compromisso) => {
    setItemEditandoAgenda(item);
    setNovoTitulo(item.descricao || '');
    setNovaData(item.data || new Date().toISOString().split('T')[0]);
    setNovaHora(item.hora || '08:00');
    setLembreteMinutos(item.lembrete_minutos || 15);
    setFrequencia(item.frequencia || 'unica');
    setModalNovaAgenda(true);
  };

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

  const handleAbrirCriarReuniao = () => {
    setItemEditandoReuniao(null);
    setDataReuniao(new Date().toISOString().split('T')[0]);
    setHoraReuniao('19:30');
    setTemaEstudo('');
    setComentariosCelula('');
    setModalNovaReuniao(true);
  };

  const handleAbrirEditarReuniao = (item: any) => {
    setItemEditandoReuniao(item);
    setDataReuniao(item.data_reuniao || new Date().toISOString().split('T')[0]);
    setHoraReuniao(item.hora_reuniao ? item.hora_reuniao.substring(0, 5) : '19:30');
    setTemaEstudo(item.estudo_tema || '');
    setComentariosCelula(item.comentarios || '');
    setModalNovaReuniao(true);
  };

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

  const handleCompartilharDevocional = () => {
    const textoLimpo = devocionalDoDia.reflexao.replace(/<[^>]*>?/gm, '');
    const texto = `*Devocional Diário - ${dadosIgreja.nome_igreja}*\n\n📖 *${devocionalDoDia.titulo}*\n${devocionalDoDia.versiculo ? `"${devocionalDoDia.versiculo}"\n` : ''}_${devocionalDoDia.referencia}_\n\n*Reflexão:*\n${textoLimpo}\n\n✍️ *Por:* ${devocionalDoDia.autor}`;

    if (navigator.share) {
      navigator.share({
        title: devocionalDoDia.titulo,
        text: texto,
      });
    } else {
      navigator.clipboard.writeText(texto);
      alert('✨ Devocional copiado com sucesso! Abra o WhatsApp para compartilhar.');
    }
  };

  const handleAbrirEditarDevocional = () => {
    setEditDevData(new Date().toISOString().split('T')[0]);
    setEditDevTitulo(devocionalDoDia.titulo !== 'A carregar palavra do dia...' ? devocionalDoDia.titulo : '');
    setEditDevRef(devocionalDoDia.referencia || '');
    setEditDevVersiculo(devocionalDoDia.versiculo || '');
    setEditDevReflexao(devocionalDoDia.reflexao !== 'Aguarde um momento.' ? devocionalDoDia.reflexao : '');
    setEditDevAutor(devocionalDoDia.autor || 'Pastor / Equipe Pastoral');
    setModalDevocionalOpen(true);
  };

  const handleSalvarDevocionalMobile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDevTitulo.trim() || !editDevReflexao.trim()) {
      return alert('Preencha o título e o texto da reflexão.');
    }

    setSavingDevocional(true);
    try {
      const payload = {
        publish_date: editDevData,
        title: editDevTitulo.trim(),
        verse_reference: editDevRef.trim(),
        passage_text: editDevVersiculo.trim() || null,
        content_html: editDevReflexao.trim(),
        author_name: editDevAutor.trim() || 'Pastor / Equipe Pastoral',
        is_published: true,
      };

      if (devocionalDoDia.id) {
        const { error } = await supabase
          .from('devotionals')
          .update(payload)
          .eq('id', devocionalDoDia.id);

        if (error) throw error;
        alert('✏️ Devocional atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('devotionals')
          .insert([payload]);

        if (error) throw error;
        alert('✅ Devocional publicado com sucesso!');
      }

      setModalDevocionalOpen(false);
      carregarDadosApp();
    } catch (err: any) {
      alert('Erro ao salvar devocional: ' + err.message);
    } finally {
      setSavingDevocional(false);
    }
  };

  const handleGerarImagemStories = async () => {
    setGerandoImagem(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      const gradFundo = ctx.createRadialGradient(540, 400, 50, 540, 960, 1100);
      gradFundo.addColorStop(0, '#38bdf8');
      gradFundo.addColorStop(0.35, '#1e3a8a');
      gradFundo.addColorStop(0.75, '#0f172a');
      gradFundo.addColorStop(1, '#020617');
      
      ctx.fillStyle = gradFundo;
      ctx.fillRect(0, 0, 1080, 1920);

      for (let i = 0; i < 70; i++) {
        const x = Math.random() * 1080;
        const y = Math.random() * 1920;
        const radius = Math.random() * 3 + 1;
        const alpha = Math.random() * 0.5 + 0.1;
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(253, 224, 71, ${alpha})`;
        ctx.fill();
      }

      ctx.strokeStyle = 'rgba(253, 224, 71, 0.45)';
      ctx.lineWidth = 8;
      ctx.strokeRect(50, 80, 980, 1760);

      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 42px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`⛪ ${dadosIgreja.nome_igreja.toUpperCase()}`, 540, 190);

      ctx.fillStyle = '#93c5fd';
      ctx.font = '30px sans-serif';
      ctx.fillText(`DEVOCIONAL DIÁRIO • ${devocionalDoDia.data}`, 540, 245);

      ctx.beginPath();
      ctx.moveTo(200, 280);
      ctx.lineTo(880, 280);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 3;
      ctx.stroke();

      const quebrarTexto = (text: string, maxW: number, font: string) => {
        ctx.font = font;
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
          const width = ctx.measureText(currentLine + ' ' + words[i]).width;
          if (width < maxW) {
            currentLine += ' ' + words[i];
          } else {
            lines.push(currentLine);
            currentLine = words[i];
          }
        }
        lines.push(currentLine);
        return lines;
      };

      ctx.fillStyle = '#ffffff';
      const fontTitulo = 'bold 50px sans-serif';
      const linhasTitulo = quebrarTexto(`"${devocionalDoDia.titulo}"`, 860, fontTitulo);
      
      let yPos = 370;
      ctx.font = fontTitulo;
      linhasTitulo.slice(0, 3).forEach((linha) => {
        ctx.fillText(linha, 540, yPos);
        yPos += 62;
      });

      if (devocionalDoDia.referencia) {
        yPos += 15;
        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText(`📖 ${devocionalDoDia.referencia}`, 540, yPos);
        yPos += 55;
      }

      if (devocionalDoDia.versiculo) {
        ctx.fillStyle = '#e0f2fe';
        const fontVerso = 'italic 30px sans-serif';
        const linhasVerso = quebrarTexto(`"${devocionalDoDia.versiculo}"`, 820, fontVerso);
        
        ctx.font = fontVerso;
        linhasVerso.slice(0, 3).forEach((linha) => {
          ctx.fillText(linha, 540, yPos);
          yPos += 42;
        });
        yPos += 20;
      }

      ctx.beginPath();
      ctx.moveTo(320, yPos);
      ctx.lineTo(760, yPos);
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      yPos += 55;
      ctx.fillStyle = '#f1f5f9';
      const fontReflexao = '31px sans-serif';
      const textoLimpo = devocionalDoDia.reflexao.replace(/<[^>]*>?/gm, '');
      const linhasReflexao = quebrarTexto(textoLimpo, 840, fontReflexao);

      ctx.font = fontReflexao;
      linhasReflexao.slice(0, 13).forEach((linha) => {
        ctx.fillText(linha, 540, yPos);
        yPos += 46;
      });

      ctx.fillStyle = '#fef08a';
      ctx.font = 'italic bold 38px Georgia, serif';
      ctx.textAlign = 'center';
      
      const nomeAutor = devocionalDoDia.autor || 'Pastor / Equipe Pastoral';
      ctx.fillText(`✍️ ${nomeAutor}`, 540, 1710);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '26px sans-serif';
      ctx.fillText(dadosIgreja.nome_igreja, 540, 1755);

      const dataUrl = canvas.toDataURL('image/png');
      setImagemStoryDataUrl(dataUrl);
      setModalStoryGeradoOpen(true);

    } catch (err: any) {
      alert('Erro ao gerar imagem para Stories: ' + err.message);
    } finally {
      setGerandoImagem(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full bg-slate-100 h-[720px] max-h-[92dvh] rounded-3xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col relative select-none">
      
      {/* CABEÇALHO */}
      <div className="bg-blue-900 text-white p-3.5 space-y-2.5 shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-base font-black">📱 App {dadosIgreja.nome_igreja}</h2>
            <p className="text-[10px] text-blue-200">Olá, {membroPerfil?.nome || loggedUser?.nome_usuario || 'Membro'}</p>
          </div>
          {fotoUrl ? (
            <img src={fotoUrl} alt="Foto" className="w-8 h-8 rounded-full border-2 border-white object-cover" />
          ) : (
            <div className="w-8 h-8 bg-blue-800 rounded-full flex items-center justify-center font-bold border-2 border-white text-xs">👤</div>
          )}
        </div>

        {/* BOTÕES DE NAVEGAÇÃO */}
        <div className="space-y-1.5 pt-0.5">
          <div className="grid grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => setSubAbaApp('chat')}
              className={`p-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer font-bold text-xs shadow-sm ${
                subAbaApp === 'chat' 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/30 shadow-lg scale-[1.01]' 
                  : 'bg-emerald-950/40 text-emerald-200 hover:bg-emerald-800/60 border border-emerald-800/30'
              }`}
            >
              <span className="text-base">💬</span>
              <div className="text-left truncate">
                <p className="font-black truncate text-[11px]">Chat Geral</p>
                <p className="text-[9px] opacity-80 font-normal truncate">Mensagens</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSubAbaApp('minha_agenda')}
              className={`p-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer font-bold text-xs shadow-sm ${
                subAbaApp === 'minha_agenda' 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-500/30 shadow-lg scale-[1.01]' 
                  : 'bg-blue-950/40 text-blue-200 hover:bg-blue-800/60 border border-blue-800/30'
              }`}
            >
              <span className="text-base">📅</span>
              <div className="text-left truncate">
                <p className="font-black truncate text-[11px]">Agenda</p>
                <p className="text-[9px] opacity-80 font-normal truncate">Compromissos</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSubAbaApp('perfil')}
              className={`p-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer font-bold text-xs shadow-sm ${
                subAbaApp === 'perfil' 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-500/30 shadow-lg scale-[1.01]' 
                  : 'bg-blue-950/40 text-blue-200 hover:bg-blue-800/60 border border-blue-800/30'
              }`}
            >
              <span className="text-base">👤</span>
              <div className="text-left truncate">
                <p className="font-black truncate text-[11px]">Meu Perfil</p>
                <p className="text-[9px] opacity-80 font-normal truncate">Dados</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSubAbaApp('celula')}
              className={`p-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer font-bold text-xs shadow-sm ${
                subAbaApp === 'celula' 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-500/30 shadow-lg scale-[1.01]' 
                  : 'bg-blue-950/40 text-blue-200 hover:bg-blue-800/60 border border-blue-800/30'
              }`}
            >
              <span className="text-base">🏡</span>
              <div className="text-left truncate">
                <p className="font-black truncate text-[11px]">Célula</p>
                <p className="text-[9px] opacity-80 font-normal truncate">Encontros</p>
              </div>
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => setSubAbaApp('igreja')}
              className={`p-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer font-bold text-xs shadow-sm ${
                subAbaApp === 'igreja' 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-500/30 shadow-lg scale-[1.01]' 
                  : 'bg-blue-950/40 text-blue-200 hover:bg-blue-800/60 border border-blue-800/30'
              }`}
            >
              <span className="text-base">⛪</span>
              <div className="text-left truncate">
                <p className="font-black truncate text-[11px]">A Igreja</p>
                <p className="text-[9px] opacity-80 font-normal truncate">Endereço</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSubAbaApp('cadastro')}
              className={`p-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer font-bold text-xs shadow-sm ${
                subAbaApp === 'cadastro' 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-500/30 shadow-lg scale-[1.01]' 
                  : 'bg-blue-950/40 text-blue-200 hover:bg-blue-800/60 border border-blue-800/30'
              }`}
            >
              <span className="text-base">📝</span>
              <div className="text-left truncate">
                <p className="font-black truncate text-[11px]">Cadastro</p>
                <p className="text-[9px] opacity-80 font-normal truncate">Formulário</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSubAbaApp('contribua')}
              className={`p-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer font-bold text-xs shadow-sm ${
                subAbaApp === 'contribua' 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-500/30 shadow-lg scale-[1.01]' 
                  : 'bg-blue-950/40 text-blue-200 hover:bg-blue-800/60 border border-blue-800/30'
              }`}
            >
              <span className="text-base">💖</span>
              <div className="text-left truncate">
                <p className="font-black truncate text-[11px]">Contribua</p>
                <p className="text-[9px] opacity-80 font-normal truncate">Dízimos</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSubAbaApp('devocional')}
              className={`p-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer font-bold text-xs shadow-sm ${
                subAbaApp === 'devocional' 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-500/30 shadow-lg scale-[1.01]' 
                  : 'bg-blue-950/40 text-blue-200 hover:bg-blue-800/60 border border-blue-800/30'
              }`}
            >
              <span className="text-base">📖</span>
              <div className="text-left truncate">
                <p className="font-black truncate text-[11px]">Devocional</p>
                <p className="text-[9px] opacity-80 font-normal truncate">Palavra</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ÁREA DE CONTEÚDO */}
      <div className="p-3.5 flex-1 overflow-y-auto space-y-3 min-h-0 bg-slate-100 relative">
        {loading ? (
          <p className="text-center py-6 text-xs text-slate-500">Carregando dados...</p>
        ) : (
          <>
            {/* 0. CHAT COM DUAS COLUNAS (ESTILO WHATSAPP COMPLETO) */}
            {subAbaApp === 'chat' && (
              <div className="bg-white rounded-2xl shadow-sm border overflow-hidden flex h-full min-h-[420px] text-xs">
                
                {/* COLUNA ESQUERDA: LISTA DE MEMBROS REAIS ORDENADOS POR CONVERSAS RECENTES */}
                <div className="w-1/3 border-r bg-slate-50 flex flex-col shrink-0">
                  <div className="p-2.5 bg-slate-100 border-b shrink-0 flex justify-between items-center">
                    <div>
                      <h3 className="font-black text-slate-800 text-xs">💬 Conversas</h3>
                      <p className="text-[9px] text-slate-500">Recentes em evidência</p>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
                    {/* Opção Broadcast Geral */}
                    <div
                      onClick={() => setMembroSelecionadoChat(null)}
                      className={`p-2 rounded-xl cursor-pointer transition flex items-center gap-2 ${
                        !membroSelecionadoChat ? 'bg-blue-50 border border-blue-200 shadow-sm' : 'hover:bg-slate-200/60'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow">
                        📢
                      </div>
                      <div className="truncate flex-1">
                        <div className="flex justify-between items-center">
                          <p className="font-black text-slate-900 text-xs truncate">Transmissão Geral</p>
                        </div>
                        <p className="text-[9px] text-emerald-700 font-semibold truncate">Enviar para toda a rede</p>
                      </div>
                    </div>

                    {/* Lista Dinâmica de Membros (Sem Fakes) */}
                    {listaMembrosChat.length === 0 ? (
                      <p className="text-[10px] text-slate-400 text-center py-4 px-2">Nenhum membro cadastrado ainda.</p>
                    ) : (
                      listaMembrosChat.map((m) => {
                        const selecionado = membroSelecionadoChat?.id === m.id;
                        return (
                          <div
                            key={m.id}
                            onClick={() => setMembroSelecionadoChat(m)}
                            className={`p-2 rounded-xl cursor-pointer transition flex items-center justify-between gap-2 ${
                              selecionado ? 'bg-blue-50 border border-blue-200 shadow-sm' : 'hover:bg-slate-200/60'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate flex-1">
                              <div className="relative">
                                <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                                  {m.foto_url ? (
                                    <img src={m.foto_url} alt="" className="w-full h-full rounded-full object-cover" />
                                  ) : (
                                    '👤'
                                  )}
                                </div>
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white"></span>
                              </div>

                              <div className="truncate flex-1">
                                <div className="flex justify-between items-center">
                                  <p className="font-bold text-slate-800 text-xs truncate">{m.nome}</p>
                                </div>
                                <p className="text-[9px] text-slate-500 truncate">
                                  {m.tipo_cadastro || 'Membro'}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* COLUNA DIREITA: JANELA DE CONVERSA */}
                <div className="flex-1 flex flex-col bg-[#efeae2] bg-[radial-gradient(#d1c7bd_1px,transparent_1px)] [background-size:16px_16px] min-h-0">
                  {/* Cabeçalho do Chat */}
                  <div className="bg-[#005e54] text-white p-2.5 flex justify-between items-center shrink-0 shadow-md">
                    <div className="truncate pr-2">
                      <h3 className="font-bold text-xs truncate flex items-center gap-1.5">
                        {membroSelecionadoChat ? `👤 ${membroSelecionadoChat.nome}` : '📢 Transmissão Geral'}
                      </h3>
                      <p className="text-[9px] text-emerald-100 truncate">
                        {membroSelecionadoChat ? `Celular: ${membroSelecionadoChat.celular_principal || 'Não informado'}` : 'Mensagem enviada para todos os membros'}
                      </p>
                    </div>
                    {membroSelecionadoChat && (
                      <button
                        type="button"
                        onClick={() => setMembroSelecionadoChat(null)}
                        className="text-[9px] bg-emerald-900 hover:bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-700 shrink-0 cursor-pointer font-medium"
                      >
                        ⬅️ Voltar Geral
                      </button>
                    )}
                  </div>

                  {/* Mensagens */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0">
                    {mensagensChat.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-500 py-6">
                        <div className="bg-emerald-100/90 border border-emerald-300 text-emerald-900 p-3 rounded-2xl text-center shadow-sm max-w-[80%] space-y-1">
                          <p className="font-bold text-xs">🔒 Nenhuma mensagem ainda</p>
                          <p className="text-[10px]">Envie uma mensagem abaixo para iniciar a conversa!</p>
                        </div>
                      </div>
                    ) : (
                      mensagensChat.map((m) => {
                        const meuMsg = m.sender?.trim().toLowerCase() === emailUsuario?.trim().toLowerCase();
                        return (
                          <div key={m.id} className={`flex flex-col ${meuMsg ? 'items-end' : 'items-start'}`}>
                            {!meuMsg && <span className="text-[9px] font-bold text-emerald-900 px-1 mb-0.5">{m.sender}</span>}
                            
                            <div className={`relative px-3.5 py-2 rounded-2xl max-w-[80%] text-xs shadow-sm break-words ${
                              meuMsg 
                                ? 'bg-[#dcf8c6] text-slate-900 rounded-tr-none border border-[#c1e8b2]' 
                                : 'bg-white text-slate-900 rounded-tl-none border border-slate-200 font-normal'
                            }`}>
                              <p className="leading-relaxed text-[12px]">{m.text}</p>
                              <div className={`flex items-center justify-end gap-1.5 mt-1 select-none ${meuMsg ? 'text-[9px] text-slate-500' : 'text-[9px] text-slate-400'}`}>
                                <span>{m.time || ''}</span>
                                {meuMsg && (
                                  <>
                                    <span className="text-sky-600 font-bold tracking-tighter">✓✓</span>
                                    <button
                                      type="button"
                                      onClick={() => handleExcluirMensagemChat(m.id)}
                                      className="text-rose-600 hover:text-rose-800 ml-1 cursor-pointer font-bold"
                                      title="Excluir mensagem"
                                    >
                                      🗑️
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Input de Envio */}
                  <form onSubmit={handleEnviarMensagemChat} className="p-2.5 border-t bg-[#f0f0f0] flex gap-2 items-center shrink-0 shadow">
                    <input
                      type="text"
                      value={novaMensagemChat}
                      onChange={(e) => setNovaMensagemChat(e.target.value)}
                      placeholder={membroSelecionadoChat ? `Mensagem para ${membroSelecionadoChat.nome}...` : 'Escrever mensagem para todos os membros...'}
                      className="flex-1 border border-slate-300 rounded-full px-4 py-2 text-xs outline-none bg-white focus:ring-2 focus:ring-emerald-600 transition shadow-inner"
                    />
                    <button
                      type="submit"
                      className="h-9 px-4 bg-[#005e54] hover:bg-[#004d44] text-white font-bold rounded-full shadow flex items-center justify-center cursor-pointer text-xs shrink-0 transition active:scale-95 gap-1"
                    >
                      <span>Enviar</span>
                      <span>➤</span>
                    </button>
                  </form>
                </div>

              </div>
            )}

            {/* 1. ABA PERFIL */}
            {subAbaApp === 'perfil' && (
              <div className="bg-white p-3.5 rounded-2xl shadow-sm border space-y-3 text-xs">
                <h3 className="font-black text-blue-900 text-sm border-b pb-1.5">✏️ Editar Meu Cadastro</h3>
                <p className="text-[10px] text-slate-500">
                  Você pode atualizar sua foto de perfil e seu endereço residencial.
                </p>

                <form onSubmit={handleSalvarPerfil} className="space-y-2.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">URL da Foto de Perfil</label>
                    <input
                      type="text"
                      placeholder="Cole a URL ou base64 da imagem"
                      value={fotoUrl}
                      onChange={(e) => setFotoUrl(e.target.value)}
                      className="w-full border rounded-xl p-2 font-mono text-[10px]"
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
                    className="w-full py-2.5 bg-blue-900 text-white font-bold rounded-xl shadow cursor-pointer mt-1"
                  >
                    💾 Atualizar Meu Cadastro
                  </button>
                </form>
              </div>
            )}

            {/* 2. ABA AGENDA & ALARMES */}
            {subAbaApp === 'minha_agenda' && (
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center bg-white p-3 rounded-2xl border shadow-sm">
                  <div>
                    <h3 className="font-black text-blue-900 text-xs flex items-center gap-1.5">
                      📅 Minha Agenda & Alarmes
                    </h3>
                    <p className="text-[9px] text-slate-500">Seus compromissos com alerta sonoro</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAbrirCriarAgenda}
                    className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow cursor-pointer text-xs flex items-center gap-1"
                  >
                    ➕ Criar
                  </button>
                </div>

                {minhaAgenda.length === 0 ? (
                  <div className="p-6 text-center bg-white rounded-2xl border border-dashed text-slate-400 space-y-1.5">
                    <p className="font-bold text-slate-700 text-xs">Sua agenda está vazia.</p>
                    <p className="text-[10px] text-slate-500">Clique em "+ Criar" para agendar um compromisso!</p>
                  </div>
                ) : (
                  minhaAgenda.map((item) => (
                    <div key={item.id} className="bg-white p-3 rounded-2xl border space-y-1 shadow-sm flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-900 text-xs">
                            📅 {item.data} às {item.hora}
                          </span>
                          {item.lembrete_minutos !== undefined && (
                            <span className="text-[9px] bg-amber-50 text-amber-800 font-bold px-1.5 py-0.5 rounded border border-amber-200">
                              🔔 {item.lembrete_minutos}m antes
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-slate-800 text-xs mt-0.5">{item.descricao}</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAbrirEditarAgenda(item)}
                          title="Editar compromisso"
                          className="w-7 h-7 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-xl flex items-center justify-center cursor-pointer transition"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExcluirCompromisso(item.id)}
                          title="Excluir compromisso"
                          className="w-7 h-7 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl flex items-center justify-center cursor-pointer transition"
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
              <div className="space-y-3 text-xs">
                <div className="bg-white p-3.5 rounded-2xl border space-y-2 shadow-sm">
                  <div className="flex justify-between items-center border-b pb-1.5">
                    <h3 className="font-black text-blue-900 text-xs">🏡 {minhaCelula?.nome_celula || 'Minha Célula'}</h3>
                    <button
                      type="button"
                      onClick={handleAbrirCriarReuniao}
                      className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg cursor-pointer text-[10px]"
                    >
                      ➕ Registrar Encontro
                    </button>
                  </div>

                  <p className="text-slate-500 text-[10px]">
                    Líder: <strong>{minhaCelula?.lider || 'Não definido'}</strong> • Dia: <strong>{minhaCelula?.dia_reuniao || 'Segunda'}</strong>
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border space-y-2 shadow-sm">
                  <h4 className="font-bold text-slate-700 uppercase text-[9px] tracking-wider">
                    👥 Integrantes da Célula ({participantesCelula.length})
                  </h4>
                  <div className="space-y-1.5">
                    {participantesCelula.map((p) => (
                      <div key={p.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-xl">
                        <span className="font-bold text-slate-800">{p.nome}</span>
                        <a
                          href={`https://wa.me/${formatarWhatsapp(p.celular_principal)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 cursor-pointer"
                        >
                          💬 WhatsApp
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border space-y-2 shadow-sm">
                  <h4 className="font-bold text-slate-700 uppercase text-[9px] tracking-wider">
                    📋 Histórico de Encontros & Notas
                  </h4>
                  {reunioesCelula.length === 0 ? (
                    <p className="text-slate-400 italic text-center py-2 text-[10px]">Nenhum evento registrado.</p>
                  ) : (
                    reunioesCelula.map((r) => (
                      <div key={r.id} className="p-2.5 bg-slate-50 rounded-xl border space-y-1 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-blue-900 block text-[10px]">
                            📅 {r.data_reuniao?.split('-').reverse().join('/')} às {r.hora_reuniao}
                          </span>
                          {r.estudo_tema && <p className="font-medium text-slate-800 text-[10px]">📘 Estudo: {r.estudo_tema}</p>}
                          {r.comentarios && <p className="text-slate-500 italic text-[9px]">💬 Nota: {r.comentarios}</p>}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAbrirEditarReuniao(r)}
                            className="w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold rounded-lg flex items-center justify-center cursor-pointer text-[10px]"
                            title="Editar Reunião"
                          >
                            ✏️
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExcluirReuniao(r.id)}
                            className="w-6 h-6 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold rounded-lg flex items-center justify-center cursor-pointer text-[10px]"
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
              <div className="bg-white p-4 rounded-2xl border space-y-3 text-xs shadow-sm">
                <h3 className="font-black text-blue-900 text-sm border-b pb-1.5">⛪ Informações da Igreja</h3>

                <div className="bg-slate-50 p-3.5 rounded-xl border space-y-2">
                  <strong className="block text-slate-700">📍 Endereço Oficial</strong>
                  <p className="text-slate-600 font-medium text-[11px]">{dadosIgreja.endereco_completo}</p>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dadosIgreja.endereco_completo)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full text-center py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow cursor-pointer mt-1 text-[11px]"
                  >
                    🗺️ Como Chegar na Igreja (GPS)
                  </a>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border space-y-2">
                  <strong className="block text-slate-700">📸 Redes Sociais</strong>
                  <a
                    href={dadosIgreja.link_instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full text-center py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow cursor-pointer text-[11px]"
                  >
                    📷 Acessar Instagram Oficial
                  </a>
                </div>
              </div>
            )}

            {/* 5. ABA CADASTRO EM ETAPAS */}
            {subAbaApp === 'cadastro' && (
              <div className="bg-white p-3.5 rounded-2xl border shadow-sm space-y-3 text-xs">
                <div className="border-b pb-1.5 flex justify-between items-center">
                  <div>
                    <h3 className="font-black text-blue-900 text-xs">📝 Ficha de Cadastro Oficial</h3>
                    <p className="text-[9px] text-slate-500">Etapa {etapaCadastro} de 3</p>
                  </div>
                  <div className="flex gap-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${etapaCadastro >= 1 ? 'bg-blue-600' : 'bg-slate-200'}`}></span>
                    <span className={`w-2.5 h-2.5 rounded-full ${etapaCadastro >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`}></span>
                    <span className={`w-2.5 h-2.5 rounded-full ${etapaCadastro >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`}></span>
                  </div>
                </div>

                {carregandoCadastro ? (
                  <p className="text-center text-xs text-slate-500 py-4">Carregando informações...</p>
                ) : jaCadastrado && !isAdminOuLider ? (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-center font-bold text-xs space-y-1">
                    <p>🔒 Dados já confirmados e salvos.</p>
                    <p className="text-[9px] text-amber-700">Caso precise alterar algum dado, procure a secretaria da igreja.</p>
                  </div>
                ) : (
                  <form onSubmit={handleFinalizarCadastroUnico} className="space-y-2.5">
                    {etapaCadastro === 1 && (
                      <div className="space-y-2.5">
                        <h4 className="font-bold text-blue-900 bg-blue-50 p-1.5 rounded-lg text-[11px]">1️⃣ Dados Pessoais Básicos</h4>
                        <div>
                          <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">Nome Completo *</label>
                          <input
                            type="text"
                            value={nomeMembro}
                            onChange={(e) => setNomeMembro(e.target.value)}
                            className="w-full border rounded-xl p-2 font-bold text-slate-800 text-xs"
                            required
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">Celular / WhatsApp *</label>
                          <input
                            type="text"
                            value={celularMembro}
                            onChange={(e) => setCelularMembro(e.target.value)}
                            className="w-full border rounded-xl p-2 text-xs"
                            placeholder="(00) 00000-0000"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">Nascimento</label>
                            <input
                              type="date"
                              value={dataNascMembro}
                              onChange={(e) => setDataNascMembro(e.target.value)}
                              className="w-full border rounded-xl p-2 bg-white text-xs"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">Estado Civil</label>
                            <select
                              value={estadoCivil}
                              onChange={(e) => setEstadoCivil(e.target.value)}
                              className="w-full border rounded-xl p-2 bg-white text-xs"
                            >
                              <option value="Solteiro(a)">Solteiro(a)</option>
                              <option value="Casado(a)">Casado(a)</option>
                              <option value="Divorciado(a)">Divorciado(a)</option>
                              <option value="Viúvo(a)">Viúvo(a)</option>
                            </select>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (!nomeMembro.trim()) return alert('Informe seu nome completo para continuar.');
                            setEtapaCadastro(2);
                          }}
                          className="w-full py-2.5 bg-blue-900 text-white font-bold rounded-xl shadow cursor-pointer mt-2 text-xs"
                        >
                          Próxima ➡️
                        </button>
                      </div>
                    )}

                    {etapaCadastro === 2 && (
                      <div className="space-y-2.5">
                        <h4 className="font-bold text-blue-900 bg-blue-50 p-1.5 rounded-lg text-[11px]">2️⃣ Endereço Residencial</h4>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="CEP"
                            value={cepMembro}
                            onChange={(e) => setCepMembro(e.target.value)}
                            className="border rounded-xl p-2 text-xs"
                          />
                          <input
                            type="text"
                            placeholder="Bairro"
                            value={bairroMembro}
                            onChange={(e) => setBairroMembro(e.target.value)}
                            className="col-span-2 border rounded-xl p-2 text-xs"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="Rua / Avenida"
                            value={ruaMembro}
                            onChange={(e) => setRuaMembro(e.target.value)}
                            className="col-span-2 border rounded-xl p-2 text-xs"
                          />
                          <input
                            type="text"
                            placeholder="Nº"
                            value={numeroMembro}
                            onChange={(e) => setNumeroMembro(e.target.value)}
                            className="border rounded-xl p-2 text-xs"
                          />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEtapaCadastro(1)}
                            className="w-1/2 py-2.5 bg-slate-200 font-bold rounded-xl cursor-pointer text-xs"
                          >
                            ⬅️ Voltar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEtapaCadastro(3)}
                            className="w-1/2 py-2.5 bg-blue-900 text-white font-bold rounded-xl shadow cursor-pointer text-xs"
                          >
                            Próxima ➡️
                          </button>
                        </div>
                      </div>
                    )}

                    {etapaCadastro === 3 && (
                      <div className="space-y-2.5">
                        <h4 className="font-bold text-blue-900 bg-blue-50 p-1.5 rounded-lg text-[11px]">3️⃣ Dados Eclesiásticos & Finalização</h4>
                        <div>
                          <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">É batizado(a) nas águas?</label>
                          <select
                            value={batizado}
                            onChange={(e) => setBatizado(e.target.value)}
                            className="w-full border rounded-xl p-2 bg-white text-xs"
                          >
                            <option value="Sim">Sim</option>
                            <option value="Não">Não</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">Observações ou Pedido de Oração</label>
                          <textarea
                            value={observacoesMembro}
                            onChange={(e) => setObservacoesMembro(e.target.value)}
                            className="w-full border rounded-xl p-2 text-xs"
                            rows={2}
                            placeholder="Alguma observação importante..."
                          />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEtapaCadastro(2)}
                            className="w-1/2 py-2.5 bg-slate-200 font-bold rounded-xl cursor-pointer text-xs"
                          >
                            ⬅️ Voltar
                          </button>
                          <button
                            type="submit"
                            className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow cursor-pointer text-xs"
                          >
                            💾 Salvar Cadastro
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
                )}
              </div>
            )}

            {/* 6. ABA CONTRIBUA */}
            {subAbaApp === 'contribua' && (
              <div className="bg-white p-4 rounded-2xl border space-y-3 text-xs shadow-sm">
                <h3 className="font-black text-blue-900 text-sm border-b pb-1.5">💖 Contribua com a Obra</h3>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  "Cada um contribua segundo propôs no seu coração; não com tristeza, ou por necessidade; porque Deus ama ao que dá com alegria." (2 Coríntios 9:7)
                </p>

                <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl space-y-2 text-center">
                  <span className="text-xl">💠</span>
                  <strong className="block text-amber-900 font-bold text-[11px]">Chave PIX (CNPJ da Igreja)</strong>
                  <p className="font-mono text-xs bg-white p-2 rounded-lg border text-slate-700 select-all font-bold">
                    {dadosIgreja.chave_pix || dadosIgreja.cnpj || 'CNPJ não configurado'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const pixChave = dadosIgreja.chave_pix || dadosIgreja.cnpj || '';
                      if (!pixChave) return alert('Nenhum CNPJ/Chave PIX cadastrado para esta igreja.');
                      navigator.clipboard.writeText(pixChave);
                      alert('CNPJ / Chave PIX copiado com sucesso!');
                    }}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow cursor-pointer transition text-[11px]"
                  >
                    📋 Copiar Chave PIX (CNPJ)
                  </button>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border text-[10px] text-slate-500 text-center">
                  Após realizar sua contribuição por dízimo ou oferta, guarde o comprovante. Deus abençoe sua vida e sua generosidade!
                </div>
              </div>
            )}

            {/* 7. ABA DEVOCIONAL */}
            {subAbaApp === 'devocional' && (
              <div className="bg-white p-4 rounded-2xl border space-y-3 text-xs shadow-sm">
                <div className="border-b pb-1.5 flex justify-between items-center">
                  <h3 className="font-black text-blue-900 text-sm flex items-center gap-1.5">
                    📖 Devocional Diário
                  </h3>
                  
                  <div className="flex items-center gap-2">
                    {isAdminOuLider && (
                      <button
                        type="button"
                        onClick={handleAbrirEditarDevocional}
                        className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow text-[10px] flex items-center gap-1 cursor-pointer transition"
                      >
                        ✏️ {devocionalDoDia.id ? 'Editar' : 'Novo'}
                      </button>
                    )}
                    <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                      {devocionalDoDia.data}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 text-white p-4 rounded-2xl shadow-inner">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-blue-300 block">
                    PALAVRA DO DIA
                  </span>
                  
                  <h4 className="font-extrabold text-sm text-yellow-300 leading-snug">
                    "{devocionalDoDia.titulo}"
                  </h4>

                  {devocionalDoDia.versiculo && (
                    <p className="text-xs font-semibold text-blue-100 leading-relaxed italic border-l-2 border-yellow-400 pl-2 my-1">
                      "{devocionalDoDia.versiculo}"
                    </p>
                  )}

                  {devocionalDoDia.referencia && (
                    <p className="text-[10px] text-blue-300 font-bold">
                      📍 {devocionalDoDia.referencia}
                    </p>
                  )}
                </div>

                <div className="space-y-2 text-slate-700 leading-relaxed pt-1">
                  <strong className="block text-slate-800 font-bold text-[11px]">
                    Reflexão:
                  </strong>
                  
                  <div 
                    className="text-[11px] whitespace-pre-wrap text-slate-600 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: devocionalDoDia.reflexao }}
                  />

                  {devocionalDoDia.autor && (
                    <p className="text-[10px] text-slate-500 font-bold italic pt-1 text-right">
                      ✍️ {devocionalDoDia.autor}
                    </p>
                  )}
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleGerarImagemStories}
                    disabled={gerandoImagem}
                    className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition text-[11px] flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    📸 {gerandoImagem ? 'Carregando Cenário Profissional...' : 'Gerar Arte de Stories c/ Foto de Fundo (9:16)'}
                  </button>

                  <button
                    type="button"
                    onClick={handleCompartilharDevocional}
                    className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold rounded-xl transition text-[10px] flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                  >
                    💬 Compartilhar Texto no WhatsApp
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL DE VISUALIZAÇÃO E DOWNLOAD DO STORY */}
      {modalStoryGeradoOpen && (
        <div className="fixed inset-0 bg-slate-950/90 z-50 flex flex-col items-center justify-center p-3">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xs rounded-3xl p-3 flex flex-col items-center space-y-3 shadow-2xl">
            <div className="w-full flex justify-between items-center text-white px-1">
              <span className="font-bold text-xs">📸 Sua Arte para Stories</span>
              <button
                type="button"
                onClick={() => setModalStoryGeradoOpen(false)}
                className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden border-2 border-amber-400/50 shadow-lg bg-black">
              <img
                src={imagemStoryDataUrl}
                alt="Devocional Instagram Story"
                className="w-full h-full object-cover select-none"
              />
            </div>

            <p className="text-[10px] text-amber-300 font-medium text-center">
              💡 <strong>No celular:</strong> Pressione e segure a imagem acima para salvar direto na galeria de fotos!
            </p>

            <div className="flex gap-2 w-full pt-1">
              <a
                href={imagemStoryDataUrl}
                download={`Devocional_Story_${devocionalDoDia.data.replace(/\//g, '-')}.png`}
                className="w-full text-center py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl shadow cursor-pointer text-xs"
              >
                📥 Baixar Imagem no Aparelho
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AGENDA MOBILE */}
      {modalNovaAgenda && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-3xl p-4 space-y-2.5 text-xs shadow-2xl">
            <h3 className="font-black text-blue-900 text-sm border-b pb-1.5">
              {itemEditandoAgenda ? '✏️ Editar Compromisso' : '➕ Novo Compromisso'}
            </h3>
            <form onSubmit={handleSalvarMinhaAgenda} className="space-y-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">Descrição *</label>
                <input
                  type="text"
                  placeholder="Ex: Reunião, Culto..."
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  className="w-full border rounded-xl p-2 font-semibold text-slate-800 text-xs"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">Data</label>
                  <input
                    type="date"
                    value={novaData}
                    onChange={(e) => setNovaData(e.target.value)}
                    className="w-full border rounded-xl p-1.5 font-semibold text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">Hora</label>
                  <input
                    type="time"
                    value={novaHora}
                    onChange={(e) => setNovaHora(e.target.value)}
                    className="w-full border rounded-xl p-1.5 font-semibold text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">🔔 Alarme Sonoro</label>
                <select
                  value={lembreteMinutos}
                  onChange={(e) => setLembreteMinutos(Number(e.target.value))}
                  className="w-full border rounded-xl p-2 bg-white outline-none text-xs"
                >
                  <option value={0}>Na hora exata</option>
                  <option value={5}>5 minutos antes</option>
                  <option value={15}>15 minutos antes</option>
                  <option value={30}>30 minutos antes</option>
                  <option value={60}>1 hora antes</option>
                </select>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setModalNovaAgenda(false)}
                  className="w-full py-2 bg-slate-100 font-bold rounded-xl cursor-pointer hover:bg-slate-200 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow cursor-pointer text-xs"
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
          <div className="bg-white w-full max-w-xs rounded-3xl p-4 space-y-2.5 text-xs shadow-2xl">
            <h3 className="font-black text-blue-900 text-sm border-b pb-1.5">
              {itemEditandoReuniao ? '✏️ Editar Encontro da Célula' : 'Registrar Encontro da Célula'}
            </h3>
            <form onSubmit={handleSalvarReuniaoCelula} className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-0.5 text-[10px]">Data</label>
                  <input type="date" value={dataReuniao} onChange={(e) => setDataReuniao(e.target.value)} className="w-full border rounded-xl p-1.5 text-xs" />
                </div>
                <div>
                  <label className="block font-bold mb-0.5 text-[10px]">Hora</label>
                  <input type="time" value={horaReuniao} onChange={(e) => setHoraReuniao(e.target.value)} className="w-full border rounded-xl p-1.5 text-xs" />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-0.5 text-[10px]">Tema / Estudo</label>
                <input type="text" placeholder="Ex: Lição 4..." value={temaEstudo} onChange={(e) => setTemaEstudo(e.target.value)} className="w-full border rounded-xl p-2 text-xs" />
              </div>

              <div>
                <label className="block font-bold mb-0.5 text-[10px]">Comentários e Notas</label>
                <textarea placeholder="Observações..." value={comentariosCelula} onChange={(e) => setComentariosCelula(e.target.value)} className="w-full border rounded-xl p-2 text-xs" rows={2} />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setItemEditandoReuniao(null);
                    setModalNovaReuniao(false);
                  }}
                  className="w-full py-2 bg-slate-100 font-bold rounded-xl cursor-pointer text-xs"
                >
                  Cancelar
                </button>
                <button type="submit" className="w-full py-2 bg-emerald-700 text-white font-bold rounded-xl shadow cursor-pointer text-xs">
                  {itemEditandoReuniao ? 'Salvar Alterações' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE DEVOCIONAL */}
      {modalDevocionalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-3xl p-4 space-y-2.5 text-xs shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-black text-blue-900 text-sm border-b pb-1.5">
              {devocionalDoDia.id ? '✏️ Editar Devocional' : '➕ Novo Devocional'}
            </h3>
            
            <form onSubmit={handleSalvarDevocionalMobile} className="space-y-2">
              <div>
                <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">Data de Publicação</label>
                <input
                  type="date"
                  value={editDevData}
                  onChange={(e) => setEditDevData(e.target.value)}
                  className="w-full border rounded-xl p-1.5 font-semibold text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">Título da Mensagem *</label>
                <input
                  type="text"
                  placeholder="Ex: O Poder da Oração"
                  value={editDevTitulo}
                  onChange={(e) => setEditDevTitulo(e.target.value)}
                  className="w-full border rounded-xl p-1.5 font-bold text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">Referência Bíblica *</label>
                <input
                  type="text"
                  placeholder="Ex: Mateus 28:18-19"
                  value={editDevRef}
                  onChange={(e) => setEditDevRef(e.target.value)}
                  className="w-full border rounded-xl p-1.5 text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">Versículo / Passagem</label>
                <textarea
                  placeholder="Texto do versículo em destaque"
                  value={editDevVersiculo}
                  onChange={(e) => setEditDevVersiculo(e.target.value)}
                  className="w-full border rounded-xl p-1.5 text-xs"
                  rows={2}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">Reflexão / Mensagem *</label>
                <textarea
                  placeholder="Escreva a reflexão diária..."
                  value={editDevReflexao}
                  onChange={(e) => setEditDevReflexao(e.target.value)}
                  className="w-full border rounded-xl p-1.5 text-xs"
                  rows={4}
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">Autor</label>
                <input
                  type="text"
                  value={editDevAutor}
                  onChange={(e) => setEditDevAutor(e.target.value)}
                  className="w-full border rounded-xl p-1.5 text-xs font-semibold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalDevocionalOpen(false)}
                  className="w-1/2 py-2 bg-slate-100 font-bold rounded-xl cursor-pointer hover:bg-slate-200 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingDevocional}
                  className="w-1/2 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow cursor-pointer text-xs disabled:opacity-50"
                >
                  {savingDevocional ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}