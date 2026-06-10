# auth.md

You are an agent. This site supports **agentic registration** for read-only public access: discover metadata, confirm the anonymous flow, then use public endpoints under the `public:read` scope. No OAuth credentials are issued today.

## Step 1 — Discover

Discovery is two hops on `https://ilongda.com`.

### 1a. Fetch the Protected Resource Metadata

```http
GET /.well-known/oauth-protected-resource
```

Machine-readable source of truth:

```json
{
  "resource": "https://ilongda.com/",
  "resource_name": "Longda's Interesting World",
  "authorization_servers": ["https://ilongda.com/"],
  "scopes_supported": ["public:read"],
  "bearer_methods_supported": ["header"],
  "resource_documentation": "https://ilongda.com/auth.md"
}
```

What each field tells you:

- `resource` — canonical site URL for public content and discovery resources.
- `resource_name` — display name to show users when asking for consent.
- `authorization_servers` — OAuth Authorization Server issuer(s) for this resource.
- `scopes_supported` — scopes the site understands. Today only `public:read` is available.
- `bearer_methods_supported` — bearer presentation method if a token were issued (`header`).

### 1b. Fetch the Authorization Server metadata

```http
GET /.well-known/oauth-authorization-server
```

Read the `agent_auth` block for supported registration methods, credential types, and claim URLs.

## Step 2 — Pick a method

Only **anonymous** registration is supported today.

- You have a user identity assertion or verified email → not supported yet.
- You have neither and only need public read access → use [anonymous](#agent-registration).

Before proceeding, confirm `anonymous` appears in `agent_auth.identity_types_supported`.

## Step 3 — Register

<a id="agent-registration"></a>

### anonymous

No registration POST is required for public reads on this static site.

1. Read this document and the linked discovery metadata.
2. Use public endpoints under scope `public:read`.
3. Do not send an `Authorization` header; no bearer token or API key is issued.
4. Respect `robots.txt`, `ai.txt`, and published rate limits.

Supported values for this method:

- Registration URI: `https://ilongda.com/auth.md#agent-registration`
- Identity type: `anonymous`
- Credential type: `none`
- Claim URI: `https://ilongda.com/auth.md#agent-registration`
- Revocation URI: not applicable because no credentials are issued

If protected APIs are added later, this section will list the registration endpoint, supported identity assertions, credential types, scopes, claim endpoint, and revocation endpoint.

## Supported Scopes

| Scope | Description |
| --- | --- |
| `public:read` | Read public pages, feeds, search indexes, and discovery resources without authentication |

## Discovery Metadata

- OAuth Protected Resource Metadata: <https://ilongda.com/.well-known/oauth-protected-resource>
- OAuth Authorization Server Metadata: <https://ilongda.com/.well-known/oauth-authorization-server>
- OpenID Configuration: <https://ilongda.com/.well-known/openid-configuration>
- JWKS document: <https://ilongda.com/.well-known/jwks.json>
- Token endpoint metadata: <https://ilongda.com/.well-known/oauth/token>

## Public Resources

- Site guide: <https://ilongda.com/llms.txt>
- Full text archive: <https://ilongda.com/llms-full.txt>
- API catalog: <https://ilongda.com/.well-known/api-catalog>
- Public search index: <https://ilongda.com/search.xml>
- Atom feed: <https://ilongda.com/atom.xml>

## Future Protected APIs

If protected APIs are added later, this file and the OAuth discovery endpoints will be updated with registration instructions, supported credentials, scopes, and token acquisition details.
