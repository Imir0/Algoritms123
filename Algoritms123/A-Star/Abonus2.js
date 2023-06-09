let onScreenCVS = document.querySelector(".map");
let onScreenCTX = onScreenCVS.getContext("2d");
onScreenCVS.width = 2048 * 2;
onScreenCVS.height = 1280 * 2;
onScreenCVS.style.width = "1024px";
onScreenCVS.style.height = "640px";
let scale = 2 * 2;
onScreenCTX.scale(scale, scale);
let offScreenCVS = document.createElement('canvas');
let offScreenCTX = offScreenCVS.getContext("2d");
let tileSize = 16;
offScreenCVS.width = 64;
offScreenCVS.height = 40;
let img = new Image;
let source = offScreenCVS.toDataURL();
onScreenCVS.addEventListener('mousemove', handleMouseMove);
onScreenCVS.addEventListener('mousedown', handleMouseDown);
onScreenCVS.addEventListener('mouseup', handleMouseUp);
let clicked = false;

function handleMouseMove(e) {
  if (clicked) {
    draw(e)
  }
}

function handleMouseDown(e) {
  clicked = true;
  cancelPathfinding();
  draw(e);
}

function handleMouseUp() {
  clicked = false;
}

function draw(e) {
  let ratio = onScreenCVS.width / scale / offScreenCVS.width;
  if (offScreenCTX.fillStyle === "rgba(0, 0, 0, 0)") {
    offScreenCTX.clearRect(Math.floor(e.offsetX / ratio), Math.floor(e.offsetY / ratio), 1, 1);
  } else if (offScreenCTX.fillStyle === "#ffa500") {
    let imageData = offScreenCTX.getImageData(0, 0, offScreenCVS.width, offScreenCVS.height);
    for (let i = 0; i < imageData.data.length; i += 4) {
      let x = i / 4 % offScreenCVS.width,
        y = (i / 4 - x) / offScreenCVS.width;
      let color = `rgba(${imageData.data[i]}, ${imageData.data[i+1]}, ${imageData.data[i+2]}, ${imageData.data[i+3]})`
      if (color === "rgba(255, 165, 0, 255)") {
        offScreenCTX.clearRect(x, y, 1, 1);
      }
    }
    offScreenCTX.fillRect(Math.floor(e.offsetX / ratio), Math.floor(e.offsetY / ratio), 1, 1);
  } else if (offScreenCTX.fillStyle === "#0000ff") {
    let imageData = offScreenCTX.getImageData(0, 0, offScreenCVS.width, offScreenCVS.height);
    for (let i = 0; i < imageData.data.length; i += 4) {
      let x = i / 4 % offScreenCVS.width,
        y = (i / 4 - x) / offScreenCVS.width;
      let color = `rgba(${imageData.data[i]}, ${imageData.data[i+1]}, ${imageData.data[i+2]}, ${imageData.data[i+3]})`
      if (color === "rgba(0, 0, 255, 255)") {
        offScreenCTX.clearRect(x, y, 1, 1);
      }
    }
    offScreenCTX.fillRect(Math.floor(e.offsetX / ratio), Math.floor(e.offsetY / ratio), 1, 1);
  } else {
    offScreenCTX.fillRect(Math.floor(e.offsetX / ratio), Math.floor(e.offsetY / ratio), 1, 1);
  }
  source = offScreenCVS.toDataURL();
  renderImage();
}

function renderImage() {
  img.onload = () => {
    onScreenCTX.imageSmoothingEnabled = false;
    onScreenCTX.clearRect(0, 0, onScreenCVS.width / scale, onScreenCVS.height / scale);
    onScreenCTX.drawImage(img, 0, 0, onScreenCVS.width / scale, onScreenCVS.height / scale)
    onScreenCTX.fillStyle = "black";
    generateMap();
    if (mapNodes) {
      freeTiles.forEach(n => {
        onScreenCTX.fillStyle = "rgb(196, 188, 178)";
        onScreenCTX.fillRect(n.x * tileSize + 0.5, n.y * tileSize + 0.5, tileSize - 1, tileSize - 1);
      })
    }
  }
  img.src = source;
}
let palette = document.querySelector('.color-select');
palette.addEventListener('click', selectColor)

function selectColor(e) {
  offScreenCTX.fillStyle = e.target.id;
  palette.childNodes.forEach(c => {
    if (c.childNodes[1]) {
      if (c.childNodes[1].id === e.target.id) {
        c.childNodes[1].className = "swatch-selected";
      } else {
        c.childNodes[1].className = "swatch";
      }
    }
  });
}
let steps = document.querySelector('.steps');
let pathLength = document.querySelector('.path');
let gDisplay = document.querySelector('.gCost');
let hDisplay = document.querySelector('.hCost');
let fDisplay = document.querySelector('.fCost');
let decPlace = 1000;
let cornerBuffer = false;
let mapNodes = false;

