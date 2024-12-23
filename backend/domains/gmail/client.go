package gmail

import (
	"context"

	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"google.golang.org/api/option"
)

type gmailService struct {
	RawService         *Service
	UserMessageService *UsersMessagesService
}

func GetGmailService() *gmailService {
	return gmailServiceDomain
}

var gmailServiceDomain *gmailService = new(gmailService)

func init() {
	var err error
	gmailServiceDomain.RawService, err = NewService(context.TODO(), option.WithAPIKey(viper.GetString("gmail.key")))
	if err != nil {
		logrus.Panicf("init gmail service error")
	}
	gmailServiceDomain.UserMessageService = NewUsersMessagesService(gmailServiceDomain.RawService)

}

func (gs *gmailService) SendMessage(userid string, message string) (err error) {
	var client = gs.UserMessageService

	msg := client.Send(userid, &Message{
		Snippet: "您的空投报告,来自0xdoomxy",
		Payload: &MessagePart{
			Body: &MessagePartBody{
				Data: "Hello World",
			},
			Parts: []*MessagePart{
				{
					Body: &MessagePartBody{
						Data: "Hello World2",
					},
				},
			},
		},
	})

	var resp *Message
	resp, err = msg.Do()
	if err != nil {
		return
	}
	var raw []byte
	raw, err = resp.MarshalJSON()
	if err != nil {
		logrus.Error(string(raw))
		return
	}
	return
}
