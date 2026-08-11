import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HeaderComponent } from '../shared/header/header';
import { SidebarComponent } from '../shared/sidebar/sidebar';
import { FirebaseService } from '../services/firebase';

@Component({
  selector: 'app-technician-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent, SidebarComponent],
  templateUrl: './technician-profile.html',
  styleUrl: './technician-profile.css',
})
export class TechnicianProfile implements OnInit {
  role = 'technician';
  userName = 'Technician';

  userDocId = '';
  fullName = '';
  email = '';
  department = '';

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  available = true;

  savingProfile = false;
  profileError = '';
  profileSuccess = '';

  savingPassword = false;
  passwordError = '';
  passwordSuccess = '';

  savingAvailability = false;
  availabilityError = '';
  availabilitySuccess = '';

  constructor(
    private firebase: FirebaseService,
    private router: Router,
  ) {}

  async ngOnInit() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.userName = user.role === this.role ? user.name : 'Technician';
    this.fullName = this.userName;
    this.email = user.email || '';

    if (user.uid) {
      try {
        const profile: any = await this.firebase.getUserByUid(user.uid);
        if (profile) {
          this.userDocId = profile.id;
          this.fullName = profile.name || this.fullName;
          this.email = profile.email || this.email;
          this.department = profile.department || '';
          this.available = profile.available !== false;
        }
      } catch (err) {
        console.error('Error loading technician profile:', err);
      }
    }
  }

  changeAvatar() {
    console.log('Change avatar');
  }

  async saveProfile() {
    this.profileError = '';
    this.profileSuccess = '';

    if (!this.fullName.trim()) {
      this.profileError = 'Full name cannot be empty.';
      return;
    }
    if (!this.userDocId) {
      this.profileError = 'Could not find your profile record.';
      return;
    }

    this.savingProfile = true;
    try {
      await this.firebase.updateUser(this.userDocId, { name: this.fullName.trim() });
      this.userName = this.fullName.trim();
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, name: this.userName }));
      this.profileSuccess = 'Profile saved successfully!';
    } catch (err) {
      console.error('Error saving profile:', err);
      this.profileError = 'Failed to save profile. Please try again.';
    } finally {
      this.savingProfile = false;
    }
  }

  async updatePassword() {
    this.passwordError = '';
    this.passwordSuccess = '';

    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.passwordError = 'Please fill in all password fields.';
      return;
    }
    if (this.newPassword.length < 6) {
      this.passwordError = 'New password must be at least 6 characters.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'New password and confirmation do not match.';
      return;
    }

    this.savingPassword = true;
    try {
      await this.firebase.changePassword(this.currentPassword, this.newPassword);
      this.passwordSuccess = 'Password updated successfully!';
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';
    } catch (err: any) {
      console.error('Error updating password:', err);
      this.passwordError =
        err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password'
          ? 'Current password is incorrect.'
          : 'Failed to update password. Please try again.';
    } finally {
      this.savingPassword = false;
    }
  }

  async saveAvailability() {
    this.availabilityError = '';
    this.availabilitySuccess = '';

    if (!this.userDocId) {
      this.availabilityError = 'Could not find your profile record.';
      return;
    }

    this.savingAvailability = true;
    try {
      await this.firebase.updateUser(this.userDocId, { available: this.available });
      this.availabilitySuccess = 'Availability saved successfully!';
    } catch (err) {
      console.error('Error saving availability:', err);
      this.availabilityError = 'Failed to save availability. Please try again.';
    } finally {
      this.savingAvailability = false;
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
