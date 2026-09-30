import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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

type SubAba = 'perfil' | 'minha_agenda' | 'celula' | 'igreja' | 'cadastro' | 'contribua' | 'devocional' | 'chat';

const ABAS: { id: SubAba; icone: string; titulo: string; sub: string }[] = [
  { id: 'chat', icone: '💬', titulo: 'Chat Geral', sub: 'Mensagens' },
  { id: 'minha_agenda', icone: '📅', titulo: 'Agenda', sub: 'Compromissos' },
  { id: 'perfil', icone: '👤', titulo: 'Meu Perfil', sub: 'Dados' },
  { id: 'celula', icone: '🏡', titulo: 'Célula', sub: 'Encontros' },
  { id: 'igreja', icone: '⛪', titulo: 'A Igreja', sub: 'Endereço' },
  { id: 'cadastro', icone: '📝', titulo: 'Cadastro', sub: 'Formulário' },
  { id: 'contribua', icone: '💖', titulo: 'Contribua', sub: 'Dízimos' },
  { id: 'devocional', icone: '📖', titulo: 'Devocional', sub: 'Palavra' },
];

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

// Reduz a foto no aparelho: recorta quadrado, 256x256, JPEG ~20 KB (a original do celular tem vários MB)
const redimensionarImagem = (arquivo: File, lado = 256, qualidade = 0.75): Promise<string> =>
  new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    leitor.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Arquivo de imagem inválido.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = lado;
        canvas.height = lado;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Não foi possível processar a imagem.'));
        const corte = Math.min(img.width, img.height);
        const sx = (img.width - corte) / 2;
        const sy = (img.height - corte) / 2;
        ctx.drawImage(img, sx, sy, corte, corte, 0, 0, lado, lado);
        resolve(canvas.toDataURL('image/jpeg', qualidade));
      };
      img.src = leitor.result as string;
    };
    leitor.readAsDataURL(arquivo);
  });

