var hex = hex || {};

hex.Map = Class.extend({
  init: function() {
    this.paper = d3.select('body')
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%');
    this.prototype = Object.getPrototypeOf(this);
    this.element = this.paper.append('g').attr('id', 'hex-map')
    this.transform = {};

    this.tileSize = hex.tileSize;
    this.bounds = hex.mapSize;

    this.drag = d3.behavior.drag();
    this.drag.on('dragstart', this.setTransform.bind(this));
    this.drag.on('dragend', this.setTransform.bind(this));
    this.drag.on('drag', function() {
      var translateString = 'translate(' + (this.transform.x + d3.event.dx);
      translateString += ', ' + (this.transform.y + d3.event.dy) + ')';
      this.element.attr('transform', translateString);
      this.setTransform();
    }.bind(this));
    this.element.call(this.drag);

    this._mapTiles = [];
    this._tessellations = {};
    this.radius = hex.mapSize;
    new this.prototype.MapTile(this, 0, 0)
    var r = this.radius;
    while (r--) {
      hex.iteration++;
      for (var i in this._mapTiles) this._mapTiles[i].drawNeighbours();
    }
  },
	setTransform: function() {
		var t = this.element.attr('transform'), i;
		if (t) {
			t = t.replace('translate(', '')
			t = t.replace(')', '')
			t = t.split(',');
			for (i = 0; i < t.length; i++) t[i] = parseInt(t[i]);
		} else t = [0, 0];
		this.transform = {x: t[0], y: t[1]};
	},
	/**
	 * In progress, try this:
	 * map.tessellateTo({x:  1, y: 0});
	 * map.tessellateTo({x:  1, y:-1});
	 * map.tessellateTo({x: -1, y: 0});
	 * map.tessellateTo({x: -1, y: 1});
	 * map.tessellateTo({x:  0, y: 1});
	 * map.tessellateTo({x:  0, y:-1});
	 */
  tessellateTo: function(pos) {
    var i, width, tessellation = this.paper
      .append('use')
      .attr('xlink:href', '#hex-map');
    //for (var i in pos) pos[i] = Math.floor(Math.abs(pos[i]/this.bounds));
    width = hex.utility.trigASA(30, this.tileSize/2, 90);
    var plot = hex.utility.getNeighbourHexPlot(
      {x: 0, y: 0},
      pos,
      this.tileSize * this.bounds * 2,
      true
    );
    if (pos.x == 1 && pos.y == 0) {
      tessellation
				.attr('x', plot.x - width[1])
				.attr('y', plot.y + width[0] * 1.5);
    } else if (pos.x == 1 && pos.y == -1) {
      tessellation
				.attr('x', plot.x - width[1] * 2)
				.attr('y', plot.y);
    } else if (pos.x == 0 && pos.y == -1) {
      tessellation
				.attr('x', plot.x - width[1])
				.attr('y', plot.y - width[0] * 1.5);
    } else if (pos.x == -1 && pos.y == 0) {
      tessellation
				.attr('x', plot.x + width[1])
				.attr('y', plot.y - width[0] * 1.5);
    } else if (pos.x == -1 && pos.y == 1) {
      tessellation
				.attr('x', plot.x + width[1] * 2)
				.attr('y', plot.y);
    } else if (pos.x == 0 && pos.y == 1) {
      tessellation
				.attr('x', plot.x + width[1])
				.attr('y', plot.y + width[0] * 1.5);
    }
  }
});

