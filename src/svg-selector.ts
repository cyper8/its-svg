import { customElement, property, state } from "lit/decorators.js";
import { SVGView } from "./svg-view.js";
import { PropertyValueMap, TemplateResult, css, html, nothing } from "lit";

export type SVGSelectionResult = {
  element?: string;
  result?: string;
};

export type SVGSelectionEvent = CustomEvent<SVGSelectionResult> & {
  type: 'svg-selection-changed';
  composed: true;
}

export function isSelectable(element: any): element is SVGElement {
  return (
    element instanceof SVGElement &&
    !(element instanceof SVGSVGElement) &&
    !(element.classList.contains('grid'))
  )
}

export const getSelector = (element: Element | SVGElement) =>
  `${element.tagName.toLowerCase()}${element.classList
    .toString()
    .replace(' ', '.')}${element.id.length ? `#${element.id}` : ``}`;

@customElement('svg-selector')
export class SVGSelector extends SVGView {
  @property({ type: Object }) selection: Element | null = null;
  @state() _hovered: SVGElement | null = null;
  @state() _mx: number = 0;
  @state() _my: number = 0;

  static styles = [
    ...super.styles,
    css`
      @keyframes pathglow {
        50% {
          stroke: #0f0;
        }
      }

      @keyframes pathmayglow {
        50% {
          stroke: #f00;
        }
      }

      #container *[selected] {
        animation: pathglow 1s linear infinite;
      }

      #container :where(*:hover:not([selected])) {
        animation: pathmayglow 0.5s linear infinite;
      }

      #container :is(*:has(*:hover)) {
        animation: inherit;
      }

      
    .hover-label {
      position: absolute;
      top: 0px;
      left: 0px;
      background-color: white;
      border: solid 1px black;
      color: black;
      font-size: 8pt;
    }
    `,
  ];

  get result(): SVGSelectionResult {
    return {
      element: this.selection ? getSelector(this.selection) : undefined,
      result: this.selection?.outerHTML || undefined,
    };
  }

  protected _select(selection: SVGElement | null) {
    if (this.selection) this.selection.removeAttribute('selected');
    if (selection) {
      selection.setAttribute('selected', 'true');
    }
    this.selection = selection;
  }

  protected _release(_e: Event) {
    let target = _e.target;
    if (
      isSelectable(target) &&
      !target.hasAttribute('selected')
    ) {
      this._select(target);
    } else {
      this._select(null);
    }
  }

  protected _move(e: MouseEvent) {
    e.preventDefault();
    let target = e.target;
    this._mx = e.offsetX;
    this._my = e.offsetY;
    if (
      isSelectable(target)
    ) {
      this._hovered = target;
    } else {
      this._hovered = null;
    }
  }

  protected _clearSelectionControl(selection: string = '') {
    return html`<fieldset><button type=button @click=${() => this._select(null)} ?disabled=${selection === ''
      }>Очистити вибір: ${selection}</button></fieldset>`
  }

  protected updated(_changed: PropertyValueMap<SVGSelector>): void {
    super.updated(_changed);
    if (_changed.has('svgcontent')) {
      let container = this.svgCanvas();
      if (container instanceof SVGSVGElement) {
        container.addEventListener('mouseup', this._release.bind(this));
        container.addEventListener('mousemove', this._move.bind(this));
        container.addEventListener('mouseout', () => {
          this._hovered = null;
        });
      }
    }
    if (_changed.has('selection')) {
      this.dispatchEvent((new CustomEvent<SVGSelectionResult>('svg-selection-changed', {
        composed: true,
        bubbles: true,
        detail: this.result,
      })) as SVGSelectionEvent)
    }
  }

  render(): TemplateResult<1> {
    return html`
    ${this.svgcontent
        ? html`${this._clearSelectionControl(this.selection ? getSelector(this.selection) : undefined)}`
        : nothing}
    ${super.render()}
    ${this._hovered
        ? html`<div class="hover-label" style="top: ${this._my + 50 < this.clientHeight
          ? this._my + 20
          : this._my - 20
          }px; left: ${this._mx + 100 < this.clientWidth
            ? this._mx + 30
            : this._mx - 100
          }px" id="label">${getSelector(this._hovered)}</div>`
        : nothing
      }
    `
  }

}