import { TestBed } from '@angular/core/testing';

import { ConversationSocket } from './conversation-socket';

describe('ConversationSocket', () => {
  let service: ConversationSocket;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConversationSocket);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
