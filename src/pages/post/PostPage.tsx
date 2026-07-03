import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { GetPostByID } from "../../api/Posts";
import { Post } from "../../entity/Entity";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./PostPage.css";
import { InnerDangerous } from "../../utils/InnerDangerous";
import { GetPrettyTimePub } from "../../utils/DatetimeUtils";
import { IsDarkColor, isMobileDeviceV3, sliderSettingsV2Post, StripHtml, UpdateFavicon } from "../../utils/Style";
import useSound from "use-sound";
// @ts-ignore
import page from "../../static/page.wav"
import { gsap, useGSAP, SplitText, CYRILLIC_CHARS } from "../../anim/gsapSetup";
import { onPageRevealed } from "../../anim/pageReveal";
import { cachePost, getCachedPost } from "../../api/postCache";

export const PostPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    // Если пост уже известен из списка на главной — доступен с первого
    // рендера, без промежуточного "пустого" кадра.
    const [post, setPost] = useState<Post | null>(() => (id && getCachedPost(id)) || null);
    const [showLinks, setShowLinks] = useState(false);
    const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [playButton] = useSound(page, {volume: 1} );
    const [isMobile, setIsMobile] = useState(isMobileDeviceV3(700));

    const containerRef = useRef<HTMLDivElement>(null);
    const sliderRef = useRef<Slider>(null);

    // Контент монтируется сразу за шторкой — цвет страницы должен
    // «перекраситься» в цвет поста в момент, когда шторка открывается,
    // а не быть уже готовым (мгновенным) под ней.
    const [revealed, setRevealed] = useState(false);
    useEffect(() => onPageRevealed(() => setRevealed(true)), []);


    useEffect(() => {
        if (!id) return;
        const cached = getCachedPost(id);
        if (cached) {
            setPost(cached);
            return;
        }
        GetPostByID(id)
            .then(data => {
                cachePost(data);
                setPost(data);
            })
            .catch(console.error);
    }, [id]);

    useEffect(() => {
        const handleResize = () => setIsMobile(isMobileDeviceV3(700));
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (post) UpdateFavicon(post.color);
    }, [post]);

    // Перекраска фона в цвет поста — синхронизирована с открытием шторки
    // (см. onPageRevealed), а не мгновенная подстановка при монтировании.
    useGSAP(() => {
        if (!post || !revealed) return;
        const el = containerRef.current;
        if (!el) return;

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            gsap.set(el, { backgroundColor: post.color });
            return;
        }

        gsap.fromTo(el,
            { backgroundColor: "#7a7a26" },
            { backgroundColor: post.color, duration: 0.7, ease: "power2.out" }
        );
    }, { scope: containerRef, dependencies: [post, revealed] });

    // Вход: кнопки топ-бара опускаются, заголовок собирается словами
    // из-под маски, прочерчивается подстрочная линия, под ней проявляется
    // автор-глосс, слайдер «печатается» — раскрывается сверху вниз.
    useGSAP(() => {
        if (!post) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        const title = containerRef.current?.querySelector(".post-title");
        const split = title ? SplitText.create(title, { type: "words", mask: "words" }) : null;

        const tl = gsap.timeline();
        tl.from(".top-bar .helpful-links-btn", {
            y: -18,
            autoAlpha: 0,
            duration: 0.5,
            ease: "power3.out",
            stagger: 0.08,
        });
        if (split) {
            tl.from(split.words, {
                yPercent: 120,
                duration: 0.7,
                ease: "carriage",
                stagger: 0.06,
            }, "-=0.25");
        }
        tl.fromTo(".post-rule",
            { scaleX: 0, transformOrigin: "left center" },
            { scaleX: 1, duration: 0.5, ease: "carriage" },
            "-=0.3")
            .from(".post-author", {
                autoAlpha: 0,
                y: 10,
                duration: 0.5,
                ease: "power2.out",
            }, "-=0.2")
            .fromTo(".post-slider",
                { clipPath: "inset(0% 0% 100% 0%)", y: 24 },
                { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 0.9, ease: "stamp" },
                "-=0.3")
            .from(".post-counter", {
                autoAlpha: 0,
                duration: 0.5,
                ease: "power2.out",
            }, "-=0.3");

        return () => split?.revert();
    }, { scope: containerRef, dependencies: [post], revertOnUpdate: true });

    // «Примечания»: страница чтения сжимается, вокруг неё возникает
    // чернильная вуаль в палитре прелоадера, а по полям — маргиналии:
    // слева сноски-ссылки, справа вертикальный глосс редактора, внизу дата.
    useGSAP(() => {
        if (!showLinks) return;
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduced) return;

        gsap.timeline()
            .to(".post-page-inner", { scale: 0.8, duration: 0.65, ease: "carriage" })
            .fromTo(".marginalia__veil", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45 }, "<")
            .to(".marginalia__label", {
                duration: 0.9,
                scrambleText: { text: "* примечания", chars: CYRILLIC_CHARS, speed: 0.6 },
                ease: "none",
            }, "-=0.2")
            .fromTo(".marginalia__rule",
                { scaleX: 0, transformOrigin: "left center" },
                { scaleX: 1, duration: 0.5, ease: "carriage" },
                "<")
            .from(".marginalia__body, .marginalia__editor, .marginalia__date", {
                autoAlpha: 0,
                y: 16,
                duration: 0.5,
                ease: "power2.out",
                stagger: 0.09,
            }, "-=0.5");
    }, { scope: containerRef, dependencies: [showLinks], revertOnUpdate: true });

    // Полноэкранный просмотр: наплыв с лёгким «доворотом» кадра.
    useGSAP(() => {
        if (fullscreenIndex === null) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        gsap.timeline()
            .from(".fullscreen-overlay", { autoAlpha: 0, duration: 0.35, ease: "power2.out" })
            .from(".fullscreen-image", {
                scale: 0.92,
                rotation: 1.5,
                autoAlpha: 0,
                duration: 0.5,
                ease: "stamp",
            }, "-=0.15")
            .from(".fullscreen-overlay button, .fullscreen-counter", {
                autoAlpha: 0,
                duration: 0.3,
                stagger: 0.05,
            }, "-=0.3");
    }, { scope: containerRef, dependencies: [fullscreenIndex !== null], revertOnUpdate: true });

    const { contextSafe } = useGSAP({ scope: containerRef });

    // Смена кадра в полноэкранном режиме: короткий «перелист».
    const flipImage = contextSafe((dir: 1 | -1) => {
        gsap.fromTo(".fullscreen-image",
            { x: 40 * dir, rotation: 1.2 * dir, autoAlpha: 0.4 },
            { x: 0, rotation: 0, autoAlpha: 1, duration: 0.45, ease: "power3.out" });
    });

    const closeFullscreen = contextSafe(() => {
        const overlay = containerRef.current?.querySelector(".fullscreen-overlay");
        if (!overlay || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setFullscreenIndex(null);
            return;
        }
        gsap.to(overlay, {
            autoAlpha: 0,
            duration: 0.3,
            ease: "power2.in",
            onComplete: () => setFullscreenIndex(null),
        });
    });

    const openFullscreen = (index: number) => setFullscreenIndex(index);
    const nextImage = () => {
        if (!post) return;
        setFullscreenIndex((prev) => (prev !== null && prev < post.cards.length - 1 ? prev + 1 : 0))
        playButton();
        flipImage(1);
    };
    const prevImage = () => {
        if (!post) return;
        setFullscreenIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : post.cards.length - 1))
        playButton();
        flipImage(-1);
    };

    // Пока открыт полноэкранный просмотр — не даём скроллиться фону.
    useEffect(() => {
        if (fullscreenIndex === null) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = prevOverflow; };
    }, [fullscreenIndex]);

    // Клавиатура: в полноэкранном режиме Esc/стрелки; в режиме чтения
    // стрелки листают слайдер, Esc закрывает примечания.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (fullscreenIndex !== null) {
                if (e.key === "Escape") closeFullscreen();
                if (e.key === "ArrowRight") nextImage();
                if (e.key === "ArrowLeft") prevImage();
            } else if (showLinks) {
                if (e.key === "Escape") setShowLinks(false);
            } else {
                if (e.key === "ArrowRight") sliderRef.current?.slickNext();
                if (e.key === "ArrowLeft") sliderRef.current?.slickPrev();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    });

    if (!post) return <p className="post-loading">…</p>;

    return (
        <div className={`post-container ${IsDarkColor(post.color) ? "on-dark" : "on-light"}`} ref={containerRef}>
            <div className="top-bar">
                <Link className="helpful-links-btn" style={{textDecoration: "none"}} to={"/"} aria-label="на главную">
                    <span className="btn-mark">←</span>{isMobile ? "" : " на главную"}
                </Link>
                <button type="button" className="helpful-links-btn" onClick={() => openFullscreen(currentSlide)} aria-label="полный экран">
                    <span className="btn-mark">⤢</span>{isMobile? "" : " полный экран"}
                </button>
                {!showLinks ?
                    <button type="button" className="helpful-links-btn" onClick={() => setShowLinks(true)} aria-label="полезные ссылки">
                        <span className="btn-mark">*</span>{isMobile? "" :  " полезные ссылки"}
                    </button>
                    :
                    <button type="button" className="helpful-links-btn" onClick={() => setShowLinks(false)} aria-label="закрыть примечания">
                        <span className="btn-mark">×</span>{isMobile? "" :" закрыть"}
                    </button>
                }
            </div>

            <div className="post-page-inner">
                <div className="post-heading">
                    <h1 className="post-title"><InnerDangerous html={post.title} /></h1>
                    <div className="post-rule" aria-hidden="true"></div>
                    <div className="post-author"><InnerDangerous html={post.author_name} /></div>
                </div>

                <Slider ref={sliderRef}
                        {...sliderSettingsV2Post(post.cards.length, !isMobile)}
                        afterChange={(i: number) => { setCurrentSlide(i); playButton(); }}
                        className="post-slider">
                    {post.cards.map((card, index) => (
                        <div key={index} className="post-slide"
                             onClick={() => openFullscreen(index)}
                        >
                            <img src={card} alt={`Slide ${index + 1}`} className="post-image" data-cursor data-cursor-text="лист" />
                        </div>
                    ))}
                </Slider>
                {post.cards.length > 1 &&
                    <p className="post-counter">лист {currentSlide + 1} из {post.cards.length}</p>}
            </div>

            {showLinks && (
                <div className="marginalia">
                    <div className="marginalia__veil"></div>
                    <aside className="marginalia__links">
                        <span className="marginalia__label">* примечания</span>
                        <div className="marginalia__rule" aria-hidden="true"></div>
                        <div className="marginalia__body"><InnerDangerous html={post.helpful_links} /></div>
                        <div className="marginalia__editor"><InnerDangerous html={post.editor_name} /></div>
                        <p className="marginalia__date">опубликовано: {GetPrettyTimePub({ date: new Date(post.time_publication) })}</p>
                    </aside>
                </div>
            )}

            {fullscreenIndex !== null && (
                <div className="fullscreen-overlay">
                    <button type="button" className="close-btn" onClick={closeFullscreen} aria-label="закрыть полноэкранный режим">×</button>
                    {post.cards.length > 1 && <button type="button" className="prev-btn" onClick={prevImage} aria-label="предыдущий лист">‹</button>}
                    <img src={post.cards[fullscreenIndex]} alt={StripHtml(post.title)} className="fullscreen-image" />
                    {post.cards.length > 1 && <button type="button" className="next-btn" onClick={nextImage} aria-label="следующий лист">›</button>}
                    {post.cards.length > 1 &&
                        <span className="fullscreen-counter">{fullscreenIndex + 1} / {post.cards.length}</span>}
                </div>
            )}
        </div>
    );
};
