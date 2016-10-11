// Hexagonal grid functions
// From http://www.redblobgames.com/grids/hexagons.html
// Copyright 2013 Red Blob Games <redblobgames@gmail.com>
// License: Apache v2.0 <http://www.apache.org/licenses/LICENSE-2.0.html>

console.info("I'm happy to answer questions about the code — email me at redblobgames@gmail.com");


/* There are lots of diagrams on the page and many of them get updated
 * at the same time, on a button press. Drawing them all is slow; let's
 * delay the drawing.
 *
 * The logic is:
 * 1. If a diagram is updated, put it in a queue.
 * 2. If a diagram is in the queue and is on screen,
 *    a. if it's the first time drawing it, draw it immediately
 *    b. otherwise, animate the transition from previous state
 * 3. If a diagram is in the queue and is not on screen,
 *    draw it in the background (if the user is idle)
 */

// The idle tracker will call a callback when the user is idle 1000,
// 1100, 1200, etc. milliseconds. I use this to draw off-screen
// diagrams in the background. If there are no diagrams to redraw,
// call idle_tracker.stop() to remove the interval and event handlers.
var idle_tracker = {
    interval: 1000,
    idle_threshold: 1000,
    running: false,
    needs_to_run: false,
    last_activity: Date.now(),
    callback: null
};
idle_tracker.user_activity = function(e) {
    this.last_activity = Date.now();
}
idle_tracker.loop = function() {
    idle_tracker.running = setTimeout(idle_tracker.loop, idle_tracker.interval);
    if (idle_tracker.needs_to_run || Date.now() - idle_tracker.last_activity > idle_tracker.idle_threshold) {
        idle_tracker.callback();
    }
    idle_tracker.needs_to_run = false;
}
idle_tracker.start = function() {
    this.needs_to_run = true;
    if (!this.running) {
        // There is no loop running so start it, and also start tracking user idle
        this.running = setTimeout(this.loop, 0);
        window.addEventListener('scroll', this.user_activity);
        window.addEventListener('touchmove', this.user_activity);
    } else {
        // There's a loop scheduled but I want it to run immediately
        clearTimeout(this.running);
        this.running = setTimeout(this.loop, 1);
    }
};
idle_tracker.stop = function() {
    if (this.running) {
        // Stop tracking user idle when we don't need to (performance)
        window.removeEventListener('scroll', this.user_activity);
        window.removeEventListener('touchmove', this.user_activity);
        clearTimeout(this.running);
        this.running = false;
    }
}

// How far outside the viewport is this element? 0 if it's visible even partially.
function distanceToScreen(node) {
    // Compare two ranges: the top:bottom of the browser window and
    // the top:bottom of the element
    var viewTop = window.pageYOffset;
    var viewBottom = viewTop + window.innerHeight;

    // Workaround for Firefox: SVG nodes have no
    // offsetTop/offsetHeight so I check the parent instead
    if (node.offsetTop === undefined) {
        node = node.parentNode;
    }
    var elementTop = node.offsetTop;
    var elementBottom = elementTop + node.offsetHeight;
    return Math.max(0, elementTop - viewBottom, viewTop - elementBottom);
}

// Draw all the on-screen elements that are queued up, and anything
// else if we're idle
function _delayedDraw() {
    var actions = [];
    var idle_draws_allowed = 4;

    // First evaluate all the actions and how far the elements are from being viewed
    delay.queue.forEach(function(id, ea) {
        var element = ea[0], action = ea[1];
        var d = distanceToScreen(element.node());
        actions.push([id, action, d]);
    });

    // Sort so that the ones closest to the viewport are first
    actions.sort(function(a, b) { return a[2] - b[2]; });

    // Draw all the ones that are visible now, or up to
    // idle_draws_allowed that aren't visible now
    actions.forEach(function(ia) {
        var id = ia[0], action = ia[1], d = ia[2];
        if (d == 0 || idle_draws_allowed > 0) {
            if (d != 0) --idle_draws_allowed;

            delay.queue.remove(id);
            delay.refresh.add(id);

            var animate = delay.refresh.has(id) && d == 0;
            action(function(selection) {
                return animate? selection.transition().duration(200) : selection;
            });
        }
    });
}

// Function for use with d3.timer
function _delayDrawOnTimeout() {
    _delayedDraw();
    if (delay.queue.keys().length == 0) { idle_tracker.stop(); }
}

// Interface used by the rest of the code: call this function with the
// d3 selection of the element being drawn (typically an <svg>) and an
// action. The action will be called with an animate parameter, which
// is a function that takes a d3 selection and returns it optionally
// with an animated transition.
function delay(element, action) {
    delay.queue.set(element.attr('id'), [element, action]);
    idle_tracker.start();
}
delay.queue = d3.map();  // which elements need redrawing?
delay.refresh = d3.set();  // set of elements we've seen before
idle_tracker.callback = _delayDrawOnTimeout;
window.addEventListener('scroll', _delayedDraw);
window.addEventListener('resize', _delayedDraw);

/* NOTE: on iOS, scroll event doesn't occur until after the scrolling
 * stops, which is too late for this redraw. I am not sure how to do
 * this properly. Instead of drawing only on scroll, I also draw in
 * the background when the user is idle. */




// (x, y) should be the center
// scale should be the distance from corner to corner
// orientation should be 0 (flat bottom hex) or 1 (flat side hex)
function hexToPolygon(scale, x, y, orientation) {
    // NOTE: the article says to use angles 0..300 or 30..330 (e.g. I
    // add 30 degrees for pointy top) but I instead use -30..270
    // (e.g. I subtract 30 degrees for pointy top) because it better
    // matches the animations I needed for my diagrams. They're
    // equivalent.
    var points = [];
    for (var i = 0; i < 6; i++) {
        var angle = 2 * Math.PI * (2*i - orientation) / 12;
        points.push(new ScreenCoordinate(x + 0.5 * scale * Math.cos(angle),
                                         y + 0.5 * scale * Math.sin(angle)));
    }
    return points;
}


// Arrow drawing utility takes a <path>, source, dest, and sets the d= and transform
function makeArrow(path, w, skip, A, B, withBase) {
    var d = A.subtract(B);
    var h = d.length()-2*w-skip;

    var path_d = ['M', 0, 0];
    if (h > 0.0) {
        path_d = path_d.concat([
            'l', 2*w, 2*w,
            'l', 0, -w,
            'l', h, 0,
            'l', -0.3*w, -w,
            'l', 0.3*w, -w,
            'l', -h, 0,
            'l', 0, -w,
            'Z']);
        if (withBase) {
            path_d = path_d.concat([
                'M', h+w, -10*w,
                'l', 0, 20*w
            ]);
        }
    }
    
    path
        .attr('transform', "translate(" + B + ") rotate(" + (180 / Math.PI * Math.atan2(d.y, d.x)) + ")")
        .attr('d', path_d.join(" "));
}


// The shape of a hexagon is adjusted by the scale; the rotation is handled elsewhere, using svg transforms
function makeHexagonShape(scale) {
    return hexToPolygon(scale, 0, 0, false).map(function(p) { return p.x.toFixed(3) + "," + p.y.toFixed(3); }).join(" ");
}


