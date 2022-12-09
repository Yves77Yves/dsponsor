import React, { useEffect, useState } from "react";
import products from "../../data/marketplace_data.json";
import ProductCardStyleTwo from "../Cards/ProductCardStyleTwo";
import DataIteration from "../Helpers/DataIteration";

import useEth from "../../contexts/EthContext/useEth";
import TrendingSection from "../Home/TrendingSection";

export default function MainSection({ className }) {
  const {
    state: { contract, web3, accounts, dSponsorNFTContract },
  } = useEth();


  const [marketProducts, setMarketProducts] = useState([]);

  let isFinished = false;

  useEffect(() => {
    if (marketProducts.length === 0 && !isFinished) {
      const fetchData = async () => {
        products.data = [];
        console.log(contract);
        console.log(" before eventNewDSponsor");
        const eventNewDSponsor = await contract.getPastEvents("NewDSponsor", {
          fromBlock: 29454517, // 29310000,
          toBlock: "latest",
        });
        console.log(" after eventNewDSponsor");
        console.log(eventNewDSponsor);

        // On fait un tableau avec les nftContrat
        console.log("construction de la table des contrats");
        const nftContractId = eventNewDSponsor.map(
          (Id) => Id.returnValues.nftContract
        );

        console.log("table des contrats : ");
        console.log(nftContractId);

        // début boucle

        // boule for each nftContractId, récupérer addressDsponNFT

        console.log(nftContractId[0]);
        await Promise.all(
          nftContractId.map(async (address, index) => {
            const contractNft = new web3.eth.Contract(
              dSponsorNFTContract.abi,
              address
            );
            const price = await contractNft.methods
              .getMintPriceForCurrency(
                "0xfe4F5145f6e09952a5ba9e956ED0C25e3Fa4c7F1"
              )
              .call();
            const controller = await contractNft.methods.getController().call();

            const totalSupply = await contractNft.methods.totalSupply().call();
            const maxSupply = await contractNft.methods.getMaxSupply().call();
            const availableSupply = maxSupply - totalSupply;

            const name = await contractNft.methods.name().call();

            console.log(accounts[0]);
            console.log(controller);

            if (accounts[0] === controller) {
              products.data.push({
                id: index,
                owner: "long",
                owner_img: "owner.png",
                creator_img: "creator.png",
                eth_price: parseInt(price.amount, 10),
                usd_price: availableSupply,
                creator: controller
                  .substring(0, 5)
                  .concat("....")
                  .concat(controller.substring(38, 43)),
                whishlisted: true,
                thumbnil: "marketplace-product-1.jpg",
                title: name,
                isActive: true,
                contractOwner: address,
              });

            }
          })
        );

        setMarketProducts(products.data);
      };



      fetchData();
    }

    console.log("end if");
  });

  isFinished = true;


  return (
    <div className={`market-place-section w-full ${className || ""}`}>
      <TrendingSection></TrendingSection>
      <div className="market-place-wrapper w-full">
        <div className="filter-navigate-area lg:flex justify-between mb-8 items-center">
          <div className="tab-item lg:mb-0 mb-5">
            <div className="md:flex md:space-x-8 space-x-2"></div>
          </div>
        </div>
        <div className="filter-navigate-content w-full min-h-screen">
          <div className="grid lg:grid-cols-3 sm:grid-cols-2 gap-[30px]">
            <DataIteration
              datas={marketProducts}
              startLength="0"
              endLength={marketProducts.length}
            >
              {({ datas }) => (
                <ProductCardStyleTwo key={datas.id} datas={datas} />
              )}
            </DataIteration>
          </div>
        </div>
      </div>
    </div>
  );
}
