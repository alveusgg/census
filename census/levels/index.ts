import { z } from 'zod';
import { achievement, PayloadFor } from './helpers.js';

export const levels = {
  initial: {
    number: 0,
    points: 0,
    name: 'Initial'
  },
  beetle_larvae: {
    number: 1,
    points: 300,
    name: 'Larvae',

    sticker: {
      scale: 0.8,
      artwork: {
        type: 'assets',
        name: 'stag_beetle_larvae.outlined.png'
      },
      silhouette: {
        type: 'assets',
        name: 'stag_beetle_larvae.silhouette.svg'
      }
    }
  },
  beetle_pupa: {
    number: 2,
    points: 900,
    name: 'Pupa',

    sticker: {
      artwork: {
        type: 'assets',
        name: 'stag_beetle_pupa.outlined.png'
      },
      silhouette: {
        type: 'assets',
        name: 'stag_beetle_pupa.silhouette.svg'
      }
    }
  },
  beetle: {
    number: 3,
    points: 1500,
    name: 'Beetle',

    sticker: {
      artwork: {
        type: 'assets',
        name: 'adult_stag_beetle.outlined.png'
      },
      silhouette: {
        type: 'assets',
        name: 'adult_stag_beetle.silhouette.svg'
      }
    }
  },
  ladybird_eggs: {
    number: 4,
    points: 2500,
    name: 'Larvae',

    sticker: {
      scale: 1,
      artwork: {
        type: 'assets',
        name: 'ladybird_eggs.outlined.png'
      },
      silhouette: {
        type: 'assets',
        name: 'ladybird_eggs.silhouette.svg'
      }
    }
  },
  ladybird_larvae: {
    number: 5,
    points: 3500,
    name: 'Pupa',

    sticker: {
      scale: 1.2,
      artwork: {
        type: 'assets',
        name: 'ladybird_larvae.outlined.png'
      },
      silhouette: {
        type: 'assets',
        name: 'ladybird_larvae.silhouette.svg'
      }
    }
  },
  ladybird: {
    number: 6,
    points: 4500,
    name: 'Ladybug',

    sticker: {
      artwork: {
        type: 'assets',
        name: 'adult_ladybird.outlined.png'
      },
      silhouette: {
        type: 'assets',
        name: 'adult_ladybird.silhouette.svg'
      }
    }
  },
  spider_egg_sack: {
    number: 7,
    points: 5500,
    name: 'Egg Sack',

    sticker: {
      artwork: {
        type: 'assets',
        name: 'spider_egg_sack.outlined.png'
      },
      silhouette: {
        type: 'assets',
        name: 'spider_egg_sack.silhouette.svg'
      }
    }
  },
  spiderlings: {
    number: 8,
    points: 6500,
    name: 'Spiderlings',

    sticker: {
      artwork: {
        type: 'assets',
        name: 'spiderlings.outlined.png'
      },
      silhouette: {
        type: 'assets',
        name: 'spiderlings.silhouette.svg'
      }
    }
  },
  spider: {
    number: 9,
    points: 7500,
    name: 'Spider',

    sticker: {
      scale: 1.6,
      artwork: {
        type: 'assets',
        name: 'adult_spider.outlined.png'
      },
      silhouette: {
        type: 'assets',
        name: 'adult_spider.silhouette.svg'
      }
    }
  },
  butterfly_caterpillar: {
    number: 10,
    points: 8500,
    name: 'Caterpillar',

    sticker: {
      scale: 1.2,
      artwork: {
        type: 'assets',
        name: 'caterpillar.outlined.png'
      },
      silhouette: {
        type: 'assets',
        name: 'caterpillar.silhouette.svg'
      }
    }
  },
  butterfly_chrysalis: {
    number: 11,
    points: 9500,
    name: 'Chrysalis',

    sticker: {
      scale: 1.6,
      artwork: {
        type: 'assets',
        name: 'butterfly_chrysalis.outlined.png'
      },
      silhouette: {
        type: 'assets',
        name: 'butterfly_chrysalis.silhouette.svg'
      }
    }
  },
  butterfly: {
    number: 12,
    points: 10500,
    name: 'Butterfly',

    sticker: {
      artwork: {
        type: 'assets',
        name: 'adult_butterfly.outlined.png'
      },
      silhouette: {
        type: 'assets',
        name: 'adult_butterfly.silhouette.svg'
      }
    }
  }
};

const observe = achievement('observe', 150, z.object({ captureId: z.number() }));
const vote = achievement('vote', 10, z.object({ identificationId: z.number() }));
const comment = achievement('comment', 30, z.object({ identificationId: z.number() }));
const onboard = achievement('onboard', 200, z.object({ message: z.string(), publicMessage: z.string().optional() }));
const identify = achievement('identify', 300, z.object({ identificationId: z.number() }));
const assist = achievement('assist', 20, z.object({ identificationId: z.number() }));
const shiny = achievement('shiny', 1000, z.object({ identificationId: z.number() }));

export const registry = {
  vote,
  assist,
  onboard,
  comment,
  identify,
  shiny,
  observe
};

export type Actions = keyof typeof registry;
export type AchievementPayload<K extends Actions> = PayloadFor<(typeof registry)[K]>;
type PayloadMap = {
  [K in Actions]: AchievementPayload<K>;
};

export type AnyAchievementPayload = PayloadMap[keyof PayloadMap];
