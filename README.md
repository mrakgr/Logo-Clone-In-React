# Logo Clone

Magma take home assignment. It is a tiny Logo clone with no function, variables or loops. To install and run it, execute the following.

```
npm install
npm run dev
```

That will run it in a Vite server.

## Commands

- `forward <Px>` - go forward and draw a line along the path if the pen is down
- `backward <Px>` - go backward and draw a line along the path if the pen is down
- `turnleft <D>` - turn left by D degrees
- `turnright <D>` - turn right by D degrees
- `direction <D>` - set turtle in a specific direction by D being degrees and 0 degrees being up
- `center` - move turtle to the center **without** drawing anything
- `go <X>, <Y>` - move turtle to position X, Y **without** drawing anything
- `gox <X>` - move turtle on the X axis to position X **without** drawing anything
- `goy <Y>`- move turtle on the Y axis to position Y **without** drawing anything
- `penup` - set pen state to up (off)
- `pendown` - set pen state to down (on)
- `penwidth <W>` - set pen width to W (in pixels)
- `pencolor <R>,<G>,<B>` - set pen color to R, G, B