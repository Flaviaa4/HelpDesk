import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ChatComponent } from '../shared/chat/chat';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ChatComponent],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard {
  profileOpen: any;
  userName: any;
  menuOpen: boolean = false;
  searchTerm = '';
  selectedPriority = '';
  tickets: any[] = [];
  openCount = 0;
  inProgressCount = 0;
  resolvedCount = 0;
  totalCount = 0;

  constructor(private router: Router) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.userName = user.name || 'Admin';
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
