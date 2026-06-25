import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function main() {
  // Add Ana Clara (no email, no video)
  const anaId = await client.mutation(api.leadershipInterest.adminCreate, {
    name: 'Ana Clara',
    email: '',
    gradYear: 2028,
    weeklyHours: 0,
    roles: [],
    worshipTeam: false,
  });
  console.log(`Added Ana Clara: ${anaId}`);

  // Patch Chara's record with her Drive video URL
  const CHARA_ID = 'kd7chnsn16wb2z00a2jcf756vh898t5d' as any;
  await client.mutation(api.leadershipInterest.adminPatch, {
    id: CHARA_ID,
    videoDriveUrl: 'https://drive.google.com/open?id=1GD3PH_2AswPeqs8X7S2OQCtfOivUgSfz',
  });
  console.log(`Attached Drive video to Chara Harter`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
