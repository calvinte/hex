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
            path.closePath();

            return path;
        },
        computeViewBounds: function() {
            var xMultiplier, yMultiplier;
            var min = -1 * this.tileSize * (this.map.radius - 2);
            var max = -2 * min;

            return [min, max];
        },
        computeViewBox: function() {
            var minMax = this.computeViewBounds();
            return minMax[0] + ', ' + minMax[0] + ', ' + minMax[1] + ', ' + minMax[1];
        },
        drawTile: function(q, r, s, fn) {
            if (this.map.checkOutOfBounds(q, r, s)) {
                return null;
            }

            var tile = this.map.getTile(q, r, s);
            this.getTileMetadata(tile, function(tileMetadata) {
                if (tileMetadata.el) {
                    fn();
                    return tileMetadata;
                }

                tileMetadata.path = this.constructPath(tile.vertices(this.tileSize, this.tileSpacing));
                tileMetadata.el = this.elements.svg.append('path')
                    .attr('d', tileMetadata.path.toString())
                    .attr('fill', '#F0F')
                    .attr('stroke', 'transparent')
                    .attr('stroke-alignment', 'inner')
                    .attr('stroke-location', 'inside')
                    .attr('stroke-width', '4')
                    .node();

                tile.actions.drawStream.onValue(function bindEventsToElement(el) {
                    el.addEventListener('contextmenu', tile.actions.contextmenuStream.push.bind(tile.actions.contextmenuStream));
                    el.addEventListener('touchend', tile.actions.touchendStream.push.bind(tile.actions.touchendStream));
                    el.addEventListener('touchstart', tile.actions.touchstartStream.push.bind(tile.actions.touchstartStream));
                    el.addEventListener('mouseout', tile.actions.mouseoutStream.push.bind(tile.actions.mouseoutStream));
                    el.addEventListener('mouseover', tile.actions.mouseoverStream.push.bind(tile.actions.mouseoverStream));
                    el.addEventListener('mouseup', tile.actions.mouseupStream.push.bind(tile.actions.mouseupStream));
                });

                tile.actions.undrawStream.onValue(function unbindEventsToElement(el) {
                    el.removeEventListener('contextmenu', tile.actions.contextmenuStream.push.bind(tile.actions.contextmenuStream));
                    el.removeEventListener('touchend', tile.actions.touchendStream.push.bind(tile.actions.touchendStream));
                    el.removeEventListener('touchstart', tile.actions.touchstartStream.push.bind(tile.actions.touchstartStream));
                    el.removeEventListener('mouseout', tile.actions.mouseoutStream.push.bind(tile.actions.mouseoutStream));
                    el.removeEventListener('mouseover', tile.actions.mouseoverStream.push.bind(tile.actions.mouseoverStream));
                    el.removeEventListener('mouseup', tile.actions.mouseupStream.push.bind(tile.actions.mouseupStream));
                });

                tile.actions.drawStream.push(tileMetadata.el);

                fn();
                return tileMetadata;
            });
        },
        getTileMetadata: function(tile, fn) {
            tile.getMetadata(function(tileMetadata) {
                tileMetadata['_hex_layout_' + this.layoutIdx] = tileMetadata['_hex_layout_' + this.layoutIdx] || {};
                tileMetadata['_hex_layout_' + this.layoutIdx] = fn.call(this, tileMetadata['_hex_layout_' + this.layoutIdx]) || tileMetadata['_hex_layout_' + this.layoutIdx];
                return tileMetadata;
            }.bind(this));
        },
        tileSize: 50,
        tileSpacing: 2,
    };

    return Layout;
});

