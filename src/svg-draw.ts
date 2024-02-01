import { customElement, property, state } from "lit/decorators.js";
import { G, Path, SVG } from "@svgdotjs/svg.js";
import { PropertyValueMap, css, html } from "lit";
import { SVGEdit } from "./svg-edit.js";

export interface DrawResult {
  path: string,
  id?: string,
  class?: string
}

export type DrawFinishEvent = CustomEvent<DrawResult> & {
  type: 'draw-finished',
  composed: true
}

export type SVGDrawEventMap = HTMLElementEventMap & {
  'draw-finished': DrawFinishEvent
}

@customElement('svg-draw')
export class SVGDraw extends SVGEdit {
  @state() drawing?: G;
  @property({ type: String, attribute: 'path-class' })
  pathClass: string = 'pathcls';
  @property({ type: String, attribute: 'path-id', reflect: true })
  pathId: string = 'pathid';
  @property({ type: Number, attribute: 'stroke-width', reflect: true })
  strokeWidth: number = 1;
  @property({ type: String, attribute: 'stroke-dasharray', reflect: true })
  strokeDasharray: string = 'none';
  @property({ type: String, attribute: 'stroke', reflect: true })
  stroke: string = '#000000';
  @property({ type: String, attribute: 'fill', reflect: true })
  fill: string = 'none';

  static styles = [
    ...super.styles,
    css`
    g.itspath path {
      stroke: #000;
      stroke-width: 1;
      fill: none;
    }
    `
  ]

  addEventListener<K extends keyof SVGDrawEventMap>(type: K, listener: (this: HTMLElement, ev: SVGDrawEventMap[K]) => any, options?: boolean | AddEventListenerOptions | undefined): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions | undefined): void {
    super.addEventListener(type, listener, options)
  }

  protected get result() {
    let node = this.drawing?.last();
    return node ? this.shadowRoot?.querySelector('path#' + this.pathId + '.' + this.pathClass)?.outerHTML || '' : '';
  }

  protected _changePathId(input: Event) {
    let field = input.target;
    if (field instanceof HTMLInputElement) this.pathId = field.value;
  }

  protected _save(_click: Event) {
    let container = this.shadowRoot?.querySelector<HTMLDivElement>('div#canvas');
    if (container && this.svgcontent && this.fileAccessor) {
      super._saveToFile({
        name: this.fileAccessor?.file.name || `${this.pathId}.${this.pathClass}.svg`,
        content: container.innerHTML,
        options: {
          type: 'image/svg+xml'
        }
      })
    }
  }

  protected _finishAndReturn(_click: Event) {
    let result = this.result;
    if (result) {
      this.dispatchEvent(
        new CustomEvent<DrawResult>('draw-finished', {
          composed: true,
          bubbles: true,
          detail: {
            path: result,
            id: this.pathId,
            class: this.pathClass
          }
        }) as DrawFinishEvent
      )
    }
  }

  protected _renderDrawControls() {
    return html`<fieldset>
      <label>Ідентифікатор лінії
        <input type=text
          placeholder="Ідентифікатор лінії"
          value="${this.pathId}"
          @input="${this._changePathId}"
        /></label>
        <label>Товщина
          <input type="number" min=0 max=100 value=1 />
        </label>
      </fieldset>
      <fieldset>
        <button @click="${this._save}">
          Додати лінію у файл
        </button>
        <button @click="${this._finishAndReturn}">
          Завершити
        </button>
      </fieldset>`
  }


  connectedCallback(): void {
    super.connectedCallback();
    this.svgcontent = ' ';
  }

  protected _release(e: MouseEvent) {
    if (this._mouse === 'none') {
      let canvas = e.currentTarget;
      if (canvas instanceof SVGSVGElement) {
        let x = e.offsetX;
        let y = e.offsetY;
        let point = canvas.createSVGPoint();
        point.x = x;
        point.y = y;
        let adjustmentMatrix = canvas.transform.baseVal[0]?.matrix || canvas.createSVGMatrix()
        point.matrixTransform(adjustmentMatrix);
        this._attemptDraw(point.x, point.y, e.shiftKey);
      }
    }
  }

  protected _translate(tx: number, ty: number) {
    let canvas = this.svgCanvas();
    if (canvas instanceof SVGSVGElement) {
      let movement = canvas.createSVGTransform();
      movement.setTranslate(tx, ty);
      canvas.transform.baseVal.appendItem(movement);
      canvas.transform.baseVal.consolidate();
    }
  }

  protected _scale(f: number): void {
    let canvas = this.svgCanvas();
    if (canvas instanceof SVGSVGElement) {
      let scaling = canvas.createSVGTransform();
      scaling.setScale(1 + f, 1 + f);
      canvas.transform.baseVal.appendItem(scaling);
      canvas.transform.baseVal.consolidate();
    }
  }

  protected _rotate(a: number): void {
    let canvas = this.svgCanvas();
    if (canvas instanceof SVGSVGElement) {
      let rotation = canvas.createSVGTransform();
      rotation.setRotate(a, 0, 0);
      canvas.transform.baseVal.appendItem(rotation);
      canvas.transform.baseVal.consolidate();
    }
  }

  protected updated(_changed: PropertyValueMap<SVGDraw>): void {
    super.updated(_changed);
    if (_changed.has('svgcontent')) {
      if (this.svgcontent !== undefined) {
        let d = this.svgCanvas();
        if (d) {
          d.addEventListener('mouseup', this._release.bind(this));
          let s = SVG().group().addTo(d);
          s.addClass('itssvg itspath');
          this.drawing = s;
        }
      }
    }
  }

  private _styleLine(path: Path) {
    return path.stroke({
      color: this.stroke,
      width: this.strokeWidth,
      dasharray: this.strokeDasharray
    })
      .fill(this.fill)
  }

  private _getPath() {
    if (this.drawing) {
      let draw = this.drawing.last();
      if (draw instanceof Path && draw.hasClass(this.pathClass)) return draw;
      else {
        return this._styleLine(
          this.drawing.path()
            .addClass(this.pathClass)
            .id(this.pathId)
        )
      }
    }
  }

  private _attemptDraw(x: number, y: number, start: boolean = false) {
    let path = this._getPath();
    if (path) {
      let pth = path.array();
      let canStart = pth[pth.length - 1][0].toLowerCase() !== 'm';
      pth.push([start && canStart ? 'M' : 'L', x, y]);
      path.plot(pth);
    }
  }

  render() {
    return html`Work in progress!!! Experimental!!! May malfunction!!!
    ${super.render()}
    ${this._renderDrawControls()}
    `
  }
}