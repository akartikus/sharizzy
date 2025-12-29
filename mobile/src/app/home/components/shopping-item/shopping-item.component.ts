import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgClass } from '@angular/common';
import {
  IonItemSliding,
  IonItem,
  IonCheckbox,
  IonLabel,
  IonItemOptions,
  IonItemOption,
  IonIcon
} from '@ionic/angular/standalone';
import { ShoppingItem } from '../../../models/shopping-item.model';

@Component({
  selector: 'app-shopping-item',
  standalone: true,
  imports: [
    NgClass,
    IonItemSliding,
    IonItem,
    IonCheckbox,
    IonLabel,
    IonItemOptions,
    IonItemOption,
    IonIcon
  ],
  templateUrl: './shopping-item.component.html',
  styleUrls: ['./shopping-item.component.scss']
})
export class ShoppingItemComponent {
  @Input() item!: ShoppingItem;
  @Output() toggle = new EventEmitter<ShoppingItem>();
  @Output() delete = new EventEmitter<ShoppingItem>();

  onToggle(): void {
    this.toggle.emit(this.item);
  }

  onDelete(): void {
    this.delete.emit(this.item);
  }
}
