import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { HeaderComponent } from '../shared/header/header';
import { SidebarComponent } from '../shared/sidebar/sidebar';
import { FirebaseService } from '../services/firebase';
import { PaginationComponent } from '../shared/pagination/pagination';

@Component({
  selector: 'app-ticket-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent, SidebarComponent, PaginationComponent],
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
        const previousById = new Map(this.tickets.map((t) => [t.id, t]));
        this.tickets = [...raw]
          .sort((a, b) => this.timestampMillis(b.createdAt) - this.timestampMillis(a.createdAt))
          .map((t) => {
            const prev = previousById.get(t.id);
            return {
              id: t.id,
              title: t.title || '',
              category: t.category || '--',
              priority: t.priority || 'low',
              status: t.status || 'open',
              technicianName: t.technicianName || '',
              createdOn: t.createdOn || this.formatTimestamp(t.createdAt),
              notes: t.notes || [],
              unread: !!t.unreadForUser,
              addingNote: prev?.addingNote || false,
              noteDraft: prev?.noteDraft || '',
              noteFile: prev?.noteFile || null,
              noteFileError: prev?.noteFileError || '',
              sendingNote: prev?.sendingNote || false,
            };
          });
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
    ticket.addingNote = !ticket.addingNote;
    if (ticket.addingNote && ticket.unread) {
      ticket.unread = false;
      this.firebase.markTicketNotesRead(ticket.id, 'unreadForUser').catch((err) => {
        console.error('Error marking notes read:', err);
      });
    }
  }

  onFileSelected(ticket: any, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    ticket.noteFileError = '';
    if (file && file.size > 10 * 1024 * 1024) {
      ticket.noteFileError = 'File is too large (max 10MB).';
      ticket.noteFile = null;
      input.value = '';
      return;
    }
    ticket.noteFile = file;
  }

  clearNoteFile(ticket: any) {
    ticket.noteFile = null;
    ticket.noteFileError = '';
  }

  async sendNote(ticket: any) {
    const text = (ticket.noteDraft || '').trim();
    const file: File | null = ticket.noteFile || null;
    if (!text && !file) return;

    ticket.sendingNote = true;
    try {
      let attachment;
      if (file) {
        attachment = await this.firebase.uploadTicketAttachment(ticket.id, file);
      }
      await this.firebase.addTicketNote(
        ticket.id,
        { author: this.userName, role: 'user', text, attachment },
        'unreadForTechnician',
      );
      ticket.noteDraft = '';
      ticket.noteFile = null;
    } catch (err: any) {
      console.error('Error sending note:', err);
      ticket.noteFileError = err?.message || 'Failed to send note.';
    } finally {
      ticket.sendingNote = false;
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}

