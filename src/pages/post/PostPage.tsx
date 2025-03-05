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
import {isMobileDeviceV3, sliderSettingsV2Post, UpdateFavicon} from "../../utils/Style";

export const PostPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [post, setPost] = useState<Post | null>(null);
    const [showLinks, setShowLinks] = useState(false);

    useEffect(() => {
        if (id) {
            GetPostByID(id).then(setPost).catch(console.error);
        }
    }, [id]);

    if (!post) return <p></p>;


    UpdateFavicon(post.color);

    return (
        <div className="post-container" style={{ backgroundColor: post.color }}>
            <div className="top-bar">
                <div className="back-link"><Link to={"/"}>↩️ на главную</Link></div>
                    {!showLinks ?
                        <button className="helpful-links-btn" onClick={() => setShowLinks(!showLinks)}>ℹ️ полезные
                            ссылки</button>
                        :
                        <button className="helpful-links-btn" onClick={() => setShowLinks(!showLinks)}>ℹ️ к карточкам</button>
                    }
                </div>

                {showLinks ? (
                    <div className="helpful-links-container">
                        <div className="helpful-links-content">
                            <InnerDangerous html={post.helpful_links}/></div>
                        <p className="post-time"><InnerDangerous html={post.editor_name}/></p>
                        <p className="post-time">опубликовано: {GetPrettyTimePub({date: new Date(post.time_publication)})}</p>
                    </div>
                ) : (
                    <>
                        <h1 className="post-title"><InnerDangerous html={post.title} /></h1>
                        <div className="post-author"><InnerDangerous html={post.author_name} /></div>

                        <Slider {...sliderSettingsV2Post(post.cards.length, !isMobileDeviceV3(700))} className="post-slider">
                            {post.cards.map((card, index) => (
                                <div key={index} className="post-slide">
                                    <img src={card} alt={`Slide ${index + 1}`} className="post-image"/>
                                </div>
                            ))}
                        </Slider>
                    </>
            )}
        </div>
    );
};
