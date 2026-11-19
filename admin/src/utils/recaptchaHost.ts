/**
 * Manages an invisible Firebase reCAPTCHA host element completely outside React's Virtual DOM.
 * Prevents React DOM errors such as "Failed to execute 'insertBefore' on 'Node'".
 */
export function getOrCreateDetachedRecaptchaHost(hostId: string): HTMLElement {
  if (typeof document === 'undefined') return null as any;
  let existing = document.getElementById(hostId);
  if (!existing) {
    existing = document.createElement('div');
    existing.id = hostId;
    existing.style.position = 'fixed';
    existing.style.bottom = '10px';
    existing.style.right = '10px';
    existing.style.zIndex = '9999999';
    existing.style.pointerEvents = 'auto';
    document.body.appendChild(existing);
  }
  return existing;
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

// Backward compatibility alias
export const getFreshDetachedRecaptchaHost = getOrCreateDetachedRecaptchaHost;
