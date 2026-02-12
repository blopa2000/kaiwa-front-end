import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

// Define la interfaz del usuario (ajústala según tu modelo)
interface User {
  id: string | number;
  username: string;
  first_name: string;
  last_name: string;
  photo?: string;
  status?: 'online' | 'offline' | 'typing';
  email?: string;
  phone?: string;
  bio?: string;
}

@Component({
  selector: 'app-user-info-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-info-panel.html',
  styleUrl: './user-info-panel.css',
})
export class UserInfoPanelComponent {
  @Input() user: User | null = null;
  @Input() isMobile = false;
  @Output() closeConversation = new EventEmitter<void>();
  @Output() backToConversation = new EventEmitter<void>();

  onCloseConversation(): void {
    this.closeConversation.emit();
  }

  onBackToConversation(): void {
    this.backToConversation.emit();
  }
}
