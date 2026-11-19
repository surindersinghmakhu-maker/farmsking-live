/**
 * Manages an invisible Firebase reCAPTCHA host element completely outside React's Virtual DOM.
 * Prevents React DOM errors such as "Failed to execute 'insertBefore' on 'Node'".
 * Ensures the invisible reCAPTCHA container is positioned off-screen without any visible badge.
 */
export function getOrCreateDetachedRecaptchaHost(hostId: string): HTMLElement {
  if (typeof document === 'undefined') return null as any;
  let existing = document.getElementById(hostId);
  if (!existing) {
    existing = document.createElement('div');
    existing.id = hostId;
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
  if (existing) {
    try {
      existing.innerHTML = '';
      if (existing.parentNode) {
        existing.parentNode.removeChild(existing);
      }
    } catch {}
  }
}

// Backward compatibility alias
export const getFreshDetachedRecaptchaHost = getOrCreateDetachedRecaptchaHost;
