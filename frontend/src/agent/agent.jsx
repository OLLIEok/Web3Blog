import superagentPromise from 'superagent-promise';
import _superagent from 'superagent';
import { toast } from "react-toastify";
import { createContext, useState,useEffect } from 'react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import { AboutPage, AirPort, ArticlePage, CreatePage, HomePage, HotDetails, NewDetails, SearchPage, TagDetails } from "../pages";
import { DiscoverWalletProviders } from '../components/WalletProviders';
const superagent = superagentPromise(_superagent, Promise);

const localStorageKey = 'blog-auth-token';
const API_ROOT ="https://www.0xdoomxy.top/blog";

// const SetAuthorizetion = (token) =>{
//     superagent('Authorization',`Bearer ${token}`);
// }
export const HttpAgent = createContext();

export default function Agent({setSearchWalletModal,selectedWallet,userAccount}) {
    const responseBody = (res) => {
        return res.body;
    }
    const tokenPlugin = req => {
        if (Authorization) {
            req.set('Authorization', `Bearer ${Authorization}`);
        }
    }

    const [isAdmin,setIsAdmin] = useState(false);
    const [Authorization, setAuth] = useState(localStorage.getItem(localStorageKey));
    const encode = encodeURIComponent;
    const SetAuthorization = (token) => {
        setAuth(token);
        if (token) {
            localStorage.setItem(localStorageKey, token);
        } else {
            localStorage.removeItem(localStorageKey);
        }
    }
    const SetIsAdmin=(flag)=>{
        setIsAdmin(flag);
    }
    const requests = {
        del: url =>
            superagent.del(`${API_ROOT}${url}`).use(tokenPlugin).then(responseBody).catch((res) => {
                if (res.status === 401) {
                    SetAuthorization(null);
                    setIsAdmin(false);
                    setSearchWalletModal(true);
                    toast.warn("请先登录");
                    return;
                }
                toast.error("系统出错啦");
            }),
        get: (url) =>
            superagent.get(`${API_ROOT}${url}`).use(tokenPlugin).then(responseBody).catch((res) => {
                if (res.status === 401) {
                    SetAuthorization(null);
                    setIsAdmin(false);
                    setSearchWalletModal(true);
                    toast.warn("请先登录");
                    return;
                }
                toast.error("系统出错啦");
            }),
        put: (url, body) =>
            superagent.put(`${API_ROOT}${url}`, body).use(tokenPlugin).then(responseBody).catch((res) => {
                if (res.status === 401) {
                    SetAuthorization(null);
                    setIsAdmin(false);
                    setSearchWalletModal(true);
                    toast.warn("请先登录");
                    return;
                }
                toast.error("系统出错啦");
            }),
        post: (url, body) =>
            superagent.post(`${API_ROOT}${url}`, body).use(tokenPlugin).then(responseBody).catch((res) => {
                if (res.status === 401) {
                    SetAuthorization(null);
                    setSearchWalletModal(true);
                    setIsAdmin(false);
                    toast.warn("请先登录");
                    return;
                }
                toast.error("系统出错啦");
            }),
    };

    const TagClient = {
        GetAllTags: () => requests.get(`/tag/findall`),
        GetArticleByTag: (tag, page, pagesize) => requests.get(`/tag/findArticle?tag=${encode(tag)}&page=${encode(page)}&pagesize=${encode(pagesize)}`)
    }
    const CommentClient = {
        SearchByArticle: (articleid) => requests.get(`/comment/find?articleid=${encode(articleid)}`),
        CreateComment: (comment) => requests.post(`/comment/create`, comment),
        DeleteComment: (id, articleid) => requests.get(`/comment/delete?articleid=${encode(articleid)}&id=${encode(id)}`)
    }
    const AirportClient = {
        UpdateAirportByUpdateTime: (id) => requests.get(`/airport/update?type=${encode("user_update_time")}&id=${encode(id)}`),
        UpdateAirportByAddressBalance: (id, balance) => requests.get(`/airport/update?type=${encode("user_address_balance")}&id=${encode(id)}&balance=${encode(balance)}`),
        UpdateAirportByFinishTime: (id) => requests.get(`/airport/update?type=${encode("user_finish")}&id=${encode(id)}`),
        AddAirportIntoAddress: (id) => requests.get(`/airport/update?type=${encode("user_add_into_address")}&id=${encode(id)}`),
        UpdateAirport:(airport)=>requests.post(`/airport/update`,airport),
        AddAirport: (airport) => requests.post(`/airport/create`, airport),
        FinishAirport: (id) => requests.post(`/airport/update`,{id:id,end_time:new Date()}),
        DeleteAirport: (id) => requests.get(`/airport/delete?id=${encode(id)}`),
        CleanAirport: (airportid) => requests.get(`/airport/clean?id=${encode(airportid)}`),
        FindAirportByAddress: (page, pageSize) => requests.get(`/airport/findmy?page=${encode(page)}&pagesize=${encode(pageSize)}`),
        FindRunningAirport: (page, pageSize) => requests.get(`/airport/findrunning?page=${encode(page)}&pagesize=${encode(pageSize)}`),
        FindFinishAirport: (page, pageSize) => requests.get(`/airport/findfinish?page=${encode(page)}&pagesize=${encode(pageSize)}`)
    }
    const ArticleClient = {
        ImageDownload: (file) => requests.get(`/article/image/download?filename=${encode(file)}`),
        ImageUpload: (file) => requests.post(`/article/image/upload`, file),
        ImageDownloadUrl: (filename) => `/blog/article/image/download?filename=${encode(filename)}`,
        Publish: (article) => requests.post(`/article/publish`, article),
        Find: (articleId) => requests.get(`/article/find?id=${encode(articleId)}`),
        FindMaxAccess: (page, pagesize) => requests.get(`/article/findbymaxaccess?page=${encode(page)}&pagesize=${encode(pagesize)}`),
        FindNewest: (page, pagesize) => requests.get(`/article/findbycreatetime?page=${encode(page)}&pagesize=${encode(pagesize)}`),
        Search: (keyword, page, pagesize) => requests.get(`/article/search?page=${encode(page)}&pagesize=${encode(pagesize)}&keyword=${encode(keyword)}`)
    }

    const LikeClient = {
        Add: (articleId, userid) => requests.get(`/like/confirm?articleid=${encode(articleId)}&userid=${encode(userid)}`),
        Remove: (articleId, userid) => requests.get(`/like/cancel?articleid=${encode(articleId)}&userid=${encode(userid)}`),
        Find: (articleId, userid) => requests.get(`/like/exist?articleid=${encode(articleId)}&userid=${encode(userid)}`)

    }

    const MessageClient = {
        GetTotal: () => requests.get(`/message/utotal`),
        Read: (messageId) => requests.get(`/message/read?id=${encode(messageId)}`),
        FindAllMessage: (page, pagesize) => requests.get(`/message/query?page=${encode(page)}&pagesize=${encode(pagesize)}`)
    }

    const UserClient = {
        Login: (signs) => requests.post(`/user/login`, signs)
    }
    return (
        <HttpAgent.Provider value={{isAdmin,SetIsAdmin,AirportClient, CommentClient, Authorization, SetAuthorization, UserClient, LikeClient, ArticleClient, TagClient,MessageClient, API_ROOT }}>
            
            <DiscoverWalletProviders />
            <Router>
                <Routes>
                    <Route path={'/'} Component={HomePage} />
                    <Route path={'/about'} Component={AboutPage} />
                    <Route path={'/article/create'} Component={CreatePage} />
                    <Route path={'/article/:articleId'} Component={ArticlePage} />
                    <Route path={'/search'} Component={SearchPage} />
                    <Route path={"/article/hot"} Component={HotDetails} />
                    <Route path={'/article/newest'} Component={NewDetails} />
                    <Route path={"/articles/tag"} Component={TagDetails} />
                    <Route path={"/airport"} Component={AirPort} />
                </Routes>
            </Router>
        </HttpAgent.Provider>
    )
}
