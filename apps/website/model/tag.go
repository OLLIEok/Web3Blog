package model

import "encoding/json"

/*标签表*/
type Tag struct {
	Name       string `gorm:"type:varchar(255);primaryKey" json:"name"`
	ArticleNum uint   `gorm:"not null" json:"article_num"`
}

func (tag *Tag) TableName() string {
	return "tag"
}

func (tag *Tag) MarshalBinary() ([]byte, error) {
	return json.Marshal(tag)
}

func (tag *Tag) UnmarshalBinary(data []byte) error {
	return json.Unmarshal(data, tag)
}
