import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { getLenis } from "../anim/SmoothScroll";
import "./TypeScrollbar.css";

/**
 * TypeScrollbar — скроллбар-«наборная строка».
 *
 * Вдоль правого края — плотная колонка латинских литер. Прогресс
 * скролла — это фронт печати: всё, что выше, «пропечатано» — яркие
 * литеры складываются в глосс proekt*podstrochnik*; всё, что ниже, —
 * тусклый несобранный набор, который пересыпается, пока страница
 * движется. Литера на самом фронте — «каретка», подчёркнута.
 *
 * Трек кликабелен, фронт таскается. Только при точном указателе;
 * на тач-устройствах остаётся тонкий CSS-фолбэк из scrollbar.css.
 */

const PHRASE = "proekt*podstrochnik*";
const LATIN = "abcdefghijklmnopqrstuvwxyz*";
const LINE_H = 11;
const IDLE_MS = 240;

const randomLatin = () =>
    LATIN[Math.floor(Math.random() * LATIN.length)];

const TypeScrollbar: React.FC = () => {
    const enabled =
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(pointer: fine)").matches;

    const trackRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!enabled) return;
        const track = trackRef.current;
        if (!track) return;

        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        document.documentElement.classList.add("has-type-scrollbar");

        let spans: HTMLSpanElement[] = [];
        let idleTimer: number | null = null;
        let rafPending = false;
        let dragging = false;

        const docHeight = () => document.documentElement.scrollHeight;
        const viewH = () => window.innerHeight;
        const maxScroll = () => Math.max(0, docHeight() - viewH());
        const progress = () => (maxScroll() > 0 ? window.scrollY / maxScroll() : 0);

        const build = () => {
            const n = Math.max(12, Math.floor(viewH() / LINE_H));
            track.innerHTML = "";
            spans = [];
            for (let i = 0; i < n; i++) {
                const s = document.createElement("span");
                // Литера, которая пропечатается на этой позиции, задана заранее
                s.dataset.target = PHRASE[i % PHRASE.length];
                s.textContent = randomLatin();
                track.appendChild(s);
                spans.push(s);
            }
        };

        // scrambling=true — страница движется, несобранный набор пересыпается
        const render = (scrambling: boolean) => {
            const n = spans.length;
            const frontier = Math.round(progress() * n);
            spans.forEach((s, i) => {
                if (i < frontier) {
                    s.textContent = s.dataset.target!;
                    s.className = "is-printed";
                } else if (i === frontier) {
                    s.textContent = scrambling && !reduced ? randomLatin() : s.dataset.target!;
                    s.className = "is-head";
                } else {
                    if (scrambling && !reduced) s.textContent = randomLatin();
                    s.className = "";
                }
            });
        };

        const update = () => {
            track.style.display = maxScroll() < 4 ? "none" : "";
            render(true);
            if (idleTimer) window.clearTimeout(idleTimer);
            idleTimer = window.setTimeout(() => render(false), IDLE_MS);
        };

        const onScroll = () => {
            if (rafPending) return;
            rafPending = true;
            requestAnimationFrame(() => {
                rafPending = false;
                update();
            });
        };

        const scrollToY = (y: number, immediate: boolean) => {
            const lenis = getLenis();
            if (lenis) lenis.scrollTo(y, { immediate });
            else window.scrollTo({ top: y, behavior: immediate ? "auto" : "smooth" });
        };

        const yToScroll = (clientY: number) => {
            const p = Math.min(1, Math.max(0, clientY / viewH()));
            return p * maxScroll();
        };

        const onPointerDown = (e: PointerEvent) => {
            dragging = true;
            track.setPointerCapture(e.pointerId);
            scrollToY(yToScroll(e.clientY), false);
        };
        const onPointerMove = (e: PointerEvent) => {
            if (!dragging) return;
            scrollToY(yToScroll(e.clientY), true);
        };
        const onPointerUp = (e: PointerEvent) => {
            dragging = false;
            try { track.releasePointerCapture(e.pointerId); } catch {}
        };

        const onResize = () => {
            build();
            update();
        };

        build();
        update();
        render(false);

        // Высота документа меняется (грузятся картинки, роуты) — следим.
        const ro = new ResizeObserver(onScroll);
        ro.observe(document.body);

        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onResize);
        track.addEventListener("pointerdown", onPointerDown);
        track.addEventListener("pointermove", onPointerMove);
        track.addEventListener("pointerup", onPointerUp);
        track.addEventListener("pointercancel", onPointerUp);

        return () => {
            ro.disconnect();
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onResize);
            track.removeEventListener("pointerdown", onPointerDown);
            track.removeEventListener("pointermove", onPointerMove);
            track.removeEventListener("pointerup", onPointerUp);
            track.removeEventListener("pointercancel", onPointerUp);
            if (idleTimer) window.clearTimeout(idleTimer);
            document.documentElement.classList.remove("has-type-scrollbar");
        };
    }, [enabled]);

    if (!enabled) return null;

    return createPortal(
        <div className="type-scrollbar" ref={trackRef} aria-hidden="true" data-cursor />,
        document.body
    );
};

export default TypeScrollbar;
