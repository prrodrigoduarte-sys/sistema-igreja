import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabase';
import { IconeUtil } from './IconesUtil';
import { semAcento } from './elementos';

// Balcão IGR (Oportunite): vitrine de serviços, oportunidades, artigos e anúncios dos membros.
// Só administrador/líder publica; todos os membros da igreja leem.

type Tipo = 'artigo' | 'servico' | 'oportunidade' | 'anuncio';
type Status = 'rascunho' | 'publicado' | 'arquivado';

interface Publicacao {
  id: string;
  codigo_igreja: string;
  tipo: Tipo;
  titulo: string;
  resumo: string | null;
  corpo: string | null;
  categoria: string | null;
  autor_nome: string | null;
  contato_whatsapp: string | null;
  imagem: string | null;
  preco_publicacao: number | null;
  destaque: boolean;
  status: Status;
  expira_em: string | null;
  created_at: string;
}

interface Config {
  tagline: string;
  preco_anuncio: number | null;
  preco_artigo: number | null;
  preco_destaque: number | null;
  whatsapp_admin: string;
  instrucoes: string;
}

interface Props {
  codigoIgreja: string;
  emailUsuario: string;
  nomeUsuario: string;
  isAdmin: boolean;
}

const TIPOS: Record<Tipo, { nome: string; plural: string; classe: string }> = {
  artigo: { nome: 'Artigo', plural: 'Artigos', classe: 'bg-sky-100 text-sky-800' },
  servico: { nome: 'Serviço', plural: 'Serviços', classe: 'bg-emerald-100 text-emerald-800' },
  oportunidade: { nome: 'Oportunidade', plural: 'Oportunidades', classe: 'bg-violet-100 text-violet-800' },
  anuncio: { nome: 'Anúncio', plural: 'Anúncios', classe: 'bg-amber-100 text-amber-800' },
};

const CONFIG_PADRAO: Config = {
  tagline: 'Encontre o que precisa',
  preco_anuncio: null,
  preco_artigo: null,
  preco_destaque: null,
  whatsapp_admin: '',
  instrucoes: '',
};

const dinheiro = (v: number | null | undefined) =>
  v === null || v === undefined ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const soDigitos = (t: string) => t.replace(/\D/g, '');
const linkZap = (num: string, msg: string) => {
  const d = soDigitos(num);
  if (!d) return '';
  return `https://wa.me/${d.startsWith('55') ? d : '55' + d}?text=${encodeURIComponent(msg)}`;
};

// Reduz a imagem antes de gravar (fotos grandes derrubaram consultas do app antes)
function redimensionar(arquivo: File, lado = 520): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    leitor.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Arquivo de imagem inválido.'));
      img.onload = () => {
        const escala = Math.min(1, lado / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * escala);
        c.height = Math.round(img.height * escala);
        const ctx = c.getContext('2d');
        if (!ctx) return reject(new Error('Sem suporte a imagem.'));
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.65));
      };
      img.src = String(leitor.result);
    };
    leitor.readAsDataURL(arquivo);
  });
}

const vazio = (): Partial<Publicacao> => ({
  tipo: 'servico',
  titulo: '',
  resumo: '',
  corpo: '',
  categoria: '',
  autor_nome: '',
  contato_whatsapp: '',
  imagem: null,
  preco_publicacao: null,
  destaque: false,
  status: 'publicado',
  expira_em: null,
});

