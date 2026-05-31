# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest  | ✓         |

## Reporting a Vulnerability

Please report security vulnerabilities to: **security@[your-domain]**

Do NOT open public GitHub issues for security vulnerabilities.

We will respond within 48 hours and aim to patch critical issues within 7 days.

## Security Measures

### Authentication
- All API routes require `x-user-id` header (replace with proper JWT/session auth in production)
- Social account OAuth tokens should be encrypted at rest (`SocialAccount.accessToken`)
- User API keys stored as bcrypt hashes only

### Data Security
- All user inputs sanitized via `sanitizeText()` before storage
- HTML escape applied to any user-supplied content rendered as HTML
- URL validation ensures only `http://` and `https://` protocols are accepted
- SQL injection prevented by Prisma parameterized queries

### Rate Limiting
- Script generation: 5 requests/minute per user
- Audio generation: 10 requests/minute per user
- Kling video: 3 requests/minute per user
- Project creation: 20 requests/minute per user

### Transport Security
- HTTPS enforced via HSTS header (`max-age=63072000`)
- X-Frame-Options: DENY prevents clickjacking
- X-Content-Type-Options: nosniff prevents MIME sniffing
- CSP headers restrict resource loading origins

### Secrets Management
- Never commit `.env` files
- Rotate API keys regularly
- Use secret management services (e.g., Doppler, Vault) in production

## Known Limitations (MVP)

- Demo mode uses `"demo-user"` ID — add real auth before production
- Social OAuth tokens not yet encrypted at rest
- API keys not yet implemented for external integrations

## Security Checklist Before Production

- [ ] Replace `x-user-id: demo-user` with real auth (NextAuth.js / Auth.js)
- [ ] Encrypt `SocialAccount.accessToken` with AES-256
- [ ] Enable Prisma query logging alerts for anomalies  
- [ ] Set up rate limiting in Redis Cluster mode
- [ ] Configure WAF (Cloudflare) in front of the app
- [ ] Enable audit logging to external SIEM
- [ ] Review and tighten CSP policy for production domain
- [ ] Run dependency audit: `pnpm audit`
