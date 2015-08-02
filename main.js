// Note: this is all garbage. I'll clean it up later.
// tiles[x][y];
var tiles = {};
var startX = window.innerWidth/2;
var startY = window.innerHeight/2;
var element, paper, radius, map;

function getAxes() {
	return Coordinate.prototype.axes;
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
	var morphedCoordinates = [], tile;

	// Ensure we have a complete coordinate.
	tile = new Tile(coordinate);

	_(permutations).each(function(permutation) {
		var morphedCoordinate = {};

		// Mutate our coordinate to match this permutation.
		_(permutation).each(function(distance, axis) {
			morphedCoordinate[axis] = tile[axis] + distance;
		});

		morphedCoordinates.push(morphedCoordinate);
		
	});

	return morphedCoordinates;
}

function getDistanceBetweenTiles(coordinates) {
	var axes = getAxes(), tile;
	if (coordinates.length != 2) {
		throw new Error('Exactly two coordinates required.');
	}

	// Ensure we have complete coordinates.
	_(coordinates).each(function(coordinate) {
		coordinate = new Tile(coordinate).coordinate;
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
		coordinate = new Tile(coordinate).coordinate;
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
		coordinate = new Tile(coordinate).coordinate;
	});

	return coordinatesInLine;
}

function drawTile(tile) {
	var points = [],
	    sides = 6,
	    radius = 50,
	    plotX, plotY;

	plotX = startX + (radius * Math.sqrt(3) * (tile.coordinate.x + tile.coordinate.w/2));
	plotY = startY + (radius * 3/2 * tile.coordinate.w);

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
		.text('w: ' + tile.coordinate.w + ', x: ' + tile.coordinate.x + ', y: ' + tile.coordinate.y);

	tiles[tile.coordinate.x] = tiles[tile.coordinate.x] || {};
	tiles[tile.coordinate.x][tile.coordinate.y] = hexElement[0][0];
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
    map = new Map(radius);
    _.each(map.tiles, drawTile);
});

