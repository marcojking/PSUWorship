import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env.local') });
const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
async function main() {
  const entries = await client.query(api.churchOutreach.list, {});
  console.log(JSON.stringify(entries.map((e: any) => ({ id: e._id, name: e.name, type: e.type ?? 'UNSET', denomination: e.denomination ?? '' })), null, 2));
}
main().catch(console.error);
