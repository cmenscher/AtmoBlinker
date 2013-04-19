var forever = require('forever');

this.callback = function() {};

var child = new (forever.Forever)('./blinky.js', {
max: 3,
silent: true,
options: []
});

child.on('exit', this.callback);
child.start();