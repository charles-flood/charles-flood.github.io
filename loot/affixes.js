//modifiers directly affect base values

const weaponPrefixes = [
        {
            name: "Sharp",
            type: "flat",
            min: 2,
            max: 5,
            modifier: true
        },
        {
            name: "Pointed",
            type: "flat",
            min: 4,
            max: 10,
            modifier: true
        },
        {
            name: "Keen",
            type: "flat",
            min: 6,
            max: 15,
            modifier: true
        },
        {
            name: "Crisp",
            type: "percent",
            min: 20,
            max: 50,
            modifier: true
        },
        {
            name: "Precise",
            type: "percent",
            min: 50,
            max: 100,
            modifier: true
        },
        {
            name: "Fiery",
            type: "Fire damage +",
            min: 1,
            max: 5,
            modifier: false
        },
        {
            name: "Burning",
            type: "Fire damage +",
            min: 3,
            max: 8,
            modifier: false
        },
        {
            name: "Smoldering",
            type: "Fire damage +",
            min: 5,
            max: 12,
            modifier: false
        }
];

const weaponSuffixes = [
        {
            name: "Common",
            chance: 60
        },
        {
            name: "Magic",
            chance: 25
        },
        {
            name: "Rare",
            chance: 10
        }
];