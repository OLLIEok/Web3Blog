package dao

import (
	"blog/dao/db"
	"blog/model"
	"context"
	"fmt"

	"github.com/sirupsen/logrus"
	"golang.org/x/sync/singleflight"
)

var messageDao *message

func init() {
	err := db.GetMysql().AutoMigrate(&model.Message{})
	if err != nil {
		logrus.Panicf("init mysql message table error:%s", err.Error())
	}
	messageDao = &message{
		sf: singleflight.Group{},
	}
}

func GetMessage() *message {
	return messageDao
}

type message struct {
	_  [0]func()
	sf singleflight.Group
}

func (m *message) CreateMessages(ctx context.Context, datas []*model.Message) (err error) {
	storage := db.GetMysql()
	err = storage.WithContext(ctx).Model(&model.Message{}).CreateInBatches(datas, 128).Error
	if err != nil {
		logrus.Errorf("batch create message (%v) error:%s", datas, err.Error())
		return
	}
	return
}
func (m *message) FindMessageByAddress(ctx context.Context, address string, page int, pagesize int) (res []*model.Message, err error) {
	var raw any
	raw, err, _ = m.sf.Do(fmt.Sprintf("message_%s_%d_%d", address, page, pagesize), func() (interface{}, error) {
		var closureRes []*model.Message
		var closureError error
		storage := db.GetMysql()
		closureError = storage.Model(&model.Message{}).WithContext(ctx).Where("address = ?", address).Order("create_time desc,has_reply asc").Offset((page - 1) * pagesize).Limit(pagesize).Find(&closureRes).Error
		return closureRes, closureError
	})
	if err != nil {
		logrus.Errorf("find message by address (address:%s,page:%d,pagesize:%d) error:%s", address, page, pagesize, err.Error())
		return
	}
	return raw.([]*model.Message), err
}
