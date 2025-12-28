import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  ShoppingItem,
  ShoppingList,
  UpdateItemPayload,
} from '../models/shopping-item.model';

@Injectable({
  providedIn: 'root',
})
export class ShoppingApiService {
  private readonly baseUrl: string = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  /**
   * GET /lists/:listId
   * Récupère une liste complète (id + items).
   */
  getList(listId: string): Observable<ShoppingList> {
    return this.http.get<ShoppingList>(this.buildListUrl(listId));
  }

  /**
   * POST /lists/:listId/items
   * Ajoute un nouvel item dans une liste.
   */
  addItem(
    listId: string,
    label: string,
    addedBy: string
  ): Observable<ShoppingItem> {
    const body: Pick<ShoppingItem, 'label' | 'addedBy'> = {
      label,
      addedBy,
    };

    return this.http.post<ShoppingItem>(
      `${this.buildListUrl(listId)}/items`,
      body
    );
  }

  /**
   * PATCH /lists/:listId/items/:itemId
   * Met à jour un item (label et/ou status).
   */
  updateItem(
    listId: string,
    itemId: string,
    patch: UpdateItemPayload
  ): Observable<ShoppingItem> {
    return this.http.patch<ShoppingItem>(
      `${this.buildListUrl(listId)}/items/${itemId}`,
      patch
    );
  }

  /**
   * DELETE /lists/:listId/items/:itemId
   * Supprime un item.
   * Le backend renvoie l'item supprimé.
   */
  deleteItem(listId: string, itemId: string): Observable<ShoppingItem> {
    return this.http.delete<ShoppingItem>(
      `${this.buildListUrl(listId)}/items/${itemId}`
    );
  }

  // Helpers privés

  private buildListUrl(listId: string): string {
    return `${this.baseUrl}/lists/${listId}`;
  }
}
