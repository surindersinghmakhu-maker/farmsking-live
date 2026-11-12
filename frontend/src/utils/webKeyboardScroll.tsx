import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { usePathname, useSegments } from 'expo-router';

type ScrollDirection = 'down' | 'up' | 'top' | 'bottom';

const STYLE_ELEMENT_ID = 'farmsking-keyboard-scroll-style';
const SCROLL_TARGET_ATTR = 'data-fk-scroll-target';
const SCROLL_KEYS = new Set(['PageDown', 'PageUp', 'Home', 'End', 'ArrowDown', 'ArrowUp', ' ']);

function ensureScrollTargetStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ELEMENT_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ELEMENT_ID;
  style.textContent = `
    [${SCROLL_TARGET_ATTR}="1"]:focus {
      outline: none !important;
      box-shadow: none !important;
    }
  `;
  document.head.appendChild(style);
}

function isEditableOrWidgetElement(el: HTMLElement | null): boolean {
  if (!el || el === document.body || el === document.documentElement) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'OPTION') {
    return true;
  }
  if (el.isContentEditable || Boolean(el.closest('[contenteditable="true"]'))) {
    return true;
  }
  return Boolean(
    el.closest(
      '[role="textbox"], [role="searchbox"], [role="combobox"], [role="listbox"], [role="slider"], [role="spinbutton"]'
    )
  );
}

function shouldIgnoreSpaceKey(el: HTMLElement | null): boolean {
  if (!el || el === document.body || el === document.documentElement || el.id === 'root') {
    return false;
  }
  if (el.getAttribute(SCROLL_TARGET_ATTR) === '1') return false;
  const interactive = el.closest(
    'button, a[href], summary, [role="button"], [role="link"], [role="tab"], [role="switch"], [role="checkbox"], [role="radio"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="option"]'
  ) as HTMLElement | null;
  if (!interactive) return false;
  return interactive.getAttribute(SCROLL_TARGET_ATTR) !== '1';
}

function shouldIgnoreArrowOrJumpKey(el: HTMLElement | null): boolean {
  if (!el || el === document.body || el === document.documentElement) return false;
  return Boolean(
    el.closest(
      'video, audio, [role="menu"], [role="menubar"], [role="tablist"], [role="radiogroup"], [role="tree"], [role="grid"]'
    )
  );
}

function isHiddenOrInactive(el: HTMLElement): boolean {
  let cur: HTMLElement | null = el;
  while (cur && cur !== document.documentElement) {
    if (cur.getAttribute('aria-hidden') === 'true') return true;
    if (cur.hasAttribute('hidden') || cur.hasAttribute('inert')) return true;
    const style = window.getComputedStyle(cur);
    if (style.display === 'none' || style.visibility === 'hidden') return true;
    if (parseFloat(style.opacity || '1') <= 0.02) return true;
    cur = cur.parentElement;
  }
  return false;
}

function isVerticallyScrollableCss(el: HTMLElement): boolean {
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'PRE' || tag === 'CODE') {
    return false;
  }
  const style = window.getComputedStyle(el);
  const oy = style.overflowY;
  return oy === 'auto' || oy === 'scroll' || oy === 'overlay';
}

function getVisibleViewportArea(el: HTMLElement): number {
  const rect = el.getBoundingClientRect();
  if (rect.width < 100 || rect.height < 80) return 0;

  const vw = window.innerWidth || document.documentElement.clientWidth;
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const visLeft = Math.max(0, rect.left);
  const visTop = Math.max(0, rect.top);
  const visRight = Math.min(vw, rect.right);
  const visBottom = Math.min(vh, rect.bottom);
  const visW = visRight - visLeft;
  const visH = visBottom - visTop;

  if (visW < 80 || visH < 80) return 0;

  // Verify the container is actually on top and not masked by an inactive stacked screen.
  const xFracs = [0.5, 0.25, 0.75];
  const yFracs = [0.35, 0.55, 0.2];
  let hitVisible = false;
  for (const yf of yFracs) {
    for (const xf of xFracs) {
      const hit = document.elementFromPoint(visLeft + visW * xf, visTop + visH * yf);
      if (hit && (el === hit || el.contains(hit))) {
        hitVisible = true;
        break;
      }
    }
    if (hitVisible) break;
  }

  return hitVisible ? visW * visH : 0;
}

function getTopVisibleDialog(): HTMLElement | null {
  const dialogs = Array.from(
    document.querySelectorAll<HTMLElement>('[aria-modal="true"][role="dialog"], [aria-modal="true"][role="alertdialog"]')
  ).filter((el) => !isHiddenOrInactive(el));
  return dialogs.length > 0 ? dialogs[dialogs.length - 1] : null;
}

