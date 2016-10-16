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
    var waitingToDraw = 0;
    map.forEachCoordinate(function(q, r, s) {
        waitingToDraw++;
        layout.drawTile(q, r, s, function() {
            waitingToDraw--;
            if (!waitingToDraw) {
                // Note: we've created the svg (all layout logic) without yet
                // modifying the dom. Now we request a frame, then append.
                addMapToDom();
            }
        })
    });

    map.actions.tileFocusStream.onValue(function(event) {
        event.target.setAttribute('stroke', 'black');
    });

    map.actions.tileBlurStream.onValue(function(event) {
        event.target.setAttribute('stroke', 'transparent');
    });

    function addMapToDom() {
        window.requestAnimationFrame(function() {
            document.body.appendChild(wrapper);
        });
    };
});

