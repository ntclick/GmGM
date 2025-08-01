const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying LuckySpinFHE contract...");

  // Get the contract factory
  const LuckySpinFHE = await ethers.getContractFactory("LuckySpinFHE");
  
  // Deploy the contract
  const luckySpin = await LuckySpinFHE.deploy();
  await luckySpin.waitForDeployment();

  const address = await luckySpin.getAddress();
  console.log("✅ LuckySpinFHE deployed to:", address);

  // Add some default pools
  console.log("📦 Adding default pools...");
  
  await luckySpin.addPool(
    "Common Reward", 
    "https://example.com/common.png", 
    100, // 100 tokens
    6000  // 60% probability
  );
  
  await luckySpin.addPool(
    "Rare Reward", 
    "https://example.com/rare.png", 
    500, // 500 tokens
    3000  // 30% probability
  );
  
  await luckySpin.addPool(
    "Epic Reward", 
    "https://example.com/epic.png", 
    1000, // 1000 tokens
    900   // 9% probability
  );
  
  await luckySpin.addPool(
    "Legendary Reward", 
    "https://example.com/legendary.png", 
    5000, // 5000 tokens
    100   // 1% probability
  );

  console.log("✅ Default pools added successfully!");
  console.log("🎯 Contract ready for use!");
  
  return address;
}

main()
  .then((address) => {
    console.log("🎉 Deployment completed successfully!");
    console.log("Contract address:", address);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 