// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {

  let fromToken = ""; //must be entered
  let toTokens = [""]; //must be entered
  let exchangeRates = [ethers.utils.parseEther("")]; //must be entered

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
