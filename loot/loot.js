//main starter loot script

// Rarity probabilities
const rarities = [
        {
            name: "Common",
            chance: 10
        },
        {
            name: "Magic",
            chance: 90
        },
        {
            name: "Rare",
            chance: 10
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

                        //get percentages
                        let prefPercentage = parseInt(randomNumber(
                            pref.min,
                            pref.max
                        ));
                        let suffPercentage = parseInt(randomNumber(
                            suff.min,
                            suff.max
                        ));

                        let fullPercentage = prefPercentage + suffPercentage;

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

                        //get percentages
                        let prefPercentage = parseInt(randomNumber(
                            pref.min,
                            pref.max
                        ));

                        loot.minDamage = increaseByPercentage(loot.minDamage, prefPercentage);
                        loot.maxDamage = increaseByPercentage(loot.maxDamage, prefPercentage);

                        loot.bonus[0] = pref.type + prefPercentage.toString() + "%";

                    }else{

                        loot.minDamage = loot.minDamage + pref.min;
                        loot.maxDamage = loot.maxDamage + pref.max;

                        loot.bonus[0] = pref.type + pref.min.toString() + " - " + pref.max.toString();

                    }

                }else{

                    let value = randomNumber(pref.min, pref.max);

                    loot.bonus[0] = pref.type + value.toString();

                }

                if(suff.modifier){

                    if(suff.type.includes("increased")){

                        //get percentages
                        let suffPercentage = parseInt(randomNumber(
                            suff.min,
                            suff.max
                        ));

                        loot.minDamage = increaseByPercentage(loot.minDamage, suffPercentage);
                        loot.maxDamage = increaseByPercentage(loot.maxDamage, suffPercentage);

                        loot.bonus[1] = suff.type + suffPercentage.toString() + "%";

                    }else{

                        loot.minDamage = loot.minDamage + suff.min;
                        loot.maxDamage = loot.maxDamage + suff.max;

                        loot.bonus[1] = suff.type + suff.min.toString() + " - " + suff.max.toString();

                    }

                }else{

                    let value = randomNumber(suff.min, suff.max);

                    loot.bonus[1] = suff.type + value.toString();

                }
            }
        }else if(hasPrefix) {

            let pref = loot.prefix;

            if(pref.modifier){

                if(pref.type.includes("increased")){

                    //get percentages
                    let prefPercentage = parseInt(randomNumber(
                        pref.min,
                        pref.max
                    ));

                    loot.minDamage = increaseByPercentage(loot.minDamage, prefPercentage);
                    loot.maxDamage = increaseByPercentage(loot.maxDamage, prefPercentage);

                    loot.bonus = pref.type + prefPercentage.toString() + "%";

                }else{

                    loot.minDamage = loot.minDamage + pref.min;
                    loot.maxDamage = loot.maxDamage + pref.max;

                    loot.bonus = pref.type + pref.min.toString() + " - " + pref.max.toString();

                }

            }else{

                let value = randomNumber(pref.min, pref.max);

                loot.bonus = pref.type + value.toString();

            }
            

        }else if(hasSuffix) {

            let suff = loot.suffix;

            if(suff.modifier){

                if(suff.type.includes("increased")){

                    //get percentages
                    let suffPercentage = parseInt(randomNumber(
                        suff.min,
                        suff.max
                    ));

                    loot.minDamage = increaseByPercentage(loot.minDamage, suffPercentage);
                    loot.maxDamage = increaseByPercentage(loot.maxDamage, suffPercentage);

                    loot.bonus = suff.type + suffPercentage.toString() + "%";

                }else{

                    loot.minDamage = loot.minDamage + suff.min;
                    loot.maxDamage = loot.maxDamage + suff.max;

                    loot.bonus = suff.type + suff.min.toString() + " - " + suff.max.toString();

                }

            }else{

                let value = randomNumber(suff.min, suff.max);

                loot.bonus = suff.type + value.toString();

            }

        }

    // TODO : refactor how affixes are attached
    /*

        ==============================================================================================================================================================================
        CLEAN THIS SHIT UP
        ==============================================================================================================================================================================

    */

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

                        //get percentages
                        let prefPercentage = parseInt(randomNumber(
                            pref.min,
                            pref.max
                        ));
                        let suffPercentage = parseInt(randomNumber(
                            suff.min,
                            suff.max
                        ));

                        let fullPercentage = prefPercentage + suffPercentage;


                        loot.defense = increaseByPercentage(loot.defense, fullPercentage);
                        

                        loot.bonus = pref.type + fullPercentage.toString() + "%";

                    }else{

                        let prefDef = parseInt(randomNumber(pref.min, pref.max));
                        let suffDef = parseInt(randomNumber(suff.min, suff.max));

                        loot.defense = loot.defense + prefDef + suffDef;

                        loot.bonus = pref.type + (prefDef + suffDef).toString();

                    }
                }

            }else{

                loot.bonus = [];

                if(pref.modifier){

                    if(pref.type.includes("increased")){

                        //get percentages
                        let prefPercentage = parseInt(randomNumber(
                            pref.min,
                            pref.max
                        ));

                        loot.defense = increaseByPercentage(loot.defense, prefPercentage);
                        
                        loot.bonus[0] = pref.type + prefPercentage.toString() + "%";

                    }else{

                        let prefDef = parseInt(randomNumber(pref.min, pref.max));

                        loot.bonus[0] = pref.type + prefDef.toString();

                    }

                }else{

                    let value = randomNumber(pref.min, pref.max);

                    loot.bonus[0] = pref.type + value.toString();

                }

                if(suff.modifier){

                    if(suff.type.includes("increased")){

                        //get percentages
                        let suffPercentage = parseInt(randomNumber(
                            suff.min,
                            suff.max
                        ));

                        loot.defense = increaseByPercentage(loot.defense, suffPercentage);

                        loot.bonus[1] = suff.type + suffPercentage.toString() + "%";

                    }else{
                        
                        let suffDef = parseInt(randomNumber(suff.min, suff.max));

                        loot.defense = loot.defense + suffDef;

                        loot.bonus[1] = suff.type + suffDef.toString();

                    }

                }else{

                    let value = randomNumber(suff.min, suff.max);

                    loot.bonus[1] = suff.type + value.toString();

                }
            }
        }else if(hasPrefix) {

            let pref = loot.prefix;

            if(pref.modifier){

                if(pref.type.includes("increased")){

                    //get percentages
                    let prefPercentage = parseInt(randomNumber(
                        pref.min,
                        pref.max
                    ));

                    loot.defense = increaseByPercentage(loot.defense, prefPercentage);

                    loot.bonus = pref.type + prefPercentage.toString() + "%";

                }else{

                    let prefDef = parseInt(randomNumber(pref.min, pref.max));

                    loot.defense = loot.defense + prefDef;

                    loot.bonus = pref.type + prefDef.toString();

                }

            }else{

                let value = randomNumber(pref.min, pref.max);

                loot.bonus = pref.type + value.toString();

            }
            

        }else if(hasSuffix) {

            let suff = loot.suffix;

            if(suff.modifier){

                if(suff.type.includes("increased")){

                    //get percentages
                    let suffPercentage = parseInt(randomNumber(
                        suff.min,
                        suff.max
                    ));

                    loot.defense = increaseByPercentage(loot.defense, suffPercentage);

                    loot.bonus = suff.type + suffPercentage.toString() + "%";

                }else{

                    let suffDef = parseInt(randomNumber(suff.min, suff.max));

                    loot.defense = loot.defense + suffDef;

                    loot.bonus = suff.type + suffDef.toString();

                }

            }else{

                let value = randomNumber(suff.min, suff.max);

                loot.bonus = suff.type + value.toString();

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
