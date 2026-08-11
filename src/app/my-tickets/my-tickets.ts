import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { HeaderComponent } from '../shared/header/header';
import { SidebarComponent } from '../shared/sidebar/sidebar';
import { FirebaseService } from '../services/firebase';

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

@Component({
  selector: 'app-my-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent, SidebarComponent],
  templateUrl: './my-tickets.html',
  styleUrl: './my-tickets.css',
})
export class MyTickets implements OnInit, OnDestroy {
  role = 'technician';
  userName = 'Technician';

  searchTerm = '';
  selectedStatus = 'All';
  selectedPriority = 'All';

  statusOptions = ['Open', 'In Progress', 'Resolved'];

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

  private applySnapshot(raw: any[]) {
    const previousById = new Map(this.tickets.map((t) => [t.id, t]));
    this.tickets = raw
      .map((t) => {
        const prev = previousById.get(t.id);
        return {
          id: t.id,
          user: t.userName || 'Unknown',
          title: t.title || '',
          department: t.department || '--',
          priority: t.priority || 'low',
          status: STATUS_LABELS[t.status] || t.status || 'Open',
          dateAssigned: t.createdOn || this.formatTimestamp(t.createdAt),
          createdAt: t.createdAt,
          editingStatus: prev?.editingStatus || false,
          pendingStatus: prev?.pendingStatus,
          addingNote: prev?.addingNote || false,
          noteDraft: prev?.noteDraft || '',
          notes: prev?.notes || [],
        };
      })
      .sort((a, b) => this.timestampMillis(b.createdAt) - this.timestampMillis(a.createdAt));
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

  toggleStatusEditor(ticket: any) {
    ticket.addingNote = false;
    ticket.editingStatus = !ticket.editingStatus;
    if (ticket.editingStatus) {
      ticket.pendingStatus = ticket.status;
    }
  }

  async confirmStatus(ticket: any) {
    const newLabel = ticket.pendingStatus;
    const newValue = STATUS_VALUES[newLabel] || newLabel.toLowerCase();
    try {
      await this.firebase.updateTicket(ticket.id, { status: newValue });
      ticket.status = newLabel;
    } catch (err) {
      console.error('Error updating ticket status:', err);
    }
    ticket.editingStatus = false;
  }

  toggleNoteInput(ticket: any) {
    ticket.editingStatus = false;
    ticket.addingNote = !ticket.addingNote;
    if (ticket.addingNote && ticket.noteDraft === undefined) {
      ticket.noteDraft = '';
    }
  }

  sendNote(ticket: any) {
    if (!ticket.noteDraft || !ticket.noteDraft.trim()) return;
    (ticket.notes ||= []).push(ticket.noteDraft.trim());
    ticket.noteDraft = '';
    ticket.addingNote = false;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
