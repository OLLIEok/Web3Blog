package controller

import (
	"blog/dao"
	"blog/model"
	"blog/service"
	"blog/utils"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type airport struct {
}

var airportController = &airport{}

func GetAirport() *airport {
	return airportController
}

func (a *airport) FindFinishAirport(c *gin.Context) {
	page, err := strconv.ParseInt(c.Query("page"), 10, 64)
	if err != nil || page <= 0 {
		c.JSON(http.StatusOK, utils.NewFailedResponse("参数出错"))
		return
	}
	var pagesize int64
	pagesize, err = strconv.ParseInt(c.Query("pagesize"), 10, 64)
	if err != nil || pagesize <= 0 {
		c.JSON(http.StatusOK, utils.NewFailedResponse("参数出错"))
		return
	}
	var res *dao.AirportPagedView
	res, err = service.GetAirport().QueryFinishAirportWithFinishTimeByPage(c, int(page), int(pagesize))
	if err != nil {
		c.JSON(http.StatusOK, utils.NewFailedResponse("查询失败"))
		return
	}
	c.JSON(http.StatusOK, utils.NewSuccessResponse(res))
}

func (a *airport) FindRunningAirport(c *gin.Context) {
	var ok bool
	var addressAny any
	addressAny, ok = c.Get("address")
	var address string
	if ok {
		if address, ok = addressAny.(string); !ok {
			c.JSON(http.StatusOK, utils.NewFailedResponse("参数出错"))
			return
		}
	}
	page, err := strconv.ParseInt(c.Query("page"), 10, 64)
	if err != nil || page <= 0 {
		c.JSON(http.StatusOK, utils.NewFailedResponse("参数出错"))
		return
	}
	var pagesize int64
	pagesize, err = strconv.ParseInt(c.Query("pagesize"), 10, 64)
	if err != nil || pagesize <= 0 {
		c.JSON(http.StatusOK, utils.NewFailedResponse("参数出错"))
		return
	}
	var res *dao.AirportPagedView
	res, err = service.GetAirport().QueryRunningAirportWithWeightByPage(c, address, int(page), int(pagesize))
	if err != nil {
		c.JSON(http.StatusOK, utils.NewFailedResponse("查询失败"))
		return
	}
	c.JSON(http.StatusOK, utils.NewSuccessResponse(res))
}
func (a *airport) DeleteUserAirport(c *gin.Context) {
	airportId, err := strconv.ParseUint(c.Query("id"), 10, 64)
	if err != nil || airportId <= 0 {
		c.JSON(http.StatusOK, utils.NewFailedResponse("参数出错"))
		return
	}
	err = service.GetAirport().DeleteUserAirport(c, uint(airportId))
	if err != nil {
		c.JSON(http.StatusOK, utils.NewFailedResponse("删除失败"))
		return
	}
	c.JSON(http.StatusOK, utils.NewSuccessResponse("删除成功"))
}
func (a *airport) DeleteAirport(c *gin.Context) {

	airportId, err := strconv.ParseUint(c.Query("id"), 10, 64)
	if err != nil || airportId <= 0 {
		c.JSON(http.StatusOK, utils.NewFailedResponse("参数出错"))
		return
	}
	err = service.GetAirport().DeleteAirport(c, uint(airportId))
	if err != nil {
		c.JSON(http.StatusOK, utils.NewFailedResponse("删除失败"))
		return
	}
	c.JSON(http.StatusOK, utils.NewSuccessResponse("删除成功"))
}
func (a *airport) CreateAirport(c *gin.Context) {
	var airport = new(model.Airport)
	err := c.Bind(airport)
	if err != nil {
		c.JSON(http.StatusOK, utils.NewFailedResponse("参数出错"))
		return
	}
	if airport.Weight > 5 || airport.Weight <= 0 {
		c.JSON(http.StatusOK, utils.NewFailedResponse("参数出错"))
		return
	}
	if airport.ID != 0 {
		c.JSON(http.StatusOK, utils.NewFailedResponse("参数出错"))
		return
	}
	if airport.EndTime.IsZero() {
		c.JSON(http.StatusOK, utils.NewFailedResponse("参数出错"))
		return
	}
	if airport.StartTime.IsZero() {
		airport.StartTime = time.Now()
	}
	if airport.Name == "" {
		c.JSON(http.StatusOK, utils.NewFailedResponse("参数出错"))
		return
	}
	if airport.FinalTime.Before(*airport.EndTime) {
		c.JSON(http.StatusOK, utils.NewFailedResponse("参数出错"))
		return
	}
	if airport.EndTime.Before(airport.StartTime) {
		c.JSON(http.StatusOK, utils.NewFailedResponse("参数出错"))
		return
	}
	err = service.GetAirport().CreateAirport(c, airport)
	if err != nil {
		c.JSON(http.StatusOK, utils.NewFailedResponse("创建失败"))
		return
	}
	c.JSON(http.StatusOK, utils.NewSuccessResponse("创建成功"))
}

func (a *airport) UpdateAirportInfo(c *gin.Context) {
	var data = new(model.Airport)
	err := c.Bind(data)
	if err != nil {
		c.JSON(http.StatusOK, utils.NewFailedResponse("参数出错"))
		return
	}
	var res any
	res, err = service.GetAirport().UpdateAirportInfo(c, data)
	if err != nil {
		c.JSON(http.StatusOK, utils.NewFailedResponse("修改失败"))
		return
	}
	c.JSON(http.StatusOK, utils.NewSuccessResponse(res))
}

func (a *airport) UpdateAirport(c *gin.Context) {
	var ok bool
	var addressAny any
	addressAny, ok = c.Get("address")
	if !ok {
		c.JSON(http.StatusOK, utils.NewFailedResponse("参数出错"))
		return
	}
	var address string
	if address, ok = addressAny.(string); !ok {
		c.JSON(http.StatusOK, utils.NewFailedResponse("参数出错"))
		return
	}
	updateType := service.UpdateSchema(c.Query("type"))
	if updateType == "" {
		c.JSON(http.StatusOK, utils.NewFailedResponse("参数出错"))
		return
	}
	var err error
	var airportId uint64
	airportId, err = strconv.ParseUint(c.Query("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusOK, utils.NewFailedResponse("参数出错"))
		return
	}
	params := &service.UpdateAirportTemplate{
		Schema: updateType,
		Airport: &model.Airport{
			ID: uint(airportId),
		},
		AirportRelationship: &model.AirportRelationship{AirportId: uint(airportId), UserAddress: address},
	}
	var balance float64
	switch updateType {
	case service.UserAddressBalance:
		balance, err = strconv.ParseFloat(c.Query("balance"), 64)
		if err != nil {
			c.JSON(http.StatusOK, utils.NewFailedResponse("参数出错"))
			return
		}
		params.AirportRelationship.Balance = balance
	}
	var res any
	res, err = service.GetAirport().UpdateAirport(c, params)
	if err != nil {
		c.JSON(http.StatusOK, utils.NewFailedResponse("修改失败"))
		return
	}
	c.JSON(http.StatusOK, utils.NewSuccessResponse(res))
}

func (a *airport) FindMyAirport(c *gin.Context) {
	var ok bool
	var addressAny any
	addressAny, ok = c.Get("address")
	if !ok {
		c.JSON(http.StatusOK, utils.NewFailedResponse("参数出错"))
		return
	}
	var address string
	if address, ok = addressAny.(string); !ok {
		c.JSON(http.StatusOK, utils.NewFailedResponse("参数出错"))
		return
	}
	page, err := strconv.ParseInt(c.Query("page"), 10, 64)
	if err != nil || page <= 0 {
		c.JSON(http.StatusOK, utils.NewFailedResponse("参数出错"))
		return
	}
	var pagesize int64
	pagesize, err = strconv.ParseInt(c.Query("pagesize"), 10, 64)
	if err != nil || pagesize <= 0 {
		c.JSON(http.StatusOK, utils.NewFailedResponse("参数出错"))
		return
	}
	var res *dao.MyAirportPagedView
	res, err = service.GetAirport().QueryMyAirportByPage(c, address, int(page), int(pagesize))
	if err != nil {
		c.JSON(http.StatusOK, utils.NewFailedResponse("查询出错"))
		return
	}
	c.JSON(http.StatusOK, utils.NewSuccessResponse(res))
}
