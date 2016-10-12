require([
    'd3/build/d3',
    'Map',
    'underscore/underscore-min',//shim?
], function(d3, Map) {
    var map = new Map(2);
    console.log(map.resolveTile(-3, 0, 3));
    console.log(map.resolveTile(-4, 1, 3));

    window.map = map;
    //map.resolveTile(7, 7);
});

