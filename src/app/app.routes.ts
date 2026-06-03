import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Signup } from './signup/signup';
import { UserDashboard } from './user-dashboard/user-dashboard';
import { SubmitTicket } from './submit-ticket/submit-ticket';
import { TicketHistory } from './ticket-history/ticket-history';
import { AdminDashboard } from './admin-dashboard/admin-dashboard';
import { Tickets } from './tickets/tickets';
import { Users } from './users/users';
import { SettingsComponent } from './settings/settings';
import { ProfileComponent } from './profile/profile';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },
  { path: 'user-dashboard', component: UserDashboard },
  { path: 'submit-ticket', component: SubmitTicket },
  { path: 'ticket-history', component: TicketHistory },
  { path: 'admin-dashboard', component: AdminDashboard },
  { path: 'tickets', component: Tickets },
  { path: 'users', component: Users },
  { path: 'settings', component: SettingsComponent },
  { path: 'profile', component: ProfileComponent }
];
