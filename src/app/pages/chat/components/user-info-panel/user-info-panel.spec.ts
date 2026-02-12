import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserInfoPanel } from './user-info-panel';

describe('UserInfoPanel', () => {
  let component: UserInfoPanel;
  let fixture: ComponentFixture<UserInfoPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserInfoPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserInfoPanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
