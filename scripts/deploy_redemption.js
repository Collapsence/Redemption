// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {

  let fromToken = "0x29127fe04ffa4c32acac0ffe17280abd74eac313"; //must be entered
  let toTokens = ["0x55c08ca52497e2f1534b59e2917bf524d4765257", "0xdac17f958d2ee523a2206206994597c13d831ec7"]; //must be entered
  let exchangeRates = ["", ""]; //must be entered

  const redemption = await Redemption.deploy(fromToken, toTokens, exchangeRates);

  await redemption.deployed();

  console.log(
    `Deployed to ${redemption.address}`
  );

  await hre.run("verify:verify", {
    address: redemption.address,
    constructorArguments: [fromToken, toTokens, exchangeRates],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
