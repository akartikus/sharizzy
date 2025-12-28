# Shared Shopping List – Monorepo

Application de **liste de courses partagée** en temps réel :

- Frontend : **Ionic + Angular (standalone)** – app mobile / web
- Backend : **Node.js + Express + Socket.IO** – API REST + WebSocket
- Synchro temps réel entre plusieurs appareils grâce aux websockets

---

## 1. Vue d’ensemble

Cas d’usage :

- Dans un couple / une coloc, tout le monde partage **la même liste**.
- Chaque personne peut :
  - ajouter un article,
  - le marquer comme acheté,
  - le supprimer.
- Les autres voient les changements **en temps réel** (sans recharger la page).

V1 (actuelle) :

- Pas d’authentification.
- L’utilisateur choisit :
  - un **pseudo** (affiché dans la liste),
  - un **code de liste** (`listId`), ex : `default`, `coloc-2025`, etc.
- Tous les clients utilisant le même `listId` partagent la même liste.

---

## 2. Architecture du repo

```text
.
├─ api/              # Backend Node.js (Express + Socket.IO)
│  ├─ index.js
│  ├─ package.json
│  └─ README.md
└─ mobile/           # Front Ionic Angular (standalone)
   ├─ src/
   │  ├─ app/
   │  │  ├─ home/               # HomePage (liste de courses)
   │  │  ├─ pages/setup/        # SetupPage (pseudo + listId)
   │  │  ├─ models/
   │  │  │  ├─ shopping-item.model.ts
   │  │  │  └─ user-settings.model.ts
   │  │  └─ services/
   │  │     ├─ shopping-list.service.ts   # State + WebSocket
   │  │     ├─ shopping-api.service.ts    # HTTP vers l’API
   │  │     └─ user-settings.service.ts   # Pseudo + listId (local)
   │  └─ environments/
   │     ├─ environment.ts
   │     └─ environment.prod.ts
   ├─ package.json
   └─ ionic.config.json
```

---

## 3. Prérequis

