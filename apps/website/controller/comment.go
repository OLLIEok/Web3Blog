package controller

import (
	"blog/service"
	"blog/utils"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type comment struct {
}

var commentController *comment

func GetComment() *comment {
	return commentController
}

func (c *comment) CreateComment(ctx *gin.Context) {
	creator, ok := ctx.Get("address")
	if !ok {
		ctx.JSON(401, utils.NewFailedResponse("未登录"))
		return
	}
	var err error
	var comment struct {
		ArticleID uint   `json:"article_id"`
		Content   string `json:"content"`
		TopID     int    `json:"top_id"`
	}
	err = ctx.BindJSON(&comment)
	if err != nil {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("参数错误"))
		return
	}
	if comment.Content == "" {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("评论内容不能为空"))
		return
	}
	err = service.GetComment().CreateComment(ctx, uint(comment.ArticleID), creator.(string), comment.Content, comment.TopID)
	if err != nil {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("评论失败"))
		return
	}
	ctx.JSON(http.StatusOK, utils.NewSuccessResponse(nil))
}

func (c *comment) FindCommentByArticle(ctx *gin.Context) {
	articleidStr := ctx.Query("article_id")
	articleid, err := strconv.ParseUint(articleidStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("参数错误"))
		return
	}
	comments, err := service.GetComment().FindCommentByArticle(ctx, uint(articleid))
	if err != nil {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("查询失败"))
		return
	}
	ctx.JSON(http.StatusOK, utils.NewSuccessResponse(comments))
}

func (c *comment) DeleteComment(ctx *gin.Context) {
	creator := ctx.GetString("address")
	articleidStr := ctx.Query("article_id")
	articleid, err := strconv.ParseUint(articleidStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("参数错误"))
		return
	}
	idStr := ctx.Query("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("参数错误"))
		return
	}
	err = service.GetComment().DeleteComment(ctx, uint(articleid), uint(id), creator)
	if err != nil {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("删除失败"))
		return
	}
	ctx.JSON(http.StatusOK, utils.NewSuccessResponse(nil))
}
