// canvas stuff
let c = document.getElementById("canvas");
let ctx = c.getContext("2d");

// constants
const NW = 0;
const NE = 1;
const SE = 2;
const SW = 3;

const margin = 0; // margin doesn't actually really work
const tilesize = 20;
const size = 30;
const marker = 4;

ctx.lineWidth = marker/2;
ctx.font = "bold 12px Courier";

// these were used for debug but are now unused
var loops = 0;
var loops_max = 2000;

let scanmap = [];
let vertexmap = [];
let vertextypemap = [];

var points = [];
var waterpoints = [];

var insides = [];
var ramps = [];

reset_everything();

// this is to start up the map, the texmap stuff is not important, it was for
// debug and making patterns for fun
let texmap = [
    [6],
];

let map = [];
for (let y = 0; y < size; y++) {
    let row = [];
    for (let x = 0; x < size; x++) {
        row.push(texmap[y % texmap.length][x % texmap[0].length]);
    }
    map.push(row);
}


// all these variables are for painting and selecting tile types
// 'metapaint' is like what tile type, i called it metapaint because there was
// already a 'paint', so the metapaint is what type of thing you are going to
// paint with (think 'ramp') and paint is what specifc thing you are placing
// (think 'upwards facing ramp')
var previous_tile_ele_left = 0;
var previous_tile_ele_right = 0;

var paint = -1;
var metapaint_left = 0;
var metapaint_right = 0;

// this function is for picking tile options on the side
function select_tile (e) {

    // selection_type is left or right click, 1 = left, 0 = right
    let selection_type = 1;
    if(e.which == 3) selection_type = 0;

    // what did they click
    let ele = e.target;

    if (ele.className == "dontclick") ele = ele.parentElement;

    // for each side the way it works is it sets whatever one was selected
    // before as normal and the one you just clicked as selected, and then
    // there is some other stuff for the 'both' selection
    if (selection_type == 1) {
        if (previous_tile_ele_left != 0) {
            if (previous_tile_ele_left.className == "both") {
                previous_tile_ele_left.className = "rightactive"
            } else previous_tile_ele_left.className = "";
         }
        previous_tile_ele_left = ele;
    }

    if (selection_type == 0) {
        if (previous_tile_ele_right != 0) {
            if (previous_tile_ele_right.className == "both") {
                previous_tile_ele_right.className = "active"
            } else previous_tile_ele_right.className = "";
        }
        previous_tile_ele_right = ele;
    }

    let tile_type = ele.firstChild.innerHTML;
    if (ele.className == ((selection_type != 1) ? "active" : "rightactive")) {
        ele.className = "both";
    }
    else ele.className = (selection_type == 1) ? "active" : "rightactive";

    // sets the 'metapaint', which was discussed at the top
    if (selection_type == 1) {
        switch(tile_type) {
            case "water": metapaint_left = 2; break;
            case "wall": metapaint_left = 1; break;
            case "floor": metapaint_left = 0; break;
            case "ramp": metapaint_left = 3; break;
        }
    } else {
        switch(tile_type) {
            case "water": metapaint_right = 2; break;
            case "wall": metapaint_right = 1; break;
            case "floor": metapaint_right = 0; break;
            case "ramp": metapaint_right = 3; break;
        }
    }
}

// start up stuff to select the default things
select_tile({which: 0, target: document.getElementById("starttileleft")});
select_tile({which: 3, target: document.getElementById("starttileright")});

// add the event listeners to the tile type selection things
var tiles = document.getElementsByTagName("p");
for (let i = 0; i < tiles.length; i++) {
    tiles[i].addEventListener("mousedown", select_tile);
}

