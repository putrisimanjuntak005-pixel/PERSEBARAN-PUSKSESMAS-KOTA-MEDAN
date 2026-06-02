// Inisialisasi peta
var map = L.map("map", {
  center: [3.598037, 98.670278], // Lokasi Kota Medan
  zoom: 12,
});

// === Basemap ===
var osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap",
}).addTo(map);

var esriSat = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    attribution: "Tiles © Esri",
  });

var cartoLight = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
  attribution: "&copy; CartoDB",
  subdomains: "abcd",
  maxZoom: 19,
});

var topoMap = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
  maxZoom: 17,
  attribution: "© OpenTopoMap",
});

// Custom Icon (opsional)
var puskesmasIcon = L.icon({
  iconUrl: 'aset/puskesmas_marker.png', // opsional
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

var baseMaps = {
  "Open Street Map": osm,
  "Esri World Imagery": esriSat,
  "CartoDB Light": cartoLight,
  "Open Topo Map": topoMap,
};

L.control.layers(baseMaps).addTo(map);

// === Geocoder (Search Box) ===
L.Control.geocoder({
  defaultMarkGeocode: true,
  placeholder: "Cari lokasi...",
  position: "topleft",
}).addTo(map);

// === Scale Bar ===
L.control.scale({ position: "bottomleft", imperial: false }).addTo(map);

// === Geolocation ===
map.locate({ setView: true, maxZoom: 14 });

function onLocationFound(e) {
  L.marker(e.latlng).addTo(map)
    .bindPopup("Lokasi Anda").openPopup();
}

map.on('locationfound', onLocationFound);

// Load data GeoJSON
fetch('puskesmas.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      pointToLayer: function (feature, latlng) {
        return L.marker(latlng, { icon: puskesmasIcon });
      },
      onEachFeature: function (feature, layer) {
        const props = feature.properties;
        const popupContent = `
          <b><strong>${props.Nama}</strong></b><br/>
          <b>Kode Alamat:</b> ${props.Alamat}<br/>
          <b>Tahun Berdiri:</b> ${props.Tahun_Berdiri}<br/>
          <b>Wilayah:</b> ${props.Wilayah}<br/>
          <b>Rawat inap/non:</b> ${props["Rawat_inap/non"]}<br/>
          <b>Latitude:</b> ${feature.geometry.coordinates[1]}<br/>
          <b>Longitude:</b> ${feature.geometry.coordinates[0]}<br/>
          <b>Google Maps:</b> <a href="${props.Link_Gmaps}" target="_blank">Lihat di Google Maps</a>
        `;
        layer.bindPopup(popupContent);
      }
    }).addTo(map);
  })
  .catch(err => console.error("Gagal memuat GeoJSON:", err));

// Style umum untuk garis dan polygon
const styleBatasKec = { color: '#ffd47f', weight: 1.5, dashArray: '3' };
const styleBatasKabLine = { color: '#000000', weight: 2, dashArray: '5' };
const styleSungai = { color: '#3399FF', weight: 0.1 };

// Fungsi untuk menentukan warna berdasarkan nama kecamatan
function getColorByKecamatan(name) {
  const colors = {
    'MEDAN BARAT': '#62d266',
    'MEDAN TIMUR': '#e7eb77',
    'MEDANAMPLAS': '#34dce2',
    'MEDANAREA': '#524fdd',
    'MEDANBARU': '#6d536c',
    'MEDANBELAWAN': 'hsl(32, 83%, 42%)',
    'MEDANDELI': '#ec3d3d',
    'MEDANDENAI': '#dc59d8',
    'MEDANHELVETIA': 'rgb(140, 139, 194)',
    'MEDANJOHOR': 'rgb(50, 49, 92)',
    'MEDANKOTA': 'rgb(255, 0, 0)',
    'MEDANLABUHAN': 'rgb(0, 255, 0)',
    'MEDANMAIMUN': 'rgb(12, 15, 12)',
    'MEDANMARELAN':'rgb(0, 0, 255)',
    'MEDANPERJUANGAN':'hsl(240, 7%, 67%)',
    'MEDANPETISAH': 'rgb(255, 255, 0)',
    'MEDANPOLONIA':'hsl(60, 95%, 8%)',
    'MEDANSELAYANG':'#696939',
    'MEDANSUNGGAL':'rgb(143, 143, 130)',
    'MEDANTEMBUNG':'rgb(29, 29, 26)',
    'MEDANTUNTUNGAN':'hsl(78, 72%, 43%)',
    


  };
  return colors[name] || '#999999'; // Warna default jika tidak ada kecocokan
}

// Style jalan berdasarkan klasifikasi "highway"
function styleJalan(feature) {
  const klasifikasi = feature.properties.highway;

  switch (klasifikasi) {
    case 'trunk':
      return { color: '#f7801e', weight: 2 }; // merah untuk jalan utama
    case 'secondary':
      return { color: '#c6e20d', weight: 1.5 }; // oranye untuk jalan sekunder
    case 'tertiary':
      return { color: '#cf48bd', weight: 1 }; // kuning untuk jalan tersier
    default:
      return { color: '#e2e8e9', weight: 0.2 }; // abu-abu untuk jalan lainnya
  }
}

// Batas Kecamatan (Polygon)
fetch('data/bataskecamatan_medan.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, { 
      style: function(feature) {
        return {
          fillColor: getColorByKecamatan(feature.properties.NAMOBJ),
          fillOpacity: 1,
          color: 'transparent',
          weight: 1            
        };
      },
      onEachFeature: function (feature, layer) {
        const namaKecamatan = feature.properties.NAMOBJ;

        // Tambahkan popup jika dibutuhkan
        layer.bindPopup(`<strong>Kecamatan ${namaKecamatan}</strong>`);

        // Tambahkan label di tengah polygon
        const center = layer.getBounds().getCenter();
        const label = L.marker(center, {
          icon: L.divIcon({
            className: 'label-kecamatan',
            html: `<b>${namaKecamatan}</b>`,
            iconSize: [100, 20]
          })
        });
        label.addTo(map);
      }
    }).addTo(map);
  })
  .catch(err => console.error("Gagal memuat GeoJSON:", err));

// Batas Kecamatan (Line
fetch('data/bataskecamatan_medan.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, { style: styleBatasKec }).addTo(map);
  });

// Batas Kabupaten (Line)
fetch('data/batas_kabupaten_line.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, { style: styleBatasKabLine }).addTo(map);
  });

  // Jalan
fetch('data/jalan.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, { style: styleJalan }).addTo(map);
  });

// Sungai
fetch('data/sungai.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, { style: styleSungai }).addTo(map);
  });

// ================= LEGENDA =================
var legend = L.control({ position: "bottomright" });

legend.onAdd = function () {
  var div = L.DomUtil.create("div", "legend");

  div.innerHTML = `
    <b>Legenda</b><br>
    🏥 Puskesmas<br>
    <span style="color:#f7801e">━━</span> Jalan Utama<br>
    <span style="color:#c6e20d">━━</span> Jalan Sekunder<br>
    <span style="color:#cf48bd">━━</span> Jalan Tersier<br>
    <span style="color:#3399FF">━━</span> Sungai
  `;

  return div;
};

legend.addTo(map);