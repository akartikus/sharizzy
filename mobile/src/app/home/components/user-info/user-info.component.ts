import { Component, Input } from '@angular/core';
import { IonItem, IonLabel } from '@ionic/angular/standalone';

@Component({
  selector: 'app-user-info',
  standalone: true,
  imports: [IonItem, IonLabel],
  templateUrl: './user-info.component.html',
  styles: [`
    .info-item {
      --background: transparent;
      --ion-item-border-color: transparent;
      margin: 0 16px 8px;
    }

    .title {
      margin: 0 0 4px;
      font-size: 1.2rem;
      font-weight: 600;
      color: #111827;
    }

    .subtitle {
      margin: 0;
      font-size: 0.9rem;
      color: #6b7280;
    }
  `]
})
export class UserInfoComponent {
  @Input() pseudo = '';
  @Input() listId = '';
}
