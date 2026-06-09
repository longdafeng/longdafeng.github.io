(function registerAgentTools() {
  'use strict';

  const modelContext = navigator.modelContext;
  if (!modelContext) {
    return;
  }

  const tools = [
    {
      name: 'get_site_guide',
      description: 'Fetch the agent-readable guide for ilongda.com public content.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false
      },
      execute: async () => {
        const response = await fetch('/llms.txt', { headers: { Accept: 'text/plain' } });
        if (!response.ok) {
          console.warn('[WebMCP] Failed to fetch /llms.txt', response.status);
          throw new Error(`Unable to fetch site guide: ${response.status}`);
        }
        return { content: await response.text() };
      }
    },
    {
      name: 'search_public_content',
      description: 'Search the public Hexo search index for a query string.',
      inputSchema: {
        type: 'object',
        required: ['query'],
        properties: {
          query: {
            type: 'string',
            description: 'Case-insensitive term to look for in the public search index.'
          }
        },
        additionalProperties: false
      },
      execute: async input => {
        const query = String(input && input.query ? input.query : '').trim().toLowerCase();
        if (!query) {
          return { matches: [] };
        }

        const response = await fetch('/search.xml', { headers: { Accept: 'application/xml,text/xml' } });
        if (!response.ok) {
          console.warn('[WebMCP] Failed to fetch /search.xml', response.status);
          throw new Error(`Unable to fetch search index: ${response.status}`);
        }

        const xml = await response.text();
        const documentXml = new DOMParser().parseFromString(xml, 'application/xml');
        const entries = Array.from(documentXml.querySelectorAll('entry')).map(entry => ({
          title: text(entry, 'title'),
          url: text(entry, 'url'),
          content: text(entry, 'content')
        }));

        return {
          matches: entries
            .filter(entry => [entry.title, entry.url, entry.content].join(' ').toLowerCase().includes(query))
            .slice(0, 10)
            .map(entry => ({
              title: entry.title,
              url: entry.url,
              excerpt: entry.content.slice(0, 500)
            }))
        };
      }
    }
  ];

  const controller = new AbortController();

  if (typeof modelContext.registerTool === 'function') {
    tools.forEach(tool => modelContext.registerTool(tool, { signal: controller.signal }));
    console.info('[WebMCP] Registered ilongda.com tools with navigator.modelContext.registerTool');
    return;
  }

  if (typeof modelContext.provideContext === 'function') {
    modelContext.provideContext({ tools }, { signal: controller.signal });
    console.info('[WebMCP] Provided ilongda.com tools with navigator.modelContext.provideContext');
  }

  function text(root, selector) {
    const node = root.querySelector(selector);
    return node ? node.textContent.trim() : '';
  }
}());
