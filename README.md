This application will get recent measurements from your NetAtmo and light up a ThingM blink(1) (http://thingm.com/products/blink-1.html) as an ambient display.

You'll also need an API key from NetAtmo, so go to http://dev.netatmo.com to get started.  Once you have a key you'll need to update the config variables in the config object.  After that simply enter this into the commandline:

```javascript
node blinky.js
```

However, you might want to just run in the background, so the repo also includes a daemonizer, but you must install forever (https://npmjs.org/package/forever) to use it:

```javascript
npm install forever
```

To start the daemon, use:

```javascript
forever start atmo_daemon.js
```
