import React, { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap, ScrollTrigger } from "./gsapSetup";

let lenisInstance: Lenis | null = null;

export const getLenis = () => lenisInstance;

export const scrollToTop = (immediate = true) => {
    if (lenisInstance) {
        lenisInstance.scrollTo(0, { immediate });
    } else {
        window.scrollTo(0, 0);
    }
};

export const SmoothScroll: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    useEffect(() => {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduced) return;

        const lenis = new Lenis({
            autoRaf: false,
            lerp: 0.11,
            wheelMultiplier: 1,
        });
        lenisInstance = lenis;

        lenis.on("scroll", ScrollTrigger.update);
        const raf = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(raf);
        gsap.ticker.lagSmoothing(0);

        return () => {
            gsap.ticker.remove(raf);
            lenis.destroy();
            lenisInstance = null;
        };
    }, []);

    return <>{children}</>;
};
