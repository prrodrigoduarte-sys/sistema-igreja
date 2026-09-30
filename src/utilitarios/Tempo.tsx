import React, { useCallback, useEffect, useRef, useState } from 'react';
import { IconeUtil } from './IconesUtil';

// Previsão do tempo com a API Open-Meteo (gratuita, sem chave, dados de modelos meteorológicos oficiais).
// Dados: Open-Meteo.com (licença CC BY 4.0). Uso gratuito é para fins não comerciais.

interface Local {
  nome: string;
  lat: number;
  lon: number;
}

const PADRAO: Local = { nome: 'Teófilo Otoni, MG', lat: -17.8575, lon: -41.5053 };
const CHAVE_LOCAL = 'util_tempo_local';

function lerLocalSalvo(): Local {
  try {
    const bruto = localStorage.getItem(CHAVE_LOCAL);
    if (bruto) {
      const l = JSON.parse(bruto);
      if (typeof l?.lat === 'number' && typeof l?.lon === 'number' && l?.nome) return l;
    }
  } catch {}
  return PADRAO;
}

// Códigos WMO usados pela Open-Meteo
function descrever(codigo: number, dia = true): { txt: string; icone: string } {
  const c = codigo;
  if (c === 0) return { txt: 'Céu limpo', icone: dia ? '☀️' : '🌙' };
  if (c === 1) return { txt: 'Predominantemente limpo', icone: dia ? '🌤️' : '🌙' };
  if (c === 2) return { txt: 'Parcialmente nublado', icone: dia ? '⛅' : '☁️' };
  if (c === 3) return { txt: 'Nublado', icone: '☁️' };
  if (c === 45 || c === 48) return { txt: 'Nevoeiro', icone: '🌫️' };
  if (c === 51) return { txt: 'Garoa fraca', icone: '🌦️' };
  if (c === 53) return { txt: 'Garoa', icone: '🌦️' };
  if (c === 55) return { txt: 'Garoa intensa', icone: '🌧️' };
  if (c === 56 || c === 57) return { txt: 'Garoa congelante', icone: '🌧️' };
  if (c === 61) return { txt: 'Chuva fraca', icone: '🌦️' };
  if (c === 63) return { txt: 'Chuva', icone: '🌧️' };
  if (c === 65) return { txt: 'Chuva forte', icone: '🌧️' };
  if (c === 66 || c === 67) return { txt: 'Chuva congelante', icone: '🌧️' };
  if (c === 71 || c === 73 || c === 75) return { txt: 'Neve', icone: '🌨️' };
  if (c === 77) return { txt: 'Grãos de neve', icone: '🌨️' };
  if (c === 80) return { txt: 'Pancadas de chuva fracas', icone: '🌦️' };
  if (c === 81) return { txt: 'Pancadas de chuva', icone: '🌧️' };
  if (c === 82) return { txt: 'Pancadas de chuva violentas', icone: '⛈️' };
  if (c === 85 || c === 86) return { txt: 'Pancadas de neve', icone: '🌨️' };
  if (c === 95) return { txt: 'Trovoada', icone: '⛈️' };
  if (c === 96 || c === 99) return { txt: 'Trovoada com granizo', icone: '⛈️' };
  return { txt: 'Condição desconhecida', icone: '❔' };
}

const ehChuva = (c: number) => (c >= 51 && c <= 67) || (c >= 80 && c <= 82) || c >= 95;

function rosaDosVentos(graus: number): string {
  const pontos = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'];
  return pontos[Math.round(graus / 45) % 8];
}

function classeUV(uv: number): string {
  if (uv < 3) return 'Baixo';
  if (uv < 6) return 'Moderado';
  if (uv < 8) return 'Alto';
  if (uv < 11) return 'Muito alto';
  return 'Extremo';
}

function dataLocal(iso: string): Date {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(a, m - 1, d);
}

const arred = (n: any) => (typeof n === 'number' ? Math.round(n) : '–');

