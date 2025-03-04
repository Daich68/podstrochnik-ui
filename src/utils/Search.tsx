import {Post} from "../entity/Entity";

export function Search(posts: Post[], search: string, searchFields: string[]): Post[] {
    if (!search.trim()) return posts;
    const lowerSearch = search.toLowerCase();

    return posts.filter(post =>
        searchFields.some(field => {
            const value = post[field as keyof Post];
            if (typeof value === 'string') {
                return value.toLowerCase().includes(lowerSearch);
            } else if (Array.isArray(value)) {
                return value.some(item => item.toLowerCase().includes(lowerSearch));
            }
            return false;
        })
    );
}