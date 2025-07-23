import axios from "axios";
import { SQWID_BACKEND_URL } from "./contracts";
import { getInfuraURL } from "./utils";

export async function getUserCollections(evmAddress:string) {
	if (!evmAddress) throw new Error("evmAddress is required");

	try {
		const response = await axios.get(`${SQWID_BACKEND_URL}/get/collections/owner/${evmAddress}`);
		const collections = response.data.collections;

		localStorage.setItem("collections", JSON.stringify(collections));

		return collections.map((item:any) => ({
			src: getInfuraURL(item?.data?.thumbnail || item?.data?.image),
			title: item?.data?.name,
			link: `/collections/${item.id}`,
		}));
	} catch (err) {
		if ((err as any).response?.status === 404) {
			return []; // no collections
		}
		throw err; // rethrow other errors for the caller to handle
	}
}

export const fetchUserItems = async (address:string, state = -1, startFrom=0) => {
	let limit = 10;
	const res = await axios(
		`${SQWID_BACKEND_URL}/get/marketplace/by-owner/${address}${
			state >= 0 ? `/${state}` : ""
		}?limit=${limit}&startFrom=${startFrom}`
	);
	const { data } = res;
	if (data.error) {
		return [];
	}
	return data;
};