import React, { useEffect, useMemo, useState } from 'react';
import { IconeUtil } from './IconesUtil';
import { GRUPOS, type Grupo, ITENS, type ItemJuris, REVISAO_CONTEUDO, SITUACOES, type Situacao } from './jurisigDados';
import { semAcento } from './elementos';

const CHAVE_FAV = 'util_jurisig_fav';

const lerFavoritos = (): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(CHAVE_FAV) || '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
};

export default function JurisIG() {
  const [busca, setBusca] = useState('');
  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [situacao, setSituacao] = useState<Situacao | ''>('');
  const [soFavoritos, setSoFavoritos] = useState(false);
  const [favoritos, setFavoritos] = useState<string[]>(lerFavoritos);
  const [aberto, setAberto] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_FAV, JSON.stringify(favoritos));
    } catch {
      /* sem armazenamento: só não guarda */
    }
  }, [favoritos]);

  const termos = useMemo(() => semAcento(busca.trim()).split(/\s+/).filter(Boolean), [busca]);

  const filtrados = useMemo(() => {
    return ITENS.filter((i) => {
      if (grupo && i.grupo !== grupo) return false;
      if (situacao && i.situacao !== situacao) return false;
      if (soFavoritos && !favoritos.includes(i.id)) return false;
      if (termos.length === 0) return true;
      const palheiro = semAcento([i.titulo, i.ref, i.resumo, i.tags.join(' '), (i.pratica || []).join(' ')].join(' '));
      return termos.every((t) => palheiro.includes(t));
    });
  }, [grupo, situacao, soFavoritos, favoritos, termos]);

  const contagem = useMemo(() => {
    const c: Partial<Record<Grupo, number>> = {};
    ITENS.forEach((i) => (c[i.grupo] = (c[i.grupo] || 0) + 1));
    return c;
  }, []);

  const alternarFavorito = (id: string) => setFavoritos((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  const copiarCitacao = async (i: ItemJuris) => {
    const texto = `${i.titulo} (${i.ref}). ${i.resumo}\nFonte: ${i.fonte?.url || 'consultar fonte oficial'}\n(Consulta feita no JurisIG, conteúdo revisado em ${REVISAO_CONTEUDO}; confira a fonte oficial.)`;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(i.id);
      setTimeout(() => setCopiado((c) => (c === i.id ? null : c)), 1800);
    } catch {
      /* navegador sem permissão */
    }
  };

  const q = encodeURIComponent(busca.trim() || 'igreja liberdade religiosa');
  const portais = [
    { nome: 'Legislação (Planalto)', url: 'https://legislacao.presidencia.gov.br/' },
    { nome: 'Jurisprudência STF', url: `https://jurisprudencia.stf.jus.br/pages/search?base=acordaos&queryString=${q}` },
    { nome: 'Jurisprudência STJ', url: `https://scon.stj.jus.br/SCON/pesquisar.jsp?b=ACOR&livre=${q}` },
    { nome: 'JusBrasil', url: `https://www.jusbrasil.com.br/busca?q=${q}` },
  ];

  return (
    <div className="space-y-3 text-xs">
      <div className="rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 p-3 leading-relaxed">
        <strong>Leia antes:</strong> este é um guia de referência com conteúdo selecionado (revisão: {REVISAO_CONTEUDO}). Ele
        <strong> não consulta tribunais em tempo real</strong>, pode estar desatualizado e <strong>não substitui advogado</strong>. Use os
        botões de pesquisa no fim da página para ver a versão mais recente.
      </div>

      <div className="relative">
        <IconeUtil nome="buscar" className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar: IPTU, pastor, estatuto, LGPD, barulho…"
          aria-label="Buscar no JurisIG"
          className="w-full border border-slate-200 bg-white rounded-full pl-9 pr-3 py-2.5 text-base sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por assunto">
        <button
          type="button"
          onClick={() => setGrupo(null)}
          aria-pressed={grupo === null}
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer border ${
            grupo === null ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-slate-700 border-slate-300'
          }`}
        >
          Tudo ({ITENS.length})
        </button>
        {(Object.keys(GRUPOS) as Grupo[]).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGrupo((a) => (a === g ? null : g))}
            aria-pressed={grupo === g}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer border ${
              grupo === g ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-slate-700 border-slate-300'
            }`}
          >
            {GRUPOS[g].curto} ({contagem[g] || 0})
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-slate-600">
          Situação:
          <select
            value={situacao}
            onChange={(e) => setSituacao(e.target.value as Situacao | '')}
            className="border border-slate-300 bg-white rounded-lg px-2 py-1.5 text-base sm:text-xs"
          >
            <option value="">Todas</option>
            {(Object.keys(SITUACOES) as Situacao[]).map((s) => (
              <option key={s} value={s}>
                {SITUACOES[s].nome}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => setSoFavoritos((v) => !v)}
          aria-pressed={soFavoritos}
          className={`px-2.5 py-1.5 rounded-lg border font-bold cursor-pointer ${
            soFavoritos ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-white border-slate-300 text-slate-600'
          }`}
        >
          ★ Favoritos ({favoritos.length})
        </button>
        <span className="text-slate-400 ml-auto">
          {filtrados.length} {filtrados.length === 1 ? 'item' : 'itens'}
        </span>
      </div>

      {filtrados.length === 0 ? (
        <p className="text-center text-slate-500 py-8 bg-white rounded-2xl border border-slate-200">
          Nada encontrado. Tente outra palavra ou use os botões de pesquisa abaixo.
        </p>
      ) : (
        <ul className="space-y-2">
          {filtrados.map((i) => {
            const aberta = aberto === i.id;
            const fav = favoritos.includes(i.id);
            const qi = encodeURIComponent(i.busca || i.titulo);
            return (
              <li key={i.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="flex items-start gap-1 pr-2">
                  <button
                    type="button"
                    onClick={() => setAberto(aberta ? null : i.id)}
                    aria-expanded={aberta}
                    className="flex-1 min-w-0 text-left p-3 cursor-pointer"
                  >
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${SITUACOES[i.situacao].classe}`}>
                        {SITUACOES[i.situacao].nome}
                      </span>
                      <span className="text-[10px] text-slate-400">{GRUPOS[i.grupo].curto}</span>
                    </div>
                    <h3 className="font-black text-blue-900 text-[13px] leading-snug">{i.titulo}</h3>
                    <p className="text-slate-500 mt-0.5">{i.ref}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => alternarFavorito(i.id)}
                    aria-pressed={fav}
                    aria-label={fav ? 'Remover dos favoritos' : 'Marcar como favorito'}
                    className={`mt-2 w-9 h-9 rounded-full text-lg cursor-pointer hover:bg-slate-100 ${fav ? 'text-amber-500' : 'text-slate-300'}`}
                  >
                    ★
                  </button>
                </div>

                {aberta && (
                  <div className="px-3 pb-3 space-y-2.5 border-t border-slate-100 pt-2.5">
                    <p className="text-slate-700 leading-relaxed">{i.resumo}</p>
                    {i.pratica && i.pratica.length > 0 && (
                      <div className="bg-blue-50 rounded-xl p-2.5">
                        <p className="font-bold text-blue-900 mb-1">Na prática</p>
                        <ul className="space-y-1 list-disc pl-4 text-slate-700 leading-relaxed">
                          {i.pratica.map((p, k) => (
                            <li key={k}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {i.fonte && (
                        <a
                          href={i.fonte.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="px-2.5 py-1.5 rounded-full bg-blue-900 text-white font-bold hover:bg-blue-800"
                        >
                          Fonte oficial ↗
                        </a>
                      )}
                      <a
                        href={`https://www.jusbrasil.com.br/busca?q=${qi}`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="px-2.5 py-1.5 rounded-full bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                      >
                        Decisões recentes ↗
                      </a>
                      <button
                        type="button"
                        onClick={() => copiarCitacao(i)}
                        className="px-2.5 py-1.5 rounded-full bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer flex items-center gap-1"
                      >
                        <IconeUtil nome="copiar" className="w-3.5 h-3.5" />
                        {copiado === i.id ? 'Copiado!' : 'Copiar citação'}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <section className="bg-white rounded-2xl border border-slate-200 p-3">
        <h3 className="font-bold text-slate-700 mb-2">Pesquisar nas fontes oficiais{busca.trim() ? ` por “${busca.trim()}”` : ''}</h3>
        <div className="flex flex-wrap gap-1.5">
          {portais.map((p) => (
            <a
              key={p.nome}
              href={p.url}
              target="_blank"
              rel="noreferrer noopener"
              className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-800 font-bold hover:bg-slate-200"
            >
              {p.nome} ↗
            </a>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 mt-2">
          Os links abrem sites de terceiros em outra aba. Se algum endereço tiver mudado, use a busca do próprio site.
        </p>
      </section>
    </div>
  );
}
