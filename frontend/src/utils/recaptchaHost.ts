/**
 * Manages an invisible Firebase reCAPTCHA host element completely outside React's Virtual DOM.
 * Prevents React DOM errors such as "Failed to execute 'insertBefore' on 'Node'".
 */
export function getFreshDetachedRecaptchaHost(hostId: string, verifierGlobalKey?: string): HTMLElement {
  if (verifierGlobalKey && typeof window !== 'undefined' && (window as any)[verifierGlobalKey]) {
    try {
      (window as any)[verifierGlobalKey].clear();
    } catch {}
    (window as any)[verifierGlobalKey] = null;
  }
  const existing = document.getElementById(hostId);
  if (existing && existing.parentNode) {
    existing.parentNode.removeChild(existing);
  }
  const el = document.createElement('div');
  el.id = hostId;
  el.style.position = 'fixed';
  el.style.bottom = '0';
  el.style.right = '0';
  el.style.width = '1px';
  el.style.height = '1px';
  el.style.opacity = '0';
  el.style.pointerEvents = 'none';
  el.style.zIndex = '-1';
  document.body.appendChild(el);
  return el;
}

export function clearDetachedRecaptchaHost(hostId: string, verifierGlobalKey?: string): void {
  if (typeof window === 'undefined') return;
  if (verifierGlobalKey && (window as any)[verifierGlobalKey]) {
    try {
      (window as any)[verifierGlobalKey].clear();
    } catch {}
    (window as any)[verifierGlobalKey] = null;
  }
  const existing = document.getElementById(hostId);
  if (existing && existing.parentNode) {
    existing.parentNode.removeChild(existing);
  }
}

