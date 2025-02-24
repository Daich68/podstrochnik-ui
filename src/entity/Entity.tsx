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
    cards: string[];
    editor_name: string;
    helpful_links: string;
    time_publication: string;
};