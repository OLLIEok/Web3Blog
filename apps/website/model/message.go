package model

import (
	"encoding/json"
	"time"
)

type Message struct {
	Id         uint64    `gorm:"bigint(20);primarykey;autocrement"`
	Ds         int       `gorm:"int(8)"`
	Address    string    `gorm:"varchar(64);index:search"`
	AirportId  uint      `gorm:"bigint(20);index:search"`
	CreateTime time.Time `gorm:"datetime"`
	Content    string    `gorm:"type:longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci"`
	HasReply   bool      `gorm:"type:boolean"`
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
