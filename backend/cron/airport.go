package cron

import (
	"blog/dao"
	"blog/dao/db"
	"blog/model"
	"blog/utils"
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/robfig/cron/v3"
	"github.com/sirupsen/logrus"
)

type airportCron struct {
	internal *cron.Cron
}

func NewAirportCron() *airportCron {
	return &airportCron{
		internal: cron.New(),
	}
}

func (ac *airportCron) Run() {
	var onceExec = make(chan struct{}, 1)
	onceExec <- struct{}{}
	ac.internal.AddJob("0 0 * * *	", cron.FuncJob(func() {
		logrus.Infof("%v 开始执行airport定时任务", time.Now())
		if len(onceExec) < 1 {
			return
		}
		<-onceExec
		defer func() {
			onceExec <- struct{}{}
		}()
		var err error
		var storage = db.GetMysql()
		var airports []*model.Airport
		err = storage.WithContext(context.TODO()).Model(&model.Airport{}).Where("end_time >= CURDATE()").Find(&airports).Error
		if err != nil {
			logrus.Errorf("cron airport task (time:%d) error:%s", time.Now().UnixMilli(), err.Error())
			return
		}
		wg := sync.WaitGroup{}
		wg.Add(len(airports))
		errLock := sync.RWMutex{}
		for _, airport := range airports {
			go func(a *model.Airport) {
				defer wg.Done()
				if err != nil {
					return
				}
				var relationAirports []*model.AirportRelationship
				var curDs = utils.GetCurrentDS()
				var perr error
				perr = storage.WithContext(context.TODO()).Model(&model.AirportRelationship{}).Where("airport_id = ? and update_time < CURDATE()", a.ID).Find(&relationAirports).Error
				if perr != nil {
					errLock.Lock()
					if err == nil {
						err = perr
					}
					errLock.Unlock()
					return
				}
				errLock.RLock()
				if err != nil {
					return
				}
				errLock.RUnlock()
				var messages = make([]*model.Message, 0, len(relationAirports))
				for _, ra := range relationAirports {
					messages = append(messages, &model.Message{
						Ds:         curDs,
						Address:    ra.UserAddress,
						AirportId:  ra.AirportId,
						CreateTime: time.Now(),
						Content:    fmt.Sprintf("%s:您有一个空投%s需要完成", utils.FormatDs(curDs), a.Name),
					})
				}
				perr = dao.GetMessage().CreateMessages(context.TODO(), messages)
				if perr != nil {
					errLock.Lock()
					if err == nil {
						err = perr
					}
					errLock.Unlock()
					return
				}
			}(airport)
		}
	}))
	ac.internal.Start()
}
