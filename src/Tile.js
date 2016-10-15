define([
    'baconjs'
], function(bacon) {
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

        this.actions.drawStream.onValue(function bindEventsToElement(el) {
            el.addEventListener('contextmenu', this.actions.contextmenuStream.push.bind(this.actions.contextmenuStream));
            el.addEventListener('touchend', this.actions.touchendStream.push.bind(this.actions.touchendStream));
            el.addEventListener('touchstart', this.actions.touchstartStream.push.bind(this.actions.touchstartStream));
            el.addEventListener('mouseout', this.actions.mouseoutStream.push.bind(this.actions.mouseoutStream));
            el.addEventListener('mouseover', this.actions.mouseoverStream.push.bind(this.actions.mouseoverStream));
            el.addEventListener('mouseup', this.actions.mouseupStream.push.bind(this.actions.mouseupStream));
        }.bind(this));

        this.actions.undrawStream.onValue(function unbindEventsToElement(el) {
            el.removeEventListener('contextmenu', this.actions.contextmenuStream.push.bind(this.actions.contextmenuStream));
            el.removeEventListener('touchend', this.actions.touchendStream.push.bind(this.actions.touchendStream));
            el.removeEventListener('touchstart', this.actions.touchstartStream.push.bind(this.actions.touchstartStream));
            el.removeEventListener('mouseout', this.actions.mouseoutStream.push.bind(this.actions.mouseoutStream));
            el.removeEventListener('mouseover', this.actions.mouseoverStream.push.bind(this.actions.mouseoverStream));
            el.removeEventListener('mouseup', this.actions.mouseupStream.push.bind(this.actions.mouseupStream));
        }.bind(this));

        this.actions.blurStream.onValue(function(event) {
            console.log('blurStream', event.type);
        });
        this.actions.focusStream.onValue(function(event) {
            console.log('focusStream', event.type);
        });
        this.actions.primaryStream.onValue(function(event) {
            console.log('primaryStream', event.type);
        });
        this.actions.secondaryStream.onValue(function(event) {
            console.log('secondaryStream', event.type);
        });
    };

    Tile.prototype = {
        /**
        * @param {number} [scale=1]
        */
        center: function(scale) {
            if (!scale) {
                scale = 1;
            }

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
        handleDraw: function handleDraw() {
        },
        handleUndraw: function handleUndraw() {
        },
        handleBlur: function handleBlur() {
        },
        handleFocus: function handleFocus() {
        },
        handleClick: function handleClick() {
        },
        pointy: true,
        /**
        * Returns two-dimensional array of verticies.
        * @param {number} scale
        */
        vertices: function(scale) {
            var i = -1, angle, vertices = [];
            var center = this.center(scale);

            while (++i < 6) {
                angle = 2 * Math.PI * (2 * i - (this.pointy ? 1 : 0)) / 12;
                vertices.push([
                    center[0] + 0.5 * scale * Math.cos(angle),
                    center[1] + 0.5 * scale * Math.sin(angle)
                ]);
            }

            return vertices;
        },

    };

    return Tile;
});

