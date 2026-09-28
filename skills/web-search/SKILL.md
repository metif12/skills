---
name: web-search
description: Search the web from a real browser and read the results. Use when the user asks to search, look up, google, or find something online; when a fact needs a source you don't have; when a library's current docs, versions, or pricing matter; or when built-in websearch is blocked, rate-limited, or returns nothing useful.
---

# Web search

Search through the **chrome-devtools** MCP: a real Chrome, real DuckDuckGo results, real page content. The built-in `websearch` tool is the fallback, not the first choice — it gets rate-limited and returns thin snippets, while this path reads the actual page.

## Search

1. **Build the URL.** `https://lite.duckduckgo.com/lite/?q=<urlencoded query>`. Optional params: `&df=d|w|m|y` (past day/week/month/year), `&kl=<region>` (`us-en`, `de-de`, `ir-en`), `&s=<offset>` (pagination, +10 per page). Site and filetype operators work in the query itself: `site:github.com opencode skills`, `filetype:pdf "web search"`.
2. **Open it.** `chrome-devtools_new_page` with that URL. If a page is already open, `chrome-devtools_navigate_page` with `type: "url"` instead.
3. **Extract.** Read [`scripts/ddg.js`](scripts/ddg.js) and pass its function to `chrome-devtools_evaluate_script`. It handles both `lite.duckduckgo.com` and `html.duckduckgo.com` and unwraps the `uddg` redirect to real URLs.
4. **Report.** Give the user a compact numbered list: title, URL, one line of what the result actually says. Cite the URL for anything load-bearing.

**Done when:** the question is answered, or the results are reported with the URLs the user can open.

Searches beyond page 1, or a snippet that looks too generic to be the real one: navigate to the result and read it (below) rather than paging further.

## Read a page

1. **Navigate.** `chrome-devtools_navigate_page` to the result URL — reuse the same page, or open a new one when you still need the SERP behind you.
2. **Extract.** Read [`scripts/markdown.js`](scripts/markdown.js) and pass its function to `chrome-devtools_evaluate_script`. It emits markdown: headings, lists, code fences, tables, and resolved absolute links.
3. **Wait for the page.** For a client-rendered site, `chrome-devtools_wait_for` a phrase you expect in the article before extracting, or you'll pull an empty shell.
4. **Answer from it,** quoting the parts that matter. When the page is long, extract and cite sections rather than dumping the whole thing.

**Done when:** the specific thing asked for is in your answer, with its source URL.

## When to fall back

Reach for the built-in `websearch` tool when the browser path is blocked, and say which path you used:

- No results, or DuckDuckGo serves a challenge page instead of results.
- A page the extractor can't reach (a JS-only app, a login wall, a paywall) after one retry.
- The question needs live-crawled content across many sites at once, which `websearch` does better than a browser.

## Notes

- Chrome must be running. `chrome-devtools_navigate_page` attaches to a real profile, so anything the user is logged into is reachable; use that for search engines and sites that gate on login.
- Dynamic pages need `chrome-devtools_wait_for` before extraction, not a blind retry.
- Open the fewest pages that answer the question. Each navigation costs a round trip and context.
