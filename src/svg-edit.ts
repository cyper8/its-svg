import { customElement, property, state } from "lit/decorators.js";
import { SVGView } from "./svg-view.js";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import { PropertyValueMap, TemplateResult, css, html, nothing, svg } from "lit";
import { FileChangeResult, FileChangeEvent } from "./FileAccessor.js";

const ALBUM = 297 / 210;
const PORTRAIT = 210 / 297;

@customElement('svg-edit')
export class SVGEdit extends SVGView {

  @state() _mx: number = 0;
  @state() _my: number = 0;
  @state() _factor: number = 1;
  @state() _x: number = 0;
  @state() _y: number = 0;
  @state() _r: number = 0;
  @property({ type: Number }) gridscale: number = 0;
  @property({ type: String }) gridunit: string = 'м';
  @property({ type: Boolean }) measure: boolean = false;

  static styles = [
    ...super.styles,
    css`
    fieldset {
      display: inline-block; 
      font-size: 0.8em;
      padding: 0.3em;
    }
    `
  ];

  translateSystem([x, y]: [number, number]): [number, number] {
    let _x = x / this._factor,
      _y = y / this._factor;
    return [
      (_x * Math.cos(-this._r * (Math.PI / 180))) + (_y * Math.sin(this._r * (Math.PI / 180))) + this._x,
      (_x * Math.sin(-this._r * (Math.PI / 180))) + (_y * Math.cos(this._r * (Math.PI / 180))) + this._y
    ]
  }

  protected _translate(tx: number, ty: number) {
    [this._x, this._y] = this.translateSystem([tx, ty]);
  }

  protected _move(e: MouseEvent) {
    e.preventDefault();
    let oldX = this._mx,  oldY = this._my;
    this._mx = e.offsetX;
    this._my = e.offsetY;
    if (e.buttons & 1) {
      this._translate(this._mx - oldX, this._my - oldY)
    } else {
      let canvas = this.svgCanvas();
      if (canvas instanceof SVGSVGElement) {
        let ruller = canvas.querySelector('use#use-ruller');
        if (ruller instanceof SVGUseElement) {
          if (e.ctrlKey) {
            ruller.setAttribute('x', e.offsetX - 25 + '');
            ruller.setAttribute('y', e.offsetY + '');
          } else {
            ruller.setAttribute('x', '0');
            ruller.setAttribute('y', canvas.clientHeight - 50 + '');
          }
        }
      }
    }
  }

  protected _scale(f: number) {
    this._factor += f;
  }

  protected _rotate(a: number) {
    this._r += a;
  }

  protected _wheel(event: WheelEvent) {
    event.preventDefault();
    let UP = 0
    if (event.deltaY > 0) UP = -1;
    if (event.deltaY < 0) UP = 1;
    if (event.shiftKey) {
      // ROTATE
      let deltaR = (event.ctrlKey ? 0.1 : 1) * (UP);
      this._rotate(deltaR);
    } else {
      // SCALE
      let factor = (UP * (event.ctrlKey ? 0.001 : 0.01));
      this._scale(factor);
    }
  }


  protected _wrapEditor(content: string | TemplateResult, factor: number, angle: number, x: number, y: number) {
    return svg`<g class="itssvg" id="content" style="transform-origin: center center"
    transform="scale(${factor}) rotate(${angle}) translate(${x} ${y})">${typeof content === 'string'
        ? unsafeSVG(content)
        : content
      }</g>`
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
            break;
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
    Масштабувати: скрол (повільно: control + скрол).
    Обертати: shift + скрол (повільно: control + shift + скрол).
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

  protected _ruller(unit: string, value: number, width: number = 250, topPos: number) {
    return svg`
      <symbol id="ruller" viewBox="0 0 250 25">
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
        ? svg`<use id="use-ruller" href="#ruller" width="${width}" height="${width / 10}" x="0" y="${topPos}" />`
        : ''
      }
    `;
  }

  protected _saveToFile(data: FileChangeResult) {
    this.dispatchEvent(
      new CustomEvent<FileChangeResult>('file-changed', {
        composed: true,
        bubbles: true,
        detail: data,
      } as FileChangeEvent)
    );
  }

  protected updated(_changed: PropertyValueMap<SVGEdit>): void {
    super.updated(_changed);
    if (_changed.has('svgcontent')) {
      let container = this.svgCanvas();
      if (container instanceof SVGSVGElement) {
        container.addEventListener('wheel', this._wheel.bind(this));
        container.addEventListener('mousemove', this._move.bind(this));
      }
    }
    if (_changed.has('_x')
      || _changed.has('_y')
      || _changed.has('_r')
      || _changed.has('aspect')
      || _changed.has('gridscale')
      || _changed.has('gridunit')) {
      let container = this.svgCanvas();
      if (container && this.svgcontent && this.fileAccessor) {
        this._saveToFile({
          name: this.fileAccessor.file.name,
          content: container.outerHTML,
          options: {
            type: 'image/svg+xml',
          },
        });
      }
    }
  }

  protected _unwrap(content: string): Element {
    let wrapper = super._unwrap(content);
    wrapper = this._unwrapScaleRuller(wrapper);
    wrapper = this._unwrapEditor(wrapper);
    return wrapper;
  }

  protected _wrap(content: string | TemplateResult, width: number, height: number) {
    return super._wrap(
      svg`${this._wrapEditor(content, this._factor, this._r, this._x, this._y)
        }${this._ruller(this.gridunit, this.gridscale, width / 3.3, height - 50)
        }`,
      width,
      height)
  }

  render() {
    return html`
    ${this.svgcontent ? this._editorControl() : nothing}
    ${super.render()}`
  }

}