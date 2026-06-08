// -----------------------------------------------------------------------------
// Game State: Variables that keep track of the player's progress and current battle
// -----------------------------------------------------------------------------

let pokedexList = [];          // IDs of Pokémon the player has seen or caught.
let KantoPokedex = [];         // The list of the first 151 Pokémon for the Pokedex UI.

let playerParty = [];          // The player's team of Pokémon.
let currentPartyIndex = 0;     // Which Pokémon in the party is currently active.

let playerPokemon;             // The active player Pokémon object.
let opponentPokemon = {};      // The current wild/opponent Pokémon object.

let currentMenuState = "start"; // The current menu mode, like start, main, fight, evolve.
let isBattleActive = false;      // True while a battle is in progress.
let isPlayerTurn = true;         // True when the player gets to act first.

let isLearningMove = false;      // True when the player must choose a move to forget.
let moveToLearn = null;          // The new move the Pokémon is trying to learn.

let tier1Pool = [16, 19, 10, 13, 21, 23, 29, 32];
let tier2Pool = [25, 27, 37, 41, 43, 46, 48, 50];
let tier3Pool = [52, 54, 56, 58, 60, 63, 66, 69];
let tier4Pool = [74, 77, 79, 81, 83, 84, 88, 90];
let tier5Pool = [92, 95, 96, 98, 100, 102, 104, 106, 107];
let tier6Pool = [108, 109, 111, 113, 114, 115, 116, 118, 120, 122, 123, 124, 125, 126];
let tier7Pool = [127, 128, 129, 131, 132, 133, 147];
let tier8Pool = [138, 140, 142, 143, 144, 145, 146, 150, 151];
// A simple encounter pool: these are Pokémon IDs that may appear in battles.

let playerLevel = 5;             // The player's current level.
let playerXP = 0;                // Current experience points toward next level.
let xpNeededForLevel = 100;      // How much XP is needed to level up.

let isEvolving = false;          // Set true when evolution is triggered.
let evolutionIDTarget = null;    // The Pokémon ID to evolve into.

function sleep(ms) {
    // A small utility function that returns a promise that resolves after ms.
    // This is used so the battle flow can pause with await and feel smoother.
    return new Promise(resolve => setTimeout(resolve, ms));
}

let opponentLevel = 2;           // Default opponent level to start.

let playerStats = {
    attack: 0,
    defense: 0,
    specialAttack: 0,
    specialDefense: 0,
    speed: 0
};

let opponentStats = {
    attack: 0,
    defense: 0,
    specialAttack: 0,
    specialDefense: 0,
    speed: 0
};

