import { useEffect, useRef, useState, useCallback } from 'react';

export function useVisibility(onVisibilityChange?: (visible: boolean) => void) {
  const [isVisible, setIsVisible] = useState(true);
  const elementRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setElement = useCallback((el: HTMLElement | null) => {
    elementRef.current = el;
  }, []);

  useEffect(() => {
    if (!elementRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries[0]?.isIntersecting ?? false;
        setIsVisible(visible);
        onVisibilityChange?.(visible);
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(elementRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [onVisibilityChange]);

  return { isVisible, setElement };
}
