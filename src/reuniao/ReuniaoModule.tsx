import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase';

// Reunião em grupo por vídeo/áudio, direto entre os aparelhos (WebRTC "malha"), sinalizada pelo Supabase Realtime.
//
// LIMITE HONESTO: na malha, cada pessoa envia o próprio vídeo para TODAS as outras. Por isso o limite aqui é
// MAX_PARTICIPANTES. Reunião de dezenas ou 100 pessoas exige um servidor de mídia (SFU: LiveKit, Daily, Jitsi...).
// Quando o servidor existir, basta trocar a parte de conexão (função `conectarPar`) mantendo esta tela.

export const MAX_PARTICIPANTES = 8;
const LIMITE_VIDEO_ECONOMICO = 4; // acima disso a câmera entra desligada, para não travar

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }],
  // Para redes que bloqueiam conexão direta, acrescente um servidor TURN:
  // { urls: 'turn:SEU_SERVIDOR:3478', username: '...', credential: '...' }
};

interface Props {
  codigoIgreja: string;
  emailUsuario: string;
  nomeUsuario: string;
}

interface Par {
  email: string;
  nome: string;
  pc: RTCPeerConnection;
  pendentes: any[];
  estado: string;
}

interface Tile {
  email: string;
  nome: string;
  stream: MediaStream | null;
  estado: string;
}

const slug = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30) || 'geral';

function VideoTile({ stream, muted, rotulo, estado, semImagem }: { stream: MediaStream | null; muted?: boolean; rotulo: string; estado?: string; semImagem?: boolean }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (ref.current && ref.current.srcObject !== stream) ref.current.srcObject = stream;
  }, [stream]);
  const temVideo = !!stream && stream.getVideoTracks().some((t) => t.readyState === 'live') && !semImagem;
  return (
    <div className="relative bg-slate-800 rounded-2xl overflow-hidden aspect-[4/3] flex items-center justify-center">
      <video ref={ref} autoPlay playsInline muted={muted} className={`w-full h-full object-cover ${temVideo ? '' : 'opacity-0 absolute'}`} />
      {!temVideo && (
        <div className="w-16 h-16 rounded-full bg-blue-900 text-white font-black text-2xl flex items-center justify-center">
          {rotulo.trim().charAt(0).toUpperCase() || '?'}
        </div>
      )}
      <span className="absolute left-2 bottom-2 max-w-[85%] truncate text-[11px] font-bold text-white bg-black/55 rounded-full px-2 py-0.5">{rotulo}</span>
      {estado && estado !== 'connected' && !muted && (
        <span className="absolute right-2 top-2 text-[10px] font-bold bg-amber-500 text-white rounded-full px-2 py-0.5">
          {estado === 'failed' ? 'Sem conexão' : 'Conectando…'}
        </span>
      )}
    </div>
  );
}

