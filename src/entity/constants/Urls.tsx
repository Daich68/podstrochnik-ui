const BaseUrl: string = "https://api.podstrochnik.ru";
const auth: string = "/authenticated"
export const URLs = {
    Login: BaseUrl + "/login",
    GetPosts: BaseUrl + "/posts",
    AddPosts: BaseUrl + auth + "/posts",
};
