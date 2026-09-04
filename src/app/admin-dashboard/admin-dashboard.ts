import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FirebaseService } from '../services/firebase';
import { LoadingSpinnerComponent } from '../shared/loading-spinner/loading-spinner';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LoadingSpinnerComponent],
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
    private cdr: ChangeDetectorRef,
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
          ticketNumber: t.ticketNumber || null,
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
          .sort((a, b) => (b.ticketNumber || 0) - (a.ticketNumber || 0))
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

  get filteredTickets() {
    const term = this.searchTerm.toLowerCase().trim();
    return this.tickets.filter((t) => {
      const matchesSearch =
        !term || t.title.toLowerCase().includes(term) || t.user.toLowerCase().includes(term);
      const matchesPriority = !this.selectedPriority || t.priority === this.selectedPriority;
      return matchesSearch && matchesPriority;
    });
  }

  applyFilters() {
    this.cdr.detectChanges();
  }

  toggleProfile() {
    this.profileOpen = !this.profileOpen;
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
