import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HideShowComponent } from '../shared/hide-show/hide-show';
import { FirebaseService } from '../services/firebase';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HideShowComponent],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  userName = '';
  email = '';
  password = '';
  errorMsg = '';
  successMsg = '';
  loading = false;

  constructor(
    private firebase: FirebaseService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  async register() {
    if (!this.userName || !this.email || !this.password) {
      this.errorMsg = 'Please fill in all fields.';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.errorMsg = '';
    // Change detection doesn't reliably re-run synchronously after this
    // click before the `await` below, so force it here — otherwise
    // "Creating account..." never paints until the request finishes.
    this.cdr.detectChanges();

    try {
      await this.firebase.register(this.email, this.password, this.userName);
      this.loading = false;
      this.successMsg = 'Account created! Redirecting to login...';
      this.cdr.detectChanges();
      setTimeout(() => this.router.navigate(['/login']), 1500);
    } catch (err: any) {
      this.loading = false;
      if (err.code === 'auth/email-already-in-use') {
        this.errorMsg = 'Email already exists.';
      } else {
        this.errorMsg = 'Registration failed. Please try again.';
      }
      this.cdr.detectChanges();
    }
  }
}
