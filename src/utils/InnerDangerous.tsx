import React from "react";

type InnerDangerousProps = {
    html: string
}
export const InnerDangerous: React.FC<InnerDangerousProps> = ({ html }) => {
    return (
        <div dangerouslySetInnerHTML={{__html: html}}></div>
    )
}