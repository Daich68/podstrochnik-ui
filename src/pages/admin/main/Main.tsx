import React, {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {MenuAdmin} from "./MenuAdmin";
import { GetPostAdmin} from "../../../api/Posts";
import {Post} from "../../../entity/Entity";
import "./Admin.css"


export const Main: React.FC = () => {
    const [publications, setPublications] = useState<Post[] | null>(null)
    useEffect(() => {
        GetPostAdmin()
            .then(data => {
                setPublications(data);
            })
            .catch(error => {
                console.error(error);
            });
    }, []);
    return (
        <>
            <div className={"admin-ui"}>
                <MenuAdmin/>
                {publications ? (
                    publications.map(pub => (
                        <div key={pub._id}>
                            <h1>{pub.author_name} {pub.title}</h1>
                            <p>{pub.time_publication}</p>
                            <Link to={`/admin/edit?id=${pub._id}`}>edit</Link>
                        </div>
                    ))
                ) : (
                    <p>No publications found.</p>
                )}
            </div>
        </>
    )
}