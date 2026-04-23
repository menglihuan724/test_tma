import { useState, useEffect, useCallback } from 'react';
import { breakpoints } from '../config/theme';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export interface ResponsiveState {
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
}

const getBreakpoint = (width: number): Breakpoint => {
  if (width >= breakpoints.xxl) return 'xxl';
  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  if (width >= breakpoints.sm) return 'sm';
  return 'xs';
};

const getResponsiveState = (width: number): ResponsiveState => {
  const breakpoint = getBreakpoint(width);
  return {
    breakpoint,
    isMobile: width < breakpoints.md, // xs, sm
    isTablet: width >= breakpoints.md && width < breakpoints.xl, // md, lg
    isDesktop: width >= breakpoints.xl, // xl, xxl
    width,
  };
};

export const useResponsive = (): ResponsiveState => {
  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window !== 'undefined') {
      return getResponsiveState(window.innerWidth);
    }
    // Default to mobile for SSR
    return getResponsiveState(375);
  });

  const handleResize = useCallback(() => {
    const newState = getResponsiveState(window.innerWidth);
    setState(prevState => {
      // Only update if breakpoint or significant properties changed
      if (
        prevState.breakpoint !== newState.breakpoint ||
        prevState.isMobile !== newState.isMobile ||
        prevState.isTablet !== newState.isTablet ||
        prevState.isDesktop !== newState.isDesktop
      ) {
        return newState;
      }
      return prevState;
    });
  }, []);

  useEffect(() => {
    // Set initial state
    handleResize();

    // Add event listener with debounce
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, [handleResize]);

  return state;
};

// Hook for checking specific breakpoint
export const useBreakpoint = (breakpoint: Breakpoint): boolean => {
  const { width } = useResponsive();
  return width >= breakpoints[breakpoint];
};

// Hook for media query style check
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
};

export default useResponsive;
