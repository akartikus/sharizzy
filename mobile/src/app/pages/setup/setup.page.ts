import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserSettingsService } from 'src/app/services/user-settings.service';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonNote,
  IonButton,
  IonText,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-setup',
  templateUrl: './setup.page.html',
  styleUrls: ['./setup.page.scss'],
  imports: [
    IonText,
    IonButton,
    IonNote,
    IonInput,
    IonLabel,
    IonItem,
    IonList,
    IonContent,
    IonTitle,
    IonHeader,
    IonToolbar,
    FormsModule,
  ],
})
export class SetupPage {
  pseudo = '';
  listId = 'default';

  isSaving = false;
  errorMessage = '';

  constructor(
    private userSettingsService: UserSettingsService,
    private router: Router
  ) {}

  async save(): Promise<void> {
    const pseudo = this.pseudo.trim();
    const listId = this.listId.trim() || 'default';

    if (!pseudo) {
      this.errorMessage = 'Le pseudo est obligatoire.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    try {
      await this.userSettingsService.saveSettings(pseudo, listId);
      // Après sauvegarde, on va sur la page principale
      await this.router.navigateByUrl('/', { replaceUrl: true });
    } catch (err) {
      console.error(err);
      this.errorMessage = 'Erreur lors de la sauvegarde, réessaie.';
    } finally {
      this.isSaving = false;
    }
  }
}
