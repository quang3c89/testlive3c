/**
 * Returns hardcoded safe hex colors for export.
 * Do NOT use getComputedStyle — Chrome on P3/wide-gamut displays
 * returns color() syntax which html2canvas cannot parse.
 *
 * @returns {{bg:string, card:string, text:string, border:string, primary:string, accent:string}}
 */
export function resolveExportColors() {
  return {
    bg:      '#0f0f1a',
    card:    '#1a1a2e',
    text:    '#ffffff',
    border:  '#334155',
    primary: '#3b82f6',
    accent:  '#8b5cf6'
  };
}

/**
 * Builds a stripped stylesheet string for the offscreen export layer.
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
    body { background: ${colors.bg} !important; }
  `;
}
