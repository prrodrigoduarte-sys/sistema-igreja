import React, { useMemo, useState } from 'react';
import { IconeUtil } from './IconesUtil';
import { CATEGORIAS, Categoria, ELEMENTOS, Elemento, formatarMassa, semAcento } from './elementos';

export default function TabelaPeriodica() {
  const [selecionado, setSelecionado] = useState<Elemento>(ELEMENTOS[0]);
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState<Categoria | null>(null);

  const termo = semAcento(busca.trim());

  // Quais elementos "acendem" com a busca e o filtro de categoria
  const destacados = useMemo(() => {
    const conjunto = new Set<number>();
    ELEMENTOS.forEach((e) => {
      if (categoria && e.categoria !== categoria) return;
      if (termo) {
        const porNumero = /^\d+$/.test(termo) && e.z === Number(termo);
        const porSimbolo = semAcento(e.simbolo).startsWith(termo);
        const porNome = semAcento(e.nome).includes(termo);
        if (!porNumero && !porSimbolo && !porNome) return;
      }
      conjunto.add(e.z);
    });
    return conjunto;
  }, [termo, categoria]);

  const filtrando = !!termo || !!categoria;

  const escolher = (e: Elemento) => setSelecionado(e);

  // Ao buscar, seleciona automaticamente se sobrou só um resultado
  const aoBuscar = (valor: string) => {
    setBusca(valor);
    const t = semAcento(valor.trim());
    if (!t) return;
    const achados = ELEMENTOS.filter((e) => {
      if (categoria && e.categoria !== categoria) return false;
      return (/^\d+$/.test(t) && e.z === Number(t)) || semAcento(e.simbolo).startsWith(t) || semAcento(e.nome).includes(t);
    });
    if (achados.length === 1) setSelecionado(achados[0]);
  };

  const cat = CATEGORIAS[selecionado.categoria];

  return (
    <div className="space-y-3 text-xs">
      {/* Busca */}
      <div className="relative">
        <IconeUtil nome="buscar" className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="search"
          value={busca}
          onChange={(e) => aoBuscar(e.target.value)}
          placeholder="Buscar por nome, símbolo ou número (ex.: ouro, Fe, 26)"
          aria-label="Buscar elemento"
          className="w-full border border-slate-200 bg-white rounded-full pl-9 pr-3 py-2.5 text-base sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Detalhes do elemento selecionado */}
      <section className="bg-white rounded-2xl border border-slate-200 p-3.5 flex gap-4 items-start" aria-live="polite">
        <div
          className={`shrink-0 w-24 h-24 rounded-2xl flex flex-col items-center justify-center relative ${cat.celula}`}
          aria-hidden="true"
        >
          <span className="absolute top-1.5 left-2 text-xs font-semibold">{selecionado.z}</span>
          <span className="text-4xl font-black leading-none">{selecionado.simbolo}</span>
          <span className="text-[10px] mt-1 font-semibold">{formatarMassa(selecionado)}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-black text-blue-900 leading-tight">{selecionado.nome}</h3>
          <p className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cat.chip}`}>{cat.nome}</p>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2.5">
            <div>
              <dt className="text-slate-400 text-[10px]">Número atômico</dt>
              <dd className="font-bold text-slate-800">{selecionado.z}</dd>
            </div>
            <div>
              <dt className="text-slate-400 text-[10px]">Massa atômica</dt>
              <dd className="font-bold text-slate-800">{formatarMassa(selecionado)} u</dd>
            </div>
            <div>
              <dt className="text-slate-400 text-[10px]">Grupo</dt>
              <dd className="font-bold text-slate-800">{selecionado.grupo ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-400 text-[10px]">Período</dt>
              <dd className="font-bold text-slate-800">{selecionado.periodo}</dd>
            </div>
            <div>
              <dt className="text-slate-400 text-[10px]">Estado a 25 °C</dt>
              <dd className="font-bold text-slate-800">{selecionado.estado}</dd>
            </div>
            <div>
              <dt className="text-slate-400 text-[10px]">Prótons = elétrons</dt>
              <dd className="font-bold text-slate-800">{selecionado.z}</dd>
            </div>
          </dl>
          {selecionado.radioativo && (
            <p className="text-[10px] text-slate-500 mt-2">
              Sem isótopo estável: a massa entre parênteses é o número de massa do isótopo mais duradouro.
            </p>
          )}
        </div>
      </section>

      {/* Filtro por categoria */}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por categoria">
        {(Object.keys(CATEGORIAS) as Categoria[]).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategoria((atual) => (atual === c ? null : c))}
            aria-pressed={categoria === c}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition ${CATEGORIAS[c].chip} ${
              categoria === c ? 'ring-2 ring-blue-900' : categoria ? 'opacity-50' : ''
            }`}
          >
            {CATEGORIAS[c].nome}
          </button>
        ))}
        {filtrando && (
          <button
            type="button"
            onClick={() => {
              setCategoria(null);
              setBusca('');
            }}
            className="px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-600 bg-white border border-slate-300 cursor-pointer"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {filtrando && (
        <p className="text-slate-500 px-1">
          {destacados.size === 0 ? 'Nenhum elemento encontrado.' : `${destacados.size} ${destacados.size === 1 ? 'elemento' : 'elementos'} em destaque.`}
        </p>
      )}

      {/* A tabela (rola para o lado em telas pequenas) */}
      <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200 p-2">
        <div
          className="min-w-[840px] grid gap-[3px]"
          style={{
            gridTemplateColumns: 'repeat(18, minmax(0, 1fr))',
            gridTemplateRows: 'repeat(7, auto) 10px repeat(2, auto)',
          }}
          role="grid"
          aria-label="Tabela periódica"
        >
          {ELEMENTOS.map((e) => {
            const ligado = !filtrando || destacados.has(e.z);
            const ehSel = e.z === selecionado.z;
            return (
              <button
                key={e.z}
                type="button"
                onClick={() => escolher(e)}
                aria-label={`${e.nome}, número ${e.z}`}
                aria-pressed={ehSel}
                title={e.nome}
                style={{ gridColumn: e.coluna, gridRow: e.linha }}
                className={`aspect-square rounded-md flex flex-col items-center justify-center relative cursor-pointer transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 ${
                  CATEGORIAS[e.categoria].celula
                } ${ligado ? 'hover:brightness-95' : 'opacity-25'} ${ehSel ? 'ring-2 ring-blue-900 z-10' : ''}`}
              >
                <span className="absolute top-[2px] left-[4px] text-[8px] leading-none opacity-70">{e.z}</span>
                <span className="text-[15px] font-black leading-none">{e.simbolo}</span>
              </button>
            );
          })}

          {/* Marcadores dos blocos f */}
          <button
            type="button"
            onClick={() => setCategoria((a) => (a === 'LA' ? null : 'LA'))}
            style={{ gridColumn: 3, gridRow: 6 }}
            className={`aspect-square rounded-md text-[8px] font-bold leading-tight cursor-pointer ${CATEGORIAS.LA.celula} ${
              filtrando && categoria !== 'LA' ? 'opacity-25' : ''
            }`}
            aria-label="Lantanídeos, elementos 57 a 71"
          >
            57–71
          </button>
          <button
            type="button"
            onClick={() => setCategoria((a) => (a === 'AC' ? null : 'AC'))}
            style={{ gridColumn: 3, gridRow: 7 }}
            className={`aspect-square rounded-md text-[8px] font-bold leading-tight cursor-pointer ${CATEGORIAS.AC.celula} ${
              filtrando && categoria !== 'AC' ? 'opacity-25' : ''
            }`}
            aria-label="Actinídeos, elementos 89 a 103"
          >
            89–103
          </button>
        </div>
      </div>
      <p className="text-[10px] text-slate-400 px-1">Deslize a tabela para o lado para ver todas as colunas. Toque num elemento para ver os detalhes.</p>
    </div>
  );
}
