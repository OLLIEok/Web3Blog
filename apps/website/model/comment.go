package model

import (
	"encoding/json"
	"time"
)

/*评论表*/
type Comment struct {
	ID        uint      `gorm:"primarykey;autoIncrement" json:"id"`
	CreateAt  time.Time `json:"create_at"`
	TopID     uint      `gorm:"not null;index:search" json:"top_id"`
	Content   string    `gorm:"type:varchar(255);not null" json:"content"`
	ArticleID uint      `gorm:"not null;index:search" json:"article_id"`
	Creator   string    `gorm:"type:varchar(64);not null;index:search" json:"creator"`
}

func (comment *Comment) TableName() string {
	return "comment"
}
func (comment *Comment) MarshalBinary() ([]byte, error) {
	return json.Marshal(comment)
}

func (comment *Comment) UnmarshalBinary(data []byte) error {
	return json.Unmarshal(data, comment)
}
