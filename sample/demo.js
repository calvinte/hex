require([
    'd3/build/d3',
    'Map',
    'underscore/underscore-min',//shim?
], function(d3, Map) {
    var map = new Map(7);
    var tile = map.resolveTile(0, 0);
    var tile2 = map.resolveTile(2, 2);
    console.log(tile, tile2, map.computeRotation(tile, tile2, 1));
});

