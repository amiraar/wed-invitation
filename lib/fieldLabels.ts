// Turns server validation messages ("Invalid data: cover_image_url must be an https:// URL.")
// into labels an admin recognizes ("Please check: Cover photo URL (must be an https:// URL).").

const LABELS: Record<string, string> = {
  groom_name: "Groom's first name",
  bride_name: "Bride's first name",
  groom_full_name: "Groom's full name",
  bride_full_name: "Bride's full name",
  groom_parents: "Groom's parents",
  bride_parents: "Bride's parents",
  cover_image_url: 'Cover photo URL',
  venue_image_url: 'Venue photo URL',
  music_url: 'Music URL',
  opening_quote: 'Pull quote',
  story_body: 'Story',
  dress_code_title: 'Dress code title',
  dress_code_note: 'Dress code description',
  dress_code_avoid_note: 'Dress code avoid note',
  wishlist_title: 'Wishlist title',
  wishlist_note: 'Wishlist note',
  event_date: 'Date',
  time_start: 'Start time',
  time_end: 'End time',
  venue_name: 'Venue name',
  address: 'Address',
  maps_url: 'Maps URL',
  dress_code: 'Dress code',
  url: 'Image URL',
  caption: 'Caption',
  question: 'Question',
  answer: 'Answer',
  name: 'Name',
  phone: 'Phone',
  max_guests: 'Max guests',
  group_name: 'Group'
};

const LIST_LABELS: Record<string, string> = {
  dress_code_swatches: 'Dress code color',
  bank_accounts: 'Bank account',
  schedule_items: 'Rundown item'
};

const ITEM_LABELS: Record<string, string> = {
  label: 'name',
  color: 'color',
  bank: 'bank',
  account_number: 'account number',
  account_name: 'account holder',
  time: 'time',
  event: 'event',
  time_start: 'start time',
  time_end: 'end time',
  title: 'title',
  subtitle: 'description'
};

function describe(field: string): string {
  const [path, ...rest] = field.split(' ');
  const parts = path.split('.');
  let label: string;
  if (parts.length === 3 && LIST_LABELS[parts[0]]) {
    label = `${LIST_LABELS[parts[0]]} ${Number(parts[1]) + 1} ${ITEM_LABELS[parts[2]] ?? parts[2]}`;
  } else {
    label = LABELS[parts[0]] ?? parts[0].replace(/_/g, ' ');
  }
  return rest.length ? `${label} (${rest.join(' ')})` : label;
}

export function friendlyError(message: string | undefined, fallback = 'Failed to save.'): string {
  if (!message) return fallback;
  const match = message.match(/^Invalid data: (.+)\.$/);
  if (!match) return message;
  return `Please check: ${match[1].split(', ').map(describe).join(', ')}.`;
}
