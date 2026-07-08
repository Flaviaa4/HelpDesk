import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hide-show',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hide-show.html',
  styleUrls: ['./hide-show.css'],
})
export class HideShowComponent {
  @Input() password = '';

  @Output() passwordChange = new EventEmitter<string>();

  @Input() placeholder = 'Password';

  showPassword = false;

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  updatePassword(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.password = value;
    this.passwordChange.emit(value);
  }
}
