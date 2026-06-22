import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  username = '';
  email = '';
  password = '';
  errorMsg = '';
  successMsg = '';

  showPassword = false;

  constructor(private router: Router) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  register() {
    if (!this.username || !this.email || !this.password) {
      this.errorMsg = 'Please fill in all fields.';
      return;
    }
    setTimeout(() => this.router.navigate(['/login']), 1500);
  }
}
