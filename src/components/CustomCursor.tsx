import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import "./CustomCursor.css";

/**
 * CustomCursor — курсор-«сноска».
 *
 * Маленькая точка следует за указателем мгновенно, а знак сноски (※)
 * тянется за ней с инерцией (gsap.quickTo + expo.out). Над интерактивными
 * элементами знак увеличивается и слегка проворачивается; элементы с
 * атрибутом data-cursor-text показывают рядом надстрочную подпись.
 *
 * Включается только при наличии точного указателя (pointer: fine).
 * На тач-устройствах не рендерит ничего и не трогает <html>.
 * При prefers-reduced-motion: reduce инерция отключается (следует мгновенно).
 */

const INTERACTIVE_SELECTOR =
  "a, button, input, textarea, select, [data-cursor]";

const CustomCursor: React.FC = () => {
  // Вычисляется один раз: есть ли точный указатель вообще.
  const [enabled] = useState<boolean>(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: fine)").matches
  );

  const markRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const glyphRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const mark = markRef.current;
    const dot = dotRef.current;
    const glyph = glyphRef.current;
    const label = labelRef.current;
    if (!mark || !dot || !glyph || !label) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    document.documentElement.classList.add("has-custom-cursor");

    // Стартовое состояние: спрятано, центрировано относительно точки курсора.
    gsap.set([mark, dot], { xPercent: -50, yPercent: -50, autoAlpha: 0 });
    gsap.set(label, { autoAlpha: 0, y: 4 });

    // Инерционное следование. При reduced-motion — мгновенное.
    const markX = gsap.quickTo(mark, "x", {
      duration: reduced ? 0 : 0.5,
      ease: "expo.out",
    });
    const markY = gsap.quickTo(mark, "y", {
      duration: reduced ? 0 : 0.5,
      ease: "expo.out",
    });
    const dotX = gsap.quickTo(dot, "x", {
      duration: reduced ? 0 : 0.12,
      ease: "expo.out",
    });
    const dotY = gsap.quickTo(dot, "y", {
      duration: reduced ? 0 : 0.12,
      ease: "expo.out",
    });

    let visible = false;
    let hovered: Element | null = null;

    const show = () => {
      if (visible) return;
      visible = true;
      gsap.to([mark, dot], { autoAlpha: 1, duration: 0.25, overwrite: "auto" });
    };

    const hide = () => {
      visible = false;
      gsap.to([mark, dot], { autoAlpha: 0, duration: 0.3, overwrite: "auto" });
    };

    const onPointerMove = (e: PointerEvent) => {
      markX(e.clientX);
      markY(e.clientY);
      dotX(e.clientX);
      dotY(e.clientY);
      show();
    };

    const enterHover = (el: Element) => {
      gsap.to(glyph, {
        scale: 1.9,
        rotation: 90,
        duration: reduced ? 0 : 0.45,
        ease: "expo.out",
        overwrite: "auto",
      });
      const text = el.getAttribute("data-cursor-text");
      if (text) {
        label.textContent = text;
        gsap.to(label, {
          autoAlpha: 1,
          y: 0,
          duration: reduced ? 0 : 0.3,
          ease: "expo.out",
          overwrite: "auto",
        });
      }
    };

    const leaveHover = () => {
      gsap.to(glyph, {
        scale: 1,
        rotation: 0,
        duration: reduced ? 0 : 0.45,
        ease: "expo.out",
        overwrite: "auto",
      });
      gsap.to(label, {
        autoAlpha: 0,
        y: 4,
        duration: reduced ? 0 : 0.2,
        overwrite: "auto",
      });
    };

    // Один mouseover-делегат вместо пары over/out: при переходе на
    // не-интерактивный элемент closest вернёт null — это и есть «уход».
    const onMouseOver = (e: MouseEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      const el = target ? target.closest(INTERACTIVE_SELECTOR) : null;
      if (el === hovered) return;
      hovered = el;
      if (el) enterHover(el);
      else leaveHover();
    };

    // Быстрый «сплющ» при нажатии.
    const onMouseDown = () => {
      gsap.to(mark, {
        scaleX: 1.25,
        scaleY: 0.65,
        duration: reduced ? 0 : 0.15,
        ease: "power3.out",
        overwrite: "auto",
      });
    };

    const onMouseUp = () => {
      gsap.to(mark, {
        scaleX: 1,
        scaleY: 1,
        duration: reduced ? 0 : 0.5,
        ease: "elastic.out(1, 0.45)",
        overwrite: "auto",
      });
    };

    const onDocLeave = () => hide();
    const onWindowBlur = () => hide();

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("mouseover", onMouseOver);
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);
    document.documentElement.addEventListener("mouseleave", onDocLeave);
    window.addEventListener("blur", onWindowBlur);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup", onMouseUp);
      document.documentElement.removeEventListener("mouseleave", onDocLeave);
      window.removeEventListener("blur", onWindowBlur);
      document.documentElement.classList.remove("has-custom-cursor");
      gsap.killTweensOf([mark, dot, glyph, label]);
    };
  }, [enabled]);

  if (!enabled) return null;

  return createPortal(
    <>
      <div className="pod-cursor pod-cursor--mark" ref={markRef} aria-hidden="true">
        <span className="pod-cursor__glyph" ref={glyphRef}>
          ※
        </span>
        <span className="pod-cursor__label" ref={labelRef} />
      </div>
      <div className="pod-cursor pod-cursor--dot" ref={dotRef} aria-hidden="true" />
    </>,
    document.body
  );
};

export default CustomCursor;
