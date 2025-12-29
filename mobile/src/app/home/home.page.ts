import { Component, OnDestroy, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonToast,
} from '@ionic/angular/standalone';

import { Observable, Subscription } from 'rxjs';
import { Router } from '@angular/router';

import { ShoppingListService } from '../services/shopping-list.service';
import { ShoppingItem } from '../models/shopping-item.model';
import { UserSettingsService } from '../services/user-settings.service';
import { UserSettings } from '../models/user-settings.model';

import { UserInfoComponent } from './components/user-info/user-info.component';
import { AddItemFormComponent } from './components/add-item-form/add-item-form.component';
import { ShoppingItemComponent } from './components/shopping-item/shopping-item.component';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [
    // Angular
    AsyncPipe,

    // Ionic UI
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonItem,
    IonLabel,
    IonList,
    IonSpinner,
    IonToast,

    // Custom components
    UserInfoComponent,
    AddItemFormComponent,
    ShoppingItemComponent,
  ],
})
export class HomePage implements OnInit, OnDestroy {
  items$!: Observable<ShoppingItem[]>;

  pseudo = '';
  listId = '';

  isLoading = true;

  errorMessage: string | null = null;
  toastErrorOpen = false;

  private errorSub?: Subscription;

  constructor(
    private readonly shoppingListService: ShoppingListService,
    private readonly userSettingsService: UserSettingsService,
    private readonly router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    this.items$ = this.shoppingListService.items$;

    this.errorSub = this.shoppingListService.error$.subscribe((msg) => {
      this.errorMessage = msg;
      this.toastErrorOpen = !!msg;
    });

    const settings = await this.userSettingsService.getSettings();

    if (!settings) {
      this.isLoading = false;
      await this.router.navigateByUrl('/setup', { replaceUrl: true });
      return;
    }

    this.applySettings(settings);
  }

  ngOnDestroy(): void {
    this.errorSub?.unsubscribe();
  }

  private applySettings(settings: UserSettings): void {
    this.pseudo = settings.pseudo;
    this.listId = settings.listId || 'default';

    this.shoppingListService.setListId(this.listId);
    this.shoppingListService.init(this.listId);

    this.isLoading = false;
  }

  onItemAdded(label: string): void {
    this.shoppingListService.addItem(label, this.pseudo);
  }

  onItemToggle(item: ShoppingItem): void {
    this.shoppingListService.toggleStatus(item.id);
  }

  onItemDelete(item: ShoppingItem): void {
    this.shoppingListService.deleteItem(item.id);
  }
}