export default function Tempo() {
  const [local, setLocal] = useState<Local>(lerLocalSalvo);
  const [dados, setDados] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [atualizadoEm, setAtualizadoEm] = useState('');
  const [busca, setBusca] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState<any[] | null>(null);
  const [erroBusca, setErroBusca] = useState('');
  const abortar = useRef<AbortController | null>(null);

  const carregar = useCallback(async (l: Local, silencioso = false) => {
    abortar.current?.abort();
    const ctl = new AbortController();
    abortar.current = ctl;
    if (!silencioso) setCarregando(true);
    setErro('');
    try {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${l.lat}&longitude=${l.lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m` +
        `&hourly=temperature_2m,precipitation_probability,weather_code,is_day` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunrise,sunset,uv_index_max` +
        `&timezone=auto&forecast_days=7&wind_speed_unit=kmh`;
      const resp = await fetch(url, { signal: ctl.signal });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      if (!json?.current || !json?.daily || !json?.hourly) throw new Error('Resposta inesperada');
      setDados(json);
      setAtualizadoEm(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      setErro('Não foi possível carregar a previsão. Verifique a conexão e tente de novo.');
    } finally {
      if (abortar.current === ctl) setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar(local);
    const t = setInterval(() => carregar(local, true), 10 * 60 * 1000);
    return () => {
      clearInterval(t);
      abortar.current?.abort();
    };
  }, [local, carregar]);

  const escolher = (l: Local) => {
    setLocal(l);
    setResultados(null);
    setBusca('');
    try {
      localStorage.setItem(CHAVE_LOCAL, JSON.stringify(l));
    } catch {}
  };

  const buscarCidade = async (e: React.FormEvent) => {
    e.preventDefault();
    const termo = busca.trim();
    if (termo.length < 2) return;
    setBuscando(true);
    setErroBusca('');
    try {
      const resp = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(termo)}&count=6&language=pt&format=json`
      );
      if (!resp.ok) throw new Error('falha');
      const json = await resp.json();
      setResultados(json.results || []);
    } catch {
      setErroBusca('Não foi possível buscar agora. Tente de novo.');
      setResultados(null);
    } finally {
      setBuscando(false);
    }
  };

  const usarMinhaLocalizacao = () => {
    if (!navigator.geolocation) return setErroBusca('Seu navegador não permite localização.');
    setErroBusca('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let nome = 'Minha localização';
        try {
          const r = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=pt`
          );
          const j = await r.json();
          if (j?.city || j?.locality) nome = [j.city || j.locality, j.principalSubdivisionCode?.split('-')[1]].filter(Boolean).join(', ');
        } catch {}
        escolher({ nome, lat: latitude, lon: longitude });
      },
      () => setErroBusca('Não foi possível obter sua localização. Permita o acesso e tente de novo.'),
      { timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  };

  // ── derivados ──
  const atual = dados?.current;
  const dia = atual?.is_day === 1;
  const info = atual ? descrever(atual.weather_code, dia) : null;

  const proximasHoras = (() => {
    if (!dados) return [] as number[];
    const times: string[] = dados.hourly.time;
    const agora = String(atual?.time || '').slice(0, 13) + ':00';
    let inicio = times.findIndex((t) => t >= agora);
    if (inicio < 0) inicio = 0;
    return Array.from({ length: 24 }, (_, i) => inicio + i).filter((i) => i < times.length);
  })();

  const fundo = !atual
    ? 'from-sky-500 to-blue-600'
    : ehChuva(atual.weather_code)
    ? 'from-slate-600 to-slate-800'
    : dia
    ? 'from-sky-500 to-blue-600'
    : 'from-indigo-900 to-slate-900';

  const minSemana = dados ? Math.min(...(dados.daily.temperature_2m_min as number[])) : 0;
  const maxSemana = dados ? Math.max(...(dados.daily.temperature_2m_max as number[])) : 1;
  const amplitude = Math.max(1, maxSemana - minSemana);

  return (
    <div className="max-w-xl mx-auto space-y-3 text-xs">
      {/* Busca de cidade */}
      <form onSubmit={buscarCidade} className="flex gap-2">
        <div className="relative flex-1">
          <IconeUtil nome="buscar" className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar cidade…"
            aria-label="Buscar cidade"
            className="w-full border border-slate-200 bg-white rounded-full pl-9 pr-3 py-2.5 text-base sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="button"
          onClick={usarMinhaLocalizacao}
          className="w-11 h-11 shrink-0 rounded-full bg-white border border-slate-200 text-blue-900 flex items-center justify-center cursor-pointer hover:bg-slate-50 active:scale-95 transition"
          aria-label="Usar minha localização"
          title="Usar minha localização"
        >
          <IconeUtil nome="local" className="w-5 h-5" />
        </button>
      </form>

      {buscando && <p className="text-slate-500 px-1">Buscando…</p>}
      {erroBusca && <p className="text-rose-700 px-1">{erroBusca}</p>}
      {resultados && (
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          {resultados.length === 0 ? (
            <p className="p-3 text-slate-500">Nenhuma cidade encontrada.</p>
          ) : (
            resultados.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() =>
                  escolher({
                    nome: [r.name, r.admin1].filter(Boolean).join(', '),
                    lat: r.latitude,
                    lon: r.longitude,
                  })
                }
                className="w-full text-left px-3 py-2.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer"
              >
                <span className="font-bold text-slate-800">{r.name}</span>
                <span className="text-slate-500">
                  {' '}
                  {[r.admin1, r.country].filter(Boolean).join(' · ')}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {carregando && !dados && <p className="text-center text-slate-500 py-10">Carregando previsão…</p>}

      {erro && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 p-3 flex items-center justify-between gap-3">
          <span>{erro}</span>
          <button type="button" onClick={() => carregar(local)} className="font-bold underline cursor-pointer shrink-0">
            Tentar de novo
          </button>
        </div>
      )}

      {dados && atual && info && (
        <>
          {/* Agora */}
          <section className={`rounded-3xl bg-gradient-to-b ${fundo} text-white p-5 shadow-lg`} aria-label="Tempo agora">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold flex items-center gap-1 truncate">
                  <IconeUtil nome="local" className="w-4 h-4 shrink-0" />
                  <span className="truncate">{local.nome}</span>
                </p>
                <p className="text-[11px] text-white/70 mt-0.5">
                  Atualizado às {atualizadoEm}
                </p>
              </div>
              <button
                type="button"
                onClick={() => carregar(local)}
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center cursor-pointer shrink-0"
                aria-label="Atualizar previsão"
                title="Atualizar"
              >
                <IconeUtil nome="atualizar" className={`w-4 h-4 ${carregando ? 'animate-spin motion-reduce:animate-none' : ''}`} />
              </button>
            </div>

            <div className="flex items-center justify-between mt-3">
              <div>
                <p className="text-6xl font-light leading-none tabular-nums">{arred(atual.temperature_2m)}°</p>
                <p className="text-sm mt-2">{info.txt}</p>
                <p className="text-[11px] text-white/80 mt-0.5">
                  Máx {arred(dados.daily.temperature_2m_max[0])}° · Mín {arred(dados.daily.temperature_2m_min[0])}°
                </p>
              </div>
              <span className="text-7xl leading-none" role="img" aria-label={info.txt}>
                {info.icone}
              </span>
            </div>

            <dl className="grid grid-cols-2 gap-2 mt-4 text-[11px]">
              <div className="rounded-xl bg-white/10 p-2.5">
                <dt className="text-white/70">Sensação térmica</dt>
                <dd className="text-base font-semibold">{arred(atual.apparent_temperature)}°</dd>
              </div>
              <div className="rounded-xl bg-white/10 p-2.5">
                <dt className="text-white/70">Umidade</dt>
                <dd className="text-base font-semibold">{arred(atual.relative_humidity_2m)}%</dd>
              </div>
              <div className="rounded-xl bg-white/10 p-2.5">
                <dt className="text-white/70">Vento</dt>
                <dd className="text-base font-semibold">
                  {arred(atual.wind_speed_10m)} km/h{' '}
                  {typeof atual.wind_direction_10m === 'number' ? rosaDosVentos(atual.wind_direction_10m) : ''}
                </dd>
              </div>
              <div className="rounded-xl bg-white/10 p-2.5">
                <dt className="text-white/70">Chuva agora</dt>
                <dd className="text-base font-semibold">{typeof atual.precipitation === 'number' ? atual.precipitation : 0} mm</dd>
              </div>
              <div className="rounded-xl bg-white/10 p-2.5">
                <dt className="text-white/70">Índice UV (máx. hoje)</dt>
                <dd className="text-base font-semibold">
                  {arred(dados.daily.uv_index_max[0])} · {classeUV(dados.daily.uv_index_max[0] ?? 0)}
                </dd>
              </div>
              <div className="rounded-xl bg-white/10 p-2.5">
                <dt className="text-white/70">Nascer / pôr do sol</dt>
                <dd className="text-base font-semibold">
                  {String(dados.daily.sunrise[0]).slice(11, 16)} / {String(dados.daily.sunset[0]).slice(11, 16)}
                </dd>
              </div>
            </dl>
          </section>

          {/* Próximas horas */}
          <section className="rounded-2xl bg-white border border-slate-200 p-3" aria-label="Próximas 24 horas">
            <h3 className="font-bold text-slate-700 mb-2">Próximas 24 horas</h3>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {proximasHoras.map((i, pos) => {
                const h = descrever(dados.hourly.weather_code[i], dados.hourly.is_day?.[i] !== 0);
                const prob = dados.hourly.precipitation_probability?.[i];
                return (
                  <div key={i} className="shrink-0 w-14 text-center">
                    <p className="text-[11px] text-slate-500">{pos === 0 ? 'Agora' : String(dados.hourly.time[i]).slice(11, 13) + 'h'}</p>
                    <p className="text-2xl my-1" role="img" aria-label={h.txt}>
                      {h.icone}
                    </p>
                    <p className="font-bold text-slate-800">{arred(dados.hourly.temperature_2m[i])}°</p>
                    <p className={`text-[10px] ${typeof prob === 'number' && prob >= 40 ? 'text-blue-700 font-semibold' : 'text-slate-400'}`}>
                      {typeof prob === 'number' ? `${prob}%` : ''}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 7 dias */}
          <section className="rounded-2xl bg-white border border-slate-200 p-3" aria-label="Próximos 7 dias">
            <h3 className="font-bold text-slate-700 mb-1">Próximos 7 dias</h3>
            <ul>
              {dados.daily.time.map((t: string, i: number) => {
                const d = descrever(dados.daily.weather_code[i], true);
                const min = dados.daily.temperature_2m_min[i];
                const max = dados.daily.temperature_2m_max[i];
                const esq = ((min - minSemana) / amplitude) * 100;
                const larg = Math.max(6, ((max - min) / amplitude) * 100);
                const prob = dados.daily.precipitation_probability_max?.[i];
                const nomeDia =
                  i === 0
                    ? 'Hoje'
                    : i === 1
                    ? 'Amanhã'
                    : dataLocal(t).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
                return (
                  <li key={t} className="flex items-center gap-2 py-2 border-b border-slate-100 last:border-0">
                    <span className="w-14 font-semibold text-slate-700 capitalize">{nomeDia}</span>
                    <span className="text-xl w-7 text-center" role="img" aria-label={d.txt}>
                      {d.icone}
                    </span>
                    <span className="w-9 text-[10px] text-blue-700 font-semibold text-right">
                      {typeof prob === 'number' && prob > 0 ? `${prob}%` : ''}
                    </span>
                    <span className="w-7 text-right text-slate-500 tabular-nums">{arred(min)}°</span>
                    <span className="flex-1 h-1.5 rounded-full bg-slate-100 relative mx-1">
                      <span
                        className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-sky-400 to-orange-400"
                        style={{ left: `${esq}%`, width: `${Math.min(larg, 100 - esq)}%` }}
                      />
                    </span>
                    <span className="w-7 font-bold text-slate-800 tabular-nums">{arred(max)}°</span>
                  </li>
                );
              })}
            </ul>
          </section>

          <p className="text-[10px] text-slate-400 text-center pb-2">
            Dados meteorológicos por{' '}
            <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="underline">
              Open-Meteo.com
            </a>
          </p>
        </>
      )}
    </div>
  );
}
