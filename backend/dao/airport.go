package dao

import (
	"blog/dao/db"
	"blog/model"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"

	"github.com/sirupsen/logrus"
	"golang.org/x/sync/singleflight"
)

func init() {
	err := db.GetMysql().AutoMigrate(&model.Airport{})
	if err != nil {
		logrus.Panicf("auto migrate airport table err:%s", err.Error())
	}

}

var airportDao = newAirportDao()

func GetAirport() *airport {
	return airportDao
}

type airport struct {
	_  [0]func()
	sf singleflight.Group
}

func newAirportDao() *airport {
	return &airport{
		sf: singleflight.Group{},
	}
}

func (a *airport) CreateAirport(ctx context.Context, data *model.Airport) (err error) {
	storage := db.GetMysql()
	err = storage.WithContext(ctx).Model(&model.Airport{}).Create(data).Error
	if err != nil {
		logrus.Errorf("create airport %v error:%s", data, err.Error())
	}
	return
}
func (a *airport) DeleteAirport(ctx context.Context, airportId uint) (err error) {
	cache := db.GetRedis()
	err = cache.Del(ctx, fmt.Sprintf("airport_%d", airportId)).Err()
	if err != nil && !errors.Is(err, redis.Nil) {
		logrus.Errorf("delete airport %d   in redis  error:%s", airportId, err.Error())
		return
	}
	storage := db.GetMysql()
	err = storage.WithContext(ctx).Where("id = ? ", airportId).Delete(&model.Airport{}).Error
	if err != nil {
		logrus.Errorf("delete airport %d  in mysql  error:%s", airportId, err.Error())
		return
	}
	return
}
func (a *airport) FindAirportById(ctx context.Context, airportId uint) (res *model.Airport, err error) {
	cache := db.GetRedis()
	err = cache.Get(ctx, fmt.Sprintf("airport_%d", airportId)).Scan(res)
	if !errors.Is(err, redis.Nil) {
		if err != nil {
			logrus.Errorf("find airport %d by redis error:%s", airportId, err.Error())
		}
		return
	}
	var resAny any
	resAny, err, _ = a.sf.Do(fmt.Sprintf("airport_%d", airportId), func() (interface{}, error) {
		storage := db.GetMysql()
		closureRes := new(model.Airport)
		var closureErr error
		closureErr = storage.WithContext(ctx).Where("id = ?", airportId).First(closureRes).Error
		return closureRes, closureErr
	})
	if err != nil {
		logrus.Errorf("find airport %d by mysql  error:%s", airportId, err.Error())
		return
	}
	ignoreErr := cache.SetEx(ctx, fmt.Sprintf("airport_%d", airportId), resAny, 12*time.Hour).Err()
	if ignoreErr != nil {
		logrus.Errorf("set airport %v by redis error:%s", resAny, ignoreErr.Error())
	}
	return resAny.(*model.Airport), err
}

type AirportPagedView struct {
	Data  []*model.Airport `json:"data"`
	Total int64            `json:"total"`
}