// event listener for painting
c.addEventListener("mousedown", function (e) {
    let cursorX = e.pageX - this.offsetLeft;
    let cursorY = e.pageY - this.offsetTop;

    let x = Math.floor(cursorX / (tilesize + margin));
    let y = Math.floor(cursorY / (tilesize + margin));

    let metapaint = metapaint_left;
    if (e.which == 3) metapaint = metapaint_right;

    switch (metapaint) {
        case 0: paint = 0; break;
        case 1: paint = 1; break;
        case 2: paint = 6; break;
        case 3:
            switch (map[y][x]) {
                case 0: case 1: case 6:
                    let n = access([x, y - 1]);
                    let s = access([x, y + 1]);
                    let e = access([x - 1, y]);
                    let w = access([x + 1, y]);
                    
                    paint = 2;
                    if (n == 1) paint = 2;
                    if (s == 1) paint = 4;
                    if (w == 1) paint = 5;
                    if (e == 1) paint = 3;

                    break;

                case 2: paint = 3; break;
                case 3: paint = 4; break;
                case 4: paint = 5; break;
                case 5: paint = 2; break;
            }
            break;
    }

    if (paint != -1)
        map[y][x] = paint;

    // when you click update the image to match your changes
    update();
});

// when they let go of the mouse button stop painting
c.addEventListener("mouseup", function (e) {
    paint = -1;
});

// whenever they move the mouse, paint with whatever they had selected
c.addEventListener("mousemove", function (e) {
    let cursorX = e.pageX - this.offsetLeft;
    let cursorY = e.pageY - this.offsetTop;

    let x = Math.floor(cursorX / (tilesize + margin));
    let y = Math.floor(cursorY / (tilesize + margin));

    if (paint != -1) {
        if (map[y][x] != paint) {
            map[y][x] = paint;
            update();
        }
    }
});

// this was used for debug
window.onload = function () {
    window.addEventListener("keydown", function (e) {
        // console.log(e.keyCode);
        if (e.keyCode == 90 && loops_max > 1) loops_max--;
        if (e.keyCode == 88) loops_max++;
        update();
    }, false);
}
update();

function add (v1, v2) {
    return [v1[0] + v2[0], v1[1] + v2[1]];
}

function sub (v1, v2) {
    return [v1[0] - v2[0], v1[1] - v2[1]];
}

function turn_c (v1) {
    // [0, -1]
    // [1,  0]
    return [-v1[1], v1[0]];
}

function turn_cc (v1) {
    // [ 0, 1]
    // [-1, 0]
    return [v1[1], -v1[0]];
}

function reset_everything () {
    // reset all the temp variables we use when we trace

    loops = 0;

    scanmap = [];
    vertexmap = [];
    vertextypemap = [];
    insides = [];

    // if we're doing water we don't want to replace the points
    if (doing_water) 
        waterpoints = [];
    else
        points = [];

    for (let y = 0; y < size + 1; y++) {
        let row = [];
        for (let x = 0; x < size; x++) {
            row.push(-1);
        }
        scanmap.push(row);
    }

    for (let y = 0; y < size + 1; y++) {
        let row = [];
        for (let x = 0; x < size; x++) {
            row.push(-1);
        }
        vertexmap.push(row);
    }

    for (let y = 0; y < size + 1; y++) {
        let row = [];
        for (let x = 0; x < size; x++) {
            row.push(2);
        }
        vertextypemap.push(row);
    }

}

