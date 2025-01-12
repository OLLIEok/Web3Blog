package db

import (
	"database/sql"
	"fmt"

	"github.com/elastic/go-elasticsearch/v7"
	"github.com/elastic/go-elasticsearch/v7/esapi"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func NewMysqlConn() (db *gorm.DB) {
	var err error
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True", viper.GetString("mysql.username"), viper.GetString("mysql.password"), viper.GetString("mysql.host"), viper.GetInt("mysql.port"), viper.GetString("mysql.database"))
	db, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		PrepareStmt: true,
	})
	if err != nil {
		logrus.Panicf("connect to mysql %s failed: %s", dsn, err.Error())
	}
	var t *sql.DB
	t, err = db.DB()
	if err != nil {
		logrus.Panicf("failed to ping database: %s", err.Error())
	}
	err = t.Ping()
	if err != nil {
		logrus.Panicf("failed to ping database: %s", err.Error())
	}
	logrus.Info("connect to mysql success")
	return
}

func NewElasticsearchConn() (es *elasticsearch.Client) {
	var err error
	cfg := elasticsearch.Config{
		Addresses: viper.GetStringSlice("elasticsearch.address"),
		Username:  viper.GetString("elasticsearch.username"),
		Password:  viper.GetString("elasticsearch.password"),
		//TODO this method will stop the world
		// Transport: &fasthttp.Transport{},
	}
	es, err = elasticsearch.NewClient(cfg)
	if err != nil {
		logrus.Panicf("connect to elasticsearch %v failed: %s", cfg, err.Error())
	}
	var resp *esapi.Response
	resp, err = es.Ping()
	if err != nil {
		logrus.Panicf("ping elasticsearch %v failed: %s", cfg, err.Error())
	}
	defer resp.Body.Close()
	logrus.Info("connect to elasticsearch success")
	return
}