/* A grid diagram will be an object with
   1. nodes = { cube: Cube object, key: string, node: d3 selection of <g> containing polygon }
   2. grid = Grid object
   3. root = d3 selection of root <g> of diagram
   4. polygons = d3 selection of the hexagons inside the <g> per tile
   5. update = function(scale, orientation) to call any time orientation changes, including initialization
   6. onLayout = callback function that will be called before an update (to assign new cube coordinates)
      - this will be called immediately on update
   7. onUpdate = callback function that will be called after an update
      - this will be called after a delay, and only if there hasn't been another update
      - since it may not be called, this function should only affect the visuals and not data
*/
function makeGridDiagram(svg, cubes) {
    var diagram = {};

    diagram.nodes = cubes.map(function(n) { return {cube: n, key: n.toString()}; });
    diagram.root = svg.append('g');
    diagram.tiles = diagram.root.selectAll("g.tile").data(diagram.nodes, function(node) { return node.key; });
    diagram.tiles.enter()
        .append('g').attr('class', "tile")
        .each(function(d) { d.node = d3.select(this); });
    diagram.polygons = diagram.tiles.append('polygon');


    diagram.makeTilesSelectable = function(callback) {
        diagram.selected = d3.set();
        diagram.toggle = function(cube) {
            if (diagram.selected.has(cube)) {
                diagram.selected.remove(cube);
            } else {
                diagram.selected.add(cube);
            }
        };

        var drag_state = 0;
        var drag = d3.behavior.drag()
            .on('dragstart', function(d) {
                drag_state = diagram.selected.has(d.cube);
            })
            .on('drag', function() {
                var target = d3.select(d3.event.sourceEvent.target);
                if (target !== undefined && target.data()[0] && target.data()[0].cube) {
                    var cube = target.data()[0].cube;
                    if (drag_state) {
                        diagram.selected.remove(cube);
                    } else {
                        diagram.selected.add(cube);
                    }
                }
                callback();
            });
                
        diagram.tiles
            .on('click', function(d) {
                d3.event.preventDefault();
                diagram.toggle(d.cube);
                callback();
            })
            .call(drag);
    };


    diagram.addLabels = function(labelFunction) {
        diagram.tiles.append('text')
            .attr('y', "0.4em")
            .text(function(d, i) { return labelFunction? labelFunction(d, i) : ""; });
        return diagram;
    };


    diagram.addHexCoordinates = function(converter, withMouseover) {
        diagram.nodes.forEach(function (n) { n.hex = converter(n.cube); });
        diagram.tiles.append('text')
            .attr('y', "0.4em")
            .each(function(d) {
                var selection = d3.select(this);
                selection.append('tspan').attr('class', "q").text(d.hex.q);
                selection.append('tspan').text(", ");
                selection.append('tspan').attr('class', "r").text(d.hex.r);
            });

        function setSelection(hex) {
            diagram.tiles
                .classed('q-axis-same', function(other) { return hex.q == other.hex.q; })
                .classed('r-axis-same', function(other) { return hex.r == other.hex.r; });
        }

        if (withMouseover) {
            diagram.tiles
                .on('mouseover', function(d) { setSelection(d.hex); })
                .on('touchstart', function(d) { setSelection(d.hex); });
        }

        return diagram;
    };


    diagram.addCubeCoordinates = function(withMouseover) {
        diagram.tiles.append('text')
            .each(function(d) {
                var selection = d3.select(this);
                var labels = [d.cube.x, d.cube.y, d.cube.z];
                if (labels[0] == 0 && labels[1] == 0 && labels[2] == 0) {
                    // Special case: label the origin with x/y/z so that you can tell where things to
                    labels = ["x", "y", "z"];
                }
                selection.append('tspan').attr('class', "q").text(labels[0]);
                selection.append('tspan').attr('class', "s").text(labels[1]);
                selection.append('tspan').attr('class', "r").text(labels[2]);
            });

        function relocate() {
            var BL = 4;  // adjust to vertically center
            var offsets = diagram.orientation? [14, -9+BL, -14, -9+BL, 0, 13+BL] : [13, 0+BL, -9, -14+BL, -9, 14+BL];
            offsets = offsets.map(function(f) { return f * diagram.scale / 50; });
            diagram.tiles.select(".q").attr('x', offsets[0]).attr('y', offsets[1]);
            diagram.tiles.select(".s").attr('x', offsets[2]).attr('y', offsets[3]);
            diagram.tiles.select(".r").attr('x', offsets[4]).attr('y', offsets[5]);
        }

        function setSelection(cube) {
            ["q", "s", "r"].forEach(function (axis, i) {
                diagram.tiles.classed(axis + "-axis-same", function(other) { return cube.v()[i] == other.cube.v()[i]; });
            });
        }

        if (withMouseover) {
            diagram.tiles
                .on('mouseover', function(d) { return setSelection(d.cube); })
                .on('touchstart', function(d) { return setSelection(d.cube); });
        }

        diagram.onUpdate(relocate);
        return diagram;
    };


    diagram.addPath = function() {
        diagram.pathLayer = this.root.append('path')
            .attr('d', "M 0 0")
            .attr('class', "path");
        diagram.setPath = function(path) {
            var d = [];
            for (var i = 0; i < path.length; i++) {
                d.push(i == 0? 'M' : 'L');
                d.push(diagram.grid.hexToCenter(path[i]));
            }
            diagram.pathLayer.attr('d', d.join(" "));
        };
    };
    
        
    var pre_callbacks = [];
    var post_callbacks = [];
    diagram.onLayout = function(callback) { pre_callbacks.push(callback); };
    diagram.onUpdate = function(callback) { post_callbacks.push(callback); };
    
    var hexagon_points = makeHexagonShape(diagram.scale);

    diagram.update = function(scale, orientation) {
        if (scale != diagram.scale) {
            diagram.scale = scale;
            hexagon_points = makeHexagonShape(scale);
            diagram.polygons.attr('points', hexagon_points);
        }
        diagram.orientation = orientation;

        pre_callbacks.forEach(function (f) { f(); });
        var grid = new Grid(scale, orientation, diagram.nodes.map(function(node) { return node.cube; }));
        var bounds = grid.bounds();
        var first_draw = !diagram.grid;
        diagram.grid = grid;

        delay(svg, function(animate) {
            if (first_draw) { animate = function(selection) { return selection; }; }

            // NOTE: In Webkit I can use svg.node().clientWidth but in Gecko that returns 0 :(
            diagram.translate = new ScreenCoordinate((parseFloat(svg.attr('width')) - bounds.minX - bounds.maxX)/2,
                                                     (parseFloat(svg.attr('height')) - bounds.minY - bounds.maxY)/2);
            animate(diagram.root)
                .attr('transform', "translate(" + diagram.translate + ")");

            animate(diagram.tiles)
                .attr('transform', function(node) {
                    var center = grid.hexToCenter(node.cube);
                    return "translate(" + center.x + "," + center.y + ")";
                });

            animate(diagram.polygons)
                .attr('transform', "rotate(" + (orientation * -30) + ")");

            post_callbacks.forEach(function (f) { f(); });
        });

        return diagram;
    };

    return diagram;
}


makeGridDiagram(d3.select('#grid-offset-odd-q'),
                Grid.trapezoidalShape(0, 7, 0, 5, Grid.oddQToCube))
    .addHexCoordinates(Grid.cubeToOddQ, true)
    .update(40, false);
makeGridDiagram(d3.select('#grid-offset-even-q'),
                Grid.trapezoidalShape(0, 7, 0, 5, Grid.evenQToCube))
    .addHexCoordinates(Grid.cubeToEvenQ, true)
    .update(40, false);
makeGridDiagram(d3.select('#grid-offset-odd-r'),
                Grid.trapezoidalShape(0, 6, 0, 6, Grid.oddRToCube))
    .addHexCoordinates(Grid.cubeToOddR, true)
    .update(40, true);
makeGridDiagram(d3.select('#grid-offset-even-r'),
                Grid.trapezoidalShape(0, 6, 0, 6, Grid.evenRToCube))
    .addHexCoordinates(Grid.cubeToEvenR, true)
    .update(40, true);



// Diagram "parts"

