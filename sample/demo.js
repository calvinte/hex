require.config({
    paths: {
        d3: 'd3/build/d3',
        underscore: 'underscore/underscore',
        baconjs: 'baconjs/dist/Bacon',
    }
});

require([
    'Map',
    'Layout',
], function(Map, Layout) {
    var map = new Map(10);
    var wrapper = document.createElement('div');
    var layout = new Layout(map, wrapper);
    map.forEachCoordinate(layout.drawTile.bind(layout));

    // Note: we've created the svg (all layout logic) without yet modifying
    // the dom. Now we request a frame, then append.
    window.requestAnimationFrame(function() {
        document.body.appendChild(wrapper);
    });
});

