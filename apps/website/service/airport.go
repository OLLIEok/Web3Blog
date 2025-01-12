package service

import (
	"blog/dao"
	"blog/model"
	"context"
	"fmt"
	"time"
)

type airport struct {
}

var airportService *airport = newAirportService()

func newAirportService() *airport {
	return &airport{}
}

func GetAirport() *airport {
	return airportService
}

func (a *airport) QueryFinishAirportWithFinishTimeByPage(ctx context.Context, page int, pageSize int) (*dao.AirportPagedView, error) {
	return dao.GetAirport().QueryFinishAirportWithFinishTimeByPage(ctx, page, pageSize)
}
func (a *airport) QueryRunningAirportWithWeightByPage(ctx context.Context, address string, page int, pageSize int) (*dao.AirportPagedView, error) {
	if address != "" {
		dao.GetAirport().QueryRunningAirportWithAddressOrderWeightByPage(ctx, address, page, pageSize)
	}
	return dao.GetAirport().QueryRunningAirportOrderWeightByPage(ctx, page, pageSize)
}

func (a *airport) QueryMyAirportByPage(ctx context.Context, address string, page int, pageSize int) (res *dao.MyAirportPagedView, err error) {
	return dao.GetAirport().QueryMyAirportWithUpdateByPage(ctx, address, page, pageSize)
}
func (a *airport) CreateAirport(ctx context.Context, data *model.Airport) (err error) {
	return dao.GetAirport().CreateAirport(ctx, data)
}

type UpdateAirportTemplate struct {
	Airport             *model.Airport             `json:"-"`
	AirportRelationship *model.AirportRelationship `json:"-"`
	Schema              UpdateSchema               `json:"-"`
}
type UpdateSchema string

const (
	UserUpdateTime     UpdateSchema = "user_update_time"
	UserAddressBalance UpdateSchema = "user_address_balance"
	UserFinishTime     UpdateSchema = "user_finish"
	UserAddIntoAddress UpdateSchema = "user_add_into_address"
)

// 修改空投信息
func (a *airport) UpdateAirportInfo(ctx context.Context, data *model.Airport) (res any, err error) {
	return data, dao.GetAirport().UpdateAirport(ctx, data)
}

// 修改空投相关的用户状态(包括用户和空投信息)
func (a *airport) UpdateAirport(ctx context.Context, data *UpdateAirportTemplate) (any, error) {
	switch data.Schema {
	case UserUpdateTime:
		return a.updateUserUpdateTime(ctx, data)
	case UserAddressBalance:
		return a.updateUserAddressBalance(ctx, data)
	case UserFinishTime:
		return a.updateUserFinishTime(ctx, data)
	case UserAddIntoAddress:
		return a.createUserAddIntoAddress(ctx, data)
	default:
		return nil, fmt.Errorf("unknow airport schema: %s", data.Schema)
	}
}

func (a *airport) createUserAddIntoAddress(ctx context.Context, data *UpdateAirportTemplate) (res any, err error) {
	if data == nil || data.AirportRelationship == nil || data.AirportRelationship.AirportId <= 0 || len(data.AirportRelationship.UserAddress) <= 0 {
		err = fmt.Errorf("参数出错")
		return
	}
	airportRelationshipDao := dao.GetAirportRelationship()
	err = airportRelationshipDao.CreateAirportRelationship(ctx, &model.AirportRelationship{AirportId: data.AirportRelationship.AirportId, UserAddress: data.AirportRelationship.UserAddress, CreateTime: time.Now()})
	return
}
func (a *airport) updateUserFinishTime(ctx context.Context, data *UpdateAirportTemplate) (res any, err error) {
	if data == nil || data.AirportRelationship == nil || data.AirportRelationship.AirportId <= 0 || len(data.AirportRelationship.UserAddress) <= 0 {
		err = fmt.Errorf("参数出错")
		return
	}
	airportRelationshipDao := dao.GetAirportRelationship()
	now := time.Now()
	err = airportRelationshipDao.UpdateAirportRelationship(ctx, &model.AirportRelationship{AirportId: data.AirportRelationship.AirportId, UserAddress: data.AirportRelationship.UserAddress, FinishTime: &now})
	return now, err
}
func (a *airport) updateUserAddressBalance(ctx context.Context, data *UpdateAirportTemplate) (res any, err error) {
	if data == nil || data.AirportRelationship == nil || data.AirportRelationship.Balance < 0 || data.AirportRelationship.AirportId <= 0 || len(data.AirportRelationship.UserAddress) <= 0 {
		err = fmt.Errorf("参数出错")
		return
	}
	airportRelationshipDao := dao.GetAirportRelationship()
	airportDao := dao.GetAirport()
	var oldAirportRelationship *model.AirportRelationship
	oldAirportRelationship, err = airportRelationshipDao.FindAirportRelationshipByAddressAndId(ctx, data.AirportRelationship.UserAddress, data.AirportRelationship.AirportId)
	if err != nil {
		return
	}
	incr := data.AirportRelationship.Balance - oldAirportRelationship.Balance
	err = airportDao.UpdateAirportBalance(ctx, oldAirportRelationship.AirportId, incr)
	if err != nil {
		return
	}
	defer func() {
		if err != nil {
			airportDao.UpdateAirportBalance(ctx, oldAirportRelationship.AirportId, -incr)
		}
	}()
	err = airportRelationshipDao.UpdateAirportRelationship(ctx, &model.AirportRelationship{
		AirportId:   data.AirportRelationship.AirportId,
		UserAddress: data.AirportRelationship.UserAddress,
		Balance:     data.AirportRelationship.Balance,
	})
	return
}

func (a *airport) updateUserUpdateTime(ctx context.Context, data *UpdateAirportTemplate) (res any, err error) {
	airportRelationshipDao := dao.GetAirportRelationship()
	updateTime := time.Now()
	err = airportRelationshipDao.UpdateAirportRelationship(ctx, &model.AirportRelationship{
		AirportId:   data.AirportRelationship.AirportId,
		UserAddress: data.AirportRelationship.UserAddress,
		UpdateTime:  &updateTime,
	})
	return updateTime, err
}

func (a *airport) DeleteAirport(ctx context.Context, airportId uint) (err error) {
	return dao.GetAirport().DeleteAirport(ctx, airportId)
}

func (a *airport) DeleteUserAirport(ctx context.Context, airportId uint) (err error) {
	address := ctx.Value("address").(string)
	return dao.GetAirportRelationship().DeleteAirportRelationship(ctx, &model.AirportRelationship{
		AirportId:   airportId,
		UserAddress: address,
	})
}