function makeParts() {
    var size = 215;
    var svg = d3.select("#hexagon-parts");

    svg.append('g')
        .attr('class', "tile");
    var polygon = svg.selectAll("g.tile").append("polygon")
            .attr('points', makeHexagonShape(size));

    var center_marker = svg.append('circle')
        .attr('class', "marker")
        .attr('r', 5);
    var center_text = svg.append('text')
        .text("center")
        .attr('class', "center");

    var corner_marker = svg.append('circle')
        .attr('class', "marker")
        .attr('r', 5);
    var corner_text = svg.append('text')
        .text("corner")
        .attr('class', "center");

    var edge_marker = svg.append('line')
        .attr('class', "marker");
    var edge_text = svg.append('text')
        .text("edge");

    return function(orientation) {
        var center = new ScreenCoordinate(130, 108);
        var corner = hexToPolygon(size, center.x, center.y, orientation)[3];
        var edge = hexToPolygon(size, center.x, center.y, orientation).slice(1, 3);

        delay(svg, function(animate) {
            animate(polygon)
                .attr('transform', "translate(" + center + "), rotate(" + (orientation * -30) + ")");

            animate(center_marker)
                .attr('transform', "translate(" + center + ")");
            animate(center_text)
                .attr('transform', "translate(" + center + ") translate(0, 15)");

            animate(corner_marker)
                .attr('transform', "translate(" + corner + ")");
            animate(corner_text)
                .attr('transform', "translate(" + corner + ") translate(25, 5)");

            animate(edge_marker)
                .attr('x1', edge[0].x)
                .attr('y1', edge[0].y)
                .attr('x2', edge[1].x)
                .attr('y2', edge[1].y);
            animate(edge_text)
                .attr('transform', "translate(" + 0.5*(edge[0].x + edge[1].x) + "," + 0.5*(edge[0].y + edge[1].y) + ") translate(" + 10*orientation + ", 15)");
        });
    };
}


// Diagram "angles"

function makeAngles() {
    var size = 215;
    var svg = d3.select("#hexagon-angles");

    svg.append('g')
        .attr('class', "tile");
    var polygon = svg.selectAll("g.tile").append("polygon")
            .attr('points', makeHexagonShape(size));

    var triangle = svg.append('path')
        .attr('fill', "none")
        .attr('stroke-dasharray', "4,3")
        .attr('stroke-width', 1)
        .attr('stroke', "hsl(0, 0%, 50%)");

    var radius_texts = [
        svg.append('text').text("size"),
        svg.append('text').text("size"),
        svg.append('text').text("size"),
    ];

    var triangle_text_1 = svg.append('text')
        .text("60°");

    var triangle_text_2 = svg.append('text')
        .text("60°");

    var triangle_text_3 = svg.append('text')
        .text("60°");

    var interior_angle_text = svg.append('text')
        .text("120°");

    var exterior_angle_texts = svg.selectAll("text.exterior-angle")
        .data([0, 60, 120, 180, 240, 300])
        .enter()
        .append('text')
        .attr('class', "exterior-angle");

    return function(orientation) {
        var center = new ScreenCoordinate(130, 130);
        var corners = hexToPolygon(size, center.x, center.y, orientation);

        delay(svg, function(animate) {
            animate(polygon)
                .attr('transform', "translate(" + center + "), rotate(" + (orientation * -30) + ")");

            animate(triangle)
                .attr('d', ['M', corners[0], 'L', center, 'L', corners[1]].join(" "));

            animate(triangle_text_1)
                .attr('transform', "translate(" + (corners[0].scale(0.8)
                                                   .add(corners[1].scale(0.1))
                                                   .add(center.scale(0.1))) + ") translate(0, 4)");

            animate(triangle_text_2)
                .attr('transform', "translate(" + (corners[1].scale(0.8)
                                                   .add(corners[0].scale(0.1))
                                                   .add(center.scale(0.1))) + ") translate(0, 4)");

            animate(triangle_text_3)
                .attr('transform', "translate(" + (center.scale(0.8)
                                                   .add(corners[0].scale(0.1))
                                                   .add(corners[1].scale(0.1))) + ") translate(0, 4)");

            animate(radius_texts[0])
                .attr('transform', "translate(" + (center.scale(0.55)
                                                   .add(corners[0].scale(0.55))
                                                   .add(corners[1].scale(-0.1))) + ") translate(0, 4)");

            animate(radius_texts[1])
                .attr('transform', "translate(" + (center.scale(0.55)
                                                   .add(corners[1].scale(0.55))
                                                   .add(corners[0].scale(-0.1))) + ") translate(0, 4)");

            animate(radius_texts[2])
                .attr('transform', "translate(" + (center.scale(-0.1)
                                                   .add(corners[0].scale(0.55))
                                                   .add(corners[1].scale(0.55))) + ") translate(0, 4)");

            animate(interior_angle_text)
                .attr('transform', "translate(" + (corners[2].scale(0.85)
                                                   .add(center.scale(0.15))) + ") translate(0, 4)");

            animate(exterior_angle_texts)
                .attr('transform', function(degrees, i) {
                    return "translate(" + corners[i].subtract(center).scale(1.1).add(center) + ") translate(0, 4)";
                })
                .text(function(degrees) {
                    // See note about angles in hexToPolygon()
                    return ((degrees - orientation * 30 + 360) % 360) + "°";
                });
        });
    };
}


// Diagram "spacing"

function format_quarters(a) {
    // Format a/4 as a mixed numeral
    var suffix = ["", "¼", "½", "¾"][a % 4];
    var prefix = Math.floor(a/4);
    if (prefix == 0 && suffix != "") { prefix = ""; }
    return prefix + suffix;
}

function makeSpacing() {
    var size = 160;
    var svg = d3.select("#hexagon-spacing");

    var tiles = svg.selectAll("g.tile").data([0, 1, 2, 3])
        .enter()
        .append('g')
        .attr('class', "tile");

    var polygons = tiles.append('polygon')
            .attr('points', makeHexagonShape(size));
    
    var centers = tiles.append('circle')
        .attr('class', "marker")
        .attr('r', 4);

    return function(orientation) {
        var r = size/2;
        var s = Grid.SQRT_3_2 * r;
        var center = new ScreenCoordinate(70, 40);
        var offsets = orientation? [
            new ScreenCoordinate(s, 2.5 * r),
            new ScreenCoordinate(2 * s, r),
            new ScreenCoordinate(3 * s, 2.5 * r),
            new ScreenCoordinate(4 * s, r),
            ] : [
            new ScreenCoordinate(r, 2 * s),
            new ScreenCoordinate(2.5 * r, s),
            new ScreenCoordinate(2.5 * r, 3 * s),
            new ScreenCoordinate(4 * r, 2 * s),
        ];

        delay(svg, function(animate) {
            animate(tiles)
                .attr('transform', function(_, i) {
                    return "translate(" + center.add(offsets[i]) + ")";
                });

            animate(polygons)
                .attr('transform', "rotate(" + (orientation * -30) + ")");
            
            // NOTE: I should be using d3's exit().remove() here but I
            // haven't learned how to properly handle the nested elements
            // so I'm just taking the easy way out and removing all the
            // old ones every time.
            svg.selectAll("g.grid-horizontal").remove();
            var horizontal_lines = svg.selectAll("g.grid-horizontal")
                .data(orientation? [0, 1, 2, 3, 4, 5, 6, 7]
                      : [0, 1, 2, 3, 4]
                      , String);
            var g = horizontal_lines
                .enter()
                .append('g')
                .attr('class', "grid-horizontal");
            horizontal_lines
                .attr('transform', function(y) {
                    return "translate(" + center.add(new ScreenCoordinate(0, y * (orientation? (r/2):s))) + ")";
                });

            g.append('path')
                .attr('d', ['M', -20, 0, 'L', orientation? 5*s : 5*r, 0].join(" "));
            g.append('text')
                .attr('transform', "translate(-30, 4)")
                .text(function(y) { return format_quarters(orientation? y : (2*y)) + "h"; });

            svg.selectAll("g.grid-vertical").remove();
            var vertical_lines = svg.selectAll("g.grid-vertical")
                .data(orientation? [0, 1, 2, 3, 4, 5]
                      : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                      , String);
            g = vertical_lines
                .enter()
                .append('g')
                .attr('class', "grid-vertical");
            vertical_lines
                .attr('transform', function(x) {
                    return "translate(" + center.add(new ScreenCoordinate(x * (orientation? s:(r/2)), 0)) + ")";
                });

            g.append('path')
                .attr('d', ['M', 0, -20, 'L', 0, orientation? 3.5*r : 4*s].join(" "));
            g.append('text')
                .attr('transform', "translate(0, -30)")
                .text(function(x) { return format_quarters(orientation? (2*x) : x) + "w"; });
        });
    };
}


