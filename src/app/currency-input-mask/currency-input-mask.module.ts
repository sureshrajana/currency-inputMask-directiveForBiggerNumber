import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NoRoundingCurrencyInputDirective } from '../test-mask.directive';

import { CurrencyInputMaskDirective } from './currency-input-mask.directive';

@NgModule({
  imports: [CommonModule, FormsModule],
  declarations: [CurrencyInputMaskDirective, NoRoundingCurrencyInputDirective],
  exports: [CurrencyInputMaskDirective],
})
export class CurrencyInputModule {}
