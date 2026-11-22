import type { BlockchainStatus } from "@/types";
import { http } from "./client";

export function getBlockchainStatus(): Promise<BlockchainStatus> {
  return http("/blockchain/status");
}