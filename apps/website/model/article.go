package model

import (
	"encoding/json"

	"gorm.io/gorm"
)

/*文章表*/
type Article struct {
	gorm.Model
	Title   string `gorm:"type:varchar(255);not null" json:"title"`
	Tags    string `gorm:"tags;varchar(300)" json:"tags"`
	Creator string `gorm:"varchar(64);not null" json:"creator"`
	Content string `gorm:"type:longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;not null" json:"content"`
	Images  string `gorm:"type:longtext" json:"images"`
}

func (a *Article) TableName() string {
	return "article"
}
func (a *Article) MarshalBinary() ([]byte, error) {
	return json.Marshal(a)
}

func (a *Article) UnmarshalBinary(data []byte) error {
	return json.Unmarshal(data, a)
}
