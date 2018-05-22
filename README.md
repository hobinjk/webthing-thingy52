webthing-thingy52
=================

Updated version of
https://gist.github.com/DurandA/4396348a733bc784bd93266d4a2ac117 for exposing
the Thingy:52 as a Web Thing.

I broke luminosity/color during the changes for the newest webthing-node API so
it needs a few updates.

Running
-------
```
npm install
node server.js
```
Half the time it refuses to connect and can be encouraged by restarting the
thingy:52 while simultaneously restarting the script.