export default function Balcao({ codigoIgreja, emailUsuario, nomeUsuario, isAdmin }: Props) {
  const [itens, setItens] = useState<Publicacao[]>([]);
  const [config, setConfig] = useState<Config>(CONFIG_PADRAO);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [semTabela, setSemTabela] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Tipo | null>(null);
  const [categoria, setCategoria] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<Publicacao | null>(null);
  const [edicao, setEdicao] = useState<Partial<Publicacao> | null>(null);
  const [editandoConfig, setEditandoConfig] = useState(false);
  const [rascunhoConfig, setRascunhoConfig] = useState<Config>(CONFIG_PADRAO);
  const [salvando, setSalvando] = useState(false);
  const [msgForm, setMsgForm] = useState('');

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const [pub, cfg] = await Promise.all([
        supabase
          .from('balcao_publicacoes')
          .select('*')
          .eq('codigo_igreja', codigoIgreja)
          .order('destaque', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(80),
        supabase.from('balcao_config').select('*').eq('codigo_igreja', codigoIgreja).maybeSingle(),
      ]);
      const falta = (e: any) => e && (e.code === '42P01' || e.code === 'PGRST205' || /balcao_/.test(e.message || ''));
      if (falta(pub.error) || falta(cfg.error)) {
        setSemTabela(true);
        return;
      }
      if (pub.error) throw pub.error;
      setSemTabela(false);
      setItens((pub.data as Publicacao[]) || []);
      if (cfg.data) {
        const c = cfg.data as any;
        setConfig({
          tagline: c.tagline || CONFIG_PADRAO.tagline,
          preco_anuncio: c.preco_anuncio ?? null,
          preco_artigo: c.preco_artigo ?? null,
          preco_destaque: c.preco_destaque ?? null,
          whatsapp_admin: c.whatsapp_admin || '',
          instrucoes: c.instrucoes || '',
        });
      }
    } catch (e: any) {
      setErro(e?.message || 'Não foi possível carregar o balcão.');
    } finally {
      setCarregando(false);
    }
  }, [codigoIgreja]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const hoje = new Date().toISOString().slice(0, 10);
  const visiveis = useMemo(
    () =>
      itens.filter((i) => {
        if (isAdmin) return true;
        return i.status === 'publicado' && (!i.expira_em || i.expira_em >= hoje);
      }),
    [itens, isAdmin, hoje]
  );

  const categorias = useMemo(
    () => Array.from(new Set<string>(visiveis.map((i) => (i.categoria || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [visiveis]
  );

  const filtrados = useMemo(() => {
    const t = semAcento(busca.trim());
    return visiveis.filter((i) => {
      if (filtro && i.tipo !== filtro) return false;
      if (categoria && (i.categoria || '').trim() !== categoria) return false;
      if (!t) return true;
      return semAcento([i.titulo, i.resumo, i.corpo, i.categoria, i.autor_nome].filter(Boolean).join(' ')).includes(t);
    });
  }, [visiveis, filtro, categoria, busca]);

  const anuncios = filtrados.filter((i) => i.tipo === 'anuncio');
  const publicacoes = filtrados.filter((i) => i.tipo !== 'anuncio');

  // ── ações do administrador ──
  const salvarPublicacao = async () => {
    if (!edicao) return;
    const titulo = (edicao.titulo || '').trim();
    if (!titulo) {
      setMsgForm('Informe o título.');
      return;
    }
    setSalvando(true);
    setMsgForm('');
    const registro: any = {
      codigo_igreja: codigoIgreja,
      tipo: edicao.tipo || 'servico',
      titulo,
      resumo: (edicao.resumo || '').trim() || null,
      corpo: (edicao.corpo || '').trim() || null,
      categoria: (edicao.categoria || '').trim() || null,
      autor_nome: (edicao.autor_nome || '').trim() || null,
      contato_whatsapp: soDigitos(edicao.contato_whatsapp || '') || null,
      imagem: edicao.imagem || null,
      preco_publicacao: edicao.preco_publicacao ?? null,
      destaque: !!edicao.destaque,
      status: edicao.status || 'publicado',
      expira_em: edicao.expira_em || null,
    };
    try {
      const r = edicao.id
        ? await supabase.from('balcao_publicacoes').update(registro).eq('id', edicao.id)
        : await supabase.from('balcao_publicacoes').insert({ ...registro, created_by: emailUsuario });
      if (r.error) throw r.error;
      setEdicao(null);
      await carregar();
    } catch (e: any) {
      setMsgForm(e?.message || 'Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (p: Publicacao) => {
    if (!window.confirm(`Excluir "${p.titulo}"? Isso não pode ser desfeito.`)) return;
    const r = await supabase.from('balcao_publicacoes').delete().eq('id', p.id);
    if (r.error) {
      setErro(r.error.message);
      return;
    }
    setDetalhe(null);
    await carregar();
  };

  const salvarConfig = async () => {
    setSalvando(true);
    setMsgForm('');
    try {
      const r = await supabase.from('balcao_config').upsert(
        {
          codigo_igreja: codigoIgreja,
          tagline: rascunhoConfig.tagline.trim() || CONFIG_PADRAO.tagline,
          preco_anuncio: rascunhoConfig.preco_anuncio,
          preco_artigo: rascunhoConfig.preco_artigo,
          preco_destaque: rascunhoConfig.preco_destaque,
          whatsapp_admin: soDigitos(rascunhoConfig.whatsapp_admin),
          instrucoes: rascunhoConfig.instrucoes.trim(),
        },
        { onConflict: 'codigo_igreja' }
      );
      if (r.error) throw r.error;
      setEditandoConfig(false);
      await carregar();
    } catch (e: any) {
      setMsgForm(e?.message || 'Erro ao salvar as configurações.');
    } finally {
      setSalvando(false);
    }
  };

  const escolherImagem = async (arquivo?: File | null) => {
    if (!arquivo) return;
    try {
      const data = await redimensionar(arquivo);
      setEdicao((e) => (e ? { ...e, imagem: data } : e));
    } catch (e: any) {
      setMsgForm(e?.message || 'Imagem inválida.');
    }
  };

  const numero = (v: string): number | null => {
    const n = Number(v.replace(',', '.'));
    return v.trim() === '' || !Number.isFinite(n) || n < 0 ? null : n;
  };

  // ── telas de aviso ──
  if (semTabela) {
    return (
      <div className="bg-white rounded-2xl border border-amber-300 p-4 text-xs space-y-2">
        <h3 className="font-black text-amber-800 text-sm">Balcão ainda não configurado</h3>
        <p className="text-slate-600 leading-relaxed">
          As tabelas <code>balcao_publicacoes</code> e <code>balcao_config</code> ainda não existem no Supabase. Rode o arquivo{' '}
          <code>balcao_igr.sql</code> no SQL Editor do projeto e depois toque em "Tentar de novo".
        </p>
        <button type="button" onClick={carregar} className="px-3 py-2 rounded-full bg-blue-900 text-white font-bold cursor-pointer">
          Tentar de novo
        </button>
      </div>
    );
  }

  const cardImagem = (p: Publicacao, pequeno = false) =>
    p.imagem ? (
      <img src={p.imagem} alt="" loading="lazy" className={`w-full object-cover bg-slate-100 ${pequeno ? 'h-20' : 'h-32'}`} />
    ) : null;

  const distintivosAdmin = (p: Publicacao) =>
    isAdmin ? (
      <div className="flex flex-wrap gap-1 mt-1.5">
        {p.status !== 'publicado' && (
          <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold uppercase">{p.status}</span>
        )}
        {p.expira_em && p.expira_em < hoje && <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold">Expirado</span>}
        {p.preco_publicacao !== null && (
          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">Cobrado: {dinheiro(p.preco_publicacao)}</span>
        )}
      </div>
    ) : null;

  return (
    <div className="space-y-3 text-xs">
      {/* Cabeçalho */}
      <section className="rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-800 text-white p-4">
        <p className="text-[10px] uppercase tracking-wider text-blue-200 font-bold">Balcão IGR · Oportunite</p>
        <h3 className="text-xl font-black leading-tight mt-0.5">{config.tagline}</h3>
        <p className="text-blue-100 mt-1">Serviços, oportunidades e artigos de irmãos da nossa igreja.</p>
        {isAdmin && (
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              type="button"
              onClick={() => {
                setMsgForm('');
                setEdicao(vazio());
              }}
              className="px-3.5 py-2 rounded-full bg-white text-blue-900 font-bold cursor-pointer active:scale-95 transition flex items-center gap-1"
            >
              <IconeUtil nome="mais" className="w-4 h-4" /> Nova publicação
            </button>
            <button
              type="button"
              onClick={() => {
                setMsgForm('');
                setRascunhoConfig(config);
                setEditandoConfig(true);
              }}
              className="px-3.5 py-2 rounded-full bg-white/15 text-white font-bold cursor-pointer active:scale-95 transition"
            >
              Preços e ajustes
            </button>
          </div>
        )}
      </section>

      {/* Busca e filtros */}
      <div className="relative">
        <IconeUtil nome="buscar" className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar serviço, profissional, oportunidade…"
          aria-label="Buscar no balcão"
          className="w-full border border-slate-200 bg-white rounded-full pl-9 pr-3 py-2.5 text-base sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setFiltro(null)}
          aria-pressed={filtro === null}
          className={`px-2.5 py-1 rounded-full font-bold cursor-pointer border ${filtro === null ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-slate-700 border-slate-300'}`}
        >
          Tudo
        </button>
        {(Object.keys(TIPOS) as Tipo[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFiltro((a) => (a === t ? null : t))}
            aria-pressed={filtro === t}
            className={`px-2.5 py-1 rounded-full font-bold cursor-pointer border ${filtro === t ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-slate-700 border-slate-300'}`}
          >
            {TIPOS[t].plural}
          </button>
        ))}
      </div>
      {categorias.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Categorias">
          {categorias.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategoria((a) => (a === c ? null : c))}
              aria-pressed={categoria === c}
              className={`shrink-0 px-2.5 py-1 rounded-full font-semibold cursor-pointer ${categoria === c ? 'bg-blue-900 text-white' : 'bg-slate-200 text-slate-700'}`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {erro && <p className="text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">{erro}</p>}
      {carregando && <p className="text-center text-slate-500 py-4">Carregando…</p>}

      {/* Quadros de anúncio */}
      {anuncios.length > 0 && (
        <section aria-label="Anúncios">
          <h3 className="font-bold text-slate-700 mb-1.5">Anúncios</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {anuncios.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setDetalhe(p)}
                className={`text-left bg-white rounded-xl border overflow-hidden cursor-pointer hover:shadow-md active:scale-[0.98] transition ${
                  p.destaque ? 'border-amber-400 ring-1 ring-amber-300' : 'border-slate-200'
                }`}
              >
                {cardImagem(p, true)}
                <div className="p-2">
                  <span className="text-[9px] font-bold uppercase text-amber-700">{p.destaque ? 'Destaque' : 'Anúncio'}</span>
                  <p className="font-black text-blue-900 leading-tight line-clamp-2">{p.titulo}</p>
                  {p.resumo && <p className="text-slate-500 line-clamp-2 mt-0.5">{p.resumo}</p>}
                  {distintivosAdmin(p)}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Artigos, serviços e oportunidades */}
      {publicacoes.length > 0 && (
        <section aria-label="Publicações" className="space-y-2">
          <h3 className="font-bold text-slate-700">Publicações</h3>
          {publicacoes.map((p) => (
            <article key={p.id} className={`bg-white rounded-2xl border overflow-hidden ${p.destaque ? 'border-amber-400' : 'border-slate-200'}`}>
              <button type="button" onClick={() => setDetalhe(p)} className="w-full text-left cursor-pointer">
                {cardImagem(p)}
                <div className="p-3">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${TIPOS[p.tipo].classe}`}>{TIPOS[p.tipo].nome}</span>
                    {p.categoria && <span className="text-[10px] text-slate-400">{p.categoria}</span>}
                    {p.destaque && <span className="text-[10px] font-bold text-amber-600">★ Destaque</span>}
                  </div>
                  <h4 className="font-black text-blue-900 text-[13px] leading-snug">{p.titulo}</h4>
                  {p.resumo && <p className="text-slate-600 mt-1 leading-relaxed line-clamp-3">{p.resumo}</p>}
                  {p.autor_nome && <p className="text-slate-400 mt-1.5">Por {p.autor_nome}</p>}
                  {distintivosAdmin(p)}
                </div>
              </button>
            </article>
          ))}
        </section>
      )}

      {!carregando && filtrados.length === 0 && !erro && (
        <p className="text-center text-slate-500 py-8 bg-white rounded-2xl border border-slate-200">
          {visiveis.length === 0 ? 'Ainda não há publicações no balcão.' : 'Nada encontrado com esses filtros.'}
        </p>
      )}

      {/* Quero anunciar */}
      <section className="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-1.5">
        <h3 className="font-black text-blue-900 text-sm">Quer divulgar seu serviço?</h3>
        {(config.preco_anuncio !== null || config.preco_artigo !== null || config.preco_destaque !== null) && (
          <ul className="text-slate-700 space-y-0.5">
            {config.preco_anuncio !== null && <li>Quadro de anúncio: <strong>{dinheiro(config.preco_anuncio)}</strong></li>}
            {config.preco_artigo !== null && <li>Artigo / publicação: <strong>{dinheiro(config.preco_artigo)}</strong></li>}
            {config.preco_destaque !== null && <li>Destaque no topo: <strong>{dinheiro(config.preco_destaque)}</strong></li>}
          </ul>
        )}
        {config.instrucoes && <p className="text-slate-600 leading-relaxed whitespace-pre-line">{config.instrucoes}</p>}
        {config.whatsapp_admin ? (
          <a
            href={linkZap(config.whatsapp_admin, `Olá! Sou ${nomeUsuario} e quero divulgar no Balcão IGR.`)}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-block mt-1 px-4 py-2 rounded-full bg-emerald-600 text-white font-bold hover:bg-emerald-500"
          >
            Falar com a administração
          </a>
        ) : (
          <p className="text-slate-400">Fale com a liderança da igreja para publicar.</p>
        )}
      </section>

      {/* Detalhe */}
      {detalhe && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setDetalhe(null)}>
          <div
            className="bg-white w-full sm:max-w-lg max-h-[90dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl"
            role="dialog"
            aria-modal="true"
            aria-label={detalhe.titulo}
            onClick={(e) => e.stopPropagation()}
          >
            {detalhe.imagem && <img src={detalhe.imagem} alt="" className="w-full max-h-64 object-cover" />}
            <div className="p-4 space-y-2.5">
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${TIPOS[detalhe.tipo].classe}`}>{TIPOS[detalhe.tipo].nome}</span>
                {detalhe.categoria && <span className="text-[10px] text-slate-400">{detalhe.categoria}</span>}
              </div>
              <h3 className="text-lg font-black text-blue-900 leading-snug">{detalhe.titulo}</h3>
              {detalhe.autor_nome && <p className="text-slate-500">Oferecido por {detalhe.autor_nome}</p>}
              {detalhe.resumo && <p className="text-slate-700 font-semibold leading-relaxed">{detalhe.resumo}</p>}
              {detalhe.corpo && <p className="text-slate-700 leading-relaxed whitespace-pre-line">{detalhe.corpo}</p>}
              {detalhe.expira_em && <p className="text-slate-400">Válido até {detalhe.expira_em.split('-').reverse().join('/')}</p>}
              <div className="flex flex-wrap gap-2 pt-1">
                {detalhe.contato_whatsapp && (
                  <a
                    href={linkZap(detalhe.contato_whatsapp, `Olá! Vi "${detalhe.titulo}" no Balcão IGR.`)}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="px-4 py-2 rounded-full bg-emerald-600 text-white font-bold hover:bg-emerald-500"
                  >
                    Chamar no WhatsApp
                  </a>
                )}
                {isAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setMsgForm('');
                        setEdicao(detalhe);
                        setDetalhe(null);
                      }}
                      className="px-4 py-2 rounded-full bg-blue-900 text-white font-bold cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => excluir(detalhe)}
                      className="px-4 py-2 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold cursor-pointer"
                    >
                      Excluir
                    </button>
                  </>
                )}
                <button type="button" onClick={() => setDetalhe(null)} className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 font-bold cursor-pointer ml-auto">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulário do administrador */}
      {edicao && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-4 space-y-3" role="dialog" aria-modal="true" aria-label="Publicação">
            <h3 className="font-black text-blue-900 text-sm">{edicao.id ? 'Editar publicação' : 'Nova publicação'}</h3>

            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="font-bold text-slate-600">Tipo</span>
                <select
                  value={edicao.tipo}
                  onChange={(e) => setEdicao({ ...edicao, tipo: e.target.value as Tipo })}
                  className="w-full border border-slate-300 rounded-lg px-2 py-2 text-base sm:text-xs bg-white"
                >
                  {(Object.keys(TIPOS) as Tipo[]).map((t) => (
                    <option key={t} value={t}>
                      {TIPOS[t].nome}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-600">Situação</span>
                <select
                  value={edicao.status}
                  onChange={(e) => setEdicao({ ...edicao, status: e.target.value as Status })}
                  className="w-full border border-slate-300 rounded-lg px-2 py-2 text-base sm:text-xs bg-white"
                >
                  <option value="publicado">Publicado</option>
                  <option value="rascunho">Rascunho</option>
                  <option value="arquivado">Arquivado</option>
                </select>
              </label>
            </div>

            <label className="block space-y-1">
              <span className="font-bold text-slate-600">Título *</span>
              <input
                value={edicao.titulo || ''}
                onChange={(e) => setEdicao({ ...edicao, titulo: e.target.value })}
                maxLength={120}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-base sm:text-xs"
              />
            </label>
            <label className="block space-y-1">
              <span className="font-bold text-slate-600">Resumo (aparece no quadro)</span>
              <textarea
                value={edicao.resumo || ''}
                onChange={(e) => setEdicao({ ...edicao, resumo: e.target.value })}
                maxLength={240}
                rows={2}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-base sm:text-xs"
              />
            </label>
            <label className="block space-y-1">
              <span className="font-bold text-slate-600">Texto completo</span>
              <textarea
                value={edicao.corpo || ''}
                onChange={(e) => setEdicao({ ...edicao, corpo: e.target.value })}
                rows={5}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-base sm:text-xs"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="font-bold text-slate-600">Categoria</span>
                <input
                  value={edicao.categoria || ''}
                  onChange={(e) => setEdicao({ ...edicao, categoria: e.target.value })}
                  placeholder="Ex.: Saúde, Obras, Aulas"
                  maxLength={40}
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-base sm:text-xs"
                />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-600">Membro / anunciante</span>
                <input
                  value={edicao.autor_nome || ''}
                  onChange={(e) => setEdicao({ ...edicao, autor_nome: e.target.value })}
                  maxLength={80}
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-base sm:text-xs"
                />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-600">WhatsApp de contato</span>
                <input
                  value={edicao.contato_whatsapp || ''}
                  onChange={(e) => setEdicao({ ...edicao, contato_whatsapp: e.target.value })}
                  inputMode="tel"
                  placeholder="(33) 99999-9999"
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-base sm:text-xs"
                />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-600">Valor cobrado pela publicação (R$)</span>
                <input
                  value={edicao.preco_publicacao ?? ''}
                  onChange={(e) => setEdicao({ ...edicao, preco_publicacao: numero(e.target.value) })}
                  inputMode="decimal"
                  placeholder="0,00"
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-base sm:text-xs"
                />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-600">Válido até</span>
                <input
                  type="date"
                  value={edicao.expira_em || ''}
                  onChange={(e) => setEdicao({ ...edicao, expira_em: e.target.value || null })}
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-base sm:text-xs"
                />
              </label>
              <label className="flex items-center gap-2 pt-5">
                <input type="checkbox" checked={!!edicao.destaque} onChange={(e) => setEdicao({ ...edicao, destaque: e.target.checked })} className="w-4 h-4" />
                <span className="font-bold text-slate-600">Destaque no topo</span>
              </label>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-600">Imagem (opcional)</span>
              <div className="flex items-center gap-2">
                {edicao.imagem && <img src={edicao.imagem} alt="" className="w-16 h-16 rounded-lg object-cover" />}
                <input type="file" accept="image/*" onChange={(e) => escolherImagem(e.target.files?.[0])} className="text-xs flex-1 min-w-0" />
                {edicao.imagem && (
                  <button type="button" onClick={() => setEdicao({ ...edicao, imagem: null })} className="text-rose-600 font-bold cursor-pointer">
                    Remover
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400">A imagem é reduzida automaticamente antes de salvar.</p>
            </div>

            {msgForm && <p className="text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2">{msgForm}</p>}

            <div className="flex gap-2 justify-end pt-1">
              <button type="button" onClick={() => setEdicao(null)} className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 font-bold cursor-pointer">
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvarPublicacao}
                disabled={salvando}
                className="px-5 py-2 rounded-full bg-blue-900 text-white font-bold cursor-pointer disabled:opacity-60"
              >
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preços e ajustes */}
      {editandoConfig && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-4 space-y-3" role="dialog" aria-modal="true" aria-label="Preços e ajustes">
            <h3 className="font-black text-blue-900 text-sm">Preços e ajustes do balcão</h3>
            <label className="block space-y-1">
              <span className="font-bold text-slate-600">Frase de chamada</span>
              <input
                value={rascunhoConfig.tagline}
                onChange={(e) => setRascunhoConfig({ ...rascunhoConfig, tagline: e.target.value })}
                maxLength={60}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-base sm:text-xs"
              />
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ['preco_anuncio', 'Quadro de anúncio'],
                  ['preco_artigo', 'Artigo'],
                  ['preco_destaque', 'Destaque'],
                ] as const
              ).map(([campo, rotulo]) => (
                <label key={campo} className="space-y-1">
                  <span className="font-bold text-slate-600">{rotulo} (R$)</span>
                  <input
                    value={rascunhoConfig[campo] ?? ''}
                    onChange={(e) => setRascunhoConfig({ ...rascunhoConfig, [campo]: numero(e.target.value) })}
                    inputMode="decimal"
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-base sm:text-xs"
                  />
                </label>
              ))}
            </div>
            <label className="block space-y-1">
              <span className="font-bold text-slate-600">WhatsApp da administração</span>
              <input
                value={rascunhoConfig.whatsapp_admin}
                onChange={(e) => setRascunhoConfig({ ...rascunhoConfig, whatsapp_admin: e.target.value })}
                inputMode="tel"
                className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-base sm:text-xs"
              />
            </label>
            <label className="block space-y-1">
              <span className="font-bold text-slate-600">Como pagar / regras (aparece para todos)</span>
              <textarea
                value={rascunhoConfig.instrucoes}
                onChange={(e) => setRascunhoConfig({ ...rascunhoConfig, instrucoes: e.target.value })}
                rows={3}
                placeholder="Ex.: Pagamento por Pix antes da publicação. Anúncios ficam 30 dias."
                className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-base sm:text-xs"
              />
            </label>
            {msgForm && <p className="text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2">{msgForm}</p>}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setEditandoConfig(false)} className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 font-bold cursor-pointer">
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvarConfig}
                disabled={salvando}
                className="px-5 py-2 rounded-full bg-blue-900 text-white font-bold cursor-pointer disabled:opacity-60"
              >
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
