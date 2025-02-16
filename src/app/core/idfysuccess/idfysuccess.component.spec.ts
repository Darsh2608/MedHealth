import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdfysuccessComponent } from './idfysuccess.component';

describe('IdfysuccessComponent', () => {
  let component: IdfysuccessComponent;
  let fixture: ComponentFixture<IdfysuccessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IdfysuccessComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IdfysuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
