export const UpdateFavicon = (color: string) => {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari) return
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw a filled circle
    ctx.beginPath();
    ctx.arc(16, 16, 16, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();

    const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
    if (favicon) {
        favicon.href = canvas.toDataURL();
    } else {
        const newFavicon = document.createElement("link");
        newFavicon.rel = "icon";
        newFavicon.href = canvas.toDataURL();
        document.head.appendChild(newFavicon);
    }
};

// Относительная яркость цвета фона — чтобы выбирать читаемый цвет текста
export const IsDarkColor = (color: string): boolean => {
    const hex = color.replace("#", "");
    if (hex.length !== 6 && hex.length !== 3) return false;
    const full = hex.length === 3 ? hex.split("").map(c => c + c).join("") : hex;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) < 128;
};

export const RemoveLinksFromHTML = (html: string): string => {
    return html.replace(/<a\b[^>]*>(.*?)<\/a>/gi, '$1');
};

// Полная зачистка тегов — для сравнения при поиске и для alt-текстов,
// где Quill-разметка иначе даёт ложные совпадения/технический мусор.
export const StripHtml = (html: string): string => {
    return html.replace(/<[^>]+>/g, "").trim();
};

export const isMobileDeviceV3 = (minWidth: number): boolean => {
    return window.innerWidth < minWidth;
};

export const sliderSettingsV2Main = (length: number, arrows: boolean) => ({
    dots: false,
    infinite: length > 1,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: arrows,
    autoplay: length > 1,
    autoplaySpeed: 5000,
    // Карточка целиком — ссылка на пост: свайп по карусели не должен
    // читаться браузером как намерение перейти по ссылке.
    swipe: false,
    draggable: false,
    touchMove: false,
});

export const sliderSettingsV2Post = (length: number, arrows: boolean) => ({
    dots: length>1,
    infinite: length>1,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false
});
