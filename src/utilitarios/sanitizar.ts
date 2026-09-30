// Limpa HTML colado ou carregado: remove scripts, atributos perigosos e estilos de Word/sites.

const REMOVER_COM_CONTEUDO = new Set([
    'SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META', 'FORM', 'INPUT', 'BUTTON', 'TEXTAREA', 'SELECT',
    'SVG', 'MATH', 'NOSCRIPT', 'TEMPLATE', 'HEAD', 'TITLE', 'AUDIO', 'VIDEO', 'CANVAS', 'BASE',
  ]);
  
  const TAGS_PERMITIDAS = new Set([
    'P', 'BR', 'DIV', 'SPAN', 'B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'DEL', 'SUB', 'SUP',
    'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE', 'CODE', 'UL', 'OL', 'LI', 'A', 'IMG',
    'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TD', 'TH', 'HR', 'FONT',
  ]);
  
  const ESTILOS_PERMITIDOS = new Set([
    'text-align', 'font-weight', 'font-style', 'text-decoration', 'text-decoration-line', 'color',
    'background-color', 'font-size', 'font-family', 'margin-left', 'padding-left',
  ]);
  
  const URL_LINK = /^(https?:|mailto:|tel:|#)/i;
  const URL_IMAGEM = /^(https?:|data:image\/(png|jpe?g|gif|webp);base64,)/i;
  
  function filtrarEstilo(valor: string): string {
    return valor
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean)
      .filter((d) => {
        const i = d.indexOf(':');
        if (i < 0) return false;
        const prop = d.slice(0, i).trim().toLowerCase();
        const val = d.slice(i + 1).trim().toLowerCase();
        return ESTILOS_PERMITIDOS.has(prop) && !/url\(|expression|javascript|@import/.test(val);
      })
      .join('; ');
  }
  
  function limparNo(no: Node) {
    Array.from(no.childNodes).forEach((filho) => {
      if (filho.nodeType === Node.COMMENT_NODE) {
        filho.parentNode?.removeChild(filho);
        return;
      }
      if (filho.nodeType !== Node.ELEMENT_NODE) return; // texto fica
  
      const el = filho as HTMLElement;
      const tag = el.tagName;
  
      if (REMOVER_COM_CONTEUDO.has(tag)) {
        el.remove();
        return;
      }
  
      limparNo(el); // limpa os filhos primeiro
  
      if (!TAGS_PERMITIDAS.has(tag)) {
        // tag desconhecida: mantém só o conteúdo
        while (el.firstChild) el.parentNode?.insertBefore(el.firstChild, el);
        el.remove();
        return;
      }
  
      // atributos: só o que é seguro para cada tag
      Array.from(el.attributes).forEach((attr) => {
        const nome = attr.name.toLowerCase();
        let manter = false;
        if (nome === 'style') {
          const limpo = filtrarEstilo(attr.value);
          if (limpo) el.setAttribute('style', limpo);
          else el.removeAttribute('style');
          return;
        }
        if (tag === 'A' && nome === 'href') manter = URL_LINK.test(attr.value.trim());
        else if (tag === 'IMG' && nome === 'src') manter = URL_IMAGEM.test(attr.value.trim());
        else if (tag === 'IMG' && (nome === 'alt' || nome === 'width' || nome === 'height')) manter = true;
        else if ((tag === 'TD' || tag === 'TH') && (nome === 'colspan' || nome === 'rowspan')) manter = true;
        else if (tag === 'FONT' && (nome === 'face' || nome === 'size' || nome === 'color')) manter = true;
        if (!manter) el.removeAttribute(attr.name);
      });
  
      if (tag === 'A') {
        if (!el.getAttribute('href')) {
          while (el.firstChild) el.parentNode?.insertBefore(el.firstChild, el);
          el.remove();
          return;
        }
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noreferrer noopener');
      }
      if (tag === 'IMG' && !el.getAttribute('src')) el.remove();
    });
  }
  
  export function sanitizarHtml(html: string): string {
    const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
    limparNo(doc.body);
    return doc.body.innerHTML;
  }
  
  export const escaparHtml = (t: string) =>
    t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');