import {useContext, useEffect,useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import {formatAddress} from "../util/web3";
import {Web3Wallet} from "../App.jsx";
import { HttpAgent } from "../agent/agent.jsx";

const Avatar = () => {
    const {selectedWallet,setSelectedWallet,userAccount,setUserAccount} = useContext(Web3Wallet);
    const [dropdown, setDropDown] = useState(false);
    const {SetAuthorizetion,SetIsAdmin,Authorization} =  useContext(HttpAgent);
    const dropdownRef = useRef(null);
    const avatarRef = useRef(null);
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          dropdownRef.current && !dropdownRef.current.contains(event.target) && 
          avatarRef.current && !avatarRef.current.contains(event.target)
      ) {
          setDropDown(false); 
      }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
            document.removeEventListener("mousedown", handleClickOutside);
      }
    },[]);   
    const navigate = useNavigate();
    return (
        <>
            {(Authorization !== undefined && Authorization !== null) ?
                <>
                    <button 
                    ref={avatarRef}
                    onClick={() => {
                        setDropDown(origin => setDropDown(!origin))
                    }} type="button"
                            className="relative inline-flex items-center justify-center w-12 h-12  overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600">
                        <span className="font-medium text-gray-600 dark:text-gray-300">Web3</span>
                    </button>
                    {dropdown ? <div id="dropdownInformation"
                                      ref={dropdownRef}
                                     className=" bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700 dark:divide-gray-600 absolute top-16 ">
                        <div className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            <div>Welcome to</div>
                            <div
                                className="font-medium truncate">{formatAddress(userAccount)}</div>
                        </div>
                        <ul className="py-2 text-sm text-gray-700 dark:text-gray-200"
                            aria-labelledby="dropdownInformationButton">
                            <li>
                                <a onClick={() => {
                                    navigate("/article/create")
                                }}
                                   className="block px-4 py-2 lg:text-md text-sm hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">创建文章</a>
                            </li>
                            <li>
                                <a href="#"
                                   className="block px-4 py-2 lg:text-md text-sm hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Dashboard</a>
                            </li>
                            <li>
                                <a href="#"
                                   className="block px-4 py-2 lg:text-md text-sm hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Collection</a>
                            </li>
                        </ul>
                        <div className="py-2">
                            <a href="#"
                               className="block px-4 py-2 text-sm lg:text-md text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                               onClick={() => {
                                    setSelectedWallet(null);
                                    setUserAccount(null);
                                   SetAuthorizetion(null);
                                   SetIsAdmin(false);
                               }}>退出登录</a>
                        </div>
                    </div> : <> </>}
                </>
                : <></>}
        </>
    )
}

export default Avatar;

