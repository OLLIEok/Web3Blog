package utils

import (
	"strconv"
	"time"
)

func GetCurrentDS() int {
	currentTime := time.Now()
	dateStr := currentTime.Format("20060102")
	dateInt, _ := strconv.Atoi(dateStr)
	return dateInt
}

func FormatDs(ds int) string {
	dsTime, _ := time.Parse("20060102", strconv.FormatInt(int64(ds), 10))
	return dsTime.Format("2006年01月02日")
}
