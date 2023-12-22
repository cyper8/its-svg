import { customElement, property, state } from "lit/decorators.js";
import { SVGView } from "./svg-view.js";
import { G, Path, SVG } from "@svgdotjs/svg.js";
import { PropertyValueMap, css } from "lit";

@customElement('svg-draw')
export class SVGDraw extends SVGView {
  @state() drawing?: G;
  @property({ type: String, attribute: 'path-class' }) pathClass: string =
    'pathcls';
  @property({ type: String, attribute: 'path-id' }) pathId: string = 'pathid';

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

  protected get result() {
    let node = this.drawing?.last();
    return node ? this.shadowRoot?.querySelector('path#' + this.pathId + '.' + this.pathClass)?.outerHTML || '' : '';
  }

  svgCanvas = () => this.shadowRoot?.querySelector('svg#container.itssvg');

  connectedCallback(): void {
    super.connectedCallback();
    this.svgcontent = ' ';
    this.addEventListener('mouseup', this._release.bind(this));
  }

  protected _release(e: MouseEvent) {
    let canvas = this.shadowRoot?.querySelector('div#canvas');
    if (canvas instanceof HTMLDivElement) {
      this._attemptDraw(e.offsetX - canvas.clientLeft, e.offsetY - canvas.clientTop, e.shiftKey);
    }
  }

  protected updated(_changed: PropertyValueMap<SVGDraw>): void {
    super.updated(_changed);
    if (_changed.has('svgcontent')) {
      if (this.svgcontent !== undefined) {
        let d = this.svgCanvas();
        if (d) {
          let s = SVG().group().addTo(d as HTMLElement);
          s.addClass('itssvg itspath');
          this.drawing = s;
        }
      }
    }
  }

  private _attemptDraw(x: number, y: number, start: boolean = false) {
    if (this.drawing) {
      let draw = this.drawing.last();
      if (draw instanceof Path && draw.hasClass(this.pathClass)) {
        let pth = draw.array();
        let canStart = pth[pth.length - 1][0].toLowerCase() === 'm';
        pth.push([start && canStart ? 'M' : 'L', x, y]);
        draw.plot(pth);
      } else {
        draw = this.drawing
          .path(`M ${x} ${y}`)
          .addClass(this.pathClass)
          .id(this.pathId);
      }
    }
  }
}