import superagentPromise from 'superagent-promise';
import _superagent from 'superagent';
import { toast } from "react-toastify";
const superagent = superagentPromise(_superagent, Promise);

const localStorageKey = 'blog-auth-token';
const API_ROOT ="http://localhost:8080";

// const SetAuthorizetion = (token) =>{
//     superagent('Authorization',`Bearer ${token}`);
// }
const responseBody = (res) =>{
  if (res.status === 401) {
    toast.error("请先登录");
    SetAuthorizetion(null);
    localStorage.removeItem(localStorageKey);
    return;
  }
    return res.body;
  }
  const tokenPlugin = req => {
    if (Authorization) {
      req.set('Authorization', `Bearer ${Authorization}`);
    }
  }
  
let Authorization = localStorage.getItem(localStorageKey);
const encode =encodeURIComponent;

const SetAuthorizetion = (token) =>{
    Authorization =token
}
const requests = {
    del: url =>
      superagent.del(`${API_ROOT}${url}`).use(tokenPlugin).then(responseBody).catch((e)=>{
        toast.error("系统出错啦");
      }),
    get: (url) =>
      superagent.get(`${API_ROOT}${url}`).use(tokenPlugin).then(responseBody).catch((e)=>{
        toast.error("系统出错啦");
      }),
    put: (url, body) =>
      superagent.put(`${API_ROOT}${url}`, body).use(tokenPlugin).then(responseBody).catch((e)=>{
        toast.error("系统出错啦");
      }),
    post: (url, body) =>
      superagent.post(`${API_ROOT}${url}`, body).use(tokenPlugin).then(responseBody).catch((e)=>{
        toast.error("系统出错啦");
      }),
  };

const TagClient = {
  GetAllTags:()=>requests.get(`/tag/findall`),
}

const ArticleClient = {
    ImageDownload:(file)=>requests.get(`/article/image/download?filename=${encode(file)}`),
    ImageUpload:(file)=>requests.post(`/article/image/upload`,file),
    ImageDownloadUrl:(filename)=>`${API_ROOT}/article/image/download?filename=${encode(filename)}`,
    Publish:(article)=>requests.post(`/article/publish`,article),
    Find:(articleId)=>requests.get(`/article/find?id=${encode(articleId)}`),
    FindMaxAccess:(page,pagesize)=>requests.get(`/article/findbymaxaccess?page=${encode(page)}&pagesize=${encode(pagesize)}`),
    FindNewest:(page,pagesize)=>requests.get(`/article/findbycreatetime?page=${encode(page)}&pagesize=${encode(pagesize)}`),
    Search:(keyword,page,pagesize)=>requests.get(`/article/search?page=${encode(page)}&pagesize=${encode(pagesize)}&keyword=${encode(keyword)}`)
}

const LikeClient = {
    Add:(articleId,userid)=>requests.get(`/like/confirm?articleid=${encode(articleId)}&userid=${encode(userid)}`),
    Remove:(articleId,userid)=>requests.get(`/like/cancel?articleid=${encode(articleId)}&userid=${encode(userid)}`),
    Find:(articleId,userid)=>requests.get(`/like/exist?articleid=${encode(articleId)}&userid=${encode(userid)}`)

}

const UserClient ={
  Proof:(proof)=>requests.post(`/user/proof`,proof),
  Generate:()=>requests.get(`/user/generate`),
}



export {
    ArticleClient,
    TagClient,
    API_ROOT,
    LikeClient,
    UserClient,
    SetAuthorizetion,
    Authorization
}