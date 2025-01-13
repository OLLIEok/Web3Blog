import React, { useState, useEffect } from "react";
import { Drawer, Badge, Button, Tabs, List } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";

const notificationsData = {
  all: [
    "Welcome to the platform!",
    "New features are released.",
    "Your account has been updated.",
  ],
  verified: [
    "Verified account added.",
    "Your document has been approved.",
  ],
  mentions: [
    "@user mentioned you in a post.",
    "@admin mentioned you in a comment.",
  ],
};

const Notifications = () => {
  const [visible, setVisible] = useState(false); 
  const [currentTab, setCurrentTab] = useState("all"); 
  const [newNotifications, setNewNotifications] = useState(0); 
  const [badgeColor, setBadgeColor] = useState("orange"); 

  const showDrawer = () => {
    setVisible(true);
  };

  const onClose = () => {
    setVisible(false);
  };

  const handleTabChange = (key) => {
    setCurrentTab(key);
  };

  useEffect(() => {
    const totalNotifications = notificationsData.all.length;
    setNewNotifications(totalNotifications);

    if (totalNotifications <= 3) {
      setBadgeColor("orange");
    } else {
      setBadgeColor("red");
    }
  }, [notificationsData]); 

  return (
    <div className="flex items-center">
      <div className="relative">
        <Badge 
          count={newNotifications} 
          className="top-1 right-3"
          style={{ backgroundColor: badgeColor }} 
        >
          <BellOutlined className="text-2xl cursor-pointer" onClick={showDrawer} />
        </Badge>
      </div>
      <Drawer
        title="Notifications"
        placement="right"
        width={400}
        visible={visible}
        onClose={onClose}
      >
        <Tabs
          defaultActiveKey="all"
          onChange={handleTabChange}
          tabBarStyle={{
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Tabs.TabPane tab="All" key="all">
            <List
              dataSource={notificationsData.all}
              renderItem={(message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <List.Item
                    className="p-2"
                    style={{
                      fontSize: "14px", 
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                  >
                    {message}
                  </List.Item>
                </motion.div>
              )}
            />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Verified" key="verified">
            <List
              dataSource={notificationsData.verified}
              renderItem={(message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <List.Item
                    className="p-2"
                    style={{
                      fontSize: "14px", 
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                  >
                    {message}
                  </List.Item>
                </motion.div>
              )}
            />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Mentions" key="mentions">
            <List
              dataSource={notificationsData.mentions}
              renderItem={(message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <List.Item
                    className="p-2"
                    style={{
                      fontSize: "14px", 
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                  >
                    {message}
                  </List.Item>
                </motion.div>
              )}
            />
          </Tabs.TabPane>
        </Tabs>
      </Drawer>
    </div>
  );
};

export default Notifications;
