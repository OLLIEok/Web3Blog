package service

import (
	"bytes"
	"context"
	"encoding/json"
	"strconv"
	"utils/db"

	"github.com/elastic/go-elasticsearch/v7/esapi"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
)

//es field

//	"content": {
//		"type": "text",
//		"analyzer": "ik_max_word"
//	},
//
//	"tags": {
//		"type": "text",
//		"analyzer": "comma"
//	},
//
//	"title": {
//		"type": "text",
//		"analyzer": "ik_max_word"
//	}
type Entity struct {
	ID      uint   `gorm:"id" json:"-"`
	Content string `gorm:"content" json:"content"`
	Title   string `gorm:"title" json:"title"`
	Tags    string `gorm:"tags" json:"tags"`
}

func MysqlToES() {
	dbConn := db.NewMysqlConn()
	esConn := db.NewElasticsearchConn()
	var entities []*Entity
	var err error
	err = dbConn.Table(viper.GetString("mysql.table")).Scan(&entities).Error
	if err != nil {
		logrus.Panicf("query entities from mysql failed: %s", err.Error())
	}
	logrus.Infof("query entities from mysql total:%d", len(entities))
	var body []byte
	var request *esapi.IndexRequest
	var resp *esapi.Response
	for i := 0; i < len(entities); i++ {
		var e = entities[i]
		body, err = json.Marshal(e)
		if err != nil {
			logrus.Errorf("marshal entity failed: %s", err.Error())
		}
		request = &esapi.IndexRequest{
			Index:      viper.GetString("elasticsearch.index"),
			DocumentID: strconv.Itoa(int(e.ID)),
			Body:       bytes.NewReader(body),
			Refresh:    "true",
		}
		resp, err = request.Do(context.TODO(), esConn)
		if err != nil {
			logrus.Errorf("index entity failed: %s", err.Error())
		}
		defer resp.Body.Close()
		if resp.IsError() {
			logrus.Printf("[%s] Error indexing document ID=%d", resp.Status(), e.ID)
		} else {
			logrus.Printf("[%s] Successfully indexed document ID=%d", resp.Status(), e.ID)
		}
	}
}
