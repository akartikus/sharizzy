import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ShoppingItem, ItemStatus } from '../models/shopping-item.model';
import { Preferences } from '@capacitor/preferences';

const STORAGE_KEY = 'shopping_list_items';

@Injectable({
  providedIn: 'root', // simple pour la V1
})
export class ShoppingListService {
  private readonly _items$ = new BehaviorSubject<ShoppingItem[]>([]);
  readonly items$ = this._items$.asObservable();

  private get items(): ShoppingItem[] {
    return this._items$.value;
  }

  constructor() {
    this.loadFromStorage();
  }

  async addItem(label: string, addedBy: string): Promise<void> {
    const newItem: ShoppingItem = {
      id: this.generateId(),
      label,
      addedBy,
      status: 'pending',
    };

    this._items$.next([...this.items, newItem]);
    await this.saveToStorage();
  }

  async updateStatus(id: string, status: ItemStatus): Promise<void> {
    const updated = this.items.map((item) =>
      item.id === id ? { ...item, status } : item
    );
    this._items$.next(updated);
    await this.saveToStorage();
  }

  async toggleStatus(id: string): Promise<void> {
    const updated = this.items.map((item) => {
      if (item.id !== id) return item;
      const nextStatus: ItemStatus =
        item.status === 'pending' ? 'bought' : 'pending';
      return { ...item, status: nextStatus };
    });
    this._items$.next(updated);
    await this.saveToStorage();
  }

  async deleteItem(id: string): Promise<void> {
    this._items$.next(this.items.filter((item) => item.id !== id));
    await this.saveToStorage();
  }

  async etItems(items: ShoppingItem[]): Promise<void> {
    // servira plus tard pour charger depuis storage ou backend
    this._items$.next(items);
    await this.saveToStorage();
  }

  clear(): void {
    this._items$.next([]);
  }

  private generateId(): string {
    // suffisant pour un POC
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: STORAGE_KEY });
      if (!value) {
        return;
      }

      const parsed: ShoppingItem[] = JSON.parse(value);
      // petite sécurité : s'assurer que c’est bien un tableau
      if (Array.isArray(parsed)) {
        this._items$.next(parsed);
      }
    } catch (err) {
      console.error(
        'Erreur lors du chargement de la liste depuis le storage',
        err
      );
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      await Preferences.set({
        key: STORAGE_KEY,
        value: JSON.stringify(this.items),
      });
    } catch (err) {
      console.error(
        'Erreur lors de la sauvegarde de la liste dans le storage',
        err
      );
    }
  }
}
