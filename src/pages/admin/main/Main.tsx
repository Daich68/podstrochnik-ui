import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MenuAdmin } from "./MenuAdmin";
import { GetPostAdmin, DeleteText } from "../../../api/Posts";
import { Post } from "../../../entity/Entity";
import "./Admin.css";
import {GetPrettyTimePub} from "../../../utils/DatetimeUtils";

export const Main: React.FC = () => {
    const [publications, setPublications] = useState<Post[] | null>(null);

    useEffect(() => {
        GetPostAdmin()
            .then(data => {
                setPublications(data);
            })
            .catch(error => {
                console.error(error);
            });
    }, []);

    // Function to handle deletion with confirmation
    const handleDelete = async (id: string) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this publication?");
        if (confirmDelete) {
            try {
                await DeleteText(id);
                setPublications(prev => prev ? prev.filter(pub => pub._id !== id) : null);
                console.log("Publication deleted successfully.");
            } catch (error) {
                console.error("Failed to delete publication:", error);
            }
        }
    };

    return (
        <div className="admin-ui">
            <MenuAdmin />
            {publications ? (
                publications.map(pub => (
                    <div key={pub._id} className="publication-item">
                        <span dangerouslySetInnerHTML={{__html: pub.author_name}}/>
                        <span dangerouslySetInnerHTML={{__html: pub.title}}/>

                        <p>{GetPrettyTimePub({date:  new Date(pub.time_publication)})}</p>
                        <Link to={`/admin/edit?id=${pub._id}`}>Edit</Link>
                        {<button onClick={() => handleDelete(pub._id || "")} className="delete-button">
                            Delete
                        </button>}
                    </div>
                ))
            ) : (
                <p>No publications found.</p>
            )}
        </div>
    );
};
