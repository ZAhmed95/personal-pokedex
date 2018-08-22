M.AutoInit();

var pokedex; //pokedex object that will be initialized

//Function to initialize the pokedex
function initializePokedex(){
  var pokedex = {
    title: document.querySelector("#pokedex-title"),
    pokemonName: document.querySelector("#pokemon-name"),
    pokemonImg: document.querySelector("#pokemon-img"),
    imgSpinner: document.querySelector("#img-spinner"),
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
    this.pokemonName.innerText = pokemon.name;
    //deactivate image spinner
    this.imgSpinner.style.display = "none";
    this.pokemonImg.src = pokemon.image;
    this.description.innerText = pokemon.description;
    
    //function to set list items in a ul
    function renderList(ul, items){
      ul.innerHTML = items.map(item => `<li>${item}</li>`).join("");
    }

    //update types list
    renderList(pokedex.types, pokemon.types);
    //update weaknesses list (Not yet implemented)
    renderList(pokedex.weaknesses, pokemon.weaknesses);
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
}

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
    this.weaknesses = [];
    //tell typesManager to create weaknesses list for this pokemon,
    //when typesManager is ready
    typesManager.onReady(() => {
      this.weaknesses = typesManager.createWeaknessesList(this.types);
    });
  }
}

//set up axios instance
const instance = axios.create({
  baseURL: "https://pokeapi.co/api/v2/"
});
const names = ["articuno", "zapdos", "moltres"]

//make api calls
getData(names);

function getData(names){
  //make two api calls for each pokemon name
  var promises = names.map(name => instance.get(`pokemon/${name}/`));
  var species = names.map(name => instance.get(`pokemon-species/${name}/`));
  //create pokemon array to store data returned by api calls
  var pokemon = [];

  //get all pokemon data to populate pokemon list
  createPokemon(0); //this function will call itself with index 1,2... to get all pokemon data

  //define a function to create a new Pokemon object from the retrieved data,
  //and push it to pokemon array
  function createPokemon(index){
    axios.all([promises[index], species[index]]).then(axios.spread((pokemonData, speciesData) => {
      //destructure the pokemon data into our format
      var {
        name,
        sprites: {front_default: image},
        types,
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
      } = pokemonData.data;
      //destructure the species data
      var description = "";
      for (let flavorText of speciesData.data.flavor_text_entries){
        //get the english flavor text
        if (flavorText.language.name == "en"){
          description = flavorText.flavor_text;
          break;
        }
      }
      //create a new Pokemon object out of the data, and push it into pokemon array
      pokemon.push(new Pokemon({name, image, description,
        types: types.map(elem => elem.type.name),
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

      //if we've just retrieved the data for the last pokemon, create the trainer object,
      //and initialize the pokedex
      if (index == promises.length - 1){
        //Initialize pokedex
        pokedex = initializePokedex();
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
        //also, when the typesManager is ready, refresh the render to show
        //weaknesses list
        typesManager.onReady(() => {
          pokedex.renderPokemon(pokemon[pokedex.index]);
        });
      }
      else {
        //otherwise, we're not done retrieving all pokemon data. Get the next pokemon
        createPokemon(index+1);
      }
    })); //end axios.then
  }
}

//closure to create a typesManager object
const typesManager = (function(){
  //object to hold type damage relations
  var typeRelations = {}
  getTypeRelations();
  //Get pokemon type damage relations (half damage, double damage, etc)
  function getTypeRelations(){
    //there are currently 18 different types
    for (let i = 1; i <= 18; i++){
      //make api call to get type info
      instance.get(`type/${i}/`).then(res => {
        //create new typeRelation object
        var typeRelation = {};
        var damageRelations = res.data.damage_relations;
        //get all types that do half damage to this type
        for (let type of damageRelations.half_damage_from){
          typeRelation[type.name] = 0.5;
        }
        //get all types that do no damage to this type
        for (let type of damageRelations.no_damage_from){
          typeRelation[type.name] = 0;
        }
        //get all types that do double damage to this type
        for (let type of damageRelations.double_damage_from){
          typeRelation[type.name] = 2;
        }
        //insert this typeRelation into typeRelations
        typeRelations[res.data.name] = typeRelation;

        //if this was the final typeRelation added, fire ready event
        if (Object.keys(typeRelations).length == 18){
          ready();
        }
      });
    }
  }

  //readyState boolean to indicate if typeRelations has been fully initialized
  var readyState = false;
  //list of callbacks to fire when typeRelations is fully initialized
  var callbacks = [];
  //function that gets called when typeRelations is ready
  function ready(){
    readyState = true;
    for (let callback of callbacks){
      callback();
    }
    callbacks = [];
  }
  //function that receives callbacks to fire when ready
  function onReady(callback){
    //if typesManager is already ready, just fire the callback immediately
    if (readyState) callback();
    else {
      //otherwise add the callback to the queue
      callbacks.push(callback);
    }
  }
  //create a function that returns a list of type vulnerabilities,
  //given multiple type names
  function getTypeVulnerabilities(types){
    var vulnerabilities = {};
    types.forEach(name => {
      var typeRelation = typeRelations[name];
      for (let key in typeRelation){
        vulnerabilities[key] = (vulnerabilities[key] || 1) * typeRelation[key];
      }
    })
    return vulnerabilities;
  }

  //converts vulnerabilities object into weaknesses list
  function createWeaknessesList(types){
    var vulnerabilities = getTypeVulnerabilities(types);
    var weaknesses = [];
    for (let key in vulnerabilities){
      if (vulnerabilities[key] > 1){
        //this will create a string like: "flying 2x"
        weaknesses.push(`${key} ${vulnerabilities[key]}x`);
      }
    }
    return weaknesses;
  }

  //return a typeManager object
  return {
    isReady: () => readyState,
    onReady,
    createWeaknessesList
  }
})();