export default function ReuniaoModule({ codigoIgreja, emailUsuario, nomeUsuario }: Props) {
  const [nomeSala, setNomeSala] = useState('Geral');
  const [comCamera, setComCamera] = useState(true);
  const [salaAtual, setSalaAtual] = useState<string | null>(null);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [meuStream, setMeuStream] = useState<MediaStream | null>(null);
  const [mudo, setMudo] = useState(false);
  const [semCamera, setSemCamera] = useState(false);
  const [aviso, setAviso] = useState('');
  const [salasAtivas, setSalasAtivas] = useState<{ sala: string; total: number }[]>([]);
  const [entrando, setEntrando] = useState(false);
  const [segundos, setSegundos] = useState(0);

  const canalSalaRef = useRef<any>(null);
  const canalLobbyRef = useRef<any>(null);
  const meuStreamRef = useRef<MediaStream | null>(null);
  const paresRef = useRef<Map<string, Par>>(new Map());
  const streamsRef = useRef<Map<string, MediaStream>>(new Map());
  const nomesRef = useRef<Map<string, string>>(new Map());
  const salaRef = useRef<string | null>(null);
  const avisoTimer = useRef<any>(null);
  const wakeRef = useRef<any>(null);

  const meuEmail = emailUsuario.trim().toLowerCase();

  const mostrarAviso = (msg: string) => {
    setAviso(msg);
    clearTimeout(avisoTimer.current);
    avisoTimer.current = setTimeout(() => setAviso(''), 4500);
  };

  const atualizarTiles = useCallback(() => {
    setTiles(
      Array.from(paresRef.current.values()).map((p: Par) => ({
        email: p.email,
        nome: p.nome,
        stream: streamsRef.current.get(p.email) || null,
        estado: p.estado,
      }))
    );
  }, []);

  const enviar = (payload: any) => {
    canalSalaRef.current?.send({ type: 'broadcast', event: 'sinal', payload: { ...payload, de: meuEmail, deNome: nomeUsuario } });
  };

  const fecharPar = useCallback(
    (email: string) => {
      const p = paresRef.current.get(email);
      if (p) {
        p.pc.onicecandidate = null;
        p.pc.ontrack = null;
        p.pc.onconnectionstatechange = null;
        try {
          p.pc.close();
        } catch {}
      }
      paresRef.current.delete(email);
      streamsRef.current.delete(email);
      atualizarTiles();
    },
    [atualizarTiles]
  );

  // Cria a conexão com um participante (SUBSTITUÍVEL por um cliente de servidor de mídia no futuro)
  const conectarPar = (email: string, nome: string): Par => {
    const existente = paresRef.current.get(email);
    if (existente) return existente;
    const pc = new RTCPeerConnection(ICE_SERVERS);
    const par: Par = { email, nome, pc, pendentes: [], estado: 'new' };
    paresRef.current.set(email, par);

    meuStreamRef.current?.getTracks().forEach((t) => {
      const sender = pc.addTrack(t, meuStreamRef.current as MediaStream);
      if (t.kind === 'video') {
        // limita o envio de vídeo para caber na malha
        try {
          const params = sender.getParameters();
          if (!params.encodings || params.encodings.length === 0) params.encodings = [{}];
          params.encodings[0].maxBitrate = 250_000;
          sender.setParameters(params).catch(() => {});
        } catch {}
      }
    });

    pc.onicecandidate = (e) => {
      if (e.candidate) enviar({ tipo: 'ice', para: email, candidate: e.candidate.toJSON() });
    };
    pc.ontrack = (e) => {
      streamsRef.current.set(email, e.streams[0]);
      atualizarTiles();
    };
    pc.onconnectionstatechange = () => {
      par.estado = pc.connectionState;
      atualizarTiles();
    };
    atualizarTiles();
    return par;
  };

  const aplicarPendentes = async (par: Par) => {
    const lista = par.pendentes;
    par.pendentes = [];
    for (const c of lista) {
      try {
        await par.pc.addIceCandidate(c);
      } catch {}
    }
  };

  const tratarSinal = async (p: any) => {
    if (!p || (p.para || '').toLowerCase() !== meuEmail) return;
    const de = String(p.de || '').toLowerCase();
    if (!de || de === meuEmail) return;
    if (p.deNome) nomesRef.current.set(de, p.deNome);
    const nome = nomesRef.current.get(de) || de.split('@')[0];

    try {
      if (p.tipo === 'oferta') {
        // se já havia uma conexão travada com essa pessoa, recomeça
        const antigo = paresRef.current.get(de);
        if (antigo && antigo.pc.signalingState !== 'stable') fecharPar(de);
        const par = conectarPar(de, nome);
        await par.pc.setRemoteDescription(p.sdp);
        await aplicarPendentes(par);
        const resposta = await par.pc.createAnswer();
        await par.pc.setLocalDescription(resposta);
        enviar({ tipo: 'resposta', para: de, sdp: { type: resposta.type, sdp: resposta.sdp } });
      } else if (p.tipo === 'resposta') {
        const par = paresRef.current.get(de);
        if (!par) return;
        await par.pc.setRemoteDescription(p.sdp);
        await aplicarPendentes(par);
      } else if (p.tipo === 'ice') {
        const par = paresRef.current.get(de);
        if (!par) return;
        if (par.pc.remoteDescription) await par.pc.addIceCandidate(p.candidate).catch(() => {});
        else par.pendentes.push(p.candidate);
      }
    } catch {
      fecharPar(de);
    }
  };
  const sinalRef = useRef(tratarSinal);
  sinalRef.current = tratarSinal;

  // Quem entrou/saiu: por regra, o e-mail "menor" é quem liga (evita os dois ligarem ao mesmo tempo)
  const sincronizarPresenca = async (presenca: Record<string, any[]>) => {
    const emails = Object.keys(presenca).map((k) => k.toLowerCase());
    Object.entries(presenca).forEach(([k, metas]) => {
      const nome = (metas?.[0] as any)?.nome;
      if (nome) nomesRef.current.set(k.toLowerCase(), nome);
    });

    // saíram
    for (const email of Array.from<string>(paresRef.current.keys())) {
      if (!emails.includes(email)) fecharPar(email);
    }
    // entraram
    for (const email of emails) {
      if (email === meuEmail || paresRef.current.has(email)) continue;
      if (meuEmail < email) {
        const nome = nomesRef.current.get(email) || email.split('@')[0];
        const par = conectarPar(email, nome);
        try {
          const oferta = await par.pc.createOffer();
          await par.pc.setLocalDescription(oferta);
          enviar({ tipo: 'oferta', para: email, sdp: { type: oferta.type, sdp: oferta.sdp } });
        } catch {
          fecharPar(email);
        }
      }
    }
  };

  // ── Lobby: mostra as salas com gente ──
  useEffect(() => {
    const canal = supabase.channel(`reunioes_${codigoIgreja}`, { config: { presence: { key: meuEmail } } });
    canal
      .on('presence', { event: 'sync' }, () => {
        const contagem: Record<string, number> = {};
        Object.values(canal.presenceState() as Record<string, any[]>).forEach((metas) => {
          const sala = metas?.[0]?.sala;
          if (sala) contagem[sala] = (contagem[sala] || 0) + 1;
        });
        setSalasAtivas(Object.entries(contagem).map(([sala, total]) => ({ sala, total })));
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') await canal.track({ sala: salaRef.current, nome: nomeUsuario });
      });
    canalLobbyRef.current = canal;
    return () => {
      supabase.removeChannel(canal);
      canalLobbyRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigoIgreja, meuEmail]);

  const sair = useCallback(() => {
    Array.from(paresRef.current.keys()).forEach((k: string) => fecharPar(k));
    if (canalSalaRef.current) {
      supabase.removeChannel(canalSalaRef.current);
      canalSalaRef.current = null;
    }
    meuStreamRef.current?.getTracks().forEach((t) => t.stop());
    meuStreamRef.current = null;
    setMeuStream(null);
    try {
      wakeRef.current?.release?.();
    } catch {}
    wakeRef.current = null;
    salaRef.current = null;
    canalLobbyRef.current?.track({ sala: null, nome: nomeUsuario });
    setSalaAtual(null);
    setTiles([]);
    setMudo(false);
    setSemCamera(false);
    setSegundos(0);
  }, [fecharPar, nomeUsuario]);

  useEffect(() => () => sair(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const entrar = async (nomeEscolhido: string) => {
    if (entrando) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Reuniões só funcionam em conexão segura (https).');
      return;
    }
    const chave = slug(nomeEscolhido);
    setEntrando(true);
    try {
      // Pede a mídia (se a câmera falhar, entra só com áudio)
      let stream: MediaStream | null = null;
      if (comCamera) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true },
            video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 360 }, frameRate: { ideal: 20, max: 24 } },
          });
        } catch {
          mostrarAviso('Câmera indisponível: você entrou só com áudio.');
        }
      }
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        } catch {
          alert('Não foi possível usar o microfone. Permita o acesso nas configurações do navegador.');
          return;
        }
      }
      meuStreamRef.current = stream;
      setMeuStream(stream);
      setSemCamera(stream.getVideoTracks().length === 0);

      // Canal da sala
      const canal = supabase.channel(`sala_${codigoIgreja}_${chave}`, {
        config: { presence: { key: meuEmail }, broadcast: { self: false } },
      });
      canalSalaRef.current = canal;
      salaRef.current = chave;

      let jaContou = false;
      canal
        .on('presence', { event: 'sync' }, () => {
          const estado = canal.presenceState() as Record<string, any[]>;
          const total = Object.keys(estado).length;
          if (!jaContou) {
            jaContou = true;
            if (total > MAX_PARTICIPANTES) {
              mostrarAviso(`Sala cheia (máximo de ${MAX_PARTICIPANTES} pessoas nesta versão).`);
              sair();
              return;
            }
            if (total > LIMITE_VIDEO_ECONOMICO) {
              stream?.getVideoTracks().forEach((t) => (t.enabled = false));
              setSemCamera(true);
              mostrarAviso('Sala com muitas pessoas: sua câmera entrou desligada para manter a qualidade.');
            }
          }
          sincronizarPresenca(estado);
        })
        .on('broadcast', { event: 'sinal' }, ({ payload }: any) => sinalRef.current(payload))
        .subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            await canal.track({ email: meuEmail, nome: nomeUsuario });
            canalLobbyRef.current?.track({ sala: chave, nome: nomeUsuario });
          }
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            mostrarAviso('Falha de conexão com a sala.');
          }
        });

      setSalaAtual(nomeEscolhido.trim() || 'Geral');
      try {
        wakeRef.current = await (navigator as any).wakeLock?.request?.('screen');
      } catch {}
    } finally {
      setEntrando(false);
    }
  };

  useEffect(() => {
    if (!salaAtual) return;
    const t = setInterval(() => setSegundos((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, [salaAtual]);

  const alternarMicrofone = () => {
    const proximo = !mudo;
    meuStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !proximo));
    setMudo(proximo);
  };

  const alternarCamera = () => {
    const faixas = meuStreamRef.current?.getVideoTracks() || [];
    if (faixas.length === 0) return mostrarAviso('Sem câmera disponível neste aparelho.');
    faixas.forEach((t) => (t.enabled = semCamera));
    setSemCamera(!semCamera);
  };

  const total = tiles.length + 1;
  const colunas = total <= 1 ? 'grid-cols-1' : total <= 4 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3';

  // ── Sala ──
  if (salaAtual) {
    const mm = String(Math.floor(segundos / 60)).padStart(2, '0');
    const ss = String(segundos % 60).padStart(2, '0');
    return (
      <div className="fixed inset-0 z-[60] bg-slate-950 text-white flex flex-col" role="dialog" aria-label={`Reunião ${salaAtual}`}>
        <header className="shrink-0 px-4 py-3 flex items-center justify-between gap-3 border-b border-white/10">
          <div className="min-w-0">
            <h2 className="font-black text-sm truncate">Reunião: {salaAtual}</h2>
            <p className="text-[11px] text-blue-200">
              {total} {total === 1 ? 'pessoa' : 'pessoas'} · {mm}:{ss} · limite {MAX_PARTICIPANTES}
            </p>
          </div>
        </header>

        {aviso && (
          <div role="status" className="absolute top-14 left-1/2 -translate-x-1/2 z-10 max-w-[90vw] bg-slate-800 text-xs font-semibold px-4 py-2 rounded-full shadow-lg text-center">
            {aviso}
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto p-3">
          <div className={`grid ${colunas} gap-2 max-w-4xl mx-auto`}>
            <VideoTile stream={meuStream} muted rotulo={`${nomeUsuario} (você)`} semImagem={semCamera} />
            {tiles.map((t) => (
              <VideoTile key={t.email} stream={t.stream} rotulo={t.nome} estado={t.estado} />
            ))}
          </div>
          {tiles.length === 0 && <p className="text-center text-blue-200 text-xs mt-6">Aguardando os outros participantes entrarem na sala “{salaAtual}”…</p>}
        </div>

        <footer className="shrink-0 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-center gap-2 border-t border-white/10">
          <button
            type="button"
            onClick={alternarMicrofone}
            className={`px-4 py-3 rounded-2xl font-bold text-xs cursor-pointer active:scale-95 transition ${mudo ? 'bg-amber-500' : 'bg-white/10 hover:bg-white/20'}`}
          >
            {mudo ? '🔇 Sem áudio' : '🎙 Microfone'}
          </button>
          <button
            type="button"
            onClick={alternarCamera}
            className={`px-4 py-3 rounded-2xl font-bold text-xs cursor-pointer active:scale-95 transition ${semCamera ? 'bg-amber-500' : 'bg-white/10 hover:bg-white/20'}`}
          >
            {semCamera ? '📷 Câmera off' : '🎥 Câmera'}
          </button>
          <button type="button" onClick={sair} className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 font-bold text-xs cursor-pointer active:scale-95 transition">
            Sair
          </button>
        </footer>
      </div>
    );
  }

  // ── Lobby ──
  return (
    <div className="h-full overflow-y-auto p-3.5 space-y-3 text-xs">
      <section className="rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-800 text-white p-4">
        <h3 className="text-lg font-black">Reunião por vídeo</h3>
        <p className="text-blue-100 mt-1 leading-relaxed">
          Crie uma sala ou entre numa que já esteja aberta. Nesta versão a reunião comporta até {MAX_PARTICIPANTES} pessoas ao mesmo tempo.
        </p>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-2.5">
        <label className="block space-y-1">
          <span className="font-bold text-slate-600">Nome da sala</span>
          <input
            value={nomeSala}
            onChange={(e) => setNomeSala(e.target.value)}
            maxLength={30}
            placeholder="Ex.: Liderança, Célula Centro"
            className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-base sm:text-xs"
          />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={comCamera} onChange={(e) => setComCamera(e.target.checked)} className="w-4 h-4" />
          <span className="text-slate-700 font-semibold">Entrar com câmera ligada</span>
        </label>
        <button
          type="button"
          onClick={() => entrar(nomeSala)}
          disabled={entrando}
          className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm cursor-pointer active:scale-95 transition disabled:opacity-60"
        >
          {entrando ? 'Entrando…' : 'Criar / entrar na sala'}
        </button>
        <p className="text-[10px] text-slate-400">Quem digitar o mesmo nome de sala entra na mesma reunião.</p>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-3.5">
        <h3 className="font-bold text-slate-700 mb-2">Salas abertas agora</h3>
        {salasAtivas.length === 0 ? (
          <p className="text-slate-400">Nenhuma sala com participantes.</p>
        ) : (
          <ul className="space-y-1.5">
            {salasAtivas.map((s) => (
              <li key={s.sala} className="flex items-center justify-between gap-2 border border-slate-200 rounded-xl px-3 py-2">
                <span className="font-bold text-blue-900 truncate">{s.sala}</span>
                <span className="text-slate-500 shrink-0">
                  {s.total} {s.total === 1 ? 'pessoa' : 'pessoas'}
                </span>
                <button
                  type="button"
                  onClick={() => entrar(s.sala)}
                  disabled={entrando || s.total >= MAX_PARTICIPANTES}
                  className="shrink-0 px-3 py-1.5 rounded-full bg-blue-900 text-white font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {s.total >= MAX_PARTICIPANTES ? 'Cheia' : 'Entrar'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {aviso && <p className="text-center text-slate-600 bg-amber-50 border border-amber-200 rounded-xl p-2.5">{aviso}</p>}
    </div>
  );
}
