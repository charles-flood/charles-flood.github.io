//modifiers directly affect base values

const weaponPrefixes = [
        {
            name: "Sharp",
            type: "Damage + ",
            min: 2,
            max: 5,
            modifier: true
        },
        {
            name: "Pointed",
            type: "Damage + ",
            min: 4,
            max: 10,
            modifier: true
        },
        {
            name: "Keen",
            type: "Damage + ",
            min: 6,
            max: 15,
            modifier: true
        },
        {
            name: "Crisp",
            type: "Damage increased by ",
            min: 20,
            max: 50,
            modifier: true
        },
        {
            name: "Precise",
            type: "Damage increased by ",
            min: 50,
            max: 100,
            modifier: true
        },
        {
            name: "Fiery",
            type: "Fire damage + ",
            min: 1,
            max: 5,
            modifier: true
        },
        {
            name: "Burning",
            type: "Fire damage + ",
            min: 3,
            max: 8,
            modifier: true
        },
        {
            name: "Smoldering",
            type: "Fire damage + ",
            min: 5,
            max: 12,
            modifier: true
        }
];

// flat dmg modifier names of power, might, force, ruin, destruction, slaughter, fury, wrath, brutality, devastation, carnage.....

const weaponSuffixes = [
        {
            name: "of Power",
            type: "Damage + ",
            min: 3,
            max: 8,
            modifier: true
        },
        {
            name: "of Might",
            type: "Damage + ",
            min: 5,
            max: 12,
            modifier: true
        },
        {
            name: "of Force",
            type: "Damage increased by ",
            min: 20,
            max: 50,
            modifier: true
        },
        {
            name: "of Flame",
            type: "Fire damage + ",
            min: 3,
            max: 8,
            modifier: true
        },
        {
            name: "of Embers",
            type: "Fire damage + ",
            min: 5,
            max: 12,
            modifier: true
        },
        {
            name: "of the Ox",
            type: "Strngth + ",
            min: 5,
            max: 15,
            modifier: false
        },
        {
            name: "of the Titans",
            type: "Strength + ",
            min: 15,
            max: 30,
            modifier: false
        }
        
];