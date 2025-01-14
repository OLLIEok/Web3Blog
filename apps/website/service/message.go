package service

import (
	"blog/dao"
	"blog/model"
	"context"
	"fmt"
)

type message struct {
}

var messageDao *message

func GetMessage() *message {
	return messageDao
}

func (m *message) FindMessageByAddress(ctx context.Context, address string, page int, pageSize int) (res *dao.AddressMessageTemplate, err error) {
	return dao.GetMessage().FindMessageByAddress(ctx, address, page, pageSize)
}

func (m *message) ReadMessageByid(ctx context.Context, address string, id uint64) (err error) {
	msgDao := dao.GetMessage()
	var old *model.Message
	old, err = msgDao.FindMessageByid(ctx, id)
	if err != nil {
		return
	}
	if old == nil || old.Address != address {
		err = fmt.Errorf("系统错误")
		return
	}
	if old.HasReply {
		return
	}
	err = msgDao.UpdateMessageById(ctx, &model.Message{
		Id:       uint64(id),
		HasReply: true,
	})
	return
}

func (m *message) FindTotalUnreadMessage(ctx context.Context, address string) (total uint64, err error) {
	return dao.GetMessage().FindTotalUnreadMessageByAddress(ctx, address)
}