let cornerCheckbox = document.querySelector('#cornerBuffer');
let nodeCheckbox = document.querySelector('#nodeRedundancy');

cornerCheckbox.addEventListener('input', updateCornerBuffer);

function updateCornerBuffer() {
  cornerBuffer = cornerCheckbox.checked;
}

nodeCheckbox.addEventListener('input', updateNodeMap);

function updateNodeMap() {
  mapNodes = nodeCheckbox.checked;
  renderImage();
}
let diagonals = true;
let delaySlider = document.querySelector('#stepDelay');
let delayDisplay = document.querySelector('.delay');

delaySlider.addEventListener('input', updateDelay);

function updateDelay() {
  delayDisplay.textContent = delaySlider.value;
}

let tileSlider = document.querySelector('#tileSlider');
let tileSizeDisplay = document.querySelector('.tileSize');

tileSlider.addEventListener('input', updateTiles);

function updateTiles() {
  cancelPathfinding();
  tileSize = Math.pow(2, tileSlider.value);
  offScreenCVS.width = onScreenCVS.width / scale / tileSize;
  offScreenCVS.height = onScreenCVS.height / scale / tileSize;
  tileSizeDisplay.textContent = tileSize;
  onScreenCTX.clearRect(0, 0, onScreenCVS.width / scale, onScreenCVS.height)
  offScreenCTX.clearRect(0, 0, offScreenCVS.width, offScreenCVS.height)
  generateMap();
}

let precSlider = document.querySelector('#precSlider');
let precisionDisplay = document.querySelector('.precision');

precSlider.addEventListener('input', updatePrecision);

function updatePrecision() {
  decPlace = Math.pow(10, precSlider.value);
  precisionDisplay.textContent = decPlace;
}
//Heuristics
let hButtons = document.querySelector('#heuristic');

hButtons.addEventListener('input', updateHeuristic);

function updateHeuristic(e) {
  if (e.target.value === "manhattan") {
    calcHCost = manhattan;
    diagonals = false;
  } else if (e.target.value === "octile") {
    calcHCost = octile;
    diagonals = true;
  } else if (e.target.value === "euclidean") {
    calcHCost = euclid;
    diagonals = true;
  }
}
let fButtons = document.querySelector('#fCost');

fButtons.addEventListener('input', updateFCalc);

function updateFCalc(e) {
  if (e.target.value === "ignoreG") {
    calcFCost = ignoreG;
  } else if (e.target.value === "sum") {
    calcFCost = sumCost;
  }
}
let tieButtons = document.querySelector('#tieBreak');
tieButtons.addEventListener('input', updateTieBreak);

function updateTieBreak(e) {
  if (e.target.value === "cross") {
    tieBreak = crossBreak;
    compareFCost = naiveRank;
  } else if (e.target.value === "proximity") {
    tieBreak = proximBreak;
    compareFCost = naiveRank;
  } else if (e.target.value === "hCost") {
    tieBreak = noBreak;
    compareFCost = deferToH;
  } else if (e.target.value === "noBreak") {
    tieBreak = noBreak;
    compareFCost = naiveRank;
  }
}
let calcGCost = calcPath;

function calcPath(node) {
  let curr = node;
  let cost = 0;
  while (curr.parent) {
    let step = Math.floor(euclid(curr, curr.parent) * decPlace) / decPlace;
    cost += step * curr.cost;
    curr = curr.parent;
  }
  cost = Math.floor(cost * decPlace) / decPlace;
  return cost;
}
let calcHCost = octile;

function manhattan(node1, node2) {
  let a = Math.abs(node1.x - node2.x);
  let b = Math.abs(node1.y - node2.y);
  return a + b;
}

function octile(node1, node2) {
  let a = Math.abs(node1.x - node2.x);
  let b = Math.abs(node1.y - node2.y);

  function leastSide() {
    if (a > b) { return b; } else { return a; }
  }
  let diagonalCost = leastSide() * Math.sqrt(2);
  let horizontalCost = Math.abs(b - a);
  let sum = diagonalCost + horizontalCost;
  return Math.floor(sum * decPlace) / decPlace;
}

function euclid(node1, node2) {
  let distance = Math.hypot(node1.x - node2.x, node1.y - node2.y);
  return Math.floor(distance * decPlace) / decPlace;
}
let tieBreak = crossBreak;

