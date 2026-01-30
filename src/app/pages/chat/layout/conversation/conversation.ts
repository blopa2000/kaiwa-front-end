import { Component, inject } from '@angular/core';
import { ChatStore } from '../../../../core/services/chat-store';
import { EmptyState } from '../../components/empty-state/empty-state';

@Component({
  selector: 'app-conversation',
  standalone: true,
  imports: [EmptyState],
  templateUrl: './conversation.html',
})
export class Conversation {
  chatStore = inject(ChatStore);
}
