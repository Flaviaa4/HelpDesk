import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';


@Component({
  selector: 'app-ticket-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './ticket-history.html',
  styleUrl: './ticket-history.css',
})
export class TicketHistory implements OnInit {
toggleProfile() {
throw new Error('Method not implemented.');
}
profileOpen: any;
userName: any;
logout() {
throw new Error('Method not implemented.');
}
  searchTerm = '';
  selectedPriority = '';
  tickets: any[] = [];
  loading = true;
  api: any;

  constructor(
    private router: Router,
  ) {}

  ngOnInit() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) {
      this.api.getUserTickets(user.id).subscribe({
        next: (res: any) => {
          this.tickets = res.tickets;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
    } else {
      this.loading = false;
    }
  }

  backto() {
    this.router.navigate(['/user-dashboard']);
  }
}
