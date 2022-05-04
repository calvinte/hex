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
    window.addEventListener('mousemove', function(event) {
        var w = window.innerWidth;
        var h = window.innerHeight;
        var minMax = layout.computeViewBounds();
        var position = new Array(2);
        var coordinate, multiplier = null;
        if (w < h) {
            multiplier = (minMax[1] / w);
            position[0] = minMax[0] + multiplier * event.clientX;
            position[1] = -(h - w) / 2 + minMax[0] + multiplier * event.clientY;
        } else {
            multiplier = (minMax[1] / h);
            
            position[0] = -(w - h) / 2 + minMax[0] + multiplier * event.clientX;
            position[1] = minMax[0] + multiplier * event.clientY;
        }
        coordinate = map.computeCoordinateAtPosition(position[0], position[1], layout.tileSize, true);
        layout.drawTile(coordinate[0], coordinate[1], coordinate[2], function() {});
    });

    map.actions.tileFocusStream.onValues(function(event) {
        event.target.setAttribute('stroke', 'black');
    });

    map.actions.tileBlurStream.onValues(function(event) {
        event.target.setAttribute('stroke', 'transparent');
    });

    window.requestAnimationFrame(function() {
        document.body.appendChild(wrapper);
    });
});

