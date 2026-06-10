import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users {
  profileOpen: any;
  userName: any;
  searchTerm = '';
  menuOpen = false;
  users: any[] = [];

  constructor(private router: Router) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.userName = user.name || 'Admin';
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  toggleProfile() {
    this.profileOpen = !this.profileOpen;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
