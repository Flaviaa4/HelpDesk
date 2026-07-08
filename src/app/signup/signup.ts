import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HideShowComponent } from '../shared/hide-show/hide-show';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HideShowComponent],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  username= '';
  email = '';
  password = '';
  errorMsg = '';
  successMsg = '';

  constructor(private router: Router) {}

  register() {
    if (!this.username || !this.email || !this.password) {
      this.errorMsg = 'Please fill in all fields.';
      return;
    }
    setTimeout(() => this.router.navigate(['/login']), 1500);
  }
}
