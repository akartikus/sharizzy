import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { UserSettings } from '../models/user-settings.model';

const SETTINGS_KEY = 'user_settings';

@Injectable({
  providedIn: 'root',
})
export class UserSettingsService {
  async getSettings(): Promise<UserSettings | null> {
    const { value } = await Preferences.get({ key: SETTINGS_KEY });
    if (!value) {
      return null;
    }

    try {
      const parsed = JSON.parse(value) as UserSettings;
      if (!parsed.pseudo || !parsed.listId) {
        return null;
      }
      return parsed;
    } catch (e) {
      console.error('Erreur parsing settings', e);
      return null;
    }
  }

  async saveSettings(pseudo: string, listId: string): Promise<void> {
    const settings: UserSettings = {
      pseudo: pseudo.trim(),
      listId: listId.trim() || 'default',
    };

    await Preferences.set({
      key: SETTINGS_KEY,
      value: JSON.stringify(settings),
    });
  }

  async clearSettings(): Promise<void> {
    await Preferences.remove({ key: SETTINGS_KEY });
  }
}
