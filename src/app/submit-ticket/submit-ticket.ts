import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { FirebaseService } from '../services/firebase';
import { HeaderComponent } from '../shared/header/header';
import { SidebarComponent } from '../shared/sidebar/sidebar';

@Component({
  selector: 'app-submit-ticket',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent, SidebarComponent],
  templateUrl: './submit-ticket.html',
  styleUrl: './submit-ticket.css',
})
export class SubmitTicket implements OnInit {
  title = '';
  description = '';
  priority = '';
  category = '';
  createdOn = '';
  errorMsg = '';
  successMsg = '';
  loading = false;
  profileOpen = false;
  userName = '';
  userId = '';
  role = 'user';

  selectedDepartment = '';
  selectedTechnician: any = null;

  departments = ['Network', 'Hardware', 'Software', 'Email', 'Access'];

  technicians: any[] = [];

  get filteredTechnicians() {
    if (!this.selectedDepartment) return [];
    return this.technicians.filter((t) => t.department === this.selectedDepartment);
  }

  constructor(
    private firebase: FirebaseService,
    private router: Router,
  ) {}

  async ngOnInit() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.userName = user.name || user.userName || 'User';
    this.userId = user.uid || '';
    await this.loadTechnicians();
  }

  async loadTechnicians() {
    try {
      const all = await this.firebase.getTechnicians();
      this.technicians = all;
    } catch {
      this.technicians = [];
    }
  }

  toggleProfile() {
    this.profileOpen = !this.profileOpen;
  }

  onTitleChange() {
    const text = (this.title + ' ' + this.description).toLowerCase();
    if (/urgent|critical|down|crash|not working|broken/.test(text)) {
      this.priority = 'high';
    } else if (/slow|error|issue|problem|failed|bug/.test(text)) {
      this.priority = 'medium';
    } else if (this.title.length > 3) {
      this.priority = 'low';
    }
  }

  selectTechnician(tech: any) {
    if (tech.available === false) return;
    this.selectedTechnician = tech;
  }

  async submitTicket() {
    if (!this.title || !this.description || !this.priority) {
      this.errorMsg = 'Please fill in all required fields.';
      return;
    }

    if (!this.userId) {
      this.errorMsg = 'You must be logged in to submit a ticket.';
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    try {
      await this.firebase.createTicket({
        userId: this.userId,
        userName: this.userName,
        title: this.title,
        description: this.description,
        priority: this.priority,
        category: this.category,
        department: this.selectedDepartment,
        technicianId: this.selectedTechnician?.uid || null,
        technicianName: this.selectedTechnician?.name || null,
        createdOn: this.createdOn || new Date().toISOString().split('T')[0],
      });
      this.loading = false;
      this.successMsg = 'Ticket submitted successfully!';
      setTimeout(() => this.router.navigate(['/user-dashboard']), 1500);
    } catch (err: any) {
      this.loading = false;
      this.errorMsg = 'Failed to submit ticket. Please try again.';
    }
  }

  backto() {
    this.router.navigate(['/user-dashboard']);
  }

  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
