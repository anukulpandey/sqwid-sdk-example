import axios from "axios";
import { SQWID_BACKEND_URL } from "./contracts";

export const STATS_ORDER = {
    ITEMS: "items",
    VOLUME: "volume",
    ITEMS_SOLD: "itemsSold",
    AVERAGE: "average",
} as const;

export type StatsOrder = (typeof STATS_ORDER)[keyof typeof STATS_ORDER];

export const fetchCollectionsByStats = async (
    order: StatsOrder
) => {
    try {
        const res = await axios(
            `${SQWID_BACKEND_URL}/get/collections/all/by/stats.${order}`
        );
        return res.data;
    } catch (e) {
        console.error("Error fetching collections:", e);
        return { collections: [] };
    }
};

// pass the id which we get from fetchCollectionByStats
export const fetchCollectionInfo = async (id: string) => {
    try {
        const res = await axios(
            `${SQWID_BACKEND_URL}/get/marketplace/collection/${id}`
        );
        const { data } = res;
        if (data.error) {
            return [];
        }
        return data;
    } catch (error) {
        return {
            error: true,
        };
    }
};

export const fetchOwnerCollections = async (evmAddress: string) => {
    try {
      const res = await axios.get(`${SQWID_BACKEND_URL}/get/collections/owner/${evmAddress}`);
      const collections = res.data.collections;
      localStorage.setItem("collections", JSON.stringify(collections));
      return collections;
    } catch (err: any) {
      if (err.toString().includes("404")) {
        return [];
      } else {
        console.error("Error fetching collections:", err);
        return err.toString();
      }
    }
  };
  