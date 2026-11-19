/**
 * 👑 FarmsKing Detached reCAPTCHA Host Manager
 * - Creates a clean, fresh, dedicated DOM element completely isolated from React's Virtual DOM.
 * - Safely unmounts and removes the old DOM element before creating a new one, so window.grecaptcha
 *   never throws "reCAPTCHA has already been rendered in this element".
 * - Injects Google's official rule `.grecaptcha-badge { visibility: hidden !important; }` so no unwanted
 *   floating badge obscures user UI elements.
 */

let badgeStyleInjected = false;
export function injectRecaptchaBadgeHiddenStyle(): void {
  if (typeof document === 'undefined' || badgeStyleInjected) return;
  try {
    const styleId = 'fk-recaptcha-badge-hidden-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        .grecaptcha-badge {
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `;
      document.head.appendChild(style);
    }
    badgeStyleInjected = true;
  } catch {}
}

export function getFreshDetachedRecaptchaHost(hostId: string, verifierGlobalKey?: string): HTMLElement {
  if (typeof document === 'undefined') return null as any;

  injectRecaptchaBadgeHiddenStyle();

  // 1. Destroy and clear old verifier instance if any
  if (verifierGlobalKey && typeof window !== 'undefined' && (window as any)[verifierGlobalKey]) {
    try {
      (window as any)[verifierGlobalKey].clear();
    } catch {}
    (window as any)[verifierGlobalKey] = null;
  }

  // 2. Remove previous DOM element to prevent "reCAPTCHA has already been rendered in this element"
  const existing = document.getElementById(hostId);
  if (existing && existing.parentNode) {
    try {
      existing.parentNode.removeChild(existing);
    } catch {}
  }

  // 3. Create fresh DOM container with unique lifecycle
  const el = document.createElement('div');
  el.id = hostId;
  el.style.position = 'fixed';
  el.style.bottom = '0px';
  el.style.right = '0px';
  el.style.width = '100px';
  el.style.height = '100px';
  el.style.opacity = '0';
  el.style.pointerEvents = 'none';
  el.style.overflow = 'hidden';
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
    try {
      existing.parentNode.removeChild(existing);
    } catch {}
  }
}

// Backward compatibility alias
export const getOrCreateDetachedRecaptchaHost = getFreshDetachedRecaptchaHost;
