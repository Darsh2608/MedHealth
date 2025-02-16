import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdfyerrorComponent } from './idfyerror.component';

describe('IdfyerrorComponent', () => {
  let component: IdfyerrorComponent;
  let fixture: ComponentFixture<IdfyerrorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IdfyerrorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IdfyerrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
