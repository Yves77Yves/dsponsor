const { ethers } = require("hardhat");
const {
  // time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
// const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs')
const { expect } = require("chai");
// const { keccak256, toUtf8Bytes, toUtf8String } = require('ethers/lib/utils')
const { constants } = require("@openzeppelin/test-helpers");

describe("DSponsor", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshopt in every test.
  async function initFixture() {
    const [deployer, sponsee, sponsor1, sponsor2, user1, user2] =
      await ethers.getSigners();

    const ERC20MockDeployer = await ethers.getContractFactory("ERC20Mock");
    const ERC20Mock = await ERC20MockDeployer.deploy();

    const properties = ["SQUARE_IMG", "URL"];
    const propValues = ["https://image.png", "https://web.link"];
    const period = [1670346704, 1670346704 + 15552000]; // duration 6 monthes

    const ERC721MockDeployer = await ethers.getContractFactory("ERC721Mock");
    const ERC721Mock = await ERC721MockDeployer.deploy();

    const DSponsorDeployer = await ethers.getContractFactory("DSponsor");
    const DSponsorContract = await DSponsorDeployer.deploy(
      ERC721Mock.address,
      "rulesURI",
      sponsee.address
    );

    let tx;

    tx = await ERC721Mock.connect(sponsor1).mint(1);
    await tx.wait();
    tx = await ERC721Mock.connect(sponsor2).mint(2);
    await tx.wait();
    tx = await ERC721Mock.connect(sponsor1).mint(10);
    await tx.wait();

    for (let p of properties) {
      tx = await DSponsorContract.connect(sponsee).setProperty(p, true);
      tx.wait();
    }

    tx = await DSponsorContract.connect(sponsee).setValidityPeriod(
      period[0],
      period[1]
    );
    tx.wait();

    tx = await DSponsorContract.connect(sponsor1).setSponsoData(
      1,
      properties[0],
      propValues[0]
    );
    tx.wait();
    tx = await DSponsorContract.connect(sponsor1).setSponsoData(
      1,
      properties[1],
      propValues[1]
    );
    tx.wait();

    tx = await DSponsorContract.connect(sponsee).setSponsoDataValidation(
      1,
      properties[0],
      true,
      ""
    );
    tx.wait();

    const SET_PROPERTIES_ROLE = await DSponsorContract.SET_PROPERTIES_ROLE();
    const SET_PERIOD_ROLE = await DSponsorContract.SET_PERIOD_ROLE();
    const VALIDATE_ROLE = await DSponsorContract.VALIDATE_ROLE();

    return {
      deployer,
      sponsee,
      sponsor1,
      sponsor2,
      user1,
      user2,

      period,
      properties,
      propValues,

      ERC20Mock,
      ERC721Mock,
      DSponsorContract,
      DSponsorDeployer,

      SET_PERIOD_ROLE,
      SET_PROPERTIES_ROLE,
      VALIDATE_ROLE,
    };
  }

  describe("DSponsor Deployment", async function () {
    it("Sets with provided nft contract", async function () {
      const { ERC721Mock, DSponsorContract } = await loadFixture(initFixture);

      expect(await DSponsorContract.getAccessContract()).to.be.equal(
        ERC721Mock.address
      );
    });

    it("Reverts if sponsee is zero address", async function () {
      const { ERC721Mock, DSponsorDeployer, DSponsorContract } =
        await loadFixture(initFixture);

      await expect(
        DSponsorDeployer.deploy(ERC721Mock.address, "", constants.ZERO_ADDRESS)
      ).to.be.revertedWithCustomError(
        DSponsorContract,
        "SponseeCannotBeZeroAddress"
      );
    });

    it("Reverts if nft address is not erc721", async function () {
      const {
        sponsee,

        ERC20Mock,
        DSponsorDeployer,
        DSponsorContract,
      } = await loadFixture(initFixture);

      await expect(
        DSponsorDeployer.deploy(ERC20Mock.address, "", sponsee.address)
      ).to.be.revertedWithCustomError(DSponsorContract, "isNotERC721Contract");
    });
  });

  describe("DSponsor Sponsor operations", async function () {
    it("Allows sponsoring data submission according token owner", async function () {
      const {
        sponsee,
        user1,
        sponsor1,
        sponsor2,
        properties,
        propValues,
        DSponsorContract,
      } = await loadFixture(initFixture);

      const newPropValue = "https://newimage.png";
      const unallowedPropValue = "https://unallowed.png";

      await expect(
        DSponsorContract.connect(sponsor1).setSponsoData(
          1,
          properties[0],
          newPropValue
        )
      )
        .to.emit(DSponsorContract, "NewSponsoData")
        .withArgs(1, properties[0], newPropValue);

      await expect(
        DSponsorContract.connect(sponsor1).setSponsoData(
          10,
          properties[0],
          newPropValue
        )
      )
        .to.emit(DSponsorContract, "NewSponsoData")
        .withArgs(10, properties[0], newPropValue);

      await expect(
        DSponsorContract.connect(sponsor1).setSponsoData(
          3, // does not exist
          properties[0],
          newPropValue
        )
      ).to.be.reverted;

      await expect(
        DSponsorContract.connect(user1).setSponsoData(
          1,
          properties[0],
          unallowedPropValue
        )
      ).to.be.revertedWithCustomError(
        DSponsorContract,
        "UnallowedSponsorOperation"
      );

      await expect(
        DSponsorContract.connect(sponsee).setSponsoData(
          1,
          properties[0],
          unallowedPropValue
        )
      ).to.be.revertedWithCustomError(
        DSponsorContract,
        "UnallowedSponsorOperation"
      );

      await expect(
        DSponsorContract.connect(sponsor2).setSponsoData(
          1,
          properties[0],
          unallowedPropValue
        )
      ).to.be.revertedWithCustomError(
        DSponsorContract,
        "UnallowedSponsorOperation"
      );

      await expect(
        DSponsorContract.connect(sponsor2).setSponsoData(
          2,
          properties[0],
          newPropValue
        )
      )
        .to.emit(DSponsorContract, "NewSponsoData")
        .withArgs(2, properties[0], newPropValue);

      expect(
        await DSponsorContract.getSponsoData(1, properties[0])
      ).to.be.deep.equal([propValues[0], newPropValue, ""]);

      expect(
        await DSponsorContract.getSponsoData(2, properties[0])
      ).to.be.deep.equal(["", newPropValue, ""]);
    });

    it("Protects against unallowed property for data submission", async function () {
      const { sponsee, sponsor1, DSponsorContract } = await loadFixture(
        initFixture
      );

      const newProp = "NEW_PROP";
      const newPropValue = "value";

      await expect(
        DSponsorContract.connect(sponsor1).setSponsoData(
          1,
          newProp,
          newPropValue
        )
      ).to.be.revertedWithCustomError(DSponsorContract, "UnallowedProperty");

      await expect(DSponsorContract.connect(sponsee).setProperty(newProp, true))
        .to.emit(DSponsorContract, "PropertyUpdate")
        .withArgs(newProp, true);

      await expect(
        DSponsorContract.connect(sponsor1).setSponsoData(
          1,
          newProp,
          newPropValue
        )
      )
        .to.emit(DSponsorContract, "NewSponsoData")
        .withArgs(1, newProp, newPropValue);
    });
  });

  describe("DSponsor Sponsee operations", async function () {
    it("Allows and disallows properties settings", async function () {
      const { sponsee, properties, DSponsorContract } = await loadFixture(
        initFixture
      );

      const newProp = "TEST";

      expect(
        await DSponsorContract.isAllowedProperty(properties[0])
      ).to.be.equal(true);
      expect(
        await DSponsorContract.isAllowedProperty(properties[1])
      ).to.be.equal(true);
      expect(await DSponsorContract.isAllowedProperty(newProp)).to.be.equal(
        false
      );

      await expect(
        DSponsorContract.connect(sponsee).setProperty(properties[0], false)
      )
        .to.emit(DSponsorContract, "PropertyUpdate")
        .withArgs(properties[0], false);

      await expect(DSponsorContract.connect(sponsee).setProperty(newProp, true))
        .to.emit(DSponsorContract, "PropertyUpdate")
        .withArgs(newProp, true);

      expect(
        await DSponsorContract.isAllowedProperty(properties[0])
      ).to.be.equal(false);
      expect(
        await DSponsorContract.isAllowedProperty(properties[1])
      ).to.be.equal(true);
      expect(await DSponsorContract.isAllowedProperty("TEST")).to.be.equal(
        true
      );
    });

    it("gets and sets period", async function () {
      const { period, DSponsorContract } = await loadFixture(
        initFixture
      );

      expect(
        await DSponsorContract.getStartPeriod()
      ).to.be.equal(period[0]);
      expect(
        await DSponsorContract.getEndPeriod()
      ).to.be.equal(period[1]);


    });

    it("Protects property setting by role", async function () {
      const {
        sponsee,
        user1,
        sponsor1,
        properties,
        DSponsorContract,
        SET_PROPERTIES_ROLE,
      } = await loadFixture(initFixture);

      await expect(
        DSponsorContract.connect(user1).setProperty(properties[0], false)
      ).to.be.reverted;

      await expect(
        DSponsorContract.connect(sponsor1).setProperty(properties[0], false)
      ).to.be.reverted;

      let tx;
      tx = await DSponsorContract.connect(sponsee).grantRole(
        SET_PROPERTIES_ROLE,
        user1.address
      );
      tx.wait();

      await expect(
        DSponsorContract.connect(user1).setProperty(properties[0], false)
      )
        .to.emit(DSponsorContract, "PropertyUpdate")
        .withArgs(properties[0], false);

      expect(
        await DSponsorContract.isAllowedProperty(properties[0])
      ).to.be.equal(false);

      await expect(
        DSponsorContract.connect(user1).setProperty(properties[0], true)
      )
        .to.emit(DSponsorContract, "PropertyUpdate")
        .withArgs(properties[0], true);

      expect(
        await DSponsorContract.isAllowedProperty(properties[0])
      ).to.be.equal(true);
    });

    
    it("Protects period setting by role", async function () {
      const {
        sponsee,
        user1,
        period,
        DSponsorContract,
      } = await loadFixture(initFixture);

      await expect(
        DSponsorContract.connect(user1).setValidityPeriod(period[0], period[1])
      ).to.be.reverted;


      await expect(
        DSponsorContract.connect(sponsee).setValidityPeriod(period[0] + 1000, period[1] + 1000)
      )        .to.emit(DSponsorContract, "ValidityPeriodUpdate")
      .withArgs(period[0] + 1000, period[1] + 1000);


    });

    it("Updates correctly according data validation", async function () {
      const { sponsee, sponsor1, properties, DSponsorContract } =
        await loadFixture(initFixture);

      const propValue1 = "https://torejectimage.png";
      const propValue2 = "https://toacceptimage.png";
      const reason = "this is a reason to reject";

      await expect(
        DSponsorContract.connect(sponsee).setSponsoDataValidation(
          2,
          properties[1],
          true,
          reason
        )
      ).to.be.revertedWithCustomError(DSponsorContract, "NoDataSubmitted");

      await expect(
        DSponsorContract.connect(sponsor1).setSponsoData(
          1,
          properties[0],
          propValue1
        )
      )
        .to.emit(DSponsorContract, "NewSponsoData")
        .withArgs(1, properties[0], propValue1);

      const { lastDataValidated } = await DSponsorContract.getSponsoData(
        1,
        properties[0]
      );

      await expect(
        DSponsorContract.connect(sponsee).setSponsoDataValidation(
          1,
          properties[0],
          false,
          reason
        )
      )
        .to.emit(DSponsorContract, "NewSponsoDataValidation")
        .withArgs(1, properties[0], false, propValue1, reason);

      expect(
        await DSponsorContract.getSponsoData(1, properties[0])
      ).to.be.deep.equal([lastDataValidated, propValue1, reason]);

      await expect(
        DSponsorContract.connect(sponsor1).setSponsoData(
          1,
          properties[0],
          propValue2
        )
      )
        .to.emit(DSponsorContract, "NewSponsoData")
        .withArgs(1, properties[0], propValue2);

      expect(
        await DSponsorContract.getSponsoData(1, properties[0])
      ).to.be.deep.equal([lastDataValidated, propValue2, ""]);

      await expect(
        DSponsorContract.connect(sponsee).setSponsoDataValidation(
          1,
          properties[0],
          true,
          reason
        )
      )
        .to.emit(DSponsorContract, "NewSponsoDataValidation")
        .withArgs(1, properties[0], true, propValue2, reason);

      expect(
        await DSponsorContract.getSponsoData(1, properties[0])
      ).to.be.deep.equal([propValue2, "", ""]);

      await expect(
        DSponsorContract.connect(sponsee).setSponsoDataValidation(
          1,
          properties[0],
          true,
          reason
        )
      ).to.be.revertedWithCustomError(DSponsorContract, "NoDataSubmitted");
    });

    it("Protects data validation by role", async function () {
      const {
        sponsee,
        user2,
        sponsor1,
        properties,
        DSponsorContract,
        VALIDATE_ROLE,
      } = await loadFixture(initFixture);

      const reason = "this is a reject reason";

      const newValue = "newValue";

      await expect(
        DSponsorContract.connect(sponsor1).setSponsoData(
          1,
          properties[0],
          newValue
        )
      )
        .to.emit(DSponsorContract, "NewSponsoData")
        .withArgs(1, properties[0], newValue);

      await expect(
        DSponsorContract.connect(sponsor1).setSponsoDataValidation(
          1,
          properties[0],
          false,
          reason
        )
      ).to.be.reverted;

      await expect(
        DSponsorContract.connect(user2).setSponsoDataValidation(
          1,
          properties[0],
          false,
          reason
        )
      ).to.be.reverted;
      // .to.be.revertedWith(`AccessControl: account ${user2.address} is missing role ${VALIDATE_ROLE}`)

      let tx;
      tx = await DSponsorContract.connect(sponsee).grantRole(
        VALIDATE_ROLE,
        user2.address
      );
      await tx.wait();

      await expect(
        DSponsorContract.connect(user2).setSponsoDataValidation(
          1,
          properties[0],
          true,
          reason
        )
      )
        .to.emit(DSponsorContract, "NewSponsoDataValidation")
        .withArgs(1, properties[0], true, newValue, reason);

      expect(
        await DSponsorContract.getSponsoData(1, properties[0])
      ).to.be.deep.equal([newValue, "", ""]);
    });

    it("Protects against invalid data validation", async function () {
      const { sponsee, properties, DSponsorContract } = await loadFixture(
        initFixture
      );

      const reason = "this is a reject reason";

      await expect(
        DSponsorContract.connect(sponsee).setSponsoDataValidation(
          3, // does not exist
          properties[1],
          false,
          reason
        )
      ).to.be.revertedWithCustomError(DSponsorContract, "NoDataSubmitted");

      await expect(
        DSponsorContract.connect(sponsee).setSponsoDataValidation(
          1,
          "invalidprop",
          false,
          reason
        )
      ).to.be.revertedWithCustomError(DSponsorContract, "UnallowedProperty");
    });
  });
});
