// Page-to-markdown extractor.
// Pass this function to chrome-devtools_evaluate_script.
// Call chrome-devtools_wait_for first on a client-rendered page, or you'll get an empty shell.
// Returns { url, title, description, markdown }

() => {
  const SKIP = new Set(['SCRIPT','STYLE','NOSCRIPT','SVG','CANVAS','IFRAME','TEMPLATE','BUTTON','NAV','HEADER','FOOTER','FORM','INPUT','SELECT','TEXTAREA','DIALOG']);
  const BLOCK = new Set(['P','DIV','SECTION','ARTICLE','MAIN','BODY','UL','OL','DL','DD','DT','BLOCKQUOTE','FIGURE','FIGCAPTION','TABLE','TR','HR','BR','ADDRESS','ASIDE','DETAILS','SUMMARY']);

  const text = (node) => (node.textContent || '').replace(/[\u200b-\u200d\ufeff]/g, '').replace(/\s+/g, ' ').trim();
  const out = [];

  const push = (s) => { if (s) out.push(s); };
  const lastChar = () => {
    for (let i = out.length - 1; i >= 0; i--) if (out[i].trim()) return out[i].trim().slice(-1);
    return '';
  };
  // Text runs into an inline span when either side lost its whitespace to trimming above,
  // so the separator is decided here at build time and never patched up afterwards.
  const inlineCode = (t) => {
    const last = lastChar();
    push((last && !/[\s(\[{<*|`+\-]/.test(last) ? ' ' : '') + '`' + t + '`');
  };
  const inlineText = (t) => {
    if (!t) return;
    push(lastChar() === '`' ? ' ' + t : t);
  };
  const fence = (code) => {
    const body = (code || '').replace(/[\u200b-\u200d\ufeff]/g, '').replace(/\n+$/, '');
    if (body.trim()) push('\n\n```\n' + body + '\n```\n');
  };

  const walk = (node) => {
    if (node.nodeType === 3) { inlineText(text(node)); return; }
    if (node.nodeType !== 1) return;
    const tag = node.tagName;
    if (SKIP.has(tag)) return;

    if (/^H[1-6]$/.test(tag)) {
      push('\n\n' + '#'.repeat(Number(tag[1])) + ' ' + text(node) + '\n');
      return;
    }
    if (tag === 'PRE') { fence(node.innerText || ''); return; }
    if (tag === 'CODE') {
      const t = node.innerText || '';
      if (t.includes('\n')) fence(t);
      else if (t.trim()) inlineCode(t.trim());
      return;
    }
    if (tag === 'LI') { push('\n- '); for (const child of node.childNodes) walk(child); return; }
    if (tag === 'A') {
      const href = node.getAttribute('href');
      if (!href) return;
      const absolute = new URL(href, location.href).href;
      if (href.startsWith('#') || absolute === location.href) { inlineText(text(node)); return; }
      inlineText(text(node));
      push(' <' + absolute + '>');
      return;
    }
    if (tag === 'IMG') { inlineText(node.getAttribute('alt')); return; }
    if (tag === 'BR' || tag === 'HR') { push('\n'); return; }
    if (tag === 'TD' || tag === 'TH') {
      push(' ');
      for (const child of node.childNodes) walk(child);
      push(' | ');
      return;
    }
    for (const child of node.childNodes) walk(child);
    if (BLOCK.has(tag)) push('\n');
  };

  const root = document.querySelector('article, main, [role="main"]') || document.body;
  for (const child of root.childNodes) walk(child);

  return {
    url: location.href,
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content || '',
    markdown: out.join('')
      .replace(/\s+([,.;:!?])/g, '$1')
      .replace(/\(\s+/g, '(')
      .replace(/\[\s+/g, '[')
      .replace(/<\s+/g, '<')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  };
}
