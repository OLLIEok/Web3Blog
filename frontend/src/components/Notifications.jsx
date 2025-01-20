import React, { useState, useEffect, useContext } from "react";
import { Drawer, Badge, Tabs, List, Card, Button, Row, Col } from "antd";
import { BellOutlined, CheckCircleOutlined } from "@ant-design/icons";
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
    return MessageClient.FindAllMessage(page, pageSize)
      .then((response) => {
        if (!response || !response.status) {
          throw new Error("查询消息失败");
        }
        return response.data.Data;
      })
      .catch((error) => {
        toast.error(error.message || "查询消息失败");
        throw error;
      });
  };

  const onClose = () => {
    setVisible(false);
  };

  const markAsRead = (messageId) => {
    readNotification(messageId).then(() => {
      const updatedMessages = notificationsData.all.map((message) => {
        if (message.Id === messageId) {
          return { ...message, HasReply: true }; 
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

      findAllMessages(1, 5).then(allMessages => {
        setNotificationsData({
          all: allMessages,
        });
      });
    }
  }, [userAccount]);

  return (
    <>
      {userAccount && (
        <div className="flex justify-start items-center pl-3">
          <Badge
            count={unReadNum}
            className="top-1 right-3"
            style={{ backgroundColor: badgeColor }}
          >
            <BellOutlined className="text-2xl cursor-pointer" onClick={()=>setVisible(true)} />
          </Badge>
        </div>
      )}

      <Drawer
        title="Notifications"
        placement="right"
        width={400}
        visible={visible}
        onClose={onClose}
      >
        <Tabs
          defaultActiveKey="all"
          onChange={(key) => setCurrentTab(key)}
          tabBarStyle={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Tabs.TabPane tab="All" key="all">
            <div>
              {notificationsData.all.map((message) => (
                <motion.div
                  key={message.Id}
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
                    // onClick={() => !message.HasReply && markAsRead(message.Id)}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#f0f0f0")
                    }
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "";
                    }}
                  >
                    <Row>
                      <Col span={20}>
                        <h4 style={{ fontSize: "16px", fontWeight: "bold" }}>
                          {message.Content}
                        </h4>
                      </Col>
                      <Col span={4} style={{ textAlign: "right" }}>
                        <Badge
                          dot={!message.HasReply}
                          style={{ backgroundColor: "#1890ff",transform: "scale(1.3)" }}
                        />
                      </Col>
                    </Row>
                    <Row
                      justify="space-between"
                      style={{ fontSize: "12px", marginTop: 10 }}
                    >
                      <Col>{new Date(message.CreateTime).toLocaleString()}</Col>
                      <Col>
                        {message.HasReply ? (
                          <span
                            style={{
                              color: "#666",
                              fontSize: "14px",
                              fontWeight: "bold",
                            }}
                          >
                            <CheckCircleOutlined style={{ color: "#4CAF50" }} />{" "}
                            已读
                          </span>
                        ) : (
                          <Button
                            size="small"
                            style={{
                              backgroundColor: "rgb(51, 51, 51)",
                              fontSize: "13px",
                              color: "white",
                              borderRadius: "5px",
                            }}
                            onClick={() => {
                              // e.stopPropagation();
                              markAsRead(message.Id);
                            }}
                          >
                            Mark
                          </Button>
                        )}
                      </Col>
                    </Row>
                  </Card>
                </motion.div>
              ))}
            </div>
          </Tabs.TabPane>
        </Tabs>
      </Drawer>
    </>
  );
};

export default Notifications;
