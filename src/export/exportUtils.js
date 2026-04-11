/**
 * @typedef {Object} ExportColors
 * @property {string} bg
 * @property {string} card
 * @property {string} text
 * @property {string} border
 * @property {string} primary
 * @property {string} accent
 */

const SAFE_FALLBACKS = {
  bg: '#ffffff',
  card: '#ffffff',
  text: '#111827',
  border: '#d1d5db',
  primary: '#2563eb',
  accent: '#2563eb',
};

/**
 * Returns true when color is a plain rgb/rgba/hex CSS color.
 *
 * @param {string} value
 * @returns {boolean}
 */
function isPlainColor(value) {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return (
    /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v) ||
    /^rgba?\(([^)]+)\)$/i.test(v)
  );
}

/**
 * Resolves any CSS color expression into a browser-computed plain color.
 *
 * @param {string} rawColor
 * @param {HTMLElement} contextElement
 * @param {string} fallback
 * @returns {string}
 */
function resolveToPlainColor(rawColor, contextElement, fallback) {
  if (!rawColor || !contextElement) return fallback;

  const raw = rawColor.trim();
  if (!raw) return fallback;
  if (isPlainColor(raw)) return raw;

  const probe = document.createElement('span');
  probe.style.position = 'absolute';
  probe.style.left = '-99999px';
  probe.style.top = '-99999px';
  probe.style.pointerEvents = 'none';
  probe.style.color = raw;

  contextElement.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  probe.remove();

  return isPlainColor(computed) ? computed : fallback;
}

/**
 * Resolves export-safe flat colors from CSS custom properties.
 * This should be executed once before any DOM cloning begins.
 *
 * @param {Element} sourceElement
 * @returns {ExportColors}
 */
export function resolveExportColors(sourceElement) {
  const element = sourceElement instanceof HTMLElement ? sourceElement : document.documentElement;
  const styles = getComputedStyle(element);

  const raw = {
    bg: styles.getPropertyValue('--bg'),
    card: styles.getPropertyValue('--card'),
    text: styles.getPropertyValue('--text'),
    border: styles.getPropertyValue('--border'),
    primary: styles.getPropertyValue('--primary'),
    accent: styles.getPropertyValue('--accent'),
  };

  return {
    bg: resolveToPlainColor(raw.bg, element, SAFE_FALLBACKS.bg),
    card: resolveToPlainColor(raw.card, element, SAFE_FALLBACKS.card),
    text: resolveToPlainColor(raw.text, element, SAFE_FALLBACKS.text),
    border: resolveToPlainColor(raw.border, element, SAFE_FALLBACKS.border),
    primary: resolveToPlainColor(raw.primary, element, SAFE_FALLBACKS.primary),
    accent: resolveToPlainColor(raw.accent, element, SAFE_FALLBACKS.accent),
  };
}

/**
 * Builds an export-only stylesheet string with flat color and no effects.
 *
 * @param {ExportColors} colors
 * @returns {string}
 */
export function buildExportStylesheet(colors) {
  const c = {
    bg: colors?.bg || SAFE_FALLBACKS.bg,
    card: colors?.card || SAFE_FALLBACKS.card,
    text: colors?.text || SAFE_FALLBACKS.text,
    border: colors?.border || SAFE_FALLBACKS.border,
    primary: colors?.primary || SAFE_FALLBACKS.primary,
    accent: colors?.accent || SAFE_FALLBACKS.accent,
  };

  return `<style id="export-flat-styles">
* , *::before, *::after {
  animation: none !important;
  transition: none !important;
  filter: none !important;
  backdrop-filter: none !important;
  transform: none !important;
}
body {
  background: ${c.bg} !important;
  color: ${c.text} !important;
}
.mp,
.bracket-cell,
.register-item,
.sched-match,
.schedule-card,
.card,
.panel,
.bracket-wrap,
.bracket-cols {
  background: ${c.card} !important;
  border-color: ${c.border} !important;
  color: ${c.text} !important;
  box-shadow: none !important;
  text-shadow: none !important;
}
.bracket-line,
#bracket-lines path,
#bracket-lines line,
#bracket-lines polyline {
  stroke: ${c.primary} !important;
  color: ${c.primary} !important;
}
.mp,
.mp *,
.bracket-cell,
.bracket-cell *,
.round-title,
.register-title,
.f-name,
.f-unit,
.f-rank,
.mn,
.mp-unit,
.sched-name,
.sched-side-unit,
h1,h2,h3,h4,h5,h6,p,span,div,label,td,th {
  color: ${c.text} !important;
}
a,
.link,
.btn-primary,
.badge-primary {
  color: ${c.accent} !important;
  border-color: ${c.accent} !important;
}
</style>`;
}
