import React from "react";
import { Link, NavLink } from "react-router-dom";

import dSponsorLogo from "../../assets/dsponsor/dSponsorLogo.png";
import bank1 from "../../assets/images/bank-1.png";
import bank2 from "../../assets/images/bank-2.png";
import bank3 from "../../assets/images/bank-3.png";
import bank4 from "../../assets/images/bank-4.png";
import useToggle from "../../hooks/useToggle";
import Icons from "../Helpers/Icons";
import ModalCom from "../Helpers/ModalCom";

import useEth from "../../contexts/EthContext/useEth";

export default function Header() {
  const [balanceDropdown, setbalanceValue] = useToggle(false);
  const [notificationDropdown, setNotificationValue] = useToggle(false);
  const [userProfileDropdown, setProfileDropdown] = useToggle(false);
  const [moneyPopup, setPopup] = useToggle(false);

  const {
    state: {  accounts  },
  } = useEth();
  


  const clickAwayhandler = () => {
    if (balanceDropdown) {
      setbalanceValue.toggle();
    }
    if (notificationDropdown) {
      setNotificationValue.toggle();
    }
    if (userProfileDropdown) {
      setProfileDropdown.toggle();
    }
  };
  const addMoneyHandler = () => {
    setPopup.toggle();
    setbalanceValue.set(false);
  };

  async function connect() {
    if (!accounts) {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
      } catch (ex) {
        console.log(ex);
        console.log("hello, it's me");
      }
    }
  }

  return (
    <>
      <div className="header-wrapper backdrop-blur-sm bg-[#efedfe5e]/60 w-full h-full flex items-center xl:px-0 md:px-10 px-5">
        <div className="flex justify-between items-center w-full">

          {/* Logo */}
          <div className="search-bar lg:block hidden w-[376px]">
            <img src={dSponsorLogo} alt="Logo Dsponsor" />
          </div>

          {/* user menu */}
          <div className="user-info flex items-center justify-end w-full lg:space-x-7 space-x-2 z-10 ">
            {/* market place */}
            <div className="lg:flex hidden user-balance cursor-pointer lg:w-[252px] w-[150px] h-[48px]  items-center rounded-full relative  bg-purple pr-1.5 pl-4">
              <div className="flex items-center lg:justify-between justify-center w-full h-full">
                <NavLink
                  to="/market-place"
                  className={`nav-item flex items-left `}
                >
                  <span className="item-icon group-hover:bg-purple group-hover:text-white w-8 h-8 flex justify-center items-center transition-all duration-300 ease-in-out  bg-light-purple rounded-full text-dark-gray">
                    <Icons name="market" />
                  </span>
                  <span
                    className={`item-content group-hover:text-purple text-[18px] transition-all duration-300 ease-in-out text-white relative font-medium `}
                  >
                    Marketplace
                  </span>
                </NavLink>
              </div>
            </div>
            {/* My collection */}
            <div className="lg:flex hidden user-balance cursor-pointer lg:w-[252px] w-[150px] h-[48px]  items-center rounded-full relative  bg-purple pr-1.5 pl-4">
              <div className="flex items-center lg:justify-between justify-center w-full h-full">
                <NavLink
                  to="/my-collection"
                  className={`nav-item flex items-center `}
                >
                  <span
                    className={`item-content group-hover:text-purple text-[18px] transition-all duration-300 ease-in-out text-white relative font-medium `}
                  >
                    Mes espaces
                  </span>
                </NavLink>
              </div>
            </div>
            {/* Connect button */}
            <div className="lg:flex hidden user-balance cursor-pointer lg:w-[252px] w-[150px] h-[48px]  items-center rounded-full relative  bg-purple pr-1.5 pl-4">
              <div className="flex items-center lg:justify-between justify-center w-full h-full">
                <button
                    onClick={connect}
                    type="button"
                  >
                  <span
                    className={`item-content group-hover:text-purple text-[18px] transition-all duration-300 ease-in-out text-white relative font-medium `}
                  >
                    <p>Connect my Wallet</p>
                  </span>
                  </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {balanceDropdown || notificationDropdown || userProfileDropdown ? (
        <div
          onClick={clickAwayhandler}
          className="w-full h-screen fixed left-0"
          style={{ zIndex: "-1" }}
        ></div>
      ) : (
        ""
      )}
      {moneyPopup && (
        <ModalCom action={addMoneyHandler} situation={moneyPopup}>
          <div className="lg:w-[580px] sm:w-[450px] w-full rounded-2xl h-auto bg-white">
            <div className="heading border-b border-light-purple lg:px-7 sm:px-5 px-3 py-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-dark-gray">
                Connect to a wallet
              </h3>
              <span onClick={addMoneyHandler}>
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 36 36"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M36 16.16C36 17.4399 36 18.7199 36 20.0001C35.7911 20.0709 35.8636 20.2554 35.8385 20.4001C34.5321 27.9453 30.246 32.9248 22.9603 35.2822C21.9006 35.6251 20.7753 35.7657 19.6802 35.9997C18.4003 35.9997 17.1204 35.9997 15.8401 35.9997C15.5896 35.7086 15.2189 35.7732 14.9034 35.7093C7.77231 34.2621 3.08728 30.0725 0.769671 23.187C0.435002 22.1926 0.445997 21.1199 0 20.1599C0 18.7198 0 17.2798 0 15.8398C0.291376 15.6195 0.214408 15.2656 0.270759 14.9808C1.71321 7.69774 6.02611 2.99691 13.0428 0.700951C14.0118 0.383805 15.0509 0.386897 15.9999 0C17.2265 0 18.4532 0 19.6799 0C19.7156 0.124041 19.8125 0.136067 19.9225 0.146719C27.3 0.868973 33.5322 6.21922 35.3801 13.427C35.6121 14.3313 35.7945 15.2484 36 16.16ZM33.011 18.0787C33.0433 9.77105 26.3423 3.00309 18.077 2.9945C9.78479 2.98626 3.00344 9.658 2.98523 17.8426C2.96667 26.1633 9.58859 32.9601 17.7602 33.0079C26.197 33.0577 32.9787 26.4186 33.011 18.0787Z"
                    fill="#374557"
                    fillOpacity="0.6"
                  />
                  <path
                    d="M15.9309 18.023C13.9329 16.037 12.007 14.1207 10.0787 12.2072C9.60071 11.733 9.26398 11.2162 9.51996 10.506C9.945 9.32677 11.1954 9.0811 12.1437 10.0174C13.9067 11.7585 15.6766 13.494 17.385 15.2879C17.9108 15.8401 18.1633 15.7487 18.6375 15.258C20.3586 13.4761 22.1199 11.7327 23.8822 9.99096C24.8175 9.06632 26.1095 9.33639 26.4967 10.517C26.7286 11.2241 26.3919 11.7413 25.9133 12.2178C24.1757 13.9472 22.4477 15.6855 20.7104 17.4148C20.5228 17.6018 20.2964 17.7495 20.0466 17.9485C22.0831 19.974 24.0372 21.8992 25.9689 23.8468C26.9262 24.8119 26.6489 26.1101 25.4336 26.4987C24.712 26.7292 24.2131 26.3441 23.7455 25.8757C21.9945 24.1227 20.2232 22.3892 18.5045 20.6049C18.0698 20.1534 17.8716 20.2269 17.4802 20.6282C15.732 22.4215 13.9493 24.1807 12.1777 25.951C11.7022 26.4262 11.193 26.7471 10.4738 26.4537C9.31345 25.9798 9.06881 24.8398 9.98589 23.8952C11.285 22.5576 12.6138 21.2484 13.9387 19.9355C14.5792 19.3005 15.2399 18.6852 15.9309 18.023Z"
                    fill="#374557"
                    fillOpacity="0.6"
                  />
                </svg>
              </span>
            </div>
            <div className="content lg:px-7 px-3 sm:px-5 py-8">
              <ul>
                <li
                  className="content-item px-5 py-2.5 lg:mb-8 mb-3 border rounded-lg b border-light-purple hover:border-purple"
                  style={{ boxShadow: "0px 16px 93px 0px #55526329" }}
                >
                  <div className="sm:flex justify-between items-center">
                    <div className="account-name flex space-x-4 items-center mb-2 sm:mb-0">
                      <div className="icon w-14 h-14 transition duration-300 ease-in-out rounded-full flex justify-center items-center bg-light-purple">
                        <img src={bank1} alt="" />
                      </div>
                      <div className="name">
                        <p className="text-xl font-bold text-dark-gray">
                          MetaMask
                        </p>
                      </div>
                    </div>
                    <div>
                      <button
                        type="button"
                        className="w-[122px] h-11 flex justify-center items-center border-gradient  text-base rounded-full text-back"
                      >
                        <span className="text-gradient"> Cannect</span>
                      </button>
                    </div>
                  </div>
                </li>
                <li
                  className="content-item px-5 py-2.5 lg:mb-8 mb-3 border rounded-lg b border-light-purple hover:border-purple"
                  style={{ boxShadow: "0px 16px 93px 0px #55526329" }}
                >
                  <div className="sm:flex justify-between items-center">
                    <div className="account-name flex space-x-4 items-center mb-2 sm:mb-0">
                      <div className="icon w-14 h-14 transition duration-300 ease-in-out rounded-full flex justify-center items-center bg-light-purple">
                        <img src={bank2} alt="" />
                      </div>
                      <div className="name">
                        <p className="text-xl font-bold text-dark-gray">
                          Coinbase Wallet
                        </p>
                      </div>
                    </div>
                    <div>
                      <button
                        type="button"
                        className="w-[122px] h-11 flex justify-center items-center border-gradient  text-base rounded-full text-back"
                      >
                        <span className="text-gradient"> Cannect</span>
                      </button>
                    </div>
                  </div>
                </li>
                <li
                  className="content-item px-5 py-2.5 mb-8 border b rounded-lg border-light-purple hover:border-purple"
                  style={{ boxShadow: "0px 16px 93px 0px #55526329" }}
                >
                  <div className="sm:flex justify-between items-center">
                    <div className="account-name flex space-x-4 items-center mb-2 sm:mb-0">
                      <div className="icon w-14 h-14 transition duration-300 ease-in-out rounded-full flex justify-center items-center bg-light-purple">
                        <img src={bank3} alt="" />
                      </div>
                      <div className="name">
                        <p className="text-xl font-bold text-dark-gray">
                          Bitski
                        </p>
                      </div>
                    </div>
                    <div>
                      <button
                        type="button"
                        className="w-[122px] h-11 flex justify-center items-center border-gradient  text-base rounded-full text-back"
                      >
                        <span className="text-gradient"> Cannect</span>
                      </button>
                    </div>
                  </div>
                </li>
                <li
                  className="content-item px-5 py-2.5 mb-8 border b rounded-lg border-light-purple hover:border-purple"
                  style={{ boxShadow: "0px 16px 93px 0px #55526329" }}
                >
                  <div className="sm:flex justify-between items-center">
                    <div className="account-name flex space-x-4 items-center mb-2 sm:mb-0">
                      <div className="icon w-14 h-14 transition duration-300 ease-in-out rounded-full flex justify-center items-center bg-light-purple">
                        <img src={bank4} alt="" />
                      </div>
                      <div className="name">
                        <p className="text-xl font-bold text-dark-gray">
                          WalletConnect
                        </p>
                      </div>
                    </div>
                    <div>
                      <button
                        type="button"
                        className="w-[122px] h-11 flex justify-center items-center btn-gradient text-base rounded-full text-white"
                      >
                        Cannected
                      </button>
                    </div>
                  </div>
                </li>
              </ul>
              <div className="add-money-btn flex justify-center items-center">
                <Link
                  to="#"
                  className="text-18 rounded-full text-thin-light-gray"
                >
                  View Wallet
                </Link>
              </div>
            </div>
          </div>
        </ModalCom>
      )}
    </>
  );
}
