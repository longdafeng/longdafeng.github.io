(function registerAgentTools() {
  'use strict';

  const emptyInputSchema = {
    type: 'object',
    properties: {},
    additionalProperties: false
  };

  const tools = [
    {
      name: 'get_site_info',
      title: 'Get site info',
      description: 'Return basic discovery metadata for ilongda.com, including feeds and auth guidance URLs.',
      inputSchema: emptyInputSchema,
      annotations: {
        readOnlyHint: true
      },
      execute: async () => ({
        name: "Longda's Interesting World",
        url: 'https://ilongda.com/',
        authGuide: 'https://ilongda.com/auth.md',
        siteGuide: 'https://ilongda.com/llms.txt',
        fullArchive: 'https://ilongda.com/llms-full.txt',
        atomFeed: 'https://ilongda.com/atom.xml',
        searchIndex: 'https://ilongda.com/search.xml',
        apiCatalog: 'https://ilongda.com/.well-known/api-catalog'
      })
    },
    {
      name: 'get_site_guide',
      title: 'Get site guide',
      description: 'Fetch the agent-readable guide for ilongda.com public content.',
      inputSchema: emptyInputSchema,
      annotations: {
        readOnlyHint: true
      },
      execute: async () => textResult(await fetchTextResource('/llms.txt', 'text/plain', 'site guide'))
    },
    {
      name: 'get_full_content_archive',
      title: 'Get full content archive',
      description: 'Fetch the generated plain-text archive of public posts and knowledge pages.',
      inputSchema: emptyInputSchema,
      annotations: {
        readOnlyHint: true
      },
      execute: async () => textResult(await fetchTextResource('/llms-full.txt', 'text/plain', 'full content archive'))
    },
    {
      name: 'get_recent_feed',
      title: 'Get recent feed',
      description: 'Fetch the Atom feed for recent public posts on ilongda.com.',
      inputSchema: emptyInputSchema,
      annotations: {
        readOnlyHint: true
      },
      execute: async () => textResult(await fetchTextResource('/atom.xml', 'application/atom+xml,application/xml,text/xml', 'recent feed'))
    },
    {
      name: 'search_public_content',
      title: 'Search public content',
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

  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', () => controller.abort(), { once: true });
  }

  registerForAgentBrowsers();

  function registerForAgentBrowsers() {
    const navigatorContext = getNavigatorModelContext();
    if (navigatorContext) {
      registerTools(navigatorContext, 'navigator.modelContext');
      return;
    }

    const documentContext = getDocumentModelContext();
    if (documentContext) {
      registerTools(documentContext, 'document.modelContext');
      return;
    }

    console.info('[WebMCP] navigator.modelContext is not available in this browser');
  }

  function getNavigatorModelContext() {
    if (typeof navigator === 'undefined' || !('modelContext' in navigator)) {
      return null;
    }

    return navigator.modelContext;
  }

  function getDocumentModelContext() {
    if (typeof document === 'undefined' || !('modelContext' in document)) {
      return null;
    }

    return document.modelContext;
  }

  function registerTools(modelContext, label) {
    if (typeof modelContext.provideContext === 'function') {
      try {
        const result = modelContext.provideContext({ tools }, registrationOptions);
        if (result && typeof result.then === 'function') {
          result
            .then(() => {
              console.info(`[WebMCP] Provided ilongda.com tools via ${label}.provideContext()`);
            })
            .catch(error => {
              fallbackRegisterTools(modelContext, label, error);
            });
          return;
        }

        console.info(`[WebMCP] Provided ilongda.com tools via ${label}.provideContext()`);
        return;
      } catch (error) {
        fallbackRegisterTools(modelContext, label, error);
        return;
      }
    }

    fallbackRegisterTools(modelContext, label);
  }

  function fallbackRegisterTools(modelContext, label, priorError) {
    if (typeof modelContext.registerTool !== 'function') {
      console.warn(`[WebMCP] ${label} does not expose provideContext or registerTool`, priorError || '');
      return;
    }

    if (priorError) {
      console.warn(`[WebMCP] provideContext failed on ${label}; falling back to registerTool`, priorError);
    }

    Promise.all(tools.map(tool => modelContext.registerTool(tool, registrationOptions)))
      .then(() => {
        console.info(`[WebMCP] Registered ilongda.com tools via ${label}.registerTool()`);
      })
      .catch(error => {
        console.warn(`[WebMCP] Failed to register ilongda.com tools on ${label}`, error);
      });
  }

  async function fetchTextResource(path, accept, label) {
    const response = await fetch(path, { headers: { Accept: accept } });
    if (!response.ok) {
      console.warn(`[WebMCP] Failed to fetch ${path}`, response.status);
      throw new Error(`Unable to fetch ${label}: ${response.status}`);
    }

    return response.text();
  }

  function textResult(text) {
    return {
      content: [{ type: 'text', text }]
    };
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
