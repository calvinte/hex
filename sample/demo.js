require([
    'd3/build/d3',
    'Map',
    'underscore/underscore-min',//shim?
], function(d3, Map) {
    var map = new Map(2);
    console.log(map.resolveTile(-3, 0, 3)); // -> [0,  2, -2]
    console.log(map.resolveTile(-4, 1, 3)); // -> [1, -2,  1]
    console.log("\n\n\n");
    console.log(map.resolveTile(1, -3, 3)); // -> [-2, 2, 0]
    console.log(map.resolveTile(2, -4, 3)); // -> [-1, 1, 0]
    console.log("\n\n\n");
    console.log(map.resolveTile(-3, 3, 2)); // -> [2, 0, -2]
    console.log(map.resolveTile(-4, 3, 0)); // -> [1, 0, -1]
});

