import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const CAMPUS_MINISTRIES = [
  {
    name: 'The Navigators',
    type: 'campus_ministry' as const,
    denomination: 'Non-denominational',
    website: 'https://www.psunavs.com',
    notes: 'NavNights Fridays 7:30pm at Pasquerilla Spiritual Center. Discipleship-focused.',
  },
  {
    name: 'Cru (Campus Crusade for Christ)',
    type: 'campus_ministry' as const,
    denomination: 'Non-denominational',
    website: 'https://www.pennstatecru.org',
    email: 'tim.henderson@uscm.org',
    phone: '814-280-3771',
    pastorName: 'Tim Henderson',
    notes: 'One of the largest campus ministry networks. Also runs Epic (Asian American) and Penn State Christian Grads.',
  },
  {
    name: 'InterVarsity Christian Fellowship',
    type: 'campus_ministry' as const,
    denomination: 'Non-denominational',
    website: 'https://www.intervarsitycentralpa.org',
    notes: 'Multi-ethnic, justice-oriented campus fellowship.',
  },
  {
    name: 'DiscipleMakers',
    type: 'campus_ministry' as const,
    denomination: 'Non-denominational / Conservative evangelical',
    email: 'rwj103@psu.edu',
    pastorName: 'Rhys John',
    notes: 'Strong discipleship emphasis, PSU-based. Meets weekly for Bible studies and a large group.',
  },
  {
    name: 'Chi Alpha',
    type: 'campus_ministry' as const,
    denomination: 'Assemblies of God',
    phone: '814-238-3800',
    email: 'paul@scassembly.org',
    pastorName: 'Paul Waldecker',
    notes: 'Charismatic/Pentecostal campus ministry affiliated with Assemblies of God.',
  },
  {
    name: 'Reformed University Fellowship (RUF)',
    type: 'campus_ministry' as const,
    denomination: 'PCA (Presbyterian Church in America)',
    phone: '205-677-8387',
    email: 'jdentici@ruf.org',
    pastorName: 'Rev. Joe Dentici',
    notes: 'Reformed campus ministry. Also has RUF International chapter on campus.',
  },
  {
    name: 'Alliance Christian Fellowship (ACF)',
    type: 'campus_ministry' as const,
    denomination: 'Christian & Missionary Alliance',
    website: 'https://acfpennstate.org',
    notes: 'Sunday services in the HUB at 10:30am. Sponsored by State College Alliance Church.',
  },
  {
    name: 'Asian American Christian Fellowship (AACF / Epic)',
    type: 'campus_ministry' as const,
    denomination: 'Non-denominational (Cru-affiliated)',
    email: 'jhm17@psu.edu',
    phone: '814-867-6442',
    pastorName: 'John Mackin',
    notes: 'Epic Movement chapter run through Cru. Meets at 209A Pasquerilla Spiritual Center.',
  },
  {
    name: 'New Life Christian Student Fellowship',
    type: 'campus_ministry' as const,
    denomination: 'Non-denominational',
    phone: '814-883-5950',
    email: 'newlife@psu.edu',
    pastorName: 'Johnny Pons',
    notes: 'Student-led fellowship based on campus.',
  },
  {
    name: 'Young Life College',
    type: 'campus_ministry' as const,
    denomination: 'Non-denominational',
    notes: 'College chapter. Meetings Tuesdays 8:30pm and Thursdays 7:30pm.',
  },
];

async function main() {
  console.log(`Seeding ${CAMPUS_MINISTRIES.length} campus ministries…`);
  for (const ministry of CAMPUS_MINISTRIES) {
    const id = await client.mutation(api.churchOutreach.create, ministry);
    console.log(`  + ${ministry.name} (${id})`);
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
