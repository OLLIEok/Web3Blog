package service_test

import (
	"blog/service"
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestImageRegex(t *testing.T) {
	a := service.GetArticle()
	res, err := a.MatchMdContextImage(`## 总结
![1733814602748.png](/blog/article/image/download?filename=1_1733814637.png "1_1733814637.png")

总的来说,geth通过makeFullNode和startNode对上述的一些服务进行了初始化以及启动。主要包括p2pNode、blockchain这个复杂的数据结构，以及向外部和内部进程提供的服务servers(**通过反射rpcAPIS的servers里面的公共方法实现注册**),同时通过accountmanager对账户进行管理,后续包括了一个系统必不可少了profile、metrics、trace等相关信息。这里我们没有过多地讲述consensus engine，因为目前很多full node都是通过[第三方的共识模块](https://ethereum.org/zh/developers/docs/nodes-and-clients/run-a-node/#starting-the-consensus-client)来实现POS的. `)
	fmt.Println(res)
	assert.Equal(t, "1_1733814637.png", res[0], err)
}