function canScrollInDirection(el: HTMLElement, direction: ScrollDirection): boolean {
  if (direction === 'up' || direction === 'top') {
    return el.scrollTop > 2;
  }
  return el.scrollTop + el.clientHeight < el.scrollHeight - 2;
}

function findScrollableAncestor(
  start: HTMLElement | null,
  direction?: ScrollDirection
): HTMLElement | null {
  let cur: HTMLElement | null = start;
  while (cur && cur !== document.documentElement) {
    if (cur === document.body) {
      const bodyOverflow = window.getComputedStyle(document.body).overflowY;
      if (bodyOverflow === 'hidden') return null;
    }
    if (!isHiddenOrInactive(cur) && isVerticallyScrollableCss(cur) && cur.scrollHeight > cur.clientHeight + 4) {
      if (!direction || canScrollInDirection(cur, direction)) {
        return cur;
      }
    }
    cur = cur.parentElement;
  }
  return null;
}

export function findPrimaryScrollableContainer(requireOverflow = true): HTMLElement | null {
  if (typeof document === 'undefined' || typeof window === 'undefined') return null;
  const topDialog = getTopVisibleDialog();
  const root = topDialog || document.getElementById('root') || document.body;
  if (!root) return null;

  const candidates = [root, ...Array.from(root.querySelectorAll<HTMLElement>('div, main, section, aside, ul'))];
  let bestEl: HTMLElement | null = null;
  let bestArea = 0;
  let bestOverflow = 0;

  for (const el of candidates) {
    if (!isVerticallyScrollableCss(el)) continue;
    if (isHiddenOrInactive(el)) continue;

    const overflow = el.scrollHeight - el.clientHeight;
    if (requireOverflow) {
      if (overflow <= 4) continue;
    } else if (el.clientHeight < 150) {
      continue;
    }

    const area = getVisibleViewportArea(el);
    if (area <= 0) continue;

    if (area > bestArea + 500 || (Math.abs(area - bestArea) <= 500 && overflow > bestOverflow)) {
      bestEl = el;
      bestArea = area;
      bestOverflow = overflow;
    }
  }

  if (bestEl) return bestEl;

  if (!topDialog && document.scrollingElement instanceof HTMLElement) {
    const bodyOverflow = window.getComputedStyle(document.body).overflowY;
    const htmlOverflow = window.getComputedStyle(document.documentElement).overflowY;
    const se = document.scrollingElement;
    if (
      bodyOverflow !== 'hidden' &&
      htmlOverflow !== 'hidden' &&
      (!requireOverflow || se.scrollHeight > se.clientHeight + 4)
    ) {
      return se;
    }
  }

  return null;
}

function focusScrollTarget(target: HTMLElement): void {
  ensureScrollTargetStyles();
  target.setAttribute(SCROLL_TARGET_ATTR, '1');
  if (!target.hasAttribute('tabindex')) {
    target.tabIndex = -1;
  }
  if (document.activeElement !== target) {
    target.focus({ preventScroll: true });
  }
}

export function syncActiveScrollFocus(forceFromNonEditable = false): boolean {
  if (typeof document === 'undefined' || typeof window === 'undefined') return false;
  const active = document.activeElement as HTMLElement | null;
  if (isEditableOrWidgetElement(active)) return false;

  const target = findPrimaryScrollableContainer(true) || findPrimaryScrollableContainer(false);
  if (!target) return false;

  const isRootOrBody =
    !active || active === document.body || active === document.documentElement || active.id === 'root';
  const activeHidden = Boolean(active && isHiddenOrInactive(active));
  const topDialog = getTopVisibleDialog();
  const activeOutsideDialog = Boolean(topDialog && active && !topDialog.contains(active));

  if (isRootOrBody || activeHidden || activeOutsideDialog || (forceFromNonEditable && !target.contains(active))) {
    focusScrollTarget(target);
    return true;
  }

  return false;
}

function getScrollDirection(e: KeyboardEvent): ScrollDirection {
  if (e.key === 'Home') return 'top';
  if (e.key === 'End') return 'bottom';
  if (e.key === 'PageUp' || e.key === 'ArrowUp' || (e.key === ' ' && e.shiftKey)) return 'up';
  return 'down';
}

