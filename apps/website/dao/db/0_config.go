package db

import (
	"fmt"
	"os"
	"strings"

	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
)

// 加载配置文件
func init() {
	var err error
	var dir string
	dir, err = os.Getwd()
	if err != nil {
		logrus.Panic(err)
	}
	laststr := "website"
	last := strings.LastIndex(dir, laststr)
	dir = fmt.Sprintf("%s%s%s", dir[:last+len(laststr)], string(os.PathSeparator), "config")
	viper.AddConfigPath(dir)
	viper.SetConfigType("yaml")
	if err = viper.ReadInConfig(); err != nil {
		logrus.Panic("load config failed:", err.Error())
	}
}
