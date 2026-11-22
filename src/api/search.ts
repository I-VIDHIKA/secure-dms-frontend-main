import type { SearchParams, SearchResponse } from "@/types";
import { http, queryString } from "./client";

export function searchDocuments(params: SearchParams): Promise<SearchResponse> {
  return http(`/search${queryString(params)}`);
}