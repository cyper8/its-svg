import { LitElement, PropertyValues, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { SvgFileReader } from './SvgFileReader.js';
import { FileAccessor } from './FileAccessor.js';

export interface SVGImportResult {
  filename: string;
  content: string;
}

export interface SVGImportedEvent extends CustomEvent<SVGImportResult> {
  type: 'svg-imported';
}

interface SVGImportEventMap extends HTMLElementEventMap {
  'svg-imported': SVGImportedEvent;
}

@customElement('svg-import')
export class SVGImport extends LitElement {
  @property({ type: Object }) file?: FileAccessor;
  //@property({ type: Object }) svgFile: SvgFileReader = new SvgFileReader(this);
  @property({ type: String, attribute: 'accessor-name' }) accessorName: string =
    'svgfile';

  addEventListener<E extends keyof SVGImportEventMap>(
    type: E,
    listener: (this: HTMLElement, event: Event) => any,
    options?: boolean | AddEventListenerOptions | undefined
  ): void {
    super.addEventListener(type, listener, options);
  }

  private __dispense(svgfile: SvgFileReader) {
    let slot = this.shadowRoot?.querySelector('slot');
    if (slot instanceof HTMLSlotElement) {
      slot.assignedElements({ flatten: true }).forEach((e) => {
        Object.defineProperty(e, this.accessorName, {
          value: svgfile,
          enumerable: true,
          configurable: true,
        });
        console.log(`handed svg file access to ${e}`);
      });
    }
  }

  private __giveout(_event: Event) {
    if (this.svgFile) {
      this.__dispense(this.svgFile);
    }
  }

  updated(_changes: PropertyValues<SVGImport>) {
    if (_changes.has('file')) {
      if (this.file) {
        this.svgFile.read(this.file).then((_content) => {
          this.__dispense(this.svgFile);
          this.dispatchEvent(
            new CustomEvent<SVGImportResult>('svg-imported', {
              bubbles: true,
              cancelable: true,
              composed: true,
              detail: {
                filename: this.svgFile.file!.name,
                content: _content,
              },
            }) as SVGImportedEvent
          );
        });
      }
    }
  }

  render() {
    return html`<slot @slotchange="${this.__giveout}"></slot>`;
  }
}
