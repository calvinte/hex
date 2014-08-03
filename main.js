// Note: this is all garbage. I'll clean it up later.
// tiles[x][y];
var tiles = {};

function getAxes() {
	return ['w', 'x', 'y'];
}

/**
 * Function returns tile at provided coordinate.
 * @param coordinate as Object.
 * @return Tile.
 */
function getTile(coordinate) {
	var acceptableAxes = getAxes();
	var missingAxis;
	var _coordinate = _(coordinate);
	var coordinateLength = _coordinate.size();

	_(coordinate).each(function(v, k) {
		var direction = v > 0;
		var wholeAbs = Math.floor(Math.abs(v));
		coordinate[k] = (direction ? 1 : -1) * wholeAbs;
	});

	// Ensure at least two axes were provided.
	if (coordinateLength < 2) {
		throw new Error('Specify at least two of ' + JSON.stringify(['w', 'x', 'y']) + '.');
	}

	// Only allow acceptable axes.
	if (!_coordinate.every(function(v, k) { return acceptableAxes.indexOf(k) >= 0 })) {
		throw new Error('Unexpected axis in coordinate. Only acceptable values are ' + JSON.stringify(['w', 'x', 'y']) + '.');
	}

	// If only two axes were passed, discover the value of the third.
	if (coordinateLength < 3) {
		missingAxis = _(acceptableAxes).filter(function(v) { return typeof coordinate[v] == 'undefined' })[0];
		coordinate[missingAxis] = -1 * _coordinate.reduce(function(memo, num) { return memo + num });
	}

	// Bounds.
	if (!_(coordinate).every(function(v, k) { return Math.abs(v) < radius; })) {
		throw new Error('Out of bounds.');
	}

	// Ensure all values add up to 0.
	if (_coordinate.reduce(function(memo, num) { return memo + num }) != 0) {
		throw new Error('Invalid coordinate specified. All axes should add up to 0.');
	}

	// @TODO return a tile.
	return coordinate;
}

function getNeighbouringTiles(coordinate) {
	// Each tile has six neighbours, these are the possible offsets.
	var neighbourPermutations = [
		{w: +1, x: -1, y:  0}, {w: +1,  x:  0, y: -1}, {w:  0, x: +1, y: -1},
		{w: -1, x: +1, y:  0}, {w: -1,  x:  0, y: +1}, {w:  0, x: -1, y: +1},
	];

	return axisMorph(coordinate, neighbourPermutations);
}

function getDiagonalTiles(coordinate) {
	// Each tile has six diagonals, these are the possible offsets.
	var diagonalPermutations = [
		{w: +2, x: -1, y: -1}, {w: +1, x: +1, y: -2}, {w: -1, x: +2, y: -1},
		{w: -2, x: +1, y: +1}, {w: -1, x: -1, y: +2}, {w: +1, x: -2, y: +1},
	];

	return axisMorph(coordinate, diagonalPermutations);
}

function axisMorph(coordinate, permutations) {
	var morphedCoordinates = [];

	// Ensure we have a complete coordinate.
	coordinate = getTile(coordinate);

	_(permutations).each(function(permutation) {
		var morphedCoordinate = {};

		// Mutate our coordinate to match this permutation.
		_(permutation).each(function(distance, axis) {
			morphedCoordinate[axis] = coordinate[axis] + distance;
		});

		morphedCoordinates.push(morphedCoordinate);
		
	});

	return morphedCoordinates;
}

function getDistanceBetweenTiles(coordinates) {
	var axes = getAxes();
	if (coordinates.length != 2) {
		throw new Error('Exactly two coordinates required.');
	}

	// Ensure we have complete coordinates.
	_(coordinates).each(function(coordinate) {
		coordinate = getTile(coordinate);
	});

	return _.reduce(
		_.map(axes, function(axis) { return Math.abs(coordinates[0][axis] - coordinates[1][axis]) / 2 }),
		function(memo, num) { return memo + num }
	);
}

function drawLine(coordinates) {
	var m, i, yN, y1, xN, x1, dx, dy;
	var coordinatesInLine = [];
	if (coordinates.length != 2) {
		throw new Error('Exactly two coordinates required.');
	}

	// Ensure we have complete coordinates.
	_(coordinates).each(function(coordinate) {
		coordinate = getTile(coordinate);
	});

	// Sort coordinates ascendingly by x value.
	coordinates = _(coordinates).sortBy(function(coordinate) { return coordinate.x });

	y1 = coordinates[0].y;
	yN = coordinates[1].y;
	x1 = coordinates[0].x;
	xN = coordinates[1].x;

	var m = (yN - y1) / (xN - x1);
	for (i = x1; i < xN; i++) {
		dx = 1;
		dy = m * dx;
		x1 = x1 + dx;
		y1 = y1 + dy;
		coordinatesInLine.push({x: x1, y: y1});
	}

	// Create complete coordinates.
	_(coordinatesInLine).each(function(coordinate) {
		coordinate = getTile(coordinate);
	});

	return coordinatesInLine;
}

function drawTile(coordinate){
	// Prepare for barf.
	var points = [],
	    sides = 6,
	    radius = 50,
	    plotX, plotY;

	plotX = startX + (radius * Math.sqrt(3) * (coordinate.x + coordinate.w/2));
	plotY = startY + (radius * 3/2 * coordinate.w);

	for (var i = 0; i < sides; i++) {
		var angle = degToRad(90) + (i * (1 / sides) * 2 * Math.PI);
		points.push([
			plotX + (radius * Math.cos(angle)),
			plotY + (radius * Math.sin(angle))
		]);
	}
	var startingPoint = points[0].join(' ');
	var path = 'M' + startingPoint;
	for (var i = 1; i < sides; i++) path += 'L' + points[i].join(' ');
	path += 'L' + startingPoint;
	
	var hexElement = element.append('path')
		.attr('d', path)
		.attr('fill', '#F0F')
		.attr('stroke', 'black');
	element.append('text')
		.attr('x', plotX)
		.attr('y', plotY)
		.text('w: ' + coordinate.w + ', x: ' + coordinate.x + ', y: ' + coordinate.y);

	tiles[coordinate.x] = tiles[coordinate.x] || {};
	tiles[coordinate.x][coordinate.y] = hexElement[0][0];
};


function degToRad(x) {
	return x / 180 * Math.PI;
}

document.addEventListener('DOMContentLoaded', function() {
	paper = d3.select('body')
		.append('svg')
		.attr('width', '100%')
		.attr('height', '100%');
	element = paper.append('g').attr('id', 'hex-map');
	radius = 4;
	startX = window.innerWidth/2;
	startY = window.innerHeight/2;
	for (var w = -radius; w < radius; w++) {
	for (var x = -radius; x < radius; x++) {
	try{
		drawTile(getTile({w: w, x:x}));
	} catch(e){}
	}
	}

	// You can only draw one line right now, will update.
	document.getElementById('draw_line').addEventListener('click', function() {
		_(tiles).each(function(yTiles, i) {
			_(yTiles).each(function(tile, j) {
				tile.addEventListener('click', function() {
					hexClick(i, j, tile);
				});
			});
		});
		var start, end;
		function hexClick(x, y, tile) {
			if (!start) {
				start = [x, y, tile];
			} else {
				end = [x, y, tile];
				var line = drawLine([
					{x: start[0], y: start[1]},
					{x: end[0], y: end[1]}
				]);

				line.forEach(function(v) {
					console.log(v, tiles);
					tiles[v.x][v.y].style.fill = "#C0C";
				});
			}
		}
	});
});

