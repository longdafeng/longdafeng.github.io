(function registerAgentTools() {
  'use strict';

  const browserNavigator = typeof navigator === 'undefined' ? null : navigator;
  const browserDocument = typeof document === 'undefined' ? null : document;
  const modelContext = (browserNavigator && browserNavigator.modelContext) || (browserDocument && browserDocument.modelContext);
  if (!modelContext) {
    console.info('[WebMCP] navigator.modelContext/document.modelContext is not available in this browser');
    return;
  }

  const emptyInputSchema = {
    type: 'object',
    properties: {},
    additionalProperties: false
  };

  const tools = [
    {
      name: 'get_site_guide',
      description: 'Fetch the agent-readable guide for ilongda.com public content.',
      inputSchema: emptyInputSchema,
      annotations: {
        readOnlyHint: true
      },
      execute: async () => {
        return { content: await fetchTextResource('/llms.txt', 'text/plain', 'site guide') };
      }
    },
    {
      name: 'get_full_content_archive',
      description: 'Fetch the generated plain-text archive of public posts and knowledge pages.',
      inputSchema: emptyInputSchema,
      annotations: {
        readOnlyHint: true
      },
      execute: async () => {
        return { content: await fetchTextResource('/llms-full.txt', 'text/plain', 'full content archive') };
      }
    },
    {
      name: 'get_recent_feed',
      description: 'Fetch the Atom feed for recent public posts on ilongda.com.',
      inputSchema: emptyInputSchema,
      annotations: {
        readOnlyHint: true
      },
      execute: async () => {
        return { content: await fetchTextResource('/atom.xml', 'application/atom+xml,application/xml,text/xml', 'recent feed') };
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
          },
          limit: {
            type: 'integer',
            description: 'Maximum number of matches to return. Defaults to 10 and is capped at 20.',
            minimum: 1,
            maximum: 20
          }
        },
        additionalProperties: false
      },
      annotations: {
        readOnlyHint: true
      },
      execute: async input => {
        const query = String(input && input.query ? input.query : '').trim().toLowerCase();
        if (!query) {
          return { matches: [] };
        }

        const limit = clampLimit(input && input.limit);
        const xml = await fetchTextResource('/search.xml', 'application/xml,text/xml', 'search index');
        const documentXml = new DOMParser().parseFromString(xml, 'application/xml');
        const entries = Array.from(documentXml.querySelectorAll('entry')).map(entry => ({
          title: text(entry, 'title'),
          url: text(entry, 'url'),
          content: text(entry, 'content')
        }));

        return {
          matches: entries
            .filter(entry => [entry.title, entry.url, entry.content].join(' ').toLowerCase().includes(query))
            .slice(0, limit)
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
  const registrationOptions = { signal: controller.signal };
  window.addEventListener('pagehide', () => controller.abort(), { once: true });

  registerTools().catch(error => {
    console.warn('[WebMCP] Failed to register ilongda.com tools', error);
  });

  async function registerTools() {
    if (typeof modelContext.provideContext === 'function') {
      try {
        await modelContext.provideContext({ tools }, registrationOptions);
        console.info('[WebMCP] Provided ilongda.com tools with navigator.modelContext.provideContext');
        return;
      } catch (error) {
        if (typeof modelContext.registerTool !== 'function') {
          throw error;
        }

        console.warn('[WebMCP] provideContext failed; falling back to registerTool', error);
      }
    }

    if (typeof modelContext.registerTool === 'function') {
      await Promise.all(tools.map(tool => modelContext.registerTool(tool, registrationOptions)));
      console.info('[WebMCP] Registered ilongda.com tools with document.modelContext.registerTool');
      return;
    }

    console.warn('[WebMCP] navigator.modelContext/document.modelContext does not expose provideContext or registerTool');
  }

  async function fetchTextResource(path, accept, label) {
    const response = await fetch(path, { headers: { Accept: accept } });
    if (!response.ok) {
      console.warn(`[WebMCP] Failed to fetch ${path}`, response.status);
      throw new Error(`Unable to fetch ${label}: ${response.status}`);
    }

    return response.text();
  }

  function clampLimit(value) {
    const limit = Number.parseInt(value, 10);
    if (Number.isNaN(limit)) {
      return 10;
    }

    return Math.min(Math.max(limit, 1), 20);
  }

  function text(root, selector) {
    const node = root.querySelector(selector);
    return node ? node.textContent.trim() : '';
  }
}());
