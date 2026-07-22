import 'dotenv/config';
import { sql } from '../lib/db';

// Placeholder content matching the reference design's defaults, so every
// section renders for a side-by-side comparison. Every UPDATE is guarded to
// only fill currently-empty fields — safe to re-run, never overwrites real
// content an admin has already entered.

const dressCodeSwatches = [
  { color: '#7A9E7A', label: 'Sage' },
  { color: '#C8DEC8', label: 'Mint' },
  { color: '#F5F0E6', label: 'Ivory' },
  { color: '#C4A96A', label: 'Champagne' },
  { color: '#8B7355', label: 'Earth' }
];

const scheduleItems = [
  { time: '09:00 AM', title: 'Akad Nikah', subtitle: 'Sacred marriage ceremony' },
  { time: '10:00 AM', title: 'Family Photos', subtitle: 'Family & couple portraits' },
  { time: '11:00 AM', title: 'Reception', subtitle: 'Reception doors open' },
  { time: '12:00 PM', title: 'Luncheon', subtitle: 'Wedding luncheon & toast' },
  { time: '01:30 PM', title: 'Farewell', subtitle: 'Farewell & blessings' }
];

const faqs = [
  {
    question: 'When should I arrive?',
    answer: 'We recommend arriving 15-30 minutes before the ceremony to allow time for seating.'
  },
  {
    question: 'Is parking available at the venue?',
    answer: 'Complimentary parking is available for all guests. Please inform venue staff upon arrival.'
  },
  {
    question: 'Can I bring a plus-one?',
    answer:
      'Please indicate your total number of guests in the RSVP. Our venue has limited capacity and we appreciate your understanding.'
  },
  {
    question: 'What is the RSVP deadline?',
    answer: 'Kindly RSVP as soon as possible so we can finalize all arrangements for the day.'
  },
  {
    question: 'Will there be a gift registry?',
    answer: 'Your presence is our greatest gift. If you wish to give, please see the Registry section above for details.'
  }
];

async function seed(): Promise<void> {
  console.log('Seeding sample content...');

  await sql`
    UPDATE wedding_config
    SET
      opening_quote = CASE WHEN opening_quote = '' THEN 'We met in a beautiful place on earth, then began painting our story together.' ELSE opening_quote END,
      story_body = CASE WHEN story_body = '' THEN 'Every great love story has a beginning. Ours started in a single beautiful moment that felt like destiny. A chance meeting that blossomed into a bond neither of us could imagine living without. Today we invite you to witness the next chapter of our journey as we say "I do."' ELSE story_body END,
      dress_code_title = CASE WHEN dress_code_title = '' THEN 'Formal Attire' ELSE dress_code_title END,
      dress_code_note = CASE WHEN dress_code_note = '' THEN 'We kindly request formal attire in the following palette. Your coordinated presence will make our celebration even more beautiful.' ELSE dress_code_note END,
      dress_code_avoid_note = CASE WHEN dress_code_avoid_note = '' THEN 'Please kindly avoid white or black attire' ELSE dress_code_avoid_note END,
      dress_code_swatches = CASE WHEN dress_code_swatches = '[]'::jsonb THEN ${JSON.stringify(dressCodeSwatches)}::jsonb ELSE dress_code_swatches END,
      wishlist_title = CASE WHEN wishlist_title = '' THEN 'Home & Living' ELSE wishlist_title END,
      wishlist_note = CASE WHEN wishlist_note = '' THEN 'We''re building our first home together. Kitchenware, linens, and home decor are always warmly welcomed.' ELSE wishlist_note END,
      schedule_items = CASE WHEN schedule_items = '[]'::jsonb THEN ${JSON.stringify(scheduleItems)}::jsonb ELSE schedule_items END,
      updated_at = NOW()
    WHERE id = 'main'
  `;

  await sql`
    UPDATE events
    SET
      event_date = CASE WHEN event_date IS NULL THEN '2026-07-10' ELSE event_date END,
      time_start = CASE WHEN time_start IS NULL THEN '09:00' ELSE time_start END,
      venue_name = CASE WHEN venue_name = '' THEN 'Grand Ballroom Hotel' ELSE venue_name END,
      address = CASE WHEN address = '' THEN 'Jl. Merdeka No. 1, Jakarta, Indonesia' ELSE address END,
      maps_url = CASE WHEN maps_url = '' THEN 'https://maps.google.com/?q=Jakarta+Indonesia' ELSE maps_url END
    WHERE type = 'akad'
  `;

  const existingFaqs = await sql`SELECT count(*) AS count FROM faqs`;
  if (Number((existingFaqs[0] as { count: string }).count) === 0) {
    for (let i = 0; i < faqs.length; i++) {
      await sql`
        INSERT INTO faqs (question, answer, order_index)
        VALUES (${faqs[i].question}, ${faqs[i].answer}, ${i})
      `;
    }
    console.log(`Seeded ${faqs.length} FAQs.`);
  } else {
    console.log('FAQs already exist, skipping.');
  }

  console.log('✓ Sample content seeded.');
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
