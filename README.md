# HelpDesk System

## About the Project
The HelpDesk System is a simple web application that helps people report IT problems (like internet issues or device failures),
and track how those problems are being solved.
It is designed to make communication between users and IT support teams easier and more organized.

## What the System Does

## For Users:
- Report a problem (create a ticket)
- Describe the issue
- Track the progress of their request
- Message the technician assigned to their ticket and get replies in real time

## For Technicians:
- Receives the tickets they were assigned to
- Resolves and Updates tickets statuses
- Message the user on a ticket and get replies in real time
- Set their own availability

## For Admins:
- View all reported issues
- Manage and assign tickets to technicians
- Manage Users by removing or editing them, and assign departments to technicians

## Credentials of default users

Accounts aren't seeded with fixed emails — a user's role is assigned automatically at sign-up based on their email domain:

- Normal User: any email ending in **@uhelpdesk.com**
- Technician: any email ending in **@thelpdesk.com**
- Admin: any email ending in **@ahelpdesk.com**

Sign up with an email in the matching domain to create an account with that role.

## How the System Works

The system has two main parts:

- **Frontend:** Angular application handling the interface and all user interactions
- **Firebase (Auth + Firestore):** Firebase Authentication manages sign-up/login, and Cloud Firestore acts as the real-time database, storing users, tickets, and ticket messages. There is no separate custom backend server — the frontend talks to Firebase directly, governed by Firestore security rules.


## What Has Been Built So Far

### User System
- Registration and login, with role assigned automatically by email domain
- Real-time dashboards for Users, Technicians, and Admins with live ticket counts and a recent-tickets view
- Ticket submission, with department and technician selection
- Ticket history and My Tickets pages with search, filtering, and pagination
- Admin tools to view all tickets, assign/reassign technicians, delete tickets, and manage users (including role filtering and department assignment)
- Per-ticket messaging between a user and their assigned technician, with unread indicators
- Sequential, human-readable ticket numbers (01, 02, ...)
- Real-time updates throughout — ticket status, assignment, and messages appear live without needing a page refresh

## Tools & Technologies Used

- **Angular CLI** - for project development & building
- **Firebase** – Authentication and Cloud Firestore for the real-time database
- **VS Code** – for development
- **Git & GitHub** – for version control

## Challenges Faced

During development, some challenges included:
- Fixing errors and debugging code
- Managing project structure
- Getting real-time Firestore updates to reliably refresh the UI

## What’s Next

The next steps are:
- Wiring up the Settings pages (Admin, User, Technician), which currently don't save anything
- Password reset ("Forgot password") flow
- Email notifications for ticket updates
- Automated tests

## Author
Flavienne    

## Purpose of This Project
This project is part of a learning journey to build a real-world system that solves practical problems and improves how people manage IT support.
