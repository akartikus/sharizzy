// src/app/models/shopping-item.model.ts

export type ItemStatus = 'pending' | 'bought';

export interface ShoppingItem {
  id: string;
  label: string;
  addedBy: string;
  status: ItemStatus;
}

export interface ShoppingList {
  id: string;
  items: ShoppingItem[];
}

// Payload autorisé pour un PATCH (update)
export type UpdateItemPayload = Partial<Pick<ShoppingItem, 'label' | 'status'>>;
