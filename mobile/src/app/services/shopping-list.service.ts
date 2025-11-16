import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ShoppingItem, ItemStatus } from '../models/shopping-item.model';

@Injectable({
  providedIn: 'root', // simple pour la V1
})
export class ShoppingListService {
  private readonly _items$ = new BehaviorSubject<ShoppingItem[]>([]);
  readonly items$ = this._items$.asObservable();

  private get items(): ShoppingItem[] {
    return this._items$.value;
  }

  constructor() {}

  addItem(label: string, addedBy: string): void {
    const newItem: ShoppingItem = {
      id: this.generateId(),
      label,
      addedBy,
      status: 'pending',
    };

    this._items$.next([...this.items, newItem]);
  }

  updateStatus(id: string, status: ItemStatus): void {
    const updated = this.items.map((item) =>
      item.id === id ? { ...item, status } : item
    );
    this._items$.next(updated);
  }

  toggleStatus(id: string): void {
    const updated = this.items.map((item) => {
      if (item.id !== id) return item;
      const nextStatus: ItemStatus =
        item.status === 'pending' ? 'bought' : 'pending';
      return { ...item, status: nextStatus };
    });
    this._items$.next(updated);
  }

  deleteItem(id: string): void {
    this._items$.next(this.items.filter((item) => item.id !== id));
  }

  setItems(items: ShoppingItem[]): void {
    // servira plus tard pour charger depuis storage ou backend
    this._items$.next(items);
  }

  clear(): void {
    this._items$.next([]);
  }

  private generateId(): string {
    // suffisant pour un POC
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
}
