import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserCreation } from './user-creation';

describe('UserCreation', () => {
  let component: UserCreation;
  let fixture: ComponentFixture<UserCreation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserCreation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserCreation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