function crossBreak(node) {
  let dx1 = node.x - end.x;
  let dy1 = node.y - end.y;
  let dx2 = start.x - end.x;
  let dy2 = start.y - end.y;
  let cross = Math.abs(dx1 * dy2 - dx2 * dy1);
  return cross * (1 / decPlace);
}

function proximBreak(node) {
  //dwarf gCost
  return euclid(node, end) * (1 / decPlace);
}

function noBreak() {
  return 0;
}
let calcFCost = sumCost;

function sumCost(g, h) {
  return Math.floor((g + h) * decPlace) / decPlace;
}

function ignoreG(g, h) {
  return h;
}
let compareFCost = deferton;

function deferton(obj1, obj2) {
  if (obj1.fCost === obj2.fCost) {
    if (obj1.hCost > obj2.hCost) {
      return 1;
    } else {
      return -1;
    }
  } else if (obj1.fCost > obj2.fCost) {
    return 1;
  } else if (obj1.fCost < obj2.fCost) {
    return -1;
  }
  return 0;
}

function naiveRank(obj1, obj2) {
  if (obj1.fCost > obj2.fCost) {
    return 1;
  } else if (obj1.fCost < obj2.fCost) {
    return -1;
  }
  return 0;
}
let gameGrid = [];
let start = {};
let end = {};
let walls = [];
let nodes = [];
let freeTiles = [];

function getNeighbors(tile) {
  let neighbors = {};
  if (gameGrid[tile.y][tile.x + 1]) {
    //east
    neighbors.east = gameGrid[tile.y][tile.x + 1];
  }
  if (gameGrid[tile.y][tile.x - 1]) {
    //west
    neighbors.west = gameGrid[tile.y][tile.x - 1];
  }
  if (gameGrid[tile.y + 1]) {
    //south
    neighbors.south = gameGrid[tile.y + 1][tile.x];
    if (diagonals) {
      if (gameGrid[tile.y + 1][tile.x - 1]) {
        //southwest
        neighbors.southwest = gameGrid[tile.y + 1][tile.x - 1];
      }
      if (gameGrid[tile.y + 1][tile.x + 1]) {
        //southeast
        neighbors.southeast = gameGrid[tile.y + 1][tile.x + 1];
      }
    }
  }
  if (gameGrid[tile.y - 1]) {
    //north
    neighbors.north = gameGrid[tile.y - 1][tile.x];
    if (diagonals) {
      if (gameGrid[tile.y - 1][tile.x - 1]) {
        //northwest
        neighbors.northwest = gameGrid[tile.y - 1][tile.x - 1];
      }
      if (gameGrid[tile.y - 1][tile.x + 1]) {
        //northeast
        neighbors.northeast = gameGrid[tile.y - 1][tile.x + 1];
      }
    }
  }
  return neighbors;
}

