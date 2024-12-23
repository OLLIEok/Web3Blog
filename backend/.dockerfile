FROM golang:1.22.1 as builder

WORKDIR /app

COPY . .

RUN go build -o blog -ldflags="-s -w" .

--

FROM alpine

ENV TZ=Asia/Shanghai

RUN echo "http://mirrors.aliyun.com/alpine/v3.17/main" > /etc/apk/repositories && \
    echo "http://mirrors.aliyun.com/alpine/v3.17/community" >> /etc/apk/repositories && \
    apk update && \
    apk add --no-cache tzdata

RUN cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone

COPY --from=builder ./blog ./blog

COPY --from=builder /config/*.yaml ./config/

EXPOSE 8080

CMD ["./blog"]
