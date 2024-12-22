import './App.css';
import {Bounce, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import React, {createContext, useState} from "react";
import {DiscoverWalletProviders} from "./components/WalletProviders";
import Agent from './agent/agent';
export const Web3Wallet = createContext();
export default function App() {
  const [selectedWallet, setSelectedWallet] = useState();
  const [userAccount, setUserAccount] = useState('');
  const [searchWalletModal,setSearchWalletModal] = useState(false);

    return (
        <>
          <Web3Wallet.Provider value={{searchWalletModal,setSearchWalletModal,selectedWallet,setSelectedWallet,userAccount,setUserAccount}}>
            <Agent setSearchWalletModal={setSearchWalletModal}/>
          </Web3Wallet.Provider>
            <ToastContainer
                position="top-center"
                autoClose={2000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
                transition={Bounce}
            />
        </>
    );
}
