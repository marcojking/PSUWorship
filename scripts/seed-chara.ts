import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function main() {
  const id = await client.mutation(api.leadershipInterest.adminCreate, {
    name: 'Chara Harter',
    email: 'charaharter56@gmail.com',
    gradYear: 2028,
    weeklyHours: 0,
    roles: ['Media & Social Team', 'Graphics / Art Team'],
    worshipTeam: true,
    notes: 'Applied via email June 20. Video: https://drive.google.com/open?id=1GD3PH_2AswPeqs8X7S2OQCtfOivUgSfz\nInterested in worship team + social media / graphics. Open to leadership or team member. Junior graduating 2028 (typo in original email said 2029).',
  });
  console.log(`Added Chara Harter: ${id}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
