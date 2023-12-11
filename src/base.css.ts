import { css } from 'lit';

export default (_params?: any) =>
  css`
:host {
  --logical-affirmation-color: #10fe01;
  --logical-negation-color: #fa1510;

  --basic-back-color: #1e1e1e;
  --basic-face-color: #fafafa;
  --basic-rim-color: #dadada;
  
  --basic-ctrl-back-color: #1a1a1a;
  --basic-ctrl-face-color: var(--basic-face-color);
  --basic-ctrl-rim-color: var(--basic-ctrl-back-color);

  --basic-ctrl-glow-back-color: #101010;
  --basic-ctrl-glow-face-color: #444fff;
  --basic-ctrl-glow-rim-color: var(--basic-ctrl-glow-face-color);
}

@media (prefers-color-scheme: light) {
  :host {
    --basic-back-color: #fafafa;
    --basic-face-color: #1e1e1e;
    --basic-rim-color: #5a5a5a;
    
    --basic-ctrl-back-color: #dadada;
    --basic-ctrl-face-color: var(--basic-face-color);
    --basic-ctrl-rim-color: var(--basic-ctrl-back-color);
  
    --basic-ctrl-glow-back-color: #d0d0d0;
    --basic-ctrl-glow-face-color: #444fff;
    --basic-ctrl-glow-rim-color: var(--basic-ctrl-glow-face-color);  
  }
}

.yes, .ok, .accept, .add {
  border-color: var(--logical-affirmation-color);
}

:is(.yes, .ok, .accept, .add) svg {
  fill: var(--logical-affirmation-color);
}

.no, .error, .fail, .remove, .delete {
  border-color:  var(--logical-negation-color);
}

:is(.no, .error, .fail, .remove, .delete) svg {
  fill: var(--logical-negation-color);
}

`;