- [Node.js](https://nodejs.org/) (18+ recommandé)
- npm
- (Optionnel) Device réel / émulateur pour tester côté mobile
- Même réseau Wi-Fi pour tester entre plusieurs appareils

---

## 4. Installation

### 4.1. Cloner le repo

```bash
git clone <url-du-repo>
cd <nom-du-repo>
```

### 4.2. Installer les dépendances backend

```bash
cd api
npm install
```

### 4.3. Installer les dépendances frontend

```bash
cd ../mobile
npm install
```

---

## 5. Lancer le backend (API + WebSocket)

Dans le dossier `api` :

```bash
cd api
npm run dev
# ou
node index.js
```

Par défaut, le serveur écoute sur :

```text
http://localhost:3000
```

Endpoints principaux :

- `GET /health` → status de l’API
- `GET /lists/:listId` → récupérer une liste
- `POST /lists/:listId/items` → ajouter un item
- `PATCH /lists/:listId/items/:itemId` → mettre à jour un item
- `DELETE /lists/:listId/items/:itemId` → supprimer un item

Temps réel (WebSocket / Socket.IO) :

- `joinList` pour rejoindre une room de liste
- `item:added`, `item:updated`, `item:deleted` diffusés sur la room `listId`

Les détails de l’API backend sont documentés dans [`api/README.md`](api/README.md).

---

## 6. Lancer le frontend (Ionic Angular)

Dans le dossier `mobile` :

```bash
cd mobile
ionic serve
```

Par défaut, l’app est disponible sur :

```text
http://localhost:8100
```

ou avec accès réseau (par exemple pour tester sur un téléphone du même Wi-Fi) :

```bash
ionic serve --external
```

> Le CLI affichera une URL du type `http://192.168.x.y:8100` dans la section “External”.

---

## 7. Configuration côté frontend

### 7.1. URL de l’API

`mobile/src/environments/environment.ts` :

```ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000',
};
```

Pour tester depuis un **téléphone sur le même réseau** :

```ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://192.168.x.y:3000', // IP locale de la machine qui héberge l'API
};
```

> Remplacer `192.168.x.y` par l’IP donnée par `ipconfig` / `ifconfig`.

### 7.2. Icônes Ionicons

Les icônes utilisées (ex : `trash-outline`) sont enregistrées dans `mobile/src/main.ts` via :

```ts
import { addIcons } from 'ionicons';
import { trashOutline } from 'ionicons/icons';

addIcons({
  'trash-outline': trashOutline,
});
```

---

## 8. Fonctionnalités frontend (V1)

### 8.1. Setup utilisateur (`/setup`)

Première ouverture :

1. L’app vérifie si des réglages utilisateur existent (pseudo + `listId`).
2. Si non → redirection vers `/setup`.

Page `Setup` :

- Champs :
  - **Pseudo** (obligatoire)
  - **Code de liste** (`listId`) – par défaut `default`
- Sauvegarde dans le stockage local (Capacitor Preferences).
- Redirection vers la Home après sauvegarde.

### 8.2. Home (liste de courses)

La Home :

- lit les settings (`pseudo`, `listId`),
- configure `ShoppingListService` avec `setListId(listId)`,
- charge la liste via `init(listId)` (HTTP `GET /lists/:listId`),
- ouvre ensuite la connexion WebSocket et rejoint la room de la liste.

UI :

- Affiche :
  - le nom de la liste (`listId`)
  - le pseudo courant
- Zone d’ajout :
  - input texte
  - bouton **Ajouter**
- Liste :
  - chaque item a :
    - une checkbox (acheté / non acheté)
    - un label (nom de l’article)
    - le pseudo de la personne qui l’a ajouté
    - un slide pour supprimer (`ion-item-sliding`)

---

## 9. Temps réel (frontend)

Le service `ShoppingListService` :

- Maintient la liste des items dans un `BehaviorSubject<ShoppingItem[]>`.
- Gère les appels HTTP via `ShoppingApiService`.
- Ouvre un `Socket` Socket.IO vers `environment.apiBaseUrl`.
- Rejoint la room de la liste via `joinList`.

À la réception des événements :

- `item:added` → ajoute l’item s’il n’existe pas déjà.
- `item:updated` → remplace l’item correspondant.
- `item:deleted` → retire l’item de la liste.

Idempotence :  
Pour éviter les doublons côté client (réponse HTTP + event WebSocket pour le même item), le service vérifie toujours si l’`id` existe déjà avant d’ajouter.

---

## 10. Gestion des erreurs (D04)

`ShoppingListService` expose un flux `error$` (texte ou `null`), qui est consommé par la Home.

Scénarios gérés :

- API indisponible / réseau coupé lors de :
  - chargement de la liste,
  - ajout / suppression / mise à jour d’un item.
- WebSocket déconnecté (temps réel non disponible).

Effets côté UI :

- Affichage d’un **toast Ionic** en bas de l’écran avec un message explicite.
- Les erreurs sont également loggées en console pour debug.

---

## 11. Scénarios de test recommandés

1. **CRUD basique**
   - Lancer l’API et l’app.
   - Ajouter des articles, les cocher, les supprimer.
   - Vérifier dans `GET /lists/:listId` que l’état est cohérent.

2. **Multi-utilisateurs / temps réel**
   - Ouvrir l’app dans deux navigateurs différents.
   - Utiliser le même `listId`, pseudos différents.
   - Ajouter / cocher / supprimer d’un côté → vérifier la mise à jour instantanée de l’autre côté.

3. **Perte de connexion API**
   - Arrêter l’API pendant que l’app est ouverte.
   - Tenter d’ajouter un item → voir le toast d’erreur.
   - Redémarrer l’API → recharger la page ou relancer l’app.

---

## 12. Pistes V2 / Backlog futur

Idées pour les prochaines versions :

- Authentification / comptes utilisateurs.
- Gestion de plusieurs listes par utilisateur.
- Partage de liste par lien / QR code.
- Rôles / droits par liste (lecture seule, édition).
- Catégories d’articles, filtres (achetés / à acheter).
- Historique des achats.
- Persistance réelle côté serveur (base de données).

---

## 13. Scripts utiles

Backend (`api/`) :

```bash
npm run dev   # lancer l'API en mode dev (nodemon si configuré)
node index.js # lancer l'API "à la main"
```

Frontend (`mobile/`) :

```bash
ionic serve              # dev local (http://localhost:8100)
ionic serve --external   # dev accessible depuis d'autres appareils
```

---

## 14. Notes diverses

- Le backend est **in-memory** pour la V1 : redémarrer l’API réinitialise les listes.
- Le temps réel repose sur **Socket.IO** (client et serveur doivent être alignés).
- En prod, prévoir :
  - une URL API différente dans `environment.prod.ts`,
  - un reverse proxy (Nginx, etc.) pour servir API + app,
  - une vraie base de données pour persister les listes.