function generateMap() {
  gameGrid = [];
  start = {};
  end = {};
  let imageData = offScreenCTX.getImageData(0, 0, offScreenCVS.width, offScreenCVS.height);
  for (let i = 0; i < offScreenCVS.height; i++) {
    gameGrid[i] = [];
    for (let j = 0; j < offScreenCVS.width; j++) {
      gameGrid[i][j] = { parent: null, cost: 1, type: "free", x: j, y: i, gCost: 0, hCost: 0, fCost: 0 }
      //Draw the grid lines
      onScreenCTX.beginPath();
      onScreenCTX.rect(j * tileSize, i * tileSize, tileSize, tileSize);
      onScreenCTX.strokeStyle = "rgb(214, 206, 197)";
      onScreenCTX.lineWidth = 1;
      onScreenCTX.stroke();
    }
  }
  walls = [];
  nodes = [];
  freeTiles = [];
  //Iterate through pixels and set objects type each time a color matches
  for (let i = 0; i < imageData.data.length; i += 4) {
    let x = i / 4 % offScreenCVS.width,
      y = (i / 4 - x) / offScreenCVS.width;
    gameGrid[y][x].neighbors = getNeighbors(gameGrid[y][x]);
    let color = `rgba(${imageData.data[i]}, ${imageData.data[i+1]}, ${imageData.data[i+2]}, ${imageData.data[i+3]})`
    switch (color) {
      case "rgba(0, 0, 0, 255)":
        gameGrid[y][x].type = "wall";
        walls.push(gameGrid[y][x])
        break;
      case "rgba(255, 165, 0, 255)":
        gameGrid[y][x].type = "start";
        start = gameGrid[y][x];
        break;
      case "rgba(0, 0, 255, 255)":
        gameGrid[y][x].type = "end";
        end = gameGrid[y][x];
        break;
      default:
        let freeNeighbors = 0;

      function getColor(n, dir) {
        if (dir === "east" && n % (offScreenCVS.width * 4) === 0) { return false }
        if (dir === "west" && (n + 4) % (offScreenCVS.width * 4) === 0) { return false }
        if (n > imageData.data.length) { return false }
        if (n < 0) { return false }
        let black = "rgba(0, 0, 0, 255)";
        let color = `rgba(${imageData.data[n]}, ${imageData.data[n+1]}, ${imageData.data[n+2]}, ${imageData.data[n+3]})`
        if (black !== color) {
          freeNeighbors += 1;
          return true;
        } else {
          return false;
        }
      }
        let n = getColor(i - offScreenCVS.width * 4, "north");
        let s = getColor(i + offScreenCVS.width * 4, "south");
        let e = getColor(i + 4, "east");
        let w = getColor(i - 4, "west");
        getColor(i + 4 - offScreenCVS.width * 4, "east");
        getColor(i - 4 - offScreenCVS.width * 4, "west");
        getColor(i + 4 + offScreenCVS.width * 4, "east");
        getColor(i - 4 + offScreenCVS.width * 4, "west");
        console.log(freeNeighbors)
        if (freeNeighbors > 2) {
          gameGrid[y][x].type = "node";
          nodes.push(gameGrid[y][x]);
        } else if (n && s) {
          gameGrid[y][x].type = "free";
          gameGrid[y][x].dir = "vertical";
          freeTiles.push(gameGrid[y][x]);
        } else if (e && w) {
          gameGrid[y][x].type = "free";
          gameGrid[y][x].dir = "horizontal";
          freeTiles.push(gameGrid[y][x]);
        } else {
          gameGrid[y][x].type = "node";
          nodes.push(gameGrid[y][x]);
        }
    }
  }
}