function makeGridComparison() {
    var svg = d3.select("#grid-comparison");
    
    makeArrow(svg.append('path').attr('class', "r-axis"), 5, 0,
              new ScreenCoordinate(60, 50),
              new ScreenCoordinate(60, 120),
              true);
    makeArrow(svg.append('path').attr('class', "q-axis"), 5, 0,
              new ScreenCoordinate(70, 40),
              new ScreenCoordinate(130, 40),
             true);
    svg.append('text')
        .attr('transform', "translate(70, 170)")
        .attr('text-anchor', "middle")
        .text("Offset");

    var grid = new Grid(60, false, []);
    var gCube = svg.append('g').attr('transform', "translate(230, 60)");
    var g = gCube.append('g');
    makeArrow(g.append('path').attr('class', "x-axis"), 5, 0,
              grid.hexToCenter(new Cube(0.2, -0.1, -0.1)),
              grid.hexToCenter(new Cube(1.5, -0.75, -0.75)),
              true);
    makeArrow(g.append('path').attr('class', "y-axis"), 5, 0,
              grid.hexToCenter(new Cube(-0.1, 0.2, -0.1)),
              grid.hexToCenter(new Cube(-0.75, 1.5, -0.75)),
              true);
    makeArrow(g.append('path').attr('class', "z-axis"), 5, 0,
              grid.hexToCenter(new Cube(-0.1, -0.1, 0.2)),
              grid.hexToCenter(new Cube(-0.75, -0.75, 1.5)),
              true);
    gCube.append('text')
        .attr('transform', "translate(0, 110)")
        .attr('text-anchor', "middle")
        .text("Cube");

    var gAxial = svg.append('g').attr('transform', "translate(370, 60)");
    g = gAxial.append('g');
    makeArrow(g.append('path').attr('class', "q-axis"), 5, 0,
              grid.hexToCenter(new Cube(0.2, -0.1, -0.1)),
              grid.hexToCenter(new Cube(1.5, -0.75, -0.75)),
              true);
    makeArrow(g.append('path').attr('class', "r-axis"), 5, 0,
              grid.hexToCenter(new Cube(-0.1, -0.1, 0.2)),
              grid.hexToCenter(new Cube(-0.75, -0.75, 1.5)),
             true);
    gAxial.append('text')
        .attr('transform', "translate(0, 110)")
        .attr('text-anchor', "middle")
        .text("Axial");

    return function(orientation) {
        var transformation = "rotate(" + (orientation * -30) + ")";
        delay(svg, function(animate) {
            animate(gCube.selectAll("g")).attr('transform', transformation);
            animate(gAxial.selectAll("g")).attr('transform', transformation);
        });
    };
}


function makeNeighbors(id_diagram, id_code, converter, parity_var) {
    // Note that this code is a little messy because I'm trying to handle cube, axial, offset
    var code = d3.select(id_code).selectAll("span.table span");
    var code_parity = d3.select(id_code).selectAll("span.parity");
    var numSpans = code[0].length;  // should be 6 (axial) or 12 (offset)

    // There will be either 7 (axial) or 14 nodes (offset)
    var cubes = [];
    for (var i = 0; i < (numSpans * 7 / 6); i++) {
        if (converter == null) {
            cubes.push(i < 6? Cube.direction(i) : new Cube(0, 0, 0));
        } else {
            cubes.push(new Cube(i, -i, 0));  // dummy coordinates for now
        }
    }

    var diagram = makeGridDiagram(d3.select(id_diagram), cubes);
    diagram.parity_var = parity_var;
    diagram.converter = converter;
    diagram.nodes.forEach(function (d, i) {
        d.direction = (i < numSpans)? (i % 6) : null;
        d.key = i;
    });

    if (converter) {
        diagram.addLabels();
    } else {
        diagram.addCubeCoordinates(false);
    }

    function neighbor(odd, i) {
        var base = odd? new Cube(1, -2, 1) : new Cube(0, 0, 0);
        var h1 = diagram.converter(base);
        var h2 = diagram.converter(Cube.neighbor(base, i));
        var dq = h2.q - h1.q, dr = h2.r - h1.r;
        return new Hex(dq, dr);
    }

    if (diagram.converter) {
        diagram.onUpdate(function() {
            diagram.tiles.selectAll("text").text(function(d) {
                if (d.key < numSpans) {
                    var h = neighbor(d.key >= 6, d.direction);
                    return [h.q > 0? "+" : "", h.q == 0? "0" : h.q, ", ",
                            h.r > 0? "+" : "", h.r == 0? "0" : h.r].join("");
                } else if (numSpans == 12) {
                    return ((d.key == 12)? "EVEN" : "ODD") + " " + diagram.parity_var;
                } else {
                    return "axial";
                }
            });
            code_parity.text(diagram.parity_var);
            code.text(function(_, i) {
                var h = neighbor(i >= 6, i % 6);
                function fmt(x) { if (x > 0) x = "+" + x; else x = "" + x; if (x.length < 2) x = " " + x; return x; }
                return ["Hex(", fmt(h.q), ", ", fmt(h.r), ")"].join("");
            });
        });
    }


    diagram.onLayout(function() {
        var offcenter = diagram.orientation? new Cube(4, -4, 0) : new Cube(4, -2, -2);

        diagram.nodes.forEach(function (d, i) {
            if (i < 6) {
                d.cube = Cube.direction(i);
            } else if (i < 12 && numSpans == 12) {
                d.cube = Cube.neighbor(offcenter, i % 6);
            } else if (i == 13) {
                d.cube = offcenter;
            } else {
                d.cube = new Cube(0, 0, 0);
            }
        });
    });

    function setSelection(d) {
        code.classed('highlight', function(_, i) { return i < numSpans && i == d.key; });
        diagram.tiles.classed('highlight', function(_, i) { return i < numSpans && i == d.key; });
    }

    diagram.tiles
        .on('mouseover', setSelection)
        .on('touchstart', setSelection);

    return diagram;
}


function makeDistances() {
    var diagram = makeGridDiagram(d3.select("#diagram-distances"),
                                  Grid.hexagonalShape(5))
        .addCubeCoordinates(false);

    var mouseover = new Cube(0, 0, 0);
    diagram.tiles
        .on('mouseover', function(d) { mouseover = d.cube; redraw(); })
        .on('touchstart', function(d) { mouseover = d.cube; redraw(); })
        .on('touchmove', function(d) { mouseover = d.cube; redraw(); })
        .each(function(d) {
            var len = Cube.$length(d.cube);
            var text = d3.select(this);
            text.select(".q").classed('highlight', Math.abs(d.cube.x) == len);
            text.select(".s").classed('highlight', Math.abs(d.cube.y) == len);
            text.select(".r").classed('highlight', Math.abs(d.cube.z) == len);
        });

    diagram.addPath();
    
    function redraw() {
        var line = FractionalCube.cubeLinedraw(new Cube(0, 0, 0), mouseover);
        diagram.setPath(line);
        line = d3.set(line.slice(1));
        diagram.tiles
            .classed('highlight', function(d) { return line.has(d.cube); });
    }
    
    return diagram;
}


function adjustTextForOrientation(orientation) {
    d3.selectAll(".orientation-adjust-degrees")
        .text(orientation? " + 30°" : "");
    d3.selectAll(".orientation-adjust-code")
        .text(orientation? " + 30" : "");
    d3.selectAll(".orientation-vertical-horizontal")
        .text(orientation? "horizontal" : "vertical");
    d3.selectAll(".orientation-horizontal-vertical")
        .text(orientation? "vertical" : "horizontal");
    d3.selectAll(".orientation-height-width")
        .text(orientation? "width" : "height");
    d3.selectAll(".orientation-width-height")
        .text(orientation? "height" : "width");
    d3.selectAll(".orientation-vert-horiz")
        .text(orientation? "horiz" : "vert");
    d3.selectAll(".orientation-horiz-vert")
        .text(orientation? "vert" : "horiz");
    d3.selectAll(".orientation-northwest-north")
        .text(orientation? "northwest" : "north");
}