/*
  Type chart: how different move types interact with defender types.
  The value means:
    2 = super effective
    0.5 = not very effective
    0 = no effect
  This makes the battle system feel like classic Pokémon type matchups.
*/
const typeChart = {
    normal: { rock: 0.5, ghost: 0, steel: 0.5 },
    fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
    water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
    grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
    electric: { water: 2, grass: 0.5, electric: 0.5, ground: 0, flying: 2, dragon: 0.5 },
    ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
    fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
    poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
    ground: { fire: 2, grass: 0.5, electric: 2, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
    flying: { grass: 2, electric: 0.5, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
    psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
    bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
    rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
    ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
    dragon: { dragon: 2, steel: 0.5, fairy: 0 },
    dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
    steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
    fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
};

/*
  Nature data: each Pokémon gets a nature that boosts one stat and lowers another.
  This is a small part of the battle system that makes each Pokémon feel unique.
*/
const natureData = {
    Hardy:    { plus: null, minus: null },
    Lonely:   { plus: "attack", minus: "defense" },
    Brave:    { plus: "attack", minus: "speed" },
    Adamant:  { plus: "attack", minus: "specialAttack" },
    Naughty:  { plus: "attack", minus: "specialDefense" },
    Bold:     { plus: "defense", minus: "attack" },
    Docile:   { plus: null, minus: null },
    Relaxed:  { plus: "defense", minus: "speed" },
    Impish:   { plus: "defense", minus: "specialAttack" },
    Lax:      { plus: "defense", minus: "specialDefense" },
    Timid:    { plus: "speed", minus: "attack" },
    Hasty:    { plus: "speed", minus: "defense" },
    Serious:  { plus: null, minus: null },
    Jolly:    { plus: "speed", minus: "specialAttack" },
    Naive:    { plus: "speed", minus: "specialDefense" },
    Modest:   { plus: "specialAttack", minus: "attack" },
    Mild:     { plus: "specialAttack", minus: "defense" },
    Quiet:    { plus: "specialAttack", minus: "speed" },
    Bashful:  { plus: null, minus: null },
    Rash:     { plus: "specialAttack", minus: "specialDefense" },
    Calm:     { plus: "specialDefense", minus: "attack" },
    Gentle:   { plus: "specialDefense", minus: "defense" },
    Sassy:    { plus: "specialDefense", minus: "speed" },
    Careful:  { plus: "specialDefense", minus: "specialAttack" },
    Quirky:   { plus: null, minus: null }
};

/*
  createUniqueInstances: builds a custom Pokémon instance from API data.
  This is a core function that turns raw PokeAPI values into a game-ready Pokémon.
*/
function createUniqueInstances(apiTemplate, chosenLevel) {
    const ivs = {
        hp: Math.floor(Math.random() * 32),
        attack: Math.floor(Math.random() * 32),
        defense: Math.floor(Math.random() * 32),
        specialAttack: Math.floor(Math.random() * 32),
        specialDefense: Math.floor(Math.random() * 32),
        speed: Math.floor(Math.random() * 32)
    };
    // IVs are hidden bonuses. They make each individual Pokémon slightly different.

    const natureList = Object.keys(natureData);
    const randomNature = natureList[Math.floor(Math.random() * natureList.length)];
    // Choose a random nature from the nature table.

    const nativeMoves = apiTemplate.moves || [];
    const templateStats = apiTemplate.baseStats || apiTemplate.stats || [];

    return {
        id: apiTemplate.id,
        name: apiTemplate.name,
        spriteFront: apiTemplate.sprites?.front_default || `https://raw.githubusercontent.com/pokeAPI/sprites/master/sprites/pokemon/front/${apiTemplate.id}.png`,
        spriteBack: apiTemplate.sprites?.back_default || `https://raw.githubusercontent.com/pokeAPI/sprites/master/sprites/pokemon/back/${apiTemplate.id}.png`,
        types: apiTemplate.types,
        level: chosenLevel,
        currentXP: 0,
        baseStats: {
            hp: templateStats.hp || templateStats?.[0]?.base_stat || 50,
            attack: templateStats.attack || templateStats?.[1]?.base_stat || 50,
            defense: templateStats.defense || templateStats?.[2]?.base_stat || 50,
            specialAttack: templateStats.specialAttack || templateStats?.[3]?.base_stat || 50,
            specialDefense: templateStats.specialDefense || templateStats?.[4]?.base_stat || 50,
            speed: templateStats.speed || templateStats?.[5]?.base_stat || 50
        },
        ivs: ivs,
        nature: randomNature,
        moves: nativeMoves,
        currentHP: null,
        maxHP: null,
        hp: null,
        maxhp: null
    };
}

/*
  checkNewMovesForLevels: if a Pokémon evolves, this checks whether the evolved form
  learns any new moves at the player's current level.
*/
function checkNewMovesForLevels(apiData, level) {
    const newMoves = [];

    apiData.moves.forEach(moveData => {
        const details = moveData.version_group_details[0];

        if (details && details.move_learn_method.name === "level-up") {
            if (details.level_learned_at === level) {
                newMoves.push({
                    name: moveData.move.name,
                    url: moveData.move.url
                });
            }
        }
    });

    return newMoves;
}

/*
  checkEvolution: fetches the Pokémon evolution chain and checks if the player
  Pokémon is ready to evolve by level.
*/
async function checkEvolution() {
    if (isEvolving) return;

    try {
        const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${playerPokemon.id}`);
        const speciesData = await speciesResponse.json();

        const chainResponse = await fetch(speciesData.evolution_chain.url);
        const chainData = await chainResponse.json();

        let currentChainNode = chainData.chain;
        let nextEvolutionDetails = null;

        while (currentChainNode) {
            if (currentChainNode.species.name === playerPokemon.name.toLowerCase()) {
                if (currentChainNode.creates_with && currentChainNode.creates_with.length > 0) {
                    nextEvolutionDetails = currentChainNode.creates_with[0];
                } else if (currentChainNode.evolves_to && currentChainNode.evolves_to.length > 0) {
                    nextEvolutionDetails = currentChainNode.evolves_to[0];
                }
                break;
            }
            currentChainNode = currentChainNode.evolves_to ? currentChainNode.evolves_to[0] : null;
        }
        if (nextEvolutionDetails && nextEvolutionDetails.evolution_details && nextEvolutionDetails.evolution_details.length > 0) {
            const details = nextEvolutionDetails.evolution_details[0];

            if (details.trigger.name === "level-up" && details.min_level) {
                if (playerLevel >= details.min_level) {
                    const urlParts = nextEvolutionDetails.species.url.split('/');
                    const targetId = parseInt(urlParts[urlParts.length - 2]);

                    evolutionIDTarget = targetId;
                    isEvolving = true;

                    isBattleActive = false;

                    await sleep(1000);

                    const logElement = document.getElementById("log-text");
                    if (logElement) {
                        logElement.innerHTML = `what? ${playerPokemon.name.toUpperCase()} is evolving!<br>Do you want to allow it to evolve?`;
                    }
                    updateMenu("evolve");
                }
            }
        }
    }
    catch (error) {
        console.error("Error: ", error);
    }
}

/*
  updatePlayerUI: refreshes the player side of the battle screen.
  It updates the name, level, HP bar, and status badge.
*/
function updatePlayerUI() {
    if (!playerPokemon) return;

    document.getElementById("player-name").innerText = playerPokemon.name.toUpperCase();
    document.getElementById("player-level").innerText = playerLevel;
    document.getElementById("player-sprite").src = playerPokemon.spriteBack;

    const displayHP = typeof playerPokemon.hp === "number" ? playerPokemon.hp : playerPokemon.currentHP;
    const displayMaxHP = typeof playerPokemon.maxhp === "number" ? playerPokemon.maxhp : playerPokemon.maxHP;

    document.getElementById("player-hp-text").innerText = `${displayHP}/${displayMaxHP}`;
    let playerHpProcent = (displayHP / displayMaxHP) * 100;
    document.getElementById("player-hp-fill").style.width = `${playerHpProcent}%`;

    updateStatusUI();
}

function updateXPUI() {
    const xpFill = document.getElementById("player-xp-fill");
    if (xpFill) {
        let xpProcent = (playerXP / xpNeededForLevel) * 100;
        xpProcent = Math.min(100, Math.max(0, xpProcent));
        xpFill.style.width = `${xpProcent}%`;
    }
}

/*
  gainXP: gives XP to the player and handles leveling up if enough XP is earned.

  This function:
    1. adds XP,
    2. displays log text,
    3. loops while XP >= threshold,
    4. increases level and stats,
    5. checks move learning and evolution.
*/
async function gainXP(amount) {
    const logElement = document.getElementById("log-text");
    playerXP += amount;

    if (logElement) logElement.innerHTML += `<br>${playerPokemon.name.toUpperCase()} gained ${amount} XP!`;

    while (playerXP >= xpNeededForLevel) {
        playerXP -= xpNeededForLevel;
        playerLevel++;
        xpNeededForLevel = Math.floor(xpNeededForLevel * 1.2);

        playerPokemon.maxhp = Math.floor(playerPokemon.maxhp * 1.1);
        playerPokemon.attack = Math.floor(playerPokemon.attack * 1.1);
        playerPokemon.defense = Math.floor(playerPokemon.defense * 1.1);
        playerPokemon.specialAttack = Math.floor(playerPokemon.specialAttack * 1.1);
        playerPokemon.specialDefense = Math.floor(playerPokemon.specialDefense * 1.1);
        playerPokemon.speed = Math.floor(playerPokemon.speed * 1.1);

        playerPokemon.hp = playerPokemon.maxhp;

        if (logElement) logElement.innerHTML = `${playerPokemon.name.toUpperCase()} grew to level ${playerLevel}!`;
        await checkAndLearnNewMove(playerLevel);
    }

    checkEvolution();
    updateXPUI();
}

/*
  checkAndLearnNewMove: when the player levels up, this checks the API to see if
  there is a new move at that level. If there is, it either adds it directly or
  forces the player to choose a move to forget.
*/
async function checkAndLearnNewMove(newLevel) {
    const logElement = document.getElementById("log-text");
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${playerPokemon.id}`);
    const data = await response.json();

    const newMoveData = data.moves.find(m => {
        return m.version_group_details.some(detail =>
            detail.move_learn_method.name === "level-up" &&
            detail.level_learned_at === newLevel
        );
    });

    if (newMoveData) {
        const moveResponse = await fetch(newMoveData.move.url);
        const moveData = await moveResponse.json();

        const alreadyknows = playerPokemon.moves.some(m => m.name === moveData.name);

        if (!alreadyknows) {
            const newMove = {
                name: moveData.name,
                power: moveData.power || 0,
                type: moveData.type.name,
                damageClass: moveData.damage_class.name,
                accuracy: moveData.accuracy !== null ? moveData.accuracy : 100,
                maxPP: moveData.pp !== null ? moveData.pp : 35,
                currentPP: moveData.pp !== null ? moveData.pp : 35,
                statChange: moveData.stat_changes && moveData.stat_changes.length > 0 ? {
                    stat: moveData.stat_changes[0].stat.name,
                    change: moveData.stat_changes[0].change
                } : null,
                statusEffect: moveData.meta && moveData.meta.ailment && moveData.meta.ailment.name !== "none" ? {
                    name: moveData.meta.ailment.name,
                    chance: moveData.meta.effect_chance !== null ? moveData.meta.effect_chance : (moveData.damage_class.name === "status" ? 100 : 10)
                } : null
            };

            if (playerPokemon.moves.length < 4) {
                playerPokemon.moves.push(newMove);
            } else {
                moveToLearn = newMove;
                isLearningMove = true;

                return new Promise((resolve) => {
                    if (logElement) logElement.innerHTML = `${playerPokemon.name.toUpperCase()} wants to learn the move ${newMove.name.toUpperCase()}!<br>But it already knows 4 moves. Select a move to forget:`;
                    updateMenu("learn-move");
                    window.resolveMoveLearning = resolve;
                });
            }
        }
    }
}

function togglePokedex(show) {
    const dexContainer = document.getElementById("pokedex-container");
    if (!dexContainer) return;
    if (show) {
        dexContainer.style.display = "block";
        renderPokedex();
    } else {
        dexContainer.style.display = "none";
    }
}

/*
  chooseStarter: the first choice in the game. It loads the selected starter from
  the API, builds a unique Pokémon instance, and starts the player's party.
*/
async function chooseStarter(starterId) {
    const logElement = document.getElementById("log-text");
    if (logElement) logElement.innerText = "Loading your partner...";

    const apiTemplate = await getPokemonData(starterId);
    const uniqueStarter = createUniqueInstances(apiTemplate, 5);
    reCalculateInstanceStats(uniqueStarter);

    if (!pokedexList.includes(starterId)) {
        pokedexList.push(starterId);
    }

    playerParty = [uniqueStarter];
    currentPartyIndex = 0;
    playerPokemon = playerParty[currentPartyIndex];
    playerLevel = playerPokemon.level;

    uniqueStarter.moves = apiTemplate.moves || [];

    const startOverlay = document.getElementById("start-menu");
    if (startOverlay)  {
        startOverlay.style.display = "none";
        startOverlay.style.opacity = "0";
        startOverlay.style.pointerEvents = "none";
    }

    updatePlayerUI();
    endBattle();
    startNewBattle();
}

/*
  startNewBattle: begins a fresh battle against a random encounter.
  It resets stats, selects an opponent, and updates the UI.
*/
async function startNewBattle() {
    isBattleActive = true;
    isPlayerTurn = true;
    currentMenuState = "main";

    playerStats.attack = 0;
    playerStats.defense = 0;
    playerStats.specialAttack = 0;
    playerStats.specialDefense = 0;
    playerStats.speed = 0;

    opponentStats.attack = 0;
    opponentStats.defense = 0;
    opponentStats.specialAttack = 0;
    opponentStats.specialDefense = 0;
    opponentStats.speed = 0;

    const levelOffSet = Math.floor(Math.random() * 3) - 1;
    opponentLevel = Math.max(2, playerLevel + levelOffSet);

    let encounterpool = playerLevel < 15 ? tier1Pool :
                        playerLevel < 25 ? tier2Pool :
                        playerLevel < 35 ? tier3Pool :
                        playerLevel < 50 ? tier4Pool :
                        playerLevel < 60 ? tier5Pool :
                        playerLevel < 70 ? tier6Pool :
                        playerLevel < 80 ? tier7Pool : tier1Pool;

    const randomIndex = Math.floor(Math.random() * encounterpool.length);
    const randomOpponent = encounterpool[randomIndex];

    opponentPokemon = await getPokemonData(randomOpponent);
    opponentPokemon.level = opponentLevel;
    reCalculateInstanceStats(opponentPokemon);
    opponentPokemon.hp = opponentPokemon.maxhp;
    opponentPokemon.currentHP = opponentPokemon.maxHP;

    playerPokemon.hp = playerPokemon.maxhp;
    playerPokemon.currentHP = playerPokemon.maxHP;

    document.getElementById("player-hp-fill").style.backgroundColor = "#4CAF50";
    document.getElementById("opponent-hp-fill").style.backgroundColor = "#4CAF50";

    updatePlayerUI();

    document.getElementById("opponent-name").innerText = opponentPokemon.name.toUpperCase();
    document.getElementById("opponent-level").innerText = opponentLevel;
    document.getElementById("opponent-sprite").src = opponentPokemon.spriteFront;
    document.getElementById("opponent-hp-fill").style.width = "100%";

    const logElement = document.getElementById("log-text");
    if (logElement) logElement.innerHTML = `A wild ${opponentPokemon.name.toUpperCase()} appeared!<br>What will ${playerPokemon.name.toUpperCase()} do?`;

    updateMenu("main");
}

/*
  reCalculateInstanceStats: calculates stats from the base stats, IVs, level, and nature.
  This is a key function because it gives each Pokémon a real HP and attack value.
*/
function reCalculateInstanceStats(pokemonInstance) {
    if (!pokemonInstance) return;

    const level = pokemonInstance.level;
    const base = pokemonInstance.baseStats;
    const iv = pokemonInstance.ivs;
    const natureName = pokemonInstance.nature;
    const natureEffect = natureData[natureName];

    const baseHP = base?.hp || pokemonInstance.stats?.[0]?.base_stat || 40;
    const calculatedHP = Math.floor(((2 * base.hp + (iv?.hp || 0)) * level) / 100) + level + 10;
    pokemonInstance.maxHP = calculatedHP;
    pokemonInstance.maxhp = calculatedHP;

    if (pokemonInstance.currentHP === null) {
        pokemonInstance.currentHP = pokemonInstance.maxHP;
    }
    pokemonInstance.hp = pokemonInstance.currentHP;

    const coreStats = ["attack", "defense", "specialAttack", "specialDefense", "speed"];
    coreStats.forEach(statKey => {
        let calculateValue = Math.floor(((2 * base[statKey] + iv[statKey]) * level) / 100) + 5;
        if (natureEffect.plus === statKey) {
            calculateValue = Math.floor(calculateValue * 1.1);
        } else if (natureEffect.minus === statKey) {
            calculateValue = Math.floor(calculateValue * 1.1 * 0.9);
            calculateValue = Math.floor(calculateValue * 0.9);
        }
        pokemonInstance[statKey] = calculateValue;
    });
}

/*
  DOM Ready: when the browser has loaded the page, fetch the Pokedex and
  show the start menu overlay.
*/
window.addEventListener("DOMContentLoaded", () => {
    pokedex();
    const startOverlay = document.getElementById("start-menu");
    if (startOverlay) startOverlay.style.display = "flex";
});

/*
  pokedex: loads the first 151 Pokémon names and sprite URLs from the API,
  and stores them in KantoPokedex.
*/
async function pokedex() {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=151`);
    const data = await response.json();

    KantoPokedex = data.results.map((pokemon, index) => {
        const id = index + 1;
        return {
            id: id,
            name: pokemon.name,
            sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
        };
    });
    renderPokedex();
}

/*
  renderPokedex: draws all Pokedex entries in the page. For each Pokémon:
    - if the player has seen it, show it with its image,
    - if not, show a silhouette and ???.

  Clicking a caught Pokémon loads it as the active party member.
*/
function renderPokedex() {
    const grid = document.getElementById("pokedex-grid");
    if (!grid) return;

    grid.innerHTML = "";

    KantoPokedex.forEach(pokemon => {
        const card = document.createElement("div");
        const hasCaught = pokedexList.includes(pokemon.id);
        const formattedId = String(pokemon.id).padStart(3, '0');

        if (hasCaught) {
            card.className = "pokedex-card caught";
            card.innerHTML = `
                <span class="pokedex-number">#${formattedId}</span>
                <img class="pokedex-sprite" src="${pokemon.sprite}" alt="${pokemon.name}">
                <div class="pokedex-name">${pokemon.name.toUpperCase()}</div>
            `;

            card.onclick = async () => {
                const logElement = document.getElementById("log-text");
                if (logElement) logElement.innerText = `Loading ${pokemon.name.toUpperCase()}...`;

                const apiTemplate = await getPokemonData(pokemon.id);
                if (!apiTemplate) {
                    if (logElement) logElement.innerText = "Error loading Pokemon data.";
                    return;
                }

                const instancePool = createUniqueInstances(apiTemplate, 5);
                const uniqueStarter = Array.isArray(instancePool) ? instancePool[0] : instancePool;
                reCalculateInstanceStats(uniqueStarter);

                playerParty = [uniqueStarter];
                playerPokemon = uniqueStarter;
                updatePlayerUI();

                if (isBattleActive) {
                    if (logElement) logElement.innerText = `Go! ${playerPokemon.name.toUpperCase()}!`;
                    togglePokedex(false);
                    isPlayerTurn = false;
                    updateMenu("main");

                    setTimeout(async () => {
                        if (!isBattleActive) return;
                        const randomIndex = Math.floor(Math.random() * opponentPokemon.moves.length);
                        const opponentMove = opponentPokemon.moves[randomIndex];
                        if (canPokemonAttack(opponentPokemon, false)) {
                            if (checkMoveHit(opponentMove, opponentPokemon.name)) {
                                doOpponentAttack(opponentMove);
                            }
                        }

                        setTimeout(async () => {
                            if (!isBattleActive || playerPokemon.hp <= 0 || opponentPokemon.hp <= 0) return;
                            const keepFighting = await applyEndResultDamage();
                            if (keepFighting && isBattleActive) {
                                if (logElement) logElement.innerText = `What will ${playerPokemon.name.toUpperCase()} do?`;
                                updateMenu("main");
                                isPlayerTurn = true;
                            }
                        }, 1000);
                    }, 1000);
                } else {
                    if (logElement) logElement.innerText = `${playerPokemon.name.toUpperCase()} is ready to battle! press NEXT FIGHT to start.`;
                    togglePokedex(false);
                }
            };
        } else {
            card.className = "pokedex-card unknown";
            card.innerHTML = `
                <span class="pokedex-number">#${formattedId}</span>
                <div class="pokedex-silhuette">?</div>
                <div class="pokedex-name">???</div>
            `;
        }

        grid.appendChild(card);
    });
}

/*
  getPokemonData: fetches Pokémon details from the API and builds a simplified
  game object with moves and stats.
*/
async function getPokemonData(id) {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const data = await response.json();

    const currentLevel = typeof playerLevel !== `undefined` ? playerLevel : 5;

    const playerLevelMoves = data.moves.filter(m => {
        return m.version_group_details.some(detail =>
            detail.move_learn_method.name === "level-up" &&
            detail.level_learned_at <= playerLevel
        );
    });

    const movesToFetch = playerLevelMoves.length > 0 ? playerLevelMoves.slice(0, 4) : data.moves.slice(0, 4);
    const movePromises = movesToFetch.map(async (m) => {
        const moveResponse = await fetch(m.move.url);
        const moveData = await moveResponse.json();

        let statChange = null;
        if (moveData.stat_changes && moveData.stat_changes.length > 0) {
            statChange = {
                stat: moveData.stat_changes[0].stat.name,
                change: moveData.stat_changes[0].change
            };
        }

        let statusEffect = null;
        if (moveData.meta && moveData.meta.ailment && moveData.meta.ailment.name != "none") {
            let finalChance = moveData.meta.effect_chance;
            if (finalChance === null || finalChance === undefined) {
                finalChance = (moveData.damage_class.name === "status") ? 100 : 10;
            }
            statusEffect = {
                name: moveData.meta.ailment.name,
                chance: finalChance
            };
        }

        return {
            name: moveData.name,
            power: moveData.power || 0,
            type: moveData.type.name,
            damageClass: moveData.damage_class.name,
            accuracy: moveData.accuracy !== null ? moveData.accuracy : 100,
            maxPP: moveData.pp !== null ? moveData.pp : 35,
            currentPP: moveData.pp !== null ? moveData.pp : 35,
            statChange: statChange,
            statusEffect: statusEffect
        };
    });

    const ivs = {
        hp: Math.floor(Math.random() * 32),
        attack: Math.floor(Math.random() * 32),
        defense: Math.floor(Math.random() * 32),
        specialAttack: Math.floor(Math.random() * 32),
        specialDefense: Math.floor(Math.random() * 32),
        speed: Math.floor(Math.random() * 32)
    };

    const natureKeys = Object.keys(natureData);
    const randomNature = natureKeys[Math.floor(Math.random() * natureKeys.length)];
    const detailedMoves = await Promise.all(movePromises);

    return {
        id: data.id,
        name: data.name,
        level: currentLevel,
        baseStats: {
            hp: data.stats[0].base_stat,
            attack: data.stats[1].base_stat,
            defense: data.stats[2].base_stat,
            specialAttack: data.stats[3].base_stat,
            specialDefense: data.stats[4].base_stat,
            speed: data.stats[5].base_stat
        },
        ivs: ivs,
        nature: randomNature,
        hp: data.stats[0].base_stat,
        maxhp: data.stats[0].base_stat,
        attack: data.stats[1].base_stat,
        defense: data.stats[2].base_stat,
        specialAttack: data.stats[3].base_stat,
        specialDefense: data.stats[4].base_stat,
        speed: data.stats[5].base_stat,
        status: "none",
        types: data.types.map(t => t.type.name),
        spriteFront: data.sprites.front_default,
        spriteBack: data.sprites.back_default,
        moves: detailedMoves
    };
}

/*
  calculateDamage: the damage formula that decides how much HP a move removes.
  It uses attacker level, move power, attack/defense stats, STAB, type effectiveness,
  and critical hits. The final damage is also randomized slightly.
*/
function calculateDamage(attacker, defender, move) {
    if (!move.power || move.power <= 0) return 0;

    const level = (attacker.name === playerPokemon.name) ? playerLevel : opponentLevel;
    const power = move.power || 40;
    const isCrit = Math.random() < (1 / 24);

    const attackerAttackStage = (attacker.name === playerPokemon.name) ? playerStats.attack : opponentStats.attack;
    const attackerSpAtkStage = (attacker.name === playerPokemon.name) ? playerStats.specialAttack : opponentStats.specialAttack;
    const defenderDefenseStage = (defender.name === playerPokemon.name) ? playerStats.defense : opponentStats.defense;
    const defenderSpDefStage = (defender.name === playerPokemon.name) ? playerStats.specialDefense : opponentStats.specialDefense;

    let attackStageToUse = move.damageClass === "special" ? attackerSpAtkStage : attackerAttackStage;
    let defenseStageToUse = move.damageClass === "special" ? defenderSpDefStage : defenderDefenseStage;

    if (isCrit) {
        if (attackStageToUse < 0) attackStageToUse = 0;
        if (defenseStageToUse > 0) defenseStageToUse = 0;
    }

    let finalAttack = move.damageClass === "special" ? attacker.specialAttack : attacker.attack;
    let finalDefense = move.damageClass === "special" ? defender.specialDefense : defender.defense;
    finalAttack *= getStageMultiplier(attackStageToUse);
    finalDefense *= getStageMultiplier(defenseStageToUse);

    const adratio = finalAttack / finalDefense;
    let damage = (((2 * level / 5 + 2) * power * adratio) / 50) + 2;

    if (attacker.types.includes(move.type)) {
        damage *= 1.5; // STAB: same-type attack bonus
    }

    let typeMultiplier = 1;
    defender.types.forEach(defType => {
        if (typeChart[move.type] && typeChart[move.type][defType] !== undefined) {
            typeMultiplier *= typeChart[move.type][defType];
        }
    });

    move.lastEffectiveness = typeMultiplier;
    damage *= typeMultiplier;

    if (isCrit) {
        damage *= 1.5;
        move.lastHitWasCritical = true;
    } else {
        move.lastHitWasCritical = false;
    }

    return Math.floor(damage * (Math.random() * 0.15 + 0.85));
}

/*
  pokemonUpdate: similar to startNewBattle, but used when updating the current
  battle with a new opponent. It also ensures the player has an active Pokémon.
*/
async function pokemonUpdate() {
    const logElement = document.getElementById("log-text");

    if (!playerPokemon) {
        playerPokemon = await getPokemonData(4);
        if (!pokedexList.includes(4)) pokedexList.push(4);
    }

    const levelOffSet = Math.floor(Math.random() * 3) - 1;
    opponentLevel = Math.max(2, playerLevel + levelOffSet);

    const randomIndex = Math.floor(Math.random() * encounterpool.length);
    const randomOpponent = encounterpool[randomIndex];

    opponentPokemon = await getPokemonData(randomOpponent);
    opponentPokemon.level = opponentLevel;
    reCalculateInstanceStats(opponentPokemon);
    opponentPokemon.hp = opponentPokemon.maxhp;
    opponentPokemon.currentHP = opponentPokemon.maxHP;

    playerPokemon.hp = playerPokemon.maxhp;
    playerPokemon.currentHP = playerPokemon.maxHP;
    playerStats.attack = 0;
    playerStats.defense = 0;
    playerStats.specialAttack = 0;
    playerStats.specialDefense = 0;
    playerStats.speed = 0;
    playerPokemon.status = "none";

    updatePlayerUI();

    document.getElementById("opponent-name").innerText = opponentPokemon.name.toUpperCase();
    document.getElementById("opponent-level").innerText = opponentLevel;
    document.getElementById("opponent-sprite").src = opponentPokemon.spriteFront;
    document.getElementById("opponent-hp-fill").style.width = "100%";

    opponentStats.attack = 0;
    opponentStats.defense = 0;
    opponentStats.specialAttack = 0;
    opponentStats.specialDefense = 0;
    opponentStats.speed = 0;

    opponentPokemon.status = "none";
    isBattleActive = true;
    isPlayerTurn = true;

    updateStatusUI();
    updateXPUI();
    updateMenu("main");

    if (logElement) logElement.innerHTML = `${opponentPokemon.name.toUpperCase()} attacks!<br> What will ${playerPokemon.name.toUpperCase()} do?`;
}

/*
  updateStatusUI: displays the status effects like sleep, poison, burn, or paralysis
  for both the player and opponent.
*/
function updateStatusUI() {
    const playerStatusEl = document.getElementById("player-status");
    const opponentStatusEl = document.getElementById("opponent-status");

    if (playerStatusEl) {
        if (playerPokemon && playerPokemon.status && playerPokemon.status !== "none" && playerPokemon.status !== "") {
            playerStatusEl.innerText = `[${playerPokemon.status.substring(0, 3).toUpperCase()}]`;
            playerStatusEl.className = `status-badge ${playerPokemon.status}`;
        } else {
            playerStatusEl.innerText = "";
        }
    }

    if (opponentStatusEl) {
        if (opponentPokemon && opponentPokemon.status && opponentPokemon.status !== "none" && opponentPokemon.status !== "") {
            opponentStatusEl.innerText = `[${opponentPokemon.status.substring(0, 3).toUpperCase()}]`;
            opponentStatusEl.className = `status-badge ${opponentPokemon.status}`;
        } else {
            opponentStatusEl.innerText = "";
        }
    }
}

function getStageMultiplier(stage) {
    if (stage === 0) return 1;
    if (stage > 0) return (2 + stage) / 2;
    return 2 / (2 - stage);
}

/*
  tryApplyStatus: attempts to apply a status condition from a move.
  It also returns text describing what happened.
*/
function tryApplyStatus(move, targetPokemon) {
    if (!move.statusEffect) return "";
    if (targetPokemon.status !== "none") return "";

    const roll = Math.random() * 100;
    if (roll <= move.statusEffect.chance) {
        targetPokemon.status = move.statusEffect.name;
        updateStatusUI();

        if (targetPokemon.status === "sleep") {
            targetPokemon.sleepTurns = Math.floor(Math.random() * 3) + 1;
            return `<br>${targetPokemon.name.toUpperCase()} fell asleep!`;
        }
        if (targetPokemon.status === "poison") {
            return `<br>${targetPokemon.name.toUpperCase()} was poisoned!`;
        }
        if (targetPokemon.status === "burn") {
            return `<br>${targetPokemon.name.toUpperCase()} was burned`;
        }
        if (targetPokemon.status === "paralysis") {
            return `<br>${targetPokemon.name.toUpperCase()} was paralyzed`;
        }
        if (targetPokemon.status === "freeze") {
            return `<br>${targetPokemon.name.toUpperCase()} was frozen solid`;
        }
    }
    return "";
}

/*
  handleMenuClick: called when a button is pressed.
  It routes the button press based on the current menu state.
*/
function handleMenuClick(buttonNumber) {
    const logElement = document.getElementById("log-text");

    if (isEvolving && currentMenuState === "evolve") {
        if (buttonNumber === 1) {
            executeEvolution();
        }
        return;
    }

    if (isLearningMove && currentMenuState === "learn-move") {
        const moveIndex = buttonNumber - 1;
        if (playerPokemon.moves[moveIndex]) {
            const forgottenMoveName = playerPokemon.moves[moveIndex].name.toUpperCase();
            playerPokemon.moves[moveIndex] = moveToLearn;
            if (logElement) {
                logElement.innerHTML = `1, 2 and... poof!<br>${playerPokemon.name.toUpperCase()} forgot ${forgottenMoveName} and learned ${moveToLearn.name.toUpperCase()}!`;
            }
        }
        isLearningMove = false;
        moveToLearn = null;
        if (window.resolveMoveLearning) {
            window.resolveMoveLearning();
        }
        setTimeout(() => {
            endBattle();
        }, 1000);
        return;
    }

    if (!isBattleActive) {
        if (buttonNumber === 1) startNewBattle();
        else if (buttonNumber === 2) togglePokedex(true);
        else if (buttonNumber === 5) handleBackClick();
        return;
    }

    if (!isPlayerTurn) {
        return;
    }

    if (currentMenuState === "main") {
        if (buttonNumber === 1) updateMenu("fight");
        else if (buttonNumber === 2) {}
        else if (buttonNumber === 3) togglePokedex(true);
        else if (buttonNumber === 4) if (logElement) logElement.innerText = "You cannot run from this battle!";
    } else if (currentMenuState === "fight") {
        const chosenMove = playerPokemon.moves[buttonNumber - 1];
        if (chosenMove) {
            if (chosenMove.currentPP <= 0) {
                if (logElement) logElement.innerText = `Theres no PP left for this move!`;
                return;
            }
            executeTurn(chosenMove);
        }
    }
}

/*
  updateMenu: changes the button labels and back button depending on the state.
*/
function updateMenu(state) {
    currentMenuState = state;

    const button1 = document.getElementById("button-1");
    const button2 = document.getElementById("button-2");
    const button3 = document.getElementById("button-3");
    const button4 = document.getElementById("button-4");
    const backButton = document.getElementById("button-back");

    if (state === "main") {
        button1.innerText = "FIGHT";
        button2.innerText = "BAG";
        button3.innerText = "POKEMON";
        button4.innerText = "RUN";
        if (backButton) backButton.style.display = "none";
    } else if (state === "fight" || state === "learn-move") {
        const moves = playerPokemon.moves;
        button1.innerText = playerPokemon.moves[0] ? `${playerPokemon.moves[0].name.toUpperCase()}\nPP: ${moves[0].currentPP}/${moves[0].maxPP}` : "-";
        button2.innerText = playerPokemon.moves[1] ? `${playerPokemon.moves[1].name.toUpperCase()}\nPP: ${moves[1].currentPP}/${moves[1].maxPP}` : "-";
        button3.innerText = playerPokemon.moves[2] ? `${playerPokemon.moves[2].name.toUpperCase()}\nPP: ${moves[2].currentPP}/${moves[2].maxPP}` : "-";
        button4.innerText = playerPokemon.moves[3] ? `${playerPokemon.moves[3].name.toUpperCase()}\nPP: ${moves[3].currentPP}/${moves[3].maxPP}` : "-";
        if (backButton) {
            backButton.style.display = "inline-block";
            backButton.innerText = state === "fight" ? "BACK" : "DONT LEARN";
        }
    } else if (state === "evolve") {
        button1.innerText = "YES";
        button2.innerText = "-";
        button3.innerText = "-";
        button4.innerText = "-";
        if (backButton) {
            backButton.innerText = "NO";
            backButton.style.display = "inline-block";
        }
    }
}

function handleBackClick() {
    const logElement = document.getElementById("log-text");

    if (currentMenuState === "fight") {
        updateMenu("main");
        if (logElement) logElement.innerHTML = `What will ${playerPokemon.name.toUpperCase()} do?`;
    } else if (currentMenuState === "learn-move" && isLearningMove) {
        if (logElement) logElement.innerHTML = `What will ${playerPokemon.name.toUpperCase()} do?`;
        isLearningMove = false;
        moveToLearn = null;
        if (window.resolveMoveLearning) {
            resolveMoveLearning();
        }
        updateMenu("main");
    } else if (currentMenuState === "evolve" && isEvolving) {
        if (logElement) logElement.innerHTML = `What will ${playerPokemon.name.toUpperCase()} do?`;
        isEvolving = false;
        evolutionIDTarget = null;
        updateMenu("main");
    }
}

/*
  executeTurn: this is the core battle sequence when the player selects a move.
  It resolves turn order, executes attacks, waits between actions, and checks
  whether the battle is over.
*/
async function executeTurn(playerMove) {
    isPlayerTurn = false;
    const logElement = document.getElementById("log-text");
    playerMove.currentPP = Math.max(0, playerMove.currentPP - 1);
    updateMenu("fight");

    const playerSpeed = playerPokemon.speed * getStageMultiplier(playerStats.speed);
    const opponentSpeed = opponentPokemon.speed * getStageMultiplier(opponentStats.speed);
    const randomIndex = Math.floor(Math.random() * opponentPokemon.moves.length);
    const opponentMove = opponentPokemon.moves[randomIndex];

    if (playerSpeed >= opponentSpeed) {
        if (canPokemonAttack(playerPokemon, true)) {
            if (checkMoveHit(playerMove, playerPokemon.name)) {
                doPlayerAttack(playerMove);
            }
        }
        await sleep(1000);
        if (opponentPokemon.hp > 0) {
            if (canPokemonAttack(opponentPokemon, false)) {
                if (checkMoveHit(opponentMove, opponentPokemon.name)) {
                    doOpponentAttack(opponentMove);
                }
            }
        }
        await sleep(1000);
        if (playerPokemon.hp > 0) {
            const keepFighting = await applyEndResultDamage();
            if (keepFighting) {
                if (logElement) logElement.innerText = `What will ${playerPokemon.name.toUpperCase()} do?`;
                updateMenu("main");
                isPlayerTurn = true;
            }
        }
    } else {
        if (canPokemonAttack(opponentPokemon, false)) {
            if (checkMoveHit(opponentMove, opponentPokemon.name)) {
                doOpponentAttack(opponentMove);
            }
        }
        await sleep(1000);
        if (playerPokemon.hp > 0) {
            if (canPokemonAttack(playerPokemon, true)) {
                if (checkMoveHit(playerMove, playerPokemon.name)) {
                    doPlayerAttack(playerMove);
                }
            }
            await sleep(1000);
        }
    }

    if (isBattleActive) {
        if (playerPokemon.hp <= 0) {
            if (logElement) logElement.innerHTML = `${playerPokemon.name.toUpperCase()} fainted...`;
            await sleep(1000);
            endBattle();
            return;
        }
        if (opponentPokemon.hp <= 0) {
            if (logElement) logElement.innerHTML = `Foe ${opponentPokemon.name.toUpperCase()} fainted!`;
            await sleep(1000);
            if (!pokedexList.includes(opponentPokemon.id)) pokedexList.push(opponentPokemon.id);
            const xpGained = opponentLevel * 25;
            await gainXP(xpGained);
            if (!isEvolving && !isLearningMove) endBattle();
            return;
        }

        const keepFighting = await applyEndResultDamage();
        if (keepFighting && isBattleActive && !isLearningMove && !isEvolving) {
            if (logElement) logElement.innerText = `What will ${playerPokemon.name.toUpperCase()} do?`;
            updateMenu("main");
            isPlayerTurn = true;
        }
    }
}

/*
  executeEvolution: replaces the player's Pokémon data with the evolved form and
  checks if the new form also learns a move at this level.
*/
async function executeEvolution() {
    const logElement = document.getElementById("log-text");
    if (logElement) logElement.innerHTML = `Congratulations! Your ${playerPokemon.name.toUpperCase()} evolved!`;

    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${evolutionIDTarget}`);
    const data = await response.json();

    const currentMoves = playerPokemon.moves;
    playerPokemon.id = data.id;
    playerPokemon.name = data.name;
    playerPokemon.spriteFront = data.sprites.front_default;
    playerPokemon.spriteBack = data.sprites.back_default;
    playerPokemon.types = data.types.map(t => t.type.name);
    playerPokemon.baseStats = {
        hp: data.stats[0].base_stat,
        attack: data.stats[1].base_stat,
        defense: data.stats[2].base_stat,
        specialAttack: data.stats[3].base_stat,
        specialDefense: data.stats[4].base_stat,
        speed: data.stats[5].base_stat
    };
    playerPokemon.level = playerLevel;
    reCalculateInstanceStats(playerPokemon);
    playerPokemon.currentHP = playerPokemon.maxHP;
    playerPokemon.hp = playerPokemon.maxHP;
    playerPokemon.moves = currentMoves;

    const evolutionMoves = checkNewMovesForLevels(data, playerLevel);
    for (const newMove of evolutionMoves) {
        const alreadyknows = playerPokemon.moves.some(m => m.name === newMove.name);
        if (!alreadyknows) {
            const moveResponse = await fetch(newMove.url);
            const moveData = await moveResponse.json();
            const formattedMove = {
                name: moveData.name,
                power: moveData.power,
                accuracy: moveData.accuracy || 100,
                maxPP: moveData.pp !== null ? moveData.pp : 35,
                currentPP: moveData.pp !== null ? moveData.pp : 35,
                damageClass: moveData.damage_class.name,
                statChange: moveData.stat_changes && moveData.stat_changes.length > 0 ? {
                    change: moveData.stat_changes[0].change,
                    stat: moveData.stat_changes[0].stat.name
                } : null
            };
            if (playerPokemon.moves.length < 4) {
                playerPokemon.moves.push(formattedMove);
            } else {
                if (logElement) logElement.innerHTML += `${playerPokemon.name.toUpperCase()} wants to learn the move ${formattedMove.name.toUpperCase()}, but already knows 4 moves!`;
                updateMenu("learn-move");
            }
        }
    }

    if (!pokedexList.includes(playerPokemon.id)) {
        pokedexList.push(playerPokemon.id);
    }

    updatePlayerUI();
    isEvolving = false;
    evolutionIDTarget = null;
    return true;
}

/*
  doPlayerAttack: resolves the player's move. It handles status moves separately
  from damage moves, applies stat changes, and updates the log.
*/
function doPlayerAttack(playerMove) {
    const logElement = document.getElementById("log-text");
    let statusText = "";

    if (playerMove.damageClass === "status") {
        let statText = "";
        if (playerMove.statChange) {
            const change = playerMove.statChange.change;
            const statName = playerMove.statChange.stat.toUpperCase();
            if (change < 0) {
                if (playerMove.statChange.stat === "attack") opponentStats.attack = Math.max(-6, opponentStats.attack + change);
                if (playerMove.statChange.stat === "defense") opponentStats.defense = Math.max(-6, opponentStats.defense + change);
                if (playerMove.statChange.stat === "speed") opponentStats.speed = Math.max(-6, opponentStats.speed + change);
                statText = `<br>Foe ${opponentPokemon.name.toUpperCase()}'s ${statName} fell!`;
            }
        }

        statusText = tryApplyStatus(playerMove, opponentPokemon);
        if (logElement) {
            logElement.innerHTML = `${playerPokemon.name.toUpperCase()} used ${playerMove.name.toUpperCase()}!${statText}`;
        }
    } else {
        let damageToOpponent = calculateDamage(playerPokemon, opponentPokemon, playerMove);
        opponentPokemon.hp = Math.max(0, opponentPokemon.hp - damageToOpponent);
        let opponentHpProcent = (opponentPokemon.hp / opponentPokemon.maxhp) * 100;

        if (opponentHpProcent > 50) {
            document.getElementById("opponent-hp-fill").style.width = `${opponentHpProcent}%`;
            document.getElementById("opponent-hp-fill").style.backgroundColor = "#4caf50";
        } else if (opponentHpProcent <= 50 && opponentHpProcent > 20) {
            document.getElementById("opponent-hp-fill").style.width = `${opponentHpProcent}%`;
            document.getElementById("opponent-hp-fill").style.backgroundColor = "#ff9800";
        } else {
            document.getElementById("opponent-hp-fill").style.width = `${opponentHpProcent}%`;
            document.getElementById("opponent-hp-fill").style.backgroundColor = "#f44336";
        }

        if (opponentPokemon.hp > 0) statusText = tryApplyStatus(playerMove, opponentPokemon);

        let effectivenessText = "";
        if (playerMove.lastEffectiveness > 1) effectivenessText = `<br>It's super effective!`;
        if (playerMove.lastEffectiveness < 1) effectivenessText = `<br>It's not very effective...`;
        if (playerMove.lastEffectiveness === 0) effectivenessText = `<br>It has no effect...`;

        let critText = playerMove.lastHitWasCritical ? `<br>A critical hit!` : "";
        if (logElement) logElement.innerHTML = `${playerPokemon.name.toUpperCase()} used ${playerMove.name.toUpperCase()}!${critText}${effectivenessText}`;
    }
}

/*
  doOpponentAttack: the opponent uses a move. It works the same way as the player
  attack function but updates the player's HP and logs the result.
*/
function doOpponentAttack(opponentMove) {
    const logElement = document.getElementById("log-text");
    let statusText = "";

    if (opponentMove.damageClass === "status") {
        let oppStatText = "";
        if (opponentMove.statChange) {
            const change = opponentMove.statChange.change;
            const statName = opponentMove.statChange.stat.toUpperCase();
            if (change < 0) {
                if (opponentMove.statChange.stat === "attack") playerStats.attack = Math.max(-6, playerStats.attack + change);
                if (opponentMove.statChange.stat === "defense") playerStats.defense = Math.max(-6, playerStats.defense + change);
                if (opponentMove.statChange.stat === "speed") playerStats.speed = Math.max(-6, playerStats.speed + change);
                oppStatText = `<br>${playerPokemon.name.toUpperCase()}'s ${statName} fell!`;
            }
        }

        statusText = tryApplyStatus(opponentMove, playerPokemon);
        if (logElement) {
            logElement.innerHTML = `Foe ${opponentPokemon.name.toUpperCase()} used ${opponentMove.name.toUpperCase()}!${oppStatText}`;
        }
    } else {
        let damageToPlayer = calculateDamage(opponentPokemon, playerPokemon, opponentMove);
        playerPokemon.hp = Math.max(0, playerPokemon.hp - damageToPlayer);
        document.getElementById("player-hp-text").innerHTML = `${playerPokemon.hp}/${playerPokemon.maxhp}`;
        let playerHpProcent = (playerPokemon.hp / playerPokemon.maxhp) * 100;

        if (playerHpProcent > 50) {
            document.getElementById("player-hp-fill").style.width = `${playerHpProcent}%`;
            document.getElementById("player-hp-fill").style.backgroundColor = "#4caf50";
        } else if (playerHpProcent <= 50 && playerHpProcent > 20) {
            document.getElementById("player-hp-fill").style.width = `${playerHpProcent}%`;
            document.getElementById("player-hp-fill").style.backgroundColor = "#ff9800";
        } else {
            document.getElementById("player-hp-fill").style.width = `${playerHpProcent}%`;
            document.getElementById("player-hp-fill").style.backgroundColor = "#f44336";
        }

        if (opponentPokemon.hp > 0) {
            statusText = tryApplyStatus(opponentMove, playerPokemon);
        }

        let opponentEffectivenessText = "";
        if (opponentMove.lastEffectiveness > 1) opponentEffectivenessText = `<br>It's super effective!`;
        if (opponentMove.lastEffectiveness < 1) opponentEffectivenessText = `<br>It's not very effective...`;
        if (opponentMove.lastEffectiveness === 0) opponentEffectivenessText = `<br>It has no effect...`;

        let critText = opponentMove.lastHitWasCritical ? `<br>A critical hit!` : "";
        if (logElement) logElement.innerHTML = `Foe ${opponentPokemon.name.toUpperCase()} used ${opponentMove.name.toUpperCase()}!${critText}${opponentEffectivenessText}${statusText}`;
    }
}

function checkMoveHit(move, attackerName) {
    const logElement = document.getElementById("log-text");
    const roll = Math.random() * 100;
    if (roll > move.accuracy) {
        if (logElement) {
            logElement.innerHTML += `<br>${attackerName.toUpperCase()}'s attack missed!`;
        }
        return false;
    }
    return true;
}

/*
  canPokemonAttack: checks whether a Pokémon can act.
  It handles sleep, paralysis, freeze, and confusion.
*/
function canPokemonAttack(pokemon, isPlayer) {
    const logElement = document.getElementById("log-text");

    if (pokemon.status === "sleep") {
        pokemon.sleepTurns--;
        if (pokemon.sleepTurns <= 0) {
            pokemon.status = "none";
            if (logElement) logElement.innerHTML += `<br>${pokemon.name.toUpperCase()} woke up!`;
            return true;
        }
        if (logElement) logElement.innerHTML = `${pokemon.name.toUpperCase()} is fast asleep...`;
        return false;
    }

    if (pokemon.status === "paralysis") {
        if (Math.random() < 0.25) {
            if (logElement) logElement.innerHTML = `${pokemon.name.toUpperCase()} is paralyzed, so it can't move!`;
            return false;
        }
    }

    if (pokemon.status === "freeze") {
        if (Math.random() < 0.20) {
            pokemon.status = "none";
            updateStatusUI();
            if (logElement) logElement.innerHTML = `${pokemon.name.toUpperCase()} thawed out!`;
            return true;
        }
        if (logElement) logElement.innerHTML = `${pokemon.name.toUpperCase()} is frozen solid!`;
        return false;
    }

    if (pokemon.isConfused) {
        pokemon.confusionTurns--;
        if (pokemon.confusionTurns <= 0) {
            pokemon.isConfused = false;
            if (logElement) logElement.innerHTML += `<br>${pokemon.name.toUpperCase()} snapped out of confusion!`;
        } else {
            if (logElement) logElement.innerHTML = `${pokemon.name.toUpperCase()} is confused...`;
            if (Math.random() < 0.33) {
                const selfDamage = Math.floor(pokemon.maxhp * 0.1);
                pokemon.hp = Math.max(0, pokemon.hp - selfDamage);
                if (isPlayer) {
                    document.getElementById("player-hp-text").innerHTML = `${pokemon.hp}/${pokemon.maxhp}`;
                    document.getElementById("player-hp-fill").style.width = `${(pokemon.hp / pokemon.maxhp) * 100}%`;
                } else {
                    document.getElementById("opponent-hp-fill").style.width = `${(pokemon.hp / pokemon.maxhp) * 100}%`;
                }
                if (logElement) logElement.innerHTML += `<br>It hurt itself in its confusion!`;
                if (pokemon.hp <= 0) {
                    setTimeout(() => {
                        if (logElement) logElement.innerText = `${pokemon.name.toUpperCase()} fainted!`;
                        endBattle();
                    }, 1000);
                }
                return false;
            }
        }
    }
    return true;
}

/*
  applyEndResultDamage: applies damage from burn or poison at the end of each turn.
  It returns false if either Pokémon fainted from these effects.
*/
async function applyEndResultDamage() {
    const logElement = document.getElementById("log-text");
    let extraLog = "";

    if (playerPokemon.status === "burn" || playerPokemon.status === "poison") {
        const dotDamage = Math.floor(playerPokemon.maxhp / 16) || 1;
        playerPokemon.hp = Math.max(0, playerPokemon.hp - dotDamage);
        document.getElementById("player-hp-text").innerHTML = `${playerPokemon.hp}/${playerPokemon.maxhp}`;
        document.getElementById("player-hp-fill").style.width = `${(playerPokemon.hp / playerPokemon.maxhp) * 100}%`;
        extraLog += `<br>${playerPokemon.name.toUpperCase()} was hurt from its ${playerPokemon.status}!`;
    }

    if (opponentPokemon.status === "burn" || opponentPokemon.status === "poison") {
        const dotDamage = Math.floor(opponentPokemon.maxhp / 16) || 1;
        opponentPokemon.hp = Math.max(0, opponentPokemon.hp - dotDamage);
        document.getElementById("opponent-hp-fill").style.width = `${(opponentPokemon.hp / opponentPokemon.maxhp) * 100}%`;
        extraLog += `<br>Foe ${opponentPokemon.name.toUpperCase()} was hurt from its ${opponentPokemon.status}!`;
    }

    if (extraLog !== "" && logElement) {
        logElement.innerHTML += extraLog;
        await sleep(1000);
    }

    if (playerPokemon.hp <= 0 || opponentPokemon.hp <= 0) {
        return false;
    }
    return true;
}

/*
  endBattle: cleans up after a battle.
  It restores the button labels, resets status, and stops the battle state.
*/
function endBattle() {
    isBattleActive = false;
    isPlayerTurn = true;
    currentMenuState = "start";
    if (playerPokemon) {
        playerPokemon.status = "none";
        if (Array.isArray(playerPokemon.moves)) {
            playerPokemon.moves.forEach(move => {
                if (move && typeof move.maxPP === "number") {
                    move.currentPP = move.maxPP;
                }
            });
        }
    }

    const logElement = document.getElementById("log-text");
    if (logElement) logElement.innerText = "Battle over! you can click on OPEN POKEDEX to swap your Pokemon";

    document.getElementById("button-1").innerText = "NEXT FIGHT";
    document.getElementById("button-2").innerText = "OPEN POKEDEX";
    document.getElementById("button-3").innerText = "-";
    document.getElementById("button-4").innerText = "-";
    const backButton = document.getElementById("button-back");
    if (backButton) backButton.style.display = "none";
}
