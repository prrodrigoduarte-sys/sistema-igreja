import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IconeUtil } from './IconesUtil';
import { subtitulosDoCapitulo } from './bibliaTitulos';
import DevocionalPessoal, { lerDevocionais, type Rascunho } from './DevocionalPessoal';

// Bíblia online gratuita.
// Texto: API pública do bolls.life (gratuita, sem chave). Subtítulos: arquivo bibliaTitulos.ts.

const VERSOES = [
  { id: 'NVIPT', sigla: 'NVI', nome: 'Nova Versão Internacional' },
  { id: 'NAA', sigla: 'NAA', nome: 'Nova Almeida Atualizada' },
  { id: 'ARA', sigla: 'ARA', nome: 'Almeida Revista e Atualizada' },
  { id: 'ARC09', sigla: 'ARC', nome: 'Almeida Revista e Corrigida' },
  { id: 'ACF11', sigla: 'ACF', nome: 'Almeida Corrigida Fiel' },
  { id: 'NVT', sigla: 'NVT', nome: 'Nova Versão Transformadora' },
  { id: 'NTLH', sigla: 'NTLH', nome: 'Nova Tradução na Linguagem de Hoje' },
  { id: 'KJA', sigla: 'KJA', nome: 'King James Atualizada' },
];

// [nome, abreviação, capítulos] — na ordem: 1 = Gênesis ... 66 = Apocalipse
const LIVROS: [string, string, number][] = [
  ['Gênesis', 'Gn', 50], ['Êxodo', 'Êx', 40], ['Levítico', 'Lv', 27], ['Números', 'Nm', 36], ['Deuteronômio', 'Dt', 34],
  ['Josué', 'Js', 24], ['Juízes', 'Jz', 21], ['Rute', 'Rt', 4], ['1 Samuel', '1Sm', 31], ['2 Samuel', '2Sm', 24],
  ['1 Reis', '1Rs', 22], ['2 Reis', '2Rs', 25], ['1 Crônicas', '1Cr', 29], ['2 Crônicas', '2Cr', 36], ['Esdras', 'Ed', 10],
  ['Neemias', 'Ne', 13], ['Ester', 'Et', 10], ['Jó', 'Jó', 42], ['Salmos', 'Sl', 150], ['Provérbios', 'Pv', 31],
  ['Eclesiastes', 'Ec', 12], ['Cântico dos Cânticos', 'Ct', 8], ['Isaías', 'Is', 66], ['Jeremias', 'Jr', 52], ['Lamentações', 'Lm', 5],
  ['Ezequiel', 'Ez', 48], ['Daniel', 'Dn', 12], ['Oseias', 'Os', 14], ['Joel', 'Jl', 3], ['Amós', 'Am', 9],
  ['Obadias', 'Ob', 1], ['Jonas', 'Jn', 4], ['Miqueias', 'Mq', 7], ['Naum', 'Na', 3], ['Habacuque', 'Hc', 3],
  ['Sofonias', 'Sf', 3], ['Ageu', 'Ag', 2], ['Zacarias', 'Zc', 14], ['Malaquias', 'Ml', 4],
  ['Mateus', 'Mt', 28], ['Marcos', 'Mc', 16], ['Lucas', 'Lc', 24], ['João', 'Jo', 21], ['Atos', 'At', 28],
  ['Romanos', 'Rm', 16], ['1 Coríntios', '1Co', 16], ['2 Coríntios', '2Co', 13], ['Gálatas', 'Gl', 6], ['Efésios', 'Ef', 6],
  ['Filipenses', 'Fp', 4], ['Colossenses', 'Cl', 4], ['1 Tessalonicenses', '1Ts', 5], ['2 Tessalonicenses', '2Ts', 3], ['1 Timóteo', '1Tm', 6],
  ['2 Timóteo', '2Tm', 4], ['Tito', 'Tt', 3], ['Filemom', 'Fm', 1], ['Hebreus', 'Hb', 13], ['Tiago', 'Tg', 5],
  ['1 Pedro', '1Pe', 5], ['2 Pedro', '2Pe', 3], ['1 João', '1Jo', 5], ['2 João', '2Jo', 1], ['3 João', '3Jo', 1],
  ['Judas', 'Jd', 1], ['Apocalipse', 'Ap', 22],
];

const CHAVE_POSICAO = 'util_biblia_posicao';
const TAMANHOS = [15, 17, 19, 22, 25];

