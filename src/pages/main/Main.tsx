import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { GetPost } from "../../api/Posts";
import { Post } from "../../entity/Entity";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./Main.css";
import { RemoveLinksFromHTML, sliderSettingsV2Main, UpdateFavicon} from "../../utils/Style";
import lupaIcon from "../../static/lupa.svg";
import arrowIcon from "../../static/arrow.svg";
import { gsap, useGSAP, ScrollTrigger, SplitText, CYRILLIC_CHARS } from "../../anim/gsapSetup";

// Кэш постов на время сессии: возврат на главную рендерится мгновенно,
// без ожидания сети (перемешивание — заново при каждом заходе).
let postsCache: Post[] | null = null;

const shuffle = (data: Post[]) => [...data].sort(() => Math.random() - 0.5);

const randomCyr = () =>
    CYRILLIC_CHARS[Math.floor(Math.random() * CYRILLIC_CHARS.length)];

export const MainPage: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>(() => (postsCache ? shuffle(postsCache) : []));
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
    const [filteredPosts, setFilteredPosts] = useState<Post[]>(posts);
    const [isSearchOpen, setIsSearchOpen] = useState(() => !!searchParams.get("search"));

    const pageRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const entranceDone = useRef(false);

    useEffect(() => {
        if (postsCache) return;
        GetPost()
            .then(data => {
                postsCache = data;
                const shuffled = shuffle(data);
                setPosts(shuffled);
                setFilteredPosts(shuffled);
            })
            .catch(error => console.error(error));
    }, []);

    useEffect(() => {
        setFilteredPosts(
            posts.filter(post =>
                post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.author_name.toLowerCase().includes(searchQuery.toLowerCase())
            )
        );
    }, [searchQuery, posts]);

    useEffect(() => {
        UpdateFavicon("#7a7a26");
    }, []);

    // Заголовок: буквы поднимаются из-под «подстрочной» линии,
    // затем линия прочерчивается и под ней проявляется глосс-транслит.
    useGSAP(() => {
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
    }, { scope: pageRef });

    // Карточки: «отпечатываются» построчно — раскрытие сверху вниз
    // с лёгким поворотом. Только при первом наполнении сетки; фильтрация
    // поиском карточки не переигрывает.
    useGSAP(() => {
        if (entranceDone.current) return;
        const cards = gsap.utils.toArray<HTMLElement>(".post-card");
        if (!cards.length) return;

        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduced) {
            entranceDone.current = true;
            return;
        }
        entranceDone.current = true;

        gsap.set(cards, {
            clipPath: "inset(0% 0% 100% 0%)",
            y: 36,
            rotation: () => gsap.utils.random(-1.2, 1.2),
            willChange: "transform, clip-path",
        });

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

        ScrollTrigger.refresh();
    }, { scope: gridRef, dependencies: [filteredPosts] });

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
        const isMobile = window.innerWidth < 700;
        const targetW = isMobile ? 110 : 260;
        const gap = isMobile ? 8 : 20;
        if (open) {
            // Placeholder «пропечатывается» слева направо из случайных литер
            const target = "поиск...";
            const proxy = { p: 0 };
            gsap.timeline()
                .to(container, { width: targetW, marginLeft: gap, duration: 0.5, ease: "carriage" })
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
                .to(container, { width: 0, marginLeft: 0, duration: 0.35, ease: "power3.inOut" }, "-=0.15");
        }
    });

    // Если пришли по ссылке с ?search= — поиск сразу открыт, без анимации.
    useGSAP(() => {
        if (!isSearchOpen) return;
        const container = pageRef.current?.querySelector(".search-container");
        if (!container) return;
        gsap.set(container, {
            width: window.innerWidth < 700 ? 110 : 260,
            marginLeft: window.innerWidth < 700 ? 8 : 20,
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
            setFilteredPosts(posts);
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
                    {!isSearchOpen && <div className="search-icon" onClick={toggleSearch} data-cursor data-cursor-text="поиск">
                        <img src={lupaIcon} alt="Search"/>
                    </div>}
                    <div className={`search-container ${isSearchOpen ? "open" : ""}`}>
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="поиск..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="search-input"
                        />
                        <div className="search-rule" aria-hidden="true"></div>
                    </div>
                    {isSearchOpen && searchQuery && <span className="search-count" aria-live="polite"></span>}
                    {isSearchOpen && <div className="search-icon icon-transform " onClick={toggleSearch} data-cursor>
                        <img src={arrowIcon} alt="Search"/>
                    </div>}
                </div>
            </div>
            <div className="masonry-grid" ref={gridRef}>
                {filteredPosts.map(post => (
                    <Link to={`/post/${post._id}`} key={post._id} className="post-card"
                          style={{backgroundColor: post.color}}>
                        <div className="slider-container">
                            <Slider {...sliderSettingsV2Main(post.cards.length, false)}>
                            {post.cards.map((url, index) => (
                                    // eslint-disable-next-line
                                    <img key={index} src={url} alt={`Post ${post._id} - Image ${index + 1}`} onLoad={scheduleRefresh} />
                                ))}
                            </Slider>
                        </div>
                        <div className="post-info">
                            <h3 dangerouslySetInnerHTML={{ __html: RemoveLinksFromHTML(post.title) }} />
                            <p dangerouslySetInnerHTML={{ __html: RemoveLinksFromHTML(post.author_name) }} />
                        </div>
                    </Link>
                ))}
                {searchQuery && filteredPosts.length === 0 && (
                    <p className="empty-state">* ничего не нашлось</p>
                )}
            </div>
            <>
                <hr className="footer-divider"/>
                <footer className="site-footer">
                    <p>design: <a href="https://katyamezentseva.com" target="_blank" rel="noopener noreferrer">katyamezentseva.com</a></p>
                    <p>founder and chief editor: <a href="https://alialiev.com" target="_blank" rel="noopener noreferrer">alialiev.com</a></p>
                    <p>tg<a href="https://t.me/podstrochnik_project" target="_blank" rel="noopener noreferrer">@podstrochnik_project</a></p>
                </footer>
            </>

        </div>
    );
};
