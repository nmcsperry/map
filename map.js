let c = document.getElementById("canvas");
let ctx = c.getContext("2d");

ctx.strokeStyle = "red";

const NW = 0;
const NE = 1;
const SE = 2;
const SW = 3;

var margin = 0;
var tilesize = 20;
var size = 30;
var marker = 1;

ctx.lineWidth = marker;

var center = [0, 0];

let obj = "";

let texmap = [
    [0],
];

let scanmap = [];
for (let y = 0; y < size; y++) {
    let row = [];
    for (let x = 0; x < size; x++) {
        row.push(0);
    }
    scanmap.push(row);
}

let map = [];
for (let y = 0; y < size; y++) {
    let row = [];
    for (let x = 0; x < size; x++) {
        row.push(texmap[y % texmap.length][x % texmap[0].length]);
    }
    map.push(row);
}

var previous_tile_ele_left = 0;
var previous_tile_ele_right = 0;

var paint = -1;
var metapaint_left = 0;
var metapaint_right = 0;

function select_tile (e) {

    let selection_type = 1;
    if(e.which == 3) selection_type = 0;

    let ele = e.target;

    if (ele.className == "dontclick") ele = ele.parentElement;

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

select_tile({which: 0, target: document.getElementById("starttileleft")});
select_tile({which: 3, target: document.getElementById("starttileright")});

var tiles = document.getElementsByTagName("p");

for (let i = 0; i < tiles.length; i++) {
    tiles[i].addEventListener("mousedown", select_tile);
}


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
                case 0: case 1:
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

    update();
});

c.addEventListener("mouseup", function (e) {
    paint = -1;
});

c.addEventListener("mousemove", function (e) {
    let cursorX = e.pageX - this.offsetLeft;
    let cursorY = e.pageY - this.offsetTop;

    let x = Math.floor(cursorX / (tilesize + margin));
    let y = Math.floor(cursorY / (tilesize + margin));

    if (paint != -1)
        map[y][x] = paint;

    update();
});

