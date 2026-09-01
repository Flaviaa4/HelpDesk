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
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent, ConfirmDialogComponent, LoadingSpinnerComponent],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements OnInit, OnDestroy {
  searchTerm = '';
  selectedRole = 'all';
  menuOpen = false;
  users: any[] = [];
  loading = true;

  currentPage = 1;
  pageSize = 10;

  departments = ['Network', 'Hardware', 'Software', 'Email', 'Access'];

  editingUser: any = null;
  selectedDepartment = '';
  successMsg = '';
  errorMsg = '';

  deletingUserId: string | null = null;

  profileOpen = false;
  adminName = '';

  private usersSub?: Subscription;

  constructor(
    private firebase: FirebaseService,
    private router: Router,
  ) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.adminName = (user.role || '').toLowerCase().trim() === 'admin' ? user.name : 'Admin';
  }

  ngOnInit() {
    // Must run synchronously (no prior `await`) so the real-time listener
    // is registered within Angular's injection context.
    this.usersSub = this.firebase.getUsersRealtime().subscribe({
      next: (all) => {
        this.users = all.filter((u: any) => u.role !== 'admin');
        this.loading = false;
      },
      error: (err) => {
        console.error('Error streaming users:', err);
        this.errorMsg = 'Failed to load users.';
        this.loading = false;
      },
    });
  }

  ngOnDestroy() {
    this.usersSub?.unsubscribe();
  }

  get filteredUsers() {
    const term = this.searchTerm.toLowerCase().trim();
    return this.users.filter((u) => {
      const matchesRole = this.selectedRole === 'all' || u.role === this.selectedRole;
      const matchesSearch =
        !term ||
        (u.name || '').toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term);
      return matchesRole && matchesSearch;
    });
  }

  get pagedUsers() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(start, start + this.pageSize);
  }

  resetPage() {
    this.currentPage = 1;
  }

  toggleProfile() {
    this.profileOpen = !this.profileOpen;
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  openAssignDept(user: any) {
    this.editingUser = user;
    this.selectedDepartment = user.department || '';
    this.successMsg = '';
    this.errorMsg = '';
  }

  closeAssignDept() {
    this.editingUser = null;
    this.selectedDepartment = '';
  }

  async saveDepartment() {
    if (!this.selectedDepartment) {
      this.errorMsg = 'Please select a department.';
      return;
    }
    try {
      await this.firebase.updateUser(this.editingUser.id, {
        department: this.selectedDepartment,
      });
      this.editingUser.department = this.selectedDepartment;
      this.successMsg = 'Department assigned successfully!';
      setTimeout(() => this.closeAssignDept(), 1500);
    } catch {
      this.errorMsg = 'Failed to assign department.';
    }
  }

  deleteUser(userId: string) {
    this.deletingUserId = userId;
  }

  cancelDeleteUser() {
    this.deletingUserId = null;
  }

  async confirmDeleteUser() {
    if (!this.deletingUserId) return;
    try {
      await this.firebase.deleteUser(this.deletingUserId);
    } catch {
      this.errorMsg = 'Failed to delete user.';
    }
    this.deletingUserId = null;
  }

  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
