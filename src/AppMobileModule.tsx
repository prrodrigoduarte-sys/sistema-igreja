import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import UtilitariosModule from './utilitarios/UtilitariosModule';
import ReuniaoModule from './reuniao/ReuniaoModule';
import ChatModule, { ligarPara, nomeBonito } from './ChatModule';
import DevocionalPessoal from './utilitarios/DevocionalPessoal';
import { classesConteudo, dataBR, hojeLocal, htmlParaExibir, htmlParaTexto, podeEditarDevocional, temFormatacao, textoParaHtml } from './devocionalUtil';

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
  dataIso?: string;
}

type SubAba = 'perfil' | 'minha_agenda' | 'celula' | 'igreja' | 'cadastro' | 'contribua' | 'devocional' | 'chat' | 'utilitarios' | 'reuniao' | 'inicio';

const ABAS: { id: Exclude<SubAba, 'inicio'>; icone: string; titulo: string }[] = [
  { id: 'chat', icone: 'chat', titulo: 'Chat Geral' },
  { id: 'minha_agenda', icone: 'agenda', titulo: 'Agenda' },
  { id: 'perfil', icone: 'perfil', titulo: 'Meu Perfil' },
  { id: 'celula', icone: 'celula', titulo: 'Célula' },
  { id: 'igreja', icone: 'igreja', titulo: 'A Igreja' },
  { id: 'cadastro', icone: 'cadastro', titulo: 'Cadastro' },
  { id: 'contribua', icone: 'contribua', titulo: 'Contribua' },
  { id: 'devocional', icone: 'devocional', titulo: 'Devocional' },
  { id: 'reuniao', icone: 'reuniao', titulo: 'Reunião' },
  { id: 'utilitarios', icone: 'utilitarios', titulo: 'Utilitários' },
];

const ICONES: Record<string, React.ReactNode> = {
  reuniao: (
    <>
      <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
      <rect x="2" y="6" width="14" height="12" rx="2" />
    </>
  ),
  utilitarios: (
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  ),
  chat: <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />,
  agenda: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  perfil: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </>
  ),
  celula: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  igreja: (
    <>
      <path d="m18 7 4 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9l4-2" />
      <path d="M14 22v-4a2 2 0 0 0-4 0v4M18 22V5l-6-3-6 3v17M12 7v5M10 9h4" />
    </>
  ),
  cadastro: (
    <>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8" />
    </>
  ),
  contribua: <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />,
  devocional: <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />,
};

