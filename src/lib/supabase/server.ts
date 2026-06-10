import { createSupabaseServiceClient, createSupabaseAnonClient } from "./client";

export function createSupabaseServerClient() {
  return createSupabaseServiceClient();
}

export function createSupabaseUserClient() {
  return createSupabaseAnonClient();
}
