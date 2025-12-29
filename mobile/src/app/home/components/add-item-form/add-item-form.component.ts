import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonList, IonItem, IonInput, IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-add-item-form',
  standalone: true,
  imports: [FormsModule, IonList, IonItem, IonInput, IonButton],
  templateUrl: './add-item-form.component.html',
  styles: [`
    .add-list {
      margin-bottom: 8px;
    }

    .add-list ion-item {
      --background: #ffffff;
    }
  `]
})
export class AddItemFormComponent {
  @Output() itemAdded = new EventEmitter<string>();

  newItemLabel = '';

  onAddItem(): void {
    const label = this.newItemLabel.trim();
    if (!label) return;

    this.itemAdded.emit(label);
    this.newItemLabel = '';
  }
}
