import { svg } from "lit";

export const ruller = (unit: string,
  value: number) => svg`
    <symbol id="ruller" viewBox="0 0 250 25" width="250" height="25">
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
  `;