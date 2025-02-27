package controller

import (
	"blog/model"
	"blog/service"
	"blog/utils"
	"fmt"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type article struct {
}

var articleController = &article{}

func GetArticle() *article {
	return articleController
}

func (a *article) PublishArticle(ctx *gin.Context) {
	var address, ok = ctx.Get("address")
	if !ok {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("未登录"))
		return
	}
	var err error
	var form *multipart.Form
	form, err = ctx.MultipartForm()
	if err != nil {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("参数错误"))
		return
	}
	var article = &model.Article{}
	//添加userid 到articleMap中,必须确保articleMap中没有userid字段
	article.Creator = address.(string)
	if form.Value["title"] == nil {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("文章标题不存在"))
		return
	}
	article.Title = form.Value["title"][0]
	if form.Value["content"] == nil {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("不存在文章内容"))
		return
	}
	article.Content = form.Value["content"][0]
	if form.Value["images"] != nil {
		article.Images = form.Value["images"][0]
	}
	if form.Value["tags"] == nil {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("文章至少应该有一个标签"))
		return
	}
	article.Tags = form.Value["tags"][0]
	//todo: return the article id currently is useless
	_, err = service.GetArticle().PublishArticle(ctx, article)
	if err != nil {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("发布失败"))
		return
	}
	ctx.JSON(http.StatusOK, utils.NewSuccessResponse(nil))
}

func (a *article) UploadImage(context *gin.Context) {
	var address, ok = context.Get("address")
	if !ok {
		context.JSON(http.StatusOK, utils.NewFailedResponse("未登录"))
		return
	}
	file, err := context.FormFile("file")
	if err != nil {
		context.JSON(http.StatusOK, utils.NewFailedResponse("上传失败"))
	}
	if !utils.IsImage(file.Filename) {
		context.JSON(http.StatusOK, utils.NewFailedResponse("不是图片"))
		return
	}
	imgtype := filepath.Ext(file.Filename)
	var f multipart.File
	f, err = file.Open()
	if err != nil {
		context.JSON(http.StatusOK, utils.NewFailedResponse("上传失败"))
	}
	fileName := fmt.Sprintf("%s_%d%s", address, time.Now().Unix(), imgtype)
	err = service.GetArticle().UploadImage(fileName, f)
	if err != nil {
		context.JSON(http.StatusOK, utils.NewFailedResponse("上传失败"))
	}
	context.JSON(http.StatusOK, utils.NewSuccessResponse(fileName))
}

func (a *article) DownloadImage(context *gin.Context) {
	filename := context.Query("filename")
	if filename == "" {
		context.JSON(http.StatusOK, utils.NewFailedResponse("参数错误"))
		return
	}
	res, err := service.GetArticle().DownloadImage(filename)
	if err != nil {
		context.JSON(http.StatusOK, utils.NewFailedResponse("下载失败"))
		return
	}
	context.Writer.Write(res)
}

func (a *article) FindArticle(ctx *gin.Context) {
	var err error
	articleid, err := strconv.ParseUint(ctx.Query("id"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("参数错误"))
		return
	}
	var view *service.ArticleView
	view, err = service.GetArticle().FindArticle(ctx, uint(articleid))
	if err != nil {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("查询失败"))
		return
	}
	ctx.JSON(http.StatusOK, utils.NewSuccessResponse(view))
}

/*
*
查询讨论数最多的文章
*
*/
func (a *article) FindArticleByMaxAccessNum(ctx *gin.Context) {
	var err error
	var view *service.ArticleViewByPage
	var page int
	var pageSize int
	page, err = strconv.Atoi(ctx.Query("page"))
	if err != nil || page <= 0 {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("参数错误"))
		return
	}
	pageSize, err = strconv.Atoi(ctx.Query("pagesize"))
	if err != nil || pageSize <= 0 {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("参数错误"))
		return
	}
	view, err = service.GetArticle().FindArticleByAccessNum(ctx, page, pageSize)
	if err != nil {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("查询失败"))
		return
	}
	ctx.JSON(http.StatusOK, utils.NewSuccessResponse(view))
}

/**
查询最新的文章
**/

func (a *article) FindArticleByCreateTime(ctx *gin.Context) {
	var page int
	var pageSize int
	var err error

	page, err = strconv.Atoi(ctx.Query("page"))
	if err != nil || page <= 0 {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("参数错误"))
		return
	}
	pageSize, err = strconv.Atoi(ctx.Query("pagesize"))
	if err != nil || pageSize <= 0 {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("参数错误"))
		return
	}
	var view *service.ArticleViewByPage
	view, err = service.GetArticle().FindArticlePaticalByCreateTime(ctx, page, pageSize)
	if err != nil {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("查询失败"))
		return
	}
	ctx.JSON(http.StatusOK, utils.NewSuccessResponse(view))
}

/*
*
根据关键字搜索文章

*
*/
func (a *article) SearchArticleByPage(ctx *gin.Context) {
	var err error
	var view *service.ArticleViewByPage
	var page int
	var pageSize int
	page, err = strconv.Atoi(ctx.Query("page"))
	if err != nil || page <= 0 {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("参数错误"))
		return
	}
	pageSize, err = strconv.Atoi(ctx.Query("pagesize"))
	if err != nil || pageSize <= 0 {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("参数错误"))
		return
	}
	view, err = service.GetArticle().SearchArticleByPage(ctx, ctx.Query("keyword"), page, pageSize)
	if err != nil {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("查询失败"))
		return
	}
	ctx.JSON(http.StatusOK, utils.NewSuccessResponse(view))
}

func (a *article) UpdateArticle(ctx *gin.Context) {
	var address, ok = ctx.Get("address")
	if !ok {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("未登录"))
		return
	}
	var err error
	var form *multipart.Form
	form, err = ctx.MultipartForm()
	if err != nil {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("参数错误"))
		return
	}
	var article = &model.Article{}
	var id uint64
	if form.Value["id"] == nil {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("参数错误"))
		return
	}
	id, err = strconv.ParseUint(form.Value["id"][0], 10, 64)
	if err != nil {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("参数错误"))
		return
	}
	article.ID = uint(id)
	article.Creator = address.(string)
	if form.Value["title"] == nil {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("文章标题不存在"))
		return
	}
	article.Title = form.Value["title"][0]
	if form.Value["content"] == nil {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("文章内容不存在"))
	}
	article.Content = form.Value["content"][0]
	if form.Value["images"] != nil {
		article.Images = form.Value["images"][0]
	}
	if form.Value["tags"] == nil {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("文章至少应该有一个标签"))
		return
	}
	article.Tags = form.Value["tags"][0]
	err = service.GetArticle().UpdateArticle(ctx, article)
	if err != nil {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("修改失败"))
		return
	}
	ctx.JSON(http.StatusOK, utils.NewSuccessResponse(nil))
}
func (a *article) DeleteArticle(ctx *gin.Context) {
	var address, ok = ctx.Get("address")
	if !ok {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("未登录"))
		return
	}
	article := &model.Article{
		Creator: address.(string),
	}
	var err error
	var articleid uint64
	articleid, err = strconv.ParseUint(ctx.Query("id"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("参数错误"))
		return
	}
	article.ID = uint(articleid)
	err = service.GetArticle().DeleteArticle(ctx, article)

	if err != nil {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("删除失败"))
		return
	}
	ctx.JSON(http.StatusOK, utils.NewSuccessResponse(nil))
}
