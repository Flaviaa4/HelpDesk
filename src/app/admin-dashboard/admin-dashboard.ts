import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FirebaseService } from '../services/firebase';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit, OnDestroy {
  profileOpen = false;
  userName = 'Admin';
  menuOpen: boolean = false;
  searchTerm = '';
  selectedPriority = '';
  tickets: any[] = [];
  loading = true;
  loadError = '';
  openCount = 0;
  inProgressCount = 0;
  resolvedCount = 0;
  totalCount = 0;

  private ticketsSub?: Subscription;

  constructor(
    private firebase: FirebaseService,
    private router: Router,
  ) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.userName = (user.role || '').toLowerCase().trim() === 'admin' ? user.name : 'Admin';
  }

  ngOnInit() {
    // Must run synchronously (no prior `await`) so the real-time listener
    // is registered within Angular's injection context.
    this.ticketsSub = this.firebase.getTicketsRealtime().subscribe({
      next: (raw) => {
        const tickets = raw.map((t) => ({
          id: t.id,
          title: t.title || '',
          user: t.userName || 'Unknown',
          priority: t.priority || 'low',
          status: t.status || 'open',
          technicianName: t.technicianName || '',
          createdOn: t.createdOn || this.formatTimestamp(t.createdAt),
          createdAt: t.createdAt,
        }));

        this.openCount = tickets.filter((t) => t.status === 'open').length;
        this.inProgressCount = tickets.filter((t) => t.status === 'in_progress').length;
        this.resolvedCount = tickets.filter((t) => t.status === 'resolved').length;
        this.totalCount = tickets.length;

        this.tickets = [...tickets]
          .sort((a, b) => this.timestampMillis(b.createdAt) - this.timestampMillis(a.createdAt))
          .slice(0, 5);

        this.loading = false;
      },
      error: (err) => {
        console.error('Error streaming tickets:', err);
        this.loadError = `Failed to load tickets: ${err?.code || err?.message || 'unknown error'}`;
        this.loading = false;
      },
    });
  }

  ngOnDestroy() {
    this.ticketsSub?.unsubscribe();
  }

  private timestampMillis(value: any): number {
    if (value?.toMillis) return value.toMillis();
    if (value?.seconds) return value.seconds * 1000;
    return 0;
  }

  private formatTimestamp(value: any): string {
    const millis = this.timestampMillis(value);
    return millis ? new Date(millis).toISOString().split('T')[0] : '';
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
