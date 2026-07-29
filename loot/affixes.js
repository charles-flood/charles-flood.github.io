
//TODO update affix to suit weapon and armor types
//modifiers directly affect base values

const weaponPrefixes = [
        {
            name: "Sharp",
            type: "Damage ",
            min: 2,
            max: 5,
            modifier: true
        },
        {
            name: "Pointed",
            type: "Damage ",
            min: 4,
            max: 10,
            modifier: true
        },
        {
            name: "Keen",
            type: "Damage ",
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
            type: "Fire damage ",
            min: 1,
            max: 5,
            modifier: true
        },
        {
            name: "Burning",
            type: "Fire damage ",
            min: 3,
            max: 8,
            modifier: true
        },
        {
            name: "Smoldering",
            type: "Fire damage ",
            min: 5,
            max: 12,
            modifier: true
        }
];

// flat dmg modifier names of power, might, force, ruin, destruction, slaughter, fury, wrath, brutality, devastation, carnage.....

const weaponSuffixes = [
        {
            name: "of Power",
            type: "Damage ",
            min: 3,
            max: 8,
            modifier: true
        },
        {
            name: "of Might",
            type: "Damage ",
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
            type: "Fire damage ",
            min: 3,
            max: 8,
            modifier: true
        },
        {
            name: "of Embers",
            type: "Fire damage ",
            min: 5,
            max: 12,
            modifier: true
        },
        {
            name: "of the Ox",
            type: "Strngth ",
            min: 5,
            max: 15,
            modifier: false
        },
        {
            name: "of the Titans",
            type: "Strength ",
            min: 15,
            max: 30,
            modifier: false
        }
        
];

//armor section

const armorPrefixes = [
        {
            name: "Solid",
            type: "Defense ",
            min: 25,
            max: 50,
            modifier: true
        },
        {
            name: "Granite",
            type: "Defense ",
            min: 75,
            max: 100,
            modifier: true
        },
        {
            name: "Sturdy",
            type: "Defense increased by ",
            min: 50,
            max: 100,
            modifier: true
        },
        {
            name: "Collosal",
            type: "Defense increased by ",
            min: 150,
            max: 200,
            modifier: true
        },
        {
            name: "Chroma",
            type: "All resist ",
            min: 2,
            max: 20,
            modifier: false
        },
        {
            name: "Garnet",
            type: "Fire resist ",
            min: 5,
            max: 30,
            modifier: false
        },
        {
            name: "Lapis",
            type: "Cold resist ",
            min: 5,
            max: 30,
            modifier: false
        },
        {
            name: "Amber",
            type: "Lightning resist ",
            min: 5,
            max: 30,
            modifier: false
        }
];

const armorSuffixes = [
        {
            name: "of Gravel",
            type: "Defense ",
            min: 10,
            max: 50,
            modifier: true
        },
        {
            name: "of the Stoat",
            type: "Agility ",
            min: 5,
            max: 15,
            modifier: false
        },
        {
            name: "of the Ape",
            type: "Strength ",
            min: 5,
            max: 15,
            modifier: false
        },
        {
            name: "of the Owl",
            type: "Intellect ",
            min: 5,
            max: 15,
            modifier: false
        },
        {
            name: "of the Deer",
            type: "Life ",
            min: 10,
            max: 25,
            modifier: false
        },
        {
            name: "of the Hippo",
            type: "Life ",
            min: 20,
            max: 50,
            modifier: false
        },
        {
            name: "of the Elephant",
            type: "Life ",
            min: 50,
            max: 100,
            modifier: false
        },
        {
            name: "of the Sneaky Snake",
            type: "Mana ",
            min: 15,
            max: 30,
            modifier: false
        }
        
];