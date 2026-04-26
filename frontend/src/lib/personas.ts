// Four seeded backend wallet addresses (matches backend prisma/seed.ts).
export const SEEDED_ADDRESSES = [
  '0x1111111111111111111111111111111111111111',
  '0x2222222222222222222222222222222222222222',
  '0x3333333333333333333333333333333333333333',
  '0x4444444444444444444444444444444444444444',
] as const;
export type SeededAddress = (typeof SEEDED_ADDRESSES)[number];

export interface UserPersona {
  label: string;
  lines: [string, string];
}

export const USER_PERSONAS: Record<SeededAddress, UserPersona> = {
  '0x1111111111111111111111111111111111111111': {
    label: 'Whale Vault depositor',
    lines: [
      'Single large vault deposit opened on day 0.',
      'Shows a long, undisturbed position accruing at its locked vault rate.',
    ],
  },
  '0x2222222222222222222222222222222222222222': {
    label: 'Vault DCA depositor',
    lines: [
      'Recurring weekly deposits into the same stable vault.',
      'Older shards earn higher time multipliers than newer ones.',
    ],
  },
  '0x3333333333333333333333333333333333333333': {
    label: 'Mixed direct + vault depositor',
    lines: [
      'Combines two vault deposits with one direct LP position.',
      'Useful for comparing entrypoints and locked rates in one wallet.',
    ],
  },
  '0x4444444444444444444444444444444444444444': {
    label: 'High-frequency direct LP',
    lines: [
      'Seven direct positions opened across multiple pools.',
      'Stress-tests many same-entrypoint shards with different ages.',
    ],
  },
};
