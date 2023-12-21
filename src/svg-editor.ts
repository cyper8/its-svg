import { customElement, property, state } from "lit/decorators.js";
import { SVGView } from "./svg-view.js";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import { PropertyValueMap, css, html, nothing, svg } from "lit";
import { FileChangeResult, FileChangeEvent } from "./FileAccessor.js";
import baseCss from "./base.css.js";
import buttonCss from "./button.css.js";

const ALBUM = 297 / 210;
const PORTRAIT = 210 / 297;

@customElement('svg-editor')
export class SVGEditor extends SVGView {
  protected _mouse: 'move' | 'none' = 'none';

  @state() private _factor: number = 1;
  @state() private _x: number = 0;
  @state() private _y: number = 0;
  @state() private _r: number = 0;
  @property({ type: Number }) gridscale: number = 0;
  @property({ type: String }) gridunit: string = 'м';
  @property({ type: Boolean }) measure: boolean = false;

  static styles = [
    baseCss(),
    buttonCss(),
    css`
      #content {
        display: block;
      }
    `
  ]

  protected _over(e: MouseEvent) {
    e.preventDefault();
    let canvas = this.shadowRoot?.querySelector('div#canvas');
    if (canvas instanceof HTMLDivElement) {
      if (e.buttons === 1) {
        this._mouse = 'move';
        let deltaX =
          e.movementX * Math.cos(-this._r * (Math.PI / 180)) +
          e.movementY * Math.sin(this._r * (Math.PI / 180));
        let deltaY =
          e.movementX * Math.sin(-this._r * (Math.PI / 180)) +
          e.movementY * Math.cos(this._r * (Math.PI / 180));
        this._x += (deltaX / this._factor);
        this._y += (deltaY / this._factor);
      } else {
        this._mouse = 'none';
        let ruller = canvas.querySelector('use#use-ruller');
        if (ruller instanceof SVGUseElement) {
          if (e.ctrlKey) {
            ruller.setAttribute('x', e.offsetX + '');
            ruller.setAttribute('y', e.offsetY + '');
          } else {
            ruller.setAttribute('x', '0');
            ruller.setAttribute('y', '0');
          }
        }
      }
    }
  }

  protected _scale(event: WheelEvent) {
    event.preventDefault();
    let canvas = this.shadowRoot?.querySelector('div#canvas');
    if (canvas instanceof HTMLDivElement) {
      if (this._mouse !== 'none') return;
      if (this.svgcontent) {
        if (event.shiftKey) {
          // ROTATE
          let deltaR = (event.shiftKey ? 1 : 5) * (event.deltaY > 0 ? -1 : 1);
          let r = this._r + deltaR;
          this._r = r;
        } else {
          // SCALE
          let UP = event.deltaY > 0 ? 1 : -1;
          this._factor = this._factor + (UP * (event.ctrlKey ? 0.005 : 0.05));
        }
      }
    }
  }


  protected _wrapEditor(content: string, factor: number, angle: number, x: number, y: number) {
    return `<g class="itssvg" id="content" style="transform-origin: center center"
    transform="scale(${factor}) rotate(${angle}) translate(${x} ${y})">
      ${content}
    </g>`
  }

  protected _unwrapEditor(container: Element) {
    // unwrap editor information
    const ROTATION = SVGTransform.SVG_TRANSFORM_ROTATE;
    const TRANSLATION = SVGTransform.SVG_TRANSFORM_TRANSLATE;
    const SCALING = SVGTransform.SVG_TRANSFORM_SCALE;
    this._r = 0;
    this._factor = 1;
    this._x = 0;
    this._y = 0;
    let gcontent = container.querySelector<SVGGElement>('g#content.itssvg');
    if (gcontent instanceof SVGGElement) { // get shift, angle and scale from wrapper if any
      for (const op of gcontent.transform.baseVal) {
        switch (op.type) {
          case ROTATION:
            this._r = op.angle;
            break;
          case SCALING:
            this._factor = op.matrix.a || op.matrix.d;
            break;
          case TRANSLATION:
            this._x = op.matrix.e;
            this._y = op.matrix.f;
          default:

        }
      }
    }
    return (gcontent || container);
  }

  protected _unwrapScaleRuller(container: Element) {
    // unwrap gridscale info
    let gridscale = container.querySelector<SVGTextElement>('#ruller text#gridscale');
    if (gridscale instanceof SVGTextElement) { // get grid value and unit if any
      let grid = gridscale.textContent || '';
      this.gridscale = parseInt(grid);
      if (this.gridscale) {
        this.gridunit = grid.includes('км') ? 'км' : 'м';
      }
    }
    return container
  }