// Rotation of a hex vector
function makeRotation() {
    var diagram = makeGridDiagram(d3.select("#diagram-rotation"),
                                  Grid.hexagonalShape(5))
        .addCubeCoordinates(false);

    var target = new Cube(2, 0, -2);
    diagram.tiles
        .on('mouseover', function(d) { target = d.cube; redraw(); })
        .on('touchstart', function(d) { target = d.cube; redraw(); })
        .on('touchmove', function(d) { target = d.cube; redraw(); });

    var arrow_target = diagram.root.append('path').attr('class', "arrow target");
    var arrow_left = diagram.root.append('path').attr('class', "arrow left");
    var arrow_right = diagram.root.append('path').attr('class', "arrow right");

    var center = new Cube(0, 0, 0);
    function redraw() {
        var left1 = target.rotateLeft();
        var right1 = target.rotateRight();
        var left2 = left1.rotateLeft();
        var right2 = right1.rotateRight();
        var opposite = right2.rotateRight();

        makeArrow(arrow_target, 5, 0, diagram.grid.hexToCenter(center), diagram.grid.hexToCenter(target), false);
        makeArrow(arrow_left, 3, 25, diagram.grid.hexToCenter(target), diagram.grid.hexToCenter(left1), false);
        makeArrow(arrow_right, 3, 25, diagram.grid.hexToCenter(target), diagram.grid.hexToCenter(right1), false);
        diagram.tiles
            .classed('center', function(d) { return d.cube.equals(center); })
            .classed('target', function(d) { return d.cube.equals(target); })
            .classed('opposite', function(d) { return d.cube.equals(opposite); })
            .classed('left1', function(d) { return d.cube.equals(left1); })
            .classed('right1', function(d) { return d.cube.equals(right1); })
            .classed('left2', function(d) { return d.cube.equals(left2); })
            .classed('right2', function(d) { return d.cube.equals(right2); });
    }

    diagram.onUpdate(redraw);
    return diagram;
}


// Spiral ring is a union of rings, but I use the same code for a single ring
function makeSpiral(id, spiral) {
    var diagram = makeGridDiagram(d3.select("#" + id), Grid.hexagonalShape(5));

    var N = 2;
    diagram.tiles
        .on('mouseover', function(d) { N = Cube.$length(d.cube); redraw(); })
        .on('touchstart', function(d) { N = Cube.$length(d.cube); redraw(); })
        .on('touchmove', function(d) { N = Cube.$length(d.cube); redraw(); });

    function redraw() {
        // Here's the spiral ring algorithm as described in the article
        var results = [new Cube(0, 0, 0)];
        for (var k = spiral? 1 : N; k <= N; k++) {
            var H = Cube.scale(Cube.direction(4), k);
            for (var i = 0; i < 6; i++) {
                for (var j = 0; j < k; j++) {
                    results.push(H);
                    H = Cube.neighbor(H, i);
                }
            }
        }

        var results_set = d3.set(results);
        diagram.tiles
            .classed('ring', function(d) { return (d.key != "0,0,0" || spiral || N == 0) && results_set.has(d.cube); });

        // Also draw arrows showing the order in which we traversed hexes
        var arrows = diagram.root.selectAll("path.arrow").data(d3.range(results.length-1));
        arrows.exit().remove();
        arrows.enter().append('path')
            .attr('class', "arrow");
        arrows
            .each(function(d) {
                makeArrow(d3.select(this), 4, 15,
                          diagram.grid.hexToCenter(results[d]),
                          diagram.grid.hexToCenter(results[d+1]));
            });
    }

    diagram.onUpdate(redraw);
    return diagram;
}


// Helper function used for hex regions. A hex shaped region is the
// subset of hexes where a <= x <= b, c <= y <= d, e <= z <= f
function colorRegion(diagram, xmin, xmax, ymin, ymax, zmin, zmax, label) {
    // Here's the range algorithm as described in the article
    var results = d3.set();
    for (var x = xmin; x <= xmax; x++) {
        for (var y = Math.max(ymin, -x-zmax); y <= Math.min(ymax, -x-zmin); y++) {
            var z = -x-y;
            results.add(new Cube(x, y, z));
        }
    }

    diagram.tiles.classed(label, function(d) { return results.has(d.cube); });
}

function makeHexRegion() {
    var diagram = makeGridDiagram(d3.select("#diagram-hex-range"), Grid.hexagonalShape(5));
    var line_data = [
        ["x-axis", -120, -1, "dx ≤ $N"],
        ["x-axis", 60, +1, "dx ≥ -$N"],
        ["y-axis", 120, -1, "dy ≤ $N"],
        ["y-axis", -60, +1, "dy ≥ -$N"],
        ["z-axis", 0, +1, "dz ≤ $N"],
        ["z-axis", 180, -1, "dz ≥ -$N"],
    ];

    var lines = diagram.root.selectAll("line").data(line_data).enter().append('g');
    lines.append('line')
        .attr('class', function(d) { return d[0]; })
        .attr('x1', -250).attr('y1', 0).attr('x2', 250).attr('y2', 0);
    lines.append('text');
    
    var N = 3;
    diagram.tiles
        .on('mouseover', function(d) { N = Cube.$length(d.cube); redraw(); })
        .on('touchstart', function(d) { N = Cube.$length(d.cube); redraw(); })
        .on('touchmove', function(d) { N = Cube.$length(d.cube); redraw(); });

    function transform(d) {
        var angle = d[1];
        return "rotate(" + (angle + (diagram.orientation? 0:30)) + ") translate(0," + (N * 40) + ")";
    }

    function redraw() {
        colorRegion(diagram, -N, N, -N, N, -N, N, 'region');
        lines.attr('transform', transform);
        lines.select("text")
            .attr('transform', function(d) { return "rotate(" + (d[2] == -1? 180 : 0) + ") translate(0," + (d[2] == -1? 12 : -4) + ")"; })
            .style('font-size', N == 0? "0%" : N == 1? "60%" : N == 2? "80%" : "")
            .text(function(d) { return d[3].replace("$N", N); });
    }

    diagram.onUpdate(redraw);
    return diagram;
}

function makeIntersection() {
    var diagram = makeGridDiagram(d3.select("#diagram-intersection"), Grid.hexagonalShape(7));

    var center = new Cube(0, 0, 0);
    diagram.tiles
        .on('mouseover', function(d) { center = d.cube; redraw(); })
        .on('touchstart', function(d) { center = d.cube; redraw(); })
        .on('touchmove', function(d) { center = d.cube; redraw(); });

    function redraw() {
        var N = 3, x = center.x, y = center.y, z = center.z;
        // This region is fixed
        colorRegion(diagram, -4-N, -4+N, -N, N, 4-N, 4+N, 'regionB');
        // This region is moved by the user
        colorRegion(diagram, x-N, x+N, y-N, y+N, z-N, z+N, 'regionA');
        // This region is the intersection of the first two
        colorRegion(diagram,
                    Math.max(-4-N, x-N), Math.min(-4+N, x+N),
                    Math.max(-N, y-N), Math.min(N, y+N),
                    Math.max(4-N, z-N), Math.min(4+N, z+N),
                    'regionC');
        // Always draw the hex the user has selected
        colorRegion(diagram, x, x, y, y, z, z, 'center');
    }

    diagram.onUpdate(redraw);
    return diagram;
}


function breadthFirstSearch(start, maxMovement, maxMagnitude, blocked) {
    /* see http://www.redblobgames.com/pathfinding/a-star/introduction.html */
    var cost_so_far = d3.map(); cost_so_far.set(start, 0);
    var came_from = d3.map(); came_from.set(start, null);
    var fringes = [[start]];
    for (var k = 0; k < maxMovement && fringes[k].length > 0; k++) {
        fringes[k+1] = [];
        fringes[k].forEach(function(cube) {
                  for (var dir = 0; dir < 6; dir++) {
                      var neighbor = Cube.neighbor(cube, dir);
                      if (!cost_so_far.has(neighbor) && !blocked(neighbor) && Cube.$length(neighbor) <= maxMagnitude) {
                          cost_so_far.set(neighbor, k+1);
                          came_from.set(neighbor, cube);
                          fringes[k+1].push(neighbor);
                      }
                  }
              });
    }
    return {cost_so_far: cost_so_far, came_from: came_from};
}
        

