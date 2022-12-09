const { ethers } = require('hardhat')
const {
  // time,
  loadFixture
} = require('@nomicfoundation/hardhat-network-helpers')
// const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs')
const { expect } = require('chai')
// const { keccak256, toUtf8Bytes, toUtf8String } = require('ethers/lib/utils')
// const { constants } = require('@openzeppelin/test-helpers')
const { BigNumber } = require('ethers')
const { ZERO_ADDRESS } = require('@openzeppelin/test-helpers/src/constants')
const { parseEther } = require('ethers/lib/utils')

async function DSponsorNFTTests({
  PaymentSplitterMockDeployer,
  DSponsorNFTDeployer,

  creationTx,

  sponsee,
  sponsor1,
  sponsor2,

  ERC20Mock,
  ERC20Amount,

  protocolFee,
  protocolAddress
}) {
  const { args } = creationTx.events.find((e) => e.event === 'NewDSponsorNFT')

  const DSponsorNFTAddress = args[0]
  const treasuryAddress = args[2]

  const DSponsorNFTContract = await DSponsorNFTDeployer.attach(
    DSponsorNFTAddress
  )

  expect(await DSponsorNFTContract.getController()).to.be.equal(sponsee.address)

  await expect(
    DSponsorNFTContract.setPrice(ERC20Mock.address, true, ERC20Amount)
  ).to.be.revertedWithCustomError(
    DSponsorNFTContract,
    'ForbiddenControllerOperation'
  )

  /**
   * ERC20 transactions
   */

  await expect(
    DSponsorNFTContract.connect(sponsee).setPrice(
      ERC20Mock.address,
      true,
      ERC20Amount
    )
  )
    .to.emit(DSponsorNFTContract, 'MintPriceChange')
    .withArgs(ERC20Mock.address, true, ERC20Amount)

  let tx = await ERC20Mock.connect(sponsor1).approve(
    DSponsorNFTContract.address,
    ERC20Amount * 20
  )
  await tx.wait()
  tx = await ERC20Mock.connect(sponsor2).approve(
    DSponsorNFTContract.address,
    ERC20Amount * 20
  )
  await tx.wait()

  await expect(
    DSponsorNFTContract.connect(sponsor1).payAndMint(
      ERC20Mock.address,
      sponsor1.address,
      ''
    )
  )
    .to.emit(DSponsorNFTContract, 'Mint')
    .withArgs(
      ERC20Mock.address,
      ERC20Amount,
      sponsor1.address,
      '',
      sponsor1.address,
      0
    )

  await expect(
    DSponsorNFTContract.connect(sponsor1).payAndMint(
      ERC20Mock.address,
      sponsor1.address,
      ''
    )
  ).to.changeTokenBalances(DSponsorNFTContract, [sponsor1.address], [1])

  await expect(
    DSponsorNFTContract.connect(sponsor2).payAndMint(
      ERC20Mock.address,
      sponsor2.address,
      ''
    )
  ).to.changeTokenBalances(ERC20Mock, [sponsor2.address], [-ERC20Amount])

  const TreasuryContract = await PaymentSplitterMockDeployer.attach(
    treasuryAddress
  )

  expect(
    await TreasuryContract['releasable(address,address)'](
      ERC20Mock.address,
      sponsor1.address
    )
  ).to.be.equal(0)

  const expectedERC20AmountForSponsee =
    3 * ERC20Amount * (1 - protocolFee / 100)
  const expectedERC20AmountForSponseeBigNumber = BigNumber.from(
    expectedERC20AmountForSponsee
  )
  const expectedERC20AmountForProtocol = 3 * ERC20Amount * (protocolFee / 100)
  const expectedERC20AmountForProtocolBigNumber = BigNumber.from(
    expectedERC20AmountForProtocol
  )

  await expect(
    TreasuryContract.connect(sponsee)['release(address,address)'](
      ERC20Mock.address,
      sponsee.address
    )
  ).to.changeTokenBalances(
    ERC20Mock,
    [treasuryAddress, sponsee],
    [
      -expectedERC20AmountForSponseeBigNumber,
      expectedERC20AmountForSponseeBigNumber
    ]
  )

  await expect(
    TreasuryContract.connect(sponsee)['release(address,address)'](
      ERC20Mock.address,
      sponsee.address
    )
  ).to.be.revertedWith('PaymentSplitter: account is not due payment')

  expect(
    await TreasuryContract['releasable(address,address)'](
      ERC20Mock.address,
      protocolAddress
    )
  ).to.be.equal(expectedERC20AmountForProtocol)

  await expect(
    TreasuryContract['release(address,address)'](
      ERC20Mock.address,
      protocolAddress
    )
  ).to.changeTokenBalances(
    ERC20Mock,
    [treasuryAddress, protocolAddress],
    [
      -expectedERC20AmountForProtocolBigNumber,
      expectedERC20AmountForProtocolBigNumber
    ]
  )

  /**
   * Native transactions
   */

  const valueFloat = 0.03
  const expectedValueFloatSponsee = valueFloat * (1 - protocolFee / 100)
  const expectedValueFloatProtocol = valueFloat * (protocolFee / 100)

  const value = parseEther(`${valueFloat}`)

  const expectedEthAmountForProtocol = parseEther(
    `${expectedValueFloatProtocol}`
  )

  await expect(
    DSponsorNFTContract.connect(sponsee).setPrice(ZERO_ADDRESS, true, value)
  )
    .to.emit(DSponsorNFTContract, 'MintPriceChange')
    .withArgs(ZERO_ADDRESS, true, value)

  await expect(
    DSponsorNFTContract.connect(sponsor2).payAndMint(
      ZERO_ADDRESS,
      sponsor2.address,
      '',
      { value }
    )
  ).to.changeEtherBalances([sponsor2.address], [parseEther(`-${valueFloat}`)])

  await expect(
    TreasuryContract.connect(sponsee)['release(address)'](sponsee.address)
  ).to.changeEtherBalances(
    [treasuryAddress, sponsee],
    [
      parseEther(`-${expectedValueFloatSponsee}`),
      parseEther(`${expectedValueFloatSponsee}`)
    ]
  )

  await expect(
    TreasuryContract.connect(sponsee)['release(address)'](sponsee.address)
  ).to.be.revertedWith('PaymentSplitter: account is not due payment')

  expect(
    await TreasuryContract['releasable(address)'](protocolAddress)
  ).to.be.equal(expectedEthAmountForProtocol)

  await expect(
    TreasuryContract['release(address)'](protocolAddress)
  ).to.changeEtherBalances(
    [treasuryAddress, protocolAddress],
    [parseEther(`-${expectedValueFloatProtocol}`), expectedEthAmountForProtocol]
  )

  return DSponsorNFTContract
}

