//main starter loot script

// Rarity probabilities
const rarities = [
        {
            name: "Common",
            chance: 20
        },
        {
            name: "Magic",
            chance: 60
        },
        {
            name: "Rare",
            chance: 10
        }
];


// Generate a random number
function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


// Choose a rarity based on probability
function generateRarity() {
    const roll = Math.random() * 100;
    let cumulativeChance = 0;

    for (const rarity of rarities) {
        cumulativeChance += rarity.chance;

        if (roll < cumulativeChance) {
            return rarity.name;
        }
    }

    return "Common";
}

function increaseByPercentage(value, percentage) {
    return Math.round(value * (1 + percentage / 100));
}


// Generate the loot item
function generateLoot() {

    // Pick a random item base
    const item = itemTypes[
        randomNumber(0, itemTypes.length - 1)
    ];

    // Determine rarity
    const rarity = generateRarity();

    // Create result
    let loot = {
        name: item.name,
        type: item.type,
        rarity: rarity
    };


    // Generate stats depending on item type
    if (item.type === "Weapon") {

        loot.minDamage = item.minDamage;
        loot.maxDamage = item.maxDamage;

    } else if (item.type === "Armor") {

        loot.defense = randomNumber(
            item.minDefense,
            item.maxDefense
        );
    }


    // Magic items get a bonus
    if (rarity === "Magic" && item.type === "Weapon") {

        const pref = weaponPrefixes[
        randomNumber(0, weaponPrefixes.length - 1)
        ];

        alert(JSON.stringify(pref));

        loot.name = pref.name + " " + loot.name;

        if(!pref.modifier) {
            
            loot.bonus = pref.type + pref.min.toString() + " - " + pref.max.toString();

        }else{

            if(pref.type === "flat") {

                loot.minDamage = loot.minDamage + pref.min;
                loot.maxDamage = loot.maxDamage + pref.max;

            }else{

                var percentage = parseInt(randomNumber(
                    pref.min,
                    pref.max
                ));

                loot.minDamage = increaseByPercentage(loot.minDamage, percentage);
                loot.maxDamage = increaseByPercentage(loot.maxDamage, percentage);

            }

        }

    }


    // Rare items get multiple bonuses
    if (rarity === "Rare") {

        loot.bonus = [
            "+15% Attack Speed",
            "+10 Strength"
        ];

    }


    // Unique items get a special property
    if (rarity === "Unique") {

        loot.bonus = "+25% Fire Damage";

    }


    return loot;
}


// Display the loot
function displayLoot(loot) {

    const result = document.getElementById("lootResult");

    let html = `
        <h2>${loot.name}</h2>
        <p>Type: ${loot.type}</p>
    `;

    if (loot.minDamage) {
        html += `<p>Damage: ${loot.minDamage} - ${loot.maxDamage}</p>`;
    }

    if (loot.defense) {
        html += `<p>Defense: ${loot.defense}</p>`;
    }

    if (loot.bonus) {

        if (Array.isArray(loot.bonus)) {

            html += `<p>Bonuses:</p><ul>`;

            loot.bonus.forEach(bonus => {
                html += `<li>${bonus}</li>`;
            });

            html += `</ul>`;

        } else {

            html += `<p>Bonus: ${loot.bonus}</p>`;

        }
    }

    result.innerHTML = html;
}


// Button press
document.getElementById('myButton').addEventListener('click', () => {

    const loot = generateLoot();

    displayLoot(loot);

});
