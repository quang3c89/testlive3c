/* Live3C — ui.js */

/**
 * Toast — landing: #toast-box, .toast.tout | tournament: #toast-container, .toast.out
 */
export function toast(msg, type = 'info', options = {}) {
  const containerId = options.containerId ?? 'toast-box';
  const exitClass = options.exitClass ?? 'tout';
  const duration = options.duration ?? 3200;
  const box = document.getElementById(containerId);
  if (!box) return;
  const el = document.createElement('div');
  el.className = 'toast';
  if (type === 'error') el.style.borderLeftColor = '#ef4444';
  if (type === 'success') el.style.borderLeftColor = '#22c55e';
  el.textContent = msg;
  box.appendChild(el);
  setTimeout(() => {
    el.classList.add(exitClass);
    setTimeout(() => el.remove(), 350);
  }, duration);
}

/** Landing splash #splash — class out để ẩn */
export function showSplash(options = {}) {
  const id = options.splashId ?? 'splash';
  const outClass = options.outClass ?? 'out';
  document.getElementById(id)?.classList.remove(outClass);
}

export function hideSplash(options = {}) {
  const id = options.splashId ?? 'splash';
  const outClass = options.outClass ?? 'out';
  document.getElementById(id)?.classList.add(outClass);
}

/** Tournament loading #loading-screen — class hidden */
export function hideTournamentLoading(options = {}) {
  const id = options.loadingId ?? 'loading-screen';
  const hiddenClass = options.hiddenClass ?? 'hidden';
  document.getElementById(id)?.classList.add(hiddenClass);
}

export function showTournamentLoading(options = {}) {
  const id = options.loadingId ?? 'loading-screen';
  const hiddenClass = options.hiddenClass ?? 'hidden';
  document.getElementById(id)?.classList.remove(hiddenClass);
}

/** IntersectionObserver fade-up (landing) */
export function setupObserver(options = {}) {
  const threshold = options.threshold ?? 0.12;
  const selector = options.selector ?? '.fade-up';
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        obs.unobserve(e.target);
      }
    });
  }, { threshold });
  document.querySelectorAll(selector).forEach((el) => obs.observe(el));
}

/**
 * Realtime WebSocket (landing — bảng tournaments).
 * @param {{ onUpdate: () => void | Promise<void>, setOnline?: (boolean) => void, supaUrl: string, supaKey: string }} opts
 */
export function setupRealtime(opts) {
  const { supaUrl, supaKey, onUpdate, setOnline } = opts;
  if (!supaUrl || !supaKey) return null;

  let ws;
  try {
    const wsUrl = supaUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    ws = new WebSocket(`${wsUrl}/realtime/v1/websocket?apikey=${supaKey}&vsn=1.0.0`);
    let hb;
    ws.onopen = () => {
      setOnline?.(true);
      ws.send(
        JSON.stringify({
          topic: 'realtime:public',
          event: 'phx_join',
          payload: {
            config: {
              postgres_changes: [{ event: '*', schema: 'public', table: 'tournaments' }],
            },
          },
          ref: '1',
        })
      );
      hb = setInterval(() => {
        if (ws.readyState === 1)
          ws.send(JSON.stringify({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: 'hb' }));
      }, 25000);
    };
    ws.onmessage = async () => {
      await onUpdate();
    };
    ws.onclose = () => {
      clearInterval(hb);
      setOnline?.(false);
      const { supaUrl: u, supaKey: k, onUpdate: ou, setOnline: so } = opts;
      setTimeout(() => {
        if (u && k) setupRealtime({ supaUrl: u, supaKey: k, onUpdate: ou, setOnline: so });
      }, 5000);
    };
    ws.onerror = () => setOnline?.(false);
  } catch (e) {
    setOnline?.(false);
  }
  return ws;
}

/**
 * Dot realtime — landing: #rt-dot.off | tournament: #rt-dot.offline
 */
export function setRT(isOnline, options = {}) {
  const mode = options.mode ?? 'landing';
  const dotId = options.dotId ?? 'rt-dot';
  const labelId = options.labelId ?? 'rt-label';
  const d = document.getElementById(dotId);
  const l = document.getElementById(labelId);
  if (!d || !l) return;
  if (mode === 'tournament') {
    d.classList.toggle('offline', !isOnline);
  } else {
    d.classList.toggle('off', !isOnline);
  }
  l.textContent = isOnline ? 'LIVE' : 'OFFLINE';
}
