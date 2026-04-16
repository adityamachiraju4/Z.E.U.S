# Z.E.U.S. Security Policy

## Vulnerability Disposition (2026-04-16)

All 26 vulnerabilities reported by `npm audit` are **confined to the CRA build toolchain** (react-scripts, jest, webpack-dev-server). None appear in the compiled production output deployed to Vercel.

### Accepted Build-Tool Risks
| Package | Severity | Location | Production Risk |
|---|---|---|---|
| @tootallnate/once | High | Jest (test runner) | None |
| nth-check | High | svgo/react-scripts | None |
| postcss | Moderate | resolve-url-loader | None |
| serialize-javascript | High | workbox-webpack | None |
| underscore | High | bfj/jsonpath | None |
| webpack-dev-server | Moderate | Dev server | None |

### Planned Resolution
Migrate from Create React App → Vite after Phase 10.

## Security Standards
- All API keys stored in backend proxy (Phase 8)
- HTTPS enforced on all endpoints
- CSP headers on Vercel deployment
- Input sanitization on all user inputs
- No sensitive data in localStorage
- Rate limiting on all API routes
- Secure service worker for PWA
