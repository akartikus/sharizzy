import { Component } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
} from '@ionic/angular/standalone';
import { ShoppingListService } from '../services/shopping-list.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton],
})
export class HomePage {
  constructor(private slService: ShoppingListService) {
    this.slService.items$.subscribe((item) =>
      console.warn('Item added ', item)
    );
  }

  addRandom() {
    this.slService.addItem('my label', 'Sisi');
  }
}
