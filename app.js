var map = L.map('map');

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

// var marker = L.marker([51.5, -0.09]).addTo(map);

// map.fitBounds(L.featureGroup([marker]).getBounds(), {
//   maxZoom: 8,
// });


// Geoservered Files
// var geoserverUrl = 'http://ows.mundialis.de/services/service?';
// var layerName = "TOPO-WMS";

// // 2. Add the WMS layer
// var wmsLayer = L.tileLayer.wms(geoserverUrl, {
//   layers: layerName,
//   format: "image/png",
//   transparent: true,
//   attribution: "Mundialis WMS"
// }).addTo(map);

/////// Spatial Analysis
// Example point (Manila City Hall)
var point = turf.point([120.9842, 14.5995]);

// Buffer the point (1 km)
var buffered = turf.buffer(point, 2, { units: 'kilometers' });

// Convert GeoJSON to Leaflet layers
var pointLayer = L.geoJSON(point).addTo(map);
var bufferLayer = L.geoJSON(buffered, {
  style: { color: 'red', fillOpacity: 0.2 }
}).addTo(map);

// Zoom to the buffer
// map.fitBounds(bufferLayer.getBounds());


///////
// // Turf distance
// var p1 = turf.point([120.9842, 14.5995]);
// var p2 = turf.point([121.0437, 14.6760]);

// var distance = turf.distance(p1, p2, { units: 'kilometers' });
// console.log("Distance:", distance, "km");

// //////
// // polygons
var poly1 = turf.polygon([
  [
    [-122.801742, 45.48565],
    [-122.801742, 45.60491],
    [-122.584762, 45.60491],
    [-122.584762, 45.48565],
    [-122.801742, 45.48565],
  ],
]);

var poly2 = turf.polygon([
  [
    [-122.520217, 45.535693],
    [-122.64038, 45.553967],
    [-122.720031, 45.526554],
    [-122.669906, 45.507309],
    [-122.723464, 45.446643],
    [-122.532577, 45.408574],
    [-122.487258, 45.477466],
    [-122.520217, 45.535693],
  ],
]);

var intersection = turf.intersect(turf.featureCollection([poly1, poly2]));

var polygons = L.geoJSON([poly1, poly2], { style: { color:'blue' }}).addTo(map);
map.fitBounds(polygons.getBounds());
if (intersection) {
  var intersectionLayer = L.geoJSON(intersection, { style: { color: 'green' }}).addTo(map);
} else {
  console.log("No intersect found");
}