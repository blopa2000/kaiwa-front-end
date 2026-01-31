import { TestBed } from '@angular/core/testing';

import { RoomsSocket } from './rooms-socket';

describe('RoomsSocket', () => {
  let service: RoomsSocket;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RoomsSocket);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
