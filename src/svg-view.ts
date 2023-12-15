import { LitElement, PropertyValueMap, PropertyValues, css, html, nothing, svg } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import buttonStyling from './button.css.js';
import {
  FileAccessCompatible,
  FileAccessor,
  FileChangeEvent,
  FileChangeResult,
} from './FileAccessor.js';

const xmlns = 'http://www.w3.org/2000/svg';

const ALBUM = 297 / 210;
const PORTRAIT = 210 / 297;

export type SVGViewSelection = {
  name: string;
  result: string;
};

export const getSelector = (element: Element | SVGElement) =>
  `${element.tagName.toLowerCase()}${element.classList
    .toString()
    .replace(' ', '.')}${element.id.length ? `#${element.id}` : ``}`;


@customElement('svg-view')
export class SVGView extends LitElement implements FileAccessCompatible {
  private _mouse: 'select' | 'move' | 'none' = 'none';

  //@state() private _svg: SVGSVGElement | null = null;
  @state() private _hovered: SVGElement | null = null;
  @state() private _mx: number = 0;
  @state() private _my: number = 0;
  @state() private _selection: Element | null = null;
  @state() private _factor: number = 1;
  @state() private _x: number = 0;
  @state() private _y: number = 0;
  @state() private _r: number = 0;
  @state() private _ref: boolean = false;
  @property({ type: Object }) fileAccessor: FileAccessor | undefined;
  @property({ type: String }) svgcontent?: string;
  @property({ type: Number }) gridscale: number = 0;
  @property({ type: String }) gridunit: string = 'м';
  @property({ type: Number }) aspect: number = ALBUM;

  getSelector = getSelector;

  get result(): SVGViewSelection | undefined {
    if (this._selection instanceof SVGElement) {
      return {
        name: this.getSelector(this._selection),
        result: this._selection.outerHTML,
      };
    } else {
      let canvas = this.shadowRoot?.querySelector('div#canvas');
      if (canvas instanceof HTMLDivElement) {
        return {
          name: 'svg-view',
          result: canvas.innerHTML,
        };
      }
    }
  }

  static styles = [
    buttonStyling(),
    css`
    :host, #canvas {
      display: block;
      position: relative;
      font-family: sans-serif;
    }

    fieldset {
      display: inline-block; 
      font-size: 0.8em;
      padding: 0.3em;
    }

    #canvas {
      overflow: hidden;
      cursor: crosshair;
      background-color: #ffffff;
      max-height: 80vh;
      border: solid 1px black;
    }

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

    #content *[selected] {
      animation: pathglow 1s linear infinite;
    }

    #content :where(*:hover:not([selected])) {
      animation: pathmayglow 0.5s linear infinite;
    }

    #content :is(*:has(*:hover)) {
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

  private _over(e: MouseEvent) {
    if (this.svgcontent) {
      this._mx = e.offsetX;
      this._my = e.offsetY;
      let target = e.target;
      if (
        target instanceof SVGElement &&
        !target.classList.contains('grid') &&
        !target.tagName.toLowerCase().includes('svg')
      ) {
        this._hovered = target;
      } else {
        this._hovered = null;
      }
      if (this._mouse === 'none' && e.ctrlKey) {
        this._ref = true;
      } else {
        this._ref = false;
      }
      if (e.buttons === 1) {
        this._mouse = 'move';
        let deltaX =
          e.movementX * Math.cos(-this._r * (Math.PI / 180)) +
          e.movementY * Math.sin(this._r * (Math.PI / 180));
        let deltaY =
          e.movementX * Math.sin(-this._r * (Math.PI / 180)) +
          e.movementY * Math.cos(this._r * (Math.PI / 180));
        this._x += deltaX;
        this._y += deltaY;
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

  private _press(_e: Event) {
    this._mouse = 'select';
  }

  private _release(_e: Event) {
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

  private _scale(event: WheelEvent) {
    //const STEP = 20;
    event.preventDefault();
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

  protected update(changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    if (changedProperties.has('svgcontent')) {
      if (this.svgcontent) {
        this.svgcontent = this._unwrap(this.svgcontent);
      }
    }
    super.update(changedProperties);
  }

  updated(_changed: PropertyValues<SVGView>) {
    if (_changed.has('fileAccessor')) {
      if (this.fileAccessor) {
        this.fileAccessor
          .readText()
          .then((content) => (this.svgcontent = content));
      } else {
        this.svgcontent = undefined;
      }
    }
    if (_changed.has('_x')
      || _changed.has('_y')
      || _changed.has('_w')
      || _changed.has('_h')
      || _changed.has('_r')
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

  private _unwrap(content: string): string {
    const ROTATION = SVGTransform.SVG_TRANSFORM_ROTATE;
    const TRANSLATION = SVGTransform.SVG_TRANSFORM_TRANSLATE;
    const SCALING = SVGTransform.SVG_TRANSFORM_SCALE;
    this._r = 0;
    this._factor = 1;
    this._x = 0;
    this._y = 0;
    if (content.includes('itssvg')) {
      let temp = document.createElement('div');
      //temp.style.display = 'none';
      //this.appendChild(temp);
      temp.innerHTML = content;
      let gcontent = temp.querySelector('g#content');
      if (gcontent instanceof SVGGElement) {
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
      let gridscale = temp.querySelector('text#gridscale');
      if (gridscale instanceof SVGTextElement) {
        let grid = gridscale.textContent || '';
        this.gridscale = parseInt(grid);
        if (this.gridscale) {
          this.gridunit = grid.includes('км') ? 'км' : 'м';
        }
      }
      return gcontent?.innerHTML || content;
      //this.removeChild(temp);
    }
    return content;
  }

  private _wrap(content: string, width: number, height: number) {
    return html`<svg 
    id="container"
    style="aspect-ratio: ${this.aspect}"
    class="itssvg"
    viewBox="0 0 ${width} ${height}"
    xmlns="${xmlns}">
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

      #content {
        transform-origin: center center;
      }
    </style>
    <symbol id="ruller" viewBox="0 0 250 25" width="250" height="25">
      <rect id="ruller-bg" stroke="none" fill="rgba(255,255,255,0.5)" width="250" height="25"></rect>
      <path id="ruller-path" stroke="#000" stroke-width="1px" fill="none" d="M 25,15 l 0,5 l 200,0 l 0,-5 m -50,0 l 0,5 m -50,0 l 0,-5 m -50,0 l 0,5" />
      <text class="scale-text" x="25" y="14">${0}</text>
      <text class="scale-text" x="75" y="14">${this.gridscale / 4
      }</text>
      <text class="scale-text" x="125" y="14">${this.gridscale / 2
      }</text>
      <text class="scale-text" x="175" y="14">${this.gridscale * (3 / 4)
      }</text>
      <text id="gridscale" class="scale-text" x="225" y="14">${this.gridscale + this.gridunit
      }</text>
    </symbol>
    <!--// CONTENT //-->
    <g class="itssvg" id="content" style="transform-origin: center center"
    transform="translate(${this._x / this._factor} ${this._y / this._factor}) scale(${this._factor}) rotate(${this._r})">
      ${unsafeSVG(content)}
    </g>
    
