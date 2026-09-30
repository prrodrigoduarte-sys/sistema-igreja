import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from './supabase';

// Chat da igreja: conversas, transmissão geral, quem está online e chamadas de voz/vídeo pelo app.
// É o mesmo componente no aplicativo (AppMobileModule) e no sistema (App.tsx),
// então as mensagens aparecem iguais nos dois lugares.

// Servidores STUN públicos (descobrem o endereço de cada aparelho para a chamada direta).
// Em algumas redes (4G de certas operadoras, Wi-Fi corporativo) a chamada só conecta com um servidor TURN:
// para incluir, acrescente aqui { urls: 'turn:SEU_SERVIDOR:3478', username: '...', credential: '...' }.
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }],
};

interface Chamada {
  estado: 'chamando' | 'recebendo' | 'conectando' | 'em_chamada';
  comEmail: string;
  comNome: string;
  mudo: boolean;
  video: boolean; // chamada de vídeo
  semCamera: boolean; // câmera desligada (ou indisponível)
}

// ── Helpers do chat ──
const rotuloData = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);
  const mesmoDia = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (mesmoDia(d, hoje)) return 'Hoje';
  if (mesmoDia(d, ontem)) return 'Ontem';
  return d.toLocaleDateString('pt-BR');
};

const nomeDoEmail = (email?: string) => {
  const prefixo = (email || '').trim().toLowerCase().split('@')[0].replace(/[._-]+/g, ' ');
  return prefixo ? prefixo.replace(/\b\w/g, (c) => c.toUpperCase()) : 'Membro';
};

// Liga pelo celular; no computador (sem discador) copia o número para você ligar pelo telefone
export const ligarPara = (celular: string, nome?: string) => {
  const digitos = (celular || '').replace(/\D/g, '');
  const numero = digitos.startsWith('55') ? digitos : `55${digitos}`;
  const ehAparelhoMovel = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (ehAparelhoMovel) {
    window.location.href = `tel:+${numero}`;
    return;
  }
  const legivel = celular;
  navigator.clipboard?.writeText(legivel).catch(() => {});
  alert(`📞 ${nome || 'Contato'}\n${legivel}\n\nNo computador não dá para ligar direto. O número foi copiado: disque pelo seu celular.`);
};

