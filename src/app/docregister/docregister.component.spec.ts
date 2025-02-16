import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocregisterComponent } from './docregister.component';

describe('DocregisterComponent', () => {
  let component: DocregisterComponent;
  let fixture: ComponentFixture<DocregisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DocregisterComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocregisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
