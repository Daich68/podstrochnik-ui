import React, { useEffect, useState } from "react";
import {Link, useParams} from "react-router-dom";
import { GetPostByID } from "../../api/Posts";
import { Post } from "../../entity/Entity";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./PostPage.css";
import {InnerDangerous} from "../../utils/InnerDangerous";
import {GetPrettyTimePub} from "../../utils/DatetimeUtils";
import {UpdateFavicon} from "../../utils/Style";

export const PostPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [post, setPost] = useState<Post | null>(null);

    useEffect(() => {
        if (id) {
            GetPostByID(id).then(setPost).catch(console.error);
        }
    }, [id]);

    if (!post) return <p></p>;

    const sliderSettings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: true
    };

    UpdateFavicon(post.color)

    return (
        <div className="post-container" style={{ backgroundColor: post.color }}>
            <div className={"back-link"}><Link to={"/"}>&lt;- на главную</Link></div>
            <h1 className="post-title"><InnerDangerous html={post.title}/></h1>
            <p className="post-author"><InnerDangerous html={post.author_name}/></p>

            <Slider {...sliderSettings} className="post-slider">
                {post.cards.map((card, index) => (
                    <div key={index} className="post-slide">
                        <img src={card} alt={`Slide ${index + 1}`} className="post-image"/>
                    </div>
                ))}
            </Slider>
            {/*<p></p>*/}
            <p className="post-time">опубликовано: {GetPrettyTimePub({date: new Date(post.time_publication)})}</p>
        </div>
    );
};
