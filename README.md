# GeneaSphere 🌳

[![Nuxt UI](https://img.shields.io/badge/Made%20with-Nuxt%20UI-00DC82?logo=nuxt&labelColor=020420)](https://ui.nuxt.com)
[![Nuxt](https://img.shields.io/badge/Nuxt-4.x-00DC82?logo=nuxt&labelColor=020420)](https://nuxt.com)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&labelColor=020420)](https://www.mongodb.com)

**GeneaSphere** est une application web de généalogie permettant de créer, visualiser et gérer des arbres généalogiques
interactifs. Elle repose sur [Nuxt 4](https://nuxt.com), [Nuxt UI](https://ui.nuxt.com)
et [MongoDB](https://www.mongodb.com) via Mongoose.

---

## Fonctionnalités

- 👤 **Gestion des personnes** — Créez des profils avec prénom, nom, sexe, dates et lieux de naissance/décès, photo et
  notes.
- 💑 **Nœuds matrimoniaux** — Reliez des personnes en couples (marié, divorcé, pacsé, union libre…) et associez-leur des
  enfants (biologiques, adoption, GPA).
- 🌳 **Arbre généalogique interactif** — Visualisez les relations sous forme d'arbre hiérarchique, avec fusion
  automatique des couples.
- 🔎 **Sélection dynamique** — Choisissez les personnes à afficher dans l'arbre via une modale dédiée.
- 🔐 **Authentification** — Inscription, connexion, gestion du profil, mot de passe et suppression de compte.
- 📨 **Messagerie interne** — Boîte de réception intégrée.
- 🔔 **Notifications** — Panneau latéral de notifications en temps réel.
- 🌗 **Thème clair / sombre** — Support natif via Nuxt UI.

---

## Stack technique

| Couche          | Technologie                                                  |
|-----------------|--------------------------------------------------------------|
| Framework       | [Nuxt 4](https://nuxt.com) + Vue 3                           |
| UI              | [Nuxt UI v4](https://ui.nuxt.com) + Tailwind CSS v4          |
| Base de données | MongoDB via [Mongoose](https://mongoosejs.com)               |
| Auth            | [nuxt-auth-utils](https://github.com/atinux/nuxt-auth-utils) |
| Visualisation   | [@unovis/vue](https://unovis.dev)                            |
| Utilitaires     | VueUse, date-fns, Zod                                        |
| Package manager | [pnpm](https://pnpm.io)                                      |

---

## Structure du projet

```
app/
├── pages/
│   ├── index.vue              # Page d'accueil avec arbre généalogique
│   ├── tree/tidy-tree.vue     # Vue dédiée à l'arbre
│   ├── persons/               # CRUD des personnes
│   ├── matrimonial-nodes/     # CRUD des nœuds matrimoniaux
│   ├── settings/              # Paramètres utilisateur
│   └── login.vue / register.vue
├── components/
│   ├── TreeNode.vue           # Composant de rendu d'un nœud d'arbre
│   └── ...
├── composables/
│   ├── useTreeBuilder.ts      # Construction de la forêt généalogique
│   └── useDashboard.ts
├── types/index.d.ts           # Types TypeScript (Person, MatrimonialNode, TreeGroup…)
server/
├── api/
│   ├── persons/               # API REST personnes
│   ├── matrimonial-nodes/     # API REST nœuds matrimoniaux
│   └── auth/                  # API d'authentification
└── models/                    # Modèles Mongoose
```

---

## Prérequis

- [Node.js](https://nodejs.org) ≥ 20
- [pnpm](https://pnpm.io) ≥ 10
- Une instance [MongoDB](https://www.mongodb.com) accessible

---

## Installation

```bash
pnpm install
```

Créez un fichier `.env` à la racine et configurez les variables nécessaires :

```env
MONGODB_URI=mongodb://localhost:27017/geneasphere
NUXT_SESSION_PASSWORD=your-secret-session-password
```

---

## Serveur de développement

```bash
pnpm dev
```

L'application sera disponible sur `http://localhost:3000`.

---

## Production

Compilez l'application :

```bash
pnpm build
```

Prévisualisez le build en local :

```bash
pnpm preview
```

Démarrez le serveur de production :

```bash
pnpm start
```

Consultez la [documentation de déploiement Nuxt](https://nuxt.com/docs/getting-started/deployment) pour plus
d'informations.

---

## Intégration Renovate

Installez l'[application GitHub Renovate](https://github.com/apps/renovate/installations/select_target) sur votre dépôt
pour maintenir les dépendances à jour automatiquement.

---

## Licence

[MIT](./LICENSE)
