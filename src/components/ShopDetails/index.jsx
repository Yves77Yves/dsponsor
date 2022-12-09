import React from "react";
import Layout from "../Partials/Layout";
import ShopProductWidget from "./ShopProductWidget";

export default function ShopDetails() {

  return (
    <>
      <Layout>
        <div className="shop-details-wrapper w-full">
          <div className="main-wrapper w-full">
            <ShopProductWidget className="mb-8" />
          </div>
        </div>
      </Layout>
    </>
  );
}
