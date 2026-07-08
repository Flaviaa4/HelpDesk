import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class ChatComponent {
  chatOpen = false;

  newMessage = '';

  messages = [
    {
      sender: 'admin',
      text: 'Welcome to HelpDesk Support!',
    },
  ];

  toggleChat() {
    this.chatOpen = !this.chatOpen;
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;

    this.messages.push({
      sender: 'user',
      text: this.newMessage,
    });

    this.newMessage = '';

    setTimeout(() => {
      this.messages.push({
        sender: 'admin',
        text: 'Thank you. A support agent will assist you shortly.',
      });
    }, 1000);
  }
}
