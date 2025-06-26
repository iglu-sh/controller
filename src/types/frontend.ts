import type {cache, keys} from "@/types/db";

export interface cacheCreationObject extends cache{
    selectedApiKeys: keys[];
    collectMetrics: boolean;
    retentionDays: number;
}