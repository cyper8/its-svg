import { customElement, state } from "lit/decorators.js";
import { SVGView } from "./svg-view";
import { PropertyValueMap, TemplateResult, css, html, nothing } from "lit";

export type SVGSelectionResult = {
  name: string;
  result: string;
};

export const getSelector = (element: Element | SVGElement) =>
  `${element.tagName.toLowerCase()}${element.classList
    .toString()
    .replace(' ', '.')}${element.id.length ? `#${element.id}` : ``}`;



@customElement('svg-selector')
export class SVGSelector extends SVGView {
  protected _mouse: 'select' | 'none' = 'none';
  @state() private _selection: Element | null = null;
  @state() protected _hovered: SVGElement | null = null;
  @state() protected _mx: number = 0;
  @state() protected _my: number = 0;

  static styles = [
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

  // get result(): SVGSelectionResult | undefined {
  //   if (this._selection instanceof SVGElement) {
  //     return {
  //       name: this.getSelector(this._selection),
  //       result: this._selection.outerHTML,
  //     };
  //   } else {
  //     let canvas = this.shadowRoot?.querySelector('div#canvas');
  //     if (canvas instanceof HTMLDivElement) {
  //       return {
  //         name: 'svg-view',
  //         result: canvas.innerHTML,
  //       };
  //     }
  //   }
  // }

  protected _over(e: MouseEvent) {
    e.preventDefault();
    if (this.svgcontent) {
      let target = e.target;
      this._mx = e.offsetX;
      this._my = e.offsetY;
      if (
        target instanceof SVGElement &&
        !target.classList.contains('grid') &&
        !target.tagName.toLowerCase().includes('svg')
      ) {
        this._hovered = target;
      } else {
        this._hovered = null;
      }
    }
  }


  protected _select(selection: SVGElement | null) {
    if (this._selection) this._selection.removeAttribute('selected');
    if (selection) {
      selection.setAttribute('selected', 'true');
    }
    this._selection = selection;
  }

  protected _press(_e: Event) {
    _e.preventDefault();
    this._mouse = 'select';
  }

  protected _release(_e: Event) {
    let target = _e.target;
    let mode = this._mouse;
    this._mouse = 'none';
    if (mode !== 'select') {
      return;
    }
    if (
      target instanceof SVGElement &&
      !target.hasAttribute('selected') &&
      !target.classList.contains('grid') &&
      !target.tagName.toLowerCase().includes('svg')
    ) {
      this._select(target);
    } else {
      this._select(null);
    }
  }

  protected _clearSelectionControl(selection: string = '') {
    return html`<fieldset><button type=button @click=${() => this._select(null)} ?disabled=${selection === ''
      }>Очистити вибір${selection}</button></fieldset>`
  }

  protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    if (_changedProperties.has('svgcontent')) {
      let canvas = this.shadowRoot?.querySelector('div.itssvg#canvas');
      if (canvas instanceof HTMLElement) {
        canvas.addEventListener('mousemove', this._over.bind(this));
        canvas.addEventListener('mouseout', () => {
          this._hovered = null;
        });
      }
    }
  }

  render(): TemplateResult<1> {
    return html`
    ${this.svgcontent
        ? html`${this._clearSelectionControl(this._selection ? getSelector(this._selection) : undefined)}`
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