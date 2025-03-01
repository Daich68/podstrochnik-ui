import React from "react";
import {EditAddCore} from "./EditAddCore";
import {MenuAdmin} from "../main/MenuAdmin";

export const Add: React.FC = () => {
    return (
        <div className={"admin-ui"}>
            <MenuAdmin/>
            <EditAddCore publication={null}/>
        </div>
    )
}