async function DSponsorTests({
  creationTx,

  DSponsorDeployer,

  ERC721Contract,

  sponsee,
  sponsor1, // own token 1
  sponsor2 // own token 2
}) {
  const propKey = 'propKey'
  const propValue = 'value'

  const DSponsorContractFromAddress = creationTx.events.find(
    (e) => e.event === 'NewDSponsor'
  ).args[0]

  const DSponsorContract = await DSponsorDeployer.attach(
    DSponsorContractFromAddress
  )

  expect(await DSponsorContract.getAccessContract()).to.be.equal(
    ERC721Contract.address
  )

  await expect(DSponsorContract.setProperty(propKey, true)).to.be.reverted

  await expect(DSponsorContract.connect(sponsee).setProperty(propKey, true))
    .to.emit(DSponsorContract, 'PropertyUpdate')
    .withArgs(propKey, true)

  await expect(
    DSponsorContract.connect(sponsee).setSponsoData(1, propKey, propValue)
  ).to.be.revertedWithCustomError(DSponsorContract, 'UnallowedSponsorOperation')

  await expect(
    DSponsorContract.connect(sponsor2).setSponsoData(1, propKey, propValue)
  ).to.be.revertedWithCustomError(DSponsorContract, 'UnallowedSponsorOperation')

  await expect(
    DSponsorContract.connect(sponsor1).setSponsoData(1, propKey, propValue)
  )
    .to.emit(DSponsorContract, 'NewSponsoData')
    .withArgs(1, propKey, propValue)
}

