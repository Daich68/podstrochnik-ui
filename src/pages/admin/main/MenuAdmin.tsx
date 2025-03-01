import React from "react";
import {Link} from "react-router-dom";
import "./Admin.css"

export const MenuAdmin: React.FC = () => {

    return (
        <div>
            <div>
                <Link className={"menu-admin"} to={"/admin/main"}>Публикации</Link>
                <Link className={"menu-admin"} to={"/admin/texts"}>Тексты на страницах</Link>
                <Link className={"menu-admin"} to={"/admin/add"}>Новая публикация</Link>
                <Link className={"menu-admin"} to={"/admin/exit"}>Выход</Link>
            </div>
        </div>
    )
}