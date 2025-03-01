import {editEntity, getEntity, getEntityWithQueryParams} from "../utils/ReqestEntityUtils";
import {Post, TextsData} from "../entity/Entity";
import {URLs} from "../entity/constants/Urls";

export function AddPost(data: Post) {
    return editEntity<Post>(URLs.AddPosts, data);
}

export function EditPost(data: Post) {
    return editEntity<Post>(URLs.AddPosts, data);
}
export async function GetPost(): Promise<Post[]> {
    const posts = await getEntity<Post[]>(URLs.GetPosts);
    return posts.filter(post => new Date(post.time_publication) <= new Date());
}

export async function GetPostAdmin(): Promise<Post[]> {
    return await getEntity<Post[]>(URLs.GetPosts);
}

export async function GetPostByID(id: string): Promise<Post> {
    const posts = await getEntityWithQueryParams<Post[]>(URLs.GetPosts, {"id": id});
    return posts[0] || null
}

export async function GetTexts(): Promise<TextsData[]> {
    return await getEntity<TextsData[]>(URLs.GetTexts);
}
export async function UpdateText(data: TextsData){
    return await editEntity<TextsData>(URLs.AddTexts, data);
}