const Icone = ({ nome, className }: { nome: string; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {ICONES[nome]}
  </svg>
);

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

export default function AppMobileModule({ loggedUser }: Props) {
  const [subAbaApp, setSubAbaApp] = useState<SubAba>('inicio');
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
  const [novaData, setNovaData] = useState(hojeLocal());
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
  const [editDevId, setEditDevId] = useState<string | null>(null); // null = novo devocional
  const [editDevComFormatacao, setEditDevComFormatacao] = useState(false);
  const [editDevData, setEditDevData] = useState(hojeLocal());
  const [editDevTitulo, setEditDevTitulo] = useState('');
  const [editDevRef, setEditDevRef] = useState('');
  const [editDevVersiculo, setEditDevVersiculo] = useState('');
  const [editDevReflexao, setEditDevReflexao] = useState('');
  const [editDevAutor, setEditDevAutor] = useState('Pastor / Equipe Pastoral');
  const [savingDevocional, setSavingDevocional] = useState(false);
  const [meusDevocionaisAberto, setMeusDevocionaisAberto] = useState(false);

  const [gerandoImagem, setGerandoImagem] = useState(false);
  const [modalStoryGeradoOpen, setModalStoryGeradoOpen] = useState(false);
  const [imagemStoryDataUrl, setImagemStoryDataUrl] = useState('');

  const [minhaCelula, setMinhaCelula] = useState<any>(null);
  const [participantesCelula, setParticipantesCelula] = useState<any[]>([]);
  const [reunioesCelula, setReunioesCelula] = useState<any[]>([]);

  const [modalNovaReuniao, setModalNovaReuniao] = useState(false);
  const [itemEditandoReuniao, setItemEditandoReuniao] = useState<any | null>(null);
  const [dataReuniao, setDataReuniao] = useState(hojeLocal());
  const [horaReuniao, setHoraReuniao] = useState('19:30');
  const [temaEstudo, setTemaEstudo] = useState('');
  const [comentariosCelula, setComentariosCelula] = useState('');

  const codigoIgreja = loggedUser?.codigo_igreja || loggedUser?.igrejas?.codigo_igreja || 'IGR-001';
  const emailUsuario = loggedUser?.email?.trim().toLowerCase() || loggedUser?.usuario || 'admin@sistema.com';
  const isAdminOuLider =
    loggedUser?.perfil === 'admin' ||
    loggedUser?.perfil === 'administrador' ||
    loggedUser?.perfil === 'lider' ||
    loggedUser?.funcao === 'admin' ||
    loggedUser?.cargo === 'Pastor';
  // Devocional: só administrador e pastor (a mesma regra do sistema)
  const podeEditarDev = podeEditarDevocional(loggedUser);

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
      const { data } = await supabase.from('members').select('*').eq('email', emailUsuario).eq('codigo_igreja', codigoIgreja).maybeSingle();

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

  // ── Dados gerais do app (NÃO chama mais o chat: era isso que causava o "Carregando dados..." infinito) ──
  // ── DEVOCIONAL: o publicado mais recente com data até hoje (mesma tabela do sistema) ──
  const carregarDevocional = useCallback(async () => {
    const { data: dataDev, error } = await supabase
      .from('devotionals')
      .select('*')
      .eq('codigo_igreja', codigoIgreja)
      .eq('is_published', true)
      .lte('publish_date', hojeLocal())
      .order('publish_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error('Erro ao carregar devocional:', error);
      return;
    }
    if (dataDev) {
      setDevocionalDoDia({
        id: dataDev.id,
        titulo: dataDev.title || 'Palavra de Hoje',
        referencia: dataDev.verse_reference || '',
        versiculo: dataDev.passage_text || '',
        reflexao: dataDev.content_html || '',
        autor: dataDev.author_name || 'Pastor / Equipe Pastoral',
        data: dataDev.publish_date ? dataBR(dataDev.publish_date) : new Date().toLocaleDateString('pt-BR'),
        dataIso: dataDev.publish_date || '',
      });
    } else {
      setDevocionalDoDia({
        titulo: 'Palavra de Hoje',
        referencia: '',
        versiculo: '',
        reflexao: 'O devocional de hoje ainda não foi publicado.',
        autor: '',
        data: new Date().toLocaleDateString('pt-BR'),
      });
    }
  }, [codigoIgreja]);

  // Quando o pastor salva pelo sistema (ou por outro celular), o app atualiza sozinho
  useEffect(() => {
    const canal = supabase
      .channel('devotionals_app')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devotionals' }, () => carregarDevocional())
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [carregarDevocional]);

  const carregarDadosApp = useCallback(async () => {
    setLoading(true);
    try {
      if (emailUsuario) {
        const { data: dataMembro } = await supabase.from('members').select('*').eq('email', emailUsuario).eq('codigo_igreja', codigoIgreja).maybeSingle();

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
        .eq('codigo_igreja', codigoIgreja)
        .order('data', { ascending: true })
        .order('hora', { ascending: true });
      if (dataAgenda) setMinhaAgenda(dataAgenda);

      const { data: dataIgr } = await supabase.from('igrejas').select('*').eq('codigo_igreja', codigoIgreja).limit(1).maybeSingle();
      if (dataIgr) {
        setDadosIgreja({
          nome_igreja: dataIgr.nome_fantasia || dataIgr.razao_social || 'Sua Igreja',
          endereco_completo: `${dataIgr.logradouro || ''}, ${dataIgr.numero || ''} - CEP: ${dataIgr.cep || ''}`.trim(),
          link_instagram: dataIgr.link_instagram || 'https://instagram.com',
          cnpj: dataIgr.cnpj || '',
          chave_pix: dataIgr.cnpj || dataIgr.chave_pix || '',
        });
      }

      await carregarDevocional();

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
  }, [emailUsuario, codigoIgreja, carregarDevocional]);

  useEffect(() => {
    carregarDadosApp();
    verificarStatusCadastro();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregarDadosApp]);

  // No celular, o chat ocupa a tela toda: trava a rolagem da página por trás
  useEffect(() => {
    if (subAbaApp !== 'chat' && subAbaApp !== 'utilitarios' && subAbaApp !== 'reuniao') return;
    const ehCelular = window.matchMedia('(max-width: 767px)').matches;
    if (!ehCelular) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [subAbaApp]);

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
        .eq('codigo_igreja', codigoIgreja)
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
    setNovaData(hojeLocal());
    setNovaHora('08:00');
    setLembreteMinutos(15);
    setFrequencia('unica');
    setModalNovaAgenda(true);
  };

  const handleAbrirEditarAgenda = (item: Compromisso) => {
    setItemEditandoAgenda(item);
    setNovoTitulo(item.descricao || '');
    setNovaData(item.data || hojeLocal());
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
    setDataReuniao(hojeLocal());
    setHoraReuniao('19:30');
    setTemaEstudo('');
    setComentariosCelula('');
    setModalNovaReuniao(true);
  };

  const handleAbrirEditarReuniao = (item: any) => {
    setItemEditandoReuniao(item);
    setDataReuniao(item.data_reuniao || hojeLocal());
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
    const textoLimpo = htmlParaTexto(devocionalDoDia.reflexao);
    const texto = `*Devocional Diário - ${dadosIgreja.nome_igreja}*\n\n📖 *${devocionalDoDia.titulo}*\n${devocionalDoDia.versiculo ? `"${devocionalDoDia.versiculo}"\n` : ''}_${devocionalDoDia.referencia}_\n\n*Reflexão:*\n${textoLimpo}\n\n✍️ *Por:* ${devocionalDoDia.autor}`;

    if (navigator.share) {
      navigator.share({ title: devocionalDoDia.titulo, text: texto });
    } else {
      navigator.clipboard.writeText(texto);
      alert('✨ Devocional copiado com sucesso! Abra o WhatsApp para compartilhar.');
    }
  };

  // novo = true: começa em branco com a data de hoje; senão edita o devocional que está no app
  const handleAbrirEditarDevocional = (novo = false) => {
    if (!podeEditarDev) return;
    const editarAtual = !novo && !!devocionalDoDia.id;
    setEditDevId(editarAtual ? devocionalDoDia.id || null : null);
    setEditDevData(editarAtual && devocionalDoDia.dataIso ? devocionalDoDia.dataIso : hojeLocal());
    setEditDevTitulo(editarAtual ? devocionalDoDia.titulo : '');
    setEditDevRef(editarAtual ? devocionalDoDia.referencia || '' : '');
    setEditDevVersiculo(editarAtual ? devocionalDoDia.versiculo || '' : '');
    setEditDevReflexao(editarAtual ? htmlParaTexto(devocionalDoDia.reflexao) : '');
    setEditDevComFormatacao(editarAtual && temFormatacao(devocionalDoDia.reflexao));
    setEditDevAutor(editarAtual ? devocionalDoDia.autor || 'Pastor / Equipe Pastoral' : 'Pastor / Equipe Pastoral');
    setModalDevocionalOpen(true);
  };

  const handleSalvarDevocionalMobile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeEditarDev) return alert('Apenas o administrador e o pastor podem publicar o devocional.');
    if (!editDevTitulo.trim() || !editDevReflexao.trim()) return alert('Preencha o título e o texto da reflexão.');

    setSavingDevocional(true);
    try {
      const payload = {
        publish_date: editDevData,
        title: editDevTitulo.trim(),
        verse_reference: editDevRef.trim(),
        passage_text: editDevVersiculo.trim() || null,
        content_html: textoParaHtml(editDevReflexao),
        author_name: editDevAutor.trim() || 'Pastor / Equipe Pastoral',
        is_published: true,
        codigo_igreja: codigoIgreja,
      };

      if (editDevId) {
        const { error } = await supabase.from('devotionals').update(payload).eq('id', editDevId);
        if (error) throw error;
        alert('✏️ Devocional atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('devotionals').insert([payload]);
        if (error) throw error;
        alert(editDevData > hojeLocal() ? `📅 Devocional agendado para ${dataBR(editDevData)}!` : '✅ Devocional publicado com sucesso!');
      }

      setModalDevocionalOpen(false);
      carregarDevocional();
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
      const textoLimpo = htmlParaTexto(devocionalDoDia.reflexao);
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


  const naInicio = subAbaApp === 'inicio';
  const noChat = subAbaApp === 'chat';
  const noUtil = subAbaApp === 'utilitarios' || subAbaApp === 'reuniao';
  const tituloAba = ABAS.find((a) => a.id === subAbaApp)?.titulo || '';
  const nomeUsuario = membroPerfil?.nome ? nomeBonito(membroPerfil.nome) : loggedUser?.nome_usuario || 'Membro';
  const primeiroNome = (nomeUsuario || '').trim().split(/\s+/)[0] || 'Irmão';
  const horaAgora = new Date().getHours();
  const saudacao = horaAgora < 12 ? 'Bom dia' : horaAgora < 18 ? 'Boa tarde' : 'Boa noite';
  const hojePorExtenso = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  const avatar = (
    <button
      type="button"
      onClick={() => setSubAbaApp('perfil')}
      className="shrink-0 w-9 h-9 rounded-full border-2 border-white/80 overflow-hidden bg-blue-800 flex items-center justify-center cursor-pointer"
      aria-label="Abrir meu perfil"
    >
      {fotoUrl ? <img src={fotoUrl} alt="" className="w-full h-full object-cover" /> : <Icone nome="perfil" className="w-5 h-5 text-white" />}
    </button>
  );

  return (
    <div
      className={`max-w-4xl mx-auto w-full h-[720px] max-h-[92dvh] rounded-3xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col relative ${
        naInicio ? 'bg-gradient-to-b from-blue-950 via-blue-900 to-indigo-950' : 'bg-slate-100'
      } ${
        noChat || noUtil
          ? 'max-md:fixed max-md:inset-0 max-md:z-40 max-md:h-[100dvh] max-md:max-h-none max-md:rounded-none max-md:border-0 max-md:shadow-none'
          : ''
      }`}
    >
      {naInicio ? (
        /* TELA INICIAL: grade de ícones grandes */
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col text-white">
          <div className="px-5 pt-6">
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-[11px] font-black uppercase tracking-[0.22em] text-amber-300">
                {saudacao}, {primeiroNome}
              </p>
              {avatar}
            </div>
            <h1 className="mt-2 text-[2rem] sm:text-5xl font-black leading-[1.02] tracking-tight bg-gradient-to-br from-white via-amber-50 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(251,191,36,0.25)] [overflow-wrap:anywhere]">
              {dadosIgreja.nome_igreja}
            </h1>
            <div className="mt-3 flex items-center gap-3">
              <span className="h-1 w-12 rounded-full bg-gradient-to-r from-amber-400 to-rose-400" aria-hidden="true" />
              <span className="text-[11px] font-semibold text-blue-200 first-letter:uppercase">{hojePorExtenso}</span>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-3 sm:grid-cols-4 gap-x-2 gap-y-7 px-5 py-8 content-center">
            {ABAS.map((aba) => (
              <button
                key={aba.id}
                type="button"
                onClick={() => setSubAbaApp(aba.id)}
                className="group flex flex-col items-center gap-2 cursor-pointer select-none focus:outline-none"
              >
                <span
                  className={`w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl flex items-center justify-center ring-1 transition group-active:scale-95 group-focus-visible:ring-2 group-focus-visible:ring-white ${
                    aba.id === 'chat'
                      ? 'bg-emerald-500/20 ring-emerald-400/50 text-emerald-200 group-hover:bg-emerald-500/30'
                      : 'bg-white/5 ring-white/15 text-white group-hover:bg-white/10'
                  }`}
                >
                  <Icone nome={aba.icone} className="w-8 h-8" />
                </span>
                <span className="text-[11px] font-bold text-center leading-tight text-blue-50">{aba.titulo}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* BARRA DA SEÇÃO: botão voltar + título (no celular some dentro do chat, que tem a própria barra) */
        <div className={`bg-blue-900 text-white px-2.5 py-2.5 items-center gap-2 shrink-0 ${noChat ? 'hidden md:flex' : 'flex'}`}>
          <button
            type="button"
            onClick={() => setSubAbaApp('inicio')}
            className="h-9 px-2.5 rounded-full hover:bg-blue-800 flex items-center gap-1.5 text-xs font-bold cursor-pointer active:scale-95 transition"
            aria-label="Voltar ao início do app"
          >
            <span aria-hidden="true">←</span>
            <span>Início</span>
          </button>
          <h2 className="font-black text-sm flex-1 truncate">{tituloAba}</h2>
          {avatar}
        </div>
      )}

      {/* ÁREA DE CONTEÚDO */}
      {naInicio ? null : subAbaApp === 'chat' ? null : subAbaApp === 'reuniao' ? (
        <div className="flex-1 min-h-0 bg-slate-100">
          <ReuniaoModule codigoIgreja={codigoIgreja} emailUsuario={emailUsuario} nomeUsuario={nomeUsuario} />
        </div>
      ) : subAbaApp === 'utilitarios' ? (
        <div className="flex-1 min-h-0 bg-slate-100">
          <UtilitariosModule
            compromissos={minhaAgenda}
            codigoIgreja={codigoIgreja}
            emailUsuario={emailUsuario}
            nomeUsuario={nomeUsuario}
            isAdmin={!!isAdminOuLider}
            podePublicarDevocional={podeEditarDev}
          />
        </div>
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
                      {podeEditarDev && devocionalDoDia.id && (
                        <button
                          type="button"
                          onClick={() => handleAbrirEditarDevocional(false)}
                          className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow text-[10px] flex items-center gap-1 cursor-pointer transition"
                        >
                          ✏ Editar
                        </button>
                      )}
                      {podeEditarDev && (
                        <button
                          type="button"
                          onClick={() => handleAbrirEditarDevocional(true)}
                          className="px-2 py-1 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg shadow text-[10px] flex items-center gap-1 cursor-pointer transition"
                        >
                          ➕ Novo
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
                      className={`text-[11px] text-slate-600 leading-relaxed ${classesConteudo}`}
                      dangerouslySetInnerHTML={{ __html: htmlParaExibir(devocionalDoDia.reflexao) }}
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
                    <button
                      type="button"
                      onClick={() => setMeusDevocionaisAberto(true)}
                      className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold rounded-xl transition text-[11px] flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                    >
                      💜 Meus devocionais (feitos na Bíblia)
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* CHAT: fica sempre ligado (online e recebendo chamadas); só aparece na aba Chat */}
      <ChatModule loggedUser={loggedUser} visivel={noChat} onVoltar={() => setSubAbaApp('inicio')} />


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

      {/* MEUS DEVOCIONAIS (os mesmos da Bíblia em Utilitários) */}
      {meusDevocionaisAberto && (
        <DevocionalPessoal
          email={emailUsuario}
          nome={nomeUsuario}
          rascunho={null}
          onFechar={() => setMeusDevocionaisAberto(false)}
          podePublicar={podeEditarDev}
          codigoIgreja={codigoIgreja}
        />
      )}

      {/* MODAL DEVOCIONAL */}
      {modalDevocionalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-3xl p-4 space-y-2.5 text-xs shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-black text-blue-900 text-sm border-b pb-1.5">{editDevId ? '✏️ Editar Devocional' : '➕ Novo Devocional'}</h3>
            {editDevComFormatacao && (
              <p className="text-[10px] leading-snug bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-2">
                Este devocional tem negrito, listas ou citações feitos no sistema. Se salvar por aqui, essa formatação some (o texto continua).
                Para manter, edite pelo sistema.
              </p>
            )}
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
                <textarea placeholder="Escreva a reflexão diária... (deixe uma linha em branco entre os parágrafos)" value={editDevReflexao} onChange={(e) => setEditDevReflexao(e.target.value)} className="w-full border rounded-xl p-1.5 text-xs" rows={6} required />
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
