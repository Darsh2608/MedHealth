import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HoslistComponent } from './hoslist.component';

describe('HoslistComponent', () => {
  let component: HoslistComponent;
  let fixture: ComponentFixture<HoslistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HoslistComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HoslistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