    ${this.gridscale
        ? svg`<use id="ruller" href="#ruller" x="${this._ref ? this._mx - 24 : width * 0.05
          }" y="${this._ref ? this._my : height - 25}" width="${width / 3.3
          }"/>`
        : nothing
      }
  </svg>`;
  }

  render() {
    let clipW = Math.round(this.clientWidth * 0.9),
      clipH = Math.round(clipW / this.aspect);
    return html`
    ${this.svgcontent
        ? html`<fieldset>
            <button type=button @click=${() => this._select(null)} ?disabled=${this._selection === null
          }>Очистити вибір${this._selection ? `: ${this.getSelector(this._selection)}` : ``}</button>
            <button ?disabled=${!!!this.svgcontent} @click=${() => {
            if (this.aspect === ALBUM) {
              this.aspect = PORTRAIT;
            } else {
              this.aspect = ALBUM;
            }
          }} type=button>${this.aspect === ALBUM ? 'Портретна' : 'Альбомна'
          }</button>
          </fieldset>
          <fieldset>
            <label>Шкала масштабу:
              <input style="width: 3em" ?disabled=${!!!this
            .svgcontent} type=number value="${this.gridscale}" @input=${(e: Event) => {
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
                <option value="м" ?selected=${this.gridunit === 'м'}>м</option>
                <option value="км" ?selected=${this.gridunit === 'км'
          }>км</option>
              </select>
            </label>
          </fieldset>
          <div id="canvas"
          @wheel=${this._scale}
            @mousedown=${this._press} 
            @mousemove=${this._over} 
            @mouseout=${() => {
            this._hovered = null;
            this._mouse = 'none';
          }} 
            @mouseup=${this._release}>${this._wrap(this.svgcontent, clipW, clipH)}</div>
          <fieldset class="tip">
            Масштабувати: скрол (або скрол + control).
            Обертати навколо центру: скрол + shift.
          </fieldset>
          ${this._hovered
            ? html`<div class="hover-label" style="top: ${this._my + 50 < this.clientHeight
              ? this._my + 20
              : this._my - 20
              }px; left: ${this._mx + 100 < this.clientWidth
                ? this._mx + 30
                : this._mx - 100
              }px" id="label">${this.getSelector(this._hovered)}</div>`
            : nothing
          }`
        : nothing
      }`;
  }
}
