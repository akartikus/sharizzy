const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(
  cors({
    origin: '*',
  })
);

/**
 * @typedef {Object} ShoppingItem
 * @property {string} id
 * @property {string} label
 * @property {string} addedBy
 * @property {'pending' | 'bought'} status
 */

/**
 * @typedef {Object} ShoppingList
 * @property {string} id
 * @property {ShoppingItem[]} items
 */

/** @type {Record<string, ShoppingList>} */
const lists = {};

/**
 * Crée une nouvelle liste vide pour un id donné.
 * @param {string} id
 * @returns {ShoppingList}
 */
function createEmptyList(id) {
  return {
    id,
    items: [],
  };
}

/**
 * Récupère une liste par son id, ou la crée si elle n'existe pas.
 * @param {string} listId
 * @returns {ShoppingList}
 */
function getOrCreateList(listId) {
  if (!lists[listId]) {
    lists[listId] = createEmptyList(listId);
  }
  return lists[listId];
}

/**
 * Crée un nouvel item prêt à être ajouté à une liste.
 * @param {string} label
 * @param {string} addedBy
 * @returns {ShoppingItem}
 */
function createItem(label, addedBy) {
  return {
    id: generateId(),
    label,
    addedBy,
    status: 'pending',
  };
}

/**
 * Génère un id simple pour les items.
 * @returns {string}
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// Initialiser une liste par défaut
getOrCreateList('default');

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*', // pour dev : autorise Ionic (http://localhost:8100) à se connecter
  },
});

io.on('connection', (socket) => {
  console.log('[WS] Client connected:', socket.id);

  // Le client nous dira à quelle liste il veut s'abonner
  socket.on('joinList', (listId) => {
    console.log(`[WS] Socket ${socket.id} join list: ${listId}`);
    socket.join(listId);
  });

  socket.on('disconnect', () => {
    console.log('[WS] Client disconnected:', socket.id);
  });
});

/**
 * Émet un événement de liste sur la room correspondant au listId.
 * @param {string} listId
 * @param {string} eventName
 * @param {any} payload
 */
function emitListEvent(listId, eventName, payload) {
  io.to(listId).emit(eventName, payload);
}

// Route de test existante
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// GET
app.get('/lists/:listId', (req, res) => {
  const listId = req.params.listId;
  const list = getOrCreateList(listId); // pour la V1 : crée si ça n'existe pas
  res.json(list);
});

//POST
app.post('/lists/:listId/items', (req, res) => {
  const listId = req.params.listId;
  const { label, addedBy } = req.body;

  if (!label || !label.trim()) {
    return res.status(400).json({ error: 'label is required' });
  }

  if (!addedBy || !addedBy.trim()) {
    return res.status(400).json({ error: 'addedBy (pseudo) is required' });
  }

  const list = getOrCreateList(listId);
  const item = createItem(label.trim(), addedBy.trim());

  list.items.push(item);

  console.log(
    `[API] [${listId}] Item ajouté par "${item.addedBy}": ${item.label}`
  );

  // 🔔 Notifier tous les clients de cette liste
  emitListEvent(listId, 'item:added', {
    listId,
    item,
  });

  res.status(201).json(item);
});

//PATCH
app.patch('/lists/:listId/items/:itemId', (req, res) => {
  const listId = req.params.listId;
  const itemId = req.params.itemId;
  const { label, status } = req.body;

  const list = lists[listId];
  if (!list) {
    return res.status(404).json({ error: 'list not found' });
  }

  const item = list.items.find((i) => i.id === itemId);
  if (!item) {
    return res.status(404).json({ error: 'item not found' });
  }

  if (typeof label === 'string' && label.trim()) {
    item.label = label.trim();
  }

  if (status === 'pending' || status === 'bought') {
    item.status = status;
  }

  console.log(`[API] [${listId}] Item mis à jour: ${item.id}`);

  // 🔔 Notifier les clients
  emitListEvent(listId, 'item:updated', {
    listId,
    item,
  });

  res.json(item);
});

// DELETE
app.delete('/lists/:listId/items/:itemId', (req, res) => {
  const listId = req.params.listId;
  const itemId = req.params.itemId;

  const list = lists[listId];
  if (!list) {
    return res.status(404).json({ error: 'list not found' });
  }

  const index = list.items.findIndex((i) => i.id === itemId);
  if (index === -1) {
    return res.status(404).json({ error: 'item not found' });
  }

  const [deleted] = list.items.splice(index, 1);

  console.log(`[API] [${listId}] Item supprimé: ${deleted.id}`);

  // 🔔 Notifier les clients
  emitListEvent(listId, 'item:deleted', {
    listId,
    itemId: deleted.id,
  });

  res.json(deleted);
});

server.listen(port, () => {
  console.log(`API + WebSocket listening on port ${port}`);
});
