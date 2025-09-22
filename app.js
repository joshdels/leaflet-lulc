var map = L.map("map", {
  attributionControl: false,
  zoomControl: false,
});

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 22,
}).addTo(map);

L.control
  .zoom({
    position: "topright",
  })
  .addTo(map);

// Responsiveness
map.createPane("lulcPane");
map.getPane("lulcPane").style.zIndex = 200;

map.createPane("boundaryPane");
map.getPane("boundaryPane").style.zIndex = 300;

// Geoservered Files
var boundary = null;
var lulc = null;
var lulcData = null;
var results = [];

var geoserverUrl = "http://localhost:8080/geoserver/josh/wfs";

// STEP 1: load lulc first
fetch(
  geoserverUrl +
    "?service=WFS&version=1.0.0&request=GetFeature&typeName=josh:lulc_clipped&outputFormat=application/json"
)
  .then((res) => res.json())
  .then((data) => {
    lulcData = data;
    lulc = L.geoJSON(data, {
      pane: "lulcPane",
      style: { color: "red", weight: 0.5 },
    }).addTo(map);


    return fetch(
      geoserverUrl +
        "?service=WFS&version=1.0.0&request=GetFeature&typeName=josh:tagum_adm4&outputFormat=application/json"
    );
  })
  .then((res) => res.json())
  .then((data) => {
    boundary = L.geoJSON(data, {
      pane: "boundaryPane",
      style: {
        color: "blue",
        weight: 2,
        fillOpacity: 0,
      },
      onEachFeature: function (feature, layer) {
        layer.on("click", function () {
          let barangay = feature.properties.adm4_en;
          let filtered = handleFilterLulc(barangay);
          updateChart(filtered, barangay);
        });
      },
    }).addTo(map);

    map.fitBounds(boundary.getBounds());
  });

// Filter queries
function handleFilterLulc(boundary) {
  results = [];
  lulcData.features.forEach((feature, i) => {
    let prop = feature.properties;
    if (boundary === prop.adm4_en) {
      results.push(prop);
    } 
  });
  return results;
}


///// Chart

const labels = results.map(p => p.class_name);
const values = results.map(p => p.area_ha);

const ctx = document.getElementById('myChart').getContext('2d');
const myChart = new Chart(ctx, {
  type: 'bar',              
  data: {
    labels: labels, 
    datasets: [{
      label: 'Land Use Area',
      data: values,    
      backgroundColor: 'rgba(0,0,0,0.1)', 
      borderColor: 'rgba(0,0,0,0.8)',
      borderWidth: 1
    }]
  },
  options: { 
    responsive: true,
    maintainAspectRatio: false,
   }
});

// Update chart dynamically
function updateChart(dataArray, barangay) {
  myChart.data.labels = dataArray.map(p => p.class_name);
  myChart.data.datasets[0].data = dataArray.map(p => p.area_ha);
  myChart.data.datasets[0].label = `${barangay}'s Land Use Area`;
  myChart.update();
}

