import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ShoppingListService } from '../services/shopping-list.service';
import { ShoppingItem } from '../models/shopping-item.model';
import {
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonContent,
  IonItem,
  IonInput,
  IonList,
  IonItemSliding,
  IonCheckbox,
  IonLabel,
  IonItemOptions,
  IonItemOption,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    IonItemOption,
    IonItemOptions,
    IonLabel,
    IonCheckbox,
    IonItemSliding,
    IonList,
    IonInput,
    IonItem,
    IonContent,
    IonButton,
    IonToolbar,
    IonHeader,
    IonTitle,
    FormsModule,
  ],
})
export class HomePage implements OnInit {
  items: ShoppingItem[] = [];

  newItemLabel = '';
  pseudo = 'Moi';

  constructor(private shoppingListService: ShoppingListService) {}

  ngOnInit(): void {
    this.shoppingListService.items$.subscribe((items) => (this.items = items));
  }

  addItem(): void {
    const label = this.newItemLabel.trim();
    if (!label) {
      return;
    }

    this.shoppingListService.addItem(label, this.pseudo);
    this.newItemLabel = '';
  }

  toggleItem(item: ShoppingItem): void {
    this.shoppingListService.toggleStatus(item.id);
  }

  deleteItem(item: ShoppingItem): void {
    this.shoppingListService.deleteItem(item.id);
  }

  trackByItemId(index: number, item: ShoppingItem): string {
    return item.id;
  }
}
