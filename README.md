# TaskFlow

Gestionnaire de projets et tâches — React + Vite + Supabase, déployé sur Vercel.

## Stack

- **Frontend** : React 18 + Vite + Tailwind CSS
- **Backend** : Supabase (PostgreSQL + Auth + Realtime)
- **Drag & Drop** : @dnd-kit
- **Deploy** : Vercel

---

## 🚀 Mise en production — étape par étape

### Étape 1 — Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com) → **New project**
2. Choisis un nom (ex: `taskflow`), un mot de passe DB, une région (Europe West)
3. Attends ~2 min que le projet soit prêt

### Étape 2 — Créer la base de données

1. Dans ton projet Supabase → **SQL Editor** → **New query**
2. Copie-colle tout le contenu de `supabase-schema.sql`
3. Clique **Run** — tu verras "Success"

### Étape 3 — Récupérer les clés Supabase

1. Dans Supabase → **Settings** → **API**
2. Copie :
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

### Étape 4 — Tester en local (optionnel)

```bash
# Copier les variables d'env
cp .env.example .env.local
# Remplir avec tes vraies clés Supabase

# Installer les dépendances
npm install

# Lancer le serveur local
npm run dev
# → http://localhost:5173
```

### Étape 5 — Pusher sur GitHub

```bash
git init
git add .
git commit -m "init: TaskFlow"

# Sur github.com → New repository → taskflow
git remote add origin https://github.com/TON_USERNAME/taskflow.git
git push -u origin main
```

### Étape 6 — Déployer sur Vercel

1. Va sur [vercel.com](https://vercel.com) → **New Project**
2. **Import** ton repo GitHub `taskflow`
3. Dans **Environment Variables**, ajoute :
   ```
   VITE_SUPABASE_URL     = https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGci...
   ```
4. Clique **Deploy** → dans 60 secondes ton app est en ligne ✅

---

## Structure des fichiers

```
src/
├── components/
│   ├── Layout.jsx              # Sidebar + navigation
│   └── shared/
│       ├── TaskModal.jsx       # Modal création/édition tâche
│       ├── NewProjectModal.jsx # Modal nouveau projet
│       └── NotificationsPanel.jsx
├── hooks/
│   ├── useAuth.jsx             # Auth Supabase + contexte
│   ├── useProjects.js          # CRUD projets
│   ├── useTasks.js             # CRUD tâches + Realtime
│   └── useNotifications.js     # Notifs + Realtime
├── lib/
│   └── supabase.js             # Client Supabase
└── pages/
    ├── LoginPage.jsx           # Login + inscription
    ├── KanbanPage.jsx          # Vue Kanban + drag & drop
    ├── ListPage.jsx            # Vue liste + filtres
    ├── StatsPage.jsx           # Dashboard statistiques
    └── SettingsPage.jsx        # Équipe + invitations
```

## Fonctionnalités

- ✅ Auth email/password (login + inscription)
- ✅ Kanban avec drag & drop entre colonnes
- ✅ Vue liste avec filtres et recherche
- ✅ Dashboard statistiques par projet
- ✅ Multi-projets avec couleurs
- ✅ Invitations équipe par email
- ✅ Notifications temps réel (Supabase Realtime)
- ✅ Priorités et dates d'échéance
- ✅ RLS (Row Level Security) — chaque user ne voit que ses projets
