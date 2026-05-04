'use client';

import { useState, useCallback, useEffect } from 'react';
import { fullSync, pullSongsFromAirtable, pullSetlistsFromAirtable, pushAllSongsToAirtable, pushAllSetlistsToAirtable } from '@/lib/db/sync';
import { isAirtableConfigured } from '@/lib/airtable';

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  error: string | null;
  isConfigured: boolean;
}

export interface SyncResult {
  songs: { added: number; updated: number; pushed: number };
  setlists: { added: number; updated: number; pushed: number };
}

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>({
    isSyncing: false,
    lastSyncedAt: null,
    error: null,
    isConfigured: false,
  });

  // Check if Airtable is configured on mount
  useEffect(() => {
    setStatus(prev => ({ ...prev, isConfigured: isAirtableConfigured() }));

    // Load last sync time from localStorage
    const lastSync = localStorage.getItem('airtable_last_sync');
    if (lastSync) {
      setStatus(prev => ({ ...prev, lastSyncedAt: new Date(lastSync) }));
    }
  }, []);

  const sync = useCallback(async (): Promise<SyncResult | null> => {
    if (!isAirtableConfigured()) {
      setStatus(prev => ({ ...prev, error: 'Airtable not configured' }));
      return null;
    }

    setStatus(prev => ({ ...prev, isSyncing: true, error: null }));

    try {
      const result = await fullSync();
      const now = new Date();
      localStorage.setItem('airtable_last_sync', now.toISOString());
      setStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncedAt: now,
        error: null,
      }));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      setStatus(prev => ({
        ...prev,
        isSyncing: false,
        error: errorMessage,
      }));
      return null;
    }
  }, []);

  const pullAll = useCallback(async () => {
    if (!isAirtableConfigured()) return null;

    setStatus(prev => ({ ...prev, isSyncing: true, error: null }));

    try {
      const songs = await pullSongsFromAirtable();
      const setlists = await pullSetlistsFromAirtable();
      const now = new Date();
      localStorage.setItem('airtable_last_sync', now.toISOString());
      setStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncedAt: now,
        error: null,
      }));
      return { songs, setlists };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Pull failed';
      setStatus(prev => ({
        ...prev,
        isSyncing: false,
        error: errorMessage,
      }));
      return null;
    }
  }, []);

  const pushAll = useCallback(async () => {
    if (!isAirtableConfigured()) return null;

    setStatus(prev => ({ ...prev, isSyncing: true, error: null }));

    try {
      const songs = await pushAllSongsToAirtable();
      const setlists = await pushAllSetlistsToAirtable();
      const now = new Date();
      localStorage.setItem('airtable_last_sync', now.toISOString());
      setStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncedAt: now,
        error: null,
      }));
      return { songs: { synced: songs.synced }, setlists: { synced: setlists.synced } };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Push failed';
      setStatus(prev => ({
        ...prev,
        isSyncing: false,
        error: errorMessage,
      }));
      return null;
    }
  }, []);

  return {
    status,
    sync,
    pullAll,
    pushAll,
  };
}

// Auto-sync hook - syncs on mount and optionally at intervals
export function useAutoSync(options: { syncOnMount?: boolean; intervalMs?: number } = {}) {
  const { status, sync } = useSync();
  const { syncOnMount = true, intervalMs } = options;

  useEffect(() => {
    if (syncOnMount && status.isConfigured && !status.isSyncing) {
      sync();
    }
  }, [syncOnMount, status.isConfigured]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!intervalMs || !status.isConfigured) return;

    const interval = setInterval(() => {
      if (!status.isSyncing) {
        sync();
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs, status.isConfigured, status.isSyncing, sync]);

  return { status, sync };
}
