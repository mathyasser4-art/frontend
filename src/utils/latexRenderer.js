import katex from 'katex';
import DOMPurify from 'dompurify';

const DEFAULT_ALLOWED_TAGS = [
  'p', 'b', 'strong', 'i', 'em', 'u', 'br', 'ul', 'ol', 'li',
  'span', 'div', 'img', 'h1', 'h2', 'h3', 'blockquote', 'pre', 'code',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'svg', 'path', 'g', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
  'use', 'defs', 'symbol', 'text', 'tspan',
  'math', 'semantics', 'mrow', 'mn', 'msup', 'msub', 'msubsup', 'mi', 'mo',
  'annotation', 'annotation-xml', 'mspace', 'mtable', 'mtr', 'mtd', 'mfrac',
  'msqrt', 'mroot', 'style'
];

const DEFAULT_ALLOWED_ATTR = [
  'src', 'alt', 'style', 'class', 'width', 'height',
  'dir', 'lang', 'href', 'target', 'colspan', 'rowspan',
  'd', 'fill', 'stroke', 'stroke-width', 'viewBox', 'xmlns',
  'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry',
  'transform', 'points', 'preserveAspectRatio', 'font-size', 'text-anchor',
  'aria-hidden', 'aria-label', 'role', 'contenteditable', 'data-value', 'encoding'
];

const MATH_PATTERNS = [
  { regex: /\$\$([\s\S]+?)\$\$/g, displayMode: true },
  { regex: /\\\[([\s\S]+?)\\\]/g, displayMode: true },
  { regex: /\\\(([\s\S]+?)\\\)/g, displayMode: false },
  { regex: /\$([^$\n]+?)\$/g, displayMode: false }
];

/**
 * Recursively decodes HTML entities (including double-escaped entities like &amp;lt;p&amp;gt;)
 */
