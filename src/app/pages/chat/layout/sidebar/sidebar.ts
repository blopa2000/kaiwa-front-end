import { Component } from '@angular/core';
import { UserSearch } from '../../components/user-search/user-search';
import { ChatList } from '../../components/chat-list/chat-list';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [UserSearch, ChatList],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {}
