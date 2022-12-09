import { Route, Routes } from "react-router-dom";
import FourZeroFour from "./components/FourZeroFour";
import ScrollToTop from "./components/Helpers/ScrollToTop";
import MyCollection from "./components/MyCollection";
import Notification from "./components/Notification";
import AcitveBidsPage from "./views/AcitveBidsPage";
import AuthProfilePage from "./views/AuthProfilePage";
import CollectionItemPage from "./views/CollectionItemPage";
import HistoryPage from "./views/HistoryPage";
import MarketPlacePage from "./views/MarketPlacePage";
import MyWalletPage from "./views/MyWalletPage";
import SavedPage from "./views/SavedPage";
import SellPage from "./views/SellPage";
import SettingsPage from "./views/SettingsPage";
import ShopDetailsPage from "./views/ShopDetailsPage";
import UploadProductPage from "./views/UploadProductPage";
import UserProfilePage from "./views/UserProfilePage";


// YED import useEth from "./contexts/EthContext/useEth";


export default function Routers() {
  // YED const { state: { accounts } } = useEth();

  return (
    <ScrollToTop>
      <Routes>

          <Route exact path="/" element={<MarketPlacePage />} />
          <Route exact path="/active-bids" element={<AcitveBidsPage />} />
          <Route exact path="/notification" element={<Notification />} />
          <Route exact path="/market-place" element={<MarketPlacePage />} />
          <Route exact path="/shop-details" element={<ShopDetailsPage />} />
          <Route exact path="/my-wallet" element={<MyWalletPage />} />
          <Route exact path="/my-collection" element={<MyCollection />} />
          <Route
            exact
            path="/my-collection/collection-item"
            element={<CollectionItemPage />}
          />
          <Route exact path="/sell" element={<SellPage />} />
          <Route exact path="/saved" element={<SavedPage />} />
          <Route exact path="/history" element={<HistoryPage />} />
          <Route exact path="/upload-product" element={<UploadProductPage />} />
          <Route exact path="/profile" element={<AuthProfilePage />} />
          <Route exact path="/user-profile" element={<UserProfilePage />} />
          <Route exact path="/settings" element={<SettingsPage />} />


        <Route path="*" element={<FourZeroFour />} />
      </Routes>
    </ScrollToTop>
  );
}
