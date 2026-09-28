// DuckDuckGo results extractor.
// Pass this function to chrome-devtools_evaluate_script.
// Works on lite.duckduckgo.com and html.duckduckgo.com.
// Returns { query, count, challenged, results: [{ title, url, snippet, display, date }] }

() => {
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const unwrap = (href) => {
    if (!href) return '';
    const absolute = href.startsWith('//') ? 'https:' + href : new URL(href, location.href).href;
    const m = /[?&]uddg=([^&]+)/.exec(absolute);
    return m ? decodeURIComponent(m[1]) : absolute;
  };
  const raw = [];

  // html.duckduckgo.com: each result is a self-contained .result block.
  const blocks = document.querySelectorAll('.result.results_links, .result.web-result');
  if (blocks.length) {
    for (const b of blocks) {
      const a = b.querySelector('a.result__a');
      if (!a) continue;
      raw.push({
        title: a.textContent,
        url: a.getAttribute('href'),
        snippet: b.querySelector('.result__snippet')?.textContent,
        display: b.querySelector('.result__url')?.textContent,
        date: b.querySelector('.result__extras__url span:not(.result__icon)')?.textContent
      });
    }
  } else {
    // lite.duckduckgo.com: a flat table, one row per field, in document order.
    let current = null;
    for (const tr of document.querySelectorAll('tr')) {
      const a = tr.querySelector('a.result-link');
      if (a) {
        current = { title: a.textContent, url: a.getAttribute('href'), snippet: '', display: '', date: '' };
        raw.push(current);
        continue;
      }
      if (!current) continue;
      const snippet = tr.querySelector('td.result-snippet');
      if (snippet && !current.snippet) { current.snippet = snippet.textContent; continue; }
      const display = tr.querySelector('span.link-text');
      if (display && !current.display) current.display = display.textContent;
      const date = tr.querySelector('span.timestamp');
      if (date && !current.date) current.date = date.textContent;
    }
  }

  const results = [];
  for (const r of raw) {
    const url = unwrap(r.url);
    if (!url || url.startsWith('https://duckduckgo.com/')) continue;
    results.push({ title: clean(r.title), url, snippet: clean(r.snippet), display: clean(r.display), date: clean(r.date) });
  }

  const title = document.title || '';
  return {
    query: (document.querySelector('input[name=q]')?.value || title.replace(/\s+at DuckDuckGo\s*$/, '')).trim(),
    count: results.length,
    challenged: /challenge|anomaly|blocked|are you a robot/i.test(document.body.innerText.slice(0, 2000)),
    results
  };
}
