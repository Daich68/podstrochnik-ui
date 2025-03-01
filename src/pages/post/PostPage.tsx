import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { GetPostByID } from "../../api/Posts";
import { Post } from "../../entity/Entity";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./PostPage.css";

export const PostPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [post, setPost] = useState<Post | null>(null);

    useEffect(() => {
        if (id) {
            GetPostByID(id).then(setPost).catch(console.error);
        }
    }, [id]);

    if (!post) return <p>Loading post...</p>;

    const sliderSettings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: true
    };

    return (
        <div className="post-container" style={{ backgroundColor: post.color }}>
            <h1 className="post-title">{post.title}</h1>
            <p className="post-author">By {post.author_name}</p>

            <Slider {...sliderSettings} className="post-slider">
                {post.cards.map((card, index) => (
                    <div key={index} className="post-slide">
                        <img src={card} alt={`Slide ${index + 1}`} className="post-image"/>
                    </div>
                ))}
            </Slider>

            <p className="post-time">Published: {new Date(post.time_publication).toLocaleString()}</p>
        </div>
    );
};