func (a *airport) QueryRunningAirportOrderWeightByPage(ctx context.Context, page int, pageSize int) (res *AirportPagedView, err error) {
	storage := db.GetMysql()
	var raw any
	raw, err, _ = a.sf.Do(
		fmt.Sprintf("running_%d_%d", page, pageSize),
		func() (interface{}, error) {
			var closureRes = new(AirportPagedView)
			var closureTotal int64
			var closureErr error
			closureErr = storage.WithContext(ctx).Raw(`
	SELECT
		count(*) as total
	FROM
		airport AS a `).Row().Scan(&closureTotal)
			if closureErr != nil {
				return closureRes, closureErr
			}
			closureRes.Total = closureTotal
			var closureData []*model.Airport
			var closureRaw *sql.Rows
			closureRaw, closureErr = storage.WithContext(ctx).Raw(`SELECT
		a.id AS id,
		a.name AS name,
		a.start_time AS start_time,
		a.end_time AS end_time,
		a.final_time AS final_time,
		a.address AS address,
		a.tag AS tag,
		a.financing_balance AS financing_balance,
		a.financing_from AS financing_from,
		a.task_type AS task_type,
		a.airport_balance AS airport_balance,
		a.teaching AS teaching,
		a.weight AS weight
	FROM
		airport AS a 
	where a.end_time is null or a.end_time > NOW()
	ORDER BY a.weight desc
	LIMIT ?  offset ?`, pageSize, (page-1)*pageSize).Rows()
			if closureErr != nil {
				return closureData, closureErr
			}
			for closureRaw.Next() {
				var tmp = new(model.Airport)
				if closureData == nil {
					closureData = make([]*model.Airport, 0)
				}
				closureErr = storage.ScanRows(closureRaw, tmp)
				if closureErr != nil {
					return closureRes, closureErr
				}
				closureData = append(closureData, tmp)
			}
			closureRes.Data = closureData
			return closureRes, closureErr
		},
	)
	if err != nil {
		logrus.Errorf("query running airport (page:%d,pagesize:%d) with weight by page error:%s ", page, pageSize, err.Error())
		return
	}
	return raw.(*AirportPagedView), err
}

func (a *airport) QueryRunningAirportWithAddressOrderWeightByPage(ctx context.Context, address string, page int, pageSize int) (res *AirportPagedView, err error) {
	storage := db.GetMysql()
	var raw any
	raw, err, _ = a.sf.Do(
		fmt.Sprintf("running_%s_%d_%d", address, page, pageSize),
		func() (interface{}, error) {
			var closureRes = new(AirportPagedView)
			var closureTotal int64
			var closureErr error
			closureErr = storage.WithContext(ctx).Raw(`SELECT
		count(*) as total
	FROM
		airport AS a 
	left JOIN 
		airport_relationship AS ar
	ON 	
		a.id=ar.airport_id
	where (ar.airport_id IS   NULL OR ar.user_address != ?) and (a.end_time is null or a.end_time > NOW())`, address).Row().Scan(&closureTotal)
			if closureErr != nil {
				return closureRes, closureErr
			}
			closureRes.Total = closureTotal
			var closureData []*model.Airport
			var closureRaw *sql.Rows
			closureRaw, closureErr = storage.WithContext(ctx).Raw(`SELECT
		a.id AS id,
		a.name AS name,
		a.start_time AS start_time,
		a.end_time AS end_time,
		a.final_time AS final_time,
		a.address AS address,
		a.tag AS tag,
		a.financing_balance AS financing_balance,
		a.financing_from AS financing_from,
		a.task_type AS task_type,
		a.airport_balance AS airport_balance,
		a.teaching AS teaching,
		a.weight AS weight
	FROM
		airport AS a 
	left JOIN 
		airport_relationship AS ar
	ON 	
		a.id=ar.airport_id
	where (ar.airport_id IS   NULL OR ar.user_address != ?) and (a.end_time is null or a.end_time > NOW()) 
	ORDER BY a.weight desc
	LIMIT ?  offset ?`, address, pageSize, (page-1)*pageSize).Rows()
			if closureErr != nil {
				return closureData, closureErr
			}
			for closureRaw.Next() {
				var tmp = new(model.Airport)
				if closureData == nil {
					closureData = make([]*model.Airport, 0)
				}
				closureErr = storage.ScanRows(closureRaw, tmp)
				if closureErr != nil {
					return closureRes, closureErr
				}
				closureData = append(closureData, tmp)
			}
			closureRes.Data = closureData
			return closureRes, closureErr
		},
	)
	if err != nil {
		logrus.Errorf("query running airport (address:%s,page:%d,pagesize:%d) with weight by page error:%s ", address, page, pageSize, err.Error())
		return
	}
	return raw.(*AirportPagedView), err
}

