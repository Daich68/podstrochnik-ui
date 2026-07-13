const BaseUrl: string = "https://pds-api.alialiev.com";
const auth: string = "/authenticated"
export const URLs = {
    Login: BaseUrl + "/login",
    GetPosts: BaseUrl + "/posts",
    AddPosts: BaseUrl + auth + "/posts",
    GetTexts: BaseUrl + "/texts",
    AddTexts: BaseUrl + auth + "/texts",
    DeletePost: BaseUrl + auth + "/posts",
};

export const CdnSaveUrl: string = "https://cdn.alialiev.com/images/save"
export const CdnGetUrl: string = "https://cdn.alialiev.com/images/"
