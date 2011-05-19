function findPos(obj) {
	var curleft = 0, curtop = 0;
	if(obj.offsetParent) {
	  do {
			curleft += obj.offsetLeft;
			curtop += obj.offsetTop;
		} while(obj = obj.offsetParent);
	}
	return [curleft, curtop];
}
	
function Brush(ctx, diameter, color) {
  this.ctx = ctx;
  this.diameter = diameter;
  this.radius = diameter / 2;
  this.prevX = this.prevY = 0;
  this.drawing = false;
  this.color = color;
  this.ctx.globalAlpha = this.color.a;
  this.brushCanvas = this._createBrush();
  
  var canvasPos = findPos(this.ctx.canvas);
  this.canvasOffsetX = canvasPos[0];
  this.canvasOffsetY = canvasPos[1];
}

Brush.prototype = {
  _createBrush: function() {
    var d = this.diameter, r = this.radius;
    
    var patternCanvas = new Canvas(d, d);
    var ctx = patternCanvas.getContext("2d");

    var radialGradient = ctx.createRadialGradient(r, r, r / 1.2, r, r, r);
    radialGradient.addColorStop(0, 'rgba(0, 0, 0, ' + this.color.a + ')');
    radialGradient.addColorStop(0.95, 'rgba(0, 0, 0, 0)');
    radialGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = radialGradient;
    ctx.fillRect(0, 0, d, d);
    
    ctx.globalCompositeOperation = 'source-in';
    
    ctx.fillStyle = "rgba(" + this.color.r + "," + this.color.g + "," + this.color.b + ", 1.0)";
    ctx.fillRect(0, 0, d, d);

    document.body.appendChild(patternCanvas);
    return patternCanvas;
  },
  
  _drawStroke: function(dx, dy) {
    this.ctx.drawImage(this.brushCanvas, 0, 0, this.diameter, this.diameter, 
                                         this.prevX - this.radius - dx, this.prevY - this.radius - dy, 
                                         this.diameter, this.diameter);
  },
  
  down: function(e) {
    this.prevX = e.offsetX || e.clientX - this.canvasOffsetX;
    this.prevY = e.offsetY || e.clientY - this.canvasOffsetY;
    this.drawing = true;
    this._drawStroke(0, 0);
  },
  
  up: function(e) {
    this.drawing = false;
  },
  
  move: function(e) {
    if(!this.drawing)
      return true;
    var x = e.offsetX || e.clientX - this.canvasOffsetX,
        y = e.offsetY || e.clientY - this.canvasOffsetY,
        dx = this.prevX - x,
        dy = this.prevY - y;
    
  	var startX, startY, i;
  	if(Math.abs(dx) > Math.abs(dy)) {
  		startX = 1;
  		startY = dy / dx;
  		i = dx;
  	} else {
  	  startX = dx / dy;
  		startY = 1;
  		i = dy;
  	}
  	
  	var increment = (i > 0) ? -1 : 1;
  	for(; i != 0; i += increment) {
  	  this._drawStroke(startX * i, startY * i);
  	}
  	
  	this.prevX = x;
  	this.prevY = y;
  }
}

var Canvas = function(width, height, styles) {
  this.canvas = document.createElement('canvas');
  this.canvas.width = width;
  this.canvas.height = height;
  if(styles) {
    for(var style in styles) {
      this.canvas.style[style] = styles[style];
    }
  }
  this.ctx = this.canvas.getContext("2d");
  document.body.appendChild(this.canvas);
  return this.canvas;
};

var Drawing = (function() {

  var width = 600, height = 500;

  var updateBackground = function(ctx, backCanvas) {
    var alpha = ctx.globalAlpha;
    ctx.globalAlpha = 1.0;
    ctx.drawImage(backCanvas, 0, 0);
    ctx.globalAlpha = alpha;
  };

  var initBackground = function() {
    var canvas = new Canvas(width, height, { display: 'none' });
    var ctx = canvas.getContext("2d");

    ctx.strokeStyle = "rgba(0, 0, 0, 1.0)";
    ctx.lineWidth = 10;

    ctx.beginPath();

    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);

    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);

    ctx.stroke();

    return canvas;
  };

  return {
    init: function() {
      var canvas = new Canvas(width, height);
      var ctx = canvas.getContext("2d");
      var brush = new Brush(ctx, 30, {r: 0, g: 120, b: 60, a: 0.5});

      var backCanvas = initBackground();
      updateBackground(ctx, backCanvas);

      document.addEventListener("mousedown", function(e) {
        brush.down(e);
      }, false);

      document.addEventListener("mouseup", function(e) {
        brush.up(e);
        updateBackground(ctx, backCanvas);
      }, false);

      document.addEventListener("mousemove", function(e) {
        brush.move(e);
        updateBackground(ctx, backCanvas);
      }, false);
    }
  };
})();
