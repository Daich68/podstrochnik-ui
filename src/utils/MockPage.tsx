import React, { useRef } from "react";
import { gsap, useGSAP, CYRILLIC_CHARS } from "../anim/gsapSetup";

type MockPageProps ={
    pageName: string
}

export const MockPage: React.FC<MockPageProps> = ({ pageName }) => {
    const ref = useRef<HTMLDivElement>(null);

    // Текст «набирается» из случайных литер, как строка в наборной кассе.
    useGSAP(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        gsap.to(".mock-text", {
            duration: 1.6,
            scrambleText: {
                text: `здесь скоро будет страница ${pageName}`,
                chars: CYRILLIC_CHARS,
                speed: 0.7,
            },
            ease: "none",
        });
    }, { scope: ref, dependencies: [pageName] });

    return (
        <div ref={ref} className="mock-page" style={{ color: "white", padding: "2rem" }}>
            <span className="mock-text">{`здесь скоро будет страница ${pageName}`}</span>
        </div>
    )
}
