var inc = 0.1;
var scl = 10; //scale is already occupied
var cols, rows;
var zoff = 0;
var particles = [];
var flowfield;

function setup() {
	createCanvas(windowWidth, windowHeight);
    cols = floor(width/scl); //no decimals
    rows = floor(height/scl);

    flowfield = new Array(cols * rows);

    for (var i = 0; i < 300; i++) {
        particles[i] = new Particle();
    }
    background(51);
}

function draw() {
    var yoff = 0;
    for (var y = 0; y < rows; y++) {
        var xoff = 0;
        for (var x = 0; x < cols; x++) {
            var index = (x + y * cols);
            var angle = noise(xoff, yoff, zoff) * TWO_PI * 4;
            var v = p5.Vector.fromAngle(angle);
            v.setMag(1); //set magnitude (how exatly does it follow the flowfield)
            flowfield[index] = v;
            xoff += inc;
            stroke(0, 50);
            // push();
            // translate(x*scl, y*scl);
            // rotate(v.heading());
            // line(0, 0, scl, 0);

            // pop();
        }
        yoff += inc;
        zoff += 0.3
    }

    for (var i = 0; i < particles.length; i++) {
        particles[i].follow(flowfield);
        particles[i].update();
        particles[i].edges();
        particles[i].show();
    }
}