window.onload = function () {
    window.addEventListener("keydown", function (e) {
        // console.log(e.keyCode);
        if (e.keyCode == 90 && val > 1) val--;
        if (e.keyCode == 88) val++;
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

function turnC (v1) {
    // [0, -1]
    // [1,  0]
    return [-v1[1], v1[0]];
}

function turnCC (v1) {
    // [ 0, 1]
    // [-1, 0]
    return [v1[1], -v1[0]];
}

var points = [];
var ramps = [];

function lines () {
    scanmap = [];
    points = [];

    let new_geometry = [];

    for (let y = 0; y < size; y++) {
        let row = [];
        for (let x = 0; x < size; x++) {
            row.push(0);
        }
        scanmap.push(row);
    }

    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            let current = [x, y]; 

            let me = access([x, y]);
            let n = access([x, y - 1]);
            let s = access([x, y + 1]);
            let w = access([x - 1, y]);
            let e = access([x + 1, y]);

            let other = n && s && w && e;

            if (!me || other || scanmap[x][y] == 1) continue;

            let tops = [];
            let new_geometry = [];
            let normal = [0, -1];

            // see if we should make a new boundry
            if (access(current) && !access(add(current, normal))) {
                let corner;
                ctx.beginPath();
                corner = getCorner(current, NW);
                ctx.moveTo(corner[0], corner[1]);
            }

            do {
                let isWallAbove = access(add(current, normal));

                // !(access(current) && !isWallAbove)
                // = !access(current) || isWallAbove

                if (normal[1] == -1 && access(current)) {
                    let drop = current.slice();
                    tops.push(drop);
                } else if (normal[1] == 1 && access(current)) {
                    if (!isWallAbove) {
                        // ctx.fillStyle = "yellow";
                        // ctx.fillRect(
                        //     current[0] * (tilesize + margin) + marker*2,
                        //     current[1] * (tilesize + margin) + marker*2,
                        //     tilesize - marker*4,
                        //     tilesize - marker*4
                        // );
                        scanmap[current[0]][current[1]] = 1;
                    }
                }

                if (access(current) && isWallAbove) { // we're turning ccwise
                    current = add(current, normal);
                    normal = turnCC(normal);

                    corner_pt = getCorner(current, getCornerType(normal));
                    placePoint(corner_pt, new_geometry);
                } else if (!access(current)) { // we're turning cwise
                    normal = turnC(normal);
                    current = sub(current, normal);

                    corner_pt = getCorner(current, getCornerType(normal));
                    placePoint(corner_pt, new_geometry);
                } else { // we're going straight
                    current = add(current, turnC(normal));
                }
            } while (!(current[0] == x && current[1] == y && normal[1] == -1));

            ctx.closePath();
            ctx.strokeStyle="black";
            ctx.stroke();

            for (var i = 0; i < tops.length; i++) {
                drop = tops[i];
                while(scanmap[drop[0]][drop[1]] == 0) {
                    if (!access(drop)) {
                        ctx.fillStyle = "red";
                        ctx.fillRect(
                            drop[0] * (tilesize + margin),
                            drop[1] * (tilesize + margin),
                            tilesize,
                            tilesize
                        );
                    }

                    // ctx.fillStyle = "cyan";
                    // ctx.fillRect(
                    //     drop[0] * (tilesize + margin) + marker*2,
                    //     drop[1] * (tilesize + margin) + marker*2,
                    //     tilesize - marker*4,
                    //     tilesize - marker*4
                    // );

                    scanmap[drop[0]][drop[1]] = 1;
                    drop[1]++;
                }
            }

            points.push(new_geometry.slice());
        }
    }

    // create cs file
    cs = "";
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
    obj = "";

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

    obj += "v -" + (size/2).toFixed(2) + " 0.0 " + (size/2).toFixed(2) + "%0A";
    obj += "v " + (size/2).toFixed(2) + " 0.0 " + (size/2).toFixed(2) + "%0A";
    obj += "v " + (size/2).toFixed(2) + " 0.0 -" + (size/2).toFixed(2) + "%0A";
    obj += "v -" + (size/2).toFixed(2) + " 0.0 -" + (size/2).toFixed(2) + "%0A";

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

    // ramps
    for (let j = 0; j < ramps.length; j++) {
        let off = geometry_offsets[j + points.length];
        let geometry = ramps[j];

        // top face
        obj += "f ";
        for (let i = geometry.length - 1; i >= 0; i--) {
            obj += (i+1+off) + " "
        }
        obj += "%0A";
    }

    // ground
    obj += "f " + (counter+1) + " " + (counter+2) + " " + (counter+3) + " " + (counter+4) + "%0A";

    document.getElementById("download").href = "data:text/html," + obj;
}

function placePoint (v, geometry) {
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

function update () {
    ctx.clearRect(0, 0, 800, 800);

    ramps = [];

    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            let me = access_tile([x, y])

            switch (me) {
                case 0: ctx.fillStyle = "green"; break; // floor
                case 1: ctx.fillStyle = "white"; break; // wall

                // ramp
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

    lines();
}

function getCorner (pos, corner) {
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

function getSide (dir) {
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

function getCornerType (dir) {
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

    // console.log(dir + " -> " + corner);

    return corner;
}

function drawSide(current, normal) {
    return;
    let sides = getSide(turnC(normal));
    corner1 = getCorner(current, sides[0]);
    corner2 = getCorner(current, sides[1]);

    let side_width = corner1[0] - corner2[0];
    let side_height = corner1[1] - corner2[1];

    if (side_width == 0) side_width = 5;
    if (side_height == 0) side_height = 5;

    ctx.fillRect(
        corner2[0], // current[0] * (tilesize + margin) + marker*2,
        corner2[1], // current[1] * (tilesize + margin) + marker*2,
        side_width,
        side_height
    );
}

function access (pos) {
    let x = pos[0];
    let y = pos[1];

    if (x < 0 || x >= size) return false;
    if (y < 0 || y >= size) return false;
    return map[y][x] == 1;
}

function access_tile (pos) {
    let x = pos[0];
    let y = pos[1];

    if (x < 0 || x >= size) return 0;
    if (y < 0 || y >= size) return 0;
    return map[y][x];
}
