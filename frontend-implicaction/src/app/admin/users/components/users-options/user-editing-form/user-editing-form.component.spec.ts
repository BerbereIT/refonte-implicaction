import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserEditingFormComponent } from './user-editing-form.component';

describe('UserEditingFormComponent', () => {
  let component: UserEditingFormComponent;
  let fixture: ComponentFixture<UserEditingFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserEditingFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserEditingFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
