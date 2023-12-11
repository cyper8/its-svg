import { LitElement, PropertyValues, css, html, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { G, Path, SVG, Svg } from '@svgdotjs/svg.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';

import './svg-import.js';
import { SVGImportedEvent } from './svg-import.js';

//type Box = [number, number, number, number];
const xmlns = 'http://www.w3.org/2000/svg';

@customElement('svg-canvas')
export class SVGCanvas extends LitElement {
  @state() private _svgRoot?: Svg;
  //@state() private _crosshair?: G;
  @property({ type: Number }) gridstep: number = 10;
  @property({ type: String }) context: string = '';
  @property({ type: String, attribute: 'path-class' }) pathClass: string =
    'pathcls';
  @property({ type: String, attribute: 'path-id' }) pathId: string = 'pathid';
  @state() _vb: string = '0 0 600 400';
  //@state() private _pointX?: number;
  //@state() private _pointY?: number;

  static get styles() {
    return css`
    :host {
      display: block;
      min-height: min-content;
    }
    #main {
      display: flex;
      flex-flow: column no-wrap;
      min-height: 400px;
    }
    #main > * {
      flex: 1 0 100%;
      display: block;
    }
    path.grid {
      fill: none;
      stroke: transparent;
      stroke-width: 0.001px;
      outline: solid 0.25px rgba(0,0,0,0.3);
    }
    .test {
      stroke: #000;
      fill: #f00;
    }
    `;
  }

  // private _gridlines([x, y, w, h]: Box) {
  //   let x0 = x;
  //   let y0 = y;
  //   let width = x0 + w;
  //   let height = y0 + h;
  //   let grid = ``;
  //   for (var x = x0; x < width; x += this.gridstep) {
  //     grid += `<path class="grid" id="x${x}" d="M${x},${y0} L${x},${height}"/>`;
  //   }
  //   for (var y = y0; y < height; y += this.gridstep) {
  //     grid += `<path class="grid" id="y${y}" d="M${x0},${y} L${width},${y}" />`;
  //   }
  //   return `${grid}`;
  // }

  svgCanvas = () => this.shadowRoot?.querySelector('svg#drawing');

  applyGrid(p: number): number {
    let g = this.gridstep;
    return p + (p % g > g / 2 ? g : 0);
  }

  firstUpdated() {
    let d = this.svgCanvas();
    if (d) {
      this._vb = `0 0 ${d.clientWidth} ${d.clientHeight}`;
      d.setAttribute('viewBox', this._vb);

      let s = SVG().addTo(d as HTMLElement);
      s.viewbox(this._vb);
      this._svgRoot = s;
      // s.on('mousedown', (e: Event) => {
      //   let x = (e as MouseEvent).offsetX;
      //   let y = (e as MouseEvent).offsetY;
      //   this._attemptDraw(x, y, (e as MouseEvent).shiftKey);
      // });
    }
  }

  updated(_changes: PropertyValues<SVGCanvas>) {
    //this.updateCrosshair();
    // if (_changes.has('context')) {
    //   let bgLayer = this.shadowRoot?.querySelector('g#context');
    //   if (bgLayer instanceof SVGGElement) {
    //     let box = bgLayer.getBBox();
    //     this._svgRoot?.viewbox(box.x, box.y, box.width, box.height);
    //   }
    // }
  }

  // updateCrosshair() {
  //   let x = this._pointX / this.gridstep;
  //   let y = this._pointY / this.gridstep;
  //   let c = this.svgCanvas()!;
  //   let s = this._svgRoot!;
  //   if (!this._crosshair) {
  //     this._crosshair = s.group();
  //     this._crosshair.attr('id', 'crosshair');
  //   }
  //   let h = this._crosshair;
  //   h.clear();
  //   h.line(x + 1, y, c.clientWidth, y).stroke('#fff');
  //   h.line(x, y + 1, x, c.clientHeight).stroke('#fff');
  //   h.line(x - 1, y, 0, y).stroke('#fff');
  //   h.line(x, y - 1, x, 0).stroke('#fff');
  // }

  private _attemptDraw(x: number, y: number, start: boolean = false) {
    if (this._svgRoot) {
      let draw = this._svgRoot.last();
      if (draw instanceof Path && draw.hasClass(this.pathClass)) {
        let pth = draw.array();
        pth.push([start ? 'M' : 'L', x, y]);
        draw.plot(pth);
      } else {
        draw = this._svgRoot
          .path(`M${x} ${y}`)
          .addClass(this.pathClass)
          .id(this.pathId);
      }
    }
  }

  render() {
    return html`
    <style>
      ${`path.${unsafeCSS(this.pathClass)}`} {
        fill: none;
        stroke: #000;
        stroke-width: 1px;
      }
    </style>
    <svg-import @svg-imported=${(e: SVGImportedEvent) => {
      this.context = e.detail.content;
    }}></svg-import>
    <div id="main">
      <svg xmlns="${xmlns}" viewBox=${this._vb} id="drawing" @mousedown=${(
      e: Event
    ) => {
      let x = (e as MouseEvent).offsetX;
      let y = (e as MouseEvent).offsetY;
      this._attemptDraw(x, y, (e as MouseEvent).shiftKey);
    }}>
        <defs></defs>
        ${unsafeSVG(this.context)}
      </svg>
    </div>`;
  }
}