  protected _editorControl() {
    return html`<fieldset>
    <button @click=${() => {
        if (this.aspect === ALBUM) {
          this.aspect = PORTRAIT;
        } else {
          this.aspect = ALBUM;
        }
      }} type=button>${this.aspect === ALBUM ? 'Портретна' : 'Альбомна'
      }</button>
  </fieldset>
  ${this._scaleRullerControl(this.gridscale, this.gridunit)}
  <fieldset class="tip">
    Масштабувати: скрол (або скрол + control).
    Обертати навколо центру: скрол + shift.
  </fieldset>`
  }

  protected _scaleRullerControl(value: number, unit: string) {
    return html`<fieldset>
    <label>Шкала масштабу:
      <input style="width: 3em" type=number value="${value}" @input=${(e: Event) => {
        let input = e.target;
        if (input instanceof HTMLInputElement)
          this.gridscale = input.valueAsNumber;
      }}/>
      <select @change=${(e: Event) => {
        let sel = e.target;
        if (sel instanceof HTMLSelectElement) {
          this.gridunit = sel.value;
        }
      }}>
        <option value="м" ?selected=${unit === 'м'}>м</option>
        <option value="км" ?selected=${unit === 'км'
      }>км</option>
      </select>
    </label>
  </fieldset>`
  }

  protected _initializeHandlers(container: HTMLElement) {
    container.addEventListener('wheel', this._scale.bind(this));
    container.addEventListener('mousemove', this._over.bind(this));
  }

  protected firstUpdated(_changedProperties: PropertyValueMap<SVGEditor> | Map<PropertyKey, unknown>): void {
    this._initializeHandlers(this);
  }

  protected _ruller(unit: string, value: number, width: number = 250) {
    return `
      <symbol id="ruller" viewBox="0 0 250 25" width="${width}">
        <style>
          #ruller-path {
            stroke: black;
            stroke-width: 1px;
            fill: none;
          }
  
          .scale-text {
            text-anchor: middle;
            font-family: sans-serif;
            font-size: 10pt;
            fill: #000;
            stroke: none;
          }
        </style>
          <rect id="ruller-bg" stroke="none" fill="rgba(255,255,255,0.5)" width="250" height="25"></rect>
          <path id="ruller-path" stroke="#000" stroke-width="1px" fill="none" d="M 25,15 l 0,5 l 200,0 l 0,-5 m -50,0 l 0,5 m -50,0 l 0,-5 m -50,0 l 0,5" />
          <text class="scale-text" x="25" y="14">${0}</text>
          <text class="scale-text" x="75" y="14">${value / 4
      }</text>
          <text class="scale-text" x="125" y="14">${value / 2
      }</text>
          <text class="scale-text" x="175" y="14">${value * (3 / 4)
      }</text>
          <text id="scalevalue" class="scale-text" x="225" y="14">${value} ${unit}</text>
    </symbol>
    ${value
        ? `<use id="use-ruller" href="#ruller"/>`
        : ''
      }
    `;
  }

  protected updated(_changed: PropertyValueMap<SVGEditor>): void {
    super.updated(_changed);
    if (_changed.has('_x')
      || _changed.has('_y')
      || _changed.has('_w')
      || _changed.has('_h')
      || _changed.has('_r')
      || _changed.has('aspect')
      || _changed.has('gridscale')
      || _changed.has('gridunit')) {
      let container = this.shadowRoot?.querySelector('div#canvas');
      if (container && this.svgcontent && this.fileAccessor) {
        this.dispatchEvent(
          new CustomEvent<FileChangeResult>('file-changed', {
            composed: true,
            bubbles: true,
            detail: {
              name: this.fileAccessor.file.name,
              content: container.innerHTML,
              options: {
                type: 'image/svg+xml',
              },
            },
          } as FileChangeEvent)
        );
      }
    }
  }

  protected _unwrap(content: string): Element {
    let wrapper = super._unwrap(content);
    wrapper = this._unwrapScaleRuller(wrapper);
    wrapper = this._unwrapEditor(wrapper);
    return wrapper;
  }

  protected _wrap(content: string, width: number, height: number) {
    return super._wrap(
      `${this._wrapEditor(content, this._factor, this._r, this._x, this._y)}${this._ruller(this.gridunit, this.gridscale, width / 3.3)}`,
      width,
      height)
  }

  render() {
    return html`
    ${this.svgcontent ? html`${this._editorControl()}` : nothing}
    ${super.render()}
    `
  }

}