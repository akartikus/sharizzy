import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ShoppingItem, ShoppingList } from '../models/shopping-item.model';

@Injectable({
  providedIn: 'root',
})
export class ShoppingApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Récupère une liste complète (id + items)
   * GET /lists/:listId
   */
  getList(listId: string): Observable<ShoppingList> {
    return this.http.get<ShoppingList>(`${this.baseUrl}/lists/${listId}`);
  }

  /**
   * Ajoute un item
   * POST /lists/:listId/items
   */
  addItem(
    listId: string,
    label: string,
    addedBy: string
  ): Observable<ShoppingItem> {
    return this.http.post<ShoppingItem>(
      `${this.baseUrl}/lists/${listId}/items`,
      { label, addedBy }
    );
  }

  /**
   * Met à jour un item (label et/ou status)
   * PATCH /lists/:listId/items/:itemId
   */
  updateItem(
    listId: string,
    itemId: string,
    patch: Partial<Pick<ShoppingItem, 'label' | 'status'>>
  ): Observable<ShoppingItem> {
    return this.http.patch<ShoppingItem>(
      `${this.baseUrl}/lists/${listId}/items/${itemId}`,
      patch
    );
  }

  /**
   * Supprime un item
   * DELETE /lists/:listId/items/:itemId
   */
  deleteItem(listId: string, itemId: string): Observable<ShoppingItem> {
    return this.http.delete<ShoppingItem>(
      `${this.baseUrl}/lists/${listId}/items/${itemId}`
    );
  }
}
