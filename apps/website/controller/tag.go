package controller

import (
	"blog/service"
	"blog/utils"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type tag struct {
}

var tagController = &tag{}

func GetTag() *tag {
	return tagController
}

func (t *tag) GetAllTags(ctx *gin.Context) {
	tags, err := service.GetTag().GetTags(ctx)
	if err != nil {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("获取标签失败"))
		return
	}
	ctx.JSON(http.StatusOK, utils.NewSuccessResponse(tags))
}

func (t *tag) GetArticleByTag(ctx *gin.Context) {
	tagName := ctx.Query("tag")
	pageStr := ctx.Query("page")
	pageSizeStr := ctx.Query("pagesize")
	page, err := strconv.Atoi(pageStr)
	if err != nil || page <= 0 {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("参数错误"))
		return
	}
	pageSize, err := strconv.Atoi(pageSizeStr)
	if err != nil || pageSize <= 0 {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("参数错误"))
		return
	}
	articles, err := service.GetTag().FindArticlesByTagName(ctx, tagName, page, pageSize)
	if err != nil {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("获取标签文章失败"))
		return
	}
	ctx.JSON(http.StatusOK, utils.NewSuccessResponse(articles))
}
