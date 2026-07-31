
//TODO update affix to suit weapon and armor types
//modifiers directly affect base values

const weaponPrefixes = [
    {
        id: 1,
        name: "Crisp",
        type: "Damage increased by ",
        min: 20,
        max: 50,
        modifier: true
    },
    {
        id: 2,
        name: "Precise",
        type: "Damage increased by ",
        min: 50,
        max: 100,
        modifier: true
    },
    {
        id: 3,
        name: "Sharp",
        type: "Damage ",
        min: 2,
        max: 5,
        modifier: true
    },
    {
        id: 4,
        name: "Pointed",
        type: "Damage ",
        min: 4,
        max: 10,
        modifier: true
    },
    {
        id: 5,
        name: "Keen",
        type: "Damage ",
        min: 6,
        max: 15,
        modifier: true
    },
    {
        id: 6,
        name: "Fiery",
        type: "Fire damage ",
        min: 1,
        max: 5,
        modifier: true
    },
    {
        id: 7,
        name: "Burning",
        type: "Fire damage ",
        min: 3,
        max: 8,
        modifier: true
    },
    {
        id: 8,
        name: "Smoldering",
        type: "Fire damage ",
        min: 5,
        max: 12,
        modifier: true
    }
];

const weaponSuffixes = [
    {
        id: 9,
        name: "of Power",
        type: "Damage ",
        min: 3,
        max: 8,
        modifier: true
    },
    {
        id: 10,
        name: "of Might",
        type: "Damage ",
        min: 5,
        max: 12,
        modifier: true
    },
    {
        id: 11,
        name: "of Flame",
        type: "Fire damage ",
        min: 3,
        max: 8,
        modifier: true
    },
    {
        id: 12,
        name: "of Embers",
        type: "Fire damage ",
        min: 5,
        max: 12,
        modifier: true
    },
    {
        id: 13,
        name: "of the Ox",
        type: "Strength ",
        min: 5,
        max: 15,
        modifier: false
    },
    {
        id: 14,
        name: "of the Titans",
        type: "Strength ",
        min: 15,
        max: 30,
        modifier: false
    }
];

// armor section

const armorPrefixes = [
    {
        id: 15,
        name: "Sturdy",
        type: "Defense increased by ",
        min: 50,
        max: 100,
        modifier: true
    },
    {
        id: 16,
        name: "Collosal",
        type: "Defense increased by ",
        min: 150,
        max: 200,
        modifier: true
    },
    {
        id: 17,
        name: "Solid",
        type: "Defense ",
        min: 25,
        max: 50,
        modifier: true
    },
    {
        id: 18,
        name: "Granite",
        type: "Defense ",
        min: 75,
        max: 100,
        modifier: true
    },
    {
        id: 19,
        name: "Chroma",
        type: "All resist ",
        min: 2,
        max: 20,
        modifier: false
    },
    {
        id: 20,
        name: "Garnet",
        type: "Fire resist ",
        min: 5,
        max: 30,
        modifier: false
    },
    {
        id: 21,
        name: "Lapis",
        type: "Cold resist ",
        min: 5,
        max: 30,
        modifier: false
    },
    {
        id: 22,
        name: "Amber",
        type: "Lightning resist ",
        min: 5,
        max: 30,
        modifier: false
    }
];

const armorSuffixes = [
    {
        id: 23,
        name: "of Gravel",
        type: "Defense ",
        min: 10,
        max: 50,
        modifier: true
    },
    {
        id: 24,
        name: "of the Stoat",
        type: "Agility ",
        min: 5,
        max: 15,
        modifier: false
    },
    {
        id: 25,
        name: "of the Ape",
        type: "Strength ",
        min: 5,
        max: 15,
        modifier: false
    },
    {
        id: 26,
        name: "of the Owl",
        type: "Intellect ",
        min: 5,
        max: 15,
        modifier: false
    },
    {
        id: 27,
        name: "of the Deer",
        type: "Life ",
        min: 10,
        max: 25,
        modifier: false
    },
    {
        id: 28,
        name: "of the Hippo",
        type: "Life ",
        min: 20,
        max: 50,
        modifier: false
    },
    {
        id: 29,
        name: "of the Elephant",
        type: "Life ",
        min: 50,
        max: 100,
        modifier: false
    },
    {
        id: 30,
        name: "of the Sneaky Snake",
        type: "Mana ",
        min: 15,
        max: 30,
        modifier: false
    }
];