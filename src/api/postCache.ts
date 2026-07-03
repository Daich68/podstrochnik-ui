import { Post } from "../entity/Entity";

// Общий кэш поста по id: список на главной (GetPost) и одиночный пост
// (GetPostByID) читают один и тот же эндпоинт с одинаковой формой
// объекта — переход с карточки не должен ждать повторный запрос
// данных, которые уже лежат в памяти.
const cache = new Map<string, Post>();

export const cachePost = (post: Post) => {
    if (post._id) cache.set(post._id, post);
};

export const cachePosts = (posts: Post[]) => {
    posts.forEach(cachePost);
};

export const getCachedPost = (id: string): Post | undefined => cache.get(id);
