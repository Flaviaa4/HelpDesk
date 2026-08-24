import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { FirebaseService } from '../../services/firebase';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent implements OnChanges, OnDestroy {
  @Input() role = '';

  unreadCount = 0;

  private ticketsSub?: Subscription;
  private subscribedUid = '';

  constructor(private firebase: FirebaseService) {}

  ngOnChanges() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.uid || user.uid === this.subscribedUid) return;
    this.subscribedUid = user.uid;

    this.ticketsSub?.unsubscribe();

    if (this.role === 'technician') {
      this.ticketsSub = this.firebase.getTicketsByTechnicianRealtime(user.uid).subscribe({
        next: (tickets) => {
          this.unreadCount = tickets.filter((t) => t.unreadForTechnician).length;
        },
      });
    } else if (this.role === 'user') {
      this.ticketsSub = this.firebase.getTicketsByUserRealtime(user.uid).subscribe({
        next: (tickets) => {
          this.unreadCount = tickets.filter((t) => t.unreadForUser).length;
        },
      });
    }
  }

  ngOnDestroy() {
    this.ticketsSub?.unsubscribe();
  }
}