function handleGlobalKeyDown(e: KeyboardEvent): void {
  if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
  if (!SCROLL_KEYS.has(e.key)) return;
  if (e.shiftKey && e.key !== ' ') return;

  const active = document.activeElement as HTMLElement | null;
  const eventTarget = e.target as HTMLElement | null;
  if (isEditableOrWidgetElement(active) || isEditableOrWidgetElement(eventTarget)) return;

  if (e.key === ' ' && (shouldIgnoreSpaceKey(active) || shouldIgnoreSpaceKey(eventTarget))) {
    return;
  }
  if (
    (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End') &&
    (shouldIgnoreArrowOrJumpKey(active) || shouldIgnoreArrowOrJumpKey(eventTarget))
  ) {
    return;
  }

  const direction = getScrollDirection(e);
  const target = findScrollableAncestor(active, direction) || findPrimaryScrollableContainer(true);
  if (!target) return;

  e.preventDefault();
  if (!isEditableOrWidgetElement(active) && (!active || !target.contains(active))) {
    focusScrollTarget(target);
  }

  const behavior: ScrollBehavior = e.repeat ? 'auto' : 'smooth';
  if (e.key === 'Home') {
    target.scrollTo({ top: 0, behavior });
    return;
  }
  if (e.key === 'End') {
    target.scrollTo({ top: target.scrollHeight, behavior });
    return;
  }

  const pageStep = Math.max(160, Math.round(target.clientHeight * 0.85));
  const delta = e.key === 'ArrowDown' ? 84 : e.key === 'ArrowUp' ? -84 : direction === 'up' ? -pageStep : pageStep;
  target.scrollBy({ top: delta, behavior });
}

/**
 * Globally ensures Web keyboard scrolling (PageDown, PageUp, Home, End, Arrows, Space)
 * works immediately upon opening any route, tab, or modal without clicking inside the page first.
 */
export function WebKeyboardScrollGlobalizer() {
  const pathname = usePathname();
  const segments = useSegments();
  const segmentsKey = segments.join('/');
  const timersRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastPointerDownAtRef = useRef<number>(0);

  const clearScheduledSyncs = () => {
    if (rafRef.current !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    for (const id of timersRef.current) {
      window.clearTimeout(id);
    }
    timersRef.current = [];
  };

  const scheduleFocusSync = (forceFromNonEditable: boolean) => {
    if (typeof window === 'undefined') return;
    clearScheduledSyncs();
    rafRef.current = window.requestAnimationFrame(() => {
      syncActiveScrollFocus(forceFromNonEditable);
    });
    for (const delay of [80, 240, 550]) {
      const id = window.setTimeout(() => {
        syncActiveScrollFocus(forceFromNonEditable);
      }, delay);
      timersRef.current.push(id);
    }
  };

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    ensureScrollTargetStyles();

    const onKeyDown = (e: KeyboardEvent) => handleGlobalKeyDown(e);
    const onPopState = () => scheduleFocusSync(true);
    const onFocusIn = (e: FocusEvent) => {
      if (isEditableOrWidgetElement(e.target as HTMLElement | null)) {
        clearScheduledSyncs();
      }
    };
    const onPointerDown = () => {
      lastPointerDownAtRef.current = Date.now();
    };
    const onClick = (e: MouseEvent) => {
      const clickedEl = e.target as HTMLElement | null;
      if (!clickedEl || Date.now() - lastPointerDownAtRef.current > 600) return;
      const trigger = clickedEl.closest('button, a[href], [role="button"], [role="tab"]') as HTMLElement | null;
      if (!trigger || isEditableOrWidgetElement(trigger)) return;
      if (trigger.getAttribute('aria-expanded') === 'true') return;

      const id = window.setTimeout(() => {
        const active = document.activeElement as HTMLElement | null;
        if (!active || isEditableOrWidgetElement(active)) return;
        const primary = findPrimaryScrollableContainer(true) || findPrimaryScrollableContainer(false);
        if (!primary) return;
        if (!primary.contains(active) && !active.closest('[role="menu"], [role="listbox"]')) {
          focusScrollTarget(primary);
        }
      }, 45);
      timersRef.current.push(id);
    };

    let mutationRaf: number | null = null;
    const observer =
      typeof MutationObserver !== 'undefined'
        ? new MutationObserver(() => {
            const active = document.activeElement as HTMLElement | null;
            const topDialog = getTopVisibleDialog();
            const needsSync =
              !active ||
              active === document.body ||
              active === document.documentElement ||
              active.id === 'root' ||
              isHiddenOrInactive(active) ||
              Boolean(topDialog && !topDialog.contains(active));
            if (!needsSync || mutationRaf !== null) return;
            mutationRaf = window.requestAnimationFrame(() => {
              mutationRaf = null;
              syncActiveScrollFocus(false);
            });
          })
        : null;

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('popstate', onPopState);
    document.addEventListener('focusin', onFocusIn, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('click', onClick, false);

    const observeRoot = document.body;
    if (observer && observeRoot) {
      observer.observe(observeRoot, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-hidden', 'aria-modal', 'role'],
      });
    }

    scheduleFocusSync(true);

    return () => {
      clearScheduledSyncs();
      if (mutationRaf !== null) {
        window.cancelAnimationFrame(mutationRaf);
      }
      observer?.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('popstate', onPopState);
      document.removeEventListener('focusin', onFocusIn, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('click', onClick, false);
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    scheduleFocusSync(true);
    return () => clearScheduledSyncs();
  }, [pathname, segmentsKey]);

  return null;
}
