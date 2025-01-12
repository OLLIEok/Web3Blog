package main

import (
	"utils/service"

	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
)

func init() {
	viper.AddConfigPath("./config")
	viper.SetConfigType("yaml")
	if err := viper.ReadInConfig(); err != nil {
		logrus.Panicf("read config failed: %v", err)
	}
}

func main() {
	service.FixImages()
}
