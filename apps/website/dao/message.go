package dao

import (
	"blog/dao/db"
	"blog/model"
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
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

type AddressMessageTemplate struct {
	Data  []*model.Message
	Total uint64
}

func (m *message) FindMessageByAddress(ctx context.Context, address string, page int, pagesize int) (res *AddressMessageTemplate, err error) {
	var raw any
	raw, err, _ = m.sf.Do(fmt.Sprintf("message_%s_%d_%d", address, page, pagesize), func() (interface{}, error) {
		var data []*model.Message
		var closureError error
		var total uint64
		storage := db.GetMysql()
		closureError = storage.Model(&model.Message{}).WithContext(ctx).Select("count(*) as total").Where("address = ?", address).Find(&total).Error
		if closureError != nil {
			return nil, closureError
		}
		closureError = storage.Model(&model.Message{}).WithContext(ctx).Where("address = ?", address).Order("create_time desc,has_reply asc").Offset((page - 1) * pagesize).Limit(pagesize).Find(&data).Error
		if closureError != nil {
			return nil, closureError
		}
		return &AddressMessageTemplate{
			Data:  data,
			Total: total,
		}, nil
	})
	if err != nil {
		logrus.Errorf("find message by address (address:%s,page:%d,pagesize:%d) error:%s", address, page, pagesize, err.Error())
		return
	}
	return raw.(*AddressMessageTemplate), err
}
func (m *message) FindMessageByid(ctx context.Context, id uint64) (res *model.Message, err error) {
	var raw any
	raw, err, _ = m.sf.Do(fmt.Sprintf("message_%d", id), func() (interface{}, error) {
		var closureRes = new(model.Message)
		var closureError error
		cache := db.GetRedis()
		key := fmt.Sprintf("%s_%d", res.TableName(), id)
		closureError = cache.Get(ctx, key).Scan(closureRes)
		if closureError == nil || !errors.Is(closureError, redis.Nil) {
			if closureError != nil {
				logrus.Errorf("find message (key = %s) by redis failed:%s", key, err.Error())
			}
			return closureRes, closureError
		}
		storage := db.GetMysql()
		closureError = storage.Model(&model.Message{}).WithContext(ctx).Where("id = ?", id).Find(closureRes).Error
		ignoreErr := cache.Set(ctx, key, closureRes, 5*time.Minute).Err()
		if ignoreErr != nil {
			logrus.Errorf("Set redis message (%v) cache failed:%s", closureRes, ignoreErr.Error())
		}
		return closureRes, closureError
	})
	if err != nil {
		logrus.Errorf("find message (id = %d) from mysql failed:%s", id, err.Error())
		return
	}
	return raw.(*model.Message), err
}
func (m *message) UpdateMessageById(ctx context.Context, msg *model.Message) (err error) {
	storage := db.GetMysql()
	err = storage.WithContext(ctx).Model(&model.Message{}).Where("id = ?", msg.Id).Updates(msg).Error
	if err != nil {
		logrus.Errorf("update message (%v)  from mysql failed: %s", msg, err.Error())
	}
	cache := db.GetRedis()
	key := fmt.Sprintf("%s_%d", msg.TableName(), msg.Id)
	ignoreErr := cache.Del(ctx, key).Err()
	if ignoreErr != nil && !errors.Is(ignoreErr, redis.Nil) {
		logrus.Errorf("delete message (%d) from redis when mysql update error:%s", msg.Id, ignoreErr.Error())
	}
	return
}

func (m *message) FindTotalUnreadMessageByAddress(ctx context.Context, address string) (total uint64, err error) {
	_, err, _ = m.sf.Do(fmt.Sprintf("total_%s", address), func() (interface{}, error) {
		storage := db.GetMysql()
		return nil, storage.WithContext(ctx).Model(&model.Message{}).Select("count(*) as total").Where("address = ? and has_reply = 0 ", address).Find(&total).Error
	})
	if err != nil {
		logrus.Errorf("find total unread message by address(%s) failed:%s ", address, err.Error())
	}
	return
}
