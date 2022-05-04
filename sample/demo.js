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
    var map = new Map(48);
    var wrapper = document.createElement('div');
    var layout = new Layout(map, wrapper);
    var waitingToDraw = 0;
    map.forEachCoordinate(function(q, r, s) {
        layout.drawTile(q, r, s);
    });
    var activeTile = map.getTile(0, 0, 0);
    addMapToDom();

    map.actions.tileFocusStream.throttle(1000/60).onValues(function(event, tile) {
        if (activeTile === tile) {
            return;
        }

        var tileAttributes = layout.getTileAttributes(tile);
        var activeTileAttributes = layout.getTileAttributes(activeTile);

        activeTileAttributes.el.setAttribute('stroke', 'transparent');
        tileAttributes.el.setAttribute('stroke', 'black');

        activeTile = tile;
    });


    function addMapToDom() {
        window.requestAnimationFrame(function() {
            document.body.appendChild(wrapper);
            layout.getTileAttributes(activeTile).el.setAttribute('stroke', 'black');
        });
    };
});

