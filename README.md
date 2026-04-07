# HabitKit Personal

App statique pour GitHub Pages avec :

- interface web inspiree de HabitKit
- authentification Supabase
- habitudes synchronisees par utilisateur

## Setup Supabase

1. Cree un projet Supabase.
2. Dans `SQL Editor`, execute [`supabase/schema.sql`](./supabase/schema.sql).
3. Dans `Authentication > Providers`, laisse Email active.
4. Si tu veux creer les comptes a la main, ajoute les utilisateurs depuis le dashboard Supabase.
5. Recupere `Project URL` et `anon public key`.
6. Remplis [`scripts/supabase-config.js`](./scripts/supabase-config.js).

```js
export const SUPABASE_URL = "https://xxxx.supabase.co";
export const SUPABASE_ANON_KEY = "ta_cle_anon_publique";
```

## Deploy GitHub Pages

1. Push le repo sur GitHub.
2. Active GitHub Pages sur la branche voulue.
3. Ouvre l'URL du site.

## Important

- La cle `anon` peut etre exposee dans le front. C'est normal avec Supabase.
- N'expose jamais la `service_role` key dans ce projet.
- Les acces aux habitudes sont proteges par les policies RLS dans [`supabase/schema.sql`](./supabase/schema.sql).
