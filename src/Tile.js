define([
    'baconjs',
    'Storage'
], function(Bacon, Storage) {
    function Tile(map, q, r, s) {
        this.map = map;
        this.coordinate = this.map.resolveCoordinate(q, r, s);

        this.actions = {
            // Map events.
            drawStream: new Bacon.Bus(),
            undrawStream: new Bacon.Bus(),

            // DOM events.
            contextmenuStream: new Bacon.Bus(),
            touchendStream: new Bacon.Bus(),
            touchstartStream: new Bacon.Bus(),
            mouseoutStream: new Bacon.Bus(),
            mouseoverStream: new Bacon.Bus(),
            mouseupStream: new Bacon.Bus(),

            // Composite events (allows Desktop/Mobile equivalency).
            blurStream: new Bacon.Bus(),
            focusStream: new Bacon.Bus(),
            primaryStream: new Bacon.Bus(),
            secondaryStream: new Bacon.Bus(),
        };

        this.actions.focusStream.plug(this.actions.mouseoverStream);
        this.actions.focusStream.plug(this.actions.touchstartStream);

        this.actions.blurStream.plug(this.actions.mouseoutStream);
        this.actions.blurStream.plug(this.actions.touchendStream);

        this.actions.primaryStream.plug(this.actions.mouseupStream);
        // @TODO mobile equivalency: long touch

        this.actions.secondaryStream.plug(this.actions.contextmenuStream);
        // @TODO mobile equivalency: double tap

        var unplugMapStreams = [];
        this.actions.drawStream.onValue(function() {
            unplugMapStreams.push(this.map.actions.tileBlurStream.plug(this.actions.blurStream));
            unplugMapStreams.push(this.map.actions.tileFocusStream.plug(this.actions.focusStream));
            unplugMapStreams.push(this.map.actions.tilePrimaryStream.plug(this.actions.primaryStream));
            unplugMapStreams.push(this.map.actions.tileSecondaryStream.plug(this.actions.secondaryStream));
        }.bind(this));

        this.actions.undrawStream.onValue(function() {
            _.each(unplugMapStreams, function(fn) {
                fn();
            });
        });
    };

    Tile.prototype = {
        /**
        * @param {number} scale
        */
        center: function(scale) {
            if (this.pointy) {
                return [
                    scale/2 * (Math.sqrt(3) * this.coordinate[0] + Math.sqrt(3) / 2 * this.coordinate[1]),
                    scale/2 * (1.5 * this.coordinate[1])
                ];
            } else {
                return [
                    scale/2 * (1.5 * this.coordinate[0]),
                    scale/2 * (Math.sqrt(3) / 2 * this.coordinate[0] + Math.sqrt(3) * this.coordinate[1])
                ];
            }
        },
        getMetadata: function(fn) {
            var key = 'Hex:Tile:' + this.coordinate.join(',');
            Storage.getItem(key, function(value) {
                var set = fn(value);
                if (set || set === null) {
                    Storage.setItem(key, set);
                }
            });
        },
        pointy: true,
        /**
        * Returns two-dimensional array of verticies.
        * @param {number} scale
        */
        vertices: function(scale, spacing) {
            var i = -1, angle, vertices = [];
            var center = this.center(scale);
            var hexSize = scale - (spacing || 0);

            while (++i < 6) {
                angle = 2 * Math.PI * (2 * i - (this.pointy ? 1 : 0)) / 12;
                vertices.push([
                    center[0] + 0.5 * hexSize * Math.cos(angle),
                    center[1] + 0.5 * hexSize * Math.sin(angle)
                ]);
            }

            return vertices;
        },

    };

    return Tile;
});