describe('DSponsor - Main', function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshopt in every test.
  async function initFixture() {
    const signers = await ethers.getSigners()

    const [deployer, sponsee, sponsor1, sponsor2, user1] = signers

    const ERC20MockDeployer = await ethers.getContractFactory('ERC20Mock')
    const ERC20Mock = await ERC20MockDeployer.deploy()

    const ERC721MockDeployer = await ethers.getContractFactory('ERC721Mock')
    const ERC721Mock = await ERC721MockDeployer.deploy()

    const PaymentSplitterMockDeployer = await ethers.getContractFactory(
      'PaymentSplitterMock'
    )
    // const PaymentSplitterMock = await PaymentSplitterMockDeployer.deploy([ deployer.address ], [100])

    const DSponsorMainDeployer = await ethers.getContractFactory('DSponsorMain')
    const DSponsorMainContract = await DSponsorMainDeployer.deploy()

    const DSponsorTreasuryDeployer = await ethers.getContractFactory(
      'DSponsorTreasuryFactory'
    )
    const DSponsorTreasury = await DSponsorTreasuryDeployer.deploy()

    const protocolAddress = await DSponsorTreasury.PROTOCOL_ADDRESS_FEE()
    const protocolFee = await DSponsorTreasury.PROTOCOL_PERCENT_FEE()

    const DSponsorDeployer = await ethers.getContractFactory('DSponsor')
    const DSponsorNFTDeployer = await ethers.getContractFactory('DSponsorNFT')

    const ERC20Amount = BigNumber.from('100000')

    let tx
    for (let { address } of signers) {
      tx = await ERC20Mock.mint(address, 10 * ERC20Amount)
      await tx.wait()
    }

    return {
      deployer,
      sponsee,
      sponsor1,
      sponsor2,
      user1,

      ERC20Amount,

      ERC20Mock,
      ERC721Mock,

      PaymentSplitterMockDeployer,
      DSponsorNFTDeployer,

      DSponsorMainContract,
      DSponsorDeployer,

      protocolAddress,
      protocolFee
    }
  }

  it('Creates a valid DSponsoNFT contract', async function () {
    const {
      PaymentSplitterMockDeployer,
      DSponsorNFTDeployer,

      DSponsorMainContract,

      ERC20Mock,
      ERC20Amount,

      sponsee,
      sponsor1,
      sponsor2,

      protocolAddress,
      protocolFee
    } = await loadFixture(initFixture)

    const name = 'name'
    const symbol = 'symbol'
    const maxSupply = 5

    let creationTx = await DSponsorMainContract.createDSponsorNFT(
      name,
      symbol,
      maxSupply,
      sponsee.address
    )

    creationTx = await creationTx.wait()

    await DSponsorNFTTests({
      PaymentSplitterMockDeployer,
      creationTx,
      DSponsorNFTDeployer,
      sponsee,
      sponsor1,
      sponsor2,
      ERC20Mock,
      ERC20Amount,
      protocolFee,
      protocolAddress
    })
  })

  it('Creates a valid DSponso contract from an ERC721 contract address', async function () {
    const {
      DSponsorDeployer,

      ERC721Mock,

      DSponsorMainContract,

      sponsee,
      sponsor1,
      sponsor2
    } = await loadFixture(initFixture)

    let creationTx = await DSponsorMainContract.createFromContract(
      ERC721Mock.address,
      'rulesURI',
      sponsee.address
    )

    creationTx = await creationTx.wait()

    let tx = await ERC721Mock.connect(sponsor1).mint(1)
    await tx.wait()
    tx = await ERC721Mock.connect(sponsor2).mint(2)
    await tx.wait()

    await DSponsorTests({
      creationTx,
      DSponsorDeployer,
      ERC721Contract: ERC721Mock,
      sponsor1,
      sponsor2,
      sponsee
    })
  })

  it('Creates valid DSponsoNFT and DSponso contracts', async function () {
    const {
      PaymentSplitterMockDeployer,
      DSponsorNFTDeployer,

      DSponsorMainContract,
      DSponsorDeployer,

      sponsee,
      sponsor1,
      sponsor2,

      ERC20Mock,
      ERC20Amount,

      protocolAddress,
      protocolFee
    } = await loadFixture(initFixture)

    const name = 'name'
    const symbol = 'SYM'
    const rulesURI = 'rules'
    const maxSupply = 5

    let creationTx = await DSponsorMainContract.createWithNewNFT(
      name,
      symbol,
      maxSupply,
      rulesURI,
      sponsee.address
    )
    creationTx = await creationTx.wait()

    const DSponsorNFT = await DSponsorNFTTests({
      PaymentSplitterMockDeployer,
      creationTx,
      DSponsorNFTDeployer,
      sponsee,
      sponsor1,
      sponsor2,
      ERC20Mock,
      ERC20Amount,
      protocolFee,
      protocolAddress
    })

    await DSponsorTests({
      creationTx,
      DSponsorDeployer,
      ERC721Contract: DSponsorNFT,
      sponsor1,
      sponsor2,
      sponsee
    })
  })
})