function findPath() {
  let open = new Set();
  open.add(start);
  start.gCost = 0;
  start.hCost = Math.floor((calcHCost(start, end) + tieBreak(start)) * decPlace) / decPlace;
  start.fCost = calcFCost(start.gCost, start.hCost);
  let closed = new Set();
  let current = start;

  function drawPath(path) {
    let pathIndex = 0;

    function recursor() {
      let tile = path[pathIndex]
      onScreenCTX.fillStyle = "rgb(204,204,255)"
      onScreenCTX.fillRect(tile.x * tileSize + 0.5, tile.y * tileSize + 0.5, tileSize - 1, tileSize - 1)
      if (pathIndex === 0) {
        onScreenCTX.fillStyle = "rgb(255,248,43)"
        onScreenCTX.fillRect(tile.x * tileSize + 0.5, tile.y * tileSize + 0.5, tileSize - 1, tileSize - 1)
      }
      if (pathIndex === path.length - 1) {
        onScreenCTX.fillStyle = "rgb(97,92,255)"
        onScreenCTX.fillRect(tile.x * tileSize + 0.5, tile.y * tileSize + 0.5, tileSize - 1, tileSize - 1)
        generateBtn.disabled = false;
      }
      if (path[pathIndex - 1]) {
        pathLen += Math.hypot(path[pathIndex].x - path[pathIndex - 1].x, path[pathIndex].y - path[pathIndex - 1].y);
      }
      pathLength.textContent = Math.floor(pathLen * 100) / 100;
      pathIndex += 1;
      if (pathIndex < path.length) { setTimeout(recursor, 1) }
    }
    recursor();
  }

  function drawTempPath(path) {
    let pathIndex = 0;

    function recursor() {
      let tile = path[pathIndex]
      onScreenCTX.fillStyle = "rgba(229, 124, 255, 255)"
      onScreenCTX.fillRect(tile.x * tileSize + 0.5, tile.y * tileSize + 0.5, tileSize - 1, tileSize - 1)
      pathIndex += 1;
      if (pathIndex < path.length) { recursor() }
    }
    recursor();
  }
  let stepCount = 0;
  steps.textContent = 0;
  let pathLen = 0;
  pathLength.textContent = 0;

  recursiveLoop();

  function recursiveLoop() {
    if (cancelPath) { return 0 }
    stepCount += 1;
    steps.textContent = stepCount;

    gDisplay.textContent = current.gCost;
    hDisplay.textContent = current.hCost;
    fDisplay.textContent = current.fCost;
    onScreenCTX.clearRect(0, 0, onScreenCVS.width, onScreenCVS.height);
    for (let i = 0; i < offScreenCVS.height; i++) {
      for (let j = 0; j < offScreenCVS.width; j++) {
        onScreenCTX.beginPath();
        onScreenCTX.rect(j * tileSize, i * tileSize, tileSize, tileSize);
        onScreenCTX.stroke();
      }
    }
    if (mapNodes) {
      freeTiles.forEach(n => {
        onScreenCTX.fillStyle = "rgb(196, 188, 178)";
        onScreenCTX.fillRect(n.x * tileSize + 0.5, n.y * tileSize + 0.5, tileSize - 1, tileSize - 1);
      })
    }
    walls.forEach(w => {
      onScreenCTX.fillStyle = "black";
      onScreenCTX.fillRect(w.x * tileSize + 0.5, w.y * tileSize + 0.5, tileSize - 1, tileSize - 1);
    })
    open.forEach(n => {
      onScreenCTX.fillStyle = "rgb(33,181,235)";
      onScreenCTX.fillRect(n.x * tileSize + 0.5, n.y * tileSize + 0.5, tileSize - 1, tileSize - 1);
      if (tileSize === 64) {
        onScreenCTX.fillStyle = "black";
        onScreenCTX.font = `${tileSize/5}px Arial`;
        onScreenCTX.fillText(n.fCost, n.x * tileSize, n.y * tileSize + (tileSize / 4));
      }
    });
    closed.forEach(n => {
      onScreenCTX.fillStyle = `rgba(222,0,0,${n.hCost/n.fCost})`;
      onScreenCTX.fillRect(n.x * tileSize + 0.5, n.y * tileSize + 0.5, tileSize - 1, tileSize - 1);
      onScreenCTX.fillStyle = `rgba(83,222,2,${n.gCost/n.fCost})`;
      onScreenCTX.fillRect(n.x * tileSize + 0.5, n.y * tileSize + 0.5, tileSize - 1, tileSize - 1);
    })

    function progressPath() {
      let curr = current;
      let tempPath = [];
      while (curr.parent) {
        tempPath.push(curr);
        curr = curr.parent;
      }
      if (tempPath.length > 1) { drawTempPath(tempPath.reverse()) }
    }
    progressPath()
    onScreenCTX.fillStyle = "orange";
    onScreenCTX.fillRect(start.x * tileSize + 0.5, start.y * tileSize + 0.5, tileSize - 1, tileSize - 1);
    onScreenCTX.fillStyle = "blue";
    onScreenCTX.fillRect(end.x * tileSize + 0.5, end.y * tileSize + 0.5, tileSize - 1, tileSize - 1);
    onScreenCTX.fillStyle = "purple";
    onScreenCTX.fillRect(current.x * tileSize + 0.5, current.y * tileSize + 0.5, tileSize - 1, tileSize - 1);
    if (tileSize === 64) {
      onScreenCTX.fillStyle = "black";
      onScreenCTX.fillText(current.fCost, current.x * tileSize, current.y * tileSize + (tileSize / 4));
    }
    open.delete(current);
    closed.add(current);
    if (current === end) {
      let curr = current;
      let tempPath = [];
      while (curr.parent) {
        tempPath.push(curr);
        curr = curr.parent;
      }
      tempPath.push(curr);
      let truePath = tempPath.reverse();
      drawPath(truePath, delaySlider.value);
      return truePath;
    }
    let neighbArray = Object.entries(current.neighbors);
    for (let i = 0; i < neighbArray.length; i++) {
      let neighbor = neighbArray[i][1];
      let dir = neighbArray[i][0];
      if (neighbor.type === "wall" || closed.has(neighbor)) {
        continue;
      }
      if (dir === "northeast") {
        if ((current.neighbors.north.type === "wall") && (current.neighbors.east.type === "wall")) {
          continue;
        }
        if (cornerBuffer) {
          if ((current.neighbors.east.type === "wall")) {
            continue;
          }
          if ((current.neighbors.north.type === "wall")) {
            continue;
          }
        }

      }
      if (dir === "northwest") {
        if ((current.neighbors.north.type === "wall") && (current.neighbors.west.type === "wall")) {
          continue;
        }
        if (cornerBuffer) {
          if ((current.neighbors.west.type === "wall")) {
            continue;
          }
          if ((current.neighbors.north.type === "wall")) {
            continue;
          }
        }
      }
      if (dir === "southeast") {
        if ((current.neighbors.south.type === "wall") && (current.neighbors.east.type === "wall")) {
          continue;
        }
        if (cornerBuffer) {
          if ((current.neighbors.east.type === "wall")) {
            continue;
          }
          if ((current.neighbors.south.type === "wall")) {
            continue;
          }
        }
      }
      if (dir === "southwest") {
        if ((current.neighbors.south.type === "wall") && (current.neighbors.west.type === "wall")) {
          continue;
        }
        if (cornerBuffer) {
          if ((current.neighbors.west.type === "wall")) {
            continue;
          }
          if ((current.neighbors.south.type === "wall")) {
            continue;
          }
        }
      }

      function checkFree(tile, prev) {
        if (tile.type === "free") {
          progressSearch(tile, prev);
          open.delete(tile);
          closed.add(tile);
          if (tile.dir === "horizontal") {
            if (tile.neighbors.east === prev) {
              checkFree(tile.neighbors.west, tile);
            } else if (tile.neighbors.west === prev) {
              checkFree(tile.neighbors.east, tile);
            }
          } else if (tile.dir === "vertical") {
            if (tile.neighbors.north === prev) {
              checkFree(tile.neighbors.south, tile);
            } else if (tile.neighbors.south === prev) {
              checkFree(tile.neighbors.north, tile);
            }
          }
        } else {
          progressSearch(tile, prev)
        }
      }

      function progressSearch(tile, current) {
        let tCost = euclid(tile, current) * tile.cost;
        if (!(open.has(tile) || closed.has(tile))) {
          if (tile !== start) { tile.parent = current; }
          open.add(tile);
          //Round the costs to take care of floating point errors.
          tile.gCost = calcGCost(tile);
          tile.hCost = Math.floor((calcHCost(tile, end) + tieBreak(tile)) * decPlace) / decPlace;
          tile.fCost = calcFCost(tile.gCost, tile.hCost);
        } else if (open.has(tile) && tile.gCost > current.gCost + tCost) {
          if (tile !== start) { tile.parent = current; }
          tile.gCost = calcGCost(tile);
          tile.fCost = calcFCost(tile.gCost, tile.hCost);
        }
      }

      if (mapNodes) {
        //extend past free tiles
        checkFree(neighbor, current);
      } else {
        //For new tiles
        progressSearch(neighbor, current);
      }
    }
    let arr = [...open]
    arr.sort(compareFCost)
    current = arr[0]
    if (open.size > 0) { setTimeout(recursiveLoop, delaySlider.value) } else { cancelPathfinding() }
    recursiveLoop()
  }
}
let generateBtn = document.querySelector(".generate-btn")
generateBtn.addEventListener("click", makePath);
generateMap();

