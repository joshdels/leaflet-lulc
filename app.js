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

function handleStyles(object) {
  var color;
  var fillColor;

  switch(object) {
    case "Built-up":
      color = '#e74c3c';
      fillColor = '#e74c3c';
      break;
    case "Open/Barren":
      color = '#c8cdd1';
      fillColor = '#c8cdd1'
      break;
    case "Inland Water":
      color = '#1a27e7';
      fillColor = '#1a27e7'
      break;
    case "Brush/Shrubs":
      color = '#00ec33';
      fillColor = '#00ec33'
      break;
    case "Grassland":
      color = '#dfa335';
      fillColor = '#dfa335'
      break;
    case "Perennial Crop":
      color = '#fbff00';
      fillColor = '#fbff00'
      break;
    case "Annual Crop":
      color = '#12c42a';
      fillColor = '#12c42a'
      break;
    case "Fishpond":
      color = '#0400fa';
      fillColor = '#0400fa'
      break;
    case "Open Forest":
      color = '#126426';
      fillColor = '#126426'
      break;
    default:
      color = '#808b96';
      fillColor = '#808b96'
      break;
  }

  return {color:color, fillColor:fillColor, fillOpacity: 1}
}

// Data
fetch(
  geoserverUrl +
    "?service=WFS&version=1.0.0&request=GetFeature&typeName=josh:lulc_clipped&outputFormat=application/json"
)
  .then((res) => res.json())
  .then((data) => {
    lulcData = data;
    console.log(data.features),

    lulc = L.geoJSON(data, {
      pane: "lulcPane",
      style: function (feature) {
        return handleStyles(feature.properties.class_name)
      }
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
        color: "black",
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
const barColors =results.map(p => handleStyles(p.class_name).fillColor)

const ctx = document.getElementById('myChart').getContext('2d');
const myChart = new Chart(ctx, {
  type: 'bar',              
  data: {
    labels: labels, 
    datasets: [{
      label: 'Land Use Area',
      data: values,    
      backgroundColor: barColors, 
      borderColor: barColors,
      borderWidth: 1
    }]
  },
  options: { 
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false } 
    }
   }
});

// Update chart dynamically
function updateChart(dataArray, barangay) {
  myChart.data.labels = dataArray.map(p => p.class_name);
  myChart.data.datasets[0].data = dataArray.map(p => p.area_ha);
  myChart.data.datasets[0].backgroundColor = dataArray.map(p => handleStyles(p.class_name).fillColor);
  myChart.data.datasets[0].borderColor = dataArray.map(p => handleStyles(p.class_name).fillColor);    
  myChart.data.datasets[0].label = `${barangay}'s Land Use Area`;
  myChart.update();
}

