import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GetPost } from "../../api/Posts";
import { Post } from "../../entity/Entity";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./Main.css"; // Custom styles

export const MainPage: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);

    useEffect(() => {
        GetPost()
            .then(data => {
                // Shuffle posts randomly
                const shuffled = [...data].sort(() => Math.random() - 0.5);
                setPosts(shuffled);
            })
            .catch(error => console.error(error));
    }, []);

    const sliderSettings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false,
        autoplay: true,
        autoplaySpeed: 3000,
    };

    return (
        <div className="masonry-grid">
            {posts.map(post => (
                <Link to={`/post/${post._id}`} key={post._id} className="post-card" style={{ backgroundColor: post.color }}>
                    <div className="slider-container">
                        <Slider {...sliderSettings}>
                            {post.cards.map((url, index) => (
                                <img key={index} src={url} alt={`Post ${post._id} - Image ${index + 1}`} />
                            ))}
                        </Slider>
                    </div>
                    <div className="post-info">
                        <h3 dangerouslySetInnerHTML={{ __html: post.title }} />
                        <p dangerouslySetInnerHTML={{ __html: post.author_name }} />
                    </div>
                </Link>
            ))}
        </div>
    );
};
