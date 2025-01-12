package service

import (
	"blog/dao"
	"blog/model"
	"context"
)

type message struct {
}

var messageDao *message

func GetMessage() *message {
	return messageDao
}

func (m *message) FindMessageByAddress(ctx context.Context, address string, page int, pageSize int) (res []*model.Message, err error) {
	return dao.GetMessage().FindMessageByAddress(ctx, address, page, pageSize)
}
