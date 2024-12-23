package model

type Company struct {
	Name string `gorm:"type:varchar(255);primarykey"`
}

func (c *Company) TableName() string {
	return "company"
}