function makeMovementRange() {
    var diagram = makeGridDiagram(d3.select("#diagram-movement-range"), Grid.hexagonalShape(5))
        .addLabels();

    diagram.makeTilesSelectable(redraw);
    diagram.selected = d3.set([
        new Cube(2, -1, -1),
        new Cube(2, -2, 0),
        new Cube(0, -2, 2),
        new Cube(-1, -1, 2),
        new Cube(-1, 0, 1),
        new Cube(1, 0, -1),
        new Cube(1, -3, 2),
        new Cube(1, 2, -3),
        new Cube(0, 2, -2),
        new Cube(-1, 2, -1),
        new Cube(2, -3, 1),
        new Cube(-2, 1, 1),
        new Cube(-3, 1, 2),
        new Cube(-4, 1, 3),
        new Cube(-5, 1, 4)
    ]);

    var mouseover = new Cube(2, 2, -4);
    diagram.tiles
        .on('mouseover', function(d) { mouseover = d.cube; redraw(); })
        .on('touchstart', function(d) { mouseover = d.cube; redraw(); })
        .on('touchmove', function(d) { mouseover = d.cube; redraw(); });

    var distance_limit = 4;
    
    function redraw() {
        var bfs = breadthFirstSearch(new Cube(0, 0, 0), Infinity, 5, diagram.selected.has.bind(diagram.selected));

        distance_limit = parseInt(d3.select("#limit-movement-range").node().value);
        d3.selectAll(".movement-range").text(distance_limit);
        
        diagram.tiles
            .classed('blocked', function(d) { return diagram.selected.has(d.cube); })
            .classed('shadow', function(d) { return !bfs.cost_so_far.has(d.cube) || bfs.cost_so_far.get(d.cube) > distance_limit; })
            .classed('start', function(d) { return Cube.$length(d.cube) == 0; })
            .classed('goal', function(d) { return d.cube.equals(mouseover); });
        diagram.tiles.selectAll("text")
            .text(function(d) { return bfs.cost_so_far.has(d.cube)? bfs.cost_so_far.get(d.cube) : ""; });

        // Reconstruct path to mouseover position
        var path = [];
        var node = mouseover;
        while (node != null) {
            path.push(node);
            node = bfs.came_from.get(node);
        }
        diagram.setPath(path);
    }

    diagram.onUpdate(redraw);
    diagram.addPath();

    d3.select("#limit-movement-range")
        .on('change', redraw)
        .on('input', redraw);
    
    return diagram;
}


function makePathfinding() {
    var radius = 6;
    var diagram = makeGridDiagram(d3.select("#diagram-pathfinding"), Grid.hexagonalShape(radius));

    diagram.makeTilesSelectable(redraw);
    diagram.selected = d3.set([
        new Cube(2, -1, -1),
        new Cube(2, -2, 0),
        new Cube(1, -2, 1),
        new Cube(0, -2, 2),
        new Cube(-1, -1, 2),
        new Cube(0, 2, -2),
        new Cube(1, 2, -1),
        new Cube(1, -3, 0),
        new Cube(-2, 0, 2),
        new Cube(-3, 0, 3)
    ]);

    var start = new Cube(-2, 4, -2);
    var goal = new Cube(1, -4, 3);
    diagram.tiles
        .on('mouseover', function(d) { goal = d.cube; redraw(); })
        .on('touchstart', function(d) { goal = d.cube; redraw(); })
        .on('touchmove', function(d) { goal = d.cube; redraw(); });
    
    function redraw() {
        var bfs = breadthFirstSearch(start, 1000, radius, diagram.selected.has.bind(diagram.selected));
        var path = [];
        for (var p = goal; p != null; p = bfs.came_from.get(p)) {
            path.push(p);
        }

        diagram.setPath(path);
        path = d3.set(path);
        diagram.tiles
               .classed('blocked', function(d) { return diagram.selected.has(d.cube); })
               .classed('start', function(d) { return d.cube.equals(start); })
               .classed('goal', function(d) { return d.cube.equals(goal); })
               .classed('path', function(d) { return path.has(d.cube); });
    }

    diagram.onUpdate(redraw);
    diagram.addPath();
    return diagram;
}



// Line drawing demo has one endpoint fixed and other following the mouse
function makeLineDrawer() {
    var diagram = makeGridDiagram(d3.select("#diagram-line"), Grid.hexagonalShape(7));

    diagram.tiles
        .on('mouseover', function(d) { goal = d.cube; redraw(); })
        .on('touchstart', function(d) { goal = d.cube; redraw(); })
        .on('touchmove', function(d) { goal = d.cube; redraw(); });

    var svg = diagram.root;
    var root = svg.append('g');
    var root_path = root.append('g');
    var root_lines = root.append('g');
    var root_exacts = root.append('g');

    var start = new Cube(-5, 5, 0);
    var goal = new Cube(0, 0, 0);

    function redraw() {
        var N = Math.max(1, Cube.distance(start, goal));
        var interpolation_points = d3.range(N+1)
                .map(function(i) { return FractionalCube.cubeLerp(start, goal, i/N); });
        var dots = interpolation_points
                .map(diagram.grid.hexToCenter.bind(diagram.grid));

        // HACK: add a tiny offset to the start point to break ties,
        // because there are a lot of ties on a grid, and I want it to
        // always round the same direction for consistency.
        // Unfortunately the standard line drawing code I provide
        // doesn't work with the offset, so I round the interpolation
        // points myself here instead of using
        // FractionalCube.cubeLinedraw.
        var offset = Cube.scale(Cube.direction(1), 0.00001);
        var line = interpolation_points
                .map(function(frachex) { return FractionalCube.cubeRound(Cube.add(frachex, offset)); });
        var selection = d3.set(line);
        diagram.tiles.classed('selected', function(d) { return selection.has(d.cube); });

        root_path.select("path").remove();
        var path = root_path.append('path')
            .attr('fill', "none")
            .attr('stroke', "hsla(0, 0%, 0%, 0.15)")
            .attr('stroke-width', '4.5px')
            .attr('d', ['M', dots[0], 'L', dots[dots.length-1]].join(" "));

        var exacts = root_exacts.selectAll("circle.exact").data(dots);
        exacts.exit().remove();
        exacts.enter().append('circle')
            .attr('class', "exact")
            .attr('fill', "blue")
            .attr('stroke', "hsla(0, 0%, 100%, 0.5)")
            .attr('stroke-width', "2px")
            .attr('r', 2.5);
        exacts
            .attr('transform', function(d) { return "translate(" + d + ")"; });
    }

    diagram.onUpdate(redraw);
    return diagram;
}


