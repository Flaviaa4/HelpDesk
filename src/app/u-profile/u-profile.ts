import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-u-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './u-profile.html',
  styleUrls: ['./u-profile.css'],
})
export class UProfile {
  profileOpen = false;

  fullName = 'User';
  role = 'Analyst';
  email = 'user@helpdesk.com';

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
