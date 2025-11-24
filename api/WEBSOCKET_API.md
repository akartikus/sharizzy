# API WebSocket – Shared Shopping List

Cette API temps réel permet de suivre en direct les changements sur une liste de courses.

- Protocole : [Socket.IO](https://socket.io/)
- Transport : WebSocket (géré par Socket.IO)
- URL par défaut (dev) : `http://localhost:3000`

> Pour la V1, **toutes les écritures passent par l’API REST**  
> Le WebSocket sert uniquement à recevoir les mises à jour en temps réel.

---

## 1. Connexion

Exemple en JavaScript (client web / Ionic) :

```ts
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  transports: ['websocket'], // optionnel, mais recommandé sur mobile
});
```
