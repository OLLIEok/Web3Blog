package service

import (
	"regexp"
	"strings"
	"utils/db"

	"github.com/sirupsen/logrus"
)

type articleImage struct {
	Id     uint64
	Images string
}

func FixImages() (err error) {
	conn := db.NewMysqlConn()
	var images []*articleImage
	err = conn.Table("article").Select("id,images").Find(&images).Error
	if err != nil {
		return
	}
	var rep *regexp.Regexp
	rep, err = regexp.Compile(`filename=([^\s"\\]+)`)
	if err != nil {
		return
	}
	for i := 0; i < len(images); i++ {
		var old = images[i]
		raws := rep.FindAllStringSubmatch(old.Images, -1)
		var news = make([]string, 0)
		for _, v := range raws {
			news = append(news, v[1])
		}
		images[i].Images = strings.Join(news, ",")
	}
	for _, v := range images {
		tErr := conn.Table("article").Where("id = ?", v.Id).Update("images", v.Images).Error
		if tErr != nil {
			logrus.Errorf("update article %d error:%s", v.Id, tErr.Error())
		}
	}
	return
}
