import { Component } from '@angular/core';
import { UserSearch } from '../../components/user-search/user-search';
import { ChatList } from '../../components/chat-list/chat-list';
import { UserMenuComponent } from '../../components/user-menu/user-menu';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [UserSearch, ChatList, UserMenuComponent],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {}
