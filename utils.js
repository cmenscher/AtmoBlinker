var line = 1;

var log = function(msg) {
    var now = new Date();
    console.log("(" + line + ") " + now.toDateString() + " " + now.getUTCHours() + ":" + now.getUTCMinutes() + ":" + now.getUTCSeconds() + " --> " + msg);
    line++;
};

exports.log = log;