// Funções usadas pelo devocional do sistema (DevocionalModule) e do aplicativo (AppMobileModule).
// Os dois gravam na mesma tabela "devotionals", então o que um publica o outro mostra.
import { sanitizarHtml } from './utilitarios/sanitizar';

// Data de hoje no fuso do aparelho (toISOString usa o horário de Londres: depois das 21h no Brasil já dava o dia seguinte)
export const hojeLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const dataBR = (iso?: string) => (iso ? iso.split('-').reverse().join('/') : '');

// Quem pode criar e editar o devocional: administrador e pastor
export const podeEditarDevocional = (usuario: any) => {
  const perfil = String(usuario?.perfil || '').toLowerCase();
  const cargo = String(usuario?.cargo || '').toLowerCase();
  return (
    perfil === 'admin' ||
    perfil === 'administrador' ||
    perfil === 'pastor' ||
    cargo === 'pastor' ||
    usuario?.funcao === 'admin'
  );
};

const escapar = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const temTags = (t: string) => /<\/?[a-z][^>]*>/i.test(t || '');

// Texto digitado no app -> HTML (parágrafos separados por linha em branco; Enter simples vira quebra de linha)
export const textoParaHtml = (texto: string) =>
  (texto || '')
    .trim()
    .split(/\n\s*\n/)
    .filter((p) => p.trim())
    .map((p) => `<p>${escapar(p.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('');

// HTML do devocional -> texto simples (para editar no app, compartilhar e gerar a arte)
export const htmlParaTexto = (html: string) => {
  if (!temTags(html)) return (html || '').trim();
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  doc.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  const blocos: string[] = [];
  doc.body.querySelectorAll('p, li, blockquote, h1, h2, h3, h4').forEach((el) => {
    if (el.querySelector('p, li')) return; // evita repetir texto de blocos aninhados
    const t = (el.textContent || '').trim();
    if (!t) return;
    const itemDeLista = el.tagName === 'LI' || !!el.closest('li');
    blocos.push(itemDeLista ? `• ${t}` : t);
  });
  return (blocos.length ? blocos.join('\n\n') : doc.body.textContent || '').trim();
};

// Negrito, itálico, listas e citações feitos no sistema se perdem ao editar pelo app (que é texto simples)
export const temFormatacao = (html: string) => /<(strong|b|em|i|u|ul|ol|li|blockquote|h[1-6])\b/i.test(html || '');

// HTML seguro para exibir (aceita tanto o HTML do sistema quanto textos antigos sem formatação)
export const htmlParaExibir = (conteudo: string) => (temTags(conteudo) ? sanitizarHtml(conteudo) : textoParaHtml(conteudo));

// Classes para o HTML do devocional ficar bonito (o Tailwind tira as bolinhas das listas por padrão)
export const classesConteudo =
  '[&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 [&_blockquote]:border-l-4 [&_blockquote]:border-amber-400 [&_blockquote]:pl-3 [&_blockquote]:italic [&_strong]:font-bold [&_em]:italic';
