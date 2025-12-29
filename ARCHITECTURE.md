# Architecture

This file documents key architectural decisions and technical patterns.

**Note**: Claude Code will keep this file updated when significant architectural changes occur.

---

## Frontend

**State management**: RxJS `BehaviorSubject` (no Redux/NgRx)
- `ShoppingListService` acts as central store
- Exposes observables: `items$`, `error$`
- Components subscribe and react to changes

**Real-time sync**:
- HTTP request for mutations → optimistic local update
- WebSocket events → update state with duplicate check (by item id)
- Pattern prevents duplicates from HTTP response + WS event of same action

**Services structure**:
```
ShoppingListService       # State + orchestration + WebSocket
  ├─> ShoppingListApiService    # HTTP calls only
  └─> Socket.IO client          # Real-time events

UserSettingsService       # Local storage (Capacitor Preferences)
```

**Error handling**: Centralized via `error$` observable → displayed as Ionic toasts

---

## Backend

**Storage**: In-memory `Map<string, ShoppingList>` (V1 - no persistence)

**REST + WebSocket pattern**:
- All mutations (POST/PATCH/DELETE) go through REST endpoints
- After successful mutation → emit Socket.IO event to room `listId`
- Clients get real-time updates via WebSocket

**WebSocket rooms**: Each `listId` has its own Socket.IO room

**Events emitted**: `item:added`, `item:updated`, `item:deleted`

---

## Key Technical Decisions

- **RxJS BehaviorSubject**: Simple enough for single-list state, no need for complex store
- **In-memory backend**: V1 simplification, persistence not critical yet
- **REST for writes**: Clear pattern, easy to debug
- **WebSocket for broadcast**: Real-time requirement, Socket.IO works mobile + web
- **Client-side idempotence**: Prevents duplicates between HTTP response and WS event
- **No auth in V1**: Simplifies MVP, listId sharing is sufficient

---

## Future Evolution (V2+)

- Real persistence (DB)
- Authentication / user accounts
- Multiple lists per user
- Conflict resolution for concurrent edits
- Consider Angular Signals if state complexity grows
