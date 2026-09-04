import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { HeaderComponent } from '../shared/header/header';
import { SidebarComponent } from '../shared/sidebar/sidebar';
import { FirebaseService } from '../services/firebase';
import { LoadingSpinnerComponent } from '../shared/loading-spinner/loading-spinner';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, SidebarComponent, LoadingSpinnerComponent],
  templateUrl: './user-dashboard.html',
  styleUrl: './user-dashboard.css',
})
export class UserDashboard implements OnInit, OnDestroy {
  role = 'user';
  loading = true;
  userName = 'User';
  recentTickets: any[] = [];
  openCount = 0;
  inProgressCount = 0;
  resolvedCount = 0;
  loadError = '';

  private ticketsSub?: Subscription;

  constructor(
    private firebase: FirebaseService,
    private router: Router,
  ) {}

  ngOnInit() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.userName = user.role === this.role ? user.name : 'User';

    if (!user.uid) {
      this.loading = false;
      return;
    }

    this.ticketsSub = this.firebase.getTicketsByUserRealtime(user.uid).subscribe({
      next: (tickets) => {
        this.openCount = tickets.filter((t) => t.status === 'open').length;
        this.inProgressCount = tickets.filter((t) => t.status === 'in_progress').length;
        this.resolvedCount = tickets.filter((t) => t.status === 'resolved').length;

        this.recentTickets = [...tickets]
          .sort((a, b) => (b.ticketNumber || 0) - (a.ticketNumber || 0))
          .slice(0, 5)
          .map((t) => ({
            id: t.id,
            ticketNumber: t.ticketNumber || null,
            title: t.title || '',
            priority: t.priority || 'low',
            status: t.status || 'open',
            technicianName: t.technicianName || '',
          }));

        this.loading = false;
      },
      error: (err) => {
        console.error('Error streaming your tickets:', err);
        this.loadError = `Failed to load tickets: ${err?.code || err?.message || 'unknown error'}`;
        this.loading = false;
      },
    });
  }

  ngOnDestroy() {
    this.ticketsSub?.unsubscribe();
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
