import { CID } from "multiformats/cid";

export const getCIDv1 = (url:string) =>
	CID.parse(url.replace("ipfs://", "")).toV1().toString();


export const getInfuraURL = (url:string) => {
	let base = url?.split ('/')[2] || url;
	let cid;
	try {
		cid = getCIDv1 (base);
	} catch (e) {
		cid = base;
	}
	return `https://sqwid.infura-ipfs.io/ipfs/${cid}/${url?.split ('/')[3] || ''}`;
}