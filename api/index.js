const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

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

// Route de test existante
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// (B03 : on ajoutera ici les routes /lists/:listId, etc.)

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