// Simple but slow field of view calculation (may not be best accuracy)
function makeFieldOfView() {
    var N = 8;
    var diagram = makeGridDiagram(d3.select("#diagram-field-of-view"), Grid.hexagonalShape(N));

    diagram.makeTilesSelectable(redraw);
    diagram.selected = d3.set([
        new Cube(3,0,-3), new Cube(2,1,-3), new Cube(1,2,-3), new Cube(-2,2,0), new Cube(-3,3,0), new Cube(-3,1,2), new Cube(-4,2,2), new Cube(-3,0,3), new Cube(-3,-1,4), new Cube(0,-2,2), new Cube(0,-3,3), new Cube(0,-4,4), new Cube(0,-5,5), new Cube(0,3,-3), new Cube(0,4,-4), new Cube(0,5,-5), new Cube(0,6,-6), new Cube(4,-6,2), new Cube(3,-6,3), new Cube(-5,3,2), new Cube(-4,4,0), new Cube(-5,5,0), new Cube(-6,6,0), new Cube(-7,7,0), new Cube(-8,8,0)
    ]);
    var originally_selected = diagram.selected.values().toString();
    
    var centers = diagram.root.append('g');
    var mouseover = new Cube(3, 2, -5);
    diagram.tiles
        .on('mouseover', function(d) { mouseover = d.cube; redraw(); })
        .on('touchstart', function(d) { mouseover = d.cube; redraw(); })
        .on('touchmove', function(d) { mouseover = d.cube; redraw(); });
    
    function redraw() {
        var visible = d3.set();
        var center = new Cube(0, 0, 0);
        diagram.nodes.forEach(function(endpoint) {
            var corner = endpoint.cube;
            var length = Cube.$length(corner);
            var points = d3.range(length > 0? 1+length : 0).map(function(i) { return FractionalCube.cubeLerp(center, corner, i/length); });
            var blocked_at = d3.set();
            var blocked_first_at = Infinity;
            for (var k = 0; k < points.length; k++) {
                // I want to make sure that not only is this hex
                // visible, it's visible with some perturbations of
                // the line. This is a cheesy heuristic; there are
                // probably better ways to handle this.
                for (var direction = 0; direction < 6; direction++) {
                    // NOTE: I'm using Cube.add and Cube.scale here on
                    // FractionalCubes. It works in JS but not in general.
                    var offset = Cube.scale(Cube.direction(direction), 1e-2);
                    if (diagram.selected.has(FractionalCube.cubeRound(Cube.add(points[k], offset)))) {
                        blocked_at.add(k);
                        if (blocked_first_at == Infinity) { blocked_first_at = k; }
                        break;
                    }
                }
            }
            if (blocked_at.empty()) {
                visible.add(corner);
            }

            // Draw a line to the mouseover point
            if (corner.equals(mouseover)) {
                var circles = centers.selectAll("circle").data(points);
                circles.enter().append('circle')
                    .attr('r', 3)
                    .attr('stroke', "black")
                    .attr('stroke-width', 0.5);
                circles.exit().remove();
                circles
                    .attr('fill', function(p, i) { return (blocked_at.has(i))? "hsl(0,100%,50%)" : i < blocked_first_at? "hsl(60,100%,70%)" : "hsl(60, 10%, 70%)"; })
                    .attr('transform', function(p) { return "translate(" + diagram.grid.hexToCenter(p) + ")"; });
            }
        });

        diagram.tiles
            .classed('shadow', function(d) { return !visible.has(d.cube); })
            .classed('blocked', function(d) { return diagram.selected.has(d.cube); })
            .classed('start', function(d) { return Cube.$length(d.cube) == 0; })
            .classed('goal', function(d) { return d.cube.equals(mouseover); });

        // If mouseover hits a certain point, and the map hasn't changed, highlight the corresponding text.
        d3.select("#field-of-view-illogical-results").style('background-color', diagram.selected.values().toString() == originally_selected && mouseover.equals(new Cube(-7,5,2)) ? "hsl(60,20%,90%)" : "");
    }

    diagram.onUpdate(redraw);
    return diagram;
}


function makeHexToPixel() {
    var diagram = makeGridDiagram(d3.select("#diagram-hex-to-pixel"), Grid.trapezoidalShape(0, 1, 0, 1, Grid.oddRToCube));
    diagram.update(100, true);

    var A = Grid.oddRToCube(new Hex(0, 0));
    var Q = Grid.oddRToCube(new Hex(1, 0));
    var R = Grid.oddRToCube(new Hex(0, 1));
    var B = Grid.oddRToCube(new Hex(1, 1));
    diagram.addLabels(function(d) {
        if (d.key == A.toString()) return "A";
        if (d.key == Q.toString()) return "Q";
        if (d.key == R.toString()) return "R";
        if (d.key == B.toString()) return "B";
    });

    function addArrow(p1, p2) {
        p1 = diagram.grid.hexToCenter(p1);
        p2 = diagram.grid.hexToCenter(p2);
        makeArrow(diagram.root.append('path'), 3, 20, p1, p2.scale(0.8).add(p1.scale(0.2)));
    }
    addArrow(A, Q);
    addArrow(A, R);
    addArrow(A, B);

    return diagram;
}
makeHexToPixel();


function makePixelToHex() {
    var diagram = makeGridDiagram(d3.select("#diagram-pixel-to-hex"), Grid.hexagonalShape(6));
    diagram.addCubeCoordinates(false);
    diagram.update(70, true);

    var marker = diagram.root.append('circle');
    marker.attr('fill', "blue").attr('r', 5);

    diagram.root.on('mousemove', function() {
        var xy = d3.mouse(diagram.root.node());
        var cube = diagram.grid.cartesianToHex(new ScreenCoordinate(xy[0], xy[1]));
        marker.attr('transform', "translate(" + diagram.grid.hexToCenter(cube) + ")");
        diagram.tiles.classed('highlight', function(d) { return d.cube.equals(FractionalCube.cubeRound(cube)); });
    });
    return diagram;
}
makePixelToHex();


// Hex to pixel code is updated to match selected grid type
function updateHexToPixelAxial(orientation) {
    var code = d3.selectAll("#hex-to-pixel-code-axial span");
    code.style('display', function(_, i) { return (i == orientation)? "none":"inline"; });
}
updateHexToPixelAxial(true);
d3.select("#hex-to-pixel-axial-pointy").on('change', function() { updateHexToPixelAxial(true); }).node().checked = true;
d3.select("#hex-to-pixel-axial-flat").on('change', function() { updateHexToPixelAxial(false); });

function updateHexToPixelOffset(style) {
    var code = d3.selectAll("#hex-to-pixel-code-offset span").data(updateHexToPixelOffset.styles);
    code.style('display', function(d) { return (d == style)? "inline" : "none"; });
}
updateHexToPixelOffset.styles = ["oddR", "evenR", "oddQ", "evenQ"];
updateHexToPixelOffset.styles.forEach(function(style) {
    d3.select("#hex-to-pixel-offset-" + style).on('change', function() { updateHexToPixelOffset(style) });
});
updateHexToPixelOffset("oddR");
d3.select("#hex-to-pixel-offset-oddR").node().checked = true;


function makeMapStorage(config, scale) {
    var shape = config[0];
    var access_text = config[1];

    var svg = d3.select("#diagram-map-storage-shape");
    svg.selectAll("*").remove(); // just rebuild the whole thing on each shape change…

    // Write the code used for accessing the grid
    d3.select("#map-storage-formula").text(access_text);

    // Build the hex grid
    var diagram = makeGridDiagram(svg, shape);
    diagram.addHexCoordinates(Grid.cubeToTwoAxis, false);
    diagram.update(scale, true);

    // Build a square grid that can cover the range of axial grid coordinates
    var hexSet = d3.set();
    var first_column = [];
    var minQ = 0, maxQ = 0, minR = 0, maxR = 0;
    diagram.nodes.forEach(function(node) {
        var q = node.cube.x, r = node.cube.z;
        hexSet.add(node.cube);
        if (q < minQ) minQ = q;
        if (q > maxQ) maxQ = q;
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (!(q > first_column[r])) first_column[r] = q;
    });

    var s_size = 260 / (maxR-minR+1);
    var storage = {};
    storage.svg = d3.select("#diagram-map-storage-array");
    storage.svg.selectAll("*").remove();
    storage.nodes = [];
    for (var r = minR; r <= maxR; r++) {
        storage.svg.append('text')
            .attr('transform', "translate(10," + (22.5 + 4 + (r-minR+0.5)*s_size) + ")")
            .text(first_column[r]);
        for (var q = minQ; q <= maxQ; q++) {
            storage.nodes.push({cube: new Cube(q, -q-r, r), q: q, r: r});
        }
    }

    var squares = storage.svg.selectAll("g").data(storage.nodes);
    squares.enter().append('g')
        .each(function(d) {
            var g = d3.select(this);
            d.square = g;
            g.attr('transform', "translate(" + ((d.q-minQ)*s_size) + "," + ((d.r-minR)*s_size) + ") translate(25, 22.5)");
            g.append('rect').attr('width', s_size).attr('height', s_size);
            g.append('text').text(d.q + ", " + d.r).attr('y', "0.4em").attr('transform', "translate(" + (s_size/2) + "," + (s_size/2) + ")");
            g.classed('unused', !hexSet.has(d.cube));
        });

    // Each grid should highlight things in the other grid
    function highlight(cube) {
        diagram.tiles.classed('highlight', function(node) { return node.cube.equals(cube); });
        squares.classed('highlight', function(node) { return node.cube.equals(cube); });
        diagram.tiles.classed('samerow', function(node) { return node.cube.z == cube.z; });
        squares.classed('samerow', function(node) { return node.cube.z == cube.z; });
    }

    diagram.tiles.on('mouseover', function(d) { highlight(d.cube); });
    squares.on('mouseover', function(d) { highlight(d.cube); });
    highlight(new Cube(2, -5, 3));
}
// Map storage shape is controlled separately, and orientation can't be set
var _mapStorage = [[Grid.trapezoidalShape(0, 5, 0, 5, Grid.oddRToCube), "array[r][q + r/2]"],
                   [Grid.triangularShape(5), "array[r][q]"],
                   [Grid.hexagonalShape(3), "array[r + N][q + N + min(0, r)]"],
                   [Grid.trapezoidalShape(0, 5, 0, 5, Grid.twoAxisToCube), "array[r][q]"]];
