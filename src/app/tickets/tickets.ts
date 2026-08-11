import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FirebaseService } from '../services/firebase';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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

  assigningTicket: any = null;
  selectedTechnicianId = '';
  errorMsg = '';
  successMsg = '';
  loadError = '';

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
        this.tickets = raw.map((t) => ({
          id: t.id,
          subject: t.title || '',
          user: t.userName || 'Unknown',
          priority: t.priority || 'low',
          status: t.status || 'open',
          technicianId: t.technicianId || null,
          technicianName: t.technicianName || '',
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Error streaming tickets:', err);
        this.loadError = `Failed to load tickets: ${err?.code || err?.message || 'unknown error'}`;
        this.loading = false;
      },
    });

    this.loadTechnicians();
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

  async deleteTicket(ticketId: string) {
    if (confirm('Are you sure you want to delete this ticket?')) {
      try {
        await this.firebase.deleteTicket(ticketId);
      } catch (err) {
        console.error('Error deleting ticket:', err);
      }
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
