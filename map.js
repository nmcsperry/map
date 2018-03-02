let c = document.getElementById("canvas");
let ctx = c.getContext("2d");

var margin = 0;
var tilesize = 40;
var size = 40;
var marker = 6;

let map = [];
for (let y = 0; y < size; y++) {
    let row = [];
    for (let x = 0; x < size; x++) {
        row.push(0);
    }
    map.push(row);
}

const NW = 0;
const NE = 1;
const SE = 2;
const SW = 3;

c.addEventListener("click", function (e) {
    let cursorX = e.pageX;
    let cursorY = e.pageY;

    let x = Math.floor(cursorX / (tilesize + margin));
    let y = Math.floor(cursorY / (tilesize + margin));

    map[y][x] = 1 - map[y][x];

    render();
});

var val = 500;

window.onload = function () {
    window.addEventListener("keydown", function (e) {
        // console.log(e.keyCode);
        if (e.keyCode == 90 && val > 1) val--;
        if (e.keyCode == 88) val++;
        render();
    }, false);
}

ctx.strokeStyle = "red";
ctx.lineWidth = 4;

render();

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

function flip (v1) {
    // [0, 1]
    // [1, 0]
    return [v1[1], v1[0]];
}

function invert (v1) {
    // [-1,  0]
    // [ 0, -1]
    return [-v1[0], -v1[1]];
}


/*       
         ____ 
        |    |
        |____|
     
*/

function lines () {
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            let current = [x, y]; 

            if (!access(current)) continue;

            let normal = [0, -1];
            let yep = false;

            // see if we should make a new boundry
            if (access(current) && !access(add(current, normal))) {
                let corner;
                ctx.beginPath();
                corner = getCorner(current, NW);
                ctx.moveTo(corner[0], corner[1]);
                yep = true;
            }

            let loops = 0;

            do {
                loops++;
                if (loops > val) {
                    console.log("early exit");
                    ctx.closePath();
                    ctx.stroke();
                    return;
                }

                let isOnWall = access(current);
                let isWallAbove = access(add(current, normal));

                // !(access(current) && !isWallAbove)
                // = !access(current) || isWallAbove

                if (access(current) && isWallAbove) {
                    ctx.fillStyle = "cyan";
                    drawSide(current, normal);

                    // current = sub(current, turnC(normal));

                    normal = turnCC(normal);

                    drawSide(current, normal);

                    let corner_type = normal;

                    current = add(current, turnC(normal));
                    corner_pt = getCorner(current, getCornerType(corner_type));

                    // ctx.fillRect(
                    //     current[0] * (tilesize + margin) + marker*2,
                    //     current[1] * (tilesize + margin) + marker*2,
                    //     tilesize - marker*4,
                    //     tilesize - marker*4
                    // );

                    ctx.lineTo(corner_pt[0], corner_pt[1]);
                } else if (!access(current)) { // we're turning cwise
                    ctx.fillStyle = "pink";
                    drawSide(current, normal);

                    current = sub(current, turnC(normal));
                    normal = turnC(normal);

                    drawSide(current, normal);

                    corner_pt = getCorner(current, getCornerType(normal));

                    // ctx.fillRect(
                    //     current[0] * (tilesize + margin) + marker*2,
                    //     current[1] * (tilesize + margin) + marker*2,
                    //     tilesize - marker*4,
                    //     tilesize - marker*4
                    // );

                    ctx.lineTo(corner_pt[0], corner_pt[1]);
                } else {
                    ctx.fillStyle = "lime";
                    drawSide(current, normal);
                    current = add(current, turnC(normal));
                }
            } while (!(current[0] == x && current[1] == y && normal[1] == -1));


            if (yep) {
                ctx.closePath();
                ctx.stroke();
                
                return;
            }
        }
    }
}

function render () {
    ctx.clearRect(0, 0, 800, 800);

    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            let me = access([x, y])

            let n = access([x, y - 1]);
            let s = access([x, y + 1]);
            let w = access([x - 1, y]);
            let e = access([x + 1, y]);

            ctx.fillStyle = me ? "black" : "green";
            ctx.fillRect(
                x * (tilesize + margin),
                y * (tilesize + margin),
                tilesize,
                tilesize
            );
        }
    }

    lines();

    // for (let x = -1; x <= size; x++) {
    //     for (let y = -1; y <= size; y++) {
    //         let me = access([x, y]);

    //         let n = access([x, y - 1]);
    //         let s = access([x, y + 1]);
    //         let w = access([x - 1, y]);
    //         let e = access([x + 1, y]);

    //         let nw = access([x - 1, y - 1]);
    //         let ne = access([x + 1, y - 1]);
    //         let sw = access([x - 1, y + 1]);
    //         let se = access([x + 1, y + 1]);

    //         let nw_c = n == w;
    //         let ne_c = n == e;
    //         let sw_c = s == w;
    //         let se_c = s == e;

    //         if (!me) continue;

    //         if (nw_c && (!n || !nw)) placePoint([x, y], NW);
    //         if (ne_c && (!n || !ne)) placePoint([x, y], NE);
    //         if (sw_c && (!s || !sw)) placePoint([x, y], SW);
    //         if (se_c && (!s || !se)) placePoint([x, y], SE);
    //     }
    // }
}

function placePoint (pos, corner) {
        ctx.fillStyle = "red";

        let x = pos[0];
        let y = pos[1];

        if (corner == NW)
            ctx.fillRect(
                x * (tilesize + margin),
                y * (tilesize + margin),
                marker,
                marker
            );

        if (corner == NE)
            ctx.fillRect(
                x * (tilesize + margin) + tilesize - marker,
                y * (tilesize + margin),
                marker,
                marker
            );

        if (corner == SW)
            ctx.fillRect(
                x * (tilesize + margin),
                y * (tilesize + margin) + tilesize - marker,
                marker,
                marker
            );

        if (corner == SE)
            ctx.fillRect(
                x * (tilesize + margin) + tilesize - marker,
                y * (tilesize + margin) + tilesize - marker,
                marker,
                marker
            );
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

    // console.log(dir + " -> " + corner);

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
    return map[y][x] != 0;
}
