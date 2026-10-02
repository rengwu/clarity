import { useEffect, useLayoutEffect, useRef } from 'react';

const easing = 'cubic-bezier(.2,.8,.2,1)';
export const reducedMotion = () =>
  document.documentElement.dataset.motion === 'reduced' ||
  matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useViewMotion(selector: string, key: unknown) {
  useLayoutEffect(() => {
    const element = document.querySelector(selector);
    if (!element || reducedMotion()) return;
    const animation = element.animate(
      [
        { opacity: 0.45, transform: 'translateY(4px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      { duration: 160, easing },
    );
    return () => animation.cancel();
  }, [selector, key]);
}

export function useListMotion(selector: string, key: unknown) {
  const positions = useRef(new Map<string, DOMRect>());
  useLayoutEffect(() => {
    const next = new Map<string, DOMRect>();
    const animations: Animation[] = [];
    for (const element of document.querySelectorAll<HTMLElement>(selector)) {
      if (!element.checkVisibility()) continue;
      const id = element.dataset.itemId!;
      const rect = element.getBoundingClientRect();
      const previous = positions.current.get(id);
      next.set(id, rect);
      if (reducedMotion()) continue;
      if (previous && previous.top !== rect.top) {
        animations.push(
          element.animate(
            [
              { transform: `translateY(${previous.top - rect.top}px)` },
              { transform: 'translateY(0)' },
            ],
            { duration: 220, easing },
          ),
        );
      } else if (!previous && positions.current.size) {
        animations.push(
          element.animate(
            [
              { opacity: 0, transform: 'translateY(-4px)' },
              { opacity: 1, transform: 'translateY(0)' },
            ],
            { duration: 160, easing },
          ),
        );
      }
    }
    positions.current = next;
    return () => animations.forEach((animation) => animation.cancel());
  }, [selector, key]);
}

export function useInteractionFeedback() {
  useEffect(() => {
    const root = document.documentElement;
    const system = matchMedia('(prefers-reduced-motion: reduce)');
    const stopMotion = () => {
      if (reducedMotion()) document.getAnimations().forEach((animation) => animation.cancel());
    };
    const observer = new MutationObserver(stopMotion);
    observer.observe(root, { attributes: true, attributeFilter: ['data-motion'] });
    system.addEventListener('change', stopMotion);
    root.dataset.input = 'pointer';
    const tooltip = document.createElement('div');
    tooltip.className = 'control-tooltip';
    tooltip.setAttribute('role', 'tooltip');
    let timer: ReturnType<typeof setTimeout>;
    let owner: HTMLElement | undefined;
    const hide = () => {
      clearTimeout(timer);
      tooltip.classList.remove('visible');
      owner = undefined;
    };
    const pointer = () => {
      root.dataset.input = 'pointer';
      hide();
    };
    const key = (event: KeyboardEvent) => {
      if (
        ['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(
          event.key,
        )
      )
        root.dataset.input = 'keyboard';
      hide();
    };
    const show = (event: Event) => {
      const element = (event.target as Element)?.closest<HTMLElement>(
        'button[title],button[data-tooltip],a[title],a[data-tooltip]',
      );
      if (!element || element === owner) return;
      hide();
      owner = element;
      if (element.title) {
        element.dataset.tooltip = element.title;
        element.removeAttribute('title');
      }
      timer = setTimeout(() => {
        if (!element.isConnected) return;
        (element.closest('dialog') || document.body).append(tooltip);
        tooltip.textContent = element.dataset.tooltip || '';
        tooltip.classList.add('visible');
        const rect = element.getBoundingClientRect(),
          size = tooltip.getBoundingClientRect();
        tooltip.style.left = `${Math.max(8, Math.min(innerWidth - size.width - 8, rect.left + (rect.width - size.width) / 2))}px`;
        tooltip.style.top = `${rect.bottom + size.height + 12 < innerHeight ? rect.bottom + 7 : rect.top - size.height - 7}px`;
      }, 450);
    };
    document.addEventListener('pointerdown', pointer, true);
    document.addEventListener('keydown', key, true);
    document.addEventListener('pointerover', show);
    document.addEventListener('pointerout', hide);
    document.addEventListener('scroll', hide, true);
    return () => {
      hide();
      tooltip.remove();
      observer.disconnect();
      system.removeEventListener('change', stopMotion);
      document.removeEventListener('pointerdown', pointer, true);
      document.removeEventListener('keydown', key, true);
      document.removeEventListener('pointerover', show);
      document.removeEventListener('pointerout', hide);
      document.removeEventListener('scroll', hide, true);
    };
  }, []);
}
