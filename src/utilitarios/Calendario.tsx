import React, { useMemo, useState } from 'react';
import { IconeUtil } from './IconesUtil';
import { TipoData, chaveData, dataDeChave, datasDoAno, diaDoAno, diasNoAno, semanaISO } from './feriados';

interface Compromisso {
  data: string; // AAAA-MM-DD
  descricao: string;
  hora?: string;
}

interface Props {
  compromissos?: Compromisso[];
}

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const COR_TIPO: Record<TipoData, string> = {
  nacional: 'text-rose-600 font-bold',
  facultativo: 'text-amber-600 font-bold',
  religioso: 'text-violet-600 font-bold',
  comemorativo: 'text-violet-600 font-semibold',
};

const ROTULO_TIPO: Record<TipoData, string> = {
  nacional: 'Feriado nacional',
  facultativo: 'Ponto facultativo',
  religioso: 'Data religiosa',
  comemorativo: 'Data comemorativa',
};

const CHIP_TIPO: Record<TipoData, string> = {
  nacional: 'bg-rose-50 text-rose-700 border-rose-200',
  facultativo: 'bg-amber-50 text-amber-700 border-amber-200',
  religioso: 'bg-violet-50 text-violet-700 border-violet-200',
  comemorativo: 'bg-violet-50 text-violet-700 border-violet-200',
};

