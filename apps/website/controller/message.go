package controller

import (
	"blog/model"
	"blog/service"
	"blog/utils"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type message struct {
}

var messageController *message

func GetMessage() *message {
	return messageController
}

func (m *message) QueryMessageByPage(ctx *gin.Context) {
	address, ok := ctx.Get("address")
	if !ok {
		ctx.JSON(http.StatusBadRequest, utils.NewFailedResponse("参数出错"))
		return
	}
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
	var res []*model.Message
	res, err = service.GetMessage().FindMessageByAddress(ctx, address.(string), page, pageSize)
	if err != nil {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("查询失败"))
		return
	}
	ctx.JSON(http.StatusOK, utils.NewSuccessResponse(res))
}
func (m *message) FindTotalUnreadMessage(ctx *gin.Context) {
	address, ok := ctx.Get("address")
	if !ok {
		ctx.JSON(http.StatusBadRequest, utils.NewFailedResponse("参数出错"))
		return
	}
	total, err := service.GetMessage().FindTotalUnreadMessage(ctx, address.(string))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailedResponse("系统出错"))
		return
	}
	ctx.JSON(http.StatusOK, utils.NewSuccessResponse(total))
}
func (m *message) ReadMessage(ctx *gin.Context) {
	address, ok := ctx.Get("address")
	if !ok {
		ctx.JSON(http.StatusBadRequest, utils.NewFailedResponse("参数出错"))
		return
	}
	idstr := ctx.Query("id")
	id, err := strconv.ParseUint(idstr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailedResponse("参数出错"))
		return
	}
	err = service.GetMessage().ReadMessageByid(ctx, address.(string), id)
	if err != nil {
		ctx.JSON(http.StatusOK, utils.NewFailedResponse("更改失败"))
		return
	}
	ctx.JSON(http.StatusOK, utils.NewSuccessResponse(nil))
}
