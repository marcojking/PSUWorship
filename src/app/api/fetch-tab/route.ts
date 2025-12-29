import { NextRequest, NextResponse } from 'next/server';

interface TabData {
  title: string;
  artist: string;
  key: string;
  capo: number;
  content: string;
}

// Extract tab data from Ultimate Guitar page
async function fetchUltimateGuitar(url: string): Promise<TabData> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }

  const html = await response.text();

  // Ultimate Guitar stores tab data in a JSON blob in the page
  // Look for the data-content attribute or js-store element
  const storeMatch = html.match(/class="js-store"\s+data-content="([^"]+)"/);

  if (!storeMatch) {
    throw new Error('Could not find tab data in page');
  }

  // Decode HTML entities
  const jsonStr = storeMatch[1]
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'");

  const data = JSON.parse(jsonStr);

  // Navigate to the tab content
  const store = data.store;
  const page = store?.page?.data;

  if (!page?.tab_view?.wiki_tab?.content) {
    throw new Error('Tab content not found in data');
  }

  const tab = page.tab;
  const tabView = page.tab_view;

  return {
    title: tab?.song_name || 'Unknown Title',
    artist: tab?.artist_name || 'Unknown Artist',
    key: tabView?.meta?.tonality || 'C',
    capo: tabView?.meta?.capo || 0,
    content: tabView.wiki_tab.content,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL is from Ultimate Guitar
    if (!url.includes('ultimate-guitar.com') && !url.includes('tabs.ultimate-guitar.com')) {
      return NextResponse.json({ error: 'Only Ultimate Guitar URLs are supported' }, { status: 400 });
    }

    const tabData = await fetchUltimateGuitar(url);

    return NextResponse.json(tabData);
  } catch (error) {
    console.error('Fetch tab error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch tab' },
      { status: 500 }
    );
  }
}