export default function Calendario({ compromissos = [] }: Props) {
  const hoje = new Date();
  const chaveHoje = chaveData(hoje);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [selecionada, setSelecionada] = useState(chaveHoje);

  const datas = useMemo(() => datasDoAno(ano), [ano]);

  const compromissosPorDia = useMemo(() => {
    const mapa: Record<string, Compromisso[]> = {};
    compromissos.forEach((c) => {
      if (!c.data) return;
      (mapa[c.data] ||= []).push(c);
    });
    return mapa;
  }, [compromissos]);

  const listaDatas = useMemo(() => Object.entries(datas).sort(([a], [b]) => a.localeCompare(b)), [datas]);

  const irParaAno = (novo: number) => {
    if (!Number.isFinite(novo) || novo < 1900 || novo > 2200) return;
    setAno(novo);
    // mantém o mesmo dia/mês selecionado no novo ano, quando existir
    const sel = dataDeChave(selecionada);
    const nova = new Date(novo, sel.getMonth(), sel.getDate());
    setSelecionada(chaveData(nova.getMonth() === sel.getMonth() ? nova : new Date(novo, sel.getMonth(), 1)));
  };

  const irParaHoje = () => {
    setAno(hoje.getFullYear());
    setSelecionada(chaveHoje);
  };

  // ── painel do dia selecionado ──
  const dSel = dataDeChave(selecionada);
  const especial = datas[selecionada];
  const diasAte = Math.round((dSel.getTime() - dataDeChave(chaveHoje).getTime()) / 86400000);
  const textoRelativo =
    diasAte === 0 ? 'É hoje' : diasAte > 0 ? `Faltam ${diasAte} ${diasAte === 1 ? 'dia' : 'dias'}` : `Foi há ${-diasAte} ${diasAte === -1 ? 'dia' : 'dias'}`;
  const compromissosDoDia = compromissosPorDia[selecionada] || [];

  return (
    <div className="space-y-3 text-xs">
      {/* Controles do ano */}
      <div className="flex items-center justify-between gap-2 bg-white rounded-2xl border border-slate-200 p-2">
        <button
          type="button"
          onClick={() => irParaAno(ano - 1)}
          className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center cursor-pointer"
          aria-label="Ano anterior"
        >
          <IconeUtil nome="voltar" className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={ano}
            min={1900}
            max={2200}
            onChange={(e) => irParaAno(Number(e.target.value))}
            aria-label="Ano"
            className="w-24 text-center text-xl font-black text-blue-900 bg-transparent outline-none focus:ring-2 focus:ring-blue-500 rounded-lg py-1"
          />
          <button
            type="button"
            onClick={irParaHoje}
            className="px-3 py-1.5 rounded-full bg-blue-900 text-white font-bold cursor-pointer hover:bg-blue-800 active:scale-95 transition"
          >
            Hoje
          </button>
        </div>
        <button
          type="button"
          onClick={() => irParaAno(ano + 1)}
          className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center cursor-pointer"
          aria-label="Próximo ano"
        >
          <IconeUtil nome="voltar" className="w-5 h-5 rotate-180" />
        </button>
      </div>

      {/* Dia selecionado */}
      <section className="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-2" aria-live="polite">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-black text-blue-900 text-sm capitalize">
              {dSel.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>
            <p className="text-slate-500 mt-0.5">
              {textoRelativo} · Dia {diaDoAno(dSel)} de {diasNoAno(dSel.getFullYear())} · Semana {semanaISO(dSel)}
            </p>
          </div>
        </div>
        {especial && (
          <p className={`inline-block px-2.5 py-1 rounded-full border font-semibold ${CHIP_TIPO[especial.tipo]}`}>
            {especial.nome} · {ROTULO_TIPO[especial.tipo]}
          </p>
        )}
        {compromissosDoDia.length > 0 && (
          <ul className="space-y-1 pt-1">
            {compromissosDoDia.map((c, i) => (
              <li key={i} className="flex gap-2 items-baseline">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 translate-y-[-1px]" />
                <span className="text-slate-700">
                  {c.hora ? <strong className="mr-1">{c.hora.slice(0, 5)}</strong> : null}
                  {c.descricao}
                </span>
              </li>
            ))}
          </ul>
        )}
        {!especial && compromissosDoDia.length === 0 && <p className="text-slate-400">Sem feriados nem compromissos neste dia.</p>}
      </section>

      {/* Legenda */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 px-1">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-blue-900" /> Hoje
        </span>
        <span className="flex items-center gap-1">
          <span className="font-bold text-rose-600">12</span> Feriado nacional
        </span>
        <span className="flex items-center gap-1">
          <span className="font-bold text-amber-600">12</span> Ponto facultativo
        </span>
        <span className="flex items-center gap-1">
          <span className="font-bold text-violet-600">12</span> Religioso / comemorativo
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Compromisso na agenda
        </span>
      </div>

      {/* Os 12 meses */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {MESES.map((nomeMes, m) => {
          const primeiroDiaSemana = new Date(ano, m, 1).getDay();
          const totalDias = new Date(ano, m + 1, 0).getDate();
          const celulas: (number | null)[] = [
            ...Array.from({ length: primeiroDiaSemana }, () => null),
            ...Array.from({ length: totalDias }, (_, i) => i + 1),
          ];
          return (
            <section key={m} className="bg-white rounded-2xl border border-slate-200 p-2" aria-label={`${nomeMes} de ${ano}`}>
              <h4 className={`text-center font-bold mb-1 ${ano === hoje.getFullYear() && m === hoje.getMonth() ? 'text-blue-700' : 'text-slate-700'}`}>
                {nomeMes}
              </h4>
              <div className="grid grid-cols-7 text-center text-[9px] text-slate-400 mb-0.5" aria-hidden="true">
                {DIAS_SEMANA.map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {celulas.map((dia, i) => {
                  if (dia === null) return <span key={`v${i}`} />;
                  const k = `${ano}-${String(m + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                  const esp = datas[k];
                  const ehHoje = k === chaveHoje;
                  const ehSel = k === selecionada;
                  const temCompromisso = !!compromissosPorDia[k];
                  const ehDomingo = (primeiroDiaSemana + dia - 1) % 7 === 0;
                  const cor = ehHoje
                    ? 'bg-blue-900 text-white font-bold'
                    : esp
                    ? COR_TIPO[esp.tipo]
                    : ehDomingo
                    ? 'text-slate-400'
                    : 'text-slate-700';
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setSelecionada(k)}
                      aria-pressed={ehSel}
                      aria-label={`${dia} de ${nomeMes}${esp ? `, ${esp.nome}` : ''}${temCompromisso ? ', com compromisso' : ''}`}
                      className={`relative aspect-square text-[11px] rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${cor} ${
                        ehSel && !ehHoje ? 'ring-2 ring-blue-500' : ''
                      } ${ehSel && ehHoje ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
                    >
                      {dia}
                      {temCompromisso && (
                        <span className={`absolute bottom-[1px] w-1 h-1 rounded-full ${ehHoje ? 'bg-emerald-300' : 'bg-emerald-500'}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Lista de datas do ano */}
      <section className="bg-white rounded-2xl border border-slate-200 p-3.5">
        <h3 className="font-bold text-slate-700 mb-2">Feriados e datas de {ano}</h3>
        <ul>
          {listaDatas.map(([k, esp]) => {
            const d = dataDeChave(k);
            return (
              <li key={k}>
                <button
                  type="button"
                  onClick={() => setSelecionada(k)}
                  className={`w-full flex items-center gap-3 py-2 px-1 border-b border-slate-100 last:border-0 text-left cursor-pointer hover:bg-slate-50 rounded ${
                    k === selecionada ? 'bg-blue-50' : ''
                  }`}
                >
                  <span className="w-20 shrink-0 text-slate-500 tabular-nums">
                    {d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ·{' '}
                    {d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                  </span>
                  <span className="flex-1 font-semibold text-slate-800">{esp.nome}</span>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${CHIP_TIPO[esp.tipo]}`}>
                    {ROTULO_TIPO[esp.tipo]}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="text-[10px] text-slate-400 mt-2">
          Feriados estaduais e municipais não estão incluídos. Carnaval e Corpus Christi são pontos facultativos.
        </p>
      </section>
    </div>
  );
}
