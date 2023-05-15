var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var points = [];
canvas.addEventListener("click", function(event) {
  var x = event.pageX - canvas.offsetLeft;
  var y = event.pageY - canvas.offsetTop;
  const  printBlock = document.getElementById("printBlock");
  points.push({x: x, y: y});
  drawPoint(x, y);
});
function drawPoint(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, 2 * Math.PI);
  ctx.fillStyle = "black";
  ctx.fill();
  ctx.closePath();
}
document.getElementById("clusterBtn").addEventListener("click", function() {
  clusterPoints();
});
function clusterPoints() {
  var printBlock = document.getElementById("printBlock").value; // значение переменной
  var clusters = kMeans(points, printBlock);
  for (var i = 0; i < clusters.length; i++) {
    var color = getRandomColor();
    for (var j = 0; j < clusters[i].length; j++) {
      var point = clusters[i][j];
      drawColoredPoint(point.x, point.y, color);
    }
  }
}
function drawColoredPoint(x, y, color) {
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.closePath();
}
function getRandomColor() {
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
function kMeans(points, numClusters) {
  var centroids = chooseInitialCentroids(points, numClusters);
  var clusters = initializeClusters(numClusters);
  var oldCentroids = [];
  while (!centroidsEqual(oldCentroids, centroids)) {
    oldCentroids = deepCopy(centroids);
    assignPointsToClusters(points, clusters, centroids);
    calculateNewCentroids(clusters, centroids);
  }
  return clusters;
}

function chooseInitialCentroids(points, numClusters) {
  var centroids = [];
  for (var i = 0; i < numClusters; i++) {
    var randomIndex = Math.floor(Math.random() * points.length);
    centroids.push(points[randomIndex]);
  }
  return centroids;
}

function initializeClusters(numClusters) {
  var clusters = [];
  for (var i = 0; i < numClusters; i++) {
    clusters.push([]);
  }
  return clusters;
}
function assignPointsToClusters(points, clusters, centroids) {
  for (var i = 0; i < points.length; i++) {
    var point = points[i];
    var closestCentroidIndex = getClosestCentroidIndex(point, centroids);
    clusters[closestCentroidIndex].push(point);
  }
}
function getClosestCentroidIndex(point, centroids) {
  var closestDistance = Infinity;
  var closestIndex = -1;
  for (var i = 0; i < centroids.length; i++) {
    var centroid = centroids[i];
    var distance = getDistance(point, centroid);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = i;
    }
  }
  return closestIndex;
}
function calculateNewCentroids(clusters, centroids) {
  for (var i = 0; i < clusters.length; i++) {
    var cluster = clusters[i];
    if(cluster.length === 0) {
      continue;
    }
    var sumX = 0;
    var sumY = 0;
    for (var j = 0; j < cluster.length; j++) {
      var point = cluster[j];
      sumX += point.x;
      sumY += point.y;
    }
    var meanX = sumX / cluster.length;
    var meanY = sumY / cluster.length;
    centroids[i] = {x: meanX, y: meanY};
  }
}
function centroidsEqual(centroids1, centroids2) {
  if (centroids1.length !== centroids2.length) {
    return false;
  }
  for (var i = 0; i < centroids1.length; i++) {
    var centroid1 = centroids1[i];
    var centroid2 = centroids2[i];
    if (getDistance(centroid1, centroid2) > 0.0001) {
      return false;
    }
  }
  return true;
}
function getDistance(point1, point2) {
  var dx = point1.x - point2.x;
  var dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy);
}
function deepCopy(object) {
  return JSON.parse(JSON.stringify(object));
}
