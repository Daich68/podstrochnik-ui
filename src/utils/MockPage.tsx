import React from "react";

type MockPageProps ={
    pageName: string
}

export const MockPage: React.FC<MockPageProps> = ({ pageName }) => {
    return (
        <div>
            {`здесь скоро будет страница ${pageName}`}
        </div>
    )
}