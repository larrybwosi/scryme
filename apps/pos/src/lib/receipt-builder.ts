export class ReceiptBuilder {
  private data: string = '';

  // ESC/POS Command Constants
  private CMD = {
    INIT: '\x1B\x40',
    TEXT_CENTER: '\x1B\x61\x01',
    TEXT_LEFT: '\x1B\x61\x00',
    BOLD_ON: '\x1B\x45\x01',
    BOLD_OFF: '\x1B\x45\x00',
    CUT: '\x1D\x56\x42\x00',
  };

  constructor() {
    this.data = this.CMD.INIT;
  }

  text(txt: string) {
    this.data += txt;
    return this;
  }

  center(txt: string) {
    this.data += this.CMD.TEXT_CENTER + txt + this.CMD.TEXT_LEFT;
    return this;
  }

  bold(txt: string) {
    this.data += this.CMD.BOLD_ON + txt + this.CMD.BOLD_OFF;
    return this;
  }

  line(count = 1) {
    this.data += '\n'.repeat(count);
    return this;
  }

  cut() {
    this.data += this.CMD.CUT;
    return this;
  }

  build() {
    return this.data;
  }
}