function decodeHtmlEntities(str) {
  if (!str) return '';
  let txt = String(str);
  for (let i = 0; i < 3; i++) {
    if (!/&[a-zA-Z0-9#]+;/.test(txt)) break;
    txt = txt
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#35;/g, '#');
  }
  return txt;
}

function renderKatex(formula, displayMode = false) {
  if (!formula) return '';
  try {
    const decoded = decodeHtmlEntities(formula)
      .replace(/^#+|#+$/g, '')
      .trim();

    if (!decoded) return '';

    return katex.renderToString(decoded, {
      throwOnError: false,
      displayMode,
      output: 'html',
      strict: 'ignore',
      trust: true
    });
  } catch {
    return formula;
  }
}

/**
 * Process a block between hashes (#...#).
 * Strips hashes and renders KaTeX for pure formulas OR embedded math expressions inside mixed text.
 */
function processHashBlock(content) {
  if (!content) return '';
  const trimmed = content.trim();

  // 1. Skip CSS hex color codes (e.g. f8f9fa, 2563eb, fff, 007bff)
  if (/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(trimmed)) {
    return `#${trimmed}#`;
  }

  // 2. Skip if it contains CSS syntax
  if (/[;:]/.test(trimmed) && (trimmed.includes('color') || trimmed.includes('style') || trimmed.includes('background') || trimmed.includes('margin') || trimmed.includes('padding'))) {
    return `#${trimmed}#`;
  }

  // 3. Try rendering the entire block as a KaTeX formula
  const katexHtml = renderKatex(trimmed, false);
  if (katexHtml && katexHtml.includes('class="katex"')) {
    return katexHtml;
  }

  // 4. Fallback: if block contains mixed text & math, render embedded math formulas inside
  return renderEmbeddedMath(trimmed);
}

function renderEmbeddedMath(text) {
  if (!text) return '';
  let result = String(text);

  // If text is already pure HTML containing KaTeX, preserve it without corrupting existing spans
  if (result.includes('class="katex"') || result.includes('class="ql-formula"')) {
    return result;
  }

  // 1. Render LaTeX delimiters ($...$, $$...$$, \[...\], \(...\))
  result = renderMath(result);

  // 2. Render expressions with carets (e.g. 13x^2 - 91 or x^2 or 13(x^2 - 7))
  result = result.replace(/(\b[a-zA-Z0-9()\s+\-*\/=]+?\^[0-9a-zA-Z(){}]+[a-zA-Z0-9()\s+\-*\/=]*)/g, (match) => {
    if (match.includes('<') || match.includes('>')) return match;
    const katexOut = renderKatex(match.trim(), false);
    if (katexOut && katexOut.includes('class="katex"')) {
      return katexOut;
    }
    return match;
  });

  return result;
}

function replaceHashMath(text) {
  if (!text) return '';

  let html = String(text);

  // 1. Process #latex#...#latex# or &#35;latex&#35;...&#35;latex&#35;
  html = html.replace(/(?:#latex#|&#35;latex&#35;)([\s\S]+?)(?:#latex#|&#35;latex&#35;)/gi, (_, content) => {
    return processHashBlock(content);
  });

  // 2. Process #content# or &#35;content&#35;
  html = html.replace(/(?:#|&#35;)([^#\n\r<>]+?)(?:#|&#35;)/g, (_, content) => {
    return processHashBlock(content);
  });

  return html;
}

function renderQuillFormulas(html) {
  if (typeof document === 'undefined') return html;

  const container = document.createElement('div');
  container.innerHTML = html;

  container.querySelectorAll('span.ql-formula').forEach(span => {
    const formula = span.getAttribute('data-value');
    if (!formula) return;

    const rendered = renderKatex(formula, false);
    const tmp = document.createElement('span');
    tmp.innerHTML = rendered;
    span.replaceWith(...tmp.childNodes);
  });

  return container.innerHTML;
}

function renderMath(text) {
  return MATH_PATTERNS.reduce((html, { regex, displayMode }) =>
    html.replace(regex, (_, formula) => renderKatex(formula, displayMode)),
  text);
}

export function renderLatexInHtml(rawHtml) {
  if (!rawHtml) return '';

  // Step 0: Recursively decode any double or single escaped HTML entities (&amp;lt;p&amp;gt; -> &lt;p&gt; -> <p>)
  let htmlStr = decodeHtmlEntities(rawHtml);

  // Convert literal escaped "\\n" to actual newlines
  htmlStr = htmlStr.replace(/\\n/g, '\n');

  // Format run-together SAT explanation choices (e.g. "6.Choice A", "errors.Choice D")
  htmlStr = htmlStr.replace(/([.!?])\s*(Choice\s+[A-D]\s+is\s+(?:in)?correct)/gi, '$1<br/><br/><strong>$2</strong>');
  htmlStr = htmlStr.replace(/([.!?])\s*(Choice\s+[A-D]\b)/gi, '$1<br/><br/><strong>$2</strong>');

  // Convert standalone newlines to <br/> so line breaks are preserved
  if (!htmlStr.includes('<p>') && !htmlStr.includes('<div>')) {
    htmlStr = htmlStr.replace(/\r?\n/g, '<br/>');
  } else {
    htmlStr = htmlStr.replace(/([^>])\r?\n([^<])/g, '$1<br/>$2');
  }

  // Step 1: Render all #latex# and #math# hash-enclosed formulas FIRST (strips hashes & renders math)
  const withHashMath = replaceHashMath(htmlStr);

  // Step 2: Render Quill ql-formula spans via DOM
  const withQuillMath = renderQuillFormulas(withHashMath);

  // Step 3: Sanitize with DOMPurify
  const sanitized = DOMPurify.sanitize(withQuillMath, {
    ALLOWED_TAGS: DEFAULT_ALLOWED_TAGS,
    ALLOWED_ATTR: DEFAULT_ALLOWED_ATTR,
    ALLOW_DATA_ATTR: true,
    FORCE_BODY: false
  });

  // Step 4: Render any remaining math ($...$, $$...$$, carets ^)
  const withMath = renderEmbeddedMath(sanitized);

  return withMath
    .replace(/&nbsp;/g, ' ')
    .replace(/&#160;/g, ' ')
    .trim();
}
