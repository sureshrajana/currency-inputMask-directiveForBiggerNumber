import {
  OnInit,
  Directive,
  HostListener,
  ElementRef,
  forwardRef,
  Input,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import Big from 'big.js';
import 'intl';
import 'intl/locale-data/jsonp/en';

export const CURRENCY_INPUT_MASK_DIRECTIVE_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => CurrencyInputMaskDirective),
  multi: true,
};

@Directive({
  selector: '[appCurrencyInputMask]',
  providers: [CURRENCY_INPUT_MASK_DIRECTIVE_VALUE_ACCESSOR, DecimalPipe],
})
export class CurrencyInputMaskDirective
  implements ControlValueAccessor, OnInit
{
  private el: HTMLInputElement;
  private onModelChange: Function;
  private onModelTouched: Function;
  private lastNumVal: number;
  private DECIMAL_MARK = '.';

  constructor(
    private elementRef: ElementRef,
  ) {}

  ngOnInit() {
    this.el = this.elementRef.nativeElement;
  }

  @Input() currencySymbol: string = '$';

  @HostListener('focus', ['$event'])
  handleFocus(event: any) {
    const strVal: string = this.getInputValue();
    const unmaskedStr: string = this.getUnmaskedValue(strVal);
    this.updateInputValue(unmaskedStr);
  }

  @HostListener('cut', ['$event'])
  handleCut(event: any) {
    setTimeout(() => {
      this.inputUpdated();
    }, 0);
  }

  @HostListener('keypress', ['$event'])
  handleKeypress(event: any) {
    // Restrict characters
    const charCode: number = event.which;
    const isControlChar: boolean = charCode <= 31;
    if (isControlChar) {
      // Allow control characters like backspace, move up, move down, etc.
      return;
    }
    const newChar: string = String.fromCharCode(charCode);
    const allowedChars: RegExp = /^[\d.]+$/;
    if (!allowedChars.test(newChar)) {
      event.preventDefault();
      return;
    }
    // Handle decimal mark input
    const currentValue: string = event.target.value;
    const separatorIdx: number = currentValue.indexOf(this.DECIMAL_MARK);
    const hasFractionalPart: boolean = separatorIdx >= 0;
    if (!hasFractionalPart || newChar !== this.DECIMAL_MARK) {
      return;
    }
    const isOutsideSelection = !this.isIdxBetweenSelection(separatorIdx);
    if (isOutsideSelection) {
      const positionAfterMark = separatorIdx + 1;
      this.setCursorPosition(positionAfterMark);
      event.preventDefault();
      return;
    }
  }

  @HostListener('input', ['$event'])
  handleInput(event: any) {
    this.inputUpdated();
  }

  @HostListener('paste', ['$event'])
  handlePaste(event: any) {
    setTimeout(() => {
      this.inputUpdated();
    }, 1);
  }

  @HostListener('blur', ['$event'])
  handleBlur(event: any) {
    const strVal: string = this.getInputValue();
    const numVal: number = this.convertStrToDecimal(strVal);
    this.maskInput(numVal);
    this.onModelTouched.apply(event);
  }

  registerOnChange(callbackFunction: Function): void {
    this.onModelChange = callbackFunction;
  }

  registerOnTouched(callbackFunction: Function): void {
    this.onModelTouched = callbackFunction;
  }

  setDisabledState(value: boolean): void {
    this.el.disabled = value;
  }

  writeValue(numValue: Big): void {
    this.maskInput(numValue);
  }
  private maskInput(numVal: Big): void {
    if (!this.isNumeric(numVal)) {
      this.updateInputValue('');
      return;
    }
    const newVal: string = this.transformWithPipe(numVal);
    this.updateInputValue(newVal);
  }

  private inputUpdated() {
    this.restrictDecimalValue();
    const strVal: string = this.getInputValue();
    const unmaskedVal: string = this.getUnmaskedValue(strVal);
    const numVal: Big = this.convertStrToDecimal(unmaskedVal);
    if (!numVal.eq(this.lastNumVal)) {
      this.lastNumVal = numVal;
      this.onModelChange(numVal);
    }
  }

  private restrictDecimalValue(): void {
    const strVal: string = this.getInputValue();
    const dotIdx: number = strVal.indexOf(this.DECIMAL_MARK);
    const hasFractionalPart: boolean = dotIdx >= 0;
    if (hasFractionalPart) {
      const fractionalPart: string = strVal.substring(dotIdx + 1);
      if (fractionalPart.length > 2) {
        const choppedVal: string = strVal.substring(0, dotIdx + 3);
        this.updateInputValue(choppedVal, true);
        return;
      }
    }
  }

  private formatBigCurrency(value: Big, currency: string = '$'): string {
    const [integerPart, fractionalPart] = value.toFixed(2).split('.');
    const integerPartWithCommas = integerPart.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      ','
    );
    return `${this.currencySymbol} ${integerPartWithCommas}.${fractionalPart}`;
  }

  private transformWithPipe(value: Big): string {
    return this.formatBigCurrency(value);
  }

  private getUnmaskedValue(value: string): string {
    return value.replace(/[^-\d\\.]/g, '');
  }

  private updateInputValue(value: string, savePosition = false) {
    if (savePosition) {
      this.saveCursorPosition();
    }
    this.el.value = value;
  }

  private getInputValue(): string {
    return this.el.value;
  }

  private convertStrToDecimal(str: string): Big {
    return this.isNumeric(str) ? new Big(str) : null;
  }

  private convertDecimalToStr(n: Big): string {
    return this.isNumeric(n) ? n.toString() : '';
  }

  private isNumeric(n: any): boolean {
    try {
      new Big(n);
      return true;
    } catch (e) {
      return false;
    }
  }
  private saveCursorPosition() {
    const position: number = this.el.selectionStart;
    setTimeout(() => {
      this.setCursorPosition(position);
    }, 1);
  }

  private setCursorPosition(position: number) {
    this.el.selectionStart = position;
    this.el.selectionEnd = position;
  }

  private isIdxBetweenSelection(idx: number) {
    if (this.el.selectionStart === this.el.selectionEnd) {
      return false;
    }
    return idx >= this.el.selectionStart && idx < this.el.selectionEnd;
  }
}
