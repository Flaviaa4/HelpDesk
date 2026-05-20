import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-submit-ticket',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './submit-ticket.html',
  styleUrl: './submit-ticket.css',
})
export class SubmitTicket {
  router: any;
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/user-dashboard']);
  }
}
