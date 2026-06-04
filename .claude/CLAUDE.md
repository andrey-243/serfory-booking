# Serfory Booking — Instructions projet

## Mémoire & Contexte
- **Toujours écrire dans `ERRORS.md` et `.claude/CLAUDE.md` du projet** — jamais dans les fichiers mémoire personnels de Claude (`~/.claude/projects/...`)
- Avant toute approche similaire à une erreur passée : lire `ERRORS.md`
- Toute erreur nécessitant 2+ tentatives → logger dans `ERRORS.md`

## Repo GitHub
- Repo public : `andrey-243/serfory-booking`
- Ne jamais committer de données sensibles (.env, clés API, tokens)
- Ne jamais ajouter Claude comme collaborateur/coworker sur le repo

## Infrastructure
- `serfory-booking` → Git + Vercel (auto-deploy sur push `main`)
- `serfory.eu` → FTP direct OVH (pas de Git pour l'instant)
- Domaine : `booking.serfory.eu` → CNAME `cname.vercel-dns.com` (OVH DNS)
- Vercel env vars : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_BASE_URL`, `AUTH_SECRET`

## OVH FTP
- Host : `ftp.cluster121.hosting.ovh.net` / User : `serforo`
- Site actuel `serfory.eu` : React/Vite SPA dans `/www/`, assets dans `/www/assets/`
- Logo : `https://serfory.eu/assets/FindPath_-_2-DtYp4hYQ.png` (copié dans `/public/logo.png`)

## Traductions
- **Langues : EN / ET / RU uniquement. Jamais de FR.**
- Fichier : `lib/i18n.ts` — structure `translations[lang].booking | form | week | login`
- Toute nouvelle string UI → ajouter dans les 3 langues

## Teachers & Admins (Supabase)
### Admins (→ `/admin`)
| Email | Identité |
|-------|----------|
| serfory.learning@gmail.com | Compte Serfory principal |
| lerussedu24@gmail.com | Andrey |
| andrey.bondaryev@gmail.com | Andrey (autre) |

### Teachers (→ `/teacher`)
| Nom | Email | Matières | Enseigne en |
|-----|-------|----------|-------------|
| Elizabeth Kivonen | kseniakivonen@gmail.com | Estonian, English | Russian, Estonian, English |
| Arina Alekseeva | arinaalekseeva07@gmail.com | Math | Russian, Estonian |
| Dominika Fält | malosevad7@gmail.com | Estonian, Russian | Russian, Estonian |
| Mihhail Skvortsov | skvmihhail06@gmail.com | English, Spanish | Russian, English |
| Aisaltan Emil | aisaltan.emil@gmail.com | English, Russian | Russian, English |

> Diana (musique) : hors scope, pas dans le booking.
> Elizabeth = Ksenia (prénom légal). Login Google → rôle teacher (pas admin).
> Pour ajouter un teacher : INSERT dans `teachers` avec l'email Gmail exact.

## Patterns connus
- `getSupabaseAdmin()` : toujours factory function, jamais top-level (crash build Vercel)
- `googleapis` : toujours dynamic import dans les fonctions async, jamais top-level
- Session : Web Crypto API (`globalThis.crypto.subtle`), pas `jose` ni `crypto` Node (incompatible Edge Runtime)

## Dev local
```bash
npm run dev -- --port 3001
# Si crash OOM : rm -rf .next && npm run dev -- --port 3001
```
