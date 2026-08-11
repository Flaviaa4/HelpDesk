import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { HeaderComponent } from '../shared/header/header';
import { SidebarComponent } from '../shared/sidebar/sidebar';
import { FirebaseService } from '../services/firebase';

@Component({
  selector: 'app-ticket-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent, SidebarComponent],
  templateUrl: './ticket-history.html',
  styleUrl: './ticket-history.css',
})
export class TicketHistory implements OnInit, OnDestroy {
  role = 'user';
  userName = 'User';
  searchTerm = '';
  tickets: any[] = [];
  loading = true;
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
      next: (raw) => {
        this.tickets = [...raw]
          .sort((a, b) => this.timestampMillis(b.createdAt) - this.timestampMillis(a.createdAt))
          .map((t) => ({
            id: t.id,
            title: t.title || '',
            category: t.category || '--',
            priority: t.priority || 'low',
            status: t.status || 'open',
            createdOn: t.createdOn || this.formatTimestamp(t.createdAt),
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

  get filteredTickets() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) return this.tickets;
    return this.tickets.filter(
      (t) => t.title.toLowerCase().includes(term) || t.category.toLowerCase().includes(term),
    );
  }

  private timestampMillis(value: any): number {
    if (value?.toMillis) return value.toMillis();
    if (value?.seconds) return value.seconds * 1000;
    return 0;
  }

  private formatTimestamp(value: any): string {
    const millis = this.timestampMillis(value);
    return millis ? new Date(millis).toISOString().split('T')[0] : '';
  ngOnInit() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.userName = user.name || 'User';

    this.loading = false;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}

