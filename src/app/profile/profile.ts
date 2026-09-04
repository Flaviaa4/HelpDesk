import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FirebaseService } from '../services/firebase';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export class ProfileComponent implements OnInit {
  profileOpen = false;

  fullName = 'Admin';
  role = 'Administrator';
  email = '';
  department = '';
  lastLogin = '';

  constructor(
    private firebase: FirebaseService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    this.fullName = (stored.role || '').toLowerCase().trim() === 'admin' ? stored.name : 'Admin';
    this.email = stored.email || '';

    const authUser = this.firebase.getCurrentUser();
    if (authUser?.metadata?.lastSignInTime) {
      this.lastLogin = new Date(authUser.metadata.lastSignInTime).toLocaleString();
    }

    if (stored.uid) {
      try {
        const profile: any = await this.firebase.getUserByUid(stored.uid);
        if (profile) {
          this.fullName = profile.name || this.fullName;
          this.email = profile.email || this.email;
          this.role = profile.role ? this.capitalize(profile.role) : this.role;
          this.department = profile.department || '';
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      }
    }
  }

  private capitalize(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

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
