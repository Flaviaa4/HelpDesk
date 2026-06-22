import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  username = '';
  password = '';
  errorMsg = '';

  showPassword = false;

  constructor(private router: Router) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  login() {
    if (!this.username || !this.password) {
      this.errorMsg = 'Please fill in all fields.';
      return;
    }

    if (this.username === 'admin@helpdesk.com' && this.password === 'admin123') {
      this.router.navigate(['/admin-dashboard']);
    } else if (this.username === 'user@helpdesk.com' && this.password === 'user1234') {
      this.router.navigate(['/user-dashboard']);
    } else {
      this.errorMsg = 'Invalid email or password.';
    }
  }
}

