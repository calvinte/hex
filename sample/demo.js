require.config({
    paths: {
        d3: 'd3/build/d3',
        underscore: 'underscore/underscore-min',
    }
});

require([
    'Map',
    'Layout',
], function(Map, Layout) {
    var map = new Map(2);
    var wrapper = document.createElement('div');
    var layout = new Layout(map, wrapper);

    document.body.appendChild(wrapper);
});

