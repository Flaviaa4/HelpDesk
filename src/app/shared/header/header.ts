import { ChangeDetectorRef, Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent {
  @Input() userName = '';
  @Input() role = '';

  @Output() logout = new EventEmitter<void>();

  profileOpen = false;

  constructor(private cdr: ChangeDetectorRef) {}

  get settingsLink() {
    return this.role === 'technician' ? '/technician-settings' : '/u-settings';
  }

  get profileLink() {
    return this.role === 'technician' ? '/technician-profile' : '/u-profile';
  }

  get roleLabel() {
    return this.role === 'technician' ? 'Technician' : 'User';
  }

  toggleProfile() {
    this.profileOpen = !this.profileOpen;
    // Forces the dropdown to actually paint on click — plain synchronous
    // state changes from event handlers don't reliably re-render otherwise.
    this.cdr.detectChanges();
  }

  @HostListener('document:click')
  closeDropdown() {
    if (!this.profileOpen) return;
    this.profileOpen = false;
    this.cdr.detectChanges();
  }

  onLogout() {
    this.logout.emit();
  }
}