function makePath() {
  generateMap();
  cancelPath = false;
  findPath();
  generateBtn.disabled = true;
}
let clearBtn = document.querySelector(".clear-btn");
let cancelBtn = document.querySelector(".cancel-btn");
let cancelPath = false;
clearBtn.addEventListener("click", clearGrid);
cancelBtn.addEventListener("click", cancelPathfinding);

function cancelPathfinding() {
  generateMap();
  cancelPath = true;
  generateBtn.disabled = false;
}

function clearGrid() {
  cancelPathfinding();
  onScreenCTX.clearRect(0, 0, onScreenCVS.width, onScreenCVS.height);
  offScreenCTX.clearRect(0, 0, offScreenCVS.width, offScreenCVS.height);
  generateMap();
}

function generateNaiveMaze() {
  cancelPathfinding();
  offScreenCTX.fillStyle = "black";
  offScreenCTX.clearRect(0, 0, offScreenCVS.width, offScreenCVS.height);
  let imageData = offScreenCTX.getImageData(0, 0, offScreenCVS.width, offScreenCVS.height);
  let cells = [];
  for (let y = 0; y < imageData.height; y++) {
    if (y % 2 === 1) {
      continue;
    }
    cells[y] = [];
    for (let x = 0; x < imageData.width; x++) {
      if (x % 2 === 1) {
        continue;
      }
      cells[y][x] = { x: x, y: y }
    }
  }

  function drawMaze1() {
    cells.forEach(r => {
      r.forEach(c => {
        offScreenCTX.fillRect(c.x, c.y, 1, 1);
      })
    })
    source = offScreenCVS.toDataURL();
    renderImage();
    window.setTimeout(drawMaze2, delaySlider.value)
  }

  function drawMaze2() {
    cells.forEach(r => {
      r.forEach(c => {
        let rand = [
          [0, 1],
          [0, -1],
          [1, 0],
          [-1, 0]
        ];
        let randC = rand[Math.floor(Math.random() * 4)];
        offScreenCTX.fillRect(c.x + randC[0], c.y + randC[1], 1, 1);
      })
    })
    source = offScreenCVS.toDataURL();
    renderImage();
  }
  drawMaze1();
}

