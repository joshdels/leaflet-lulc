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
  const color = {
    'Built-up': '#e74c3c',
    "Open/Barren": '#c8cdd1',
    "Inland Water": '#1a27e7',
    "Brush/Shrubs": '#2fec00ff',
    "Grassland": '#dfa335',
    "Perennial Crop": '#fbff00ff',
    "Annual Crop": '#acd128ff',
    "Fishpond": '#0400fa',
    "Open Forest": '#126426'
  }

  const fill = color[object] || '#808b96'
  return {color:fill, fillColor:fill, fillOpacity: 1}
}

// Data
fetch(
  geoserverUrl +
    "?service=WFS&version=1.0.0&request=GetFeature&typeName=josh:lulc_clipped&outputFormat=application/json"
)
  .then((res) => res.json())
  .then((data) => {
    lulcData = data;

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
    let selectedLayer = null;
    boundary = L.geoJSON(data, {
      pane: "boundaryPane",
      style: {
        color: "black",
        weight: 2,
        fillOpacity: 0,
      },
      onEachFeature: function (feature, layer) {

        layer.on("click", function () {
          if (selectedLayer && selectedLayer !== layer ) {
            selectedLayer.setStyle({
              fillColor: null,
              fillOpacity: 0,
              color: 'black',
              weight: 2,
            });
          }
          layer.setStyle({
            color: 'blue',
            weight: 4,
            fillColor: 'blue',
            fillOpacity: 0.2,
          });
          selectedLayer = layer;

          map.fitBounds(layer.getBounds(), {padding: [30, 30] })

          //Filter queries
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
      legend: { display: false } ,
      title: {
        display: true,
        text: 'Tagum City',
        font: { size: 17}
      }
    }
   }
});

// Update chart dynamically
function updateChart(dataArray, barangay) {
  myChart.data.labels = dataArray.map(p => p.class_name);
  myChart.data.datasets[0].data = dataArray.map(p => p.area_ha);
  myChart.data.datasets[0].backgroundColor = dataArray.map(p => handleStyles(p.class_name).fillColor);
  myChart.data.datasets[0].borderColor = dataArray.map(p => handleStyles(p.class_name).fillColor);    
  myChart.data.datasets[0].label = `Area`;

  myChart.options.plugins.title.text = `Brgy. ${barangay}`;
  myChart.update();
}

