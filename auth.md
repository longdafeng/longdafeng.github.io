# auth.md

Agent authentication and registration guidance for `https://ilongda.com`.

No registration is required to read public content on this site.

Agents may crawl, index, summarize, and retrieve public pages, feeds, and discovery resources without OAuth credentials. The site currently does not expose protected write APIs or user-specific APIs.

## Agent Registration

Anonymous access is the supported registration method for agents today. Agents do not need to create an account, complete OAuth, present a bearer token, or request a client credential before reading public resources.

- Registration URI: <https://ilongda.com/auth.md#agent-registration>
- Identity type: `anonymous`
- Credential type: `none`
- Claim URI: <https://ilongda.com/auth.md#agent-registration>
- Revocation URI: not applicable because no credentials are issued

If protected APIs are added later, this section will list the registration endpoint, supported identity assertions, credential types, scopes, claim endpoint, and revocation endpoint.

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
