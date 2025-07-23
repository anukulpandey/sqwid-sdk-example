import type { Provider, Signer } from "@reef-chain/evm-provider";
import { ethers } from "ethers";
import { SQWID_ERC1155_ADDRESS, SQWID_MARKETPLACE_ADDRESS } from "./contracts";
import contractABI from "./SqwidERC1155";
import marketplaceContractABI from "./SqwidMarketplace";

const approveMarketplace = async (signer:Signer) => {
	console.log("inisde approveMarketplace component");

	let contract = new ethers.Contract(
		SQWID_ERC1155_ADDRESS,
		contractABI,
		signer
	);   

	const tx = await contract.setApprovalForAll(
		SQWID_MARKETPLACE_ADDRESS,
		true
	);
	return await tx.wait();
};


const isMarketplaceApproved = async (provider:Provider, signer:Signer) => {
	console.log("Inside isMarketplaceApproved component");
  
	try {
	  console.log("Provider:", provider);
	  console.log("Signer:", signer);
  
	  const address = await signer.getAddress();
	  console.log("Address from signer:", address);
  
	  const marketplaceAddress = SQWID_MARKETPLACE_ADDRESS;
	  if (!ethers.utils.isAddress(address) || !ethers.utils.isAddress(marketplaceAddress)) {
		throw new Error(`Invalid addresses: Signer: ${address}, Marketplace: ${marketplaceAddress}`);
	  }
  
	  const contract = new ethers.Contract(SQWID_ERC1155_ADDRESS, contractABI, provider);
	  console.log("Contract instance created:", contract);
  
	  console.log("Checking contract approval with:", address, marketplaceAddress);
  
	  const isApproved = await contract.isApprovedForAll(address, marketplaceAddress);
	  console.log("Is Approved:", isApproved);
  
	  return isApproved;
	} catch (error) {
	  console.error("Contract call failed:", error);
	  
	  // Capture the error data if available
	  if ((error as any).data && (error as any).data.message) {
		console.error("Detailed revert reason:", (error as any).data.message);
	  } else {
		console.error("No detailed revert reason provided.");
	  }
  
	  throw new Error("Contract interaction failed. Check the contract logs for details.");
	}
  };  

const checkAndApproveMarketplace = async (provider:Provider,signer:Signer) => {
	const approved = await isMarketplaceApproved(provider,signer);
	if (!approved) {
		await approveMarketplace(signer);
	}
};

export const unlistPositionOnSale = async (positionId:string,signer:Signer,provider:Provider) => {
	await checkAndApproveMarketplace(provider,signer);
	try {
		const marketplaceContractInstance = new ethers.Contract(
            SQWID_MARKETPLACE_ADDRESS,
            marketplaceContractABI,
            signer
        );;
		const tx = await marketplaceContractInstance.unlistPositionOnSale(
			positionId,
			{
				customData: {
					storageLimit: 2000,
				},
			}
		);
		const receipt = await tx.wait();
		return receipt;
	} catch (error) {
		// console.error (error);
		return null;
	}
};