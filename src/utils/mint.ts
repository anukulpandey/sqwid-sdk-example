import type { Provider, Signer } from "@reef-chain/evm-provider";
import { SQWID_BACKEND_URL, SQWID_ERC1155_ADDRESS, SQWID_MARKETPLACE_ADDRESS } from "./contracts";
import { ethers } from "ethers";
import axios from "axios";
import contractABI from "./SqwidERC1155";

const getEVMAddress = async (address:any,provider:Provider) => {
	address = await provider.api.query.evmAccounts.evmAddresses(address);
	address = (0, ethers.utils.getAddress)(address.toString());

	return address;
};


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

export const createCollectible = async (files:any,provider:Provider,signer:Signer) => {
	const { file, coverFile, name, description, properties, collection } =
		files;
	const copies = Number(files.copies) || 1;
	const royalty = (Number(files.royalty) || 0) * 100;

	const data = new FormData();
	data.append("fileData", file);
	data.append("coverData", coverFile);
	data.append("name", name);
	data.append("description", description);
	data.append("collection", collection);

	let attribs = [];
	if (properties && properties.length > 0) {
		for (let p of properties) {
			p.key.length && attribs.push({ trait_type: p.key, value: p.value });
		}
	}
	data.append("properties", JSON.stringify(attribs));
	for(let pair of data.entries()) {
		console.log(pair[0] + ": ==== " + pair[1]);
	}
	const address = signer._substrateAddress;
	if (!address) {
		throw new Error("You need to login first");
	  }
	let jwt = address
		? JSON.parse(localStorage.getItem("tokens")!).find(
				(token:any) => token.address === address
		  )
		: null;
	const approved = await isMarketplaceApproved(provider,signer);
	if (!approved) {
		await approveMarketplace(signer);
	}

	if (jwt) {
		try {
			const metadata = await axios.post(
				`${SQWID_BACKEND_URL}/create/collectible/upload`,
				data,
				{
					headers: {
						Authorization: `Bearer ${jwt.token}`,
					},
				}
			);
			const meta = metadata.data?.metadata;
			let to =
				files.royaltyRecipient && files.royaltyRecipient !== ""
					? files.royaltyRecipient
					: await signer.getAddress();
					
			if (to.startsWith ('5')) to = await getEVMAddress (to,provider);
					
			let contract = new ethers.Contract(
				SQWID_MARKETPLACE_ADDRESS,
				contractABI,
				signer
			);
			try {
				const nft = await contract.mint(
					copies,
					meta,
					file.type.split("/")[0],
					to,
					royalty
				);
				// eslint-disable-next-line
				const receipt = await nft.wait();
				// eslint-disable-next-line
				const itemId = receipt.events[1].args["itemId"].toNumber();
				// eslint-disable-next-line
				const positionId = receipt.events[1].args["positionId"].toNumber();
				await axios.post(
					`${SQWID_BACKEND_URL}/create/collectible/verify`,
					{
						id: itemId,
						collection: collection,
					},
					{
						headers: {
							Authorization: `Bearer ${jwt.token}`,
							"Content-Type": "application/json",
						},
					}
				);
				return positionId;
			} catch (err) {
				// console.log (err);
				// return null;
				return { error: err };
			}
		} catch (err) {
			return { error: err };
		}
	} else return null;
};
