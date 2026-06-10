import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-submit-ticket',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './submit-ticket.html',
  styleUrl: './submit-ticket.css',
})
export class SubmitTicket {
  title = '';
  description = '';
  category = '';
  createdOn = '';
  errorMsg = '';
  successMsg = '';
  loading = false;
  profileOpen = false;
  userName = '';
  api: any;

  constructor(
    private router: Router,
  ) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.userName = user.name || 'User';
  }

  toggleProfile() {
    this.profileOpen = !this.profileOpen;
  }

  submitTicket() {
    if (!this.title || !this.description || !this.category) {
      this.errorMsg = 'Please fill in all required fields.';
      return;
    }
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id) {
      this.errorMsg = 'You must be logged in to submit a ticket.';
      return;
    }
    this.loading = true;
    this.errorMsg = '';
    const data = {
      user_id: user.id,
      title: this.title,
      description: this.description,
      category: this.category,
    };
    this.api.createTicket(data).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.successMsg = 'Ticket submitted successfully!';
        setTimeout(() => this.router.navigate(['/user-dashboard']), 1500);
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Failed to submit ticket.';
      },
    });
  }

  backto() {
    this.router.navigate(['/user-dashboard']);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
