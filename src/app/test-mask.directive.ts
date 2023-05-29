import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[noRoundingCurrencyInput]'
})
export class NoRoundingCurrencyInputDirective {

  private currencySymbol: string = '';

  constructor(private el: ElementRef) { }

  @HostListener('focus')
  onFocus(): void {
    this.currencySymbol = '₹'; // Set the currency symbol on focus
    this.el.nativeElement.value = this.formatValue(this.el.nativeElement.value);
  }

  @HostListener('blur')
  onBlur(): void {
    this.currencySymbol = ''; // Clear the currency symbol on blur
    this.el.nativeElement.value = this.formatValue(this.el.nativeElement.value);
  }

  @HostListener('input', ['$event.target.value'])
  onInput(value: string): void {
    this.el.nativeElement.value = this.formatValue(value);
  }

  private formatValue(value: string): string {
    const parsedValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
    const formattedValue = isNaN(parsedValue) ? '' : parsedValue.toFixed(2);
    return `${this.currencySymbol}${formattedValue}`;
  }
}
