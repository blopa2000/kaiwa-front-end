import { TestBed } from '@angular/core/testing';

import { PresenceSocket } from './presence-socket';

describe('PresenceSocket', () => {
  let service: PresenceSocket;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PresenceSocket);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
