import { LitElement, PropertyValues, css, html, nothing, svg } from 'lit';
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

//type SVGViewEventMap = HTMLElementEventMap & FileAccessCompatibleEventMap;

@customElement('svg-view')
export class SVGView extends LitElement implements FileAccessCompatible {
  private _mouse: 'select' | 'move' | 'none' = 'none';

  @state() private _svg: SVGSVGElement | null = null;
  @state() private _hovered: SVGElement | null = null;
  @state() private _mx: number = 0;
  @state() private _my: number = 0;
  @state() private _selection: Element | null = null;
  @state() private _x: number = 0;
  @state() private _y: number = 0;
  @state() private _w: number = 0;
  @state() private _h: number = 0;
  @state() private _r: number = 0;
  @state() private _ref: boolean = false;
  @property({ type: Object }) fileAccessor: FileAccessor | undefined;
  //@property({ type: Object }) svgFile: SvgFileReader = new SvgFileReader(this);
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
      if (this._svg instanceof SVGSVGElement) {
        return {
          name: 'svg-view',
          result: this._svg.outerHTML,
        };
      }
    }
  }

  static styles = [
    buttonStyling(),
    css`
    :host, #container {
      display: block;
      position: relative;
      font-family: sans-serif;
    }

    fieldset {
      display: inline-block; 
      font-size: 0.8em;
      padding: 0.3em;
    }

    #container {
      overflow: hidden;
      cursor: crosshair;
      background-color: #ffffff;
      max-height: 80vh;
      border: solid 1px black;
    }

    #container svg {
      width: 100%;
    }

    rect#frame-rect {
      stroke: black;
      stroke-width: 1px;
      fill: none;
    }

    #ruller-path {
      stroke: black;
      stroke-width: 1px;
      fill: none;
    }

    .scale-text {
      text-anchor: middle;
      font-size: 10pt;
      fill: #000;
      stroke: none;
    }

    #container>svg {
      transform-origin: center center;
    }

    #container>svg *[selected] {
      outline: solid 5px red;
    }

    #container>svg :where(*:hover:not([selected])) {
      outline: solid 3px rgba(255,0,0,0.2);
    }

    #container>svg :is(*:has(*:hover)) {
      outline: inherit
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
    //let container = e.currentTarget;
    //if (container instanceof SVGSVGElement) {
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
    if (this._svg instanceof SVGSVGElement) {
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
        // console.log('move', (this._x += deltaX), (this._y += deltaY));
      }
      //  }
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
    let container = event.currentTarget;
    if (container instanceof Element && this._svg instanceof SVGSVGElement) {
      if (event.shiftKey) {
        // ROTATE
        let deltaR = (event.shiftKey ? 1 : 5) * (event.deltaY > 0 ? -1 : 1);
        let r = this._r + deltaR;
        this._r = r;
      } else {
        // SCALE
        let UP = event.deltaY > 0;
        let factor = event.ctrlKey ? 1.005 : 1.03;
        let x, y, w, h;
        let kX = (event.offsetX - this._x) / this._w; //event.offsetX / container.clientWidth;
        let kY = (event.offsetY - this._y) / this._h; //event.offsetY / container.clientHeight;
        w = UP ? this._w * factor : this._w / factor;
        x = this._x - kX * (w - this._w);
        h = UP ? this._h * factor : this._h / factor;
        y = this._y - kY * (h - this._h);
        this._x = x;
        this._y = y;
        this._w = w;
        this._h = h;
        // console.log(
        //   'scale',
        //   (this._x = x),
        //   (this._y = y),
        //   (this._w = w),
        //   (this._h = h),
        //   kX,
        //   kY
        // );
      }
    }
  }

  updated(_changed: PropertyValues<SVGView>) {
    let needwriteback = false;
    if (_changed.has('fileAccessor')) {
      if (this.fileAccessor) {
        this.fileAccessor
          .readText()
          .then((content) => (this.svgcontent = content));
      } else {
        this.svgcontent = undefined;
      }
    }
    if (_changed.has('svgcontent')) {
      let container = this.shadowRoot?.querySelector('#container');
      let content = container?.querySelector('#container svg');
      if (content instanceof SVGSVGElement) {
        container!.setAttribute(
          'viewBox',
          `0 0 ${container!.clientWidth} ${container!.clientHeight}`
        );
        this._svg = content;
        const INPX = SVGLength.SVG_LENGTHTYPE_PX;
        content.x.baseVal.convertToSpecifiedUnits(INPX);
        content.y.baseVal.convertToSpecifiedUnits(INPX);
        content.width.baseVal.convertToSpecifiedUnits(INPX);
        content.height.baseVal.convertToSpecifiedUnits(INPX);
        this._x = content.x.baseVal.value || 0;
        this._y = content.y.baseVal.value || 0;
        this._w =
          content.width.baseVal.value ||
          content.viewBox.baseVal.width ||
          this.clientWidth;
        this._h =
          content.height.baseVal.value ||
          content.viewBox.baseVal.height ||
          this.clientHeight;
        needwriteback = true;
      } else {
        this._svg = null;
        this._x = 0;
        this._y = 0;
        this._w = 0;
        this._h = 0;
        this._r = 0;
      }
    }
    if (_changed.has('_x')) {
      this._svg?.setAttribute('x', '' + this._x);
      needwriteback = true;
    }
    if (_changed.has('_y')) {
      this._svg?.setAttribute('y', '' + this._y);
      needwriteback = true;
    }
    if (_changed.has('_w')) {
      this._svg?.setAttribute('width', '' + this._w);
      needwriteback = true;
    }
    if (_changed.has('_h')) {
      this._svg?.setAttribute('height', '' + this._h);
      needwriteback = true;
    }
    if (_changed.has('_r')) {
      this._svg?.setAttributeNS(
        'svg',
        'transform',
        `rotate(${this._r} ${this._mx} ${this._my})`
      );
      this._svg?.style.setProperty('transform', `rotateZ(${this._r}deg)`);
      needwriteback = true;
    }
    if (needwriteback) {
      let container = this.shadowRoot?.querySelector('#container');
      if (container && this.fileAccessor) {
        this.dispatchEvent(
          new CustomEvent<FileChangeResult>('file-changed', {
            composed: true,
            bubbles: true,
            detail: {
              name: this.fileAccessor.file.name,
              content: container.outerHTML,
              options: {
                type: 'image/svg+xml',
              },
            },
          } as FileChangeEvent)
        );
      }
    }
  }

  render() {
    let clipX = this.clientWidth * 0.05,
      clipY = clipX / this.aspect,
      clipW = this.clientWidth * 0.9,
      clipH = clipW / this.aspect;
    return html`<div>
    <style>
      #container, rect#frame-rect {
        aspect-ratio: ${this.aspect};
      }
    </style>
    ${
      this.svgcontent
        ? html`<fieldset>
            <button type=button @click=${() => this._select(null)} ?disabled=${
            this._selection === null
          }>Очистити вибір</button>
            <button ?disabled=${!!!this.svgcontent} @click=${() => {
            if (this.aspect === ALBUM) {
              this.aspect = PORTRAIT;
            } else {
              this.aspect = ALBUM;
            }
          }} type=button>${
            this.aspect === ALBUM ? 'Портретна' : 'Альбомна'
          }</button>
          </fieldset>
          <fieldset>
            <label>Шкала масштабу:
              <input style="width: 3em" ?disabled=${!!!this
                .svgcontent} type=number @input=${(e: Event) => {
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
                <option value="км" ?selected=${
                  this.gridunit === 'км'
                }>км</option>
              </select>
            </label>
          </fieldset>
          <svg 
            id="container" 
            xmlns="${xmlns}"
            @wheel=${this._scale}
            @mousedown=${this._press} 
            @mousemove=${this._over} 
            @mouseout=${() => {
              this._hovered = null;
              this._mouse = 'none';
            }} 
            @mouseup=${this._release}>
            <symbol id="ruller" viewBox="0 0 250 25" width="250" height="25">
              <rect id="ruller-bg" stroke="none" fill="rgba(255,255,255,0.5)" width="250" height="25"></rect>
              <path id="ruller-path" stroke="#000" stroke-width="1px" fill="none" d="M 25,15 l 0,5 l 200,0 l 0,-5 m -50,0 l 0,5 m -50,0 l 0,-5 m -50,0 l 0,5" />
              <text class="scale-text" x="25" y="14">${0}</text>
              <text class="scale-text" x="75" y="14">${
                this.gridscale / 4
              }</text>
              <text class="scale-text" x="125" y="14">${
                this.gridscale / 2
              }</text>
              <text class="scale-text" x="175" y="14">${
                this.gridscale * (3 / 4)
              }</text>
              <text class="scale-text" x="225" y="14">${
                this.gridscale + this.gridunit
              }</text>
            </symbol>
            <!--// CONTENT //-->
            ${unsafeSVG(this.svgcontent)}
            
            ${
              this.gridscale
                ? svg`<use id="ruller" href="#ruller" x="${
                    this._ref ? this._mx - 24 : clipX
                  }" y="${this._ref ? this._my : clipY + clipH - 25}" width="${
                    clipW / 3
                  }"/>`
                : nothing
            }
          </svg>
          <fieldset class="tip">
            Масштабувати: скрол (або скрол + control).
            Обертати навколо центру: скрол + shift.
          </fieldset>
          ${
            this._hovered
              ? html`<div class="hover-label" style="top: ${
                  this._my + 50 < this.clientHeight
                    ? this._my + 20
                    : this._my - 20
                }px; left: ${
                  this._mx + 100 < this.clientWidth
                    ? this._mx + 30
                    : this._mx - 100
                }px" id="label">${this.getSelector(this._hovered)}</div>`
              : nothing
          }`
        : nothing
    }</div>`;
  }
}
