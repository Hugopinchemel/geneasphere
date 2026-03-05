# GeneaSphere

[![Nuxt UI](https://img.shields.io/badge/Made%20with-Nuxt%20UI-00DC82?logo=nuxt&labelColor=020420)](https://ui.nuxt.com)
[![Nuxt](https://img.shields.io/badge/Nuxt-4.x-00DC82?logo=nuxt&labelColor=020420)](https://nuxt.com)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&labelColor=020420)](https://www.mongodb.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?labelColor=020420)](./LICENSE)

Application web de généalogie permettant de créer, visualiser et gérer des arbres généalogiques interactifs.
Construite avec [Nuxt 4](https://nuxt.com), [Nuxt UI](https://ui.nuxt.com) et [MongoDB](https://www.mongodb.com).

---

## Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Structure du projet](#structure-du-projet)
- [Prérequis](#prérequis)
- [Licence](#licence)

---

## Fonctionnalités

- **Gestion des personnes** — Profils complets : prénom, nom, sexe, dates et lieux de naissance/décès, photo, notes.
- **Noeuds matrimoniaux** — Relations de couple (marié, divorcé, pacsé, union libre) avec gestion des enfants (biologique, adoption, GPA).
- **Arbre généalogique interactif** — Visualisation hiérarchique avec fusion automatique des couples, scroll intégré et sélection dynamique des personnes à afficher.
- **Diagramme sunburst** — Vue radiale des ancêtres d'une personne, générée avec D3.
- **Affiliation directe** — À la création d'une personne, possibilité de l'affilier immédiatement à un noeud matrimonial existant ou nouveau.
- **Undo / Redo** — Historique des actions sur l'arbre, réversibles via les boutons dédiés ou les raccourcis clavier (`Ctrl+Z` / `Ctrl+Y`).
- **Accès concurrent** — Verrouillage optimiste des ressources en édition avec notification en temps réel si un autre utilisateur travaille sur le même élément.
- **Authentification** — Inscription, connexion, gestion du profil, modification du mot de passe et suppression de compte.
- **Messagerie interne** — Boîte de réception intégrée par équipe.
- **Notifications** — Panneau latéral de notifications.
- **Thème clair / sombre** — Support natif via Nuxt UI.

---

## Stack technique

| Couche           | Technologie                                                   |
|------------------|---------------------------------------------------------------|
| Framework        | [Nuxt 4](https://nuxt.com) + Vue 3                            |
| UI               | [Nuxt UI v3](https://ui.nuxt.com) + Tailwind CSS v4           |
| Base de données  | MongoDB via [Mongoose](https://mongoosejs.com)                |
| Authentification | [nuxt-auth-utils](https://github.com/atinux/nuxt-auth-utils)  |
| Visualisation    | [@unovis/vue](https://unovis.dev) + D3                        |
| Utilitaires      | VueUse, Zod, date-fns                                         |
| Package manager  | [pnpm](https://pnpm.io)                                       |

---

## Structure du projet

```
app/
├── pages/
│   ├── tree/tidy-tree.vue         # Arbre généalogique interactif
│   ├── persons/                   # CRUD des personnes
│   ├── matrimonial-nodes/         # CRUD des noeuds matrimoniaux
│   ├── settings/                  # Paramètres utilisateur
│   └── login.vue / register.vue
├── components/
│   ├── tree/                      # TreeNode, SunburstChart, SunburstModal
│   ├── dashboard/                 # Composants du tableau de bord
│   ├── teams/                     # Gestion des équipes
│   ├── notifications/             # Panneau de notifications
│   └── inbox/                     # Messagerie interne
├── composables/
│   ├── useTreeBuilder.ts          # Construction de la forêt généalogique (top-down)
│   ├── useAncestorBuilder.ts      # Construction de l'arbre ancestral (bottom-up)
│   ├── useHistory.ts              # Historique undo/redo
│   └── useLocks.ts                # Verrouillage optimiste pour l'accès concurrent
└── types/
    ├── genealogy.d.ts             # Person, MatrimonialNode, TreeGroup...
    ├── auth.d.ts                  # User, Team...
    └── ui.d.ts                    # Mail, Notification, Stat...

server/
├── api/
│   ├── persons/                   # REST — personnes
│   ├── matrimonial-nodes/         # REST — noeuds matrimoniaux
│   ├── locks/                     # REST — verrous d'édition
│   └── auth/                      # Authentification
└── models/                        # Modèles Mongoose
```

---

## Prérequis

- [Node.js](https://nodejs.org) >= 20
- [pnpm](https://pnpm.io) >= 10
- Une instance [MongoDB](https://www.mongodb.com) accessible

---

## Licence

Distribué sous licence [MIT](./LICENSE).

