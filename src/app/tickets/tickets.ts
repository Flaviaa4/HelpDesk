import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FirebaseService } from '../services/firebase';
import { PaginationComponent } from '../shared/pagination/pagination';
import { ConfirmDialogComponent } from '../shared/confirm-dialog/confirm-dialog';
import { LoadingSpinnerComponent } from '../shared/loading-spinner/loading-spinner';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent, ConfirmDialogComponent, LoadingSpinnerComponent],
  templateUrl: './tickets.html',
  styleUrl: './tickets.css',
})
export class Tickets implements OnInit, OnDestroy {
  searchTerm = '';
  selectedStatus = '';
  selectedPriority = '';
  tickets: any[] = [];
  technicians: any[] = [];
  loading = true;
  profileOpen = false;
  userName = '';

  currentPage = 1;
  pageSize = 10;

  assigningTicket: any = null;
  selectedTechnicianId = '';
  errorMsg = '';
  successMsg = '';
  loadError = '';

  deletingTicketId: string | null = null;

  private ticketsSub?: Subscription;

  constructor(
    private firebase: FirebaseService,
    private router: Router,
  ) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.userName = (user.role || '').toLowerCase().trim() === 'admin' ? user.name : 'Admin';
  }

  ngOnInit() {
    this.ticketsSub = this.firebase.getTicketsRealtime().subscribe({
      next: (raw) => {
        this.tickets = raw
          .map((t) => ({
            id: t.id,
            ticketNumber: t.ticketNumber || null,
            subject: t.title || '',
            user: t.userName || 'Unknown',
            priority: t.priority || 'low',
            status: t.status || 'open',
            technicianId: t.technicianId || null,
            technicianName: t.technicianName || '',
          }))
          .sort((a, b) => (a.ticketNumber || 0) - (b.ticketNumber || 0));
        this.loading = false;
      },
      error: (err) => {
        console.error('Error streaming tickets:', err);
        this.loadError = `Failed to load tickets: ${err?.code || err?.message || 'unknown error'}`;
        this.loading = false;
      },
    });

    this.loadTechnicians();

    // Order matters: the reset migrates any ticket still on the old 1000+
    // scheme down to a clean 1, 2, 3... sequence; backfill then covers any
    // ticket that has no number at all. Both are no-ops once done.
    this.firebase
      .resetTicketNumbersIfNeeded()
      .then(() => this.firebase.backfillTicketNumbers())
      .catch((err) => {
        console.error('Error normalizing ticket numbers:', err);
      });
  }

  private async loadTechnicians() {
    try {
      this.technicians = await this.firebase.getTechnicians();
    } catch (err) {
      console.error('Error loading technicians:', err);
    }
  }

  ngOnDestroy() {
    this.ticketsSub?.unsubscribe();
  }

  get filteredTickets() {
    const term = this.searchTerm.toLowerCase().trim();
    return this.tickets.filter((t) => {
      const matchesSearch =
        !term || t.subject.toLowerCase().includes(term) || t.user.toLowerCase().includes(term);
      const matchesPriority = !this.selectedPriority || t.priority === this.selectedPriority;
      const matchesStatus = !this.selectedStatus || t.status === this.selectedStatus;
      return matchesSearch && matchesPriority && matchesStatus;
    });
  }

  get pagedTickets() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredTickets.slice(start, start + this.pageSize);
  }

  resetPage() {
    this.currentPage = 1;
  }

  toggleProfile() {
    this.profileOpen = !this.profileOpen;
  }

  openAssign(ticket: any) {
    this.assigningTicket = ticket;
    this.selectedTechnicianId = ticket.technicianId || '';
    this.errorMsg = '';
    this.successMsg = '';
  }

  closeAssign() {
    this.assigningTicket = null;
    this.selectedTechnicianId = '';
  }

  async saveAssignment() {
    if (!this.selectedTechnicianId) {
      this.errorMsg = 'Please select a technician.';
      return;
    }
    const tech = this.technicians.find((t) => t.uid === this.selectedTechnicianId);
    if (!tech) {
      this.errorMsg = 'Selected technician could not be found.';
      return;
    }
    try {
      await this.firebase.updateTicket(this.assigningTicket.id, {
        technicianId: tech.uid,
        technicianName: tech.name,
      });
      this.successMsg = 'Technician assigned successfully!';
      setTimeout(() => this.closeAssign(), 1200);
    } catch (err) {
      console.error('Error assigning technician:', err);
      this.errorMsg = 'Failed to assign technician.';
    }
  }

  deleteTicket(ticketId: string) {
    this.deletingTicketId = ticketId;
  }

  cancelDeleteTicket() {
    this.deletingTicketId = null;
  }

  async confirmDeleteTicket() {
    if (!this.deletingTicketId) return;
    try {
      await this.firebase.deleteTicket(this.deletingTicketId);
    } catch (err) {
      console.error('Error deleting ticket:', err);
    }
    this.deletingTicketId = null;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
