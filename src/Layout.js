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
        pushTileActionHandlerFactory: function(stream, tile) {
            return function(event) {
                stream.push([event, tile]);
            }
        },
        drawTile: function(q, r, s) {
            if (this.map.checkOutOfBounds(q, r, s)) {
                return null;
            }

            var tile = this.map.getTile(q, r, s);
            var tileAttributes = this.getTileAttributes(tile);
            if (tileAttributes.el) {
                return tileAttributes;
            }

            tileAttributes.path = this.constructPath(tile.vertices(this.tileSize, this.tileSpacing));
            tileAttributes.el = this.elements.svg.append('path')
                .attr('d', tileAttributes.path.toString())
                .attr('fill', '#F0F')
                .attr('stroke', 'transparent')
                .attr('stroke-alignment', 'inner')
                .attr('stroke-location', 'inside')
                .attr('stroke-width', '4')
                .node();

            var contextmenuHandler = this.pushTileActionHandlerFactory(tile.actions.contextmenuStream, tile);
            var touchendHandler = this.pushTileActionHandlerFactory(tile.actions.touchendStream, tile);
            var touchstartHandler = this.pushTileActionHandlerFactory(tile.actions.touchstartStream, tile);
            var mouseoutHandler = this.pushTileActionHandlerFactory(tile.actions.mouseoutStream, tile);
            var mouseoverHandler = this.pushTileActionHandlerFactory(tile.actions.mouseoverStream, tile);
            var mouseupHandler = this.pushTileActionHandlerFactory(tile.actions.mouseupStream, tile);

            tile.actions.drawStream.onValue(function bindEventsToElement(el) {
                el.addEventListener('contextmenu', contextmenuHandler);
                el.addEventListener('touchend', touchendHandler);
                el.addEventListener('touchstart', touchstartHandler);
                el.addEventListener('mouseout', mouseoutHandler);
                el.addEventListener('mouseover', mouseoverHandler);
                el.addEventListener('mouseup', mouseupHandler);
            });

            tile.actions.undrawStream.onValue(function unbindEventsToElement(el) {
                el.removeEventListener('contextmenu', contextmenuHandler);
                el.removeEventListener('touchend', touchendHandler);
                el.removeEventListener('touchstart', touchstartHandler);
                el.removeEventListener('mouseout', mouseoutHandler);
                el.removeEventListener('mouseover', mouseoverHandler);
                el.removeEventListener('mouseup', mouseupHandler);
            });

            tile.actions.drawStream.push(tileAttributes.el);
            return tile;
        },
        getTileAttributes: function(tile) {
            var key = '_hex_layout_' + this.layoutIdx;
            tile.attributes[key] = tile.attributes[key] || {};
            return tile.attributes[key];
        },
        tileSize: 50,
        tileSpacing: 2,
    };

    return Layout;
});

