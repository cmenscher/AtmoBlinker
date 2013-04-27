var ENABLE_LOGGING = true;
var utils = require("./utils");

var Blink1 = require('node-blink1');
var blink1;

var Netatmo = require('./netatmo');
var netatmo;

var app = {
    tokenUpdated: 0,
    initialRun: true,
    loopInterval: 10000, // 10 sec

    tokenCheckInterval: 60000, //check every minute
    refreshTokenTimer: {},

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

        netatmo.getMeasurement(function(val) {
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

    refreshTokenCheck: function() {
        utils.log("Checking to see if the access token needs to be refreshed...");

        var now = new Date();
        var now_millis = now.getTime() / 1000;

        // Note: adding 2 minutes to the expires_in cutoff so we can prevent loop() from being called when the token has expired
        if(netatmo.config.nextTokenRefresh > (this.tokenUpdated + netatmo.config.credentials.expires_in + 120000)) {
            this.tokenUpdated = now; // update tokenUpdated to now so we can check all over again
            this.refreshToken();
        }
    },

    start: function() {
        var app = this;
        var now = new Date();
        
        this.tokenUpdated = now.getTime() / 1000; // Unix epoch

        // Initialize the first blink(1) found and cycle through some colors to be funky
        blink1 = new Blink1.Blink1();

        // Initialize the netatmo
        netatmo = new Netatmo.Netatmo(this.tokenUpdated);

        // authorize
        netatmo.getToken(function() {
            blink1.fadeToRGB(200, 255, 0, 0, function() { blink1.fadeToRGB(200, 0, 255, 0, function() { blink1.fadeToRGB(200, 9, 0, 255, function() { blink1.fadeToRGB(100, 0, 0, 0);});})})

            // check to see if we need to get a new token every minute
            app.refreshTokenTimer = setInterval(app.refreshTokenCheck, app.tokenCheckInterval);

            // now get the devices for this account and set the device_id
            netatmo.getDevices(function(device_data) {
                //assume we'll use the first device
                netatmo.device_id = device_data.body.devices[0]._id;
                utils.log("READY.........FIGHT!");
                app.loop();
            });
        });
    }
}

app.start();
