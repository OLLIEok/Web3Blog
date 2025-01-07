import { useSyncProviders } from "../hooks/useSyncProviders";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Modal } from "antd";

import React, { useEffect, useContext } from "react";
import { MetaMaskSDK } from "@metamask/sdk"
import { HttpAgent } from "../agent/agent";
import { Web3Wallet } from "../App";

export const DiscoverWalletProviders = () => {
    const MMSDK = new MetaMaskSDK({
        dappMetadata: {
            name: "0xdoomxy blog",
        },
        infuraAPIKey: "656103da5ad94eea9d35c65f78079af8",
    })
    const { SetAuthorization, UserClient,SetIsAdmin } = useContext(HttpAgent);
    const { searchWalletModal, setSearchWalletModal, setSelectedWallet, setUserAccount } = useContext(Web3Wallet);
    const providers = useSyncProviders()
    const handleConnectAndSign = async (providerWithInfo, account) => {

        if (providerWithInfo) {
            if (providerWithInfo.provider.chainId === undefined || providerWithInfo.provider.chainId == null) {
                try {
                    await providerWithInfo.provider
                        .request({
                            method: "wallet_switchEthereumChain",
                            params: [{ chainId: "0x01" }],
                        })
                } catch (switchError) {
                    if (switchError.code === 4902) {
                        try {
                            await providerWithInfo.provider
                                .request({
                                    method: "wallet_addEthereumChain",
                                    params: [
                                        {
                                            chainId: "0x01",
                                            chainName: "Ethereum Mainnet",
                                            rpcUrls: ["https://mainnet.infura.io/v3/656103da5ad94eea9d35c65f78079af8"],
                                        },
                                    ],
                                })
                        } catch (addError) {
                            toast.error("添加网络出错")
                        }
                    }

                }
            }
            const message = JSON.stringify({
                types: {
                    EIP712Domain: [
                        {
                            name: "name",
                            type: "string"
                        },
                        {
                            name: "version",
                            type: "string"
                        },
                        {
                            name: "chainId",
                            type: "uint256"
                        }
                    ],
                    Verify: [
                        { name: "content", type: "string" }
                    ]
                },
                domain: {
                    chainId: providerWithInfo.provider.chainId,
                    name: "0xdoomxy blog",
                    version: providerWithInfo.provider.networkVersion,
                },
                primaryType: "Verify",
                message: {
                    content: "Welcome to 0xdoomxy blog",
                },
            })
            var params = [account, message]
            var method = "eth_signTypedData_v4"
            try {
                var sign = await providerWithInfo.provider.request(
                    {
                        method,
                        params,
                        from: account,
                    });
                var loginResp = await UserClient.Login({
                    "message": message,
                    "sign": sign,
                })
                if (!loginResp || !loginResp.status) {
                    return false;
                }
                SetAuthorization(loginResp.data.auth);
                SetIsAdmin(loginResp.data.is_admin);
                return true;
            } catch (error) {
                return false;
            }
        }
        return false;

    }
    const handleConnect = async (providerWithInfo) => {
        const accounts = await (
            providerWithInfo.provider.request({ method: 'eth_requestAccounts' })
                .catch((err) => toast.error("获取账号失败", err))
        )
        if (accounts?.[0]) {
            let res = await handleConnectAndSign(providerWithInfo, accounts?.[0]);
            if (!res) {
                toast.error("登录出错");
                return;
            }
            setSelectedWallet(providerWithInfo);
            setUserAccount(accounts?.[0])
            setSearchWalletModal(!searchWalletModal);
            toast.success("登录成功");
        }
    }
    useEffect(() => {
        if (searchWalletModal && providers.length <= 0) {
            toast.error("未找到符合EIP6963的钱包")
            setSearchWalletModal(!searchWalletModal);
        }
    }, [searchWalletModal]);
    
    return (
    providers.length > 0 &&
    <Modal
        className={"rounded-xl"}  
        // width={"30%"}  
        closable={false}  
        keyboard  
        footer={null}  
        open={searchWalletModal}  
        onCancel={() => setSearchWalletModal(!searchWalletModal)} 
    >
        <div className={"w-full h-24 flex justify-center items-center flex-col"}>
            <motion.div
                animate={{ x: 60, transition: { duration: 1 } }}  
                className={"w-full flex justify-start font-serif items-start flex-col"}
            >
                <div  className={"w-full lg:text-2xl text-xl font-serif text-wrap "}>
                    欢迎来到
                </div>
                <div
                    className={"w-full font-serif pl-14 lg:text-2xl text-xl text-wrap"}
                >
                    0xdoomxy的小世界
                </div>
            </motion.div>
        </div>

        {/* 钱包提供商按钮列表 */}
        <div className={"flex justify-center items-center flex-col"}>
            {providers?.map((provider) => (
                <motion.button
                    key={provider.info.name}  
                    style={{ width: "100%", height: "50px", borderRadius: "8px" }}  
                    className={"w-full h-full my-2 bg-white shadow-none transition-all duration-200 ease-in-out"}  
                    onClick={() => handleConnect(provider)}  
                    whileHover={{ 
                        scale: 1.05, 
                        boxShadow: "0 4px 16px rgba(53, 49, 49, 0.3)"  // 透明度 0.4
                    }}  
                    whileTap={{ scale: 0.95 }}  // 按钮点击时缩小 5%
                >
                    <div className={"flex pl-2 justify-start items-center"}>
      
                        <img
                            src={provider.info.icon}
                            style={{ width: "40px", height: "40px" }}
                            alt={provider.info.name}
                        />
                        <div
                            className={"pl-4"}
                            style={{
                                fontSize: "16px",
                                color: "#222222",  
                                fontFamily: "Basel,sans-serif"  
                            }}
                        >
                            {provider.info.name}  
                        </div>
                    </div>
                </motion.button>
            ))}
        </div>
    </Modal>
)
}