import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import { sanitizarHtml } from './utilitarios/sanitizar';
import { classesConteudo, dataBR, hojeLocal, htmlParaExibir, podeEditarDevocional } from './devocionalUtil';

// Devocional no sistema (para administrador e pastor).
// Usa a mesma tabela "devotionals" do aplicativo: o que for publicado aqui aparece no app, e vice-versa.

interface Props {
  loggedUser: any;
}

interface ItemDevocional {
  id: string;
  publish_date: string;
  title: string;
  verse_reference?: string;
  passage_text?: string;
  content_html?: string;
  author_name?: string;
  is_published?: boolean;
}

const AUTOR_PADRAO = 'Pastor / Equipe Pastoral';

export default function DevocionalModule({ loggedUser }: Props) {
  const podeEditar = podeEditarDevocional(loggedUser);
  const codigoIgreja = loggedUser?.codigo_igreja || 'IGR-001';

  const [lista, setLista] = useState<ItemDevocional[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [data, setData] = useState(hojeLocal());
  const [titulo, setTitulo] = useState('');
  const [referencia, setReferencia] = useState('');
  const [passagem, setPassagem] = useState('');
  const [autor, setAutor] = useState(AUTOR_PADRAO);
  const [publicado, setPublicado] = useState(true);
  const editorRef = useRef<HTMLDivElement | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { data: dados, error } = await supabase
      .from('devotionals')
      .select('*')
      .eq('codigo_igreja', codigoIgreja)
      .order('publish_date', { ascending: false })
      .limit(200);
    if (!error && dados) setLista(dados);
    setCarregando(false);
  }, [codigoIgreja]);

  // Carga inicial + atualização automática quando alguém salva pelo app
  useEffect(() => {
    carregar();
    const canal = supabase
      .channel('devotionals_sistema')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devotionals' }, () => carregar())
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [carregar]);

  const mostrarAviso = (tipo: 'ok' | 'erro', texto: string) => {
    setAviso({ tipo, texto });
    setTimeout(() => setAviso(null), 4000);
  };

  const limparFormulario = () => {
    setSelecionadoId(null);
    setData(hojeLocal());
    setTitulo('');
    setReferencia('');
    setPassagem('');
    setAutor(AUTOR_PADRAO);
    setPublicado(true);
    if (editorRef.current) editorRef.current.innerHTML = '';
  };

  const editar = (item: ItemDevocional) => {
    setSelecionadoId(item.id);
    setData(item.publish_date || hojeLocal());
    setTitulo(item.title || '');
    setReferencia(item.verse_reference || '');
    setPassagem(item.passage_text || '');
    setAutor(item.author_name || AUTOR_PADRAO);
    setPublicado(item.is_published !== false);
    if (editorRef.current) editorRef.current.innerHTML = htmlParaExibir(item.content_html || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeEditar) return;
    const html = sanitizarHtml(editorRef.current?.innerHTML || '');
    const textoReflexao = (editorRef.current?.textContent || '').trim();
    if (!titulo.trim() || !textoReflexao) {
      mostrarAviso('erro', 'Preencha o título e a reflexão.');
      return;
    }

    setSalvando(true);
    const payload = {
      publish_date: data,
      title: titulo.trim(),
      verse_reference: referencia.trim(),
      passage_text: passagem.trim() || null,
      content_html: html,
      author_name: autor.trim() || AUTOR_PADRAO,
      is_published: publicado,
      codigo_igreja: codigoIgreja,
    };

    const { error } = selecionadoId
      ? await supabase.from('devotionals').update(payload).eq('id', selecionadoId)
      : await supabase.from('devotionals').insert([payload]);

    setSalvando(false);
    if (error) {
      mostrarAviso('erro', 'Erro ao salvar: ' + error.message);
      return;
    }
    mostrarAviso(
      'ok',
      !publicado ? 'Rascunho salvo (não aparece no app).' : data > hojeLocal() ? `Agendado para ${dataBR(data)}.` : 'Publicado! Já aparece no app.'
    );
    limparFormulario();
    carregar();
  };

  const excluir = async (item: ItemDevocional) => {
    if (!podeEditar) return;
    if (!window.confirm(`Excluir o devocional "${item.title}"?`)) return;
    const { error } = await supabase.from('devotionals').delete().eq('id', item.id);
    if (error) {
      mostrarAviso('erro', 'Erro ao excluir: ' + error.message);
      return;
    }
    if (selecionadoId === item.id) limparFormulario();
    carregar();
  };

  // Comandos do editor (negrito, listas...). O foco volta para o editor antes de aplicar.
  const comando = (cmd: string, valor?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, valor);
  };

  // Ao colar (Word, site, WhatsApp), entra só o texto, sem estilos estranhos
  const colar = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const texto = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, texto);
  };

  // Qual devocional o app está mostrando hoje: o publicado mais recente com data até hoje
  const hoje = hojeLocal();
  const idNoAppHoje = lista.find((d) => d.is_published !== false && d.publish_date <= hoje)?.id;

  const etiqueta = (d: ItemDevocional) => {
    if (d.is_published === false) return { texto: 'Rascunho', cor: 'bg-slate-200 text-slate-700' };
    if (d.id === idNoAppHoje) return { texto: 'No app hoje', cor: 'bg-emerald-100 text-emerald-800' };
    if (d.publish_date > hoje) return { texto: 'Agendado', cor: 'bg-amber-100 text-amber-800' };
    return { texto: 'Publicado', cor: 'bg-blue-100 text-blue-800' };
  };

  if (!podeEditar) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <p className="text-3xl">🔒</p>
        <h2 className="mt-2 font-black text-blue-900 text-lg">Devocional</h2>
        <p className="mt-1 text-sm text-slate-600">Apenas o administrador e o pastor podem publicar e editar o devocional.</p>
      </div>
    );
  }

  const botaoFerramenta = 'w-9 h-9 rounded-lg hover:bg-slate-200 text-slate-700 font-bold text-sm cursor-pointer flex items-center justify-center';

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* FORMULÁRIO */}
      <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-black text-blue-900">{selecionadoId ? '✏️ Editar Devocional' : '📖 Novo Devocional'}</h2>
            <p className="text-xs text-slate-500">Aparece na aba “Devocional” do aplicativo, no dia marcado.</p>
          </div>
          {selecionadoId && (
            <button type="button" onClick={limparFormulario} className="shrink-0 text-xs font-bold text-blue-700 hover:underline cursor-pointer">
              + Criar novo
            </button>
          )}
        </div>

        {aviso && (
          <div
            className={`p-3 rounded-xl text-sm mb-4 border ${
              aviso.tipo === 'ok' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {aviso.texto}
          </div>
        )}

        <form onSubmit={salvar} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block text-xs font-bold text-slate-700 uppercase">
              Data de publicação
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                required
                className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-normal normal-case text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block text-xs font-bold text-slate-700 uppercase">
              Autor / Pregador
              <input
                type="text"
                value={autor}
                onChange={(e) => setAutor(e.target.value)}
                placeholder="Ex: Pr. Rodrigo Duarte"
                className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-normal normal-case text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>

          <label className="block text-xs font-bold text-slate-700 uppercase">
            Título *
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: A Grande Comissão e o Nosso Chamado"
              required
              className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold normal-case text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="block text-xs font-bold text-slate-700 uppercase">
              Referência *
              <input
                type="text"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="Ex: Mt 28:18-19"
                required
                className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-normal normal-case text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block sm:col-span-2 text-xs font-bold text-slate-700 uppercase">
              Versículo em destaque (opcional)
              <input
                type="text"
                value={passagem}
                onChange={(e) => setPassagem(e.target.value)}
                placeholder="Ex: É-me dado todo o poder nos céus e na terra..."
                className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-normal normal-case text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>

          <div>
            <span className="block text-xs font-bold text-slate-700 uppercase mb-1">Reflexão *</span>
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 focus-within:ring-2 focus-within:ring-blue-500">
              <div className="bg-slate-100 p-1.5 border-b border-slate-200 flex gap-1 flex-wrap">
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => comando('bold')} className={botaoFerramenta} title="Negrito">
                  B
                </button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => comando('italic')} className={`${botaoFerramenta} italic`} title="Itálico">
                  I
                </button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => comando('insertUnorderedList')} className={botaoFerramenta} title="Lista">
                  •≡
                </button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => comando('insertOrderedList')} className={botaoFerramenta} title="Lista numerada">
                  1.
                </button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => comando('formatBlock', 'blockquote')} className={botaoFerramenta} title="Citação">
                  ❝
                </button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => comando('formatBlock', 'p')} className={`${botaoFerramenta} text-xs w-auto px-2`} title="Texto normal">
                  Normal
                </button>
              </div>
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onPaste={colar}
                data-placeholder="Escreva aqui a reflexão bíblica..."
                className={`min-h-[200px] p-4 text-sm text-slate-700 leading-relaxed outline-none bg-white empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 ${classesConteudo}`}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
            <input type="checkbox" checked={publicado} onChange={(e) => setPublicado(e.target.checked)} className="w-4 h-4" />
            Publicar no aplicativo
            <span className="text-xs font-normal text-slate-500">(desmarcado = rascunho, só aparece aqui)</span>
          </label>

          <button
            type="submit"
            disabled={salvando}
            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 rounded-xl shadow cursor-pointer disabled:opacity-60"
          >
            {salvando ? 'Salvando...' : selecionadoId ? 'Salvar alterações' : publicado ? 'Publicar / Agendar' : 'Salvar rascunho'}
          </button>
        </form>
      </div>

      {/* LISTA */}
      <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6">
        <h3 className="text-base font-black text-blue-900 mb-1">📅 Devocionais</h3>
        <p className="text-xs text-slate-500 mb-4">Atualiza sozinho quando alguém salva pelo aplicativo.</p>

        {carregando && lista.length === 0 && <p className="text-xs text-slate-400">Carregando...</p>}

        <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
          {lista.map((d) => {
            const et = etiqueta(d);
            return (
              <div
                key={d.id}
                className={`p-3.5 rounded-xl border transition ${
                  selecionadoId === d.id ? 'border-blue-400 bg-blue-50' : 'border-slate-100 bg-slate-50 hover:border-blue-200'
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-black text-blue-900">{dataBR(d.publish_date)}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${et.cor}`}>{et.texto}</span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button type="button" onClick={() => editar(d)} className="px-2 py-1 text-xs font-bold text-blue-800 bg-blue-100 hover:bg-blue-200 rounded-lg cursor-pointer">
                      Editar
                    </button>
                    <button type="button" onClick={() => excluir(d)} className="px-2 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer">
                      Excluir
                    </button>
                  </div>
                </div>
                <h4 className="font-bold text-slate-800 text-sm leading-snug">{d.title}</h4>
                {d.verse_reference && <p className="text-xs text-slate-500 mt-0.5">{d.verse_reference}</p>}
              </div>
            );
          })}
          {!carregando && lista.length === 0 && <p className="text-xs text-slate-400 italic">Nenhum devocional cadastrado.</p>}
        </div>
      </div>
    </div>
  );
}
