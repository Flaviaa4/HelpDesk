import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard {
  profileOpen: any;
  userName: any;
  menuOpen: boolean = false;
  toggleProfile() {
    throw new Error('Method not implemented.');
  }
  searchTerm = '';
  selectedPriority = '';
  tickets: any[] = [];
  openCount = 0;
  inProgressCount = 0;
  resolvedCount = 0;
  totalCount = 0;

  constructor(private router: Router) {}

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
