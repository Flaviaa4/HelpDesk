import { Component, OnInit, HostListener } from '@angular/core';
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
  profileOpen = false;
  userName = 'User';

  searchTerm = '';
  selectedPriority = '';
  tickets: any[] = [];
  loading = true;
  api: any;

  constructor(private router: Router) {}

  toggleProfile() {
    this.profileOpen = !this.profileOpen;
  }

  @HostListener('document:click')
  closeDropdown() {
    this.profileOpen = false;
  }

  logout() {
    console.log('User logged out');
  }

  ngOnInit() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  this.userName = user.name || 'User';

  this.loading = false;


}
}
