//main starter loot script

// Rarity probabilities
const rarities = [
        {
            name: "Common",
            chance: 10
        },
        {
            name: "Magic",
            chance: 10
        },
        {
            name: "Rare",
            chance: 90
        }
];

const prefixChance = 50;
const suffixChance = 50;


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
    return parseInt(Math.round(value * (1 + percentage / 100)));
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


    // add base stats to item
    if (item.type === "Weapon") {

        //weapon dmg stats are static
        loot.minDamage = item.minDamage;
        loot.maxDamage = item.maxDamage;

    } else if (item.type === "Armor") {

        //armor stats are a range
        loot.defense = randomNumber(
            item.minDefense,
            item.maxDefense
        );
    }

    // Magic items get a bonus
    if (rarity === "Magic" && item.type === "Weapon") {

        //roll for prefix/suffix/both
        let hasPrefix = Math.random() * 100 < prefixChance;
        let hasSuffix = Math.random() * 100 < suffixChance;

        //item is magic, force at least 1 prefix or suffix if both rolled false
        if(!hasPrefix && !hasSuffix){

            if (Math.random() < 0.5) {
                hasPrefix = true;
            } else {
                hasSuffix = true;
            }

        }

        // hasPrefix = true;
        // hasSuffix = true;

        let prefWeaponModifier = 0;
        let suffWeaponModifier = 0;

        //prefix
        if(hasPrefix){

            //grab prefix
            const pref = weaponPrefixes[
            randomNumber(0, weaponPrefixes.length - 1)
            ];

            //update item name
            loot.name = pref.name + " " + loot.name;

            //attach prefix
            loot.prefix = pref;

            prefWeaponModifier = randomNumber(pref.min, pref.max);
            
        }

        //suffix
        if(hasSuffix){

            //grab suffix
            const suff = weaponSuffixes[
            randomNumber(0, weaponSuffixes.length - 1)
            ];

            //update item name
            loot.name = loot.name + " " + suff.name;

            //attach prefix
            loot.suffix = suff;

            suffWeaponModifier = randomNumber(suff.min, suff.max);

        }

        //alert(JSON.stringify(loot));

        //add bonuses to item and adjust dmg if needed
        if(hasPrefix && hasSuffix){

            let pref = loot.prefix;
            let suff = loot.suffix;

            // cater for identical types first
            if(pref.type == suff.type){

                if(pref.modifier){

                    if(pref.type.includes("increased")){

                        let fullPercentage = prefWeaponModifier + suffWeaponModifier;

                        loot.minDamage = increaseByPercentage(loot.minDamage, fullPercentage);
                        loot.maxDamage = increaseByPercentage(loot.maxDamage, fullPercentage);

                        loot.bonus = pref.type + fullPercentage.toString() + "%";

                    }else{

                        loot.minDamage = loot.minDamage + pref.min + suff.min;
                        loot.maxDamage = loot.maxDamage + pref.max + suff.max;

                        loot.bonus = pref.type + (pref.min + suff.min).toString() + " - " + (pref.max + suff.max).toString()

                    }
                }

            }else{

                loot.bonus = [];

                if(pref.modifier){

                    if(pref.type.includes("increased")){

                        loot.minDamage = increaseByPercentage(loot.minDamage, prefWeaponModifier);
                        loot.maxDamage = increaseByPercentage(loot.maxDamage, prefWeaponModifier);

                        loot.bonus[0] = pref.type + prefWeaponModifier.toString() + "%";

                    }else{

                        loot.minDamage = loot.minDamage + pref.min;
                        loot.maxDamage = loot.maxDamage + pref.max;

                        loot.bonus[0] = pref.type + pref.min.toString() + " - " + pref.max.toString();

                    }

                }else{

                    loot.bonus[0] = pref.type + prefWeaponModifier.toString();

                }

                if(suff.modifier){

                    if(suff.type.includes("increased")){

                        loot.minDamage = increaseByPercentage(loot.minDamage, suffWeaponModifier);
                        loot.maxDamage = increaseByPercentage(loot.maxDamage, suffWeaponModifier);

                        loot.bonus[1] = suff.type + suffWeaponModifier.toString() + "%";

                    }else{

                        loot.minDamage = loot.minDamage + suff.min;
                        loot.maxDamage = loot.maxDamage + suff.max;

                        loot.bonus[1] = suff.type + suff.min.toString() + " - " + suff.max.toString();

                    }

                }else{

                    loot.bonus[1] = suff.type + suffWeaponModifier.toString();

                }
            }
        }else if(hasPrefix) {

            let pref = loot.prefix;

            if(pref.modifier){

                if(pref.type.includes("increased")){

                    loot.minDamage = increaseByPercentage(loot.minDamage, prefWeaponModifier);
                    loot.maxDamage = increaseByPercentage(loot.maxDamage, prefWeaponModifier);

                    loot.bonus = pref.type + prefWeaponModifier.toString() + "%";

                }else{

                    loot.minDamage = loot.minDamage + pref.min;
                    loot.maxDamage = loot.maxDamage + pref.max;

                    loot.bonus = pref.type + pref.min.toString() + " - " + pref.max.toString();

                }

            }else{

                loot.bonus = pref.type + prefWeaponModifier.toString();

            }
            

        }else if(hasSuffix) {

            let suff = loot.suffix;

            if(suff.modifier){

                if(suff.type.includes("increased")){

                    loot.minDamage = increaseByPercentage(loot.minDamage, suffWeaponModifier);
                    loot.maxDamage = increaseByPercentage(loot.maxDamage, suffWeaponModifier);

                    loot.bonus = suff.type + suffWeaponModifier.toString() + "%";

                }else{

                    loot.minDamage = loot.minDamage + suff.min;
                    loot.maxDamage = loot.maxDamage + suff.max;

                    loot.bonus = suff.type + suff.min.toString() + " - " + suff.max.toString();

                }

            }else{

                loot.bonus = suff.type + suffWeaponModifier.toString();

            }

        }

    }else if(rarity === "Magic" && item.type === "Armor") {
                
        //roll for prefix/suffix/both
        let hasPrefix = Math.random() * 100 < prefixChance;
        let hasSuffix = Math.random() * 100 < suffixChance;

        //item is magic, force at least 1 prefix or suffix if both rolled false
        if(!hasPrefix && !hasSuffix){

            if (Math.random() < 0.5) {
                hasPrefix = true;
            } else {
                hasSuffix = true;
            }

        }

        // hasPrefix = true;
        // hasSuffix = true;

        let prefModifier = 0;
        let suffModifier = 0;

        //prefix
        if(hasPrefix){

            //grab prefix
            const pref = armorPrefixes[
            randomNumber(0, armorPrefixes.length - 1) 
            ];

            //update item name
            loot.name = pref.name + " " + loot.name;

            //attach prefix
            loot.prefix = pref;

            prefModifier = randomNumber(pref.min, pref.max);
            
        }

        //suffix
        if(hasSuffix){

            //grab suffix
            const suff = armorSuffixes[
            randomNumber(0, armorSuffixes.length - 1)
            ];

            //update item name
            loot.name = loot.name + " " + suff.name;

            //attach prefix
            loot.suffix = suff;

            suffModifier = randomNumber(suff.min, suff.max);

        }


        //alert(JSON.stringify(loot));

        //add bonuses to item and adjust dmg if needed
        if(hasPrefix && hasSuffix){

            let pref = loot.prefix;
            let suff = loot.suffix;

            // cater for identical types first
            if(pref.type == suff.type){

                if(pref.modifier){

                    if(pref.type.includes("increased")){

                        let fullPercentage = prefModifier + suffModifier;
                        loot.defense = increaseByPercentage(loot.defense, fullPercentage);
                        
                        loot.bonus = pref.type + fullPercentage.toString() + "%";

                    }else{

                        loot.defense = loot.defense + prefModifier + suffModifier;
                        loot.bonus = pref.type + (prefModifier + suffModifier).toString();

                    }
                }

            }else{

                loot.bonus = [];

                if(pref.modifier){

                    if(pref.type.includes("increased")){

                        loot.defense = increaseByPercentage(loot.defense, prefModifier);
                        loot.bonus[0] = pref.type + prefModifier.toString() + "%";

                    }else{

                        loot.defense = loot.defense + prefModifier;
                        loot.bonus[0] = pref.type + prefModifier.toString();

                    }

                }else{

                    loot.bonus[0] = pref.type + prefModifier.toString();

                }

                if(suff.modifier){

                    if(suff.type.includes("increased")){

                        loot.defense = increaseByPercentage(loot.defense, suffModifier);
                        loot.bonus[1] = suff.type + suffModifier.toString() + "%";

                    }else{

                        loot.defense = loot.defense + suffModifier;
                        loot.bonus[1] = suff.type + suffModifier.toString();

                    }

                }else{

                    loot.bonus[1] = suff.type + suffModifier.toString();

                }
            }
        }else if(hasPrefix) {

            let pref = loot.prefix;

            if(pref.modifier){

                if(pref.type.includes("increased")){

                    loot.defense = increaseByPercentage(loot.defense, prefModifier);
                    loot.bonus = pref.type + prefModifier.toString() + "%";

                }else{

                    loot.defense = loot.defense + prefModifier;
                    loot.bonus = pref.type + prefModifier.toString();

                }

            }else{

                loot.bonus = pref.type + prefModifier.toString();

            }

        }else if(hasSuffix) {

            let suff = loot.suffix;

            if(suff.modifier){

                if(suff.type.includes("increased")){

                    loot.defense = increaseByPercentage(loot.defense, suffModifier);
                    loot.bonus = suff.type + suffPercentage.toString() + "%";

                }else{

                    loot.defense = loot.defense + suffModifier;
                    loot.bonus = suff.type + suffModifier.toString();

                }

            }else{

                loot.bonus = suff.type + suffModifier.toString();

            }
        }
    }

    // Rare items get multiple bonuses
    if (rarity === "Rare" && item.type === "Weapon") {

        let total = randomNumber(3, 6);

        // Guarantee at least 1 prefix and 1 suffix
        let prefixCount = randomNumber(
            1,
            Math.min(3, total - 1)
        );

        let suffixCount = total - prefixCount;

        // Maximum of 3 suffixes, move excess to prefixes
        if (suffixCount > 3) {
            suffixCount = 3;
            prefixCount = total - suffixCount;
        }

        let prefixes = getRandomAffixes(weaponPrefixes, prefixCount);
        let suffixes = getRandomAffixes(weaponSuffixes, suffixCount);

        // alert(JSON.stringify(prefixes));
        // alert(JSON.stringify(suffixes));
        
        loot.bonus = [];
        let bonusNo = 0

        loot.name = "Rare " + loot.name;

        prefixes.forEach(pref => {

            let prefWeaponModifier = randomNumber(pref.min, pref.max);

                if(pref.modifier){

                    if(pref.type.includes("increased")){

                        loot.minDamage = increaseByPercentage(loot.minDamage, prefWeaponModifier);
                        loot.maxDamage = increaseByPercentage(loot.maxDamage, prefWeaponModifier);

                        loot.bonus[bonusNo] = pref.type + prefWeaponModifier.toString() + "%";

                    }else{

                        loot.minDamage = loot.minDamage + pref.min;
                        loot.maxDamage = loot.maxDamage + pref.max;

                        loot.bonus[bonusNo] = pref.type + pref.min.toString() + " - " + pref.max.toString();

                    }

                }else{

                    loot.bonus[bonusNo] = pref.type + prefWeaponModifier.toString();

                }

                bonusNo ++;
        });

        suffixes.forEach(suff => {

            let suffWeaponModifier = randomNumber(suff.min, suff.max);

            if(suff.modifier){

                if(suff.type.includes("increased")){

                    loot.minDamage = increaseByPercentage(loot.minDamage, suffWeaponModifier);
                    loot.maxDamage = increaseByPercentage(loot.maxDamage, suffWeaponModifier);

                    loot.bonus[bonusNo] = suff.type + suffWeaponModifier.toString() + "%";

                }else{

                    loot.minDamage = loot.minDamage + suff.min;
                    loot.maxDamage = loot.maxDamage + suff.max;

                    loot.bonus[bonusNo] = suff.type + suff.min.toString() + " - " + suff.max.toString();

                }

            }else{

                loot.bonus[bonusNo] = suff.type + suffWeaponModifier.toString();

            }

            bonusNo ++

        });

    }


    // Unique items get a special property
    if (rarity === "Unique") {

        loot.bonus = "+25% Fire Damage";

    }

    //alert(JSON.stringify(loot));

    return loot;
}

function getRandomAffixes(affixPool, amount) {

    let available = [...affixPool];
    let selected = [];

    for (let i = 0; i < amount; i++) {

        if (available.length === 0) {
            break;
        }

        let index = randomNumber(
            0,
            available.length - 1
        );

        selected.push(
            available[index]
        );

        available.splice(index, 1);
    }

    return selected;
}

function addPrefix(loot, prefix){




}

function addSuffix(loot, suffix){




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

        html += '<p>------------------------</p>'

        if (Array.isArray(loot.bonus)) {

            loot.bonus.forEach(bonus => {
                html += `<p>${bonus}</p>`;
            });

            html += `</ul>`;

        } else {

            html += `<p>${loot.bonus}</p>`;

        }
    }

    result.innerHTML = html;
}


// Button press
document.getElementById('myButton').addEventListener('click', () => {

    const loot = generateLoot();

    displayLoot(loot);

});