function generateEllerMaze() {
  cancelPathfinding();
  offScreenCTX.fillStyle = "black";
  offScreenCTX.fillRect(0, 0, offScreenCVS.width, offScreenCVS.height);
  let imageData = offScreenCTX.getImageData(0, 0, offScreenCVS.width, offScreenCVS.height);
  let cells = [];
  for (let y = 0; y < imageData.height; y++) {
    if (y % 2 === 0) {
      continue;
    }
    let rowSets = {};
    if (!cells[y]) { cells[y] = [] }
    for (let x = 0; x < imageData.width; x++) {
      if (x % 2 === 0) {
        continue;
      }
      if (!cells[y][x]) {
        let setID = `${y}${x}`;
        let uniqueSet = new Set()
        let cell = { x: x, y: y, set: setID, connections: {} };
        cells[y][x] = cell;
        uniqueSet.add(cell);
        rowSets[setID] = uniqueSet;
      } else {
        //add existing cells to row sets
        let cell = cells[y][x];
        if (rowSets[cell.set]) {
          rowSets[cell.set].add(cell);
        } else {
          let uniqueSet = new Set();
          uniqueSet.add(cell);
          rowSets[cell.set] = uniqueSet;
        }
      }
    }

    function removeWall() { return Math.random() > 0.5; }
    cells[y].forEach(c => {
      let rightCell = cells[y][c.x + 2];
      //if right cell are in different sets, check remove wall
      if (rightCell) {
        if (c.set !== rightCell.set) {
          if (removeWall() || y === imageData.height - 1) {
            //open the right path
            c.connections.right = true;
            let oldSet = rightCell.set;
            //merge right cell's set into left cell's set
            rowSets[oldSet].forEach(rc => {
              rc.set = c.set;
              rowSets[c.set].add(rc);
            })
            delete rowSets[oldSet];
          }
        }
      }
    })
    if (y < imageData.height - 1) {
      Object.entries(rowSets).forEach(kv => {
        let connects = 0;
        let last;
        let thisSet = kv[1];
        let thisSetID = kv[0];
        //if set only has one entry, create a path down
        thisSet.forEach(c => {
          //check removeWall or if this is the last row of the maze
          if (removeWall() || thisSet.size === 1) {
            //open the down path
            c.connections.down = true;
            connects += 1;
            if (!cells[y + 2]) { cells[y + 2] = [] }
            cells[y + 2][c.x] = { x: c.x, y: y + 2, set: thisSetID, connections: {} };
          }
          last = c;
        })
        //make sure at least one connects
        if (connects === 0) {
          //open the down path
          last.connections.down = true;
          if (!cells[y + 2]) { cells[y + 2] = [] }
          cells[y + 2][last.x] = { x: last.x, y: y + 2, set: thisSetID, connections: {} };
        }
      })
    }
  }
  //draw
  let j = 1;

  function recursiveDrawMaze() {
    cells[j].forEach(c => {
      if (c) {
        offScreenCTX.clearRect(c.x, c.y, 1, 1);
        if (c.connections.right) {
          offScreenCTX.clearRect(c.x + 1, c.y, 1, 1);
        }
        if (c.connections.down) {
          offScreenCTX.clearRect(c.x, c.y + 1, 1, 1);
        }
      }
    })
    j += 2;
    source = offScreenCVS.toDataURL();
    renderImage();
    if (j < cells.length) {
      window.setTimeout(recursiveDrawMaze, delaySlider.value)
    }
  }
  recursiveDrawMaze();
}

