import React, { useRef, useState } from "react";
import { gsap, useGSAP, CYRILLIC_CHARS } from "./gsapSetup";
import "./Preloader.css";

type Phase = "loading" | "revealing" | "done";

// Прелоадер-«наборная касса»: слово собирается из случайных литер,
// под ним прочерчивается подстрочная линия-прогресс. Дети монтируются
// в момент начала раскрытия, чтобы их входные анимации совпали со
// снятием шторки.
export const Preloader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [phase, setPhase] = useState<Phase>(() =>
        window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "done" : "loading"
    );
    const overlayRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        if (phase !== "loading") return;

        const overlay = overlayRef.current!;
        const rule = overlay.querySelector(".preloader__rule") as HTMLElement;
        const counter = overlay.querySelector(".preloader__counter") as HTMLElement;

        gsap.set(rule, { scaleX: 0, transformOrigin: "left center" });

        gsap.to(".preloader__word", {
            duration: 1.2,
            scrambleText: { text: "подстрочник", chars: CYRILLIC_CHARS, speed: 0.6 },
            ease: "none",
        });

        const ruleTo = gsap.quickTo(rule, "scaleX", { duration: 0.3, ease: "power2.out" });

        let progress = 0;
        let pageLoaded = document.readyState === "complete";
        const onLoad = () => { pageLoaded = true; };
        window.addEventListener("load", onLoad);

        const started = performance.now();
        const MIN_TIME = 1400;
        // Аварийный предел: даже если load так и не пришёл,
        // шторка не держит пользователя дольше этого.
        const MAX_TIME = 6000;

        // Прогресс считается от прошедшего времени, а не от числа тиков:
        // в затроттленной фоновой вкладке тик просто «догоняет» значение.
        // Случайный джиттер вниз даёт рваность реального I/O;
        // до загрузки страницы прогресс не превышает 90.
        const tick = window.setInterval(() => {
            const elapsed = performance.now() - started;
            if (elapsed > MAX_TIME) pageLoaded = true;
            const cap = pageLoaded ? 100 : 90;
            const target = Math.min(cap, (elapsed / MIN_TIME) * 100);
            progress = Math.max(progress, Math.round(target - Math.random() * 4));
            progress = Math.min(cap, Math.max(0, progress));
            ruleTo(progress / 100);
            counter.textContent = String(progress).padStart(3, "0");

            if (progress >= 100 && elapsed >= MIN_TIME) {
                window.clearInterval(tick);
                setPhase("revealing");
            }
        }, 24);

        return () => {
            window.clearInterval(tick);
            window.removeEventListener("load", onLoad);
        };
    }, { scope: overlayRef, dependencies: [phase] });

    useGSAP(() => {
        if (phase !== "revealing") return;
        const overlay = overlayRef.current!;

        gsap.timeline({ onComplete: () => setPhase("done") })
            .to(".preloader__counter", { autoAlpha: 0, y: -10, duration: 0.25, ease: "power2.in" })
            .to(".preloader__word", { yPercent: -120, autoAlpha: 0, duration: 0.45, ease: "power3.in" }, "<")
            .to(".preloader__rule", { scaleX: 0, transformOrigin: "right center", duration: 0.4, ease: "carriage" }, "-=0.2")
            .to(overlay, {
                clipPath: "inset(0% 0% 100% 0%)",
                duration: 0.7,
                ease: "carriage",
            }, "-=0.1");
    }, { scope: overlayRef, dependencies: [phase] });

    return (
        <>
            {/* Контент монтируется сразу — запрос постов и картинок должен
                идти параллельно с декоративной шторкой, а не после неё.
                Шторка просто визуально перекрывает уже загружающийся сайт. */}
            {children}
            {phase !== "done" && (
                <div className="preloader" ref={overlayRef} aria-hidden="true">
                    <div className="preloader__center">
                        <div className="preloader__word-mask">
                            <span className="preloader__word">п</span>
                        </div>
                        <div className="preloader__rule"></div>
                        <span className="preloader__counter">000</span>
                    </div>
                </div>
            )}
        </>
    );
};
