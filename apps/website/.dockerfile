FROM registry.cn-chengdu.aliyuncs.com/web3blog/golang:1.22.1 as builder

WORKDIR /app

COPY . .

ENV GOPROXY=https://goproxy.cn,direct
RUN GIN_MODE=release GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o blog -ldflags="-s -w" .


FROM alpine

ENV TZ=Asia/Shanghai

RUN echo "http://mirrors.aliyun.com/alpine/v3.17/main" > /etc/apk/repositories && \
    echo "http://mirrors.aliyun.com/alpine/v3.17/community" >> /etc/apk/repositories && \
    apk update && \
    apk add --no-cache tzdata

WORKDIR /website

RUN cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone

COPY --from=builder /app/blog ./blog
RUN chmod u+x ./blog
COPY --from=builder /app/config/*.yaml ./config/

EXPOSE 8080

CMD ["/bin/sh","-c","./blog"]
