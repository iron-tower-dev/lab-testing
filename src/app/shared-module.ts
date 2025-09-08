import { CommonModule } from '@angular/common';
import { NgModule, Type } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatRippleModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { RouterModule } from '@angular/router';

const sharable: Type<any>[] = [
  MatIconModule,
  MatButtonModule,
  MatDialogModule,
  MatCardModule,
  MatFormFieldModule,
  MatSelectModule,
  MatListModule,
  MatInputModule,
  MatRippleModule,
  MatRadioModule,
  MatTooltipModule,
  MatSnackBarModule,
  MatProgressSpinnerModule,
  MatCheckboxModule,
  CommonModule,
  RouterModule,
  ReactiveFormsModule,
];

@NgModule({
  imports: [...sharable],
  exports: [...sharable],
})
export class SharedModule {}
