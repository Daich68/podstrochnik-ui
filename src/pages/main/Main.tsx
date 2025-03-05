import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { GetPost } from "../../api/Posts";
import { Post } from "../../entity/Entity";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./Main.css";
import {RemoveLinksFromHTML, sliderSettingsV2Main, UpdateFavicon} from "../../utils/Style";
import lupaIcon from "../../static/lupa.svg";
import arrowIcon from "../../static/arrow.svg";

export const MainPage: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
    const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    useEffect(() => {
        GetPost()
            .then(data => {
                const shuffled = [...data].sort(() => Math.random() - 0.5);
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

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);
        searchParams.set("search", value);
        setSearchParams(searchParams);
    };

    const toggleSearch = () => {
        setIsSearchOpen(!isSearchOpen);
        if (isSearchOpen) {
            // Clear search when hiding
            setSearchQuery("");
            searchParams.delete("search");
            setSearchParams(searchParams);
            setFilteredPosts(posts);
        }
    };



    UpdateFavicon("#7a7a26");

    return (
        <>
            <div className="header-container">
                <div className="site-title">
                    <h1>проект подстрочник</h1>
                    {!isSearchOpen && <div className="search-icon" onClick={toggleSearch}>
                        <img src={lupaIcon} alt="Search"/>
                    </div>}
                    <div className={`search-container ${isSearchOpen ? "open" : ""}`}>
                        <input
                            type="text"
                            placeholder="поиск..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="search-input"
                        />
                    </div>
                    {isSearchOpen && <div className="search-icon icon-transform " onClick={toggleSearch}>
                        <img src={arrowIcon} alt="Search"/>
                    </div>}
                </div>
            </div>
            <div className="masonry-grid">
                {filteredPosts.map(post => (
                    <Link to={`/post/${post._id}`} key={post._id} className="post-card"
                          style={{backgroundColor: post.color}}>
                        <div className="slider-container">
                            <Slider {...sliderSettingsV2Main(post.cards.length, false)}>
                            {post.cards.map((url, index) => (
                                    // eslint-disable-next-line
                                    <img key={index} src={url} alt={`Post ${post._id} - Image ${index + 1}`} />
                                ))}
                            </Slider>
                        </div>
                        <div className="post-info">
                            <h3 dangerouslySetInnerHTML={{ __html: RemoveLinksFromHTML(post.title) }} />
                            <p dangerouslySetInnerHTML={{ __html: RemoveLinksFromHTML(post.author_name) }} />
                        </div>
                    </Link>
                ))}
            </div>
            <>
                <hr className="footer-divider"/>
                <footer className="site-footer">
                    <p>design: <a href="https://katyamezentseva.com" target="_blank" rel="noopener noreferrer">katyamezentseva.com</a></p>
                    <p>founder and editor: <a href="https://alialiev.com" target="_blank" rel="noopener noreferrer">alialiev.com</a></p>
                </footer>
            </>

        </>
    );
};