import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { HeaderComponent } from '../shared/header/header';
import { SidebarComponent } from '../shared/sidebar/sidebar';
import { FirebaseService } from '../services/firebase';
import { LoadingSpinnerComponent } from '../shared/loading-spinner/loading-spinner';

@Component({
  selector: 'app-technician-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, SidebarComponent, LoadingSpinnerComponent],
  templateUrl: './technician-dashboard.html',
  styleUrl: './technician-dashboard.css',
})
export class TechnicianDashboard implements OnInit, OnDestroy {
  role = 'technician';
  loading = true;
  userName = 'Technician';
  recentTickets: any[] = [];
  assignedCount = 0;
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
    this.userName = user.role === this.role ? user.name : 'Technician';

    if (!user.uid) {
      this.loading = false;
      return;
    }

    this.ticketsSub = this.firebase.getTicketsByTechnicianRealtime(user.uid).subscribe({
      next: (tickets) => {
        this.assignedCount = tickets.filter((t) => t.status === 'open').length;
        this.inProgressCount = tickets.filter((t) => t.status === 'in_progress').length;
        this.resolvedCount = tickets.filter((t) => t.status === 'resolved').length;

        this.recentTickets = [...tickets]
          .sort((a, b) => (b.ticketNumber || 0) - (a.ticketNumber || 0))
          .slice(0, 5)
          .map((t) => ({
            id: t.id,
            ticketNumber: t.ticketNumber || null,
            title: t.title || '',
            user: t.userName || 'Unknown',
            priority: t.priority || 'low',
            status: t.status || 'open',
          }));

        this.loading = false;
      },
      error: (err) => {
        console.error('Error streaming assigned tickets:', err);
        this.loadError = `Failed to load tickets: ${err?.code || err?.message || 'unknown error'}`;
        this.loading = false;
      },
    });
  }

  ngOnDestroy() {
    this.ticketsSub?.unsubscribe();
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