func (a *airport) QueryFinishAirportWithFinishTimeByPage(ctx context.Context, page int, pagesize int) (res *AirportPagedView, err error) {
	var raw any
	storage := db.GetMysql()
	raw, err, _ = a.sf.Do(fmt.Sprintf("finish_%d_%d", page, pagesize), func() (interface{}, error) {
		var closureRes = new(AirportPagedView)
		var closureData []*model.Airport
		var closureErr error
		var closureTotal int64
		closureErr = storage.WithContext(ctx).Model(&model.Airport{}).Select("count(*) as total").Where("end_time <= NOW()").Find(&closureTotal).Error
		if closureErr != nil {
			return closureRes, closureErr
		}
		closureRes.Total = closureTotal
		closureErr = storage.WithContext(ctx).Model(&model.Airport{}).Where("end_time <= NOW()").Limit(pagesize).Offset((page - 1) * pagesize).Order("final_time desc").Find(&closureData).Error
		if closureErr != nil {
			return closureRes, closureErr
		}
		closureRes.Data = closureData
		return closureRes, closureErr
	})
	if err != nil {
		logrus.Errorf("query finish airport (page:%d,pageSize:%d) with finish_time by page error:%s", page, pagesize, err.Error())
		return
	}
	return raw.(*AirportPagedView), err
}
func (a *airport) UpdateAirport(ctx context.Context, data *model.Airport) (err error) {
	cache := db.GetRedis()
	err = cache.Del(ctx, fmt.Sprintf("airport_%d", data.ID)).Err()
	if err != nil && !errors.Is(err, redis.Nil) {
		return
	}
	storage := db.GetMysql()
	return storage.WithContext(ctx).Updates(data).Error
}

type MyAirportPagedView struct {
	Data  []*MyAirportView `json:"data"`
	Total int64            `json:"total"`
}
type MyAirportView struct {
	model.Airport
	UserBalance    float64    `json:"user_balance"`
	UserUpdateTime *time.Time `json:"user_update_time"`
	UserFinishTime *time.Time `json:"user_finish_time"`
}

func (a *airport) QueryMyAirportWithUpdateByPage(ctx context.Context, address string, page int, pageSize int) (res *MyAirportPagedView, err error) {
	storage := db.GetMysql()
	var raw any
	raw, err, _ = a.sf.Do(fmt.Sprintf("my_%s_%d_%d", address, page, pageSize), func() (interface{}, error) {
		var closureRes = new(MyAirportPagedView)
		var closureData []*MyAirportView
		var closureErr error
		var closureTotal int64
		closureErr = storage.WithContext(ctx).Model(&model.Airport{}).Select("count(*) as total ").Joins("left join airport_relationship as ar on ar.delete_time is null and airport.id = ar.airport_id ").Where("ar.airport_id is not null").Find(&closureTotal).Error
		if closureErr != nil {
			return closureRes, closureErr
		}
		closureRes.Total = closureTotal
		closureErr = storage.WithContext(ctx).Model(&model.Airport{}).Select("airport.*,ar.balance as user_balance,ar.update_time as user_update_time,ar.finish_time as user_finish_time").Joins("left join airport_relationship as ar on ar.delete_time is null and airport.id = ar.airport_id ").Where("ar.airport_id is not null").Offset((page - 1) * pageSize).Limit(pageSize).Order("ar.update_time,ar.finish_time").Find(&closureData).Error
		if closureErr != nil {
			return closureRes, closureErr
		}
		closureRes.Data = closureData
		return closureRes, closureErr
	})
	if err != nil {
		logrus.Errorf("query my airport (address:%s,page:%d,pagesize:%d) with update by page error:%s", address, page, pageSize, err.Error())
		return
	}
	return raw.(*MyAirportPagedView), err
}

// UpdateAirportBalance 允许一段时间的金额不一致,出现不一致的最大时间在于redis对这条数据的缓存时间
func (a *airport) UpdateAirportBalance(ctx context.Context, airportId uint, incrBalance float64) (err error) {
	storage := db.GetMysql()
	err = storage.WithContext(ctx).Model(&model.Airport{}).Where("id = ?", airportId).Update("airport_balance", gorm.Expr("airport_balance+", incrBalance)).Error
	if err != nil {
		logrus.Errorf("update airport(airportId:%d,incrementBalance:%f) balance error:%s", airportId, incrBalance, err)
	}
	return
}
