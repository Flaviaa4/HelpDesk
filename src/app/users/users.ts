import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { FirebaseService } from '../services/firebase';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements OnInit {
  searchTerm = '';
  selectedRole = 'all';
  menuOpen = false;
  users: any[] = [];
  loading = true;

  departments = ['Network', 'Hardware', 'Software', 'Email', 'Access'];

  editingUser: any = null;
  selectedDepartment = '';
  successMsg = '';
  errorMsg = '';

  profileOpen = false;
  adminName = '';

  constructor(
    private firebase: FirebaseService,
    private router: Router,
  ) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.adminName = (user.role || '').toLowerCase().trim() === 'admin' ? user.name : 'Admin';
  }

  async ngOnInit() {
    await this.loadUsers();
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

  toggleProfile() {
    this.profileOpen = !this.profileOpen;
  }

  async loadUsers() {
    try {
      this.loading = true;
      const all = await this.firebase.getUsers();
      this.users = all.filter((u: any) => u.role !== 'admin');
    } catch (err) {
      console.error('Error loading users:', err);
      this.errorMsg = 'Failed to load users.';
    } finally {
      this.loading = false;
    }
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
      await this.loadUsers();
    } catch {
      this.errorMsg = 'Failed to assign department.';
    }
  }

  async deleteUser(userId: string) {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await this.firebase.deleteUser(userId);
        await this.loadUsers();
      } catch {
        this.errorMsg = 'Failed to delete user.';
      }
    }
  }

  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
