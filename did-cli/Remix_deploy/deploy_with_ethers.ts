// This script can be used to deploy the "Storage" contract using ethers.js library.
// Please make sure to compile "./contracts/1_Storage.sol" file before running this script.
// And use Right click -> "Run" from context menu of the file to run the script. Shortcut: Ctrl+Shift+S

// scripts/deploy_with_ethers.ts

async function main() {
  // Get list of accounts from the provider
  const accounts = await ethers.provider.listAccounts();
  const deployer = ethers.provider.getSigner(accounts[0]);

  console.log("Deploying contracts with the account:", accounts[0]);

  const DidManage = await ethers.getContractFactory("DidManage", deployer);
  const didManage = await DidManage.deploy();

  await didManage.deployed();

  console.log("DidManage deployed to:", didManage.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

