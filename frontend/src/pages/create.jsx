import { React, useContext, useEffect, useMemo, useState } from 'react';
import 'bytemd/dist/index.css';
import "highlight.js/styles/vs.css";
import { Editor } from '@bytemd/react';
import gfm from '@bytemd/plugin-gfm'
import highlightssr from '@bytemd/plugin-highlight-ssr'
import highlight from '@bytemd/plugin-highlight'
import breaks from '@bytemd/plugin-breaks'
import footnotes from '@bytemd/plugin-footnotes'
import frontmatter from '@bytemd/plugin-frontmatter'
import gemoji from '@bytemd/plugin-gemoji'
import mediumZoom from '@bytemd/plugin-medium-zoom'
import zhHans from 'bytemd/lib/locales/zh_Hans.json'
import { toast } from 'react-toastify';
import { Modal, Mentions } from "antd";
import { useNavigate } from 'react-router-dom';
import { HttpAgent } from '../agent/agent';

const CreatePage = () => {
    const { ArticleClient, TagClient } = useContext(HttpAgent);
    const plugins = useMemo(() => [gfm(), highlightssr(), highlight(), breaks(), footnotes(), frontmatter(), gemoji(), mediumZoom()], []);
    const [article, setArticle] = useState(null);
    const navigate = useNavigate();
    const [rawTags, setRawTags] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [alltags, setAllTags] = useState([]);
    function getAllTags() {
        TagClient.GetAllTags().then((data) => {
            if (data === undefined || data === null) {
                return;
            }
            if (!data.status) {
                let msg = data.message;
                if (msg === undefined || msg === null) {
                    msg = "系统出错啦";
                }
                toast.error(msg);
                return;
            }
            setAllTags(data.data.map((item) => {
                return { value: item.Name, label: item.Name }
            }));
        })
    }

    useEffect(() => {
        if (article == null) {
            let historyArticleStr = sessionStorage.getItem("create-article");
            if (historyArticleStr !== null) {
                let historyArticle = JSON.parse(historyArticleStr);
                setArticle(historyArticle);
                setRawTags(historyArticle.tags.replace(/,/g, '@'));
            } else {
                setArticle({ title: "请输入文章标题", content: "", tags: "" });
            }
        }
        if (article == null) {
            return;
        }
        let replicateArticle = article;
        replicateArticle.tags = rawTags.trim().replace(/\s/g, '').replace(/@/g, ',');
        if (replicateArticle.tags.length > 0 && replicateArticle.tags[0] === ",") {
            replicateArticle.tags = String(replicateArticle.tags).slice(1, replicateArticle.tags.length);
        }
        sessionStorage.setItem("create-article", JSON.stringify(replicateArticle));
    }, [article])
    useEffect(() => {
        getAllTags();
    }, []);
    function publicArticle() {
        let newArticle = article;
        newArticle.tags = rawTags.trim().replace(/\s/g, '').replace(/@/g, ',');
        if (newArticle.tags.length > 0 && newArticle.tags[0] === ",") {
            newArticle.tags = String(newArticle.tags).slice(1, newArticle.tags.length);
        }
        let pushParams = new FormData();
        pushParams.append('title', newArticle.title);
        pushParams.append('content', newArticle.content);
        pushParams.append('tags', newArticle.tags);
        ArticleClient.Publish(pushParams).then((res) => {
            try {
                if (res === undefined || res === null) {
                    return;
                }
                if (!res.status) {
                    let msg = res.data.message;
                    if (msg === undefined || msg === null) {
                        msg = "系统出错啦";
                    }
                    toast.error(msg);
                }
                toast.success("发布成功");
            } finally {
                setShowModal(false);
            }
        });
    }

    return (
        <div className='w-full h-full flex flex-col'>
            <Modal onOk={publicArticle} cancelText="取消" okText="发布文章" open={showModal} onCancel={() => {
                setShowModal(false)
            }}>
                <div className=' flex h-20 mt-10  justify-start items-center'>
                    <div className="w-1/6 font-semibold">文章标签</div>
                    <Mentions className=' w-5/6' value={rawTags} onChange={(option) => {
                        setRawTags(option)
                    }} options={alltags} />  
                </div>
            </Modal>
            <div className='w-full h-20 flex flex-row justify-start items-center py-2 '>
                <div className='md:w-24 flex justify-center items-center pl-2 ' onClick={() => {
                    navigate("/")
                }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                        stroke="currentColor" className=" w-12 cursor-pointer ">
                        <path strokeLinecap="round" strokeLinejoin="round"
                            d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                    </svg>
                </div>
                <input className=' w-4/5 indent-8 text-3xl font-semibold font-serif outline-none ' onChange={(e) => {
                    setArticle({ ...article, title: e.target.value })
                }} value={article != null ? article.title : ""}></input>
                <div className=' flex justify-end items-center  h-full w-1/5 pr-2'>
                    <button style={{ backgroundColor: 'rgb(0, 152, 234)' }}
                        className=' w-full h-full text-sm   md:w-28 border-2 rounded-xl font-semibold'
                        onClick={() => {
                            setShowModal(true)
                        }}>发布文章
                    </button>
                </div>
            </div>
            <Editor
                locale={zhHans}
                value={article != null ? article.content : ""}  //markdown内容
                plugins={plugins}  //markdown中用到的插件，如表格、数学公式、流程图
                onChange={(v) => {
                    setArticle({ ...article, content: v });
                }}

                uploadImages={async (files) => {
                    //上传图片
                    let form = new FormData();
                    form.append('file', files[0]);
                    let filename = await ArticleClient.ImageUpload(form).then((res) => {
                        if (res.status) {
                            return res.data;
                        } else {
                            let msg = res.data.message;
                            if (msg === undefined || msg === null) {
                                msg = "系统出错啦";
                            }
                            toast.error(msg);
                        }
                    });
                    return [
                        {
                            title: filename,
                            url: ArticleClient.ImageDownloadUrl(filename),
                        },
                    ];
                }}
            />
        </div>
    );
}

export default CreatePage;