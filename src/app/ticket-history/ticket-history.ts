import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { HeaderComponent } from '../shared/header/header';
import { SidebarComponent } from '../shared/sidebar/sidebar';
import { FirebaseService } from '../services/firebase';
import { PaginationComponent } from '../shared/pagination/pagination';
import { LoadingSpinnerComponent } from '../shared/loading-spinner/loading-spinner';

interface TicketUiState {
  addingNote: boolean;
  noteDraft: string;
  noteError: string;
  sendingNote: boolean;
}

@Component({
  selector: 'app-ticket-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent, SidebarComponent, PaginationComponent, LoadingSpinnerComponent],
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

  currentPage = 1;
  pageSize = 10;

  private ticketsSub?: Subscription;

  // Every real-time snapshot rebuilds `tickets` from scratch, so in-flight
  // UI state (an open note editor, a "Sending..." flag) can't live on the
  // ticket objects themselves — a write we make (like
  // sending a note) triggers a fresh snapshot before our own async call
  // finishes, replacing the object out from under it. This map is stable
  // across rebuilds, keyed by ticket id, so mutations always land on
  // whatever is currently rendered.
  private uiById = new Map<string, TicketUiState>();

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
        const seenIds = new Set<string>();
        this.tickets = [...raw]
          .sort((a, b) => (b.ticketNumber || 0) - (a.ticketNumber || 0))
          .map((t) => {
            seenIds.add(t.id);
            return {
              id: t.id,
              ticketNumber: t.ticketNumber || null,
              title: t.title || '',
              category: t.category || '--',
              priority: t.priority || 'low',
              status: t.status || 'open',
              technicianName: t.technicianName || '',
              createdOn: t.createdOn || this.formatTimestamp(t.createdAt),
              notes: t.notes || [],
              unread: !!t.unreadForUser,
              ui: this.uiFor(t.id),
            };
          });

        for (const id of this.uiById.keys()) {
          if (!seenIds.has(id)) this.uiById.delete(id);
        }

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

  private uiFor(ticketId: string): TicketUiState {
    let ui = this.uiById.get(ticketId);
    if (!ui) {
      ui = { addingNote: false, noteDraft: '', noteError: '', sendingNote: false };
      this.uiById.set(ticketId, ui);
    }
    return ui;
  }

  get filteredTickets() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) return this.tickets;
    return this.tickets.filter(
      (t) => t.title.toLowerCase().includes(term) || t.category.toLowerCase().includes(term),
    );
  }

  get pagedTickets() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredTickets.slice(start, start + this.pageSize);
  }

  resetPage() {
    this.currentPage = 1;
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

  toggleNoteInput(ticket: any) {
    ticket.ui.addingNote = !ticket.ui.addingNote;
    if (ticket.ui.addingNote && ticket.unread) {
      ticket.unread = false;
      this.firebase.markTicketNotesRead(ticket.id, 'unreadForUser').catch((err) => {
        console.error('Error marking notes read:', err);
      });
    }
  }

  async sendNote(ticket: any) {
    const ui = ticket.ui as TicketUiState;
    const text = (ui.noteDraft || '').trim();
    if (!text) return;

    ui.sendingNote = true;
    try {
      await this.firebase.addTicketNote(
        ticket.id,
        { author: this.userName, role: 'user', text },
        'unreadForTechnician',
      );
      ui.noteDraft = '';
    } catch (err: any) {
      console.error('Error sending note:', err);
      ui.noteError = 'Failed to send note.';
    } finally {
      ui.sendingNote = false;
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
