M.AutoInit();

//Initializing the pokedex
const pokedex = (function(){
  var pokedex = {
    title: document.querySelector("#pokedex-title"),
    pokemonName: document.querySelector("#pokemon-name"),
    pokemonImg: document.querySelector("#pokemon-img"),
    description: document.querySelector("#pokemon-description"),
    types: document.querySelector("#types"),
    weaknesses: document.querySelector("#weaknesses"),
    hp: document.querySelector("#stat-hp"),
    atk: document.querySelector("#stat-atk"),
    def: document.querySelector("#stat-def"),
    speed: document.querySelector("#stat-speed"),
    spAtk: document.querySelector("#stat-sp-atk"),
    spDef: document.querySelector("#stat-sp-def"),
    height: document.querySelector("#height"),
    weight: document.querySelector("#weight"),
    abilities: document.querySelector("#abilities"),

    //controlling pokedex functionality
    count: 0, //how many pokemon are stored in the pokedex
    index: 0, //index of currently selected pokemon
    previous: document.querySelector("#previous"), //next pokemon button
    next: document.querySelector("#next"), //previous pokemon button
    trainer: undefined, //the trainer this pokedex belongs to (will be assigned later)
  }

  //add some properties to the stat elements
  for (let statName of ["hp", "atk", "def", "spAtk", "spDef", "speed"]){
    var stat = pokedex[statName];
    //store the stat element's text in a property
    stat.text = stat.querySelector(`#${stat.id}-text`);
    //store the stat bar
    stat.bar = stat.querySelector(".stat-bar");
  }

  //Create functions to cycle through pokemon in pokedex
  function previous(){
    if (pokedex.count != 0){
      pokedex.index = (pokedex.index - 1 + pokedex.count) % pokedex.count;
      pokedex.renderPokemon(pokedex.trainer.pokemon[pokedex.index]);
    }
  }
  function next(){
    if (pokedex.count != 0){
      pokedex.index = (pokedex.index + 1 + pokedex.count) % pokedex.count;
      pokedex.renderPokemon(pokedex.trainer.pokemon[pokedex.index]);
    }
  }
  //add event listeners to control previous/next functions
  pokedex.previous.addEventListener("click", previous);
  pokedex.next.addEventListener("click", next);
  document.addEventListener("keydown", event => {
    if (event.key == "ArrowLeft") previous();
    else if (event.key == "ArrowRight") next();
  });
  //show the chosen pokemon's data on the page
  pokedex.renderPokemon = function(pokemon){
    pokedex.pokemonName.innerText = pokemon.name;
    pokedex.pokemonImg.src = pokemon.image;
    pokedex.description.innerText = pokemon.description;
    
    //function to set list items in a ul
    function renderList(ul, items){
      ul.innerHTML = items.map(item => `<li>${item}</li>`).join("");
    }

    //update types list
    renderList(pokedex.types, pokemon.types);
    //update weaknesses list (Not yet implemented)
    // renderList(pokedex.weaknesses, pokemon.weaknesses);
    //update abilities list
    renderList(pokedex.abilities, pokemon.abilities);

    //function to render a stat on the page
    function renderStat(statName){
      var stat = pokedex[statName];
      var statData = pokemon.stats[statName];
      //update the stat number
      stat.text.innerText = statData;
      //set the width of the colored bar appropriately
      stat.bar.style.width = `${Math.round(statData / 255 * 100)}%`;
    }
    //for each stat, update the elements on the page 
    for (let statName of ["speed", "atk", "def", "spAtk", "spDef", "hp"]){
      renderStat(statName);
    }

    pokedex.height.innerText = pokemon.height;
    pokedex.weight.innerText = `${pokemon.weight} lbs`;
  }

  return pokedex;
})(); //call function to initialize pokedex

//Pokemon class to store information about each pokemon
class Pokemon {
  constructor({
    name,
    image,
    description,
    types,
    stats,
    height,
    weight,
    abilities
  }) {
    this.name = name;
    this.image = image;
    this.description = description;
    this.types = types;
    this.stats = stats;
    this.height = height;
    this.weight = weight;
    this.abilities = abilities;
  }
}

//set up axios instance
const instance = axios.create({
  baseURL: "https://pokeapi.co/api/v2/pokemon/"
});
const names = ["articuno", "zapdos", "moltres"]

function getPokemonInfo(name){
  return instance.get(name);
}

//make api calls
getData(names);

function getData(names){
  //make an api call for each pokemon name
  var promises = names.map(name => instance.get(`${name}/`));

  //create pokemon array to store data returned by api calls
  var pokemon = [];

  axios.all(promises).then(axios.spread((...responses) => {
    for (let i=0; i < responses.length; i++){
      //destructure the response data into our format
      var {
        name,
        sprites: {front_default: image},
        description = "not implemented yet",
        types,
        weaknesses = ["not implemented yet"],
        stats: [
          {base_stat: speed},
          {base_stat: spDef},
          {base_stat: spAtk},
          {base_stat: def},
          {base_stat: atk},
          {base_stat: hp},
        ],
        height,
        weight,
        abilities,
      } = responses[i].data;
      //create a new Pokemon object out of the data, and push it into pokemon array
      pokemon.push(new Pokemon({name, image, description,
        types: types.map(elem => elem.type.name),
        weaknesses,
        stats: {
          speed,
          spDef,
          spAtk,
          def,
          atk,
          hp
        },
        height, weight,
        abilities: abilities.map(elem => elem.ability.name)
      }));
    }
    //create trainer object that holds these pokemon
    pokedex.trainer = {
      name: "Zia",
      pokemon, //an array of all pokemon this trainer has
    }
    pokedex.trainer.all = () => pokedex.trainer.pokemon, //function that returns all the trainer's pokemon
    pokedex.trainer.get = (name) => pokedex.trainer[name] //function to return a single pokemon by name
    for (let p of pokemon){
      //trainer has each pokemon object assosciated with its name as the key
      pokedex.trainer[p.name] = p;
    }
    //set pokemon count in pokedex
    pokedex.count = pokemon.length;
    //set pokedex title
    pokedex.title.innerText = `${pokedex.trainer.name}'s Pokedex`;
    //render the first pokemon in the array
    pokedex.renderPokemon(pokemon[0]);
  }));
}