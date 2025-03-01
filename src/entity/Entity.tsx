export type Credits = {
    login: string,
    password: string,
}

export type Token = {
    access: string,
    _id: string,
    login: string,
    roles: string,
}

export type Post = {
    _id?: string;
    author_name: string;
    title: string;
    cards: string[];
    editor_name: string;
    helpful_links: string;
    time_publication: string;
};

export type CdnResponse = {
    uuid: string
};


export type TextsData = {
    _id?: string;
    location_key: string;
    value: string;
};