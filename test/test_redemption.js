const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("Redemption contract", function () {
  let owner, user;
  let redemptionContract;
  let fromToken, toToken1, toToken2;
  const fromTokenAmount = ethers.utils.parseEther("10");
  const toToken1Amount = ethers.utils.parseEther("50");
  const toToken2Amount = ethers.utils.parseEther("40");
  const exchangeRate1 = ethers.utils.parseEther("2");
  const exchangeRate2 = ethers.utils.parseEther("3");

  describe("Constructor", function () {
    beforeEach(async function () {
      // Deploy contracts and get signers
      [owner, user] = await ethers.getSigners();

      const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
      fromToken = await ERC20Mock.deploy(owner.address, fromTokenAmount);
      toToken1 = await ERC20Mock.deploy(owner.address, toToken1Amount);
      toToken2 = await ERC20Mock.deploy(owner.address, toToken2Amount);

      const Redemption = await ethers.getContractFactory("Redemption");
      redemptionContract = await Redemption.deploy(
        fromToken.address,
        [toToken1.address, toToken2.address],
        [exchangeRate1, exchangeRate2]
      );
    });

    it("should set the fromToken correctly", async function () {
      expect(await redemptionContract.fromToken()).to.equal(fromToken.address);
    });

    it("should set the toTokens correctly", async function () {
      expect(await redemptionContract.toTokens(0)).to.equal(toToken1.address);
      expect(await redemptionContract.toTokens(1)).to.equal(toToken2.address);
    });

    it("should set the exchangeRates correctly", async function () {
      expect(await redemptionContract.exchangeRates(toToken1.address)).to.equal(ethers.utils.parseUnits("2"));
      expect(await redemptionContract.exchangeRates(toToken2.address)).to.equal(ethers.utils.parseUnits("3"));
    });

    it("should revert if array lengths are not equal", async function () {
      const invalidToTokens = [toToken1.address];
      const invalidExchangeRates = [ethers.utils.parseUnits("2"), ethers.utils.parseUnits("3")];
      const Redemption = await ethers.getContractFactory("Redemption");
      await expect(
        Redemption.deploy(fromToken.address, invalidToTokens, invalidExchangeRates)
      ).to.be.revertedWith("Array lengths must be equal");
    });

    it("should revert if an exchange rate is zero", async function () {
      const invalidExchangeRates = [ethers.utils.parseUnits("2"), ethers.utils.parseUnits("0")];
      const Redemption = await ethers.getContractFactory("Redemption");
      await expect(
        Redemption.deploy(fromToken.address, [toToken1.address, toToken2.address], invalidExchangeRates)
      ).to.be.revertedWith("Invalid exchange rate");
    });
  });

  describe("redeem", function () {
    beforeEach(async function () {
      // Deploy contracts and get signers
      [owner, user] = await ethers.getSigners();

      const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
      fromToken = await ERC20Mock.deploy(owner.address, fromTokenAmount);
      toToken1 = await ERC20Mock.deploy(owner.address, toToken1Amount);
      toToken2 = await ERC20Mock.deploy(owner.address, toToken2Amount);

      const Redemption = await ethers.getContractFactory("Redemption");
      redemptionContract = await Redemption.deploy(
        fromToken.address,
        [toToken1.address, toToken2.address],
        [exchangeRate1, exchangeRate2]
      );
      await fromToken.transfer(user.address, fromTokenAmount);
      await toToken1.transfer(redemptionContract.address, toToken1Amount);
      await toToken2.transfer(redemptionContract.address, toToken2Amount);
    });

    it("should redeem fromToken for toToken1 and toToken2", async function () {
      await fromToken.connect(user).approve(redemptionContract.address, fromTokenAmount);

      await redemptionContract.connect(user).redeem(fromTokenAmount);

      const toToken1Balance = await toToken1.balanceOf(user.address);
      const toToken2Balance = await toToken2.balanceOf(user.address);
      expect(toToken1Balance).to.equal(fromTokenAmount.mul(exchangeRate1).div(ethers.constants.WeiPerEther));
      expect(toToken2Balance).to.equal(fromTokenAmount.mul(exchangeRate2).div(ethers.constants.WeiPerEther));
    });

    it("should revert if user has insufficient balance of fromToken", async function () {
      await fromToken.connect(user).approve(redemptionContract.address, fromTokenAmount);

      await expect(
        redemptionContract.connect(user).redeem(fromTokenAmount.mul(2))
      ).to.be.revertedWith("Insufficient balance");
    });

    it("should revert if user has insufficient balance of contract", async function () {
      await fromToken.connect(user).mint(fromTokenAmount.mul(10), user.address);
      await fromToken.connect(user).approve(redemptionContract.address, fromTokenAmount.mul(10));

      await expect(
        redemptionContract.connect(user).redeem(fromTokenAmount.mul(10))
      ).to.be.revertedWith("Insufficient balance of contract");
    });

    it("should revert if contract is paused", async function () {
      await redemptionContract.pause();

      await fromToken.connect(user).approve(redemptionContract.address, fromTokenAmount);

      await expect(
        redemptionContract.connect(user).redeem(fromTokenAmount)
      ).to.be.revertedWith("Pausable: paused");
    });

    it("should emit an Redeemed event on successful redeem", async function () {
      await fromToken.connect(user).approve(redemptionContract.address, fromTokenAmount);

      let tx = await redemptionContract.connect(user).redeem(fromTokenAmount);
      obj1 = await redemptionContract.connect(user).calculateRedeem(fromTokenAmount);

      await expect(tx)
        .to.emit(redemptionContract, "Redeemed")
        .withArgs(user.address, obj1[0][0], obj1[1][0]);
      await expect(tx)
        .to.emit(redemptionContract, "Redeemed")
        .withArgs(user.address, obj1[0][1], obj1[1][1]);
    });

  });

  describe("setExchangeRate", function () {
    it("should not allow non-owners to set exchange rate", async function () {
      await expect(
        redemptionContract.connect(user).setExchangeRate(toToken1.address, exchangeRate2)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should not allow setting zero exchange rate", async function () {
      await expect(
        redemptionContract.connect(owner).setExchangeRate(toToken1.address, 0)
      ).to.be.revertedWith("Token rate cannot be zero");
    });

    it("should not allow setting exchange rate for non-existent token", async function () {
      await expect(
        redemptionContract.connect(owner).setExchangeRate(user.address, exchangeRate1)
      ).to.be.revertedWith("Token does not exist");
    });

    it("should allow owners to set exchange rate for supported token", async function () {
      await redemptionContract.connect(owner).setExchangeRate(toToken1.address, ethers.utils.parseEther("0.5"));

      expect(await redemptionContract.exchangeRates(toToken1.address)).to.equal(ethers.utils.parseEther("0.5"));
    });

    it("should emit an ExchangeRateChanged event on successful exchange rate change", async function () {
      let tx = await redemptionContract.connect(owner).setExchangeRate(toToken1.address, ethers.utils.parseEther("0.5"));

      await expect(tx)
        .to.emit(redemptionContract, "ExchangeRateChanged")
        .withArgs(toToken1.address, ethers.utils.parseEther("0.5"));
    });
  });

  describe("addToken", function () {
    beforeEach(async function () {
      // Deploy contracts and get signers
      [owner, user] = await ethers.getSigners();

      const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
      fromToken = await ERC20Mock.deploy(owner.address, fromTokenAmount);
      toToken1 = await ERC20Mock.deploy(owner.address, toToken1Amount);
      toToken2 = await ERC20Mock.deploy(owner.address, toToken2Amount);

      const Redemption = await ethers.getContractFactory("Redemption");
      redemptionContract = await Redemption.deploy(
        fromToken.address,
        [toToken1.address],
        [exchangeRate1]
      );
    });
    it("should add a new token to the list of supported tokens", async function () {
      await redemptionContract.addToken(toToken2.address, exchangeRate2);

      expect(await redemptionContract.toTokens(1)).to.equal(toToken2.address);
      expect(await redemptionContract.exchangeRates(toToken2.address)).to.equal(exchangeRate2);
    });

    it("should revert if the token is already in the list", async function () {
      await expect(redemptionContract.addToken(toToken1.address, exchangeRate2)).to.be.revertedWith("Token already exists");

      expect(await redemptionContract.toTokens(0)).to.equal(toToken1.address);
      expect(await redemptionContract.exchangeRates(toToken1.address)).to.equal(exchangeRate1);
    });

    it("should revert if the token address be equal 0", async function () {
      await expect(redemptionContract.addToken(ethers.constants.AddressZero, exchangeRate2)).to.be.revertedWith("Token address cannot be zero");

      expect(await redemptionContract.toTokens(0)).to.equal(toToken1.address);
      expect(await redemptionContract.exchangeRates(toToken1.address)).to.equal(exchangeRate1);
    });

    it("should revert if sender in not owner", async function () {
      await expect(redemptionContract.connect(user).addToken(toToken2.address, exchangeRate2)).to.be.revertedWith("Ownable: caller is not the owner");

      expect(await redemptionContract.toTokens(0)).to.equal(toToken1.address);
      expect(await redemptionContract.exchangeRates(toToken1.address)).to.equal(exchangeRate1);
    });

    it("should emit an TokenAdded event on successful add token", async function () {
      let tx = await redemptionContract.addToken(toToken2.address, exchangeRate2);

      await expect(tx)
        .to.emit(redemptionContract, "TokenAdded")
        .withArgs(toToken2.address, exchangeRate2);
    });
  });

  describe("removeToken", function () {
    beforeEach(async function () {
      // Deploy contracts and get signers
      [owner, user] = await ethers.getSigners();

      const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
      fromToken = await ERC20Mock.deploy(owner.address, fromTokenAmount);
      toToken1 = await ERC20Mock.deploy(owner.address, toToken1Amount);
      toToken2 = await ERC20Mock.deploy(owner.address, toToken2Amount);

      const Redemption = await ethers.getContractFactory("Redemption");
      redemptionContract = await Redemption.deploy(
        fromToken.address,
        [toToken1.address, toToken2.address],
        [exchangeRate1, exchangeRate2]
      );
    });
    it("should remove the token from the list of supported tokens", async function () {
      await redemptionContract.removeToken(toToken2.address);

      expect(await redemptionContract.toTokens(0)).to.equal(toToken1.address);
      expect(await redemptionContract.exchangeRates(toToken2.address)).to.equal(0);
    });

    it("should revert if the token does not exist", async function () {
      await redemptionContract.removeToken(toToken2.address);
      await expect(redemptionContract.removeToken(toToken2.address)).to.be.revertedWith("Token does not exist");

      expect(await redemptionContract.toTokens(0)).to.equal(toToken1.address);
      expect(await redemptionContract.exchangeRates(toToken1.address)).to.equal(exchangeRate1);
    });

    it("should revert if sender in not owner", async function () {
      await expect(redemptionContract.connect(user).removeToken(toToken2.address)).to.be.revertedWith("Ownable: caller is not the owner");

      expect(await redemptionContract.toTokens(1)).to.equal(toToken2.address);
      expect(await redemptionContract.exchangeRates(toToken2.address)).to.equal(exchangeRate2);
    });

    it("should emit an TokenRemoved event on successful remove token", async function () {
      let tx = await redemptionContract.removeToken(toToken2.address);

      await expect(tx)
        .to.emit(redemptionContract, "TokenRemoved")
        .withArgs(toToken2.address);
    });
  });

  describe("emergencyWithdraw", function () {
    beforeEach(async function () {
      // Deploy contracts and get signers
      [owner, user] = await ethers.getSigners();

      const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
      fromToken = await ERC20Mock.deploy(owner.address, fromTokenAmount);
      toToken1 = await ERC20Mock.deploy(owner.address, toToken1Amount);
      toToken2 = await ERC20Mock.deploy(owner.address, toToken2Amount);

      const Redemption = await ethers.getContractFactory("Redemption");
      redemptionContract = await Redemption.deploy(
        fromToken.address,
        [toToken1.address, toToken2.address],
        [exchangeRate1, exchangeRate2]
      );
    });
    it("should emergency withdrawal of tokens", async function () {
      await redemptionContract.emergencyWithdraw(toToken1.address);

      expect(await toToken1.balanceOf(redemptionContract.address)).to.equal(0);
    });

    it("should revert if sender in not owner", async function () {
      await expect(redemptionContract.connect(user).emergencyWithdraw(toToken1.address)).to.be.revertedWith("Ownable: caller is not the owner");

      expect(await redemptionContract.paused()).to.equal(false);
    });

  });

  describe("pause", function () {
    beforeEach(async function () {
      // Deploy contracts and get signers
      [owner, user] = await ethers.getSigners();

      const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
      fromToken = await ERC20Mock.deploy(owner.address, fromTokenAmount);
      toToken1 = await ERC20Mock.deploy(owner.address, toToken1Amount);
      toToken2 = await ERC20Mock.deploy(owner.address, toToken2Amount);

      const Redemption = await ethers.getContractFactory("Redemption");
      redemptionContract = await Redemption.deploy(
        fromToken.address,
        [toToken1.address, toToken2.address],
        [exchangeRate1, exchangeRate2]
      );
    });
    it("should paused/unpaused cntract", async function () {
      await redemptionContract.pause();

      expect(await redemptionContract.paused()).to.equal(true);

      await redemptionContract.pause();

      expect(await redemptionContract.paused()).to.equal(false);
    });

    it("should revert if sender in not owner", async function () {
      await expect(redemptionContract.connect(user).pause()).to.be.revertedWith("Ownable: caller is not the owner");

      expect(await redemptionContract.paused()).to.equal(false);
    });

  });

});