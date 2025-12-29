/**
 * Airtable Table Setup Script
 *
 * This script creates the Songs and Setlists tables in your Airtable base.
 *
 * Run with: npx ts-node scripts/setup-airtable.ts
 *
 * Or manually create the tables in Airtable with these fields:
 *
 * Songs table:
 * - localId (Number)
 * - title (Single line text)
 * - artist (Single line text)
 * - key (Single line text)
 * - sections (Long text)
 * - createdAt (Date time)
 * - updatedAt (Date time)
 *
 * Setlists table:
 * - localId (Number)
 * - name (Single line text)
 * - date (Single line text)
 * - time (Single line text)
 * - location (Single line text)
 * - songs (Long text)
 * - createdAt (Date time)
 * - updatedAt (Date time)
 */

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID || 'appKBJGb5ftWBZOH3';

if (!AIRTABLE_API_KEY) {
  console.error('Error: AIRTABLE_API_KEY environment variable is required');
  console.log('Run with: AIRTABLE_API_KEY=pat_xxx npx tsx scripts/setup-airtable.ts');
  process.exit(1);
}

async function createTable(name: string, fields: Array<{ name: string; type: string; options?: Record<string, unknown> }>) {
  const response = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      fields,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    if (error.error?.message?.includes('already exists')) {
      console.log(`Table "${name}" already exists, skipping...`);
      return null;
    }
    throw new Error(`Failed to create table ${name}: ${JSON.stringify(error)}`);
  }

  return response.json();
}

async function main() {
  console.log('Setting up Airtable tables...\n');

  // Create Songs table
  try {
    console.log('Creating Songs table...');
    await createTable('Songs', [
      { name: 'localId', type: 'number', options: { precision: 0 } },
      { name: 'title', type: 'singleLineText' },
      { name: 'artist', type: 'singleLineText' },
      { name: 'key', type: 'singleLineText' },
      { name: 'sections', type: 'multilineText' },
      { name: 'createdAt', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'utc' } },
      { name: 'updatedAt', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'utc' } },
    ]);
    console.log('✓ Songs table created\n');
  } catch (error) {
    console.error('Error creating Songs table:', error);
  }

  // Create Setlists table
  try {
    console.log('Creating Setlists table...');
    await createTable('Setlists', [
      { name: 'localId', type: 'number', options: { precision: 0 } },
      { name: 'name', type: 'singleLineText' },
      { name: 'date', type: 'singleLineText' },
      { name: 'time', type: 'singleLineText' },
      { name: 'location', type: 'singleLineText' },
      { name: 'songs', type: 'multilineText' },
      { name: 'createdAt', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'utc' } },
      { name: 'updatedAt', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'utc' } },
    ]);
    console.log('✓ Setlists table created\n');
  } catch (error) {
    console.error('Error creating Setlists table:', error);
  }

  console.log('Setup complete!');
}

main().catch(console.error);
