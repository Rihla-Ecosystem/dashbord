"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants";
import { aiBillingApi } from "@/services/ai-billing";
import type {
  CloneRateCardRequest,
  CreateRateCardDraftRequest,
  CreateRateCardEntryRequest,
  ImportRateCardEntriesRequest,
  PublishRateCardRequest,
  RateCardListQuery,
  RetireRateCardRequest,
  UpdateRateCardEntryRequest,
} from "@/types/ai-billing";

export function useRateCards(params?: RateCardListQuery) {
  return useQuery({
    queryKey: QUERY_KEYS.rateCards(params),
    queryFn: () => aiBillingApi.getRateCards(params),
  });
}

export function useRateCardDetail(version: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.rateCardDetail(version ?? ""),
    queryFn: () => {
      if (!version) {
        throw new Error("Rate card version is required");
      }
      return aiBillingApi.getRateCardByVersion(version);
    },
    enabled: Boolean(version),
  });
}

export function useCreateRateCardDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateRateCardDraftRequest) =>
      aiBillingApi.createRateCardDraft(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rate-cards"] });
    },
  });
}

export function useCloneRateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sourceVersion,
      body,
    }: {
      sourceVersion: string;
      body: CloneRateCardRequest;
    }) => aiBillingApi.cloneRateCard(sourceVersion, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rate-cards"] });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.rateCardDetail(variables.body.newVersion),
      });
    },
  });
}

export function useImportRateCardEntries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      version,
      body,
    }: {
      version: string;
      body: ImportRateCardEntriesRequest;
    }) => aiBillingApi.importRateCardEntries(version, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rate-cards"] });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.rateCardDetail(variables.version),
      });
    },
  });
}

export function useCreateRateCardEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      version,
      entry,
    }: {
      version: string;
      entry: CreateRateCardEntryRequest;
    }) => aiBillingApi.createRateCardEntry(version, entry),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rate-cards"] });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.rateCardDetail(variables.version),
      });
    },
  });
}

export function useUpdateRateCardEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      version,
      entryId,
      patch,
    }: {
      version: string;
      entryId: string;
      patch: UpdateRateCardEntryRequest;
    }) => aiBillingApi.updateRateCardEntry(version, entryId, patch),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rate-cards"] });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.rateCardDetail(variables.version),
      });
    },
  });
}

export function useDeleteRateCardEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      version,
      entryId,
    }: {
      version: string;
      entryId: string;
    }) => aiBillingApi.deleteRateCardEntry(version, entryId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rate-cards"] });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.rateCardDetail(variables.version),
      });
    },
  });
}

export function useValidateRateCardDraft() {
  return useMutation({
    mutationFn: (version: string) =>
      aiBillingApi.validateRateCardDraft(version),
  });
}

export function usePublishRateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      version,
      body,
    }: {
      version: string;
      body?: PublishRateCardRequest;
    }) => aiBillingApi.publishRateCard(version, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rate-cards"] });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.rateCardDetail(variables.version),
      });
    },
  });
}

export function useRetireRateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      version,
      body,
    }: {
      version: string;
      body?: RetireRateCardRequest;
    }) => aiBillingApi.retireRateCard(version, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rate-cards"] });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.rateCardDetail(variables.version),
      });
    },
  });
}