function trace (x, y, look, inside, n) {

    let pointsub = doing_water ? waterpoints : points;
    let current = [x, y]; 

    let tops = [];
    let new_geometry = [];
    let starting_normal = [0, inside ? 1 : -1];
    let normal = starting_normal.slice();

    loops = 0;

    // see if we should make a new boundry
    if (look(current) && !look(add(current, normal))) {
        let corner;
        ctx.beginPath();
        corner = get_corner(current, inside ? SE : NW);
        ctx.moveTo(corner[0], corner[1]);
    }

    // move around the boundry
    do {
        let isWallAbove = look(add(current, normal));

        // mark where the tops of the region are
        if ( (!inside && normal[1] == starting_normal[1] && look(current) ) ||
             ( inside && normal[1] == starting_normal[1] && look(current) && !isWallAbove )
        ) {
            if (!inside) {
                let drop = current.slice();
                tops.push(drop);
            } else {
                let drop = add(current.slice(), normal);
                tops.push(drop);
            }
        } else if (normal[1] == (inside ? -1 : 1) && look(current)) { // also mark what vertex we're on
            if (inside && !isWallAbove) {
                scanmap[current[0]][current[1] - 1] = (inside ? -1 : pointsub.length);
            }
            if (!inside && !isWallAbove) {
                scanmap[current[0]][current[1]] = (inside ? -1 : pointsub.length);

                let val = new_geometry.length;

                vertexmap[current[0]][current[1] + 1] = val;
                vertextypemap[current[0]][current[1] + 1] = 1;
            }
        }
        
        if (inside && normal[1] == 1 && !isWallAbove && look(current)) {
            let val = new_geometry.length;

            vertexmap[current[0]][current[1] + 1] = val;
            vertextypemap[current[0]][current[1] + 1] = insides.length * -1;
        }

        if (look(current) && isWallAbove) { // we're turning ccwise
            current = add(current, normal);
            normal = turn_cc(normal);

            corner_pt = get_corner(current, get_corner_type(normal));
            placePoint(corner_pt, new_geometry);
        } else if (!look(current)) { // we're turning cwise
            normal = turn_c(normal);
            current = sub(current, normal);

            corner_pt = get_corner(current, get_corner_type(normal));
            placePoint(corner_pt, new_geometry);
        } else { // we're going straight
            current = add(current, turn_c(normal));
        }

        loops++;

    } while (/*loops < loops_max &&*/ !(current[0] == x && current[1] == y && normal[1] == starting_normal[1]));

    ctx.closePath();
    ctx.strokeStyle = "black";
    ctx.stroke();

    // start at each of the tops we marked go down and mark everywhere inside
    for (var i = 0; i < tops.length; i++) {
        drop = tops[i];
        while (
            (!inside && scanmap[drop[0]][drop[1]] == -1) ||
            ( inside && scanmap[drop[0]][drop[1]] != -1)
        ) {
            scanmap[drop[0]][drop[1]] = (inside ? -1 : pointsub.length);
            drop[1]++;
        }
    }
    
    if (inside) {
         insides.push({ g: new_geometry.slice(), o: n, s: [x, y + 1]});
    } else {
        pointsub.push(new_geometry.slice());
    }
}

// connect one of the inner regions to the outside of the region
function connect_region (look, i) {
    // we want to know which thing we are going to connect to
    let pointsub = doing_water ? waterpoints : points;
    current = insides[i].s.slice();

    do {
        current[1]++;
    } while (scanmap[current[0]][current[1]] == -1);
    do {
        current[1]++;
    } while (look(current) == true)

    let new_point = get_corner(current, NW);
    let pos = vertexmap[current[0]][current[1]];
    let type = vertextypemap[current[0]][current[1]];
    
    // are we connecting to an outside border or an inside border?
    if (type == 1) { // outside
        let index = insides[i].o;

        let begin = pointsub[index].slice(0, pos)
        begin.push(new_point);

        let inside_stuff = insides[i].g;
        inside_stuff.push(inside_stuff[0]);
        inside_stuff.push(new_point);

        let end = pointsub[index].slice(pos);

        let newpointsub = begin.concat(inside_stuff.concat(end));

        pointsub[index] = newpointsub;

        while (current[0] < 0 && vertexmap[current[0]][current[1]] == pos) {
            vertexmap[current[0]][current[1]] += 1 + insides[i].g.length + 2;
            current[0]--;
        }
    } else { // inside
        if (type == 2) { 
            console.log("error");
        }
        let index = type * -1;

        if (pos == 0) { // hacky?
            pos = insides[index].g.length;
            vertexmap[current[0]][current[1]] = insides[index].g.length;
        }

        let begin = insides[index].g.slice(0, pos)
        begin.push(new_point);

        let inside_stuff = insides[i].g.slice();
        inside_stuff.push(inside_stuff[0]);
        inside_stuff.push(new_point);

        let end = insides[index].g.slice(pos);

        let newpointsub = begin.concat(inside_stuff.concat(end));

        insides[index].g = newpointsub;
        connect_region(index);

        while (vertexmap[current[0]][current[1]] == pos) {
            vertexmap[current[0]][current[1]] += 1 + insides[i].g.length + 2;
            current[0]--;
        }
    }
}

