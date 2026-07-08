import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HideShowComponent } from '../shared/hide-show/hide-show';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HideShowComponent,],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})

export class Login {
togglePassword() {
throw new Error('Method not implemented.');
}
  username = '';
  password = '';
  errorMsg = '';

  constructor(private router: Router) {}

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
