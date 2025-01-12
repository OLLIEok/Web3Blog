package task

import (
	"blog/dao"
	"blog/dao/db"
	"context"
	"strings"

	"github.com/aliyun/aliyun-oss-go-sdk/oss"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
)

var imageBucketName string

func init() {
	imageBucketName = viper.GetString("article.imagesbucketname")
}

//对于oss中的图片的定时任务

//目前oss中的图片是可以让用户随意上传的，这会导致oss存储图片的空间被占用，所以需要定时任务来清理oss中的图片

//目前定义每天凌晨1点执行一次清理任务

//TODO: fix up the bugger when creating article ,the images which is in article line lose

func newImageCronTask() func() {
	return func() {
		//获取现在数据库中的所有文章的图片
		articleDao := dao.GetArticle()
		images, err := articleDao.GetAllArticleImages(context.Background())
		if err != nil {
			logrus.Error("execute cron task to delete useless image failed: ", err.Error())
			return
		}
		//获取oss中的所有图片
		bucket := db.GetBucket(imageBucketName)
		var ossResult oss.ListObjectsResult
		ossResult, err = bucket.ListObjects()
		if err != nil {
			logrus.Error("execute cron task to delete useless image failed: ", err.Error())
			return
		}
		allImages := ossResult.Objects
		//遍历oss中的图片，如果不在数据库中的图片，就删除
		for _, image := range allImages {
			if strings.Compare(image.Key,)
		}
	}
}
