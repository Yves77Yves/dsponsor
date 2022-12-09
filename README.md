# dsponsor

# d>sponsor contracts

Build a community-owned ad inventory with d>sponsor.
As a media or a creator, set up your sponsorships tight to NFTs.

## Contracts features

### DSponsor.sol

Grants each NFT token owner a right to advertise. Compatible with any ERC721 contract.

- Sponsee can specify any set of sponsoring properties, according its off-chain implementation. Could be an audio url, a website link, a logo, ...
- Sponsors can submit data for provided sponsoring properties only
- Sponsee validate (or not) submitted data
- Sponsor can transfer a token to another address, new owner will be the only one able to set sponsoring data linked to the `tokenId`

### DSponsorNFT.sol

Although any ERC721 compliant contract is compatible with `DSponsor` contract, a sponsee may create upwind a `DSponsorNFT` contract, an ERC721 contract with ERC20 pricing and ERC2981 royalties implementations.

- Parameter any native value (ETH amount on Ethereum, MATIC amount on Polygon) as minting price
- Parameter any ERC20 token amount as minting price
- Enable and disable a ERC20 contract or native transactions at any time
- Maximum supply limit built-in
- Opensea optimizations on Polygon : gasless transactions, ...
- Editable royalty fraction (secondary sales fee)

Notes :

- Anyone can mint if payment requirements are met
- 4% protocol fee on revenues
- Need to manually withdraw funds from minting and secondary sales

### DSponsor_Main.sol

Use `DSponsorMain` contract to create `DSponsor` and `DSponsorNFT`

- `createDSponsorNFT` to create a `DSponsorNFT` contract
- `createFromContract` to create a `DSponsor` contract from existing ERC721 compliant contract
- `createWithNewNFT` to create a `DSponsor` and a `DSponsorNFT` linked together

## Use in testnet

`DSponsorMain` contract is deployed to: [`0x8d1137542C2F1a07b59971814E0Db5fF5008099e`](https://mumbai.polygonscan.com/address/0x8d1137542c2f1a07b59971814e0db5ff5008099e)

### Examples - Deployed contracts via [`DSponsorMain`](https://mumbai.polygonscan.com/address/0x8d1137542c2f1a07b59971814e0db5ff5008099e) methods on Polygon Mumbai

| Contract    | Address                                                                                                                           | Infos                                                                                                           |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| DSponsor    | [`0x6105010008a341fa07dd9047285937f518afcf37`](https://mumbai.polygonscan.com/address/0x6105010008a341fa07dd9047285937f518afcf37) |                                                                                                                 |
| DSponsorNFT | [`0xe29f4c3b2d321539ab4955cd88a34ce3a52c49b6`](https://mumbai.polygonscan.com/address/0xe29f4c3b2d321539ab4955cd88a34ce3a52c49b6) | Mint price set to 1 [DERC20](https://mumbai.polygonscan.com/address/0xfe4F5145f6e09952a5ba9e956ED0C25e3Fa4c7F1) |
| Treasury    | [`0x622a9532248aefaf341bf59d568df1806b9af483`](https://mumbai.polygonscan.com/address/0x622a9532248aefaf341bf59d568df1806b9af483) |

## Development

### Set up environment

```
# 1- Environment variables are used for tests & deployment
cp .env_example .env

# 2- Install dependencies
npm i
```

### Check contracts sizes

The maximum size of a contract is restricted to 24 KB by EIP 170. Run this command to check contracts sizes :

```shell
npm run sizes
```

### Run tests

```shell
npm run test # with gas reports according hardhat.config.js
```

Check testing coverage with :

```shell
npm run coverage
```

### Security check with Slither

Slither runs a suite of vulnerability detectors, prints visual information about contract details.

1. Install Slither

```shell
pip3 install slither-analyzer
```

See alternatives to install Slither on the [GitHub repo](https://github.com/crytic/slither)

2. Run Slither

```shell
npm run analyze
```

### Deploy

```shell
npm run deploy NETWORK
```

Example

```shell
npm run deploy localhost

npm run deploy mumbai

npm run deploy polygon
```

### Verify

To verify main contract deployed, use :

```shell
npx hardhat verify MAIN_CONTRACT_ADDR --network NETWORK
```

To verify contracts deployed with main contract, use :

```shell
npx hardhat verify --constructor-args verif-args-examples/DSponsor.js DSPONSOR_CONTRACT_ADDR --network mumbai

npx hardhat verify --constructor-args verif-args-examples/DSponsorPolygonNFT.js NFT_CONTRACT_ADDR --network mumbai

npx hardhat verify --contract @openzeppelin/contracts/finance/PaymentSplitter.sol:PaymentSplitter --constructor-args verif-args-examples/Treasury.js TREASURY_CONTRACT_ADDR --network mumbai
```

# dapp

la Dapp est inspirée d'une marketplace importée qui a été aménagée pour les besoins de la demo.

## lancement de l'application

- prerequisite : smartcontracts installés et déployés
- npm start
- connecter sa wallet au réseau Mumbai

## site

- un site de test est visible à cette adresse
