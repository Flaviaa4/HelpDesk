import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HideShowComponent } from '../shared/hide-show/hide-show';
import { FirebaseService } from '../services/firebase';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HideShowComponent],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  username = '';
  password = '';
  errorMsg = '';
  loading = false;

  constructor(
    private firebase: FirebaseService,
    private router: Router,
  ) {}

  async login() {
    if (!this.username || !this.password) {
      this.errorMsg = 'Please fill in all fields.';
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    try {
      const user = await this.firebase.login(this.username, this.password);
      localStorage.setItem('user', JSON.stringify(user));

      if (user['role'] === 'admin') {
        this.router.navigate(['/admin-dashboard']);
      } else if (user['role'] === 'technician') {
        this.router.navigate(['/technician-dashboard']);
      } else {
        this.router.navigate(['/user-dashboard']);
      }
    } catch (err: any) {
      this.loading = false;
      this.errorMsg = 'Invalid email or password.';
    }
  }
}
