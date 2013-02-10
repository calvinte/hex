hex.devMode = false;
hex.tileSize = 50;
hex.mapSize = 14;

// Tempoary, shows colours.
hex.iteration = 0;
hex.colours = ["#6F30A0","#5D3978","#421068","#A063D0","#AD80D0",
               "#B62E8A","#893C70","#760F55","#DB60B2","#DB81BD",
               "#4B39A5","#493F7C","#21126B","#7C6BD2","#9386D2"];

document.addEventListener('DOMContentLoaded', function() {
  map = new hex.Map();
});

