import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  ShoppingItem,
  ItemStatus,
  UpdateItemPayload,
} from '../models/shopping-item.model';
import { ShoppingListApiService } from './shopping-list-api.service';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

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

  // Flux d'erreurs lisibles côté UI
  private readonly _error$ = new BehaviorSubject<string | null>(null);
  readonly error$ = this._error$.asObservable();

  private listId = 'default';

  private socket?: Socket;

  private get items(): ShoppingItem[] {
    return this._items$.value;
  }

  constructor(private api: ShoppingListApiService) {}

  ngOnDestroy(): void {
    this.disconnectSocket();
  }

  init(listId: string = 'default'): void {
    this.listId = listId;
    this.clearError();

    this.api.getList(this.listId).subscribe({
      next: (list) => {
        this._items$.next(list.items);
        this.connectSocket();
      },
      error: (err) => {
        console.error('Erreur chargement liste', err);
        this.setError(
          'Impossible de charger la liste. Vérifie ta connexion ou réessaie plus tard.'
        );
      },
    });
  }

  setListId(listId: string): void {
    if (this.listId === listId) return;
    this.listId = listId || 'default';
  }

  addItem(label: string, addedBy: string): void {
    const trimmed = label.trim();
    if (!trimmed) return;

    this.clearError();

    this.api.addItem(this.listId, trimmed, addedBy).subscribe({
      next: (item) => {
        const exists = this.items.some((i) => i.id === item.id);
        if (!exists) {
          this._items$.next([...this.items, item]);
        }
      },
      error: (err) => {
        console.error('Erreur ajout item', err);
        this.setError("Impossible d'ajouter l'article. Vérifie ta connexion.");
      },
    });
  }

  toggleStatus(id: string): void {
    const current = this.items.find((i) => i.id === id);
    if (!current) return;

    const nextStatus: ItemStatus =
      current.status === 'pending' ? 'bought' : 'pending';

    this.updateItem(
      id,
      { status: nextStatus },
      "Impossible de mettre à jour l'article."
    );
  }

  updateLabel(id: string, label: string): void {
    const trimmed = label.trim();
    if (!trimmed) return;

    this.updateItem(
      id,
      { label: trimmed },
      "Impossible de renommer l'article."
    );
  }

  deleteItem(id: string): void {
    this.clearError();

    this.api.deleteItem(this.listId, id).subscribe({
      next: () => {
        this._items$.next(this.items.filter((item) => item.id !== id));
      },
      error: (err) => {
        console.error('Erreur suppression item', err);
        this.setError("Impossible de supprimer l'article pour le moment.");
      },
    });
  }

  // ---------- REST PATCH commun ----------

  private updateItem(
    id: string,
    patch: UpdateItemPayload,
    errorMsg: string
  ): void {
    this.clearError();

    this.api.updateItem(this.listId, id, patch).subscribe({
      next: (updated) => {
        const newItems = this.items.map((item) =>
          item.id === updated.id ? updated : item
        );
        this._items$.next(newItems);
      },
      error: (err) => {
        console.error('Erreur maj item', err);
        this.setError(errorMsg);
      },
    });
  }

  // ---------- WebSocket ----------

  private connectSocket(): void {
    if (this.socket && this.socket.connected) {
      return;
    }

    this.disconnectSocket();

    this.socket = io(environment.apiBaseUrl, {
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('[WS] connected', this.socket?.id);
      this.clearError();
      this.socket?.emit('joinList', this.listId);
    });

    this.socket.on('disconnect', () => {
      console.log('[WS] disconnected');
      // on n'empêche pas l'app de fonctionner,
      // mais on avertit que le temps réel est coupé
      this.setError(
        'Connecté au serveur, mais la synchro temps réel est coupée (WebSocket déconnecté).'
      );
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

  // ---------- Gestion d'erreurs ----------

  private setError(message: string): void {
    this._error$.next(message);
  }

  private clearError(): void {
    this._error$.next(null);
  }
}
