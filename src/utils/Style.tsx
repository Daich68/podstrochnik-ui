export const UpdateFavicon = (color: string) => {
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

export const RemoveLinksFromHTML = (html: string): string => {
    return html.replace(/<a\b[^>]*>(.*?)<\/a>/gi, '$1');
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
});

export const sliderSettingsV2Post = (length: number, arrows: boolean) => ({
    dots: length>1,
    infinite: length>1,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false
});
