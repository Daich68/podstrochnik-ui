import React from "react";
import DOMPurify from "dompurify";

type InnerDangerousProps = {
    html: string
}

// Контент приходит из редакторской Quill-админки — не от читателей,
// но санитизация всё равно нужна: компрометация админки не должна
// превращаться в stored XSS для всех посетителей.
export const InnerDangerous: React.FC<InnerDangerousProps> = ({ html }) => {
    return (
        <div dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(html)}}></div>
    )
}