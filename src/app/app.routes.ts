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
import { USettings } from './u-settings/u-settings';
import { UProfile } from './u-profile/u-profile';
import { TechnicianDashboard } from './technician-dashboard/technician-dashboard';
import { MyTickets } from './my-tickets/my-tickets';
import { TechnicianSettings } from './technician-settings/technician-settings';
import { TechnicianProfile } from './technician-profile/technician-profile';
import { roleGuard } from './guards/role.guard';


export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },
  { path: 'user-dashboard', component: UserDashboard, canActivate: [roleGuard(['user'])] },
  { path: 'submit-ticket', component: SubmitTicket, canActivate: [roleGuard(['user'])] },
  { path: 'ticket-history', component: TicketHistory, canActivate: [roleGuard(['user'])] },
  { path: 'admin-dashboard', component: AdminDashboard, canActivate: [roleGuard(['admin'])] },
  { path: 'tickets', component: Tickets, canActivate: [roleGuard(['admin'])] },
  { path: 'users', component: Users, canActivate: [roleGuard(['admin'])] },
  { path: 'settings', component: SettingsComponent, canActivate: [roleGuard(['admin'])] },
  { path: 'profile', component: ProfileComponent, canActivate: [roleGuard(['admin'])] },
  { path: 'u-settings', component: USettings, canActivate: [roleGuard(['user'])] },
  { path: 'u-profile', component: UProfile, canActivate: [roleGuard(['user'])] },
  { path: 'technician-dashboard', component: TechnicianDashboard, canActivate: [roleGuard(['technician'])] },
  { path: 'my-tickets', component: MyTickets, canActivate: [roleGuard(['technician'])] },
  { path: 'technician-settings', component: TechnicianSettings, canActivate: [roleGuard(['technician'])] },
  { path: 'technician-profile', component: TechnicianProfile, canActivate: [roleGuard(['technician'])] },
];

