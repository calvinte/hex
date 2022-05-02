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
    var position = [0, 0, 0];

    map.forEachCoordinate(layout.drawTile.bind(layout));
    drawActiveTile();

    window.addEventListener('keyup', function(evt) {
        var newPosition;
        switch (evt.key) {
            case 'w': {
                newPosition = [position[0], position[1] - 1, position[2] + 1];
                break;
            }
            case 'e': {
                newPosition = [position[0] + 1, position[1] - 1, position[2]];
                break;
            }
            case 's': {
                newPosition = [position[0], position[1] + 1, position[2] - 1];
                break;
            }
            case 'a': {
                newPosition = [position[0] - 1, position[1] + 1, position[2]];
                break;
            }
            case 'd': {
                newPosition = [position[0] + 1, position[1], position[2] - 1];
                break;
            }
            case 'q': {
                newPosition = [position[0] - 1, position[1], position[2] + 1];
                break;
            }
            default: return;
        }
        clearActiveTile();
        position = map.resolveCoordinate.apply(map, newPosition);
        drawActiveTile();
    });

    function drawActiveTile() {
        var activeTile = map.getTile.apply(map, position);
        layout.getTileAttributes(activeTile).el.setAttribute('stroke', 'black'); 
    }

    function clearActiveTile() {
        var activeTile = map.getTile.apply(map, position);
        layout.getTileAttributes(activeTile).el.setAttribute('stroke', 'transparent'); 
    }

    window.requestAnimationFrame(function() {
        document.body.appendChild(wrapper);
    });
});

