import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonList,
  IonInput,
  IonButton,
  IonIcon,
  IonCheckbox,
  IonSpinner,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
} from '@ionic/angular/standalone';

import { Observable } from 'rxjs';
import { Router } from '@angular/router';

import { ShoppingListService } from '../services/shopping-list.service';
import { ShoppingItem } from '../models/shopping-item.model';
import { UserSettingsService } from '../services/user-settings.service';
import { UserSettings } from '../models/user-settings.model';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [
    // Angular
    NgIf,
    NgFor,
    AsyncPipe,
    FormsModule,

    // Ionic UI
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonItem,
    IonLabel,
    IonList,
    IonInput,
    IonButton,
    IonIcon,
    IonCheckbox,
    IonSpinner,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
  ],
})
export class HomePage implements OnInit {
  items$!: Observable<ShoppingItem[]>;

  newItemLabel = '';
  pseudo = '';
  listId = '';

  isLoading = true;

  constructor(
    private readonly shoppingListService: ShoppingListService,
    private readonly userSettingsService: UserSettingsService,
    private readonly router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    this.items$ = this.shoppingListService.items$;

    const settings = await this.userSettingsService.getSettings();

    if (!settings) {
      this.isLoading = false;
      await this.router.navigateByUrl('/setup', { replaceUrl: true });
      return;
    }

    this.applySettings(settings);
  }

  private applySettings(settings: UserSettings): void {
    this.pseudo = settings.pseudo;
    this.listId = settings.listId || 'default';

    this.shoppingListService.setListId(this.listId);
    this.shoppingListService.init(this.listId);

    this.isLoading = false;
  }

  addItem(): void {
    const label = this.newItemLabel.trim();
    if (!label) return;

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