// this function figures out boundries
function lines () {
    reset_everything();

    // this function is called twice, once when we're doing the walls, and once
    // when we're doing the water
    let look = doing_water ? access_water : access;

    let new_geometry = [];

    // figure out the outsides
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            let current = [x, y]; 

            let me = look([x, y]);
            let n = look([x, y - 1]);
            let s = look([x, y + 1]);
            let w = look([x - 1, y]);
            let e = look([x + 1, y]);

            let other = n && s && w && e;

            if (!me || other || scanmap[x][y] != -1) continue;

            trace(x, y, look, false);
        }
    }

    // figure out the insides
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            let current = [x, y]; 

            let me = look([x, y]);
            let n = look([x, y - 1]);
            let s = look([x, y + 1]);
            let w = look([x - 1, y]);
            let e = look([x + 1, y]);

            let other = n && s && w && e;

            if (scanmap[x][y] == -1) continue;

            if (me || other) continue;

            trace(x, y - 1, look, true, scanmap[x][y]);
        }
    }

    // connect the insides to the outsides
    for (let i = 0; i < insides.length; i++) {
        connect_region(look, i);
    }
}

function make_files() {

    // create cs file
    let cs = "";
    cs += "using System.Collections;%0Ausing System.Collections.Generic;%0Ausing UnityEngine;%0A%0Apublic static class MapInfo {%0A%09public static int[,] mapData = new int[,] {"
    
    for (let j = 0; j < size; j++) {
        let array_row = "%0A%09%09{";
        for (let k = 0; k < size; k++) {
            array_row += "" + map[k][j] + ","
        }
        array_row += "},";
        cs += array_row;
    }

    cs += "%0A%09};%0A}"

    document.getElementById("download2").href = "data:text/html," + cs;

    // create obj file
    
    let scale = tilesize;
    let obj = "";

    geometry_offsets = [];

    // main geometry
    let counter = 0;
    for (let j = 0; j < points.length; j++) {
        geometry_offsets.push(counter);

        let geometry = points[j];

        for (let i = 0; i < geometry.length; i++) {
            let px = geometry[i][0]/scale - size/2;
            let py = geometry[i][1]/scale - size/2;
            obj += "v " + (px).toFixed(2) + " 1.0 " + (py).toFixed(2) + "%0A";
            counter++;
        }
        for (let i = 0; i < geometry.length; i++) {
            let px = geometry[i][0]/scale - size/2;
            let py = geometry[i][1]/scale - size/2;
            obj += "v " + (px).toFixed(2) + " 0.0 " + (py).toFixed(2) + "%0A";
            counter++;
        }
    }

    // floor/water geometry
    for (let j = 0; j < waterpoints.length; j++) {
        geometry_offsets.push(counter);

        let geometry = waterpoints[j];

        for (let i = 0; i < geometry.length; i++) {
            let px = geometry[i][0]/scale - size/2;
            let py = geometry[i][1]/scale - size/2;
            obj += "v " + (px).toFixed(2) + " 0.0 " + (py).toFixed(2) + "%0A";
            counter++;
        }
        for (let i = 0; i < geometry.length; i++) {
            let px = geometry[i][0]/scale - size/2;
            let py = geometry[i][1]/scale - size/2;
            obj += "v " + (px).toFixed(2) + " -1.0 " + (py).toFixed(2) + "%0A";
            counter++;
        }
    }

    // ramps
    for (let j = 0; j < ramps.length; j++) {
        geometry_offsets.push(counter);

        let geometry = ramps[j];
        for (let i = 0; i < geometry.length; i++) {
            let px = geometry[i][0] - size/2;
            let py = geometry[i][1];
            let pz = geometry[i][2] - size/2;
            obj += "v " + px.toFixed(2) + " " + py.toFixed(2) + " " + pz.toFixed(2) + "%0A";
            counter++;
        }
    }

    // walls
    for (let j = 0; j < points.length; j++) {
        let off = geometry_offsets[j];
        let geometry = points[j];

        // top face
        obj += "f ";
        for (let i = geometry.length - 1; i >= 0; i--) {
            obj += (i+1+off) + " "
        }
        obj += "%0A";

        // sides
        for (let i = 0; i < geometry.length - 1; i++) {
            obj += "f " + (i+2+geometry.length+off) + " " + (i+1+geometry.length+off) +
                " " + (i+1+off) + " " + (i+2+off) + "%0A";
        }

        obj += "f " + (geometry.length+1+off) + " " +
            (geometry.length*2+off) + " " + (geometry.length+off) + " " + (1+off) + "%0A";
    }

    // water and floor
    for (let j = 0; j < waterpoints.length; j++) {
        let off = geometry_offsets[j + points.length];
        let geometry = waterpoints[j];

        // top face
        obj += "f ";
        for (let i = geometry.length - 1; i >= 0; i--) {
            obj += (i+1+off) + " "
        }
        obj += "%0A";

        // sides
        for (let i = 0; i < geometry.length - 1; i++) {
            obj += "f " + (i+2+geometry.length+off) + " " + (i+1+geometry.length+off) +
                " " + (i+1+off) + " " + (i+2+off) + "%0A";
        }

        obj += "f " + (geometry.length+1+off) + " " +
            (geometry.length*2+off) + " " + (geometry.length+off) + " " + (1+off) + "%0A";
    }

    // ramps
    for (let j = 0; j < ramps.length; j++) {
        let off = geometry_offsets[j + points.length + waterpoints.length];
        let geometry = ramps[j];

        // top face
        obj += "f ";
        for (let i = geometry.length - 1; i >= 0; i--) {
            obj += (i+1+off) + " "
        }
        obj += "%0A";
    }

    document.getElementById("download").href = "data:text/html," + obj;
}

