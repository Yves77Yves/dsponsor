import React from "react";
import products from "../../data/marketplace_data.json";
import MainSection from "../MarketPlace";
import Layout from "../Partials/Layout";
import Hero from "./Hero";


export default function Home() {
  const marketProduct = products.data;
  return (
    <Layout>
      <div className="home-page-wrapper">
        <Hero className="mb-10" />
        <MainSection marketPlaceProduct={marketProduct} className="mb-10" />
      </div>
    </Layout>
  );
}
