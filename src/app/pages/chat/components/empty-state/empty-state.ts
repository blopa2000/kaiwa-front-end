import { Component } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  imports: [],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.css',
  host: {
    class: 'flex flex-1 h-full',
  },
})
export class EmptyState {}
