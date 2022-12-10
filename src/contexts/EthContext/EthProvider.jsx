import React, { useCallback, useEffect, useReducer } from "react";
import Web3 from "web3";
import EthContext from "./EthContext";
import { actions, initialState, reducer } from "./state";

function EthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);


  const init = useCallback(
    async artifact => {
      if (artifact) {
        const web3 = new Web3(Web3.givenProvider || "ws://localhost:8545");
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        // const accounts = null;
        const networkID = await web3.eth.net.getId();
        const { abi } = artifact;
        const dSponsorNFTContract = require("../../artifacts/contracts/DSponsorNFT.sol/DSponsorNFT.json");
        const ERC20Contract = require("../../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json");
        
        let address; let contract;
        try {
          address = "0x8d1137542C2F1a07b59971814E0Db5fF5008099e";
          contract = new web3.eth.Contract(abi, address);
        } catch (err) {
          console.error(err);
        }
        dispatch({
          type: actions.init,
          data: { artifact, web3, accounts, networkID, contract, ERC20Contract, dSponsorNFTContract }
        });
      }
    }, []);

  useEffect(() => {
    const tryInit = async () => {
      try {
        const artifact = require("../../artifacts/contracts/DSponsor_Main.sol/DSponsorMain.json");
        init(artifact);
      } catch (err) {
        console.error(err);
      }
    };

    tryInit();
  }, [init]);

  useEffect(() => {
    const events = ["chainChanged", "accountsChanged"];
    const handleChange = () => {
      init(state.artifact);
    };

    events.forEach(e => window.ethereum.on(e, handleChange));
    return () => {
      events.forEach(e => window.ethereum.removeListener(e, handleChange));
    };
  }, [init, state.artifact]);

  return (
    <EthContext.Provider value={{
      state,
      dispatch
    }}>
      {children}
    </EthContext.Provider>
  );
}

export default EthProvider;
