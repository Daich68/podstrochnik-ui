import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { GetPost } from "../../api/Posts";
import { Post } from "../../entity/Entity";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./Main.css";
import { RemoveLinksFromHTML, sliderSettingsV2Main, StripHtml, UpdateFavicon} from "../../utils/Style";
import lupaIcon from "../../static/lupa.svg";
import arrowIcon from "../../static/arrow.svg";
import { gsap, useGSAP, ScrollTrigger, SplitText, CYRILLIC_CHARS } from "../../anim/gsapSetup";
import { onPageRevealed } from "../../anim/pageReveal";
import { cachePosts } from "../../api/postCache";

// Кэш постов на время сессии: возврат на главную рендерится мгновенно,
// без ожидания сети. Порядок стабилен — перемешивание держится на
// seed из sessionStorage (новый посетитель = новый порядок, но внутри
// сессии/после reload читатель находит карточки на тех же местах).
let postsCache: Post[] | null = null;

const SHUFFLE_SEED_KEY = "podstrochnik-shuffle-seed";

const getSessionSeed = (): number => {
    const stored = sessionStorage.getItem(SHUFFLE_SEED_KEY);
    if (stored) return Number(stored);
    const seed = Math.floor(Math.random() * 2147483647);
    sessionStorage.setItem(SHUFFLE_SEED_KEY, String(seed));
    return seed;
};

