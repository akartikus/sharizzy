# API – Shared Shopping List

Backend Node.js + Express + Socket.IO pour l’application de liste de courses partagée.
 • Stockage : en mémoire (pas de base de données pour la V1)
 • Exposition :
 • API REST pour toutes les écritures / lectures
 • API WebSocket (Socket.IO) pour la mise à jour temps réel


## Prérequis
- Node.js
- npm


## Installation

Depuis le dossier api/ :
```
npm install
```

## Lancer l’API

En développement :
```
npm run dev
```
ou :
```
node index.js
```
Par défaut, l’API écoute sur le port 3000 (modifiable via process.env.PORT).


## Structure
```
api/
  index.js          # Code principal (Express + Socket.IO)
  package.json
  README.md
```

## Health check

Permet de vérifier que l’API fonctionne :

```
GET /health
```

Réponse :
```
{
  "status": "ok"
}
```

## Modèle de données

ShoppingItem

``` ts
type ItemStatus = 'pending' | 'bought';

interface ShoppingItem {
  id: string;
  label: string;
  addedBy: string;      // pseudo de l'utilisateur qui a ajouté l'item
  status: ItemStatus;   // 'pending' ou 'bought'
}

ShoppingList

interface ShoppingList {
  id: string;              // identifiant de la liste (ex: "default")
  items: ShoppingItem[];
}
```

Le backend maintient un store en mémoire :

``` ts
Record<string, ShoppingList>
```

Une liste default est créée automatiquement au démarrage.

## API REST

1. Récupérer une liste

```
GET /lists/:listId
```
  
listId : identifiant de la liste (ex. default)

Comportement V1 :
Si la liste n’existe pas encore, elle est créée automatiquement (vide), puis renvoyée.

Réponse (200) :
``` json
{
  "id": "default",
  "items": [
    {
      "id": "abc123",
      "label": "Lait",
      "addedBy": "Alex",
      "status": "pending"
    }
  ]
}
```

2. Ajouter un item dans une liste

```
POST /lists/:listId/items
Content-Type: application/json
```
Body :
```json
{
  "label": "Lait",
  "addedBy": "Alex"
}
```
label (string, requis) : nom de l’item
addedBy (string, requis) : pseudo de l’utilisateur

Réponses possibles :

 • 201 Created + l’item créé
```json
{
  "id": "abc123",
  "label": "Lait",
  "addedBy": "Alex",
  "status": "pending"
}
```
 • 400 Bad Request si label ou addedBy manquent
```json
{
  "error": "label is required"
}
```
ou
```json
{
  "error": "addedBy (pseudo) is required"
}
```

En plus de l’écriture, cette route déclenche un événement WebSocket item:added (voir plus bas).

3. Mettre à jour un item

```
PATCH /lists/:listId/items/:itemId
Content-Type: application/json
```

Body (exemples) :
```json
{ "status": "bought" }
```
ou
```json
{ "label": "Lait demi-écrémé" }
```
ou les deux :
```json
{
  "label": "Lait demi-écrémé",
  "status": "bought"
}
```
Réponses possibles :
 • 200 OK + l’item mis à jour
```json
{
  "id": "abc123",
  "label": "Lait demi-écrémé",
  "addedBy": "Alex",
  "status": "bought"
}
```
 • 404 Not Found si la liste ou l’item n’existent pas :
```json
{ "error": "list not found" }
```
ou
```json
{ "error": "item not found" }
```
Cette route déclenche un événement WebSocket item:updated.

4. Supprimer un item

```
DELETE /lists/:listId/items/:itemId
```
Réponses possibles :
 • 200 OK + l’item supprimé
```json
{
  "id": "abc123",
  "label": "Lait",
  "addedBy": "Alex",
  "status": "pending"
}
```
 • 404 Not Found :
```
{ "error": "list not found" }
```
ou
```json
{ "error": "item not found" }
```
Cette route déclenche un événement WebSocket item:deleted.


## API WebSocket (Socket.IO)

Le backend utilise Socket.IO￼ pour notifier les clients en temps réel lors des modifications d’une liste.
 • URL de base (dev) : <http://localhost:3000>
 • Namespace : par défaut (/)

1. Connexion côté client

Exemple en TypeScript (client web / Ionic) :
```ts
import { io } from 'socket.io-client';

const socket = io('<http://localhost:3000>', {
  transports: ['websocket'], // recommandé sur mobile
});
```
Quand un client se connecte, le serveur log :
```
[WS] Client connected: <socket.id>
```

2. Rejoindre une liste (room)

Chaque liste a sa propre “room” Socket.IO, identifiée par listId.

Côté client, après la connexion :
```ts
const listId = 'default'; // ou n'importe quel id de liste
socket.emit('joinList', listId);

Côté serveur (dans index.js) :

io.on('connection', (socket) => {
  socket.on('joinList', (listId) => {
    socket.join(listId);
  });
});
```
Toutes les notifications temps réel concernant cette liste seront envoyées dans cette room.

3. Événements émis par le serveur

### item:added
Émis lorsqu’un nouvel item est créé via :
```
POST /lists/:listId/items
```
Payload :
```json
{
  "listId": "default",
  "item": {
    "id": "abc123",
    "label": "Lait",
    "addedBy": "Alex",
    "status": "pending"
  }
}
```
Exemple côté client :
```ts
socket.on('item:added', (data) => {
  // data.listId: string
  // data.item: ShoppingItem
  console.log('Item ajouté :', data.item);
});
```

### item:updated
Émis lors de la mise à jour d’un item via :
```
PATCH /lists/:listId/items/:itemId
```
Payload :
```json
{
  "listId": "default",
  "item": {
    "id": "abc123",
    "label": "Lait demi-écrémé",
    "addedBy": "Alex",
    "status": "bought"
  }
}
```
Exemple côté client :
```ts
socket.on('item:updated', (data) => {
  console.log('Item mis à jour :', data.item);
});
```

### item:deleted
Émis lors de la suppression d’un item via :
```
DELETE /lists/:listId/items/:itemId
```
Payload :
```json
{
  "listId": "default",
  "itemId": "abc123"
}
```
Exemple côté client :
```ts
socket.on('item:deleted', (data) => {
  console.log('Item supprimé, id =', data.itemId);
});
```

### Résumé d’utilisation côté client

 1. Récupérer l’état initial de la liste :
```
GET /lists/:listId
```
 2. Se connecter au WebSocket et rejoindre la liste :
```ts
const socket = io('<http://localhost:3000>', { transports: ['websocket'] });
socket.emit('joinList', listId);
```
3. Écouter les événements :
```ts
socket.on('item:added', (data) => { /*ajouter l'item au state */ });
socket.on('item:updated', (data) => { /* mettre à jour l'item dans le state */ });
socket.on('item:deleted', (data) => { /* retirer l'item du state*/ });
```
 4. Effectuer les modifications (création / mise à jour / suppression) via l’API REST.
Le WebSocket se charge de tenir tous les clients à jour automatiquement.
ß