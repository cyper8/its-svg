import { LitElement, PropertyValueMap, PropertyValues, TemplateResult, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import buttonStyling from './button.css.js';
import {
  FileAccessCompatible,
  FileAccessor,
} from './FileAccessor.js';

const xmlns = 'http://www.w3.org/2000/svg';

const ALBUM = 297 / 210;

@customElement('svg-view')
export class SVGView extends LitElement implements FileAccessCompatible {
  @property({ type: Number }) aspect: number = ALBUM;
  @property({ type: Object }) fileAccessor: FileAccessor | undefined;
  @property({ type: String }) svgcontent?: string;

  static styles = [
    buttonStyling(),
    css`
    :host, 
    #canvas,
    #canvas * {
      display: block;
      position: relative;
      font-family: sans-serif;
    }

    #canvas {
      overflow: hidden;
      cursor: crosshair;
      background-color: #ffffff;
      max-height: 80vh;
      border: solid 1px black;
    }
  `,
  ];

  protected update(changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    if (changedProperties.has('svgcontent')) {
      if (this.svgcontent) {
        this.svgcontent = this._unwrap(this.svgcontent).innerHTML;
      }
    }
    super.update(changedProperties);
  }

  protected updated(_changed: PropertyValues<SVGView>) {
    if (_changed.has('fileAccessor')) {
      if (this.fileAccessor) {
        this.fileAccessor
          .readText()
          .then((content) => (this.svgcontent = content));
      } else {
        this.svgcontent = undefined;
      }
    }
  }

  protected _unwrap(content: string): Element {
    let svgcontent = document.createElement('div');
    svgcontent.innerHTML = content;
    let wrapper = svgcontent.querySelector<SVGSVGElement>('svg#container.itssvg');
    if (wrapper instanceof SVGSVGElement) {
      let ratio = parseFloat(wrapper.style.aspectRatio);
      this.aspect = ratio || ALBUM;
    }
    return wrapper || svgcontent
  }

  protected _wrap(content: string | TemplateResult, width: number, height: number) {
    return html`<svg 
    id="container"
    class="itssvg"
    style="aspect-ratio: ${this.aspect}"
    viewBox="0 0 ${width} ${height}"
    xmlns="${xmlns}">${
      typeof content === 'string' 
      ? unsafeSVG(content) 
      : content
    }</svg>`
  }

  render() {
    let clipW = Math.round(this.clientWidth),
      clipH = Math.round(clipW / this.aspect);
    return html`
    ${this.svgcontent
        ? html`
          <div id="canvas">${this._wrap(this.svgcontent, clipW, clipH)}</div>`
        : nothing
      }`;
  }
}
