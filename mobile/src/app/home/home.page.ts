import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, CommonModule, NgFor, NgIf } from '@angular/common';
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
  IonToast,
} from '@ionic/angular/standalone';

import { Observable, Subscription } from 'rxjs';
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
    IonToast,
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
    CommonModule,
  ],
})
export class HomePage implements OnInit, OnDestroy {
  items$!: Observable<ShoppingItem[]>;

  newItemLabel = '';
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

    // écoute des erreurs du service
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