// Liga pelo celular; no computador (sem discador) copia o número para você ligar pelo telefone
const ligarPara = (celular: string, nome?: string) => {
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
const nomeBonito = (nome?: string) => {
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

export default function AppMobileModule({ loggedUser }: Props) {
  const [subAbaApp, setSubAbaApp] = useState<SubAba>('devocional');
  const [loading, setLoading] = useState(false);

  const [membroPerfil, setMembroPerfil] = useState<any>(null);
  const [fotoUrl, setFotoUrl] = useState('');
  const [processandoFoto, setProcessandoFoto] = useState(false);
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
  const isAdminOuLider =
    loggedUser?.perfil === 'admin' ||
    loggedUser?.perfil === 'administrador' ||
    loggedUser?.perfil === 'lider' ||
    loggedUser?.funcao === 'admin' ||
    loggedUser?.cargo === 'Pastor';

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
      const { data } = await supabase.from('members').select('*').eq('email', emailUsuario).maybeSingle();

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

        if (data.cadastro_concluido && !isAdminOuLider) setJaCadastrado(true);
      }
    } catch (err) {
      console.error('Erro ao verificar cadastro:', err);
    } finally {
      setCarregandoCadastro(false);
    }
  };

  // ── CHAT: carregar membros (não depende de nenhum estado que mude sozinho) ──
  const carregarMembrosChat = useCallback(async () => {
    try {
      // Só colunas leves: foto_url pode conter imagem em base64 e derrubar a consulta por timeout
      const { data, error } = await supabase
        .from('members')
        .select('id, nome, email, celular_principal, tipo_cadastro')
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
  }, []);

  // ── CHAT: uma única busca traz todas as mensagens; o filtro é feito em memória (useMemo) ──
  const carregarMensagensChat = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('chat_mensagens')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1000);
      if (error) throw error;
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
  }, []);

  // ── Dados gerais do app (NÃO chama mais o chat: era isso que causava o "Carregando dados..." infinito) ──
  const carregarDadosApp = useCallback(async () => {
    setLoading(true);
    try {
      if (emailUsuario) {
        const { data: dataMembro } = await supabase.from('members').select('*').eq('email', emailUsuario).maybeSingle();

        if (dataMembro) {
          setMembroPerfil(dataMembro);
          setFotoUrl(dataMembro.foto_url || '');
          setRua(dataMembro.rua || '');
          setNumero(dataMembro.numero || '');
          setBairro(dataMembro.bairro || '');
          setCidade(dataMembro.cidade || '');

          if (dataMembro.celula_id) {
            const { data: dataCel } = await supabase.from('celulas').select('*').eq('id', dataMembro.celula_id).maybeSingle();
            if (dataCel) setMinhaCelula(dataCel);

            const { data: dataPart } = await supabase
              .from('members')
              .select('id, nome, celular_principal')
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

      const { data: dataIgr } = await supabase.from('igrejas').select('*').maybeSingle();
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

      const { data: dataReunioes } = await supabase.from('reunioes_celulas').select('*').order('data_reuniao', { ascending: false });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregarDadosApp]);

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
      if (subAbaApp === 'chat') carregarMensagensChat();
    }, 8000);

    return () => {
      clearInterval(timer);
      supabase.removeChannel(canal);
    };
  }, [carregarMensagensChat, subAbaApp]);

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
  }, [mensagensChat.length, membroSelecionadoChat, telaChat, subAbaApp]);

  // No celular, o chat ocupa a tela toda: trava a rolagem da página por trás
  useEffect(() => {
    if (subAbaApp !== 'chat') return;
    const ehCelular = window.matchMedia('(max-width: 767px)').matches;
    if (!ehCelular) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [subAbaApp]);

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

  // ── Demais handlers (inalterados) ──
  const handleSalvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!membroPerfil) return alert('Cadastro de membro não localizado.');
    if (fotoUrl.length > 300000) {
      return alert('A foto está muito pesada. Toque em "Escolher foto" para enviar uma versão reduzida.');
    }
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
        const { error } = await supabase.from('members').update(payload).eq('id', membroAtual.id);
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
        const { error } = await supabase.from('agenda_mobile').update(payload).eq('id', itemEditandoAgenda.id);
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
        const { error } = await supabase.from('reunioes_celulas').update(payload).eq('id', itemEditandoReuniao.id);
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
      navigator.share({ title: devocionalDoDia.titulo, text: texto });
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
    if (!editDevTitulo.trim() || !editDevReflexao.trim()) return alert('Preencha o título e o texto da reflexão.');

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
        const { error } = await supabase.from('devotionals').update(payload).eq('id', devocionalDoDia.id);
        if (error) throw error;
        alert('✏️ Devocional atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('devotionals').insert([payload]);
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
      ctx.fillText(`✍️ ${devocionalDoDia.autor || 'Pastor / Equipe Pastoral'}`, 540, 1710);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '26px sans-serif';
      ctx.fillText(dadosIgreja.nome_igreja, 540, 1755);

      setImagemStoryDataUrl(canvas.toDataURL('image/png'));
      setModalStoryGeradoOpen(true);
    } catch (err: any) {
      alert('Erro ao gerar imagem para Stories: ' + err.message);
    } finally {
      setGerandoImagem(false);
    }
  };

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
              <button
                type="button"
                onClick={() => setSubAbaApp('devocional')}
                className="md:hidden h-8 px-2.5 rounded-full bg-blue-900 text-white text-[11px] font-bold cursor-pointer active:scale-95 shrink-0"
              >
                ← Voltar ao app
              </button>
              <h3 className="font-black text-slate-800 text-sm">Conversas</h3>
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
                  <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 overflow-hidden">
                    {m.foto_url ? <img src={m.foto_url} alt="" className="w-full h-full object-cover" /> : '👤'}
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
                {membroSelecionadoChat
                  ? `Celular: ${membroSelecionadoChat.celular_principal || 'não informado'}`
                  : 'Mensagem enviada para todos os membros'}
              </p>
            </div>
            {membroSelecionadoChat?.celular_principal && (
              <button
                type="button"
                onClick={() => ligarPara(membroSelecionadoChat.celular_principal, membroSelecionadoChat.nome)}
                className="shrink-0 h-9 px-3 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition"
                aria-label={`Ligar para ${membroSelecionadoChat.nome}`}
              >
                <span>📞</span>
                <span>Ligar</span>
              </button>
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

  const estilosAba = (ativa: boolean, id: SubAba) => {
    if (!ativa) return 'bg-blue-950/40 text-blue-200 hover:bg-blue-800/60 border border-blue-800/30';
    return id === 'chat'
      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/30 shadow-lg'
      : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-500/30 shadow-lg';
  };

  // No celular, ao abrir uma conversa, esconde o menu para ganhar espaço (como no WhatsApp)
  const esconderMenu = subAbaApp === 'chat';

  return (
    <div
      className={`max-w-4xl mx-auto w-full bg-slate-100 h-[720px] max-h-[92dvh] rounded-3xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col relative ${
        subAbaApp === 'chat'
          ? 'max-md:fixed max-md:inset-0 max-md:z-40 max-md:h-[100dvh] max-md:max-h-none max-md:rounded-none max-md:border-0 max-md:shadow-none'
          : ''
      }`}
    >
      {/* CABEÇALHO (no celular some por completo dentro do chat) */}
      <div className={`bg-blue-900 text-white p-3.5 space-y-2.5 shrink-0 ${esconderMenu ? 'hidden md:block' : ''}`}>
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5">
          {ABAS.map((aba) => (
            <button
              key={aba.id}
              type="button"
              onClick={() => setSubAbaApp(aba.id)}
              className={`p-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer font-bold text-xs shadow-sm select-none ${estilosAba(
                subAbaApp === aba.id,
                aba.id
              )}`}
            >
              <span className="text-base">{aba.icone}</span>
              <div className="text-left truncate">
                <p className="font-black truncate text-[11px]">{aba.titulo}</p>
                <p className="text-[9px] opacity-80 font-normal truncate">{aba.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ÁREA DE CONTEÚDO */}
      {subAbaApp === 'chat' ? (
        renderChat()
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-3 bg-slate-100 relative">
          {loading ? (
            <p className="text-center py-6 text-xs text-slate-500">Carregando dados...</p>
          ) : (
            <>
              {/* 1. ABA PERFIL */}
              {subAbaApp === 'perfil' && (
                <div className="bg-white p-3.5 rounded-2xl shadow-sm border space-y-3 text-xs">
                  <h3 className="font-black text-blue-900 text-sm border-b pb-1.5">✏️ Editar Meu Cadastro</h3>
                  <p className="text-[10px] text-slate-500">Você pode atualizar sua foto de perfil e seu endereço residencial.</p>

                  <form onSubmit={handleSalvarPerfil} className="space-y-2.5">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Foto de Perfil</label>
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                          {fotoUrl ? <img src={fotoUrl} alt="" className="w-full h-full object-cover" /> : '👤'}
                        </div>
                        <label className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold rounded-xl cursor-pointer text-[11px] border border-blue-200">
                          {processandoFoto ? 'Processando...' : '📷 Escolher foto'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const arquivo = e.target.files?.[0];
                              if (!arquivo) return;
                              setProcessandoFoto(true);
                              try {
                                setFotoUrl(await redimensionarImagem(arquivo));
                              } catch (err: any) {
                                alert(err.message);
                              } finally {
                                setProcessandoFoto(false);
                                e.target.value = '';
                              }
                            }}
                          />
                        </label>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">A foto é reduzida automaticamente. Depois toque em "Atualizar Meu Cadastro".</p>
                    </div>

                    <div className="space-y-2 border-t pt-2">
                      <label className="block font-bold text-slate-700">Endereço Residencial</label>
                      <div className="grid grid-cols-3 gap-2">
                        <input type="text" placeholder="Rua / Av." value={rua} onChange={(e) => setRua(e.target.value)} className="col-span-2 border rounded-xl p-2" />
                        <input type="text" placeholder="Nº" value={numero} onChange={(e) => setNumero(e.target.value)} className="border rounded-xl p-2" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="Bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} className="border rounded-xl p-2" />
                        <input type="text" placeholder="Cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} className="border rounded-xl p-2" />
                      </div>
                    </div>

                    <button type="submit" className="w-full py-2.5 bg-blue-900 text-white font-bold rounded-xl shadow cursor-pointer mt-1">
                      💾 Atualizar Meu Cadastro
                    </button>
                  </form>
                </div>
              )}

              {/* 2. ABA AGENDA */}
              {subAbaApp === 'minha_agenda' && (
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center bg-white p-3 rounded-2xl border shadow-sm">
                    <div>
                      <h3 className="font-black text-blue-900 text-xs flex items-center gap-1.5">📅 Minha Agenda & Alarmes</h3>
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
                            <span className="font-bold text-blue-900 text-xs">📅 {item.data} às {item.hora}</span>
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
                    <h4 className="font-bold text-slate-700 uppercase text-[9px] tracking-wider">👥 Integrantes da Célula ({participantesCelula.length})</h4>
                    <div className="space-y-1.5">
                      {participantesCelula.map((p) => (
                        <div key={p.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-xl">
                          <span className="font-bold text-slate-800">{p.nome}</span>
                          <div className="flex items-center gap-1.5">
                            {p.celular_principal && (
                              <button
                                type="button"
                                onClick={() => ligarPara(p.celular_principal, p.nome)}
                                className="text-[9px] font-bold text-blue-800 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 cursor-pointer"
                              >
                                📞 Ligar
                              </button>
                            )}
                            <a
                              href={`https://wa.me/${formatarWhatsapp(p.celular_principal)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 cursor-pointer"
                            >
                              💬 WhatsApp
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border space-y-2 shadow-sm">
                    <h4 className="font-bold text-slate-700 uppercase text-[9px] tracking-wider">📋 Histórico de Encontros & Notas</h4>
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

              {/* 5. ABA CADASTRO */}
              {subAbaApp === 'cadastro' && (
                <div className="bg-white p-3.5 rounded-2xl border shadow-sm space-y-3 text-xs">
                  <div className="border-b pb-1.5 flex justify-between items-center">
                    <div>
                      <h3 className="font-black text-blue-900 text-xs">📝 Ficha de Cadastro Oficial</h3>
                      <p className="text-[9px] text-slate-500">Etapa {etapaCadastro} de 3</p>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3].map((n) => (
                        <span key={n} className={`w-2.5 h-2.5 rounded-full ${etapaCadastro >= n ? 'bg-blue-600' : 'bg-slate-200'}`}></span>
                      ))}
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
                            <input type="text" value={nomeMembro} onChange={(e) => setNomeMembro(e.target.value)} className="w-full border rounded-xl p-2 font-bold text-slate-800 text-xs" required />
                          </div>
                          <div>
                            <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">Celular / WhatsApp *</label>
                            <input type="text" value={celularMembro} onChange={(e) => setCelularMembro(e.target.value)} className="w-full border rounded-xl p-2 text-xs" placeholder="(00) 00000-0000" required />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">Nascimento</label>
                              <input type="date" value={dataNascMembro} onChange={(e) => setDataNascMembro(e.target.value)} className="w-full border rounded-xl p-2 bg-white text-xs" />
                            </div>
                            <div>
                              <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">Estado Civil</label>
                              <select value={estadoCivil} onChange={(e) => setEstadoCivil(e.target.value)} className="w-full border rounded-xl p-2 bg-white text-xs">
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
                            <input type="text" placeholder="CEP" value={cepMembro} onChange={(e) => setCepMembro(e.target.value)} className="border rounded-xl p-2 text-xs" />
                            <input type="text" placeholder="Bairro" value={bairroMembro} onChange={(e) => setBairroMembro(e.target.value)} className="col-span-2 border rounded-xl p-2 text-xs" />
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <input type="text" placeholder="Rua / Avenida" value={ruaMembro} onChange={(e) => setRuaMembro(e.target.value)} className="col-span-2 border rounded-xl p-2 text-xs" />
                            <input type="text" placeholder="Nº" value={numeroMembro} onChange={(e) => setNumeroMembro(e.target.value)} className="border rounded-xl p-2 text-xs" />
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button type="button" onClick={() => setEtapaCadastro(1)} className="w-1/2 py-2.5 bg-slate-200 font-bold rounded-xl cursor-pointer text-xs">⬅️ Voltar</button>
                            <button type="button" onClick={() => setEtapaCadastro(3)} className="w-1/2 py-2.5 bg-blue-900 text-white font-bold rounded-xl shadow cursor-pointer text-xs">Próxima ➡️</button>
                          </div>
                        </div>
                      )}

                      {etapaCadastro === 3 && (
                        <div className="space-y-2.5">
                          <h4 className="font-bold text-blue-900 bg-blue-50 p-1.5 rounded-lg text-[11px]">3️⃣ Dados Eclesiásticos & Finalização</h4>
                          <div>
                            <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">É batizado(a) nas águas?</label>
                            <select value={batizado} onChange={(e) => setBatizado(e.target.value)} className="w-full border rounded-xl p-2 bg-white text-xs">
                              <option value="Sim">Sim</option>
                              <option value="Não">Não</option>
                            </select>
                          </div>
                          <div>
                            <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">Observações ou Pedido de Oração</label>
                            <textarea value={observacoesMembro} onChange={(e) => setObservacoesMembro(e.target.value)} className="w-full border rounded-xl p-2 text-xs" rows={2} placeholder="Alguma observação importante..." />
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button type="button" onClick={() => setEtapaCadastro(2)} className="w-1/2 py-2.5 bg-slate-200 font-bold rounded-xl cursor-pointer text-xs">⬅️ Voltar</button>
                            <button type="submit" className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow cursor-pointer text-xs">💾 Salvar Cadastro</button>
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
                    <h3 className="font-black text-blue-900 text-sm flex items-center gap-1.5">📖 Devocional Diário</h3>
                    <div className="flex items-center gap-2">
                      {isAdminOuLider && (
                        <button
                          type="button"
                          onClick={handleAbrirEditarDevocional}
                          className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow text-[10px] flex items-center gap-1 cursor-pointer transition"
                        >
                          ✏ {devocionalDoDia.id ? 'Editar' : 'Novo'}
                        </button>
                      )}
                      <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">{devocionalDoDia.data}</span>
                    </div>
                  </div>

                  <div className="space-y-2 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 text-white p-4 rounded-2xl shadow-inner">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-blue-300 block">PALAVRA DO DIA</span>
                    <h4 className="font-extrabold text-sm text-yellow-300 leading-snug">"{devocionalDoDia.titulo}"</h4>
                    {devocionalDoDia.versiculo && (
                      <p className="text-xs font-semibold text-blue-100 leading-relaxed italic border-l-2 border-yellow-400 pl-2 my-1">
                        "{devocionalDoDia.versiculo}"
                      </p>
                    )}
                    {devocionalDoDia.referencia && <p className="text-[10px] text-blue-300 font-bold">📍 {devocionalDoDia.referencia}</p>}
                  </div>

                  <div className="space-y-2 text-slate-700 leading-relaxed pt-1">
                    <strong className="block text-slate-800 font-bold text-[11px]">Reflexão:</strong>
                    <div
                      className="text-[11px] whitespace-pre-wrap text-slate-600 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: devocionalDoDia.reflexao }}
                    />
                    {devocionalDoDia.autor && (
                      <p className="text-[10px] text-slate-500 font-bold italic pt-1 text-right">✍️ {devocionalDoDia.autor}</p>
                    )}
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={handleGerarImagemStories}
                      disabled={gerandoImagem}
                      className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition text-[11px] flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      📸 {gerandoImagem ? 'Gerando arte...' : 'Gerar Arte de Stories (9:16)'}
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
      )}

      {/* MODAL STORY */}
      {modalStoryGeradoOpen && (
        <div className="fixed inset-0 bg-slate-950/90 z-50 flex flex-col items-center justify-center p-3">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xs rounded-3xl p-3 flex flex-col items-center space-y-3 shadow-2xl">
            <div className="w-full flex justify-between items-center text-white px-1">
              <span className="font-bold text-xs">📸 Sua Arte para Stories</span>
              <button type="button" onClick={() => setModalStoryGeradoOpen(false)} className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer">✕</button>
            </div>
            <div className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden border-2 border-amber-400/50 shadow-lg bg-black">
              <img src={imagemStoryDataUrl} alt="Devocional Instagram Story" className="w-full h-full object-cover select-none" />
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

      {/* MODAL AGENDA */}
      {modalNovaAgenda && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-3xl p-4 space-y-2.5 text-xs shadow-2xl">
            <h3 className="font-black text-blue-900 text-sm border-b pb-1.5">{itemEditandoAgenda ? '✏️ Editar Compromisso' : '➕ Novo Compromisso'}</h3>
            <form onSubmit={handleSalvarMinhaAgenda} className="space-y-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">Descrição *</label>
                <input type="text" placeholder="Ex: Reunião, Culto..." value={novoTitulo} onChange={(e) => setNovoTitulo(e.target.value)} className="w-full border rounded-xl p-2 font-semibold text-slate-800 text-xs" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">Data</label>
                  <input type="date" value={novaData} onChange={(e) => setNovaData(e.target.value)} className="w-full border rounded-xl p-1.5 font-semibold text-xs" required />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">Hora</label>
                  <input type="time" value={novaHora} onChange={(e) => setNovaHora(e.target.value)} className="w-full border rounded-xl p-1.5 font-semibold text-xs" required />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">🔔 Alarme Sonoro</label>
                <select value={lembreteMinutos} onChange={(e) => setLembreteMinutos(Number(e.target.value))} className="w-full border rounded-xl p-2 bg-white outline-none text-xs">
                  <option value={0}>Na hora exata</option>
                  <option value={5}>5 minutos antes</option>
                  <option value={15}>15 minutos antes</option>
                  <option value={30}>30 minutos antes</option>
                  <option value={60}>1 hora antes</option>
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setModalNovaAgenda(false)} className="w-full py-2 bg-slate-100 font-bold rounded-xl cursor-pointer hover:bg-slate-200 text-xs">Cancelar</button>
                <button type="submit" className="w-full py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow cursor-pointer text-xs">
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

      {/* MODAL DEVOCIONAL */}
      {modalDevocionalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-3xl p-4 space-y-2.5 text-xs shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-black text-blue-900 text-sm border-b pb-1.5">{devocionalDoDia.id ? '✏️ Editar Devocional' : '➕ Novo Devocional'}</h3>
            <form onSubmit={handleSalvarDevocionalMobile} className="space-y-2">
              <div>
                <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">Data de Publicação</label>
                <input type="date" value={editDevData} onChange={(e) => setEditDevData(e.target.value)} className="w-full border rounded-xl p-1.5 font-semibold text-xs" required />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">Título da Mensagem *</label>
                <input type="text" placeholder="Ex: O Poder da Oração" value={editDevTitulo} onChange={(e) => setEditDevTitulo(e.target.value)} className="w-full border rounded-xl p-1.5 font-bold text-xs" required />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">Referência Bíblica *</label>
                <input type="text" placeholder="Ex: Mateus 28:18-19" value={editDevRef} onChange={(e) => setEditDevRef(e.target.value)} className="w-full border rounded-xl p-1.5 text-xs font-medium" required />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">Versículo / Passagem</label>
                <textarea placeholder="Texto do versículo em destaque" value={editDevVersiculo} onChange={(e) => setEditDevVersiculo(e.target.value)} className="w-full border rounded-xl p-1.5 text-xs" rows={2} />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">Reflexão / Mensagem *</label>
                <textarea placeholder="Escreva a reflexão diária..." value={editDevReflexao} onChange={(e) => setEditDevReflexao(e.target.value)} className="w-full border rounded-xl p-1.5 text-xs" rows={4} required />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">Autor</label>
                <input type="text" value={editDevAutor} onChange={(e) => setEditDevAutor(e.target.value)} className="w-full border rounded-xl p-1.5 text-xs font-semibold" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModalDevocionalOpen(false)} className="w-1/2 py-2 bg-slate-100 font-bold rounded-xl cursor-pointer hover:bg-slate-200 text-xs">Cancelar</button>
                <button type="submit" disabled={savingDevocional} className="w-1/2 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow cursor-pointer text-xs disabled:opacity-50">
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