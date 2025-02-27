package main

import (
	"blog/controller"
	"blog/middleware/cors"
	"blog/middleware/jwt"
	"blog/middleware/metrics"
	"blog/middleware/whitepaper"
	"blog/task"
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

func StartCronTask() {
	manager := task.NewTaskManager()
	err := manager.Run()
	if err != nil {
		logrus.Panicf("init task job manager failed:%s", err.Error())
	}
}

func main() {
	//starting the cron task
	StartCronTask()
	//registe  gin router
	engine := gin.Default()
	engine.Use(cors.CORS())
	engine.Use(gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		return fmt.Sprintf("%s - [%s] \"%s %s %s %d %s \"%s\" %s\"\n",
			param.ClientIP,
			param.TimeStamp.Format(time.RFC1123),
			param.Method,
			param.Path,
			param.Request.Proto,
			param.StatusCode,
			param.Latency,
			param.Request.UserAgent(),
			param.ErrorMessage,
		)
	}))
	engine.Use(gin.Recovery())
	//绑定流量监控
	metrics.BindMetrics(engine)
	//绑定业务路由
	bindArticleRoutes(engine)
	bindLikeRoutes(engine)
	bindCommentRoutes(engine)
	bindUserRoutes(engine)
	bindTagRoutes(engine)
	bindAirportRoutes(engine)
	bindMessageRoutes(engine)
	engine.Run(":8080")
}
func bindMessageRoutes(engine *gin.Engine) {
	route := engine.Group("/message")
	route.GET("/query", jwt.NewVerifyMiddleware(), func(ctx *gin.Context) {
		controller.GetMessage().QueryMessageByPage(ctx)
	})
	route.GET("/read", jwt.NewVerifyMiddleware(), func(ctx *gin.Context) {
		controller.GetMessage().ReadMessage(ctx)
	})
	route.GET("/utotal", jwt.NewVerifyMiddleware(), func(ctx *gin.Context) {
		controller.GetMessage().FindTotalUnreadMessage(ctx)
	})
}
func bindAirportRoutes(engine *gin.Engine) {
	route := engine.Group("/airport")
	route.GET("/findRunning", func(ctx *gin.Context) {
		controller.GetAirport().FindRunningAirport(ctx)
	})
	route.GET("/findFinish", func(ctx *gin.Context) {
		controller.GetAirport().FindFinishAirport(ctx)
	})
	route.GET("/findMy", jwt.NewVerifyMiddleware(), func(ctx *gin.Context) {
		controller.GetAirport().FindMyAirport(ctx)
	})
	route.POST("/create", jwt.NewVerifyMiddleware(), whitepaper.WhitepaperMiddleware(), func(ctx *gin.Context) {
		controller.GetAirport().CreateAirport(ctx)
	})
	route.GET("/delete", jwt.NewVerifyMiddleware(), whitepaper.WhitepaperMiddleware(), func(ctx *gin.Context) {
		controller.GetAirport().DeleteAirport(ctx)
	})
	route.GET("/cancel", jwt.NewVerifyMiddleware(), func(ctx *gin.Context) {
		controller.GetAirport().DeleteUserAirport(ctx)
	})
	route.GET("/update", jwt.NewVerifyMiddleware(), func(context *gin.Context) {
		controller.GetAirport().UpdateAirport(context)
	})
	// route.POST("update", jwt.NewVerifyMiddleware(), whitepaper.WhitepaperMiddleware(), func(ctx *gin.Context) {
	// 	controller.GetAirport().UpdateAirportInfo(ctx)
	// })
}

func bindArticleRoutes(engine *gin.Engine) {
	route := engine.Group("/article")

	route.POST("/image/upload", jwt.NewVerifyMiddleware(), func(context *gin.Context) {
		controller.GetArticle().UploadImage(context)
	})
	route.GET("/image/download", func(ctx *gin.Context) {
		controller.GetArticle().DownloadImage(ctx)
	})
	route.POST("/publish", jwt.NewVerifyMiddleware(), func(ctx *gin.Context) {
		controller.GetArticle().PublishArticle(ctx)
	})
	route.GET("/findByMaxAccess", func(ctx *gin.Context) {
		controller.GetArticle().FindArticleByMaxAccessNum(ctx)
	})
	route.GET("/findByCreateTime", func(ctx *gin.Context) {
		controller.GetArticle().FindArticleByCreateTime(ctx)
	})
	route.GET("/find", func(ctx *gin.Context) {
		controller.GetArticle().FindArticle(ctx)
	})
	route.GET("/search", func(ctx *gin.Context) {
		controller.GetArticle().SearchArticleByPage(ctx)
	})
	route.GET("/delete", jwt.NewVerifyMiddleware(), func(ctx *gin.Context) {
		controller.GetArticle().DeleteArticle(ctx)
	})
	route.GET("/update", jwt.NewVerifyMiddleware(), func(ctx *gin.Context) {
		controller.GetArticle().UpdateArticle(ctx)
	})
}

func bindLikeRoutes(engine *gin.Engine) {
	router := engine.Group("/like")
	router.GET("/confirm", jwt.NewVerifyMiddleware(), func(ctx *gin.Context) {
		controller.GetLike().SetAsLike(ctx)
	})
	router.GET("/cancel", jwt.NewVerifyMiddleware(), func(ctx *gin.Context) {
		controller.GetLike().CancelLike(ctx)
	})
	router.GET("/exist", jwt.NewVerifyMiddleware(), func(ctx *gin.Context) {
		controller.GetLike().IsExist(ctx)
	})
}
func bindCommentRoutes(engine *gin.Engine) {
	router := engine.Group("/comment")
	router.POST("/create", jwt.NewVerifyMiddleware(), func(ctx *gin.Context) {
		controller.GetComment().CreateComment(ctx)
	})
	router.GET("/find", func(ctx *gin.Context) {
		controller.GetComment().FindCommentByArticle(ctx)
	})
	router.GET("/delete", jwt.NewVerifyMiddleware(), func(ctx *gin.Context) {
		controller.GetComment().DeleteComment(ctx)
	})

}

// TODO test the proof is true
func bindUserRoutes(engine *gin.Engine) {
	router := engine.Group("/user")
	router.POST("/login", func(ctx *gin.Context) {
		controller.GetUser().LoginHandler(ctx)
	})
}

func bindTagRoutes(engine *gin.Engine) {
	router := engine.Group("/tag")
	router.GET("/findAll", func(ctx *gin.Context) {
		controller.GetTag().GetAllTags(ctx)
	})
	router.GET("/findArticle", func(ctx *gin.Context) {
		controller.GetTag().GetArticleByTag(ctx)
	})
}
