import { css } from 'lit';
import basicStyles from './base.css.js';

export default (_params?: any) => [
  basicStyles(),
  css`
:host {
  --button-face: var(--basic-ctrl-face-color);
  --button-back: var(--basic-ctrl-back-color);
  --button-rim: var(--basic-ctrl-rim-color);
  --button-glow-face: var(--basic-ctrl-glow-face-color);
  --button-glow-rim: var(--basic-ctrl-glow-rim-color);
  --button-glow-back: var(--basic-ctrl-glow-back-color);
}

:is(button, .button) {
  display: inline-block;
  border: 1px solid var(--button-rim);
  border-radius: 0px;
  min-width: 8rem;
  padding: 0 0.4em;

  text-align: center;
  font-size: 0.9rem;
  line-height: 2.5rem;

  cursor: defaut;

  transition: border-color 0.25s, background-color 0.25s, color 0.25s, fill 0.25s;
  background-color: var(--button-back);
  color: var(--button-face);
}

:is(button, .button) svg {
  display: inline;
  vertical-align: middle;
  fill: var(--button-face);
  transition: inherit;
}

:is(button, .button):not([disabled]):hover {
  color: var(--button-glow-face);
  border-color: var(--button-glow-rim);
  background-color: var(--button-glow-back)
}

:is(button, .button):not([disabled]):hover svg {
  fill: var(--button-glow-face);
}

:is(button, .button):not([disabled]):focus,
:is(button, .button):not([disabled]):focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}

:is(button, .button)[disabled],
:is(button, .button)[disabled]:hover,
:is(button, .button)[disabled]:focus,
:is(button, .button)[disabled]:hover svg
{
  filter: brightness(0.4) saturate(0.2);
}
`,
];
