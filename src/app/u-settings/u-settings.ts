import { ChangeDetectorRef, Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FirebaseService } from '../services/firebase';

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

  constructor(
    private firebase: FirebaseService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  toggleProfile() {
    this.profileOpen = !this.profileOpen;
    this.cdr.detectChanges();
  }

  @HostListener('document:click')
  closeDropdown() {
    if (!this.profileOpen) return;
    this.profileOpen = false;
    this.cdr.detectChanges();
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
