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
