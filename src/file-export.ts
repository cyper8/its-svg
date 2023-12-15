import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import buttonStyling from './button.css.js';

@customElement('file-export')
export class FileExport extends LitElement {
  @property({ type: Object, attribute: false }) file?: File;
  @property({ type: Boolean }) disabled: boolean = false;
  @property({ type: String }) label: string = 'Зберегти';

  static styles = [
    buttonStyling(),
    css`
      :host {
        font-family: sans-serif;
        text-align: center;
      }
      .hidden {
        display: none
      }
    `,
  ];

  private _dataURL(content: File) {
    return URL.createObjectURL(content);
  }

  private _download(e: Event) {
    e.preventDefault();
    let root = this.shadowRoot;
    if (root && this.file) {
      let link = root.querySelector('a#download');
      if (link instanceof HTMLAnchorElement) {
        URL.revokeObjectURL(link.href);
        link.remove();
      } else {
        link = document.createElement('a');
        if (link instanceof HTMLAnchorElement) {
          link.id = 'download';
          link.className = '.hidden';
          link.download = this.file.name || 'file';
          link.href = this._dataURL(this.file);
          root.appendChild(link);
          link.click();
        }
      }
    }
  }

  render() {
    return html`
      <label role="button" class="button" ?disabled=${!this.file || this.disabled} @mousedown="${this._download
      }" @mouseup="${this._download}">${this.label} ${this.file?.name || ''
      }</label>
    `;
  }
}
