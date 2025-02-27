package model

import (
	"encoding/json"
	"time"
)

type AirportRelationship struct {
	AirportId   uint       `json:"airport_id" gorm:"primarykey"`
	UserAddress string     `gorm:"type:varchar(255);primarykey" json:"user_address"`
	CreateTime  time.Time  `gorm:"type:datetime;not null" json:"create_time"`
	UpdateTime  *time.Time `gorm:"type:datetime" json:"update_time"`
	FinishTime  *time.Time `gorm:"type:datetime" json:"finish_time"`
	DeleteTime  *time.Time `gorm:"type:datetime;" json:"delete_time"`
	Balance     float64    `gorm:"type:float" json:"balance"`
}

func (ar *AirportRelationship) TableName() string {
	return "airport_relationship"
}
func (ar *AirportRelationship) MarshalBinary() ([]byte, error) {
	return json.Marshal(ar)
}

func (ar *AirportRelationship) UnmarshalBinary(data []byte) error {
	return json.Unmarshal(data, ar)
}
