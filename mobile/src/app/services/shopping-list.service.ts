import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ShoppingItem, ItemStatus } from '../models/shopping-item.model';
import { ShoppingApiService } from './shopping-list-api.service';

@Injectable({
  providedIn: 'root',
})
export class ShoppingListService {
  // Flux des items observables par les composants
  private readonly _items$ = new BehaviorSubject<ShoppingItem[]>([]);
  readonly items$ = this._items$.asObservable();

  // Liste courante (par défaut "default", mais mise à jour via D02)
  private listId = 'default';

  private get items(): ShoppingItem[] {
    return this._items$.value;
  }

  constructor(private api: ShoppingApiService) {}

  /**
   * Initialisation du service pour une liste donnée :
   * - mémorise le listId
   * - charge la liste complète depuis l'API
   */
  init(listId: string = 'default'): void {
    this.listId = listId;

    this.api.getList(this.listId).subscribe({
      next: (list) => {
        this._items$.next(list.items);
      },
      error: (err) => {
        console.error('Erreur chargement liste', err);
        // On laisse éventuellement l'état courant si besoin
      },
    });
  }

  /**
   * Met à jour l'id de la liste courante (utilisé avec les settings utilisateur).
   * Ne recharge pas automatiquement : appelle ensuite init(listId) si nécessaire.
   */
  setListId(listId: string): void {
    this.listId = listId || 'default';
  }

  /**
   * Ajout d'un item :
   * - appelle l'API
   * - ajoute l'item retourné à l'état local
   */
  addItem(label: string, addedBy: string): void {
    const trimmed = label.trim();
    if (!trimmed) {
      return;
    }

    this.api.addItem(this.listId, trimmed, addedBy).subscribe({
      next: (item) => {
        this._items$.next([...this.items, item]);
      },
      error: (err: any) => {
        console.error('Erreur ajout item', err);
      },
    });
  }

  /**
   * Toggle du statut (pending <-> bought) :
   * - calcule le prochain statut
   * - envoie un PATCH à l'API
   * - remplace l'item dans la liste locale avec la version retournée
   */
  toggleStatus(id: string): void {
    const current = this.items.find((i) => i.id === id);
    if (!current) {
      return;
    }

    const nextStatus: ItemStatus =
      current.status === 'pending' ? 'bought' : 'pending';

    this.api.updateItem(this.listId, id, { status: nextStatus }).subscribe({
      next: (updated: any) => {
        const newItems = this.items.map((item) =>
          item.id === updated.id ? updated : item
        );
        this._items$.next(newItems);
      },
      error: (err: any) => {
        console.error('Erreur maj status', err);
      },
    });
  }

  /**
   * (Optionnel mais prêt) Mise à jour du label d'un item.
   */
  updateLabel(id: string, label: string): void {
    const trimmed = label.trim();
    if (!trimmed) {
      return;
    }

    this.api.updateItem(this.listId, id, { label: trimmed }).subscribe({
      next: (updated) => {
        const newItems = this.items.map((item) =>
          item.id === updated.id ? updated : item
        );
        this._items$.next(newItems);
      },
      error: (err) => {
        console.error('Erreur maj label', err);
      },
    });
  }

  /**
   * Suppression d'un item :
   * - DELETE sur l'API
   * - retire l'item de l'état local si la requête réussit
   */
  deleteItem(id: string): void {
    this.api.deleteItem(this.listId, id).subscribe({
      next: () => {
        this._items$.next(this.items.filter((item) => item.id !== id));
      },
      error: (err: any) => {
        console.error('Erreur suppression item', err);
      },
    });
  }
}
