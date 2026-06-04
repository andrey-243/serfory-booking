# Serfory Booking — Contexte Projet

## C'est quoi

Plateforme de booking de cours pour l'école Serfory (serfory.eu).
Déployée sur `booking.serfory.eu` (sous-domaine séparé du site principal).

Le site principal (serfory.eu) tourne sur OVH mutualisé (PHP/static only, pas de Node).
Ce projet est une app Next.js séparée déployée sur Vercel, liée par un CNAME OVH.

## Dev

```bash
npm run dev    # http://localhost:3000 → redirect /booking
npm run build
npm run lint
```

## Stack technique

- **Framework** : Next.js 16 (App Router, TypeScript, Tailwind v4)
- **DB** : Supabase (PostgreSQL)
- **Google Calendar** : googleapis, OAuth2 par prof (comptes Google classiques, pas Workspace)
- **Hosting** : Vercel (frontend + API routes serverless)
- **Domaine** : OVH → CNAME `booking.serfory.eu` → Vercel

## 3 rôles utilisateurs

### Étudiant (public, pas de login)
- Arrive depuis serfory.eu via CTA "Prendre son cours"
- Page de booking avec :
  - Tabs filtres en haut : Russian / English / Estonian / Spanish / Math / Music
  - 80% droite : vue semaine (week view) des créneaux dispo par prof
  - Si plusieurs profs pour le même cours → colonnes côte à côte dans le week view
  - 20% gauche : profile cards des profs dispos pour le cours sélectionné
  - Click sur un prof → filtre la week view sur ce prof
  - Click sur un créneau → sélectionne le créneau + révèle le BookingForm à gauche
  - Form fields : Nom, Téléphone, Email, Contact favori (WhatsApp/Telegram)
  - Toggle "mineur" → révèle champs parent (nom + contact)

### Prof (dashboard /teacher)
- Vue de ses cours à venir (liste simple)
- Onboarding OAuth Google Calendar (une seule fois) pour connecter son agenda
- Le refresh_token Google est stocké en Supabase

### Admin (dashboard /admin)
- Vue de TOUS les bookings (tous profs confondus)
- Filtre par statut (pending / confirmed / cancelled)
- Accès aux infos de contact des étudiants et parents

## Schéma DB (à créer dans Supabase Dashboard > SQL Editor)

```sql
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  subjects TEXT[] NOT NULL,
  photo_url TEXT,
  google_refresh_token TEXT,
  google_calendar_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teachers(id),
  subject TEXT NOT NULL,
  slot_start TIMESTAMPTZ NOT NULL,
  slot_end TIMESTAMPTZ NOT NULL,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  student_phone TEXT NOT NULL,
  contact_pref TEXT CHECK (contact_pref IN ('whatsapp', 'telegram')),
  is_minor BOOLEAN DEFAULT FALSE,
  parent_name TEXT,
  parent_contact TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  google_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Variables d'environnement (.env.local à créer)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_BASE_URL=https://booking.serfory.eu
```

## Structure des fichiers

```
app/
  page.tsx                          → redirect /booking
  booking/page.tsx                  → page principale étudiant
  teacher/page.tsx                  → dashboard prof
  admin/page.tsx                    → dashboard admin
  api/
    teachers/route.ts               → GET liste profs (filtre ?subject=)
    slots/route.ts                  → GET créneaux dispo via Google Calendar
    bookings/route.ts               → POST créer booking / GET liste
    auth/google/route.ts            → initier OAuth Google
    auth/google/callback/route.ts   → callback OAuth, stocke refresh_token

components/booking/
  CourseTabFilter.tsx               → tabs pill-shaped (Russian/English/…)
  WeekView.tsx                      → grille semaine CSS Grid, colonnes par prof
  TeacherCard.tsx                   → profile card prof avec avatar
  BookingForm.tsx                   → form complet + toggle mineur

lib/
  supabase.ts                       → supabaseAdmin + createSupabaseServerClient + types
  google-calendar.ts                → getAuthUrl, exchangeCodeForTokens, getAvailableSlots, createCalendarEvent
```

## Design system (caler sur serfory.eu)

- Background : `#EEF2FF`
- Cards : blanc, `border-radius: 12px`, ombre légère
- Accent : `#3B82F6`
- Font : Inter
- Tabs : pill-shaped, actif = bleu filled, inactif = outline gris

## Profs actuels

| Nom | Matières | Langues cours |
|-----|----------|---------------|
| Elizabeth Kivonen | Language (Estonian, English) | RU / ET / EN |
| Arina Alekseeva | Mathematics (grades 2–12) | RU / ET |
| Dominika Fält | Language (Estonian, Russian A1-B2) | RU / ET |
| Mihhail Skvortsov | Language (English, Spanish) | RU / EN |
| Aisaltan Emil | Language (English, Russian, Kyrgyz) | RU / EN / KY |
| Diana | Music (Piano, Singing, Music Theory) | RU / ET |

## État du projet (2026-06-04)

- [x] Next.js 16 scaffoldé, dépendances installées
- [x] Structure complète de fichiers créée
- [x] Tous les composants booking (CourseTabFilter, WeekView, TeacherCard, BookingForm)
- [x] Toutes les API routes (teachers, slots, bookings, auth Google OAuth)
- [x] Lib Supabase + Google Calendar helpers
- [x] Pages booking / teacher / admin
- [x] `.env.local` rempli (Supabase + Google OAuth)
- [x] Schéma SQL appliqué en DB (tables teachers + bookings)
- [ ] API routes — vérifier / compléter le code réel (teachers, slots, bookings, auth)
- [ ] Lib google-calendar.ts — implémenter getAvailableSlots + createCalendarEvent
- [ ] Insérer les profs en DB
- [ ] Tester le flow complet en local
- [ ] Deploy Vercel + CNAME OVH

## Prochaine étape

Backend : vérifier/compléter les API routes et les helpers Google Calendar,
insérer les profs en DB, puis tester le flow end-to-end en local.
