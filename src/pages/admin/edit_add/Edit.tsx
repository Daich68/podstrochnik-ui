import React, { useEffect, useState } from 'react';
import {useSearchParams} from "react-router-dom";
import {EditAddCore} from "./EditAddCore";
import {MenuAdmin} from "../main/MenuAdmin";
import {GetPostByID} from "../../../api/Posts";
import {Post} from "../../../entity/Entity";

export const Edit: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [publication, setPublication] = useState<Post | null>(null);
    useEffect(() => {
        const fetchData = async () => {
            const id = searchParams.get("id");
            if (!id) {
                console.error("No id in params");
                return;
            }
            try {
                const data = await GetPostByID(id);
                setPublication(data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchData();
    }, [searchParams]);

    if (!publication) return <div>Loading...</div>;

    return (
        <div className={"admin-ui"}>
            <MenuAdmin/>
            <EditAddCore publication={publication}/>
        </div>
    )
};


