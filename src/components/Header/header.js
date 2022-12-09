import React from "react";
import products from "../../data/marketplace_data.json";
import CreateNft from "../Home/CreateNft";
import MainSection from "../MarketPlace/MainSection";
import Layout from "../Partials/Layout";

export default function MarketPlace() {
  const marketProduct = products.data;
  return (
    <>
      <Layout>
        <h1> this is the header</h1>
        <CreateNft />
        <MainSection marketPlaceProduct={marketProduct} className="mb-10" />
      </Layout>
    </>
  );
}
