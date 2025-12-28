import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  ShoppingItem,
  ItemStatus,
  UpdateItemPayload,
} from '../models/shopping-item.model';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { ShoppingListApiService } from './shopping-list-api.service';

interface ItemAddedPayload {
  listId: string;
  item: ShoppingItem;
}

interface ItemUpdatedPayload {
  listId: string;
  item: ShoppingItem;
}

interface ItemDeletedPayload {
  listId: string;
  itemId: string;
}

@Injectable({
  providedIn: 'root',
})
export class ShoppingListService implements OnDestroy {
  private readonly _items$ = new BehaviorSubject<ShoppingItem[]>([]);
  readonly items$ = this._items$.asObservable();

  private listId = 'default';

  private socket?: Socket;

  private get items(): ShoppingItem[] {
    return this._items$.value;
  }

  constructor(private api: ShoppingListApiService) {}

  ngOnDestroy(): void {
    this.disconnectSocket();
  }

  /**
   * Init: fixe la liste courante, charge l'état initial depuis l'API,
   * puis connecte le WebSocket et rejoint la room de cette liste.
   */
  init(listId: string = 'default'): void {
    this.listId = listId;

    this.api.getList(this.listId).subscribe({
      next: (list) => {
        this._items$.next(list.items);
        // après avoir l'état initial, on connecte la socket
        this.connectSocket();
      },
      error: (err) => {
        console.error('Erreur chargement liste', err);
      },
    });
  }

  setListId(listId: string): void {
    if (this.listId === listId) {
      return;
    }
    this.listId = listId || 'default';
    // on pourrait re-init ici si tu changes de liste à chaud
  }

  addItem(label: string, addedBy: string): void {
    const trimmed = label.trim();
    if (!trimmed) return;

    this.api.addItem(this.listId, trimmed, addedBy).subscribe({
      next: (item) => {
        const exists = this.items.some((i) => i.id === item.id);
        if (!exists) {
          this._items$.next([...this.items, item]);
        }
      },
      error: (err) => {
        console.error('Erreur ajout item', err);
      },
    });
  }

  toggleStatus(id: string): void {
    const current = this.items.find((i) => i.id === id);
    if (!current) return;

    const nextStatus: ItemStatus =
      current.status === 'pending' ? 'bought' : 'pending';

    this.updateItem(id, { status: nextStatus });
  }

  updateLabel(id: string, label: string): void {
    const trimmed = label.trim();
    if (!trimmed) return;

    this.updateItem(id, { label: trimmed });
  }

  deleteItem(id: string): void {
    this.api.deleteItem(this.listId, id).subscribe({
      next: () => {
        this._items$.next(this.items.filter((item) => item.id !== id));
        // Les autres clients recevront item:deleted par WebSocket
      },
      error: (err) => {
        console.error('Erreur suppression item', err);
      },
    });
  }

  // ---------- Privé : REST patch + mise à jour locale ----------

  private updateItem(id: string, patch: UpdateItemPayload): void {
    this.api.updateItem(this.listId, id, patch).subscribe({
      next: (updated) => {
        const newItems = this.items.map((item) =>
          item.id === updated.id ? updated : item
        );
        this._items$.next(newItems);
      },
      error: (err) => {
        console.error('Erreur maj item', err);
      },
    });
  }

  // ---------- Privé : WebSocket ----------

  private connectSocket(): void {
    // éviter de créer plusieurs sockets
    if (this.socket && this.socket.connected) {
      return;
    }

    this.disconnectSocket(); // au cas où

    this.socket = io(environment.apiBaseUrl, {
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('[WS] connected', this.socket?.id);
      this.socket?.emit('joinList', this.listId);
    });

    this.socket.on('disconnect', () => {
      console.log('[WS] disconnected');
    });

    this.socket.on('item:added', (payload: ItemAddedPayload) => {
      if (payload.listId !== this.listId) return;

      const exists = this.items.some((i) => i.id === payload.item.id);
      if (!exists) {
        this._items$.next([...this.items, payload.item]);
      }
    });

    this.socket.on('item:updated', (payload: ItemUpdatedPayload) => {
      if (payload.listId !== this.listId) return;

      const updated = this.items.map((item) =>
        item.id === payload.item.id ? payload.item : item
      );
      this._items$.next(updated);
    });

    this.socket.on('item:deleted', (payload: ItemDeletedPayload) => {
      if (payload.listId !== this.listId) return;

      this._items$.next(
        this.items.filter((item) => item.id !== payload.itemId)
      );
    });
  }

  private disconnectSocket(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = undefined;
    }
  }
}
