package task

import (
	"os"
	"os/signal"
	"sync"
	"syscall"

	"github.com/robfig/cron/v3"
	"github.com/sirupsen/logrus"
)

type manager struct {
	c    *cron.Cron
	stop []chan chan any
}

var m *manager = new(manager)

func NewTaskManager() *manager {
	return m
}

func (m *manager) Run() (err error) {
	if m.c == nil {
		m.c = cron.New()
	}
	var likeJob cron.EntryID
	likeJob, err = m.c.AddFunc("*/30 * * * *", NewLikeCronJob())
	if err != nil {
		return
	}
	logrus.Infof("Success  registe like cron job :%d", likeJob)
	var airportJob cron.EntryID
	airportJob, err = m.c.AddFunc("0 0 * * *", NewAirportCronJob())
	if err != nil {
		return
	}
	logrus.Infof("Success  registe airport cron job :%d", airportJob)
	var imageJob cron.EntryID
	imageJob, err = m.c.AddFunc("0 0 1 * *", NewImageCronTask())
	if err != nil {
		return
	}
	logrus.Infof("Success registe image cron job :%d", imageJob)
	go m.c.Run()
	// run self task which cant be managed by cron.Cron
	m.runSelfTask()

	go func() {
		logrus.Infof("Running the protected thread ")
		sigc := make(chan os.Signal, 1)
		signal.Notify(sigc, syscall.SIGINT, syscall.SIGTERM)
		for {
			select {
			case <-sigc:
				<-m.c.Stop().Done()
				logrus.Infof("Stop the cron.Cron task")
				wg := sync.WaitGroup{}
				wg.Add(len(m.stop))
				for _, v := range m.stop {
					go func(exit chan chan any) {
						defer wg.Done()
						reply := make(chan any, 1)
						exit <- reply
						<-reply
					}(v)
				}
				wg.Wait()
				logrus.Info("Stop the self task")
				os.Exit(0)
			}
		}
	}()
	return
}

func (m *manager) runSelfTask() {
	m.stop = make([]chan chan any, 0, 1)
	var accessFinal = make(chan chan any, 0)
	m.stop = append(m.stop, accessFinal)
	go func(final chan chan any) {
		logrus.Info("Success registe access job")
		newAccessConsumerJob(final)()
	}(accessFinal)
}
