import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarRentalEdit } from './car-rental-edit';

describe('CarRentalEdit', () => {
  let component: CarRentalEdit;
  let fixture: ComponentFixture<CarRentalEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarRentalEdit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarRentalEdit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
