// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {

  let owner = "";
  const ERC20Mock = await hre.ethers.getContractFactory("ERC20Mock");
  const eRC20Mock = await VestedERC20.deploy(owner, ethers.utils.parseEther("100"));

  await eRC20Mock.deployed();

  console.log(
    `Deployed to ${eRC20Mock.address}`
  );

  await hre.run("verify:verify", {
    address: eRC20Mock.address,
    constructorArguments: [owner, ethers.utils.parseEther("100")],
});
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
