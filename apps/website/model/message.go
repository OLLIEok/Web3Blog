package model

import (
	"encoding/json"
	"time"
)

type Message struct {
	Id          uint64    `gorm:"bigint(20);primarykey;autocrement" json:"id"`
	Ds          int       `gorm:"int(8);uniqueIndex:unique_msg" json:"ds"`
	Address     string    `gorm:"type:varchar(64);uniqueIndex:unique_msg;index:search" json:"address"`
	RelativeId  uint      `gorm:"type:bigint(20);uniqueIndex:unique_msg" json:"relative_id"`
	MessageType int       `gorm:"type:int(10);uniqueIndex:unique_msg" json:"message_type"`
	CreateTime  time.Time `json:"create_time"`
	Content     string    `gorm:"type:longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci" json:"content"`
	HasReply    bool      `gorm:"type:boolean" json:"has_reply"`
}

func (msg *Message) TableName() string {
	return "message"
}

func (msg *Message) MarshalBinary() ([]byte, error) {
	return json.Marshal(msg)
}

func (msg *Message) UnmarshalBinary(data []byte) error {
	return json.Unmarshal(data, msg)
}
