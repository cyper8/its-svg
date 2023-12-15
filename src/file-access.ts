import { LitElement, PropertyValues, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import './file-import.js';
import './file-export.js';
import { ImportEvent } from './file-import.js';
import {
  FileAccessCompatible,
  FileAccessor,
  FileChangeEvent,
} from './FileAccessor.js';

@customElement('file-access')
export class FileAccess extends LitElement {
  @property({ type: Object }) accessor?: FileAccessor;
  @property({ type: Boolean }) changed: boolean = false;
  @property({ type: String, attribute: 'type' }) type: string =
    '.txt, text/plain';

  static get styles() {
    return css`
    :host, .panel {
      display: flex;
      flex-wrap: wrap;
      flex: 1 1;
    }
    ::slotted(:not(.panel)) {
      flex-basis: 100%;
    }
    `;
  }

  private _distribute(
    accessor: FileAccessor | undefined,
    slot?: HTMLSlotElement
  ) {
    let target = slot || this.shadowRoot?.querySelector('slot');
    if (target instanceof HTMLSlotElement) {
      target.assignedElements({ flatten: true }).forEach((e) => {
        if ('fileAccessor' in e) {
          (e as FileAccessCompatible).fileAccessor = accessor;
          (e as FileAccessCompatible).addEventListener('file-changed', this._handleFileChange.bind(this));
        }
        console.log(`handed file access to ${e}`);
      });
    }
  }

  private __giveout(event: Event) {
    if (this.accessor) {
      let slot = event.target;
      if (slot instanceof HTMLSlotElement) {
        this._distribute(this.accessor, slot);
      }
    }
  }

  private _handleFileChange(e: FileChangeEvent) {
    console.log('file change');
    if (this.accessor) {
      this.accessor.write(e.detail.content).then(() => this.changed = this.accessor?.changed || false);
    } else {
      this.accessor = new FileAccessor(
        new File(
          [e.detail.content],
          e.detail.name || 'unnamed',
          e.detail.options
        )
      );
      this.changed = false;
    }
  }

  updated(_changed: PropertyValues<FileAccess>) {
    if (_changed.has('accessor')) {
      this._distribute(this.accessor);
    }
  }

  render() {
    return html`<div class="panel">
     <file-import type="${this.type}" @fileready="${(e: ImportEvent) => {
        this.accessor = new FileAccessor(e.detail.file);
      }}" @filecleared="${() => {
        this.accessor = undefined;
      }}"></file-import>
      ${this.accessor
        ? html`<file-export ?disabled=${!(this.changed)} .file=${this.accessor.file}></file-export>`
        : nothing}
    </div>
    <slot @slotchange="${this.__giveout}"></slot>`;
  }
}
