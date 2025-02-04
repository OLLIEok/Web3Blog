import React, { useState, useEffect, useContext } from "react";
import { Drawer, Badge, Tabs, Card, Row, Col, Pagination } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { Web3Wallet } from "../App";
import { toast } from "react-toastify"; 
import { HttpAgent } from "../agent/agent.jsx"; 

const Notifications = () => {
  const [visible, setVisible] = useState(false);
  const [currentTab, setCurrentTab] = useState("all");
  const [unReadNum, setUnReadNum] = useState(0);
  const [badgeColor, setBadgeColor] = useState("orange");
  const [notificationsData, setNotificationsData] = useState({
    all: [],
    verified: [],
    mentions: [],
  });
  const { userAccount } = useContext(Web3Wallet);
  const { MessageClient } = useContext(HttpAgent);

  const [totals, setTotals] = useState(0); 
  const [currentPage, setCurrentPage] = useState(1);  
  const [totalPages, setTotalPages] = useState(1);     
  const [loading, setLoading] = useState(false);       

  const getTotalNotifications = () => {
    return MessageClient.GetTotal()
      .then((response) => {
        if (!response || !response.status) {
          throw new Error("获取未读消息数量失败");
        }
        return response.data;
      })
      .catch((error) => {
        toast.error(error.message || "获取未读消息数量失败");
        throw error;
      });
  };

  const readNotification = (messageId) => {
    return MessageClient.Read(messageId)
      .then((response) => {
        if (!response || !response.status) {
          throw new Error("标记消息为已读失败");
        }
        return response.data;
      })
      .catch((error) => {
        toast.error(error.message || "标记消息为已读失败");
        throw error;
      });
  };

  const findAllMessages = (page, pageSize) => {
    setLoading(true); 
    return MessageClient.FindAllMessage(page, pageSize)
      .then((response) => {
        if (!response || !response.status) {
          throw new Error("查询消息失败");
        }
        const messages = response.data.data;
        const total = response.data.total;  
        setTotals(total)
        setNotificationsData({
          all: messages,  
        });

        setTotalPages(Math.ceil(total / pageSize)); 
        setLoading(false); 
      })
      .catch((error) => {
        toast.error(error.message || "查询消息失败");
        setLoading(false); 
        throw error;
      });
  };

  const onClose = () => {
    setVisible(false);
  };

  const markAsRead = (messageId) => {
    readNotification(messageId).then(() => {
      const updatedMessages = notificationsData.all.map((message) => {
        if (message.id === messageId) {
          return { ...message, has_reply: true }; 
        }
        return message;
      });

      setNotificationsData((prevData) => ({
        ...prevData,
        all: updatedMessages, 
      }));

      getTotalNotifications().then((data) => {
        setUnReadNum(data);
        setBadgeColor(data <= 3 ? "orange" : "red");
      });
    });
  };

  useEffect(() => {
    if (userAccount) {
      getTotalNotifications().then(data => {
        setUnReadNum(data);
        if (data <= 3) {
          setBadgeColor("orange");
        } else {
          setBadgeColor("red");
        }
      });

      // 获取当前页的消息
      findAllMessages(currentPage, 5).then(() => {});
    }
  }, [userAccount, currentPage]);  

  return (
    <>
      {userAccount && (
        <div className="flex justify-start items-center pl-3">
          <Badge
            count={unReadNum}
            className="top-1 right-3"
            style={{ backgroundColor: badgeColor }}
          >
            <BellOutlined className="text-2xl cursor-pointer" onClick={() => setVisible(true)} />
          </Badge>
        </div>
      )}

      <Drawer
        title="通知"
        placement="right"
        width={400}
        visible={visible}
        onClose={onClose}
        styles={{
          body: {
            padding: '20px',  
          },
        }}
      >
        <Tabs
          defaultActiveKey="all"
          onChange={(key) => setCurrentTab(key)}
          tabBarStyle={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Tabs.TabPane tab="全部" key="all">
            <div>
              {notificationsData.all.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card
                    size="small"
                    style={{
                      marginBottom: 16,
                      borderRadius: 8,
                      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
                    }}
                    hoverable
                    onClick={() => {!message.has_reply && markAsRead(message.id)}}
                  >
                    <Row>
                      <Col span={20}>
                        <h4 style={{ fontSize: "16px", fontWeight: "bold" }}>
                          {message.content}
                        </h4>
                      </Col>
                      <Col span={4} style={{ textAlign: "right" }}>
                        <Badge
                          dot={!message.has_reply}
                          style={{ backgroundColor: "#1890ff", transform: "scale(1.3)" }}
                        />
                      </Col>
                    </Row>
                    <Row justify="space-between" style={{ fontSize: "12px", marginTop: 10 }}>
                      <Col>{new Date(message.create_time).toLocaleString()}</Col>
                    </Row>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <Pagination
                align="end"
                current={currentPage}
                showTotal={(total) => `共 ${total} 条`}
                total={totals}  
                pageSize={5}            
                onChange={(page) => setCurrentPage(page)} 
                showSizeChanger={false} 
              />
            </div>
          </Tabs.TabPane>
        </Tabs>
      </Drawer>
    </>
  );
};

export default Notifications;
