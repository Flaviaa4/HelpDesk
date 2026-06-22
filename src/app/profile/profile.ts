import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export class ProfileComponent {
  profileOpen = false;

  fullName = 'Admin User';
  role = 'Administrator';
  email = 'admin@helpdesk.com';

  constructor(private router: Router) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

  }

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
