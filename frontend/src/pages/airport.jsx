import {Header, RunningAirport, FinishAirport, MyAirport} from "../components";
import {AnimatePresence, motion} from "framer-motion";
import React, {useContext, useEffect, useState} from 'react';
import "../css/airport.css";
import {ClockCircleFilled, PlusSquareFilled, WalletFilled} from "@ant-design/icons";
import { HttpAgent } from "../agent/agent";


const AirPort = () => {
    const [tabs,setTabs] = useState( [
        {icon:<WalletFilled height={10} width={10}/>,label:"我的空投",content: <MyAirport />},
        {icon:<PlusSquareFilled  height={10} width={10}/>, label: "发现空投",content:<RunningAirport />},
        {icon: <ClockCircleFilled  height={10} width={10} />, label: "已结束的空投",content:<FinishAirport />},
    ]);
    const [selectedTab, setSelectedTab] = useState(tabs[0]);
    return (
        <div className={"w-full h-full flex justify-center items-start"}>
            <Header/>
            <div className={"w-full h-full flex justify-center pt-32 items-center flex-row "}>
                <div className="airpointwindow  flex-col" style={{width:'95%'}}>
                    <nav className={" justify-center w-full flex items-center"}>
                        <ul className={"w-full h-full"}>
                            {tabs.map((item) => (
                                <li
                                    key={item.label}
                                    className={item === selectedTab ? "selected " : ""}
                                    onClick={() => setSelectedTab(item)}
                                >
                                    <div className={"flex w-full h-full justify-center items-center "}>
                                    {item.icon} <div className="text-sm sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl">
                                              {`${item.label}`}</div>
                                    </div>
                                    {item === selectedTab &&(
                                        <motion.div className="underline" layoutId="underline"/>
                                    ) }
                                </li>
                            ))}
                        </ul>
                    </nav>
                    <main className={"w-full pt-12 "}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                className={" min-w-full"}
                                key={selectedTab ? selectedTab.label : "empty"}
                                initial={{y: 10, opacity: 0}}
                                animate={{y: 0, opacity: 1}}
                                exit={{y: -10, opacity: 0}}
                                transition={{duration: 0.2}}
                            >
                                {selectedTab ?selectedTab.content: "😋"}
                            </motion.div>
                        </AnimatePresence>
                    </main>
                </div>
            </div>
        </div>
    )
};


export default AirPort;