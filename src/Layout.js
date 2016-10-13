define([
    'd3',
    'Tile',
], function(d3, Tile) {
    'use strict';

    var layoutCount = -1;
    function Layout(map, el) {
        d3.namespace('xmlns');
        this.map = map;
        this.layoutIdx = ++layoutCount;

        this.elements = {
            outer: d3.select(el),
            svg: d3.select(el)
                .append('svg')
                .attr('height', '100%')
                .attr('width', '100%')
                .attr('version', '1.1')
                .attr('baseProfile', 'full')
                .attr('viewBox', this.computeViewBox())
                .attr('preserveAspectRatio', 'xMidYMid'),
        };


        // @TODO performance bottleneck. This is the first time we create every
        // tile. Ideally we should only create tiles as they're needed.
        this.map.forEachCoordinate(function(q, r, s) {
            var tile = this.map.getTile(q, r, s);
            var tileMetadata = this.getTileMetadata(q, r, s);
            tileMetadata.path = this.constructPath(tile.vertices(this.tileSize));

            this.elements.svg.append('path')
                .attr('d', tileMetadata.path.toString())
                .attr('fill', '#F0F')
                .attr('stroke', 'white')
                .attr('stroke-width', '0.5');
        }.bind(this));
    };

    Layout.prototype = {
        constructPath: function(verticies) {
            var i = 0, path;

            if (verticies.length !== 6) {
                return null;
            }

            path = d3.path();
            path.moveTo(verticies[0][0], verticies[0][1]);
            while (++i < 6) {
                path.lineTo(verticies[i][0], verticies[i][1]);
            }

            return path;
        },
        computeViewBox: function() {
            var xMultiplier, yMultiplier;
            var min = -1 * this.tileSize * (this.map.radius - 2);
            var max = -2 * min;

            return min + ', ' + min + ', ' + max + ', ' + max;
        },
        getTileMetadata: function(q, r, s) {
            var metadata = this.map.getTileMetadata(q, r, s);
            metadata['_hex_layout_' + this.layoutIdx] = metadata['_hex_layout_' + this.layoutIdx] || {};
            return metadata['_hex_layout_' + this.layoutIdx];
        },
        tileSize: 50,
    };

    return Layout;
});

