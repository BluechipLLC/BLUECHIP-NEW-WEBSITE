export type Client = {
  name: string;
  /** Tile color shown behind media and in the detail panel. */
  color: string;
  /** Case study slug, when the client has a /work/<slug> page. */
  caseStudy?: string;
  description?: string;
};

export const clients: Client[] = [
  { name: 'Cold Harbor', color: '#173e39', caseStudy: 'cold-harbor', description: 'A coffee brand identity expressed across packaging, pattern and everyday objects.' },
  { name: 'Natty', color: '#d2242d', caseStudy: 'natty', description: 'A consumer wellness brand created by Bluechip’s founder, with identity and packaging artwork.' },
  { name: 'The Den', color: '#25201b', caseStudy: 'the-den', description: 'A barber brand presented through identity and branded applications.' },
  { name: 'Cafe Owned By', color: '#102b43', caseStudy: 'owned-by', description: 'A café identity explored across packaging and promotional concepts.' },
  { name: 'Conway’s Landscaping', color: '#426f39', caseStudy: 'conways', description: 'A landscaping identity with logo and business card artwork.' },
  { name: 'Bradley Landscaping', color: '#334d32' },
  { name: 'Monson Self Storage', color: '#4a5560' },
  { name: 'Eastern Security Safe', color: '#354554' },
  { name: 'Shuflr', color: '#38567a' },
  { name: 'Macy Lee', color: '#c4222b' },
  { name: 'Alexis Rose Photography', color: '#514445' },
  { name: 'Mackoul Electric', color: '#344a59' },
  { name: 'Why Buy Rentals', color: '#3f4c9c' },
  { name: 'Tree Wizard', color: '#3a543d' },
  { name: 'Aqua Dreams', color: '#387e96' },
  { name: 'Shlerk', color: '#15182d' },
  { name: 'Mestek', color: '#4d5a64' },
  { name: 'Dargie’s Vinyl Dreams', color: '#52565c' },
  { name: 'Elite Tree & Snow', color: '#536357' },
  { name: 'Lunch Ladies', color: '#68625a' },
  { name: 'Italian Feast', color: '#625b56' },
  { name: 'Richard Neal', color: '#465261' },
];

export const fallbackClientDescription = 'A project from the Bluechip portfolio. More details are coming soon.';