// mulberry32 — маленький детерминированный PRNG для Fisher–Yates
// (в отличие от sort(() => Math.random() - 0.5), даёт равномерную тасовку).
const mulberry32 = (seed: number) => {
    let s = seed;
    return () => {
        s |= 0; s = (s + 0x6D2B79F5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

const shuffle = (data: Post[]) => {
    const rand = mulberry32(getSessionSeed());
    const arr = [...data];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

const randomCyr = () =>
    CYRILLIC_CHARS[Math.floor(Math.random() * CYRILLIC_CHARS.length)];

export const MainPage: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>(() => (postsCache ? shuffle(postsCache) : []));
    const [loading, setLoading] = useState(() => !postsCache);
    const [loadError, setLoadError] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
    const [isSearchOpen, setIsSearchOpen] = useState(() => !!searchParams.get("search"));

    // useMemo, а не state+effect: фильтрация всегда синхронна с posts/
    // searchQuery в один и тот же рендер — без промежуточного кадра,
    // где loading уже false, а filteredPosts ещё не пересчитан (именно
    // такой кадр давал вспышку «ничего не нашлось» поверх «загружается»).
    const filteredPosts = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return posts.filter(post =>
            StripHtml(post.title).toLowerCase().includes(q) ||
            StripHtml(post.author_name).toLowerCase().includes(q)
        );
    }, [posts, searchQuery]);

    const pageRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const entranceDone = useRef(false);
    const primedRef = useRef(false);

    // Контент монтируется сразу за шторкой (см. Preloader/RouteTransition),
    // поэтому входные анимации должны ждать этот сигнал — иначе они целиком
    // проигрываются, пока шторка ещё закрыта, и до зрителя не долетают.
    const [revealed, setRevealed] = useState(false);
    useEffect(() => onPageRevealed(() => setRevealed(true)), []);

    useEffect(() => {
        if (postsCache) return;
        GetPost()
            .then(data => {
                postsCache = data;
                cachePosts(data);
                setPosts(shuffle(data));
            })
            .catch(error => {
                console.error(error);
                setLoadError(true);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        UpdateFavicon("#7a7a26");
    }, []);

    // Заголовок: буквы поднимаются из-под «подстрочной» линии,
    // затем линия прочерчивается и под ней проявляется глосс-транслит.
    // Ждём открытия шторки — иначе анимация проиграется впустую за ней.
    useGSAP(() => {
        if (!revealed) return;
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduced) return;

        const split = SplitText.create(".site-title h1", { type: "chars", mask: "chars" });
        const tl = gsap.timeline();

        tl.from(split.chars, {
            yPercent: 115,
            rotation: () => gsap.utils.random(-9, 9),
            duration: 0.7,
            ease: "carriage",
            stagger: { each: 0.028, from: "start" },
        })
            .fromTo(".title-rule",
                { scaleX: 0, transformOrigin: "left center" },
                { scaleX: 1, duration: 0.55, ease: "carriage" },
                "-=0.25")
            .to(".title-gloss", {
                duration: 1.1,
                scrambleText: {
                    text: "proekt podstrochnik",
                    chars: "abcdefghijklmnopqrstuvwxyz*",
                    speed: 0.8,
                },
                autoAlpha: 0.6,
                ease: "none",
            }, "-=0.3");

        return () => split.revert();
    }, { scope: pageRef, dependencies: [revealed] });

    // Карточки — вход в два шага:
    // 1) «примирование» — прячем карточки в клип сразу, как только они
    //    попали в DOM (ещё за закрытой шторкой, зритель этого не видит);
    // 2) «раскрытие» — стартует только по сигналу открытия шторки, чтобы
    //    печатный жест реально был виден, а не проигрывался вхолостую.
    useGSAP(() => {
        if (primedRef.current) return;
        const cards = gsap.utils.toArray<HTMLElement>(".post-card");
        if (!cards.length) return;
        primedRef.current = true;

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            entranceDone.current = true;
            return;
        }

        gsap.set(cards, {
            clipPath: "inset(0% 0% 100% 0%)",
            y: 36,
            rotation: () => gsap.utils.random(-1.2, 1.2),
            willChange: "transform, clip-path",
        });
    }, { scope: gridRef, dependencies: [filteredPosts] });

    useGSAP(() => {
        if (entranceDone.current || !revealed) return;
        const cards = gsap.utils.toArray<HTMLElement>(".post-card");
        if (!cards.length) return;
        entranceDone.current = true;

        ScrollTrigger.batch(cards, {
            start: "top 96%",
            once: true,
            onEnter: batch => {
                gsap.to(batch, {
                    clipPath: "inset(0% 0% 0% 0%)",
                    y: 0,
                    rotation: 0,
                    duration: 0.85,
                    ease: "stamp",
                    stagger: 0.07,
                    clearProps: "willChange,clipPath",
                });
            },
        });

        // Позиции карточек мерялись, пока часть из них ещё грузила картинки —
        // без пересчёта batch может решить, что триггер уже пройден, и никогда
        // не раскрыть карточку. Сигнал сюда приходит через setTimeout (см.
        // pageReveal.ts), т.е. уже вне цикла эффекта шторки — пересчёт безопасен.
        requestAnimationFrame(() => ScrollTrigger.refresh());
    }, { scope: gridRef, dependencies: [filteredPosts, revealed] });

    // Наклон карточки к курсору (только точный указатель).
    useGSAP((context, contextSafe) => {
        const grid = gridRef.current;
        if (!grid || !window.matchMedia("(pointer: fine)").matches) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        type Tilt = { rx: (v: number) => void; ry: (v: number) => void };
        const tilts = new WeakMap<HTMLElement, Tilt>();

        const getTilt = (card: HTMLElement): Tilt => {
            let t = tilts.get(card);
            if (!t) {
                t = {
                    rx: gsap.quickTo(card, "rotationX", { duration: 0.9, ease: "power2.out" }),
                    ry: gsap.quickTo(card, "rotationY", { duration: 0.9, ease: "power2.out" }),
                };
                tilts.set(card, t);
            }
            return t;
        };

        const onMove = contextSafe!((e: PointerEvent) => {
            const target = e.target instanceof Element ? e.target.closest<HTMLElement>(".post-card") : null;
            if (!target) return;
            const r = target.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - 0.5;
            const py = (e.clientY - r.top) / r.height - 0.5;
            const t = getTilt(target);
            t.ry(px * 3);
            t.rx(py * -3);
        });

        const onOut = contextSafe!((e: PointerEvent) => {
            const target = e.target instanceof Element ? e.target.closest<HTMLElement>(".post-card") : null;
            if (!target) return;
            if (e.relatedTarget instanceof Node && target.contains(e.relatedTarget)) return;
            const t = getTilt(target);
            t.rx(0);
            t.ry(0);
        });

        grid.addEventListener("pointermove", onMove, { passive: true });
        grid.addEventListener("pointerout", onOut, { passive: true });
        return () => {
            grid.removeEventListener("pointermove", onMove);
            grid.removeEventListener("pointerout", onOut);
        };
    }, { scope: gridRef });

    // Футер: линия прочерчивается, строки поднимаются.
    useGSAP(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        gsap.from(".footer-divider", {
            scaleX: 0,
            transformOrigin: "center",
            duration: 0.8,
            ease: "carriage",
            scrollTrigger: { trigger: ".site-footer", start: "top 98%", once: true },
        });
        gsap.from(".site-footer p", {
            autoAlpha: 0,
            y: 14,
            duration: 0.6,
            ease: "power2.out",
            stagger: 0.09,
            scrollTrigger: { trigger: ".site-footer", start: "top 98%", once: true },
        });
    }, { scope: pageRef, dependencies: [filteredPosts.length > 0], revertOnUpdate: true });

    // Счётчик результатов — сноска «* N», пропечатывается при каждом
    // изменении запроса.
    useGSAP(() => {
        if (!isSearchOpen || !searchQuery) return;
        gsap.to(".search-count", {
            duration: 0.45,
            scrambleText: {
                text: `* ${filteredPosts.length}`,
                chars: "0123456789*",
                speed: 1,
            },
            ease: "none",
        });
    }, { scope: pageRef, dependencies: [filteredPosts.length, searchQuery, isSearchOpen] });

    const { contextSafe } = useGSAP({ scope: pageRef });

    const animateSearch = contextSafe((open: boolean) => {
        const container = pageRef.current?.querySelector(".search-container");
        const input = searchInputRef.current;
        if (!container || !input) return;
        const targetW = window.innerWidth < 700 ? 110 : 260;
        if (open) {
            // Placeholder «пропечатывается» слева направо из случайных литер
            const target = "поиск...";
            const proxy = { p: 0 };
            gsap.timeline()
                .to(container, { width: targetW, marginLeft: 0, duration: 0.5, ease: "carriage" })
                .fromTo(".search-rule",
                    { scaleX: 0 },
                    { scaleX: 1, duration: 0.5, ease: "carriage" },
                    "-=0.35")
                .fromTo(".search-input", { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: "power2.out" }, "-=0.35")
                .add(() => input.focus(), "-=0.2")
                .to(proxy, {
                    p: 1,
                    duration: 0.6,
                    ease: "none",
                    onUpdate: () => {
                        const done = Math.floor(proxy.p * target.length);
                        input.placeholder =
                            target.slice(0, done) +
                            Array.from({ length: target.length - done }, randomCyr).join("");
                    },
                }, "-=0.4");
        } else {
            gsap.timeline()
                .to(".search-input", { autoAlpha: 0, x: -10, duration: 0.25, ease: "power2.in" })
                .to(".search-rule", { scaleX: 0, transformOrigin: "right center", duration: 0.35, ease: "carriage" }, "<")
                .to(container, { width: 0, marginLeft: -16, duration: 0.35, ease: "power3.inOut" }, "-=0.15");
        }
    });

    // Если пришли по ссылке с ?search= — поиск сразу открыт, без анимации.
    useGSAP(() => {
        if (!isSearchOpen) return;
        const container = pageRef.current?.querySelector(".search-container");
        if (!container) return;
        gsap.set(container, {
            width: window.innerWidth < 700 ? 110 : 260,
            marginLeft: 0,
        });
        gsap.set(".search-rule", { scaleX: 1 });
        gsap.set(".search-input", { autoAlpha: 1 });
    }, { scope: pageRef });

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);
        searchParams.set("search", value);
        setSearchParams(searchParams);
    };

    const toggleSearch = () => {
        const next = !isSearchOpen;
        setIsSearchOpen(next);
        animateSearch(next);
        if (!next) {
            // Clear search when hiding
            setSearchQuery("");
            searchParams.delete("search");
            setSearchParams(searchParams);
        }
    };

    const scheduleRefresh = () => {
        if (refreshTimer.current) clearTimeout(refreshTimer.current);
        refreshTimer.current = setTimeout(() => ScrollTrigger.refresh(), 250);
    };

    return (
        <div ref={pageRef}>
            <div className="header-container">
                <div className="site-title">
                    <div className="title-block">
                        <h1>проект подстрочник</h1>
                        <div className="title-rule" aria-hidden="true"></div>
                        <div className="title-gloss" aria-hidden="true"></div>
                    </div>
                    {!isSearchOpen && <button type="button" className="search-icon" onClick={toggleSearch}
                                              aria-label="открыть поиск" data-cursor data-cursor-text="поиск">
                        <img src={lupaIcon} alt="" aria-hidden="true"/>
                    </button>}
                    <div className={`search-container ${isSearchOpen ? "open" : ""}`}>
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="поиск..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onKeyDown={(e) => { if (e.key === "Escape") toggleSearch(); }}
                            className="search-input"
                            aria-label="поиск по постам"
                        />
                        <div className="search-rule" aria-hidden="true"></div>
                    </div>
                    {isSearchOpen && searchQuery && <span className="search-count" aria-live="polite"></span>}
                    {isSearchOpen && <button type="button" className="search-icon icon-transform" onClick={toggleSearch}
                                              aria-label="закрыть поиск" data-cursor>
                        <img src={arrowIcon} alt="" aria-hidden="true"/>
                    </button>}
                </div>
            </div>
            <div className="masonry-grid" ref={gridRef}>
                {filteredPosts.map(post => (
                    <Link to={`/post/${post._id}`} key={post._id} className="post-card"
                          style={{backgroundColor: post.color}}>
                        <div className="slider-container">
                            {post.cards.length > 1 ? (
                                <Slider {...sliderSettingsV2Main(post.cards.length, false)}>
                                {post.cards.map((url, index) => (
                                        // eslint-disable-next-line
                                        <img key={index} src={url}
                                             alt={index === 0 ? StripHtml(post.title) : ""}
                                             onLoad={scheduleRefresh} />
                                    ))}
                                </Slider>
                            ) : (
                                // Один кадр — не монтируем react-slick вовсе: на сетке из
                                // десятков карточек лишний слайдер на мобильном заметно
                                // тяжелее обычной картинки и тормозит первую отрисовку.
                                // eslint-disable-next-line
                                <img src={post.cards[0]} alt={StripHtml(post.title)} onLoad={scheduleRefresh} />
                            )}
                        </div>
                        <div className="post-info">
                            <h3 dangerouslySetInnerHTML={{ __html: RemoveLinksFromHTML(post.title) }} />
                            <p dangerouslySetInnerHTML={{ __html: RemoveLinksFromHTML(post.author_name) }} />
                        </div>
                    </Link>
                ))}
                {loading && (
                    <p className="empty-state">* загружается архив</p>
                )}
                {loadError && (
                    <p className="empty-state">* не получилось загрузить архив — попробуйте обновить страницу</p>
                )}
                {!loading && !loadError && searchQuery && filteredPosts.length === 0 && (
                    <p className="empty-state">* ничего не нашлось</p>
                )}
            </div>
            <hr className="footer-divider"/>
            <footer className="site-footer">
                <p>* дизайн — <a href="https://katyamezentseva.com" target="_blank" rel="noopener noreferrer">katyamezentseva.com</a></p>
                <p>** главный редактор — <a href="https://alialiev.com" target="_blank" rel="noopener noreferrer">alialiev.com</a></p>
                <p>*** тг: <a href="https://t.me/podstrochnik_project" target="_blank" rel="noopener noreferrer">@podstrochnik_project</a></p>
            </footer>

        </div>
    );
};
