import React, { useCallback, useEffect, useRef, useState } from 'react';
import { IconeUtil } from './IconesUtil';
import { escaparHtml, sanitizarHtml } from './sanitizar';

// Editor de texto completo (estilo processador de texto). Os documentos ficam salvos NESTE aparelho
// (armazenamento do navegador) e podem ser baixados em Word (.doc), HTML, TXT ou impressos/salvos em PDF.

interface Documento {
  id: string;
  titulo: string;
  html: string;
  atualizado: number;
}

const CHAVE_DOCS = 'util_editor_docs';
const CHAVE_ATUAL = 'util_editor_atual';

const novoId = () => `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const novoDocumento = (titulo = 'Documento sem título', html = ''): Documento => ({
  id: novoId(),
  titulo,
  html,
  atualizado: Date.now(),
});

// Estilos do conteúdo (o Tailwind zera listas, títulos e tabelas, então definimos aqui)
const CSS_CONTEUDO = `
.util-editor-conteudo{font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.6;color:#0f172a;word-wrap:break-word;overflow-wrap:anywhere}
.util-editor-conteudo[data-vazio="true"]:before{content:attr(data-placeholder);color:#94a3b8;pointer-events:none;position:absolute}
.util-editor-conteudo h1{font-size:2em;font-weight:800;margin:.6em 0 .3em;line-height:1.2}
.util-editor-conteudo h2{font-size:1.5em;font-weight:700;margin:.6em 0 .3em;line-height:1.25}
.util-editor-conteudo h3{font-size:1.2em;font-weight:700;margin:.6em 0 .3em}
.util-editor-conteudo p,.util-editor-conteudo div{margin:0 0 .5em}
.util-editor-conteudo ul{list-style:disc;padding-left:1.6rem;margin:.4em 0}
.util-editor-conteudo ol{list-style:decimal;padding-left:1.6rem;margin:.4em 0}
.util-editor-conteudo blockquote{border-left:4px solid #93c5fd;padding:.2em .9em;margin:.6em 0;color:#475569;background:#f8fafc}
.util-editor-conteudo pre{background:#f1f5f9;padding:.7em;border-radius:.5rem;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.9em;white-space:pre-wrap}
.util-editor-conteudo table{border-collapse:collapse;width:100%;margin:.6em 0}
.util-editor-conteudo td,.util-editor-conteudo th{border:1px solid #cbd5e1;padding:6px 8px;min-width:40px;vertical-align:top}
.util-editor-conteudo th{background:#f1f5f9;font-weight:700;text-align:left}
.util-editor-conteudo img{max-width:100%;height:auto;border-radius:4px}
.util-editor-conteudo a{color:#1d4ed8;text-decoration:underline}
.util-editor-conteudo hr{border:0;border-top:1px solid #cbd5e1;margin:1em 0}
.util-editor-conteudo sub{vertical-align:sub;font-size:.75em}
.util-editor-conteudo sup{vertical-align:super;font-size:.75em}
`;

const FONTES = ['Arial', 'Verdana', 'Tahoma', 'Trebuchet MS', 'Georgia', 'Times New Roman', 'Courier New'];
const TAMANHOS = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48];

const ESTADO_INICIAL = {
  bold: false,
  italic: false,
  underline: false,
  strikeThrough: false,
  subscript: false,
  superscript: false,
  insertUnorderedList: false,
  insertOrderedList: false,
  justifyLeft: false,
  justifyCenter: false,
  justifyRight: false,
  justifyFull: false,
};

// Reduz a imagem antes de inserir (fotos de celular têm vários MB e encheriam o armazenamento)
function reduzirImagem(arquivo: File, larguraMax = 900, qualidade = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    leitor.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Arquivo de imagem inválido.'));
      img.onload = () => {
        const escala = Math.min(1, larguraMax / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Não foi possível processar a imagem.'));
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', qualidade));
      };
      img.src = leitor.result as string;
    };
    leitor.readAsDataURL(arquivo);
  });
}

function BotaoBarra({
  titulo,
  aoClicar,
  ativo = false,
  children,
}: {
  titulo: string;
  aoClicar: () => void;
  ativo?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      aria-pressed={ativo}
      // não deixa o botão roubar o foco (senão a seleção do texto some)
      onMouseDown={(e) => e.preventDefault()}
      onClick={aoClicar}
      className={`shrink-0 min-w-8 h-8 px-1.5 rounded-md flex items-center justify-center text-sm cursor-pointer transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        ativo ? 'bg-blue-100 text-blue-900' : 'text-slate-700 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  );
}

const Divisor = () => <span className="shrink-0 w-px h-5 bg-slate-200 mx-0.5" aria-hidden="true" />;

const SELECT_CLASSE =
  'shrink-0 h-8 rounded-md border border-slate-200 bg-white text-xs text-slate-700 px-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

export default function EditorTexto() {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const docsRef = useRef<Documento[]>([]);
  const atualIdRef = useRef('');
  const selecaoRef = useRef<Range | null>(null);
  const timerSalvar = useRef<any>(null);
  const inputImagemRef = useRef<HTMLInputElement | null>(null);
  const inputArquivoRef = useRef<HTMLInputElement | null>(null);

  const [docs, setDocs] = useState<Documento[]>([]);
  const [atualId, setAtualId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [status, setStatus] = useState<'salvo' | 'salvando' | 'erro'>('salvo');
  const [salvoEm, setSalvoEm] = useState('');
  const [ativos, setAtivos] = useState(ESTADO_INICIAL);
  const [painel, setPainel] = useState<null | 'docs' | 'exportar' | 'localizar'>(null);
  const [contagem, setContagem] = useState({ palavras: 0, caracteres: 0 });
  const [dentroTabela, setDentroTabela] = useState(false);
  const [aviso, setAviso] = useState('');
  const [busca, setBusca] = useState('');
  const [troca, setTroca] = useState('');

  const mostrarAviso = (m: string) => {
    setAviso(m);
    setTimeout(() => setAviso(''), 3500);
  };

  // ── persistência ──
  const persistir = useCallback(() => {
    try {
      localStorage.setItem(CHAVE_DOCS, JSON.stringify(docsRef.current));
      localStorage.setItem(CHAVE_ATUAL, atualIdRef.current);
      return true;
    } catch {
      return false;
    }
  }, []);

  const salvarAgora = useCallback(() => {
    clearTimeout(timerSalvar.current);
    const editor = editorRef.current;
    const doc = docsRef.current.find((d) => d.id === atualIdRef.current);
    if (!editor || !doc) return;
    doc.html = editor.innerHTML;
    doc.atualizado = Date.now();
    const ok = persistir();
    setDocs([...docsRef.current]);
    setStatus(ok ? 'salvo' : 'erro');
    setSalvoEm(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  }, [persistir]);

  const agendarSalvar = useCallback(() => {
    setStatus('salvando');
    clearTimeout(timerSalvar.current);
    timerSalvar.current = setTimeout(salvarAgora, 700);
  }, [salvarAgora]);

  const atualizarContagem = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const texto = (editor.innerText || '').trim();
    setContagem({ palavras: texto ? texto.split(/\s+/).length : 0, caracteres: texto.length });
    const vazio = !editor.textContent?.trim() && !editor.querySelector('img,table,hr');
    editor.setAttribute('data-vazio', vazio ? 'true' : 'false');
  }, []);

  // Carrega os documentos ao abrir
  useEffect(() => {
    let lista: Documento[] = [];
    let id = '';
    try {
      const bruto = JSON.parse(localStorage.getItem(CHAVE_DOCS) || '[]');
      if (Array.isArray(bruto)) lista = bruto.filter((d) => d && typeof d.id === 'string');
      id = localStorage.getItem(CHAVE_ATUAL) || '';
    } catch {}
    if (lista.length === 0) {
      const novo = novoDocumento();
      lista = [novo];
      id = novo.id;
    }
    const atual = lista.find((d) => d.id === id) || lista[0];
    docsRef.current = lista;
    atualIdRef.current = atual.id;
    setDocs([...lista]);
    setAtualId(atual.id);
    return () => {
      salvarAgora();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Coloca o documento escolhido dentro do editor
  useEffect(() => {
    const doc = docsRef.current.find((d) => d.id === atualId);
    const editor = editorRef.current;
    if (!doc || !editor) return;
    editor.innerHTML = sanitizarHtml(doc.html);
    setTitulo(doc.titulo);
    atualIdRef.current = atualId;
    atualizarContagem();
  }, [atualId, atualizarContagem]);

  // ── seleção e estado dos botões ──
  const dentroDoEditor = (no: Node | null) => !!no && !!editorRef.current && editorRef.current.contains(no);

  const celulaAtual = (): HTMLTableCellElement | null => {
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode || !dentroDoEditor(sel.anchorNode)) return null;
    const el = sel.anchorNode.nodeType === 1 ? (sel.anchorNode as Element) : sel.anchorNode.parentElement;
    return (el?.closest('td,th') as HTMLTableCellElement) || null;
  };

  useEffect(() => {
    const aoMudarSelecao = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || !dentroDoEditor(sel.anchorNode)) return;
      selecaoRef.current = sel.getRangeAt(0).cloneRange();
      const novo = { ...ESTADO_INICIAL };
      (Object.keys(novo) as (keyof typeof ESTADO_INICIAL)[]).forEach((k) => {
        try {
          novo[k] = document.queryCommandState(k);
        } catch {}
      });
      setAtivos(novo);
      setDentroTabela(!!celulaAtual());
    };
    document.addEventListener('selectionchange', aoMudarSelecao);
    return () => document.removeEventListener('selectionchange', aoMudarSelecao);
  }, []);

  const restaurarSelecao = () => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const salvo = selecaoRef.current;
    if (salvo) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(salvo);
    }
  };

  const exec = (comando: string, valor?: string) => {
    restaurarSelecao();
    try {
      document.execCommand(comando, false, valor);
    } catch {}
    atualizarContagem();
    agendarSalvar();
  };

  // ── formatação ──
  const aplicarBloco = (tag: string) => {
    if (tag) exec('formatBlock', `<${tag}>`);
  };

  const aplicarTamanho = (px: string) => {
    if (!px) return;
    restaurarSelecao();
    const editor = editorRef.current;
    if (!editor) return;
    // "fontSize 7" cria <font size="7">; trocamos por um <span> com o tamanho exato em px
    document.execCommand('styleWithCSS', false, 'false');
    document.execCommand('fontSize', false, '7');
    editor.querySelectorAll('font[size="7"]').forEach((f) => {
      const span = document.createElement('span');
      span.style.fontSize = `${px}px`;
      span.innerHTML = f.innerHTML;
      f.replaceWith(span);
    });
    atualizarContagem();
    agendarSalvar();
  };

  const aplicarCor = (cor: string) => {
    restaurarSelecao();
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand('foreColor', false, cor);
    atualizarContagem();
    agendarSalvar();
  };

  const aplicarRealce = (cor: string) => {
    restaurarSelecao();
    document.execCommand('styleWithCSS', false, 'true');
    if (!document.execCommand('hiliteColor', false, cor)) document.execCommand('backColor', false, cor);
    atualizarContagem();
    agendarSalvar();
  };

  const inserirLink = () => {
    restaurarSelecao();
    const sel = window.getSelection();
    const url = window.prompt('Endereço do link (ex.: https://igreja.com.br)');
    if (!url) return;
    let u = url.trim();
    if (!/^(https?:|mailto:|tel:)/i.test(u)) u = 'https://' + u;
    if (sel && sel.isCollapsed) {
      const a = document.createElement('a');
      a.href = u;
      a.textContent = u;
      document.execCommand('insertHTML', false, a.outerHTML);
    } else {
      document.execCommand('createLink', false, u);
    }
    editorRef.current?.querySelectorAll('a').forEach((a) => {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noreferrer noopener');
    });
    agendarSalvar();
  };

  const aoEscolherImagem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    try {
      const dataUrl = await reduzirImagem(arquivo);
      exec('insertImage', dataUrl);
    } catch (err: any) {
      mostrarAviso(err.message || 'Não foi possível inserir a imagem.');
    }
  };

  const inserirTabela = (tamanho: string) => {
    if (!tamanho) return;
    const [l, c] = tamanho.split('x').map(Number);
    let html = '<table><tbody>';
    for (let i = 0; i < l; i++) {
      html += '<tr>' + Array.from({ length: c }, () => (i === 0 ? '<th><br></th>' : '<td><br></td>')).join('') + '</tr>';
    }
    html += '</tbody></table><p><br></p>';
    exec('insertHTML', html);
  };

  // ── edição de tabelas ──
  const operarTabela = (acao: 'linha+' | 'coluna+' | 'linha-' | 'coluna-' | 'excluir') => {
    const cel = celulaAtual();
    if (!cel) return;
    const tr = cel.parentElement as HTMLTableRowElement;
    const tabela = cel.closest('table') as HTMLTableElement;
    const idx = cel.cellIndex;
    if (acao === 'linha+') {
      const nova = document.createElement('tr');
      Array.from(tr.cells).forEach(() => {
        const td = document.createElement('td');
        td.innerHTML = '<br>';
        nova.appendChild(td);
      });
      tr.after(nova);
    } else if (acao === 'coluna+') {
      Array.from(tabela.rows).forEach((linha) => {
        const ref = linha.cells[idx];
        const nova = document.createElement(ref ? ref.tagName : 'td');
        nova.innerHTML = '<br>';
        if (ref) ref.after(nova);
        else linha.appendChild(nova);
      });
    } else if (acao === 'linha-') {
      tr.remove();
      if (tabela.rows.length === 0) tabela.remove();
    } else if (acao === 'coluna-') {
      Array.from(tabela.rows).forEach((linha) => linha.cells[idx]?.remove());
      if (tabela.rows[0] && tabela.rows[0].cells.length === 0) tabela.remove();
    } else {
      tabela.remove();
    }
    setDentroTabela(false);
    atualizarContagem();
    agendarSalvar();
  };

  // ── colar: mantém só formatação segura ──
  const aoColar = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    const texto = e.clipboardData.getData('text/plain');
    if (html) document.execCommand('insertHTML', false, sanitizarHtml(html));
    else document.execCommand('insertText', false, texto);
    atualizarContagem();
    agendarSalvar();
  };

  const aoTeclar = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      salvarAgora();
    }
  };

  // ── localizar e substituir ──
  const textosDoEditor = (): Text[] => {
    const editor = editorRef.current;
    if (!editor) return [];
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    const lista: Text[] = [];
    let n = walker.nextNode();
    while (n) {
      lista.push(n as Text);
      n = walker.nextNode();
    }
    return lista;
  };

  const localizarProximo = () => {
    const alvo = busca.toLowerCase();
    if (!alvo) return;
    const nos = textosDoEditor();
    const salvo = selecaoRef.current;
    let comecarEm = 0;
    let deslocamento = 0;
    if (salvo) {
      const i = nos.indexOf(salvo.endContainer as Text);
      if (i >= 0) {
        comecarEm = i;
        deslocamento = salvo.endOffset;
      }
    }
    const procurar = (de: number, ate: number, off0: number): boolean => {
      for (let i = de; i < ate; i++) {
        const pos = nos[i].data.toLowerCase().indexOf(alvo, i === de ? off0 : 0);
        if (pos >= 0) {
          const r = document.createRange();
          r.setStart(nos[i], pos);
          r.setEnd(nos[i], pos + alvo.length);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(r);
          selecaoRef.current = r.cloneRange();
          nos[i].parentElement?.scrollIntoView({ block: 'center' });
          return true;
        }
      }
      return false;
    };
    if (!procurar(comecarEm, nos.length, deslocamento) && !procurar(0, nos.length, 0)) mostrarAviso('Texto não encontrado.');
  };

  const substituirTudo = () => {
    if (!busca) return;
    const re = new RegExp(busca.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    let total = 0;
    textosDoEditor().forEach((no) => {
      const novo = no.data.replace(re, () => {
        total++;
        return troca;
      });
      if (novo !== no.data) no.data = novo;
    });
    mostrarAviso(total ? `${total} ${total === 1 ? 'substituição feita' : 'substituições feitas'}.` : 'Texto não encontrado.');
    if (total) {
      atualizarContagem();
      agendarSalvar();
    }
  };

  // ── documentos ──
  const abrirDocumento = (id: string) => {
    salvarAgora();
    setAtualId(id);
    atualIdRef.current = id;
    persistir();
    setPainel(null);
  };

  const criarDocumento = (tituloNovo?: string, html = '') => {
    salvarAgora();
    const novo = novoDocumento(tituloNovo, html);
    docsRef.current = [novo, ...docsRef.current];
    atualIdRef.current = novo.id;
    setDocs([...docsRef.current]);
    setAtualId(novo.id);
    persistir();
    setPainel(null);
  };

  const excluirDocumento = (id: string) => {
    const doc = docsRef.current.find((d) => d.id === id);
    if (!doc || !window.confirm(`Excluir "${doc.titulo}"? Não dá para desfazer.`)) return;
    docsRef.current = docsRef.current.filter((d) => d.id !== id);
    if (docsRef.current.length === 0) docsRef.current = [novoDocumento()];
    if (id === atualIdRef.current) {
      atualIdRef.current = docsRef.current[0].id;
      setAtualId(docsRef.current[0].id);
    }
    setDocs([...docsRef.current]);
    persistir();
  };

  const aoAlterarTitulo = (valor: string) => {
    setTitulo(valor);
    const doc = docsRef.current.find((d) => d.id === atualIdRef.current);
    if (doc) doc.titulo = valor;
    agendarSalvar();
  };

  const aoAbrirArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = () => {
      const bruto = String(leitor.result || '');
      const ehHtml = /\.(html?|htm)$/i.test(arquivo.name);
      const html = ehHtml
        ? sanitizarHtml(bruto)
        : bruto
            .split(/\r?\n/)
            .map((l) => `<p>${escaparHtml(l) || '<br>'}</p>`)
            .join('');
      criarDocumento(arquivo.name.replace(/\.[^.]+$/, ''), html);
    };
    leitor.readAsText(arquivo);
  };

  // ── exportar ──
  const nomeArquivo = () => (titulo || 'documento').replace(/[\\/:*?"<>|]+/g, '-').trim() || 'documento';

  const htmlCompleto = () =>
    `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escaparHtml(titulo || 'Documento')}</title>` +
    `<style>body{margin:2cm;font-family:Georgia,'Times New Roman',serif;font-size:12pt;line-height:1.5;color:#000}` +
    CSS_CONTEUDO.replace(/\.util-editor-conteudo/g, 'body').replace(/body\[data-vazio[^}]+}/g, '') +
    `</style></head><body>${editorRef.current?.innerHTML || ''}</body></html>`;

  const baixar = (conteudo: string, mime: string, extensao: string) => {
    salvarAgora();
    const blob = new Blob(['﻿' + conteudo], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nomeArquivo()}.${extensao}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setPainel(null);
  };

  const imprimir = () => {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(iframe);
    const d = iframe.contentDocument;
    if (!d) return;
    d.open();
    d.write(htmlCompleto());
    d.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => iframe.remove(), 2000);
    }, 300);
    setPainel(null);
  };

  const copiarTexto = async () => {
    try {
      await navigator.clipboard.writeText(editorRef.current?.innerText || '');
      mostrarAviso('Texto copiado.');
    } catch {
      mostrarAviso('Não foi possível copiar.');
    }
    setPainel(null);
  };

  const minutosLeitura = Math.max(1, Math.round(contagem.palavras / 200));

  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-100 relative text-xs">
      <style>{CSS_CONTEUDO}</style>

      {/* Título e ações do documento */}
      <div className="bg-white border-b border-slate-200 px-2.5 py-2 flex items-center gap-1.5 shrink-0">
        <input
          type="text"
          value={titulo}
          onChange={(e) => aoAlterarTitulo(e.target.value)}
          aria-label="Título do documento"
          placeholder="Título do documento"
          className="flex-1 min-w-0 text-sm font-bold text-blue-900 bg-transparent outline-none focus:bg-slate-50 rounded px-1.5 py-1"
        />
        <button
          type="button"
          onClick={() => setPainel(painel === 'docs' ? null : 'docs')}
          className="shrink-0 h-8 px-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-1 cursor-pointer"
        >
          <IconeUtil nome="documentos" className="w-4 h-4" />
          <span className="hidden sm:inline">Documentos</span>
        </button>
        <button
          type="button"
          onClick={() => criarDocumento()}
          className="shrink-0 h-8 px-2.5 rounded-full bg-blue-900 hover:bg-blue-800 text-white font-semibold flex items-center gap-1 cursor-pointer"
        >
          <IconeUtil nome="mais" className="w-4 h-4" />
          <span className="hidden sm:inline">Novo</span>
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setPainel(painel === 'exportar' ? null : 'exportar')}
            className="shrink-0 h-8 px-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1 cursor-pointer"
            aria-expanded={painel === 'exportar'}
          >
            <IconeUtil nome="baixar" className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          {painel === 'exportar' && (
            <div className="absolute right-0 top-10 z-30 w-56 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
              {[
                { rotulo: 'Word (.doc)', acao: () => baixar(htmlCompleto(), 'application/msword', 'doc') },
                { rotulo: 'Página web (.html)', acao: () => baixar(htmlCompleto(), 'text/html', 'html') },
                { rotulo: 'Texto simples (.txt)', acao: () => baixar(editorRef.current?.innerText || '', 'text/plain', 'txt') },
                { rotulo: 'Imprimir / salvar em PDF', acao: imprimir },
                { rotulo: 'Copiar todo o texto', acao: copiarTexto },
              ].map((o) => (
                <button
                  key={o.rotulo}
                  type="button"
                  onClick={o.acao}
                  className="w-full text-left px-3 py-2.5 hover:bg-slate-50 border-b border-slate-100 last:border-0 cursor-pointer text-slate-700 font-semibold"
                >
                  {o.rotulo}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Barra de ferramentas */}
      <div
        className="bg-white border-b border-slate-200 px-2 py-1.5 flex items-center gap-1 overflow-x-auto md:flex-wrap md:overflow-visible shrink-0"
        role="toolbar"
        aria-label="Formatação"
      >
        <BotaoBarra titulo="Desfazer" aoClicar={() => exec('undo')}>
          <IconeUtil nome="desfazer" className="w-4 h-4" />
        </BotaoBarra>
        <BotaoBarra titulo="Refazer" aoClicar={() => exec('redo')}>
          <IconeUtil nome="refazer" className="w-4 h-4" />
        </BotaoBarra>
        <Divisor />

        <select
          className={SELECT_CLASSE}
          value=""
          aria-label="Estilo do parágrafo"
          onChange={(e) => aplicarBloco(e.target.value)}
        >
          <option value="">Estilo</option>
          <option value="p">Parágrafo</option>
          <option value="h1">Título 1</option>
          <option value="h2">Título 2</option>
          <option value="h3">Título 3</option>
          <option value="blockquote">Citação</option>
          <option value="pre">Código</option>
        </select>
        <select
          className={SELECT_CLASSE}
          value=""
          aria-label="Fonte"
          onChange={(e) => e.target.value && exec('fontName', e.target.value)}
        >
          <option value="">Fonte</option>
          {FONTES.map((f) => (
            <option key={f} value={f} style={{ fontFamily: f }}>
              {f}
            </option>
          ))}
        </select>
        <select className={`${SELECT_CLASSE} w-[68px]`} value="" aria-label="Tamanho da letra" onChange={(e) => aplicarTamanho(e.target.value)}>
          <option value="">Tam.</option>
          {TAMANHOS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <Divisor />

        <BotaoBarra titulo="Negrito (Ctrl+B)" aoClicar={() => exec('bold')} ativo={ativos.bold}>
          <strong>B</strong>
        </BotaoBarra>
        <BotaoBarra titulo="Itálico (Ctrl+I)" aoClicar={() => exec('italic')} ativo={ativos.italic}>
          <em className="font-serif">I</em>
        </BotaoBarra>
        <BotaoBarra titulo="Sublinhado (Ctrl+U)" aoClicar={() => exec('underline')} ativo={ativos.underline}>
          <span className="underline">U</span>
        </BotaoBarra>
        <BotaoBarra titulo="Tachado" aoClicar={() => exec('strikeThrough')} ativo={ativos.strikeThrough}>
          <span className="line-through">S</span>
        </BotaoBarra>
        <BotaoBarra titulo="Subscrito" aoClicar={() => exec('subscript')} ativo={ativos.subscript}>
          x<sub className="text-[9px]">2</sub>
        </BotaoBarra>
        <BotaoBarra titulo="Sobrescrito" aoClicar={() => exec('superscript')} ativo={ativos.superscript}>
          x<sup className="text-[9px]">2</sup>
        </BotaoBarra>

        <label className="shrink-0 h-8 w-8 rounded-md hover:bg-slate-100 flex flex-col items-center justify-center cursor-pointer" title="Cor do texto">
          <span className="font-bold text-sm leading-none">A</span>
          <input type="color" defaultValue="#1d4ed8" onChange={(e) => aplicarCor(e.target.value)} className="w-5 h-1.5 p-0 border-0 cursor-pointer bg-transparent" aria-label="Cor do texto" />
        </label>
        <label className="shrink-0 h-8 w-8 rounded-md hover:bg-slate-100 flex flex-col items-center justify-center cursor-pointer" title="Cor de destaque (marca-texto)">
          <span className="font-bold text-sm leading-none bg-yellow-200 px-0.5">ab</span>
          <input type="color" defaultValue="#fde047" onChange={(e) => aplicarRealce(e.target.value)} className="w-5 h-1.5 p-0 border-0 cursor-pointer bg-transparent" aria-label="Cor de destaque" />
        </label>
        <Divisor />

        <BotaoBarra titulo="Alinhar à esquerda" aoClicar={() => exec('justifyLeft')} ativo={ativos.justifyLeft}>
          <IconeUtil nome="esquerda" className="w-4 h-4" />
        </BotaoBarra>
        <BotaoBarra titulo="Centralizar" aoClicar={() => exec('justifyCenter')} ativo={ativos.justifyCenter}>
          <IconeUtil nome="centro" className="w-4 h-4" />
        </BotaoBarra>
        <BotaoBarra titulo="Alinhar à direita" aoClicar={() => exec('justifyRight')} ativo={ativos.justifyRight}>
          <IconeUtil nome="direita" className="w-4 h-4" />
        </BotaoBarra>
        <BotaoBarra titulo="Justificar" aoClicar={() => exec('justifyFull')} ativo={ativos.justifyFull}>
          <IconeUtil nome="justificar" className="w-4 h-4" />
        </BotaoBarra>
        <Divisor />

        <BotaoBarra titulo="Lista com marcadores" aoClicar={() => exec('insertUnorderedList')} ativo={ativos.insertUnorderedList}>
          <IconeUtil nome="lista" className="w-4 h-4" />
        </BotaoBarra>
        <BotaoBarra titulo="Lista numerada" aoClicar={() => exec('insertOrderedList')} ativo={ativos.insertOrderedList}>
          <IconeUtil nome="listaNum" className="w-4 h-4" />
        </BotaoBarra>
        <BotaoBarra titulo="Diminuir recuo" aoClicar={() => exec('outdent')}>
          <IconeUtil nome="desrecuar" className="w-4 h-4" />
        </BotaoBarra>
        <BotaoBarra titulo="Aumentar recuo" aoClicar={() => exec('indent')}>
          <IconeUtil nome="recuar" className="w-4 h-4" />
        </BotaoBarra>
        <Divisor />

        <BotaoBarra titulo="Inserir link" aoClicar={inserirLink}>
          <IconeUtil nome="link" className="w-4 h-4" />
        </BotaoBarra>
        <BotaoBarra titulo="Inserir imagem" aoClicar={() => inputImagemRef.current?.click()}>
          <IconeUtil nome="imagem" className="w-4 h-4" />
        </BotaoBarra>
        <select className={`${SELECT_CLASSE} w-[74px]`} value="" aria-label="Inserir tabela" onChange={(e) => inserirTabela(e.target.value)}>
          <option value="">Tabela</option>
          <option value="2x2">2 × 2</option>
          <option value="3x3">3 × 3</option>
          <option value="4x3">4 × 3</option>
          <option value="5x4">5 × 4</option>
          <option value="8x4">8 × 4</option>
        </select>
        <BotaoBarra titulo="Linha horizontal" aoClicar={() => exec('insertHorizontalRule')}>
          <span className="font-bold">―</span>
        </BotaoBarra>
        <Divisor />

        <BotaoBarra
          titulo="Limpar formatação"
          aoClicar={() => {
            exec('removeFormat');
            exec('unlink');
          }}
        >
          <span className="text-[11px] font-bold">Tx</span>
        </BotaoBarra>
        <BotaoBarra titulo="Localizar e substituir" aoClicar={() => setPainel(painel === 'localizar' ? null : 'localizar')} ativo={painel === 'localizar'}>
          <IconeUtil nome="buscar" className="w-4 h-4" />
        </BotaoBarra>
        <input ref={inputImagemRef} type="file" accept="image/*" className="hidden" onChange={aoEscolherImagem} />
      </div>

      {/* Ferramentas da tabela (aparecem quando o cursor está numa tabela) */}
      {dentroTabela && (
        <div className="bg-blue-50 border-b border-blue-100 px-2.5 py-1.5 flex items-center gap-1.5 overflow-x-auto shrink-0">
          <span className="text-[10px] font-bold text-blue-900 shrink-0">Tabela:</span>
          {[
            { r: '+ Linha', a: 'linha+' },
            { r: '+ Coluna', a: 'coluna+' },
            { r: '− Linha', a: 'linha-' },
            { r: '− Coluna', a: 'coluna-' },
            { r: 'Excluir tabela', a: 'excluir' },
          ].map((b) => (
            <button
              key={b.a}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => operarTabela(b.a as any)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                b.a === 'excluir' ? 'bg-rose-100 text-rose-800 hover:bg-rose-200' : 'bg-white text-blue-900 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              {b.r}
            </button>
          ))}
        </div>
      )}

      {/* Localizar e substituir */}
      {painel === 'localizar' && (
        <div className="bg-white border-b border-slate-200 px-2.5 py-2 flex flex-wrap items-center gap-1.5 shrink-0">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && localizarProximo()}
            placeholder="Localizar"
            aria-label="Texto a localizar"
            className="flex-1 min-w-[110px] border border-slate-200 rounded-lg px-2.5 py-1.5 text-base sm:text-xs outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={troca}
            onChange={(e) => setTroca(e.target.value)}
            placeholder="Substituir por"
            aria-label="Texto para substituir"
            className="flex-1 min-w-[110px] border border-slate-200 rounded-lg px-2.5 py-1.5 text-base sm:text-xs outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="button" onClick={localizarProximo} className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer">
            Localizar
          </button>
          <button type="button" onClick={substituirTudo} className="px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-bold cursor-pointer">
            Substituir tudo
          </button>
        </div>
      )}

      {/* Folha de escrita */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-4">
        <div className="mx-auto max-w-3xl bg-white rounded-lg shadow border border-slate-200 min-h-full relative">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            spellCheck
            role="textbox"
            aria-multiline="true"
            aria-label="Texto do documento"
            data-placeholder="Comece a escrever…"
            data-vazio="true"
            onInput={() => {
              atualizarContagem();
              agendarSalvar();
            }}
            onBlur={salvarAgora}
            onPaste={aoColar}
            onKeyDown={aoTeclar}
            className="util-editor-conteudo relative px-5 py-5 sm:px-10 sm:py-8 min-h-[420px] outline-none"
          />
        </div>
      </div>

      {/* Barra de status */}
      <div className="bg-white border-t border-slate-200 px-3 py-1.5 flex items-center justify-between gap-3 text-[11px] text-slate-500 shrink-0">
        <span>
          {contagem.palavras} {contagem.palavras === 1 ? 'palavra' : 'palavras'} · {contagem.caracteres} caracteres · ~{minutosLeitura} min de leitura
        </span>
        <span className={status === 'erro' ? 'text-rose-700 font-semibold' : ''} role="status">
          {status === 'salvando' && 'Salvando…'}
          {status === 'salvo' && (salvoEm ? `Salvo às ${salvoEm}` : 'Salvo neste aparelho')}
          {status === 'erro' && 'Sem espaço para salvar. Exclua documentos ou imagens.'}
        </span>
      </div>

      {aviso && (
        <div role="status" className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg z-30">
          {aviso}
        </div>
      )}

      {/* Lista de documentos */}
      {painel === 'docs' && (
        <div className="absolute inset-0 z-20 bg-slate-100 overflow-y-auto p-3">
          <div className="max-w-xl mx-auto space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-blue-900 text-sm">Meus documentos</h3>
              <button
                type="button"
                onClick={() => setPainel(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                aria-label="Fechar lista"
              >
                <IconeUtil nome="fechar" className="w-5 h-5" />
              </button>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => criarDocumento()} className="flex-1 py-2.5 rounded-xl bg-blue-900 text-white font-bold cursor-pointer hover:bg-blue-800">
                + Novo documento
              </button>
              <button type="button" onClick={() => inputArquivoRef.current?.click()} className="flex-1 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold cursor-pointer hover:bg-slate-50">
                Abrir arquivo (.txt, .html)
              </button>
              <input ref={inputArquivoRef} type="file" accept=".txt,.html,.htm,text/plain,text/html" className="hidden" onChange={aoAbrirArquivo} />
            </div>
            <ul className="space-y-2">
              {[...docs]
                .sort((a, b) => b.atualizado - a.atualizado)
                .map((d) => (
                  <li key={d.id} className={`flex items-center gap-2 bg-white rounded-xl border p-2.5 ${d.id === atualId ? 'border-blue-500' : 'border-slate-200'}`}>
                    <button type="button" onClick={() => abrirDocumento(d.id)} className="flex-1 min-w-0 text-left cursor-pointer">
                      <p className="font-bold text-slate-800 truncate">{d.titulo || 'Documento sem título'}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(d.atualizado).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        {d.id === atualId ? ' · aberto' : ''}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => excluirDocumento(d.id)}
                      className="w-8 h-8 rounded-full hover:bg-rose-50 text-rose-700 flex items-center justify-center cursor-pointer"
                      aria-label={`Excluir ${d.titulo}`}
                    >
                      <IconeUtil nome="lixo" className="w-4 h-4" />
                    </button>
                  </li>
                ))}
            </ul>
            <p className="text-[10px] text-slate-400">
              Os documentos ficam salvos neste aparelho e navegador. Para levar para outro lugar, use Exportar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
