import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdfyabortComponent } from './idfyabort.component';

describe('IdfyabortComponent', () => {
  let component: IdfyabortComponent;
  let fixture: ComponentFixture<IdfyabortComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IdfyabortComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IdfyabortComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