interface Versiculo {
  n: number;
  texto: string;
  titulo?: string; // título do salmo (quando a versão traz)
}

interface Posicao {
  versao: string;
  livro: number;
  cap: number;
  tam: number;
}

function lerPosicao(): Posicao {
  const padrao: Posicao = { versao: 'NVIPT', livro: 43, cap: 3, tam: 1 };
  try {
    const p = JSON.parse(localStorage.getItem(CHAVE_POSICAO) || 'null');
    if (p && VERSOES.some((v) => v.id === p.versao) && p.livro >= 1 && p.livro <= 66 && p.cap >= 1 && p.cap <= LIVROS[p.livro - 1][2]) {
      return { ...padrao, ...p, tam: TAMANHOS[p.tam] ? p.tam : 1 };
    }
  } catch {}
  return padrao;
}

// O texto da API vem com marcações (<br>, <sup>nota</sup>, <b>título do salmo</b>...). Aqui vira texto limpo.
function limpar(html: string): string {
  const semNotas = html.replace(/<sup>.*?<\/sup>/gi, '').replace(/<br\s*\/?>/gi, ' ');
  const doc = new DOMParser().parseFromString(`<body>${semNotas}</body>`, 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}

function montarVersiculo(v: { verse: number; text: string }): Versiculo {
  const m = /^\s*<b>([\s\S]*?)<\/b>([\s\S]*)$/i.exec(v.text || '');
  if (m) {
    const titulo = limpar(m[1]);
    const texto = limpar(m[2]);
    if (titulo && texto) return { n: v.verse, titulo, texto };
  }
  return { n: v.verse, texto: limpar(v.text || '') };
}

const semAcento = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Entende "Jo 3:16", "joão 3", "1co 13", "salmos 23.1"
function interpretarReferencia(texto: string): { livro: number; cap: number; vers?: number } | null {
  const m = /^\s*([1-3]?\s*[a-zA-ZÀ-ÿ ]+?)\s*(\d+)(?:\s*[:.,]\s*(\d+))?\s*$/.exec(texto);
  if (!m) return null;
  const alvo = semAcento(m[1].replace(/\s+/g, ''));
  let livro = LIVROS.findIndex(([nome, abrev]) => semAcento(abrev) === alvo || semAcento(nome.replace(/\s+/g, '')) === alvo);
  if (livro < 0) livro = LIVROS.findIndex(([nome]) => alvo.length >= 3 && semAcento(nome.replace(/\s+/g, '')).startsWith(alvo));
  if (livro < 0) return null;
  const cap = Number(m[2]);
  if (cap < 1 || cap > LIVROS[livro][2]) return null;
  return { livro: livro + 1, cap, vers: m[3] ? Number(m[3]) : undefined };
}

const cache = new Map<string, Versiculo[]>();

interface Props {
  emailUsuario?: string;
  nomeUsuario?: string;
}

export default function Biblia({ emailUsuario = '', nomeUsuario = '' }: Props) {
  const [pos, setPos] = useState<Posicao>(lerPosicao);
  const [versiculos, setVersiculos] = useState<Versiculo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [seletor, setSeletor] = useState<null | 'livros' | 'capitulos'>(null);
  const [livroEscolhido, setLivroEscolhido] = useState(pos.livro);
  const [testamento, setTestamento] = useState<'AT' | 'NT'>(pos.livro >= 40 ? 'NT' : 'AT');
  const [marcados, setMarcados] = useState<number[]>([]);
  const [destaque, setDestaque] = useState<number | null>(null);
  const [busca, setBusca] = useState('');
  const [erroBusca, setErroBusca] = useState('');
  const [aviso, setAviso] = useState('');
  // null = fechado; 'lista' = meus devocionais; objeto = novo devocional com os versículos marcados
  const [devocional, setDevocional] = useState<null | 'lista' | Rascunho>(null);
  const [totalDevocionais, setTotalDevocionais] = useState(() => lerDevocionais(emailUsuario).length);
  const abortar = useRef<AbortController | null>(null);
  const topo = useRef<HTMLDivElement | null>(null);

  const [nomeLivro, , totalCaps] = LIVROS[pos.livro - 1];
  const versao = VERSOES.find((v) => v.id === pos.versao) || VERSOES[0];

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_POSICAO, JSON.stringify(pos));
    } catch {}
  }, [pos]);

  const carregar = useCallback(async (p: Posicao) => {
    const chave = `${p.versao}/${p.livro}/${p.cap}`;
    setMarcados([]);
    setErro('');
    const salvo = cache.get(chave);
    if (salvo) {
      setVersiculos(salvo);
      setCarregando(false);
      return;
    }
    abortar.current?.abort();
    const ctl = new AbortController();
    abortar.current = ctl;
    setCarregando(true);
    try {
      const resp = await fetch(`https://bolls.life/get-text/${p.versao}/${p.livro}/${p.cap}/`, { signal: ctl.signal });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      if (!Array.isArray(json) || json.length === 0) throw new Error('Capítulo vazio');
      const lista = json.map(montarVersiculo).sort((a: Versiculo, b: Versiculo) => a.n - b.n);
      cache.set(chave, lista);
      setVersiculos(lista);
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      setErro('Não foi possível carregar o capítulo. Verifique a conexão e tente de novo.');
    } finally {
      if (abortar.current === ctl) setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar(pos);
  }, [pos.versao, pos.livro, pos.cap, carregar]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ao trocar de capítulo, volta para o topo (a não ser que esteja indo para um versículo)
  useEffect(() => {
    if (!carregando && !destaque) topo.current?.scrollIntoView({ block: 'start' });
  }, [carregando, pos.livro, pos.cap]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rola até o versículo procurado e o destaca por alguns segundos
  useEffect(() => {
    if (carregando || !destaque) return;
    document.getElementById(`bib-v${destaque}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const t = setTimeout(() => setDestaque(null), 4000);
    return () => clearTimeout(t);
  }, [carregando, destaque]);

  useEffect(() => () => abortar.current?.abort(), []);

  const irPara = (livro: number, cap: number) => {
    setPos((p) => ({ ...p, livro, cap }));
    setSeletor(null);
  };

  const anterior = () => {
    if (pos.cap > 1) irPara(pos.livro, pos.cap - 1);
    else if (pos.livro > 1) irPara(pos.livro - 1, LIVROS[pos.livro - 2][2]);
  };
  const proximo = () => {
    if (pos.cap < totalCaps) irPara(pos.livro, pos.cap + 1);
    else if (pos.livro < 66) irPara(pos.livro + 1, 1);
  };

  const buscar = (e: React.FormEvent) => {
    e.preventDefault();
    const r = interpretarReferencia(busca);
    if (!r) {
      setErroBusca('Não entendi. Exemplos: Jo 3:16, Salmos 23, 1Co 13');
      return;
    }
    setErroBusca('');
    setBusca('');
    setTestamento(r.livro >= 40 ? 'NT' : 'AT');
    setLivroEscolhido(r.livro);
    if (r.vers) setDestaque(r.vers);
    irPara(r.livro, r.cap);
  };

  const alternarMarcado = (n: number) => setMarcados((m) => (m.includes(n) ? m.filter((x) => x !== n) : [...m, n].sort((a, b) => a - b)));

  const selecao = useMemo(() => {
    if (marcados.length === 0) return { corpo: '', referencia: '' };
    const sel = versiculos.filter((v) => marcados.includes(v.n));
    // Referência compacta: 1-3, 5
    const faixas: string[] = [];
    let ini = marcados[0];
    let ant = marcados[0];
    for (const n of [...marcados.slice(1), -1]) {
      if (n === ant + 1) {
        ant = n;
        continue;
      }
      faixas.push(ini === ant ? `${ini}` : `${ini}-${ant}`);
      ini = n;
      ant = n;
    }
    const corpo = sel.map((v) => (sel.length > 1 ? `${v.n} ${v.texto}` : v.texto)).join(' ');
    return { corpo, referencia: `${nomeLivro} ${pos.cap}:${faixas.join(', ')} (${versao.sigla})` };
  }, [marcados, versiculos, nomeLivro, pos.cap, versao.sigla]);

  const textoMarcado = selecao.corpo ? `"${selecao.corpo}"\n${selecao.referencia}` : '';

  const mostrarAviso = (t: string) => {
    setAviso(t);
    setTimeout(() => setAviso(''), 2000);
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(textoMarcado);
      mostrarAviso('Copiado!');
    } catch {
      mostrarAviso('Não foi possível copiar');
    }
  };

  const compartilhar = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: textoMarcado });
      } catch {}
      return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(textoMarcado)}`, '_blank', 'noopener');
  };

  const subtitulos = useMemo(() => subtitulosDoCapitulo(pos.livro, pos.cap), [pos.livro, pos.cap]);

  // Cada subtítulo aparece antes do primeiro versículo com número igual ou maior
  const titulosPorVerso = useMemo(() => {
    const mapa = new Map<number, string[]>();
    let i = 0;
    for (const v of versiculos) {
      while (i < subtitulos.length && subtitulos[i].v <= v.n) {
        mapa.set(v.n, [...(mapa.get(v.n) || []), subtitulos[i].t]);
        i++;
      }
    }
    return mapa;
  }, [versiculos, subtitulos]);

  const tamanho = TAMANHOS[pos.tam];

  return (
    <div className="max-w-2xl mx-auto pb-24" ref={topo}>
      {/* Cabeçalho */}
      <div className="rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white p-4 shadow-lg shadow-orange-500/25">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setLivroEscolhido(pos.livro);
              setTestamento(pos.livro >= 40 ? 'NT' : 'AT');
              setSeletor('livros');
            }}
            className="flex-1 min-w-0 text-left rounded-2xl bg-white/15 hover:bg-white/25 px-3 py-2 cursor-pointer active:scale-[0.98] transition"
          >
            <span className="block text-[11px] font-bold uppercase tracking-wider text-amber-100">Livro e capítulo</span>
            <span className="block font-black text-xl leading-tight truncate">
              {nomeLivro} {pos.cap}
            </span>
          </button>
          <label className="shrink-0 rounded-2xl bg-white/15 hover:bg-white/25 px-3 py-2 cursor-pointer transition">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-amber-100">Versão</span>
            <select
              value={pos.versao}
              onChange={(e) => setPos((p) => ({ ...p, versao: e.target.value }))}
              className="bg-transparent font-black text-lg outline-none cursor-pointer [&>option]:text-slate-800"
              aria-label="Versão da Bíblia"
            >
              {VERSOES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.sigla}
                </option>
              ))}
            </select>
          </label>
        </div>

        <form onSubmit={buscar} className="mt-3 flex gap-2">
          <div className="flex-1 flex items-center gap-2 rounded-2xl bg-white px-3 text-slate-700">
            <IconeUtil nome="buscar" className="w-4 h-4 text-orange-500 shrink-0" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Ir para... ex.: Jo 3:16"
              className="flex-1 min-w-0 py-2.5 text-sm outline-none bg-transparent"
              aria-label="Buscar referência"
            />
          </div>
          <button type="submit" className="rounded-2xl bg-slate-900/80 hover:bg-slate-900 px-4 text-sm font-bold cursor-pointer active:scale-95 transition">
            Ir
          </button>
        </form>
        {erroBusca && <p className="mt-2 text-xs font-semibold text-white bg-rose-700/40 rounded-xl px-3 py-1.5">{erroBusca}</p>}
      </div>

      {/* Barra de leitura */}
      <div className="flex items-center justify-between gap-2 mt-3 px-1">
        <button
          type="button"
          onClick={() => setDevocional('lista')}
          className="min-w-0 flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-pink-500 text-white pl-1.5 pr-3.5 py-1.5 text-xs font-bold shadow-md shadow-fuchsia-500/25 cursor-pointer active:scale-95 transition"
        >
          <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <IconeUtil nome="coracao" className="w-3.5 h-3.5" espessura={2} />
          </span>
          <span className="truncate">Meus devocionais{totalDevocionais > 0 ? ` (${totalDevocionais})` : ''}</span>
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setPos((p) => ({ ...p, tam: Math.max(0, p.tam - 1) }))}
            disabled={pos.tam === 0}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-700 font-bold text-xs cursor-pointer disabled:opacity-40 active:scale-95 transition"
            aria-label="Diminuir letra"
          >
            A−
          </button>
          <button
            type="button"
            onClick={() => setPos((p) => ({ ...p, tam: Math.min(TAMANHOS.length - 1, p.tam + 1) }))}
            disabled={pos.tam === TAMANHOS.length - 1}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-700 font-bold text-base cursor-pointer disabled:opacity-40 active:scale-95 transition"
            aria-label="Aumentar letra"
          >
            A+
          </button>
        </div>
      </div>

      {/* Texto */}
      <article className="mt-2 rounded-3xl bg-white border border-slate-200 px-4 sm:px-6 py-5 shadow-sm">
        <h2 className="text-center font-black text-2xl text-slate-800">
          {nomeLivro} <span className="text-orange-500">{pos.cap}</span>
        </h2>

        {carregando && (
          <div className="py-10 space-y-3 animate-pulse" aria-label="Carregando">
            {[90, 100, 80, 95, 70, 100, 85].map((w, i) => (
              <div key={i} className="h-3.5 rounded-full bg-slate-100" style={{ width: `${w}%` }} />
            ))}
          </div>
        )}

        {!carregando && erro && (
          <div className="py-10 text-center">
            <p className="text-sm text-slate-600">{erro}</p>
            <button
              type="button"
              onClick={() => carregar(pos)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-orange-500 text-white text-sm font-bold px-4 py-2 cursor-pointer active:scale-95 transition"
            >
              <IconeUtil nome="atualizar" className="w-4 h-4" />
              Tentar de novo
            </button>
          </div>
        )}

        {!carregando && !erro && (
          <div className="mt-3 text-slate-800" style={{ fontSize: tamanho, lineHeight: 1.75 }}>
            {versiculos.map((v) => (
              <React.Fragment key={v.n}>
                {(titulosPorVerso.get(v.n) || []).map((t, i) => (
                  <h3
                    key={i}
                    className="mt-5 mb-1.5 font-black text-orange-600 leading-snug flex items-center gap-2"
                    style={{ fontSize: Math.round(tamanho * 0.95) }}
                  >
                    <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-amber-400 to-rose-500 shrink-0" aria-hidden="true" />
                    {t}
                  </h3>
                ))}
                {v.titulo && <p className="italic text-slate-500 my-2" style={{ fontSize: Math.round(tamanho * 0.85) }}>{v.titulo}</p>}
                <span
                  id={`bib-v${v.n}`}
                  onClick={() => alternarMarcado(v.n)}
                  className={`cursor-pointer rounded-md transition-colors ${
                    marcados.includes(v.n)
                      ? 'bg-amber-200/70 underline decoration-orange-400 decoration-2 underline-offset-4'
                      : destaque === v.n
                        ? 'bg-yellow-200'
                        : 'hover:bg-orange-50'
                  }`}
                >
                  <sup className="font-black text-orange-500 mr-0.5 select-none" style={{ fontSize: Math.round(tamanho * 0.6) }}>
                    {v.n}
                  </sup>
                  {v.texto}{' '}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}

        {!carregando && !erro && versiculos.length > 0 && (
          <p className="mt-6 text-center text-[11px] text-slate-400">Toque em um versículo para copiar ou compartilhar</p>
        )}
      </article>

      {/* Navegação entre capítulos */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={anterior}
          disabled={pos.livro === 1 && pos.cap === 1}
          className="rounded-2xl bg-white border border-slate-200 py-3 font-bold text-sm text-slate-700 flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 active:scale-[0.98] transition"
        >
          <IconeUtil nome="voltar" className="w-4 h-4" />
          Anterior
        </button>
        <button
          type="button"
          onClick={proximo}
          disabled={pos.livro === 66 && pos.cap === totalCaps}
          className="rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 py-3 font-bold text-sm text-white flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 active:scale-[0.98] transition shadow-md shadow-orange-500/25"
        >
          Próximo
          <IconeUtil nome="voltar" className="w-4 h-4 rotate-180" />
        </button>
      </div>

      <p className="mt-4 text-center text-[10px] text-slate-400 leading-relaxed">
        Texto: bolls.life · Subtítulos baseados na Berean Standard Bible (domínio público)
      </p>

      {/* Ações para versículos marcados */}
      {marcados.length > 0 && (
        <div className="fixed left-0 right-0 bottom-4 z-40 flex justify-center px-4 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-slate-900 text-white shadow-2xl p-1.5">
            <span
              className="w-7 h-7 rounded-full bg-white/15 text-xs font-black flex items-center justify-center shrink-0"
              aria-label={`${marcados.length} ${marcados.length === 1 ? 'versículo marcado' : 'versículos marcados'}`}
            >
              {marcados.length}
            </span>
            <button
              type="button"
              onClick={() => {
                setDevocional({ referencia: selecao.referencia, versiculo: selecao.corpo });
                setMarcados([]);
              }}
              className="rounded-full bg-gradient-to-r from-violet-600 to-pink-500 px-3 py-2 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <IconeUtil nome="coracao" className="w-4 h-4" />
              Devocional
            </button>
            <button type="button" onClick={copiar} className="rounded-full bg-white/10 hover:bg-white/20 px-3 py-2 text-xs font-bold flex items-center gap-1 cursor-pointer">
              <IconeUtil nome="copiar" className="w-4 h-4" />
              Copiar
            </button>
            <button
              type="button"
              onClick={compartilhar}
              className="rounded-full bg-gradient-to-r from-emerald-500 to-green-600 px-3 py-2 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <IconeUtil nome="compartilhar" className="w-4 h-4" />
              Enviar
            </button>
            <button type="button" onClick={() => setMarcados([])} className="rounded-full hover:bg-white/10 w-8 h-8 flex items-center justify-center cursor-pointer" aria-label="Limpar seleção">
              <IconeUtil nome="fechar" className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {devocional && (
        <DevocionalPessoal
          key={typeof devocional === 'string' ? 'lista' : devocional.referencia}
          email={emailUsuario}
          nome={nomeUsuario}
          rascunho={typeof devocional === 'string' ? null : devocional}
          onFechar={() => setDevocional(null)}
          onMudou={setTotalDevocionais}
        />
      )}
      {aviso && (
        <div className="fixed left-1/2 -translate-x-1/2 top-20 z-50 rounded-full bg-emerald-600 text-white text-sm font-bold px-4 py-2 shadow-lg">{aviso}</div>
      )}

      {/* Seletor de livro e capítulo */}
      {seletor && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-end sm:items-center justify-center" onClick={() => setSeletor(null)}>
          <div
            className="bg-white w-full sm:max-w-lg max-h-[85vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Escolher livro e capítulo"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
              {seletor === 'capitulos' && (
                <button type="button" onClick={() => setSeletor('livros')} className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center cursor-pointer" aria-label="Voltar aos livros">
                  <IconeUtil nome="voltar" className="w-5 h-5" />
                </button>
              )}
              <h3 className="flex-1 font-black text-slate-800">{seletor === 'livros' ? 'Escolha o livro' : LIVROS[livroEscolhido - 1][0]}</h3>
              <button type="button" onClick={() => setSeletor(null)} className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center cursor-pointer" aria-label="Fechar">
                <IconeUtil nome="fechar" className="w-5 h-5" />
              </button>
            </div>

            {seletor === 'livros' && (
              <>
                <div className="grid grid-cols-2 gap-1 m-3 p-1 rounded-2xl bg-slate-100">
                  {(['AT', 'NT'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTestamento(t)}
                      className={`rounded-xl py-2 text-sm font-bold cursor-pointer transition ${
                        testamento === t ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      {t === 'AT' ? 'Antigo Testamento' : 'Novo Testamento'}
                    </button>
                  ))}
                </div>
                <div className="overflow-y-auto px-3 pb-4 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {LIVROS.map(([nome, abrev], i) => {
                    const n = i + 1;
                    if ((testamento === 'AT') !== n < 40) return null;
                    const atual = n === pos.livro;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => {
                          setLivroEscolhido(n);
                          if (LIVROS[i][2] === 1) irPara(n, 1);
                          else setSeletor('capitulos');
                        }}
                        className={`text-left rounded-xl px-3 py-2.5 flex items-center gap-2 cursor-pointer active:scale-[0.97] transition ${
                          atual ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' : 'bg-slate-50 hover:bg-orange-50 text-slate-700'
                        }`}
                      >
                        <span className={`text-[10px] font-black w-7 shrink-0 ${atual ? 'text-amber-100' : 'text-orange-500'}`}>{abrev}</span>
                        <span className="text-sm font-semibold truncate">{nome}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {seletor === 'capitulos' && (
              <div className="overflow-y-auto p-3 grid grid-cols-6 sm:grid-cols-8 gap-1.5">
                {Array.from({ length: LIVROS[livroEscolhido - 1][2] }, (_, i) => i + 1).map((c) => {
                  const atual = livroEscolhido === pos.livro && c === pos.cap;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => irPara(livroEscolhido, c)}
                      className={`aspect-square rounded-xl text-sm font-bold cursor-pointer active:scale-95 transition ${
                        atual ? 'bg-gradient-to-br from-amber-500 to-rose-500 text-white' : 'bg-slate-50 hover:bg-orange-100 text-slate-700'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
