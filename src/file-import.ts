import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import newFileIcon from './new-file-icon.js';
import clearFileIcon from './clear-file-icon.js';
import buttonStyling from './button.css.js';

export interface ImportResult {
  file: File;
}

export type ImportEvent = CustomEvent<ImportResult>;
export type FileClearedEvent = CustomEvent;

type FileImportEventMap = HTMLElementEventMap & {
  fileready: ImportEvent;
  filecleared: CustomEvent;
};

@customElement('file-import')
export class FileImport extends LitElement {
  @property({ type: Boolean, attribute: true, reflect: true }) disabled: boolean = false;
  @property({ type: Object, attribute: false }) file?: File;
  @property({ type: String }) type: string = '.txt, text/plain';

  render() {
    return html`
      <input id="open-file" ?disabled="${this.disabled}" @change=${this._fileSelected} type=file accept="${this.type
      }" />
        ${this.file
        ? html`<label class="button delete" ?disabled="${this.disabled}" role="button" alt="Clear" @click=${this._clearFile}>${this.file.name}${clearFileIcon}</label>`
        : html`<label role="button" ?disabled="${this.disabled}" class="button add" for="open-file">${newFileIcon}Файл</label>`
      }
    `;
  }

  private _clearFile() {
    let input =
      this.shadowRoot?.querySelector<HTMLInputElement>('input#open-file');
    if (input) {
      input.value = '';
      this.file = undefined;
      this.dispatchEvent(
        new CustomEvent('filecleared', {
          cancelable: true,
          bubbles: true,
        })
      );
    }
  }

  addEventListener(
    event: keyof (FileImportEventMap | HTMLElementEventMap),
    handler: (e: Event) => void
  ): void {
    super.addEventListener(event, handler);
  }

  private _fileSelected(e: Event) {
    let input = e.target as HTMLInputElement;
    let file = input.files?.item(0);
    if (file instanceof File) {
      this.file = file;
      this.dispatchEvent(
        new CustomEvent<ImportResult>('fileready', {
          bubbles: true,
          cancelable: true,
          detail: {
            file: this.file,
          },
        })
      );
    }
  }

  static styles = [
    buttonStyling(),
    css`
    :host {
      font-family: sans-serif;
      text-align: center;
    }

    input[type=file] {
      display: none;
    }

    progress {
      width: 100%
    }
  `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'file-import': FileImport;
  }
}
