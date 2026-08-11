import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FirebaseService } from '../services/firebase';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-u-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './u-profile.html',
  styleUrls: ['./u-profile.css'],
})
export class UProfile implements OnInit {
  profileOpen = false;

  fullName = 'User';
  role = 'User';
  email = '';
  department = '';
  lastLogin = '';

  constructor(
    private firebase: FirebaseService,
    private router: Router,
  ) {}

  async ngOnInit() {
    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    this.fullName = (stored.role || '').toLowerCase().trim() === 'user' ? stored.name : 'User';
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

  constructor(private router: Router) {}

  toggleProfile() {
    this.profileOpen = !this.profileOpen;
  }

  @HostListener('document:click')
  closeDropdown() {
    this.profileOpen = false;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
