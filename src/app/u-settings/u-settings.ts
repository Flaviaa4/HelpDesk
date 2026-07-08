import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-u-settings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './u-settings.html',
  styleUrls: ['./u-settings.css'],
})
export class USettings {
  profileOpen = false;

  userName = 'User';

  constructor(private router: Router) {}

  toggleProfile() {
    this.profileOpen = !this.profileOpen;
  }

  @HostListener('document:click')
  closeDropdown() {
    this.profileOpen = false;
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
    console.log('Settings reset');
  }
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
