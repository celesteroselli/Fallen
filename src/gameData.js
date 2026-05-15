// Add scenes by appending to this array. Add object conversations with:
// script: [{ speaker, role, text }], choices: [{ text, effects }]
// Effects change state only; they never choose the next scene.
// Effect values may be numbers or functions that receive current stats.

export const scenes = [
  {
    id: 'new-world',
    title: 'A New World',
    environment: {
      type: 'forest',
      color: '#151d16',
      fog: '#090d0a',
      accent: '#ff9b45',
      theme: 'first fire'
    },
    objectives: [],
    objects: [
      {
        id: 'campfire',
        label: 'Campfire',
        kind: 'fire',
        position: [0, 0.35, 2.7],
        prompt: 'Approach the fire',
        speaker: 'Inner Voice',
        autoEffects: {
          health: -2,
          humanity: 5,
          flags: { discoveredFire: true }
        },
        script: [
          {
            speaker: 'Inner Voice',
            role: 'inner',
            text: 'One day, when I was oppressed by cold, I found a fire which had been left by some wandering beggars, and was overcome with delight at the warmth I had experienced from it (75).'
          },
          {
            speaker: 'Inner Voice',
            role: 'inner',
            text: 'In my joy, I thrust my hand into the live embers, but quickly drew it out again with a cry of pain. How strange, I thought, that the same cause should produce such opposite effects (75)!'
          }
        ],
        choices: []
      }
    ]
  },
  {
    id: 'delacey-forest',
    title: 'The Forest',
    environment: {
      type: 'village',
      color: '#211b16',
      fog: '#100d0b',
      accent: '#1d4827ff',
      theme: 'hidden cottage'
    },
    objectives: ['Listen at the cottage', 'Look at the books'],
    objects: [
      {
        id: 'delacey-house',
        label: 'The House',
        kind: 'house',
        position: [0, 1, -2.5],
        prompt: 'Approach the cottage',
        speaker: 'The Cottage',
        script: [
          {
            speaker: 'Inner Voice',
            role: 'inner',
            text: 'What chiefly struck me was the gentle manners of these people; and I longed to join them, but dared not (80).'
          },
          {
            speaker: 'Inner Voice',
            role: 'inner',
            text: 'I discovered also another means through which I was enabled to assist their labours. I found that the youth spent a great part of each day in collecting wood for the family fire, and during the night I often took his tools, the use of which I quickly discovered, and brought home firing sufficient for the consumption of several days (81).'
          },
          {
            speaker: 'Inner Voice',
            role: 'inner',
            text: 'I afterwards found that these labours, performed by an invisible hand, greatly astonished them; and once or twice I heard them, on these occasions, utter the words good spirit, wonderful; but I did not then understand the significance of these terms (83)'
          }
        ],
        choices: [
          {
            id: 'bring-firewood',
            text: 'Bring them firewood',
            effects: {
              humanity: 10,
              health: ({ humanity }) => (humanity >= 6 ? -3 : -2),
              flags: { helpedDeLaceys: true },
              objectivesComplete: ['Listen at the cottage']
            }
          },
          {
            id: 'stay-hidden',
            text: 'Stay hidden in the trees',
            effects: {
              health: 5,
              flags: { stayedHidden: true },
              objectivesComplete: ['Listen at the cottage']
            }
          }
        ]
      },
      {
        id: 'paradise-lost',
        label: 'Paradise Lost',
        kind: 'book',
        position: [-2.7, -0.2, 0.8],
        prompt: 'Approach the book',
        speaker: 'Book',
        script: [
          {
            speaker: 'Inner Voice',
            role: 'inner',
            text: 'It moved every feeling of wonder and aw3, that the picture of an omnipotent God warring with his creatures was capable of exciting... Like Adam, I was created apparently united by no link to any other being in existence (94).'
          }
        ],
        choices: [
          {
            id: 'read-paradise-lost',
            text: 'Read Paradise Lost',
            effects: {
              humanity: 5,
              flags: { readParadiseLost: true }
            }
          },
          {
            id: 'leave-paradise-lost',
            text: 'Do not read it',
            effects: {
              flags: { refusedParadiseLost: true }
            }
          }
        ]
      },
      {
        id: 'werther',
        label: 'Werther',
        kind: 'book',
        position: [2.6, -0.2, 0.9],
        prompt: 'Approach the book',
        speaker: 'Book',
        script: [
          {
            speaker: 'Inner Voice',
            role: 'inner',
            text: '...besides the interest of its simple and affecting story, so many opinions are canvassed, and so many lights thrown upon what had hitherto been to me obscure subjects, that I found in it a never-ending source of speculation and astonishment (93).'
          }
        ],
        choices: [
          {
            id: 'read-werther',
            text: 'Read The Sorrows of Young Werther',
            effects: {
              humanity: 5,
              flags: { readWerther: true }
            }
          },
          {
            id: 'leave-werther',
            text: 'Do not read it',
            effects: {
              flags: { refusedWerther: true }
            }
          }
        ]
      },
      {
        id: 'plutarch',
        label: "Plutarch's Lives",
        kind: 'book',
        position: [0.1, -0.2, 2.7],
        prompt: 'Approach the book',
        speaker: 'Book',
        script: [
          {
            speaker: 'Inner Voice',
            role: 'inner',
            text: 'This book had a far different effect upon me from the Sorrows of Werter... Plutarch taught me high thoughts; he elevated me above the wretched sphere of my own reflections, to admire and love the heroes of past ages (94).'
          }
        ],
        choices: [
          {
            id: 'read-plutarch',
            text: "Read Plutarch's Lives",
            effects: {
              humanity: 5,
              flags: { readPlutarch: true },
              objectivesComplete: ['Look at the books']
            }
          },
          {
            id: 'leave-plutarch',
            text: 'Do not read it',
            effects: {
              flags: { refusedPlutarch: true },
              objectivesComplete: ['Look at the books']
            }
          }
        ]
      }
    ]
  },
  {
    id: 'mountain',
    title: 'The Mountain',
    presentation: 'literary',
    environment: {
      type: 'cave',
      color: '#151820',
      fog: '#090b10',
      accent: '#9fc7ff',
      theme: 'icy height'
    },
    objectives: ['Confront Victor'],
    sceneStartEffects: {
      health: ({ humanity }) => -Math.ceil(humanity / 3),
      flags: { mountainConversation: true }
    },
    cutscene: {
      id: 'victor-confrontation',
      label: 'Victor Frankenstein',
      speaker: 'Victor',
      script: [
        {
          speaker: 'Victor',
          role: 'partner',
          text: 'Devil, do you dare approach me? And do not you fear the fierce vengeance of my arm wreaked on your miserable head? (72).'
        },
        {
          speaker: 'Creature',
          role: 'player',
          text: 'Everywhere I see bliss, from which I alone am irrevocably excluded. I was benevolent and good; misery made me a fiend. Make me happy, and I shall again be virtuous (72).'
        },
        {
          speaker: 'Victor',
          role: 'partner',
          text: 'Begone, vile insect! Or rather, stay, that I may trample you to dust! (72).'
        },
        {
          speaker: 'Creature',
          role: 'player',
          text: 'All men hate the wretched; how, then, must I be hated, who am miserable beyond all living things! Yet you, my creator, detest and spurn me, thy creature, to whom thou art bound by ties only dissoluble by the annihilation of one of us. You purpose to kill me. How dare you sport thus with life? (72).'
        },
        {
          speaker: 'Victor',
          role: 'partner',
          text: 'Abhorred monster! Fiend that thou art! The tortures of hell are too mild a vengeance for thy crimes. Wretched devil! You reproach me with your creation, come on, then, that I may extinguish the spark which I so negligently bestowed (72).'
        }
      ],
      choices: []
    },
    objects: []
  },
  {
    id: 'town',
    title: 'The Town',
    environment: {
      type: 'village',
      color: '#100908',
      fog: '#1e1515ff',
      accent: '#7d1313',
      ambientIntensity: 0.34,
      theme: 'human shadows'
    },
    objectives: ['Endure the town', 'Meet Clerval'],
    sceneStartEffects: {
      health: ({ humanity }) => -Math.ceil(humanity / 4),
      flags: { enteredTown: true }
    },
    shadowPeople: [
      {
        id: 'town-shadow-1',
        image: '/images/shadow-person-1.png',
        position: [-3.1, 0.6, -1.6],
        scale: 1.95
      },
      {
        id: 'town-shadow-2',
        image: '/images/shadow-person-2.png',
        position: [3.2, 0.6, -0.7],
        scale: 1.75
      },
      {
        id: 'town-shadow-3',
        image: '/images/shadow-person-3.png',
        position: [-1.5, 0.6, 3.0],
        scale: 1.85
      },
      {
        id: 'town-shadow-4',
        image: '/images/shadow-person-1.png',
        position: [2.1, 0.6, 3.4],
        scale: 1.65
      }
    ],
    backdropHouses: [
      {
        id: 'town-house-back-left',
        position: [-3.7, 0, -3.2],
        rotationY: 2.75,
        scale: 0.28,
        variant: 1
      },
      {
        id: 'town-house-back-center',
        position: [-0.2, 0, -3.7],
        rotationY: Math.PI,
        scale: 0.22,
        variant: 3
      },
      {
        id: 'town-house-back-right',
        position: [3.7, 0, -3.1],
        rotationY: 3.55,
        scale: 0.28,
        variant: 1
      },
      {
        id: 'town-house-side-left',
        position: [-5.0, 0, 0.4],
        rotationY: 1.45,
        scale: 0.22,
        variant: 3
      },
      {
        id: 'town-house-side-right',
        position: [5.0, 0, 0.8],
        rotationY: -1.35,
        scale: 0.28,
        variant: 1
      }
    ],
    objects: [
      {
        id: 'clerval',
        label: 'Clerval',
        kind: 'clerval',
        position: [0, -0.4, -2.6],
        prompt: 'Approach Clerval',
        speaker: 'Clerval',
        script: [
          {
            speaker: 'Clerval',
            role: 'partner',
            text: 'Who is there?'
          },
          {
            speaker: 'Inner Voice',
            role: 'inner',
            text: 'For a long time, I could not conceive how one man could go forth to murder his fellow, or even why there were laws and governments (87).'
          },
          {
            speaker: 'Inner Voice',
            role: 'inner',
            text: 'My rage was without bounds; I sprang on him, impelled by all the feelings which can arm one being against the existence of another (72).'
          },
        ],
        choices: [
          {
            id: 'murder-clerval',
            text: 'Murder Clerval',
            effects: {
              humanity: -15,
              health: 5,
              flags: { murderedClerval: true },
              objectivesComplete: ['Endure the town', 'Meet Clerval']
            }
          },
          {
            id: 'spare-clerval',
            text: 'Do not murder Clerval',
            effects: {
              humanity: 15,
              health: -5,
              flags: { sparedClerval: true },
              objectivesComplete: ['Endure the town', 'Meet Clerval']
            }
          }
        ]
      }
    ]
  },
  {
    id: 'ocean',
    title: 'The Ocean',
    presentation: 'literary',
    environment: {
      type: 'chamber',
      color: '#0e1720',
      fog: '#05080c',
      accent: '#9ec4d6',
      theme: 'arctic sea'
    },
    objectives: ['Face Victor’s body', 'Choose your last act'],
    sceneStartEffects: {
      humanity: 10,
      health: -5,
      flags: { sawVictorDead: true }
    },
    cutscene: {
      id: 'victor-dead',
      label: 'Victor’s Body',
      speaker: 'Creature',
      script: [
        {
          speaker: 'Creature',
          role: 'player',
          text: 'But it is even so; the fallen angel becomes a malignant devil. Yet even that enemy of God and man had friends and associates in his desolation; I am quite alone (166).'
        },
        {
          speaker: 'Walton',
          role: 'partner',
          text: 'He was soon borne away by the waves, and lost in darkness and distance (168).'
        },
        {
          speaker: 'Creature',
          role: 'player',
          text: 'He is dead who called me into being; and when I shall be no more, the very remembrance of us both will speedily vanish (167).'
        },
        {
          speaker: 'Creature',
          role: 'player',
          text: 'Polluted by crimes, and torn by the bitterest remorse, where can I find rest but in death? (167). But... Why did I live? Why, in that instant, did I not extinguish the spark of existence which you had so wantonly bestowed? I know not (99).'
        }
      ],
      choices: [
        {
          id: 'end-life',
          text: 'Kill yourself',
          requiresHumanity: 10,
          effects: {
            flags: { ending: 'selfImmolation' }
          }
        },
        {
          id: 'refuse-death',
          text: 'Do not kill yourself',
          effects: {
            flags: { ending: 'wandering' }
          }
        }
      ]
    },
    objects: []
  }
];
