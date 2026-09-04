import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HeaderComponent } from '../shared/header/header';
import { SidebarComponent } from '../shared/sidebar/sidebar';
import { FirebaseService } from '../services/firebase';

@Component({
  selector: 'app-technician-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent, SidebarComponent],
  templateUrl: './technician-settings.html',
  styleUrl: './technician-settings.css',
})
export class TechnicianSettings {
  role = 'technician';
  userName = 'Technician';

  emailNotifications = false;
  newTicketAlerts = true;
  ticketStatusUpdates = true;
  systemAlerts = true;

  language = 'English';
  timezone = 'Africa/Kigali';
  dateFormat = 'DD-MM-YYYY';

  constructor(
    private firebase: FirebaseService,
    private router: Router,
  ) {}

  savePreferences() {
    console.log('Notification preferences saved');
  }

  saveSystemSettings() {
    console.log('System settings saved');
  }

  resetSettings() {
    this.language = 'English';
    this.timezone = 'Africa/Kigali';
    this.dateFormat = 'DD-MM-YYYY';
  }

  async logout() {
    try {
      await this.firebase.logout();
    } catch (err) {
      console.error('Error signing out:', err);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
