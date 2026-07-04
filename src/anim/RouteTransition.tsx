import React, { useRef, useState } from "react";
import { Location, useLocation } from "react-router-dom";
import { gsap, useGSAP } from "./gsapSetup";
import { scrollToTop } from "./SmoothScroll";
import { notifyPageRevealed } from "./pageReveal";
import "./RouteTransition.css";

const STRIPS = 7;
// Пауза под шторкой после первого пейнта новой страницы — даём
// слайдерам и вёрстке устаканиться, чтобы раскрытие было чистым.
const SETTLE_DELAY = 0.18;

type Props = {
    children: (location: Location) => React.ReactNode;
};

// Переход между страницами: экран «записывается» строками чернил
// слева направо; под закрытой шторкой монтируется и отрисовывается
// новая страница, и только после этого строки «стираются» вправо.
export const RouteTransition: React.FC<Props> = ({ children }) => {
    const location = useLocation();
    const [displayLocation, setDisplayLocation] = useState(location);
    const overlayRef = useRef<HTMLDivElement>(null);
    const animating = useRef(false);
    const pendingReveal = useRef(false);

    // Фаза 1: закрытие шторки, затем подмена страницы.
    useGSAP(() => {
        if (location.pathname === displayLocation.pathname) {
            setDisplayLocation(location);
            return;
        }
        if (animating.current) return;
        animating.current = true;

        const overlay = overlayRef.current!;
        const strips = overlay.querySelectorAll(".route-wipe__strip");
        const mark = overlay.querySelector(".route-wipe__mark");
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        // document.hidden: в фоновой вкладке rAF остановлен — GSAP-таймлайн
        // не сыграет и подмена страницы внутри него не случится никогда.
        // Меняем страницу мгновенно, анимацию всё равно никто не видит.
        if (reduced || document.hidden) {
            setDisplayLocation(location);
            scrollToTop();
            animating.current = false;
            notifyPageRevealed();
            return;
        }

        gsap.timeline()
            .set(overlay, { pointerEvents: "auto", visibility: "visible" })
            .fromTo(
                strips,
                { scaleX: 0, transformOrigin: "left center" },
                { scaleX: 1, duration: 0.42, ease: "carriage", stagger: 0.045 }
            )
            .fromTo(
                mark,
                { autoAlpha: 0, scale: 0.4, rotation: -90 },
                { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.3, ease: "stamp" },
                "-=0.2"
            )
            .add(() => {
                pendingReveal.current = true;
                setDisplayLocation(location);
                scrollToTop();
            });
    }, { dependencies: [location] });

    // Фаза 2: новая страница уже закоммичена; ждём двойной rAF
    // (коммит + первый пейнт под шторкой) и раскрываем.
    useGSAP((_, contextSafe) => {
        if (!pendingReveal.current) return;
        pendingReveal.current = false;

        const overlay = overlayRef.current!;
        const strips = overlay.querySelectorAll(".route-wipe__strip");
        const mark = overlay.querySelector(".route-wipe__mark");

        const reveal = contextSafe!(() => {
            // Вкладка ушла в фон, пока страница менялась под шторкой:
            // rAF стоит, таймлайн раскрытия не сыграет — снимаем шторку
            // мгновенно, без анимации.
            if (document.hidden) {
                notifyPageRevealed();
                gsap.set(overlay, { pointerEvents: "none", visibility: "hidden" });
                animating.current = false;
                return;
            }

            // В момент, когда шторка начинает открываться — новая страница
            // уже отрисована под ней, самое время впустить её собственные
            // входные анимации (карточки, перекраска фона и т.п.).
            notifyPageRevealed();

            gsap.timeline({
                onComplete: () => {
                    animating.current = false;
                },
            })
                .to(mark, { autoAlpha: 0, scale: 0.6, duration: 0.2, ease: "power2.in" })
                .to(
                    strips,
                    { scaleX: 0, transformOrigin: "right center", duration: 0.42, ease: "carriage", stagger: 0.045 },
                    "<"
                )
                .set(overlay, { pointerEvents: "none", visibility: "hidden" });
        });

        let raf2 = 0;
        const raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(() => {
                gsap.delayedCall(SETTLE_DELAY, reveal);
            });
        });

        return () => {
            cancelAnimationFrame(raf1);
            cancelAnimationFrame(raf2);
        };
    }, { dependencies: [displayLocation] });

    return (
        <>
            <div className="route-wipe" ref={overlayRef} aria-hidden="true">
                {Array.from({ length: STRIPS }).map((_, i) => (
                    <div className="route-wipe__strip" key={i} />
                ))}
                <div className="route-wipe__mark">*</div>
            </div>
            {children(displayLocation)}
        </>
    );
};
