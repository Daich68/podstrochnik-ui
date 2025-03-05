import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { GetPostByID } from "../../api/Posts";
import { Post } from "../../entity/Entity";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./PostPage.css";
import { InnerDangerous } from "../../utils/InnerDangerous";
import { GetPrettyTimePub } from "../../utils/DatetimeUtils";
import { isMobileDeviceV3, sliderSettingsV2Post, UpdateFavicon } from "../../utils/Style";
import useSound from "use-sound";
// @ts-ignore
import page from "../../static/page.wav"


export const PostPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [post, setPost] = useState<Post | null>(null);
    const [showLinks, setShowLinks] = useState(false);
    const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
    const [playButton] = useSound(page, {volume: 1} );
    const [isMobile, setIsMobile] = useState(isMobileDeviceV3(700));


    useEffect(() => {
        if (id) {
            GetPostByID(id).then(setPost).catch(console.error);
        }
    }, [id]);

    useEffect(() => {
        const handleResize = () => setIsMobile(isMobileDeviceV3(700));
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);


    if (!post) return <p></p>;

    UpdateFavicon(post.color);

    const openFullscreen = (index: number) => setFullscreenIndex(index);
    const closeFullscreen = () => setFullscreenIndex(null);
    const nextImage = () => {
        setFullscreenIndex((prev) => (prev !== null && prev < post.cards.length - 1 ? prev + 1 : 0))
        playButton();
    };
    const prevImage = () => {
        setFullscreenIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : post.cards.length - 1))
        playButton();
    };

    return (
        <div className="post-container" style={{ backgroundColor: post.color }}>
            <div className="top-bar">
                <button className="helpful-links-btn"><Link style={{textDecoration: "none"}} to={"/"}>↩️{isMobile? "" : " на главную"}</Link></button>
                <button className="helpful-links-btn" onClick={() => openFullscreen(0)}>↕️{isMobile? "" : " полный экран"}</button>
                {!showLinks ?
                    <button className="helpful-links-btn" onClick={() => setShowLinks(!showLinks)}>ℹ️{isMobile? "" :  " полезные ссылки"}</button>
                    :
                    <button className="helpful-links-btn" onClick={() => setShowLinks(!showLinks)}>ℹ️{isMobile? "" :" к карточкам"}</button>
                }
            </div>

            {showLinks ? (
                <div className="helpful-links-container">
                    <div className="helpful-links-content">
                        <InnerDangerous html={post.helpful_links} /></div>
                    <p className="post-time"><InnerDangerous html={post.editor_name} /></p>
                    <p className="post-time">опубликовано: {GetPrettyTimePub({ date: new Date(post.time_publication) })}</p>
                </div>
            ) : (
                <>
                    <h1 className="post-title"><InnerDangerous html={post.title} /></h1>
                    <div className="post-author"><InnerDangerous html={post.author_name} /></div>

                    <Slider {...sliderSettingsV2Post(post.cards.length, !isMobile)} className="post-slider">
                        {post.cards.map((card, index) => (
                            <div key={index} className="post-slide"
                                 // onClick={() => openFullscreen(index)}
                            >
                                <img src={card} alt={`Slide ${index + 1}`} className="post-image" />
                            </div>
                        ))}
                    </Slider>
                    {isMobile && <div className={"helper-post"}></div>}
                </>
            )}

            {fullscreenIndex !== null && (
                <div className="fullscreen-overlay">
                    <button className="close-btn" onClick={closeFullscreen}>×</button>
                    {post.cards.length > 1 && <button className="prev-btn" onClick={prevImage}>‹</button>}
                    <img src={post.cards[fullscreenIndex]} alt="Fullscreen" className="fullscreen-image" />
                    {post.cards.length > 1 && <button className="next-btn" onClick={nextImage}>›</button>}
                </div>
            )}
        </div>
    );
};
