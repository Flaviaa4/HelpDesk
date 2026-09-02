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

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

const STATUS_VALUES: Record<string, string> = {
  Open: 'open',
  'In Progress': 'in_progress',
  Resolved: 'resolved',
};

interface TicketUiState {
  editingStatus: boolean;
  pendingStatus?: string;
  addingNote: boolean;
  noteDraft: string;
  noteError: string;
  sendingNote: boolean;
}

@Component({
  selector: 'app-my-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent, SidebarComponent, PaginationComponent, LoadingSpinnerComponent],
  templateUrl: './my-tickets.html',
  styleUrl: './my-tickets.css',
})
export class MyTickets implements OnInit, OnDestroy {
  role = 'technician';
  userName = 'Technician';

  searchTerm = '';
  selectedStatus = 'All';
  selectedPriority = 'All';

  currentPage = 1;
  pageSize = 10;

  statusOptions = ['Open', 'In Progress', 'Resolved'];

  tickets: any[] = [];
  loading = true;
  loadError = '';

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
    this.userName = user.role === this.role ? user.name : 'Technician';

    if (!user.uid) {
      this.loading = false;
      return;
    }

    this.ticketsSub = this.firebase.getTicketsByTechnicianRealtime(user.uid).subscribe({
      next: (raw) => {
        this.applySnapshot(raw);
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

  private uiFor(ticketId: string): TicketUiState {
    let ui = this.uiById.get(ticketId);
    if (!ui) {
      ui = {
        editingStatus: false,
        pendingStatus: undefined,
        addingNote: false,
        noteDraft: '',
        noteError: '',
        sendingNote: false,
      };
      this.uiById.set(ticketId, ui);
    }
    return ui;
  }

  private applySnapshot(raw: any[]) {
    const seenIds = new Set<string>();
    this.tickets = raw
      .map((t) => {
        seenIds.add(t.id);
        return {
          id: t.id,
          ticketNumber: t.ticketNumber || null,
          user: t.userName || 'Unknown',
          title: t.title || '',
          description: t.description || '',
          department: t.department || '--',
          priority: t.priority || 'low',
          status: STATUS_LABELS[t.status] || t.status || 'Open',
          dateAssigned: t.createdOn || this.formatTimestamp(t.createdAt),
          createdAt: t.createdAt,
          notes: t.notes || [],
          unread: !!t.unreadForTechnician,
          ui: this.uiFor(t.id),
        };
      })
      .sort((a, b) => (a.ticketNumber || 0) - (b.ticketNumber || 0));

    // Drop UI state for tickets no longer in this technician's list
    // (reassigned elsewhere, deleted, etc.) so the map doesn't grow forever.
    for (const id of this.uiById.keys()) {
      if (!seenIds.has(id)) this.uiById.delete(id);
    }
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
    return this.tickets.filter((ticket) => {
      const term = this.searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        ticket.title.toLowerCase().includes(term) ||
        ticket.user.toLowerCase().includes(term);
      const matchesStatus = this.selectedStatus === 'All' || ticket.status === this.selectedStatus;
      const matchesPriority = this.selectedPriority === 'All' || ticket.priority === this.selectedPriority;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }

  get pagedTickets() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredTickets.slice(start, start + this.pageSize);
  }

  resetPage() {
    this.currentPage = 1;
  }

  toggleStatusEditor(ticket: any) {
    ticket.ui.addingNote = false;
    ticket.ui.editingStatus = !ticket.ui.editingStatus;
    if (ticket.ui.editingStatus) {
      ticket.ui.pendingStatus = ticket.status;
    }
  }

  async confirmStatus(ticket: any) {
    const newLabel = ticket.ui.pendingStatus;
    const newValue = STATUS_VALUES[newLabel] || newLabel.toLowerCase();
    try {
      await this.firebase.updateTicket(ticket.id, { status: newValue });
    } catch (err) {
      console.error('Error updating ticket status:', err);
    }
    ticket.ui.editingStatus = false;
  }

  toggleNoteInput(ticket: any) {
    ticket.ui.editingStatus = false;
    ticket.ui.addingNote = !ticket.ui.addingNote;
    if (ticket.ui.addingNote && ticket.unread) {
      ticket.unread = false;
      this.firebase.markTicketNotesRead(ticket.id, 'unreadForTechnician').catch((err) => {
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
        { author: this.userName, role: 'technician', text },
        'unreadForUser',
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
