// Airtable REST API service for syncing songs and setlists

const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID || '';
const AIRTABLE_API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY || '';

const AIRTABLE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

// Types for Airtable records
export interface AirtableSong {
  id?: string; // Airtable record ID
  fields: {
    localId?: number;
    title: string;
    artist: string;
    key: string;
    sections: string; // JSON stringified Section[]
    createdAt: string;
    updatedAt: string;
  };
}

export interface AirtableSetlist {
  id?: string; // Airtable record ID
  fields: {
    localId?: number;
    name: string;
    date: string;
    time: string;
    location: string;
    songs: string; // JSON stringified SetlistSong[]
    createdAt: string;
    updatedAt: string;
  };
}

interface AirtableResponse<T> {
  records: T[];
  offset?: string;
}

// Helper function for API calls
async function airtableFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!AIRTABLE_API_KEY) {
    throw new Error('Airtable API key not configured. Set NEXT_PUBLIC_AIRTABLE_API_KEY in .env.local');
  }

  const response = await fetch(`${AIRTABLE_API_URL}/${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(`Airtable API error: ${error.error?.message || response.statusText}`);
  }

  return response.json();
}

// Songs API
export async function fetchAllSongs(): Promise<AirtableSong[]> {
  const allRecords: AirtableSong[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams();
    if (offset) params.set('offset', offset);
    params.set('sort[0][field]', 'title');
    params.set('sort[0][direction]', 'asc');

    const response = await airtableFetch<AirtableResponse<AirtableSong>>(
      `Songs?${params.toString()}`
    );
    allRecords.push(...response.records);
    offset = response.offset;
  } while (offset);

  return allRecords;
}

export async function createSong(song: AirtableSong['fields']): Promise<AirtableSong> {
  const response = await airtableFetch<{ records: AirtableSong[] }>('Songs', {
    method: 'POST',
    body: JSON.stringify({
      records: [{ fields: song }],
    }),
  });
  return response.records[0];
}

export async function updateSong(recordId: string, fields: Partial<AirtableSong['fields']>): Promise<AirtableSong> {
  const response = await airtableFetch<{ records: AirtableSong[] }>('Songs', {
    method: 'PATCH',
    body: JSON.stringify({
      records: [{ id: recordId, fields }],
    }),
  });
  return response.records[0];
}

export async function deleteSong(recordId: string): Promise<void> {
  await airtableFetch(`Songs/${recordId}`, {
    method: 'DELETE',
  });
}

export async function findSongByLocalId(localId: number): Promise<AirtableSong | null> {
  const params = new URLSearchParams();
  params.set('filterByFormula', `{localId}=${localId}`);
  params.set('maxRecords', '1');

  const response = await airtableFetch<AirtableResponse<AirtableSong>>(
    `Songs?${params.toString()}`
  );
  return response.records[0] || null;
}

// Setlists API
export async function fetchAllSetlists(): Promise<AirtableSetlist[]> {
  const allRecords: AirtableSetlist[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams();
    if (offset) params.set('offset', offset);
    params.set('sort[0][field]', 'date');
    params.set('sort[0][direction]', 'desc');

    const response = await airtableFetch<AirtableResponse<AirtableSetlist>>(
      `Setlists?${params.toString()}`
    );
    allRecords.push(...response.records);
    offset = response.offset;
  } while (offset);

  return allRecords;
}

export async function createSetlist(setlist: AirtableSetlist['fields']): Promise<AirtableSetlist> {
  const response = await airtableFetch<{ records: AirtableSetlist[] }>('Setlists', {
    method: 'POST',
    body: JSON.stringify({
      records: [{ fields: setlist }],
    }),
  });
  return response.records[0];
}

export async function updateSetlist(recordId: string, fields: Partial<AirtableSetlist['fields']>): Promise<AirtableSetlist> {
  const response = await airtableFetch<{ records: AirtableSetlist[] }>('Setlists', {
    method: 'PATCH',
    body: JSON.stringify({
      records: [{ id: recordId, fields }],
    }),
  });
  return response.records[0];
}

export async function deleteSetlist(recordId: string): Promise<void> {
  await airtableFetch(`Setlists/${recordId}`, {
    method: 'DELETE',
  });
}

export async function findSetlistByLocalId(localId: number): Promise<AirtableSetlist | null> {
  const params = new URLSearchParams();
  params.set('filterByFormula', `{localId}=${localId}`);
  params.set('maxRecords', '1');

  const response = await airtableFetch<AirtableResponse<AirtableSetlist>>(
    `Setlists?${params.toString()}`
  );
  return response.records[0] || null;
}

// Check if Airtable is configured
export function isAirtableConfigured(): boolean {
  return !!AIRTABLE_API_KEY;
}
