import React, { useEffect, useState } from "react";
import products from "../../data/marketplace_data.json";
import ProductCardStyleTwo from "../Cards/ProductCardStyleTwo";
import DataIteration from "../Helpers/DataIteration";

import useEth from "../../contexts/EthContext/useEth";

export default function MainSection({ className }) {
  const {
    state: { contract, web3, dSponsorNFTContract },
  } = useEth();

  const [tab] = useState("explore");

  const [marketProducts, setMarketProducts] = useState([]);

  useEffect(() => {
    if (marketProducts.length === 0) {
      const fetchData = async () => {
        products.data = [];
        console.log(contract);
        console.log(" before eventNewDSponsor");
        const eventNewDSponsor = await contract.getPastEvents("NewDSponsor", {
          fromBlock: 29573830, // 29310000,
          toBlock:  29590100, // "latest", 29590072, 
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
        await Promise.all(nftContractId.map(async (address, index) => {
          const contractNft = new web3.eth.Contract(
              dSponsorNFTContract.abi,
              address);
          const price = await contractNft.methods
              .getMintPriceForCurrency("0xfe4F5145f6e09952a5ba9e956ED0C25e3Fa4c7F1")
              .call();
          const controller = await contractNft.methods.getController().call();

          const totalSupply = await contractNft.methods.totalSupply().call();
          const maxSupply = await contractNft.methods.getMaxSupply().call();
          const availableSupply =  maxSupply - totalSupply;

          const name = await contractNft.methods.name().call();


          products.data.push({
            id: index,
            owner: "long",
            owner_img: "owner.png",
            creator_img: `creator-${index + 1}.png`,
            eth_price: parseInt(price.amount, 10),
            usd_price: availableSupply,
            creator: controller.substring(0, 5).concat("...").concat(controller.substring(38,43)),
            whishlisted: true,
            thumbnil: `marketplace-product-${index + 1}.jpg`,
            title: name,
            isActive: true,
            contractOwner: address
          });
        }));


        setMarketProducts(products.data);
      };

      fetchData();
    }
    console.log("end if");
  });

  useEffect(() => {
    if (tab === "artist") {
      setMarketProducts(marketProducts.slice(0, 3));
    } else if (tab === "market") {
      setMarketProducts(marketProducts.slice(0, 6));
    } else if (tab === "shop") {
      setMarketProducts(marketProducts.slice(6, 9));
    } else if (tab === "assets") {
      setMarketProducts(marketProducts.slice(3, 6));
    } else {
      setMarketProducts(marketProducts);
    }
  }, [tab, marketProducts]);

  return (
    <div className={`market-place-section w-full ${className || ""}`}>

      <div className="market-place-wrapper w-full">
        <div className="filter-navigate-area lg:flex justify-between mb-8 items-center">
          <div className="tab-item lg:mb-0 mb-5">
            <div className="md:flex md:space-x-8 space-x-2">
              <h1 className="text-center text-26 font-bold text-dark-gray">
                Avec d>sponsor, promouvoir son activité se fait en seulement
                quelques clics. Achetez un espace de visibililé, informez votre
                publicité et c’est terminé !
              </h1>
            </div>
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
