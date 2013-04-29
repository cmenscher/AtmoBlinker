/*
 Copyright 2013 Corey Menscher

 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
 rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 permit persons to whom the Software is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all copies or substantial portions
 of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
 TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
 CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 DEALINGS IN THE SOFTWARE.

 FYI: Netatmo is a registered trademark of Netatmo (SAS)

 */

var ENABLE_LOGGING = true;
var utils = require("./utils");

var Blink1 = require('node-blink1');
var blink1;

var Netatmo = require('node-netatmo');
var netatmo;

var app = {
    initialRun: true,
    loopInterval: 10000, // 10 sec

    setRGB: function() {
        var val = netatmo.lastValue;
        if(val < 45) {
            blink1.fadeToRGB(500, 0, 0, 255);
        } else if( val > 45 && val < 50) {
            blink1.fadeToRGB(500, 0, 255, 0);
        } else {
            blink1.fadeToRGB(500, 255, 0, 0);
        }
    },

    handleMeasurement: function(callback) {
        var _this = this;

        if(arguments.length === 0) {
            var callback = function() {};
        }

        netatmo.getMeasurement({ type: 'Noise', date_end: 'last' }, function(err, response) {
            var val;

            if (err) { utils.log("\n"); util.error(err); return utils.log("\n"); }

            if (!!response.error) {
              utils.log("ERROR! " + response.error.message + " (" + response.error.code + ")");
              return;
            }
            val = response.body[0].value[0][0];

            if(netatmo.lastValue != val) {
                utils.log("Value has changed! (lastValue: " + netatmo.lastValue + ", value=" + val + ") Updating LED...");
                netatmo.lastValue = val;                    
                _this.setRGB();
            }
            callback();
        });
    },

    loop: function() {
        /* This is the loop that will get the data at the interval specified in the config object */

        var _this = this;

        //rather than wait the standard interval when launching, get the first measurement immediately
        if(this.initialRun) {
            this.handleMeasurement(function() { _this.initialRun = false; });
        }

        setInterval(this.handleMeasurement, _this.loopInterval);
    },

    start: function() {
        var app = this;
        
        // Initialize the first blink(1) found and cycle through some colors to be funky
        blink1 = new Blink1.Blink1();

        // Initialize the netatmo
        netatmo = new Netatmo.Netatmo();
//      netatmo.setConfig('$CLIENT_ID', '$CLIENT_SECRET', '$USERNAME', '$PASSWORD');

        // authorize
        netatmo.getToken(function(err) {
            if (err) return console.log(err);

            blink1.fadeToRGB(200, 255, 0, 0, function() { blink1.fadeToRGB(200, 0, 255, 0, function() { blink1.fadeToRGB(200, 9, 0, 255, function() { blink1.fadeToRGB(100, 0, 0, 0);});})})

            netatmo.getDevices(function(err, device_data) {
                if (err) return console.log(err);

                //assume we'll use the first device
                netatmo.device_id = device_data.body.devices[0]._id;
                utils.log("READY.........FIGHT!");
                app.loop();
            });
        });
    }
}

app.start();
