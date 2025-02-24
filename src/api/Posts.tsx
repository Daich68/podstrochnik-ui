import {editEntity, getEntity} from "../utils/ReqestEntityUtils";
import {Post,} from "../entity/Entity";
import {URLs} from "../entity/constants/Urls";

export function AddPost(data: Post) {
    return editEntity<Post>(URLs.AddPosts, data);
}

export function GetPost(): Promise<Post[]> {
    return getEntity<Post[]>(URLs.GetPosts, null);
}