// "ALINE DAMASCENO DUARTE" -> "Aline Damasceno Duarte"
export const nomeBonito = (nome?: string) => {
  const minusculas = ['de', 'da', 'do', 'das', 'dos', 'e'];
  return (nome || '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((p, i) => (i > 0 && minusculas.includes(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(' ');
};

// Mensagens antigas foram gravadas com este prefixo; não faz sentido exibi-lo
const limparTexto = (t?: string) => (t || '').replace(/^\s*\[TRANSMISSÃO PARA TODOS\]\s*/i, '');

const horaMsg = (m: any) => {
  if (m.created_at) {
    const d = new Date(m.created_at);
    if (!isNaN(d.getTime())) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  return m.time || '';
};

const IconePerfil = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
  </svg>
);

interface Props {
  loggedUser: any;
  // false = o chat continua ligado (online e recebendo chamadas), só não mostra a conversa
  visivel?: boolean;
  // se informado, mostra o botão "Voltar ao app" no celular
  onVoltar?: () => void;
}

export default function ChatModule({ loggedUser, visivel = true, onVoltar }: Props) {
  // ── Estado do chat ──
  const [listaMembrosChat, setListaMembrosChat] = useState<any[]>([]);
  const [membroSelecionadoChat, setMembroSelecionadoChat] = useState<any>(null);
  const [todasMensagens, setTodasMensagens] = useState<any[]>([]);
  const [novaMensagemChat, setNovaMensagemChat] = useState('');
  const [buscaChat, setBuscaChat] = useState('');
  const [avisoMembros, setAvisoMembros] = useState('');
  const [telaChat, setTelaChat] = useState<'lista' | 'conversa'>('lista'); // usado só em telas pequenas
  const msgsContainerRef = useRef<HTMLDivElement | null>(null);

  const codigoIgreja = loggedUser?.codigo_igreja || loggedUser?.igrejas?.codigo_igreja || 'IGR-001';
  const emailUsuario = loggedUser?.email?.trim().toLowerCase() || loggedUser?.usuario || 'admin@sistema.com';

  // Meu cadastro em members (id e nome), para reconhecer as minhas conversas
  const [membroPerfil, setMembroPerfil] = useState<any>(null);
  useEffect(() => {
    if (!emailUsuario) return;
    supabase
      .from('members')
      .select('id, nome')
      .eq('email', emailUsuario)
      .eq('codigo_igreja', codigoIgreja)
      .maybeSingle()
      .then(({ data }) => setMembroPerfil(data || null));
  }, [emailUsuario, codigoIgreja]);

  // ── CHAT: carregar membros (não depende de nenhum estado que mude sozinho) ──
  const carregarMembrosChat = useCallback(async () => {
    try {
      // Só colunas leves: foto_url pode conter imagem em base64 e derrubar a consulta por timeout
      const { data, error } = await supabase
        .from('members')
        .select('id, nome, email, celular_principal, tipo_cadastro')
        .eq('codigo_igreja', codigoIgreja)
        .not('email', 'is', null)
        .order('nome', { ascending: true })
        .limit(500);
      if (error) {
        console.error('Erro ao ler members:', error);
        setAvisoMembros(`Não foi possível ler a tabela members: ${error.message}`);
        return;
      }
      setAvisoMembros('');

      // A conversa é identificada pelo e-mail (é o que fica gravado em sender/recipient_id).
      // Membros sem e-mail não têm como receber mensagem e ficam de fora.
      const vistos = new Set<string>();
      const lista = (data || [])
        .filter((m: any) => m.nome && m.email && String(m.email).trim())
        .map((m: any) => ({
          id: String(m.id),
          nome: nomeBonito(m.nome),
          email: String(m.email).trim().toLowerCase(),
          celular_principal: m.celular_principal || '',
          tipo_cadastro: m.tipo_cadastro || 'Membro',
          foto_url: '',
        }))
        .filter((m: any) => (vistos.has(m.email) ? false : (vistos.add(m.email), true)));

      setListaMembrosChat(lista);
    } catch (err) {
      console.error('Erro ao carregar membros do chat:', err);
    }
  }, [codigoIgreja]);

  // ── CHAT: uma única busca traz todas as mensagens; o filtro é feito em memória (useMemo) ──
  const carregarMensagensChat = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('chat_mensagens')
        .select('*')
        .eq('codigo_igreja', codigoIgreja)
        .order('created_at', { ascending: false }) // as 1000 mais recentes...
        .limit(1000);
      if (error) throw error;
      if (data) data.reverse(); // ...exibidas da mais antiga para a mais nova
      if (data) {
        setTodasMensagens((prev) => {
          const igual =
            prev.length === data.length &&
            prev[0]?.id === data[0]?.id &&
            prev[prev.length - 1]?.id === data[data.length - 1]?.id;
          return igual ? prev : data;
        });
      }
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
    }
  }, [codigoIgreja]);

  // Se a leitura dos nomes falhar (ex.: timeout do banco), tenta de novo sozinho a cada 10s
  useEffect(() => {
    if (!avisoMembros) return;
    const t = setInterval(() => carregarMembrosChat(), 10000);
    return () => clearInterval(t);
  }, [avisoMembros, carregarMembrosChat]);

  // Chat: carga inicial + tempo real + atualização de segurança a cada 8s
  useEffect(() => {
    carregarMembrosChat();
    carregarMensagensChat();
  }, [carregarMembrosChat, carregarMensagensChat]);

  useEffect(() => {
    const canal = supabase
      .channel('chat_mensagens_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_mensagens' }, () => {
        carregarMensagensChat();
      })
      .subscribe();

    const timer = setInterval(() => {
      if (visivel) carregarMensagensChat();
    }, 8000);

    return () => {
      clearInterval(timer);
      supabase.removeChannel(canal);
    };
  }, [carregarMensagensChat, visivel]);

  // ── CHAT: dados derivados ──
  const meuId = useMemo(
    () => String(membroPerfil?.id ?? listaMembrosChat.find((m) => m.email === emailUsuario)?.id ?? ''),
    [membroPerfil, listaMembrosChat, emailUsuario]
  );

  const nomePorEmail = useMemo(() => {
    const mapa: Record<string, string> = {};
    listaMembrosChat.forEach((m) => {
      mapa[m.email] = m.nome;
    });
    return mapa;
  }, [listaMembrosChat]);

  const emailPorId = useMemo(() => {
    const mapa: Record<string, string> = {};
    listaMembrosChat.forEach((m) => {
      mapa[String(m.id)] = m.email;
    });
    return mapa;
  }, [listaMembrosChat]);

  // Dada uma mensagem privada, devolve o e-mail da OUTRA pessoa da conversa (ou null se não for comigo)
  const outroDaMensagem = useCallback(
    (m: any): string | null => {
      if (m.is_broadcast) return null;
      const s = (m.sender || '').trim().toLowerCase();
      const r = String(m.recipient_id ?? '').trim().toLowerCase();
      if (!s || !r) return null;
      if (s === emailUsuario) return r.includes('@') ? r : emailPorId[r] || null; // recipient antigo era um id
      if (r === emailUsuario || (meuId && r === meuId.toLowerCase())) return s;
      return null;
    },
    [emailUsuario, meuId, emailPorId]
  );

  const mensagensChat = useMemo(() => {
    if (!membroSelecionadoChat) return todasMensagens.filter((m) => m.is_broadcast);
    const emailOutro = membroSelecionadoChat.email?.trim().toLowerCase();
    return todasMensagens.filter((m) => outroDaMensagem(m) === emailOutro);
  }, [todasMensagens, membroSelecionadoChat, outroDaMensagem]);

  // Lista lateral: membros com e-mail + quem já conversou comigo mas não tem cadastro; ordenada pela última mensagem
  const membrosOrdenados = useMemo(() => {
    const ultima: Record<string, { ts: number; texto: string }> = {};

    todasMensagens.forEach((m, idx) => {
      const outro = outroDaMensagem(m);
      if (!outro) return;
      const ts = (m.created_at ? new Date(m.created_at).getTime() : 0) || idx + 1;
      if (!ultima[outro] || ts >= ultima[outro].ts) {
        const minha = (m.sender || '').trim().toLowerCase() === emailUsuario;
        ultima[outro] = { ts, texto: `${minha ? 'Você: ' : ''}${limparTexto(m.text)}` };
      }
    });

    const base = listaMembrosChat.filter((m) => m.email !== emailUsuario);
    const conhecidos = new Set(base.map((m) => m.email));
    const fantasmas = Object.keys(ultima)
      .filter((email) => !conhecidos.has(email) && email !== emailUsuario)
      .map((email) => ({
        id: email,
        nome: nomeDoEmail(email),
        email,
        celular_principal: '',
        tipo_cadastro: 'E-mail sem cadastro em members',
        foto_url: '',
      }));

    const termo = buscaChat.trim().toLowerCase();
    return [...base, ...fantasmas]
      .filter((m) => !termo || m.nome?.toLowerCase().includes(termo))
      .map((m) => ({ ...m, _ultima: ultima[m.email] }))
      .sort((a, b) => {
        const ta = a._ultima?.ts || 0;
        const tb = b._ultima?.ts || 0;
        if (ta !== tb) return tb - ta;
        return (a.nome || '').localeCompare(b.nome || '');
      });
  }, [listaMembrosChat, todasMensagens, emailUsuario, buscaChat, outroDaMensagem]);

  // Rolagem automática para a última mensagem
  // (scrollIntoView movia a página inteira no celular e causava o "tremor"; aqui só rola a lista)
  useEffect(() => {
    const el = msgsContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [mensagensChat.length, membroSelecionadoChat, telaChat, visivel]);

  // Nome de quem enviou (nunca mostra o e-mail completo)
  const nomeDoRemetente = (email?: string) => {
    const chave = email?.trim().toLowerCase() || '';
    if (chave === emailUsuario) return membroPerfil?.nome || loggedUser?.nome_usuario || 'Você';
    if (nomePorEmail[chave]) return nomePorEmail[chave];
    return nomeDoEmail(chave);
  };

  const abrirConversa = (membro: any | null) => {
    setMembroSelecionadoChat(membro);
    setTelaChat('conversa');
  };

  const handleEnviarMensagemChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const texto = novaMensagemChat.trim();
    if (!texto) return;

    setNovaMensagemChat('');
    try {
      const payload: any = {
        codigo_igreja: codigoIgreja,
        sender: emailUsuario,
        text: texto,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        is_broadcast: !membroSelecionadoChat,
      };
      if (membroSelecionadoChat) payload.recipient_id = membroSelecionadoChat.email;

      const { error } = await supabase.from('chat_mensagens').insert([payload]);
      if (error) throw error;
      carregarMensagensChat();
    } catch (err: any) {
      setNovaMensagemChat(texto);
      alert('Erro ao enviar mensagem: ' + err.message);
    }
  };

  const handleExcluirMensagemChat = async (id: string) => {
    if (!window.confirm('Deseja excluir esta mensagem?')) return;
    try {
      const { error } = await supabase.from('chat_mensagens').delete().eq('id', id);
      if (error) throw error;
      setTodasMensagens((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      alert('Erro ao excluir mensagem: ' + err.message);
    }
  };

  // ═════════ PRESENÇA (online/offline) + CHAMADAS DE VOZ INTERNAS (WebRTC) ═════════
  const [emailsOnline, setEmailsOnline] = useState<string[]>([]);
  const [chamada, setChamadaState] = useState<Chamada | null>(null);
  const [segundosChamada, setSegundosChamada] = useState(0);
  const [avisoChamada, setAvisoChamada] = useState('');

  const chamadaRef = useRef<Chamada | null>(null);
  const canalRef = useRef<any>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamLocalRef = useRef<MediaStream | null>(null);
  const audioRemotoRef = useRef<HTMLVideoElement | null>(null); // toca o áudio e, em vídeo, mostra a imagem
  const videoLocalRef = useRef<HTMLVideoElement | null>(null);
  const ofertaRecebidaRef = useRef<any>(null);
  const icePendenteRef = useRef<any[]>([]);
  const timeoutChamadaRef = useRef<any>(null);
  const toqueRef = useRef<any>(null);
  const avisoTimerRef = useRef<any>(null);
  const sinalRef = useRef<(p: any) => void>(() => {});
  const saiuRef = useRef<(email: string) => void>(() => {});
  const limparRef = useRef<() => void>(() => {});

  const emailsOnlineSet = useMemo(() => new Set(emailsOnline), [emailsOnline]);
  const estaOnline = (email?: string) => !!email && emailsOnlineSet.has(email.trim().toLowerCase());
  const nomeMeu = nomeBonito(membroPerfil?.nome || loggedUser?.nome_usuario || emailUsuario.split('@')[0]);

  const setChamada = (c: Chamada | null) => {
    chamadaRef.current = c;
    setChamadaState(c);
  };

  const mostrarAviso = (msg: string) => {
    setAvisoChamada(msg);
    clearTimeout(avisoTimerRef.current);
    avisoTimerRef.current = setTimeout(() => setAvisoChamada(''), 4500);
  };

  const enviarSinal = (payload: any) => {
    canalRef.current?.send({
      type: 'broadcast',
      event: 'sinal',
      payload: { ...payload, de: emailUsuario, deNome: nomeMeu },
    });
  };

  const pararToque = () => {
    if (toqueRef.current) {
      clearInterval(toqueRef.current.timer);
      try {
        toqueRef.current.ctx.close();
      } catch {}
      toqueRef.current = null;
    }
    try {
      navigator.vibrate?.(0);
    } catch {}
  };

  const tocarToque = () => {
    pararToque();
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      const bip = () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 480;
        gain.gain.value = 0.08;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
        try {
          navigator.vibrate?.([400, 200, 400]);
        } catch {}
      };
      bip();
      toqueRef.current = { ctx, timer: setInterval(bip, 2500) };
    } catch {}
  };

  const limparChamada = () => {
    clearTimeout(timeoutChamadaRef.current);
    pararToque();
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    streamLocalRef.current?.getTracks().forEach((t) => t.stop());
    streamLocalRef.current = null;
    if (audioRemotoRef.current) audioRemotoRef.current.srcObject = null;
    if (videoLocalRef.current) videoLocalRef.current.srcObject = null;
    ofertaRecebidaRef.current = null;
    icePendenteRef.current = [];
    setSegundosChamada(0);
    setChamada(null);
  };
  limparRef.current = limparChamada;

  const encerrarChamada = () => {
    const c = chamadaRef.current;
    if (c) enviarSinal({ tipo: 'fim', para: c.comEmail });
    limparChamada();
  };

  // Pede microfone (e câmera, se for vídeo). Se a câmera falhar, segue só com áudio.
  const obterMicrofone = async (comVideo = false): Promise<{ stream: MediaStream; temCamera: boolean } | null> => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Chamadas só funcionam em conexão segura (https). Abra o app pelo endereço https.');
      return null;
    }
    const audio = { echoCancellation: true, noiseSuppression: true };
    try {
      if (comVideo) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio,
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24, max: 30 } },
          });
          return { stream, temCamera: true };
        } catch {
          mostrarAviso('Câmera indisponível: você seguirá só com áudio.');
        }
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio });
      return { stream, temCamera: false };
    } catch {
      alert('Não foi possível usar o microfone. Permita o acesso ao microfone nas configurações do navegador e tente de novo.');
      return null;
    }
  };

  const criarPeer = (comEmail: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pc.onicecandidate = (e) => {
      if (e.candidate) enviarSinal({ tipo: 'ice', para: comEmail, candidate: e.candidate.toJSON() });
    };
    pc.ontrack = (e) => {
      if (audioRemotoRef.current) {
        audioRemotoRef.current.srcObject = e.streams[0];
        audioRemotoRef.current.play().catch(() => {});
      }
    };
    pc.onconnectionstatechange = () => {
      const c = chamadaRef.current;
      if (!c) return;
      if (pc.connectionState === 'connected') setChamada({ ...c, estado: 'em_chamada' });
      if (pc.connectionState === 'failed') {
        limparChamada();
        mostrarAviso('Não foi possível conectar a chamada. A rede pode estar bloqueando a ligação direta.');
      }
    };
    return pc;
  };

  const aplicarIcePendente = async (pc: RTCPeerConnection) => {
    const lista = icePendenteRef.current;
    icePendenteRef.current = [];
    for (const cand of lista) {
      try {
        await pc.addIceCandidate(cand);
      } catch {}
    }
  };

  const iniciarChamada = async (membro: any, comVideo = false) => {
    if (chamadaRef.current) return alert('Você já está em uma chamada.');
    if (!estaOnline(membro.email)) return alert(`${membro.nome} não está online agora.`);

    const midia = await obterMicrofone(comVideo);
    if (!midia) return;
    const stream = midia.stream;
    streamLocalRef.current = stream;
    setChamada({ estado: 'chamando', comEmail: membro.email, comNome: membro.nome, mudo: false, video: comVideo, semCamera: comVideo && !midia.temCamera });

    try {
      const pc = criarPeer(membro.email);
      pcRef.current = pc;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      const oferta = await pc.createOffer();
      await pc.setLocalDescription(oferta);
      enviarSinal({ tipo: 'oferta', para: membro.email, video: comVideo, sdp: { type: oferta.type, sdp: oferta.sdp } });
      timeoutChamadaRef.current = setTimeout(() => {
        if (chamadaRef.current?.estado === 'chamando') {
          encerrarChamada();
          mostrarAviso(`${membro.nome} não atendeu.`);
        }
      }, 45000);
    } catch {
      limparChamada();
      mostrarAviso('Não foi possível iniciar a chamada.');
    }
  };

  const atenderChamada = async () => {
    const c = chamadaRef.current;
    const oferta = ofertaRecebidaRef.current;
    if (!c || !oferta) return;
    clearTimeout(timeoutChamadaRef.current);
    pararToque();

    const midia = await obterMicrofone(c.video);
    if (!midia) {
      enviarSinal({ tipo: 'recusa', para: c.comEmail });
      limparChamada();
      return;
    }
    const stream = midia.stream;
    streamLocalRef.current = stream;
    setChamada({ ...c, estado: 'conectando', semCamera: c.video && !midia.temCamera });

    try {
      const pc = criarPeer(c.comEmail);
      pcRef.current = pc;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      await pc.setRemoteDescription(oferta);
      await aplicarIcePendente(pc);
      const resposta = await pc.createAnswer();
      await pc.setLocalDescription(resposta);
      enviarSinal({ tipo: 'resposta', para: c.comEmail, sdp: { type: resposta.type, sdp: resposta.sdp } });
    } catch {
      enviarSinal({ tipo: 'fim', para: c.comEmail });
      limparChamada();
      mostrarAviso('Não foi possível atender a chamada.');
    }
  };

  const recusarChamada = () => {
    const c = chamadaRef.current;
    if (c) enviarSinal({ tipo: 'recusa', para: c.comEmail });
    limparChamada();
  };

  const alternarMudo = () => {
    const c = chamadaRef.current;
    if (!c) return;
    streamLocalRef.current?.getAudioTracks().forEach((t) => (t.enabled = c.mudo));
    setChamada({ ...c, mudo: !c.mudo });
  };

  const alternarCamera = () => {
    const c = chamadaRef.current;
    if (!c || !c.video) return;
    const faixas = streamLocalRef.current?.getVideoTracks() || [];
    if (faixas.length === 0) return;
    faixas.forEach((t) => (t.enabled = c.semCamera));
    setChamada({ ...c, semCamera: !c.semCamera });
  };

  // Mostra a própria imagem no cantinho da tela
  useEffect(() => {
    if (chamada?.video && videoLocalRef.current) videoLocalRef.current.srcObject = streamLocalRef.current;
  }, [chamada?.video, chamada?.estado]);

  const tratarSinal = async (p: any) => {
    if (!p || (p.para || '').toLowerCase() !== emailUsuario) return;
    const de = (p.de || '').toLowerCase();
    const c = chamadaRef.current;

    if (p.tipo === 'oferta') {
      if (c) {
        enviarSinal({ tipo: 'ocupado', para: de });
        return;
      }
      ofertaRecebidaRef.current = p.sdp;
      icePendenteRef.current = [];
      setChamada({
        estado: 'recebendo',
        comEmail: de,
        comNome: p.deNome ? nomeBonito(p.deNome) : nomePorEmail[de] || nomeDoEmail(de),
        mudo: false,
        video: !!p.video,
        semCamera: false,
      });
      tocarToque();
      clearTimeout(timeoutChamadaRef.current);
      timeoutChamadaRef.current = setTimeout(() => {
        if (chamadaRef.current?.estado === 'recebendo') {
          const nome = chamadaRef.current.comNome;
          limparChamada();
          mostrarAviso(`Chamada perdida de ${nome}.`);
        }
      }, 45000);
      return;
    }

    if (!c || c.comEmail !== de) return;

    if (p.tipo === 'resposta' && pcRef.current) {
      clearTimeout(timeoutChamadaRef.current);
      setChamada({ ...c, estado: 'conectando' });
      try {
        await pcRef.current.setRemoteDescription(p.sdp);
        await aplicarIcePendente(pcRef.current);
      } catch {
        limparChamada();
        mostrarAviso('Falha ao conectar a chamada.');
      }
    } else if (p.tipo === 'ice') {
      if (pcRef.current?.remoteDescription) {
        try {
          await pcRef.current.addIceCandidate(p.candidate);
        } catch {}
      } else {
        icePendenteRef.current.push(p.candidate);
      }
    } else if (p.tipo === 'recusa') {
      limparChamada();
      mostrarAviso(`${c.comNome} recusou a chamada.`);
    } else if (p.tipo === 'ocupado') {
      limparChamada();
      mostrarAviso(`${c.comNome} está em outra chamada.`);
    } else if (p.tipo === 'fim') {
      const perdida = c.estado === 'recebendo';
      limparChamada();
      mostrarAviso(perdida ? `Chamada perdida de ${c.comNome}.` : 'Chamada encerrada.');
    }
  };
  sinalRef.current = tratarSinal;
  saiuRef.current = (email: string) => {
    const c = chamadaRef.current;
    if (c && c.comEmail === email.trim().toLowerCase()) {
      limparChamada();
      mostrarAviso(`${c.comNome} saiu do app.`);
    }
  };

  // Um único canal por igreja: presença (quem está online) + sinais da chamada
  useEffect(() => {
    if (!emailUsuario) return;
    const canal = supabase.channel(`app_${codigoIgreja}`, {
      config: { presence: { key: emailUsuario }, broadcast: { self: false } },
    });
    canal
      .on('presence', { event: 'sync' }, () => {
        setEmailsOnline(Object.keys(canal.presenceState()).map((k) => k.toLowerCase()));
      })
      .on('presence', { event: 'leave' }, ({ key }: any) => saiuRef.current(key || ''))
      .on('broadcast', { event: 'sinal' }, ({ payload }: any) => {
        sinalRef.current(payload);
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') await canal.track({ email: emailUsuario, desde: new Date().toISOString() });
      });
    canalRef.current = canal;
    return () => {
      supabase.removeChannel(canal);
      canalRef.current = null;
    };
  }, [emailUsuario, codigoIgreja]);

  // Cronômetro da chamada
  useEffect(() => {
    if (chamada?.estado !== 'em_chamada') return;
    setSegundosChamada(0);
    const t = setInterval(() => setSegundosChamada((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, [chamada?.estado]);

  // Ao sair do app, encerra a chamada e libera o microfone
  useEffect(() => () => limparRef.current(), []);

  // ── JSX do chat ──
  const renderChat = () => {
    let dataAnterior = '';
    const nomeConversa = membroSelecionadoChat ? membroSelecionadoChat.nome : 'Transmissão Geral';

    return (
      <div className="flex-1 min-h-0 flex bg-white text-xs overflow-hidden">
        {/* LISTA DE CONVERSAS */}
        <aside
          className={`${telaChat === 'conversa' ? 'hidden' : 'flex'} md:flex w-full md:w-72 md:shrink-0 border-r border-slate-200 bg-white flex-col min-h-0`}
        >
          <div className="px-3 py-2.5 bg-slate-50 border-b border-slate-200 shrink-0 space-y-2">
            <div className="flex items-center gap-2">
              {onVoltar && (
                <button
                  type="button"
                  onClick={onVoltar}
                  className="md:hidden h-8 px-2.5 rounded-full bg-blue-900 text-white text-[11px] font-bold cursor-pointer active:scale-95 shrink-0"
                >
                  ← Voltar ao app
                </button>
              )}
              <h3 className="font-black text-slate-800 text-sm">Conversas</h3>
              <span className="ml-auto text-[10px] font-semibold text-emerald-700">
                {emailsOnline.filter((e) => e !== emailUsuario).length} online
              </span>
            </div>
            <input
              type="text"
              value={buscaChat}
              onChange={(e) => setBuscaChat(e.target.value)}
              placeholder="Buscar membro..."
              className="w-full border border-slate-200 rounded-full px-3 py-1.5 text-base md:text-xs outline-none bg-white focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            <button
              type="button"
              onClick={() => abrirConversa(null)}
              className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 border-b border-slate-100 cursor-pointer transition ${
                !membroSelecionadoChat ? 'bg-emerald-50' : 'hover:bg-slate-50'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center text-base shrink-0">📢</div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 text-[13px] truncate">Transmissão Geral</p>
                <p className="text-[11px] text-emerald-700 truncate">Mensagem para toda a igreja</p>
              </div>
            </button>

            {avisoMembros && (
              <div className="m-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[10px] leading-snug">
                <strong>Nomes indisponíveis.</strong> {avisoMembros}
              </div>
            )}

            {membrosOrdenados.length === 0 ? (
              <p className="text-[11px] text-slate-400 text-center py-6 px-3">Nenhum membro encontrado.</p>
            ) : (
              membrosOrdenados.map((m) => (
                <button
                  key={m.email}
                  type="button"
                  onClick={() => abrirConversa(m)}
                  className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 border-b border-slate-100 cursor-pointer transition ${
                    membroSelecionadoChat?.email === m.email ? 'bg-emerald-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center overflow-hidden">
                      {m.foto_url ? <img src={m.foto_url} alt="" className="w-full h-full object-cover" /> : '👤'}
                    </div>
                    {estaOnline(m.email) && (
                      <span
                        className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"
                        title="Online agora"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-baseline gap-2">
                      <p className="font-bold text-slate-900 text-[13px] truncate">{m.nome}</p>
                      {m._ultima?.ts ? (
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(m._ultima.ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{m._ultima?.texto || m.tipo_cadastro || 'Membro'}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* JANELA DA CONVERSA */}
        <section
          className={`${telaChat === 'lista' ? 'hidden' : 'flex'} md:flex flex-1 min-w-0 min-h-0 flex-col bg-[#efeae2] bg-[radial-gradient(#d9d0c5_1px,transparent_1px)] [background-size:16px_16px]`}
        >
          {/* Cabeçalho da conversa */}
          <div className="bg-[#005e54] text-white px-2.5 py-2 flex items-center gap-2 shrink-0 shadow-md">
            <button
              type="button"
              onClick={() => setTelaChat('lista')}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-emerald-800 cursor-pointer text-base"
              aria-label="Voltar para conversas"
            >
              ←
            </button>
            <div className="w-9 h-9 rounded-full bg-emerald-800 flex items-center justify-center shrink-0 overflow-hidden">
              {membroSelecionadoChat ? (
                membroSelecionadoChat.foto_url ? (
                  <img src={membroSelecionadoChat.foto_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  '👤'
                )
              ) : (
                '📢'
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-[13px] truncate">{nomeConversa}</h3>
              <p className="text-[10px] text-emerald-100 truncate">
                {membroSelecionadoChat ? (
                  <>
                    <span
                      className={`inline-block w-2 h-2 rounded-full mr-1 ${
                        estaOnline(membroSelecionadoChat.email) ? 'bg-emerald-300' : 'bg-slate-400'
                      }`}
                    />
                    {estaOnline(membroSelecionadoChat.email) ? 'online agora' : 'offline'}
                    {membroSelecionadoChat.celular_principal ? ` · ${membroSelecionadoChat.celular_principal}` : ''}
                  </>
                ) : (
                  'Mensagem enviada para todos os membros'
                )}
              </p>
            </div>
            {membroSelecionadoChat && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => iniciarChamada(membroSelecionadoChat)}
                  disabled={!estaOnline(membroSelecionadoChat.email) || !!chamada}
                  title={
                    estaOnline(membroSelecionadoChat.email)
                      ? `Chamar ${membroSelecionadoChat.nome} pelo app`
                      : 'Disponível quando a pessoa estiver online'
                  }
                  className={`h-9 px-3 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition ${
                    estaOnline(membroSelecionadoChat.email) && !chamada
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-white cursor-pointer active:scale-95'
                      : 'bg-emerald-900/60 text-emerald-200/50 cursor-not-allowed'
                  }`}
                  aria-label={`Chamar ${membroSelecionadoChat.nome} pelo app`}
                >
                  <span>📞</span>
                  <span className="hidden sm:inline">Chamar no app</span>
                </button>
                <button
                  type="button"
                  onClick={() => iniciarChamada(membroSelecionadoChat, true)}
                  disabled={!estaOnline(membroSelecionadoChat.email) || !!chamada}
                  title={
                    estaOnline(membroSelecionadoChat.email)
                      ? `Chamada de vídeo com ${membroSelecionadoChat.nome}`
                      : 'Disponível quando a pessoa estiver online'
                  }
                  className={`h-9 px-3 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition ${
                    estaOnline(membroSelecionadoChat.email) && !chamada
                      ? 'bg-sky-500 hover:bg-sky-400 text-white cursor-pointer active:scale-95'
                      : 'bg-sky-900/60 text-sky-200/50 cursor-not-allowed'
                  }`}
                  aria-label={`Chamada de vídeo com ${membroSelecionadoChat.nome}`}
                >
                  <span>🎥</span>
                  <span className="hidden sm:inline">Vídeo</span>
                </button>
                {membroSelecionadoChat.celular_principal && (
                  <button
                    type="button"
                    onClick={() => ligarPara(membroSelecionadoChat.celular_principal, membroSelecionadoChat.nome)}
                    className="h-9 px-3 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition"
                    aria-label={`Ligar para o celular de ${membroSelecionadoChat.nome}`}
                  >
                    <span>📱</span>
                    <span className="hidden sm:inline">Celular</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Mensagens */}
          <div ref={msgsContainerRef} className="flex-1 overflow-y-auto overscroll-contain min-h-0 px-3 py-3 space-y-1.5 select-text">
            {mensagensChat.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-2.5 rounded-xl text-center shadow-sm max-w-[80%]">
                  <p className="font-bold text-xs">Nenhuma mensagem ainda</p>
                  <p className="text-[11px]">Escreva abaixo para iniciar a conversa.</p>
                </div>
              </div>
            ) : (
              mensagensChat.map((m) => {
                const meuMsg = m.sender?.trim().toLowerCase() === emailUsuario;
                const rotulo = rotuloData(m.created_at);
                const mostrarData = rotulo && rotulo !== dataAnterior;
                if (rotulo) dataAnterior = rotulo;
                const nomeRemetente = nomeDoRemetente(m.sender);

                return (
                  <React.Fragment key={m.id}>
                    {mostrarData && (
                      <div className="flex justify-center py-1.5">
                        <span className="bg-white/90 text-slate-500 text-[10px] px-3 py-0.5 rounded-lg shadow-sm">{rotulo}</span>
                      </div>
                    )}

                    <div className={`flex ${meuMsg ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`group relative px-2.5 pt-1.5 pb-1 rounded-lg max-w-[80%] shadow-sm ${
                          meuMsg ? 'bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none'
                        }`}
                      >
                        {!meuMsg && !membroSelecionadoChat && (
                          <p className="text-[10px] font-bold text-emerald-800 mb-0.5 truncate">{nomeRemetente}</p>
                        )}
                        <p className="text-[13px] leading-snug text-slate-900 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                          {limparTexto(m.text)}
                        </p>
                        <div className="flex items-center justify-end gap-1 mt-0.5 text-[10px] text-slate-500 select-none">
                          <span>{horaMsg(m)}</span>
                          {meuMsg && <span className="text-sky-600 font-bold tracking-tighter">✓✓</span>}
                          {meuMsg && (
                            <button
                              type="button"
                              onClick={() => handleExcluirMensagemChat(m.id)}
                              className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-rose-600 hover:text-rose-800 cursor-pointer transition"
                              title="Excluir mensagem"
                              aria-label="Excluir mensagem"
                            >
                              🗑
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            )}
          </div>

          {/* Campo de envio */}
          <form onSubmit={handleEnviarMensagemChat} className="px-2.5 py-2 bg-[#f0f2f5] flex gap-2 items-center shrink-0">
            <input
              type="text"
              value={novaMensagemChat}
              onChange={(e) => setNovaMensagemChat(e.target.value)}
              placeholder={membroSelecionadoChat ? `Mensagem para ${membroSelecionadoChat.nome}` : 'Mensagem para todos os membros'}
              className="flex-1 min-w-0 border border-slate-200 rounded-full px-4 py-2.5 text-base md:text-[13px] outline-none bg-white focus:ring-2 focus:ring-emerald-600"
            />
            <button
              type="submit"
              disabled={!novaMensagemChat.trim()}
              className="w-10 h-10 bg-[#005e54] hover:bg-[#004d44] disabled:opacity-40 text-white rounded-full shadow flex items-center justify-center cursor-pointer shrink-0 transition active:scale-95"
              aria-label="Enviar mensagem"
            >
              ➤
            </button>
          </form>
        </section>
      </div>
    );
  };
  return (
    <>
      {visivel && renderChat()}

      {avisoChamada && (
        <div
          role="status"
          className="fixed top-3 left-1/2 -translate-x-1/2 z-[80] max-w-[90vw] bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg text-center"
        >
          {avisoChamada}
        </div>
      )}

      {chamada && (
        <div className="fixed inset-0 z-[70] bg-slate-950/90 flex items-center justify-center p-4" role="dialog" aria-label={chamada.video ? 'Chamada de vídeo' : 'Chamada de voz'}>
          <div
            className={`w-full rounded-3xl bg-gradient-to-b from-blue-950 to-slate-900 border border-white/10 text-white shadow-2xl overflow-hidden ${
              chamada.video && (chamada.estado === 'em_chamada' || chamada.estado === 'conectando') ? 'max-w-md' : 'max-w-xs'
            }`}
          >
            {/* Vídeo remoto (também toca o áudio das chamadas só de voz) */}
            <div
              className={
                chamada.video && (chamada.estado === 'em_chamada' || chamada.estado === 'conectando')
                  ? 'relative bg-black aspect-[3/4] max-h-[60dvh] w-full'
                  : 'hidden'
              }
            >
              <video ref={audioRemotoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <video
                ref={videoLocalRef}
                autoPlay
                playsInline
                muted
                className={`absolute right-2 bottom-2 w-24 aspect-[3/4] object-cover rounded-xl border-2 border-white/60 bg-slate-800 ${
                  chamada.semCamera ? 'opacity-30' : ''
                }`}
              />
              <p className="absolute left-3 top-3 text-xs font-bold bg-black/50 rounded-full px-2.5 py-1">{chamada.comNome}</p>
            </div>

            <div className="p-6 text-center space-y-5">
              {!(chamada.video && (chamada.estado === 'em_chamada' || chamada.estado === 'conectando')) && (
                <div className="mx-auto w-24 h-24 rounded-full bg-white/5 ring-2 ring-white/20 flex items-center justify-center relative">
                  {(chamada.estado === 'chamando' || chamada.estado === 'recebendo') && (
                    <span className="absolute inset-0 rounded-full ring-4 ring-emerald-400/40 animate-ping motion-reduce:animate-none" />
                  )}
                  <IconePerfil className="w-12 h-12 text-white/90" />
                </div>
              )}

              <div>
                {!(chamada.video && (chamada.estado === 'em_chamada' || chamada.estado === 'conectando')) && (
                  <h3 className="text-lg font-black leading-tight">{chamada.comNome}</h3>
                )}
                <p className="text-xs text-blue-200 mt-1">
                  {chamada.estado === 'chamando' && (chamada.video ? 'Chamando em vídeo…' : 'Chamando…')}
                  {chamada.estado === 'recebendo' && (chamada.video ? 'Chamada de vídeo pelo app' : 'Chamada de voz pelo app')}
                  {chamada.estado === 'conectando' && 'Conectando…'}
                  {chamada.estado === 'em_chamada' &&
                    `${String(Math.floor(segundosChamada / 60)).padStart(2, '0')}:${String(segundosChamada % 60).padStart(2, '0')}`}
                </p>
              </div>

              {chamada.estado === 'recebendo' ? (
                <div className="flex gap-3">
                  <button type="button" onClick={recusarChamada} className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 font-bold text-sm cursor-pointer active:scale-95 transition">
                    Recusar
                  </button>
                  <button type="button" onClick={atenderChamada} className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 font-bold text-sm cursor-pointer active:scale-95 transition">
                    Atender
                  </button>
                </div>
              ) : chamada.estado === 'chamando' ? (
                <button type="button" onClick={encerrarChamada} className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 font-bold text-sm cursor-pointer active:scale-95 transition">
                  Cancelar
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={alternarMudo}
                    className={`flex-1 py-3 rounded-2xl font-bold text-xs cursor-pointer active:scale-95 transition ${
                      chamada.mudo ? 'bg-amber-500 hover:bg-amber-600' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {chamada.mudo ? '🔇 Sem áudio' : '🎙 Microfone'}
                  </button>
                  {chamada.video && (
                    <button
                      type="button"
                      onClick={alternarCamera}
                      disabled={(streamLocalRef.current?.getVideoTracks().length || 0) === 0}
                      className={`flex-1 py-3 rounded-2xl font-bold text-xs cursor-pointer active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed ${
                        chamada.semCamera ? 'bg-amber-500 hover:bg-amber-600' : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      {chamada.semCamera ? '📷 Câmera off' : '🎥 Câmera'}
                    </button>
                  )}
                  <button type="button" onClick={encerrarChamada} className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 font-bold text-xs cursor-pointer active:scale-95 transition">
                    Desligar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
