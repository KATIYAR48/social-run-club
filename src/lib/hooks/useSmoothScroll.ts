import { useLenis } from "lenis/react";

export const useSmoothScroll = () => {
  const lenis = useLenis();

  const scrollTo = (
    target: string | number | HTMLElement,
    options?: {
      offset?: number;
      duration?: number;
      easing?: (t: number) => number;
    }
  ) => {
    if (lenis) {
      lenis.scrollTo(target, options);
    }
  };

  const scrollToTop = () => {
    if (lenis) {
      lenis.scrollTo(0);
    }
  };

  const stop = () => {
    if (lenis) {
      lenis.stop();
    }
  };

  const start = () => {
    if (lenis) {
      lenis.start();
    }
  };

  return {
    lenis,
    scrollTo,
    scrollToTop,
    stop,
    start,
  };
};