function placePoint (v, geometry) {
    // ctx.fillStyle="pink";
    // ctx.fillRect(v[0], v[1], 10, 10);
    ctx.lineTo(v[0], v[1]);
    geometry.push(v);
}

function make_ramp (x, y, me) {
    let ramp_heights;

    /*
        0----2----1
        |         |
        3         5
        |         |
        2----4----3
    */

    switch (me) {
        case 2: ramp_heights = [1, 1, 0, 0]; break;
        case 3: ramp_heights = [1, 0, 0, 1]; break;
        case 4: ramp_heights = [0, 0, 1, 1]; break;
        case 5: ramp_heights = [0, 1, 1, 0]; break;
    }

    let new_ramp = [];

    new_ramp.push([x, ramp_heights[0], y]);
    new_ramp.push([x + 1, ramp_heights[1], y]);
    new_ramp.push([x + 1, ramp_heights[2], y + 1]);
    new_ramp.push([x, ramp_heights[3], y + 1]);

    ramps.push(new_ramp);
}

var doing_water = false;

function update () {
    ctx.clearRect(0, 0, 800, 800);

    ramps = [];

    // this is just rendering stuff for the on screen grid
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            let me = access_tile([x, y])

            switch (me) {
                case 0: ctx.fillStyle = "green"; break; // floor
                case 1: ctx.fillStyle = "white"; break; // wall
                case 6: ctx.fillStyle = "cyan"; break; // water

                // ramps
                case 2:
                    var grd = ctx.createLinearGradient(
                        x * (tilesize + margin),
                        y * (tilesize + margin),
                        x * (tilesize + margin),
                        y * (tilesize + margin) + tilesize
                    );
                    grd.addColorStop(0,"white");
                    grd.addColorStop(1,"black");
                    ctx.fillStyle = grd;
                    break;
                case 3:
                    var grd = ctx.createLinearGradient(
                        x * (tilesize + margin),
                        y * (tilesize + margin),
                        x * (tilesize + margin) + tilesize,
                        y * (tilesize + margin)
                    );
                    grd.addColorStop(0,"white");
                    grd.addColorStop(1,"black");
                    ctx.fillStyle = grd;
                    break;
                case 4:
                    var grd = ctx.createLinearGradient(
                        x * (tilesize + margin),
                        y * (tilesize + margin),
                        x * (tilesize + margin),
                        y * (tilesize + margin) + tilesize
                    );
                    grd.addColorStop(0,"black");
                    grd.addColorStop(1,"white");
                    ctx.fillStyle = grd;
                    break;
                case 5:
                    var grd = ctx.createLinearGradient(
                        x * (tilesize + margin),
                        y * (tilesize + margin),
                        x * (tilesize + margin) + tilesize,
                        y * (tilesize + margin)
                    );
                    grd.addColorStop(0,"black");
                    grd.addColorStop(1,"white");
                    ctx.fillStyle = grd;
                    break;
            }

            if (me >= 2 && me <= 5) {
                make_ramp(x, y, me);
            }

            ctx.fillRect(
                x * (tilesize + margin),
                y * (tilesize + margin),
                tilesize,
                tilesize
            );
        }
    }

    doing_water = false;
    lines();
    doing_water = true;
    lines();

    make_files();
}

