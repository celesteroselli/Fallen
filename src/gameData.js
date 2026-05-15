// The story follows a fixed Frankenstein-inspired sequence.
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
          humanity: 2,
          flags: { discoveredFire: true }
        },
        script: [
          {
            speaker: 'Inner Voice',
            role: 'inner',
            text: 'Warmth. Pain. Light. The flame bites, yet I cannot look away from it.'
          },
          {
            speaker: 'Inner Voice',
            role: 'inner',
            text: 'I have entered a world that wounds me before it names me.'
          }
        ],
        choices: []
      }
    ]
  },
  {
    id: 'delacey-forest',
    title: 'The Forest: The De Laceys',
    environment: {
      type: 'village',
      color: '#211b16',
      fog: '#100d0b',
      accent: '#d7ad6d',
      theme: 'hidden cottage'
    },
    objectives: ['Listen at the cottage', 'Decide what the books make of you'],
    objects: [
      {
        id: 'delacey-house',
        label: 'The House',
        kind: 'house',
        position: [0.4, 0.55, -2.7],
        prompt: 'Approach the cottage',
        speaker: 'The Cottage',
        script: [
          {
            speaker: 'Agatha',
            role: 'partner',
            text: 'Father, the wood is nearly gone. The cold will settle before morning.'
          },
          {
            speaker: 'Creature',
            role: 'player',
            text: 'I can carry what they need. I can be useful, even if they never see me.'
          },
          {
            speaker: 'Felix',
            role: 'partner',
            text: 'Someone has been helping us. I do not know whether to bless the kindness or fear the hand that leaves it.'
          },
          {
            speaker: 'Creature',
            role: 'player',
            text: 'Their voices teach me tenderness, and tenderness teaches me shame.'
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
        position: [-2.7, 0.7, 0.8],
        prompt: 'Approach the book',
        speaker: 'Book',
        script: [
          {
            speaker: 'Creature',
            role: 'player',
            text: 'A first man, a fallen angel, a creator who turns away. Which of them am I meant to be?'
          }
        ],
        choices: [
          {
            id: 'read-paradise-lost',
            text: 'Read Paradise Lost',
            effects: {
              humanity: 2,
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
        position: [2.6, 0.7, 0.9],
        prompt: 'Approach the book',
        speaker: 'Book',
        script: [
          {
            speaker: 'Creature',
            role: 'player',
            text: 'Here is a heart that suffers because it can love. I understand too much of him.'
          }
        ],
        choices: [
          {
            id: 'read-werther',
            text: 'Read The Sorrows of Young Werther',
            effects: {
              humanity: 2,
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
        position: [0.1, 0.7, 2.7],
        prompt: 'Approach the book',
        speaker: 'Book',
        script: [
          {
            speaker: 'Creature',
            role: 'player',
            text: 'These noble lives speak of duty and glory. If virtue is learned, perhaps I am not lost.'
          }
        ],
        choices: [
          {
            id: 'read-plutarch',
            text: "Read Plutarch's Lives",
            effects: {
              humanity: 2,
              flags: { readPlutarch: true },
              objectivesComplete: ['Decide what the books make of you']
            }
          },
          {
            id: 'leave-plutarch',
            text: 'Do not read it',
            effects: {
              flags: { refusedPlutarch: true },
              objectivesComplete: ['Decide what the books make of you']
            }
          }
        ]
      }
    ]
  },
  {
    id: 'mountain',
    title: 'The Mountain',
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
          text: 'Begone. Do not force me to look upon what my own hands made.'
        },
        {
          speaker: 'Creature',
          role: 'player',
          text: 'You gave me life, then abandoned me to hunger, cold, and the hatred of every face.'
        },
        {
          speaker: 'Victor',
          role: 'partner',
          text: 'Your misery is terrible, but your crimes are more terrible still.'
        },
        {
          speaker: 'Creature',
          role: 'player',
          text: 'Make me not a monster in solitude. Give me one being who will not recoil.'
        },
        {
          speaker: 'Victor',
          role: 'partner',
          text: 'Your plea has found the man in me, though fear still grips the maker.'
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
      color: '#261915',
      fog: '#110c0a',
      accent: '#c46b58',
      theme: 'human shadows'
    },
    objectives: ['Endure the town', 'Decide Clerval’s fate'],
    sceneStartEffects: {
      health: ({ humanity }) => -Math.ceil(humanity / 4),
      flags: { enteredTown: true }
    },
    objects: [
      {
        id: 'clerval',
        label: 'Clerval',
        kind: 'clerval',
        position: [0, 0.8, -2.6],
        prompt: 'Approach Clerval',
        speaker: 'Clerval',
        script: [
          {
            speaker: 'Clerval',
            role: 'partner',
            text: 'Who is there? I heard a step behind me.'
          },
          {
            speaker: 'Creature',
            role: 'player',
            text: 'He has Victor’s love. He has the human tenderness denied to me.'
          },
          {
            speaker: 'Clerval',
            role: 'partner',
            text: 'Show yourself, friend, and I will help if help is needed.'
          },
          {
            speaker: 'Creature',
            role: 'player',
            text: 'A friend. The word comes too late, and still it wounds.'
          }
        ],
        choices: [
          {
            id: 'murder-clerval',
            text: 'Murder Clerval',
            effects: {
              humanity: -10,
              health: 3,
              exposure: 2,
              flags: { murderedClerval: true },
              objectivesComplete: ['Endure the town', 'Decide Clerval’s fate']
            }
          },
          {
            id: 'spare-clerval',
            text: 'Do not murder Clerval',
            effects: {
              humanity: 3,
              health: -2,
              flags: { sparedClerval: true },
              objectivesComplete: ['Endure the town', 'Decide Clerval’s fate']
            }
          }
        ]
      }
    ]
  },
  {
    id: 'ocean',
    title: 'The Ocean',
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
      health: -10,
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
          text: 'There he lies. My maker, my enemy, my last witness.'
        },
        {
          speaker: 'Walton',
          role: 'partner',
          text: 'If grief can live in such a form, then I have misjudged the boundaries of the human heart.'
        },
        {
          speaker: 'Creature',
          role: 'player',
          text: 'I wanted his suffering, and now his silence is heavier than revenge.'
        },
        {
          speaker: 'Creature',
          role: 'player',
          text: 'If there is mercy left in me, it must be spent upon the world I have harmed.'
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
