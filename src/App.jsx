import Toaster from "./components/Helpers/Toaster";
import { EthProvider } from "./contexts/EthContext";
import Routers from "./Routers";

function App() {
  return (
    <>
    <EthProvider>
      <Routers />
      <Toaster />
    </EthProvider>
    </>
  );
}

export default App;
