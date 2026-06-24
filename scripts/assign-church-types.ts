import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function main() {
  const entries: any[] = await client.query(api.churchOutreach.list, {});
  console.log(`Found ${entries.length} entries`);

  // --- 1. Remove Catholic entries ---
  const catholicNames = [
    'Penn State Catholic Campus Ministry (Nittany Catholic)',
    'Our Lady of Victory Catholic Church',
    'Good Shepherd Catholic Church',
  ];

  // --- 2. Remove Eastern Orthodox entries ---
  // NOTE: "Resurrection Orthodox Presbyterian Church" (OPC) is Reformed/Protestant — keep it.
  const orthodoxNames = [
    'Holy Trinity Orthodox Church',
  ];

  const toRemove = [...catholicNames, ...orthodoxNames];

  // --- 3. Remove duplicate campus ministries from first (failed) seed run ---
  // The second seed run created newer entries; remove older dupes.
  const dupNames = ['The Navigators', 'Cru (Campus Crusade for Christ)', 'InterVarsity Christian Fellowship', 'DiscipleMakers'];
  const seen = new Set<string>();
  const dupIdsToRemove: string[] = [];
  // entries are ordered newest-first, so the first occurrence of each dup name is the one to keep
  for (const e of entries) {
    if (dupNames.includes(e.name)) {
      if (seen.has(e.name)) {
        dupIdsToRemove.push(e._id);
      } else {
        seen.add(e.name);
      }
    }
  }

  // --- 4. Build type assignment map for remaining UNSET entries ---
  const campusMinistryNames = new Set([
    'Episcopal Student Ministry',
    'Lutheran Campus Ministry at Penn State (LuMin)',
  ]);

  let removed = 0;
  let typed = 0;

  for (const e of entries) {
    const shouldRemove = toRemove.includes(e.name) || dupIdsToRemove.includes(e._id);
    if (shouldRemove) {
      await client.mutation(api.churchOutreach.remove, { id: e._id });
      console.log(`  ✕ removed: ${e.name}`);
      removed++;
      continue;
    }

    if (!e.type) {
      const type = campusMinistryNames.has(e.name) ? 'campus_ministry' : 'church';
      await client.mutation(api.churchOutreach.setType, { id: e._id, type });
      console.log(`  ✓ ${type}: ${e.name}`);
      typed++;
    }
  }

  console.log(`\nDone. Removed: ${removed}, Typed: ${typed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
