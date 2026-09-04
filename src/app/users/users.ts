import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
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

  bulkDeleteOpen = false;
  selectedUserIds = new Set<string>();

  profileOpen = false;
  adminName = '';

  private usersSub?: Subscription;

  constructor(
    private firebase: FirebaseService,
    private router: Router,
    private cdr: ChangeDetectorRef,
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
    this.cdr.detectChanges();
  }

  isSelected(userId: string) {
    return this.selectedUserIds.has(userId);
  }

  toggleSelect(userId: string, checked: boolean) {
    if (checked) {
      this.selectedUserIds.add(userId);
    } else {
      this.selectedUserIds.delete(userId);
    }
    this.cdr.detectChanges();
  }

  get allPagedSelected() {
    return this.pagedUsers.length > 0 && this.pagedUsers.every((u) => this.selectedUserIds.has(u.id));
  }

  toggleSelectAll(checked: boolean) {
    for (const u of this.pagedUsers) {
      if (checked) {
        this.selectedUserIds.add(u.id);
      } else {
        this.selectedUserIds.delete(u.id);
      }
    }
    this.cdr.detectChanges();
  }

  toggleProfile() {
    this.profileOpen = !this.profileOpen;
    this.cdr.detectChanges();
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  openAssignDept(user: any) {
    this.editingUser = user;
    this.selectedDepartment = user.department || '';
    this.successMsg = '';
    this.errorMsg = '';
    this.cdr.detectChanges();
  }

  closeAssignDept() {
    this.editingUser = null;
    this.selectedDepartment = '';
    this.cdr.detectChanges();
  }

  async saveDepartment() {
    if (!this.selectedDepartment) {
      this.errorMsg = 'Please select a department.';
      this.cdr.detectChanges();
      return;
    }
    // Optimistically update the UI before awaiting the Firebase call
    try {
      await this.firebase.updateUser(this.editingUser.id, {
        department: this.selectedDepartment,
      });
      this.editingUser.department = this.selectedDepartment;
      this.successMsg = 'Department assigned successfully!';
      this.cdr.detectChanges();
      setTimeout(() => this.closeAssignDept(), 1500);
    } catch {
      this.errorMsg = 'Failed to assign department.';
      this.cdr.detectChanges();
    }
  }

  openBulkDelete() {
    if (this.selectedUserIds.size === 0) return;
    this.bulkDeleteOpen = true;
    this.cdr.detectChanges();
  }

  get deleteModalTitle() {
    return this.selectedUserIds.size === 1 ? 'Delete user' : 'Delete users';
  }

  get deleteModalMessage() {
    return `Are you sure you want to delete ${this.selectedUserIds.size} selected user${this.selectedUserIds.size === 1 ? '' : 's'}? This cannot be undone.`;
  }

  cancelDeleteUser() {
    this.bulkDeleteOpen = false;
    this.cdr.detectChanges();
  }

  async confirmDeleteUser() {
    const ids = [...this.selectedUserIds];
    try {
      await Promise.all(ids.map((id) => this.firebase.deleteUser(id)));
      this.selectedUserIds.clear();
    } catch {
      this.errorMsg = 'Failed to delete one or more users.';
    }
    this.bulkDeleteOpen = false;
    this.cdr.detectChanges();
  }

  async logout() {
    try {
      await this.firebase.logout();
    } catch (err) {
      console.error('Error signing out:', err);
    }
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