// these next three functions are helper functions. to help with trace mostly

// given a tile coordinate and which corner, gives the screen coordiantes of
// that corner (the program should probably be revised so this doesn't really
// happen)
function get_corner (pos, corner) {
    let x = pos[0];
    let y = pos[1];

    if (corner == NW)
        return [x * (tilesize + margin), y * (tilesize + margin)];

    if (corner == NE)
        return [x * (tilesize + margin) + tilesize, y * (tilesize + margin)];

    if (corner == SW)
        return [x * (tilesize + margin), y * (tilesize + margin) + tilesize];

    if (corner == SE)
        return [x * (tilesize + margin) + tilesize,
            y * (tilesize + margin) + tilesize];
}

// given a direction, gives two points that makes a side
function get_side (dir) {
    let corner1;
    let corner2;

    if (dir[0] == 0 && dir[1] == -1) { // north -> NW, SW
        corner1 = NW;
        corner2 = SW;
    }

    if (dir[0] == 1 && dir[1] == 0) { // east -> NE, SE
        corner1 = NE;
        corner2 = NW;
    }

    if (dir[0] == -1 && dir[1] == 0) { // west -> SW, SE
        corner1 = SW;
        corner2 = SE;
    }

    if (dir[0] == 0 && dir[1] == 1) { // south -> NE, NW
        corner1 = NE;
        corner2 = SE;
    }

    return [corner1, corner2];
}

// given a direction, gives where to place a point
function get_corner_type (dir) {
    let corner;

    if (dir[0] == 0 && dir[1] == -1) { // north -> NW
        corner = NW;
    }

    if (dir[0] == 1 && dir[1] == 0) { // east -> NE
        corner = NE;
    }

    if (dir[0] == -1 && dir[1] == 0) { // west -> SW
        corner = SW;
    }

    if (dir[0] == 0 && dir[1] == 1) { // south -> NE
        corner = SE;
    }

    return corner;
}

// access and access water are used to make the boundries

// true or false means if something is a wall or not
function access (pos) {
    let x = pos[0];
    let y = pos[1];

    if (x < 0 || x >= size) return false;
    if (y < 0 || y >= size) return false;
    return map[y][x] == 1;
}

// true or false means if something is not water or not
function access_water (pos) {
    let x = pos[0];
    let y = pos[1];

    if (x < 0 || x >= size) return false;
    if (y < 0 || y >= size) return false;
    return map[y][x] != 6;
}

function access_tile (pos) {
    let x = pos[0];
    let y = pos[1];

    if (x < 0 || x >= size) return 0;
    if (y < 0 || y >= size) return 0;
    return map[y][x];
}

// this is some code useful for debugging that i dont want to delete

// ctx.fillStyle = "orange";
// ctx.fillRect(
//     current[0] * (tilesize + margin) + marker*2,
//     (current[1] + 1) * (tilesize + margin) + marker*2,
//     tilesize - marker*4,
//     tilesize - marker*4
// );
// ctx.fillStyle = "black";

// let metrics = ctx.measureText(val);
// ctx.fillText(
//     val,
//     current[0] * (tilesize + margin) + tilesize/2 - metrics.width/2,
//     (current[1] + 1) * (tilesize + margin) + tilesize/2 + 4,
// );
