import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AReceberPage } from './a-receber.page';

describe('AReceberPage', () => {
  let component: AReceberPage;
  let fixture: ComponentFixture<AReceberPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AReceberPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
