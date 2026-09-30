import React, { useEffect, useState } from 'react';
import { IconeUtil } from './IconesUtil';
import { supabase } from '../supabase';
import { dataBR, hojeLocal, textoParaHtml } from '../devocionalUtil';

// Devocional pessoal: a pessoa escolhe versículos na Bíblia e escreve o que Deus falou com ela.
// Fica guardado neste aparelho (localStorage), separado por usuário.

export interface Devocional {
  id: string;
  criadoEm: string; // ISO
  referencia: string;
  versiculo: string;
  titulo: string;
  reflexao: string;
  oracao: string;
}

export interface Rascunho {
  referencia: string;
  versiculo: string;
}

const chave = (email: string) => `util_devocionais_${(email || 'anonimo').toLowerCase()}`;

export function lerDevocionais(email: string): Devocional[] {
  try {
    const lista = JSON.parse(localStorage.getItem(chave(email)) || '[]');
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function gravar(email: string, lista: Devocional[]): boolean {
  try {
    localStorage.setItem(chave(email), JSON.stringify(lista));
    return true;
  } catch {
    return false;
  }
}

const dataBonita = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

function textoParaEnviar(d: Devocional, nome: string): string {
  const partes = [`📖 ${d.titulo || 'Devocional'}`, `"${d.versiculo}"`, d.referencia];
  if (d.reflexao.trim()) partes.push(`\n✍️ O que Deus falou comigo:\n${d.reflexao.trim()}`);
  if (d.oracao.trim()) partes.push(`\n🙏 Minha oração:\n${d.oracao.trim()}`);
  partes.push(`\n${nome ? `${nome} · ` : ''}${dataBonita(d.criadoEm)}`);
  return partes.join('\n');
}

interface Props {
  email: string;
  nome: string;
  rascunho: Rascunho | null; // quando vem da Bíblia com versículos marcados, abre direto o editor
  onFechar: () => void;
  onMudou?: (total: number) => void;
  // Pastor e administrador: podem enviar o devocional para a aba "Devocional" do app (para toda a igreja)
  podePublicar?: boolean;
  codigoIgreja?: string;
}

// Monta o conteúdo do devocional da igreja a partir do devocional pessoal
const reflexaoParaIgreja = (d: Devocional) =>
  textoParaHtml(d.reflexao) + (d.oracao.trim() ? `<blockquote>${textoParaHtml(`🙏 Oração: ${d.oracao.trim()}`)}</blockquote>` : '');

export default function DevocionalPessoal({ email, nome, rascunho, onFechar, onMudou, podePublicar = false, codigoIgreja = '' }: Props) {
  const [lista, setLista] = useState<Devocional[]>(() => lerDevocionais(email));
  const [editando, setEditando] = useState<Devocional | null>(() =>
    rascunho
      ? { id: '', criadoEm: new Date().toISOString(), referencia: rascunho.referencia, versiculo: rascunho.versiculo, titulo: '', reflexao: '', oracao: '' }
      : null,
  );
  const [vendo, setVendo] = useState<Devocional | null>(null);
  const [aviso, setAviso] = useState('');
  const [dataPublicacao, setDataPublicacao] = useState(hojeLocal());
  const [publicando, setPublicando] = useState(false);

  useEffect(() => {
    onMudou?.(lista.length);
  }, [lista.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const mostrarAviso = (t: string) => {
    setAviso(t);
    setTimeout(() => setAviso(''), 2000);
  };

  const salvar = () => {
    if (!editando) return;
    const item: Devocional = {
      ...editando,
      id: editando.id || `${Date.now()}`,
      titulo: editando.titulo.trim() || editando.referencia,
    };
    const nova = editando.id ? lista.map((d) => (d.id === item.id ? item : d)) : [item, ...lista];
    if (!gravar(email, nova)) {
      mostrarAviso('Não foi possível salvar neste aparelho');
      return;
    }
    setLista(nova);
    setEditando(null);
    setVendo(item);
    mostrarAviso('Devocional salvo!');
  };

  const excluir = (d: Devocional) => {
    if (!window.confirm(`Excluir o devocional "${d.titulo}"?`)) return;
    const nova = lista.filter((x) => x.id !== d.id);
    gravar(email, nova);
    setLista(nova);
    setVendo(null);
  };

  const copiar = async (d: Devocional) => {
    try {
      await navigator.clipboard.writeText(textoParaEnviar(d, nome));
      mostrarAviso('Copiado!');
    } catch {
      mostrarAviso('Não foi possível copiar');
    }
  };

  const publicarNaIgreja = async (d: Devocional) => {
    if (!podePublicar || !codigoIgreja) return;
    const quando = dataPublicacao > hojeLocal() ? `agendado para ${dataBR(dataPublicacao)}` : 'publicado hoje';
    if (!window.confirm(`Enviar "${d.titulo}" para o Devocional da igreja (${quando})? Todos os membros vão ver no app.`)) return;
    setPublicando(true);
    const { error } = await supabase.from('devotionals').insert([
      {
        codigo_igreja: codigoIgreja,
        publish_date: dataPublicacao,
        title: d.titulo,
        verse_reference: d.referencia,
        passage_text: d.versiculo || null,
        content_html: reflexaoParaIgreja(d),
        author_name: nome || 'Pastor / Equipe Pastoral',
        is_published: true,
      },
    ]);
    setPublicando(false);
    mostrarAviso(error ? 'Não foi possível publicar: ' + error.message : dataPublicacao > hojeLocal() ? `Agendado para ${dataBR(dataPublicacao)}!` : 'Publicado no Devocional do app!');
  };

  const compartilhar = async (d: Devocional) => {
    const texto = textoParaEnviar(d, nome);
    if (navigator.share) {
      try {
        await navigator.share({ text: texto });
      } catch {}
      return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
  };

  const titulo = editando ? (editando.id ? 'Editar devocional' : 'Novo devocional') : vendo ? 'Meu devocional' : 'Meus devocionais';

  const voltar = () => {
    if (editando) {
      if (editando.id) {
        setVendo(lista.find((d) => d.id === editando.id) || null);
        setEditando(null);
      } else if (rascunho && lista.length === 0) onFechar();
      else setEditando(null);
    } else if (vendo) setVendo(null);
    else onFechar();
  };

  const campo = 'w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[15px] text-slate-800 outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100 transition';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-end sm:items-center justify-center" onClick={onFechar}>
      <div
        className="bg-white w-full sm:max-w-lg max-h-[92vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={titulo}
      >
        {/* Cabeçalho */}
        <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 text-white">
          {(editando || vendo) && (
            <button type="button" onClick={voltar} className="w-9 h-9 rounded-full hover:bg-white/20 flex items-center justify-center cursor-pointer" aria-label="Voltar">
              <IconeUtil nome="voltar" className="w-5 h-5" />
            </button>
          )}
          <span className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <IconeUtil nome="coracao" className="w-5 h-5" espessura={1.9} />
          </span>
          <h3 className="flex-1 font-black">{titulo}</h3>
          <button type="button" onClick={onFechar} className="w-9 h-9 rounded-full hover:bg-white/20 flex items-center justify-center cursor-pointer" aria-label="Fechar">
            <IconeUtil nome="fechar" className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4">
          {/* Editor */}
          {editando && (
            <div className="space-y-3">
              <blockquote className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-100 p-3.5">
                <p className="text-[15px] leading-relaxed text-slate-700 italic">"{editando.versiculo}"</p>
                <p className="mt-1.5 text-xs font-black text-orange-600">{editando.referencia}</p>
              </blockquote>
              <label className="block">
                <span className="block text-xs font-bold text-slate-600 mb-1">Título</span>
                <input
                  value={editando.titulo}
                  onChange={(e) => setEditando({ ...editando, titulo: e.target.value })}
                  placeholder="Ex.: Deus cuida de mim"
                  className={campo}
                  maxLength={80}
                />
              </label>
              <label className="block">
                <span className="block text-xs font-bold text-slate-600 mb-1">✍️ O que Deus falou comigo</span>
                <textarea
                  value={editando.reflexao}
                  onChange={(e) => setEditando({ ...editando, reflexao: e.target.value })}
                  placeholder="Escreva o que este texto significa para você hoje..."
                  rows={5}
                  className={`${campo} resize-y`}
                />
              </label>
              <label className="block">
                <span className="block text-xs font-bold text-slate-600 mb-1">🙏 Minha oração</span>
                <textarea
                  value={editando.oracao}
                  onChange={(e) => setEditando({ ...editando, oracao: e.target.value })}
                  placeholder="Senhor, ..."
                  rows={3}
                  className={`${campo} resize-y`}
                />
              </label>
              <button
                type="button"
                onClick={salvar}
                className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-black py-3 shadow-lg shadow-fuchsia-500/30 cursor-pointer active:scale-[0.98] transition"
              >
                Salvar devocional
              </button>
            </div>
          )}

          {/* Leitura de um devocional */}
          {!editando && vendo && (
            <div>
              <p className="text-xs font-bold text-fuchsia-600">{dataBonita(vendo.criadoEm)}</p>
              <h4 className="mt-0.5 font-black text-xl text-slate-800 leading-tight">{vendo.titulo}</h4>
              <blockquote className="mt-3 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-100 p-3.5">
                <p className="text-[15px] leading-relaxed text-slate-700 italic">"{vendo.versiculo}"</p>
                <p className="mt-1.5 text-xs font-black text-orange-600">{vendo.referencia}</p>
              </blockquote>
              {vendo.reflexao.trim() && (
                <>
                  <h5 className="mt-4 text-sm font-black text-slate-700">✍️ O que Deus falou comigo</h5>
                  <p className="mt-1 text-[15px] leading-relaxed text-slate-700 whitespace-pre-wrap">{vendo.reflexao}</p>
                </>
              )}
              {vendo.oracao.trim() && (
                <>
                  <h5 className="mt-4 text-sm font-black text-slate-700">🙏 Minha oração</h5>
                  <p className="mt-1 text-[15px] leading-relaxed text-slate-700 whitespace-pre-wrap">{vendo.oracao}</p>
                </>
              )}
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => copiar(vendo)} className="rounded-2xl bg-slate-100 hover:bg-slate-200 py-2.5 text-sm font-bold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer">
                  <IconeUtil nome="copiar" className="w-4 h-4" />
                  Copiar
                </button>
                <button
                  type="button"
                  onClick={() => compartilhar(vendo)}
                  className="rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 py-2.5 text-sm font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <IconeUtil nome="compartilhar" className="w-4 h-4" />
                  Enviar
                </button>
                <button type="button" onClick={() => { setEditando(vendo); setVendo(null); }} className="rounded-2xl bg-slate-100 hover:bg-slate-200 py-2.5 text-sm font-bold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer">
                  <IconeUtil nome="editor" className="w-4 h-4" />
                  Editar
                </button>
                <button type="button" onClick={() => excluir(vendo)} className="rounded-2xl bg-rose-50 hover:bg-rose-100 py-2.5 text-sm font-bold text-rose-600 flex items-center justify-center gap-1.5 cursor-pointer">
                  <IconeUtil nome="lixo" className="w-4 h-4" />
                  Excluir
                </button>
              </div>

              {podePublicar && (
                <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-3 space-y-2">
                  <p className="text-sm font-black text-blue-900">📢 Publicar no Devocional da igreja</p>
                  <p className="text-[11px] text-blue-800 leading-snug">Aparece para todos os membros na aba “Devocional” do app, no dia escolhido.</p>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={dataPublicacao}
                      onChange={(e) => setDataPublicacao(e.target.value)}
                      className="flex-1 min-w-0 rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => publicarNaIgreja(vendo)}
                      disabled={publicando}
                      className="shrink-0 rounded-xl bg-blue-900 hover:bg-blue-800 px-4 py-2 text-sm font-bold text-white cursor-pointer disabled:opacity-60"
                    >
                      {publicando ? 'Enviando...' : 'Publicar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Lista */}
          {!editando && !vendo && (
            <>
              {lista.length === 0 ? (
                <div className="text-center py-8">
                  <span className="mx-auto w-16 h-16 rounded-3xl bg-gradient-to-br from-violet-500 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-fuchsia-500/30">
                    <IconeUtil nome="coracao" className="w-8 h-8" espessura={1.9} />
                  </span>
                  <p className="mt-4 font-black text-slate-800">Nenhum devocional ainda</p>
                  <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                    Na Bíblia, toque nos versículos que falaram com você e depois em <b>Devocional</b>.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {lista.map((d) => (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() => setVendo(d)}
                        className="w-full text-left rounded-2xl border border-slate-200 hover:border-fuchsia-300 hover:bg-fuchsia-50/40 p-3 flex gap-3 cursor-pointer transition"
                      >
                        <span className="w-1.5 rounded-full bg-gradient-to-b from-violet-500 to-pink-500 shrink-0" aria-hidden="true" />
                        <span className="min-w-0">
                          <span className="block font-black text-slate-800 truncate">{d.titulo}</span>
                          <span className="block text-xs font-bold text-orange-600 truncate">{d.referencia}</span>
                          <span className="block text-[11px] text-slate-400 mt-0.5">{dataBonita(d.criadoEm)}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-4 text-center text-[11px] text-slate-400">Seus devocionais ficam guardados neste aparelho.</p>
            </>
          )}
        </div>
      </div>

      {aviso && <div className="fixed left-1/2 -translate-x-1/2 top-20 z-[60] rounded-full bg-emerald-600 text-white text-sm font-bold px-4 py-2 shadow-lg">{aviso}</div>}
    </div>
  );
}
