export const PACKS = [
  {
    id: 'cathedrals', title: 'Cathedrals', blurb: 'Nave, spire and flying buttress',
    words: ['NAVE', 'APSE', 'SPIRE', 'BUTTRESS', 'VAULT', 'CLOISTER', 'TRANSEPT', 'GARGOYLE', 'CHOIR', 'ALTAR', 'ARCH', 'CRYPT', 'TRACERY', 'PINNACLE', 'LANCET', 'ROSE']
  },
  {
    id: 'libraries', title: 'Old libraries', blurb: 'Ink, vellum and ladders on rails',
    words: ['SCROLL', 'FOLIO', 'QUILL', 'VELLUM', 'ARCHIVE', 'LEDGER', 'CODEX', 'SHELF', 'LADDER', 'MANUSCRIPT', 'INK', 'ATLAS', 'PARCHMENT', 'INDEX', 'READER', 'BINDING']
  },
  {
    id: 'mzansi', title: 'Mzansi', blurb: 'Braai, biltong and the Karoo',
    words: ['SPRINGBOK', 'FYNBOS', 'BRAAI', 'KAROO', 'BILTONG', 'ROOIBOS', 'PROTEA', 'KRUGER', 'DRAKENSBERG', 'UBUNTU', 'SAFARI', 'LEKKER', 'BOEREWORS', 'WINELANDS']
  },
  {
    id: 'wildlife', title: 'Wildlife', blurb: 'The big five and friends',
    words: ['LION', 'ZEBRA', 'GIRAFFE', 'ELEPHANT', 'RHINO', 'CHEETAH', 'HYENA', 'WARTHOG', 'IMPALA', 'MEERKAT', 'BUFFALO', 'LEOPARD', 'KUDU', 'JACKAL']
  },
  {
    id: 'cinema', title: 'At the cinema', blurb: 'Frames, scenes and credits',
    words: ['DIRECTOR', 'SCRIPT', 'SCENE', 'CAMERA', 'FRAME', 'ACTOR', 'SCREEN', 'EDITOR', 'TRAILER', 'SEQUEL', 'CREDITS', 'PLOT', 'SOUNDTRACK', 'CLOSEUP']
  },
  {
    id: 'kitchen', title: 'In the kitchen', blurb: 'Whisk, simmer and season',
    words: ['WHISK', 'SIMMER', 'SEASON', 'ROAST', 'KNEAD', 'PEPPER', 'GARLIC', 'SAUCEPAN', 'LADLE', 'GRATER', 'BASIL', 'CINNAMON', 'DOUGH', 'PANTRY']
  }
];

export const packById = id => PACKS.find(p => p.id === id);

/** One puzzle a day, the same for everybody: the date picks the pack and the seed. */
export function dailyDef(date = new Date()) {
  const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
  const day = Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  const pack = PACKS[day % PACKS.length];
  return {
    title: `Daily · ${pack.title}`,
    words: pack.words, size: 13, level: 'medium', seed: day * 7919 + 13, message: '',
    daily: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  };
}
