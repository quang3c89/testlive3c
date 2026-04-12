/**
 * Returns hardcoded safe hex colors for export.
<<<<<<< HEAD
 * Do NOT use getComputedStyle — Chrome on P3/wide-gamut displays
=======
 * We do NOT use getComputedStyle because Chrome on P3/wide-gamut displays
>>>>>>> d0c57a0 (fix(bracket-bg-export): ensure bracket background fills large layouts and stabilize export pipeline wiring)
 * returns color() syntax which html2canvas cannot parse.
 *
 * @returns {{bg:string, card:string, text:string, border:string, primary:string, accent:string}}
 */
export function resolveExportColors() {
  return {
<<<<<<< HEAD
    bg:      '#0f0f1a',
    card:    '#1a1a2e',
    text:    '#ffffff',
    border:  '#334155',
    primary: '#3b82f6',
    accent:  '#8b5cf6'
=======
    bg:      '#00388D',
    card:    '#001E5C',
    text:    '#FFFFFF',
    border:  'rgba(255,255,255,0.15)',
    primary: '#E8B820',
    accent:  '#D63830'
>>>>>>> d0c57a0 (fix(bracket-bg-export): ensure bracket background fills large layouts and stabilize export pipeline wiring)
  };
}

/**
 * Builds a stripped stylesheet string for the offscreen export layer.
<<<<<<< HEAD
=======
 * Disables all animations, transitions, filters, and CSS modern color functions.
>>>>>>> d0c57a0 (fix(bracket-bg-export): ensure bracket background fills large layouts and stabilize export pipeline wiring)
 *
 * @param {{bg:string, card:string, text:string, border:string, primary:string, accent:string}} colors
 * @returns {string}
 */
export function buildExportStylesheet(colors) {
  return `
    *, *::before, *::after {
      animation: none !important;
      transition: none !important;
      filter: none !important;
      backdrop-filter: none !important;
      text-shadow: none !important;
      box-shadow: none !important;
      color-scheme: light only !important;
      forced-color-adjust: none !important;
    }
    :root {
      --bg: ${colors.bg} !important;
      --card: ${colors.card} !important;
      --text: ${colors.text} !important;
      --border: ${colors.border} !important;
      --primary: ${colors.primary} !important;
      --accent: ${colors.accent} !important;
    }
<<<<<<< HEAD
    body { background: ${colors.bg} !important; }
=======
    body, #bracket-container { background: #00388D !important; }
>>>>>>> d0c57a0 (fix(bracket-bg-export): ensure bracket background fills large layouts and stabilize export pipeline wiring)
  `;
}