makeMapStorage(_mapStorage[0], 60);
d3.select("#map-storage-rectangle").node().checked = true;
d3.select("#map-storage-rectangle").on('change', function() { makeMapStorage(_mapStorage[0], 60); });
d3.select("#map-storage-triangle").on('change', function() { makeMapStorage(_mapStorage[1], 60); });
d3.select("#map-storage-hexagon").on('change', function() { makeMapStorage(_mapStorage[2], 50); });
d3.select("#map-storage-rhombus").on('change', function() { makeMapStorage(_mapStorage[3], 60); });


function makeWraparound() {
    var N = 2;
    var shape = [];
    var shape_center = [];
    var shape_mirror = [];
    var baseShape = Grid.hexagonalShape(N);  // Called "L" in the article text
    var centers = [new Cube(0, 0, 0)];  // Called "M" in the article text
    var center = new Cube(N*2+1, -N, -N-1);
    for (var dir = 0; dir < 6; dir++) {
        centers.push(center);
        center = center.rotateRight();
    }
    centers.forEach(function (c) {
        baseShape.forEach(function(b) {
            shape.push(Cube.add(b, c));
            shape_center.push(c);
            shape_mirror.push(b);
        });
    });

    var diagram = makeGridDiagram(d3.select("#diagram-wraparound"), shape);
    diagram.update(40, true);
    diagram.tiles
        .classed('center', function(d, i) { return Cube.$length(shape_mirror[i]) == 0; })
        .classed('wrapped', function(d) { return Cube.$length(d.cube) > 2; })
        .classed('parity', function(d, i) { var c = shape_center[i], a = Cube.$length(c); return c.x == a || c.y == a || c.z == a; });

    function setSelection(cube) {
        diagram.tiles.classed('highlight', function(d, i) { return shape_mirror[i].equals(cube); });
    }
    diagram.tiles
        .on('mouseover', function(d, i) { setSelection(shape_mirror[i]); });

    return diagram;
}
makeWraparound();


// Create all the diagrams that can be reoriented

var diagram_parts = makeParts();
var diagram_angles = makeAngles();
var diagram_spacing = makeSpacing();
var diagram_axes = makeGridComparison();

var grid_cube = makeGridDiagram(d3.select("#grid-cube"), Grid.hexagonalShape(3))
    .addCubeCoordinates(true);

var grid_axial = makeGridDiagram(d3.select("#grid-axial"), Grid.hexagonalShape(3))
    .addHexCoordinates(Grid.cubeToTwoAxis, true);

var neighbors_cube = makeNeighbors("#neighbors-cube", "#neighbors-cube-code");
var neighbors_axial = makeNeighbors("#neighbors-axial", "#neighbors-axial-code", Grid.cubeToTwoAxis, "");

var neighbors_diagonal = makeGridDiagram(d3.select("#neighbors-diagonal"),
                                         Grid.hexagonalShape(1).concat(
                                             [new Cube(2, -1, -1), new Cube(-2, 1, 1),
                                              new Cube(-1, 2, -1), new Cube(1, -2, 1),
                                              new Cube(-1, -1, 2), new Cube(1, 1, -2)]))
    .addCubeCoordinates(false);
neighbors_diagonal.tiles.classed('highlight', function(d) { return Cube.$length(d.cube) == 2; });

var diagram_distances = makeDistances();
var diagram_lines = makeLineDrawer();
var diagram_fov = makeFieldOfView();
var diagram_rotation = makeRotation();
var diagram_rings = makeSpiral("diagram-rings", false);
var diagram_spiral = makeSpiral("diagram-spiral", true);
var diagram_movement_range = makeMovementRange();
var diagram_pathfinding = makePathfinding();
var diagram_hex_region = makeHexRegion();
var diagram_intersection = makeIntersection();

function orient(orientation) {
    diagram_parts(orientation);
    diagram_angles(orientation);
    diagram_spacing(orientation);
    diagram_axes(orientation);
    
    grid_cube.update(65, orientation);
    grid_axial.update(65, orientation);

    neighbors_cube.update(100, orientation);
    neighbors_axial.update(100, orientation);
    neighbors_diagonal.update(75, orientation);

    diagram_distances.update(60, orientation);
    diagram_lines.update(45, orientation);
    diagram_fov.update(35, orientation);
    diagram_rotation.update(60, orientation);
    diagram_rings.update(50, orientation);
    diagram_spiral.update(50, orientation);
    diagram_movement_range.update(50, orientation);
    diagram_pathfinding.update(42, orientation);
    diagram_hex_region.update(50, orientation);
    diagram_intersection.update(35, orientation);

    // HACK: invading cubegrid.js space; should support this directly in cubegrid.js diagram object
    delay(d3.select("#cube-to-hex"), function(animate) {
        animate(d3.select("#cube-to-hex > g"))
            .attr('transform', "translate(184.5, 184.5) rotate(" + ((!orientation) * 30) + ")");
    });

    adjustTextForOrientation(orientation);
    d3.selectAll("button.flat").classed('highlight', !orientation);
    d3.selectAll("button.pointy").classed('highlight', orientation);
}

orient(true);

// Offset neighbors are controlled separately
var neighbors_offset = makeNeighbors("#neighbors-offset", "#neighbors-offset-code", Grid.cubeToOddR, "row").update(65, true);
d3.select("#neighbors-offset-odd-r").node().checked = true;
d3.select("#neighbors-offset-odd-r").on('change', function() { neighbors_offset.converter = Grid.cubeToOddR; neighbors_offset.parity_var = "row"; neighbors_offset.update(65, true); });
d3.select("#neighbors-offset-even-r").on('change', function() { neighbors_offset.converter = Grid.cubeToEvenR; neighbors_offset.parity_var = "row"; neighbors_offset.update(65, true); });
d3.select("#neighbors-offset-odd-q").on('change', function() { neighbors_offset.converter = Grid.cubeToOddQ; neighbors_offset.parity_var = "col"; neighbors_offset.update(65, false); });
d3.select("#neighbors-offset-even-q").on('change', function() { neighbors_offset.converter = Grid.cubeToEvenQ; neighbors_offset.parity_var = "col"; neighbors_offset.update(65, false); });

delay.pageLoaded = true;




function test_coordinate_transforms() {
    function T(g, h1) {
        var p = g.hexToCenter(h1);
        var h2 = FractionalCube.cubeRound(g.cartesianToHex(p));
        if (h1.toString() != h2.toString()) {
            console.log("TEST FAILED: coordinate system transformation:", h1.toString(), h2.toString());
        }
    }
    T(new Grid(10, true, []), new Cube(1, 3, -4));
    T(new Grid(5, true, []), new Cube(-4, -3, 7));
    T(new Grid(10, false, []), new Cube(3, 5, -8));
}
test_coordinate_transforms();