function generatePrimMaze() {
  cancelPathfinding();
  offScreenCTX.fillStyle = "black";
  offScreenCTX.fillRect(0, 0, offScreenCVS.width, offScreenCVS.height);
  let imageData = offScreenCTX.getImageData(0, 0, offScreenCVS.width, offScreenCVS.height);
  let cells = [];
  let mazeHeight = imageData.height / 2;
  let mazeWidth = imageData.width / 2;
  //Generate grid template
  for (let y = 0; y < mazeHeight; y++) {
    //Step 1: Initialize empty row
    cells[y] = [];
    // mazeWidth = y+1;
    for (let x = 0; x < mazeWidth; x++) {
      //Step 2: create each cell in this row
      let cell = { x: x, y: y, index: [x, y], status: "unvisited", adjacents: [], connections: [] };
      cells[y][x] = cell;
      //add adjacents
      if (cells[y - 1]) {
        if (cells[y - 1][x]) {
          let up = cells[y - 1][x];
          cell.adjacents.push(up);
          up.adjacents.push(cell);
        }
      }
      if (cells[y][x - 1]) {
        let left = cells[y][x - 1];
        cell.adjacents.push(left);
        left.adjacents.push(cell);
      }
    }
  }
  let visited = new Set();
  let frontier = new Set();
  let startY = Math.floor(Math.random() * cells.length);
  let startX = Math.floor(Math.random() * cells[startY].length);
  let start = cells[startY][startX];
  //Initialize starting cell as frontier
  frontier.add(start);
  //Set start as current
  let current = start;
  recursiveSpanningTree();

  function recursiveSpanningTree() {
    //remove current from unvisited and add it to visited
    frontier.delete(current);
    visited.add(current);
    current.status = "visited";
    offScreenCTX.clearRect(current.x * 2, current.y * 2, 1, 1);

    function addToFrontier(adjCells) {
      for (let c of adjCells) {
        if (c.status === "unvisited") {
          frontier.add(c);
          c.status = "frontier";
          //make current cell the frontier cell's connection
          c.connections.push(current);
        } else if (c.status === "frontier") {
          c.connections.push(current);
        }
      }
    }
    addToFrontier(current.adjacents);
    let iteratable = [...frontier.values()];
    iteratable.forEach(c => {
      offScreenCTX.fillStyle = "red";
      offScreenCTX.fillRect(c.x * 2, c.y * 2, 1, 1);
    })
    let randomIndex = Math.floor(Math.random() * iteratable.length);
    let frontierCell = iteratable[randomIndex];
    if (frontierCell) {
      let randomConn = Math.floor(Math.random() * frontierCell.connections.length);
      let connectX = (frontierCell.x + frontierCell.connections[randomConn].x);
      let connectY = (frontierCell.y + frontierCell.connections[randomConn].y);
      offScreenCTX.clearRect(connectX, connectY, 1, 1);
    }
    current = frontierCell;
    source = offScreenCVS.toDataURL();
    renderImage();
    if (frontier.size > 0) {
      window.setTimeout(recursiveSpanningTree, delaySlider.value);
    }
  }
}
let naiveMazeBtn = document.querySelector(".naive-maze-btn");
naiveMazeBtn.addEventListener("click", generateNaiveMaze);
let ellerMazeBtn = document.querySelector(".eller-maze-btn");
ellerMazeBtn.addEventListener("click", generateEllerMaze);
let primMazeBtn = document.querySelector(".prim-maze-btn");
primMazeBtn.addEventListener("click", generatePrimMaze);
let deadendBtn = document.querySelector(".deadend-btn");
deadendBtn.addEventListener("click", getDeadends);

function getDeadends() {
  let imageData = offScreenCTX.getImageData(0, 0, offScreenCVS.width, offScreenCVS.height);
  for (let i = 0; i < imageData.data.length; i += 4) {
    let x = i / 4 % offScreenCVS.width,
      y = (i / 4 - x) / offScreenCVS.width;
    let color = `rgba(${imageData.data[i]}, ${imageData.data[i+1]}, ${imageData.data[i+2]}, ${imageData.data[i+3]})`
    //Clear other pixels of same color
    if (color === "rgba(0, 0, 0, 0)") {
      //check adjacents
      let left = `rgba(${imageData.data[i-4]}, ${imageData.data[i-3]}, ${imageData.data[i-2]}, ${imageData.data[i-1]})`
      let right = `rgba(${imageData.data[i+4]}, ${imageData.data[i+5]}, ${imageData.data[i+6]}, ${imageData.data[i+7]})`
      let up = `rgba(${imageData.data[i-imageData.width*4]}, ${imageData.data[i+1-imageData.width*4]}, ${imageData.data[i+2-imageData.width*4]}, ${imageData.data[i+3-imageData.width*4]})`
      let down = `rgba(${imageData.data[i+imageData.width*4]}, ${imageData.data[i+1+imageData.width*4]}, ${imageData.data[i+2+imageData.width*4]}, ${imageData.data[i+3+imageData.width*4]})`
      let adjs = [];
      adjs.push(left, right, up, down);
      let wallCount = 0;
      for (c of adjs) {
        if (c === "rgba(0, 0, 0, 255)") {
          wallCount += 1;
        } else if (c === "rgba(undefined, undefined, undefined, undefined)") {
          wallCount += 1;
        }
      }
      if (wallCount === 3) {
        offScreenCTX.fillStyle = "red";
        offScreenCTX.fillRect(x, y, 1, 1);
      }
    }
  }
  source = offScreenCVS.toDataURL();
  renderImage();
}
