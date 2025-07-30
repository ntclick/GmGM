const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting contract deployment with Hardhat...");
  
  // Deploy the contract
  const GMContract = await hre.ethers.getContractFactory("GMContract");
  
  console.log("Deploying GMContract...");
  
  const gmContract = await GMContract.deploy();
  
  // Wait for deployment to finish
  await gmContract.waitForDeployment();
  
  // Get the contract address
  const contractAddress = await gmContract.getAddress();
  
  console.log(`GMContract deployed to: ${contractAddress}`);
  console.log(`Transaction Hash: ${gmContract.deploymentTransaction().hash}`);
  
  // Verify the contract
  console.log("Verifying contract...");
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
    });
    console.log("Contract verified successfully!");
  } catch (error) {
    console.log("Verification failed:", error.message);
  }
  
  // Update .env file with new contract address
  console.log("📝 Updating .env file...");
  const fs = require('fs');
  const envPath = '.env';
  
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update or add VITE_FHEVM_CONTRACT_ADDRESS
    if (envContent.includes('VITE_FHEVM_CONTRACT_ADDRESS=')) {
      envContent = envContent.replace(
        /VITE_FHEVM_CONTRACT_ADDRESS=.*/,
        `VITE_FHEVM_CONTRACT_ADDRESS=${contractAddress}`
      );
    } else {
      envContent += `\nVITE_FHEVM_CONTRACT_ADDRESS=${contractAddress}`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log("✅ .env file updated with new contract address");
  }
  
  console.log("🎉 Deployment completed!");
  console.log("📋 Next steps:");
  console.log("1. Update your frontend to use the new contract address");
  console.log("2. Test the contract functionality");
  console.log("3. Share the contract address with your team");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 