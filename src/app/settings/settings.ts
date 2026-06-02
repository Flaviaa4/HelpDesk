import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './settings.html',
  styleUrls: ['./settings.css'],
})
export class SettingsComponent {
  profileOpen = false;

  userName = 'Admin User';

  constructor(private router: Router) {}

  toggleProfile() {
    this.profileOpen = !this.profileOpen;
  }

  @HostListener('document:click')
  closeDropdown() {
    this.profileOpen = false;
  }

  logout() {
    console.log('User logged out');
  }

  savePreferences() {
    console.log('Notification preferences saved');
  }

  changePassword() {
    console.log('Password changed');
  }

  saveSystemSettings() {
    console.log('System settings saved');
  }

  resetSettings() {
    console.log('Settings reset to default');
  }
}
