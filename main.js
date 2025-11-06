/* GEOG 464 – Lab 7 Web Atlas (template-aligned) */

let myMap = null;
let currentDataLayer = null;

// Canonical raw URLs (reliable on GitHub Pages)
const STATIONS_URL   = "https://raw.githubusercontent.com/brubcam/GEOG-464_Lab-7/main/DATA/train-stations.geojson";
const MEGACITIES_URL = "https://raw.githubusercontent.com/brubcam/GEOG-464_Lab-7/main/DATA/megacities.geojson";

// Optional visible error banner (to debug on Pages)
function showError(msg){
  const el = document.createElement('div');
  el.style.cssText = "position:fixed;top:0;left:0;right:0;padding:.6rem 1rem;background:#b00020;color:white;font:14px/1.4 system-ui;z-index:9999";
  el.textContent = "Data load error: " + msg;
  document.body.appendChild(el);
}

// Fetch + add layer
function fetchData(url){
  return fetch(url, { mode: "cors", cache: "no-store" })
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
      return r.json();
    })
    .then(json => {
      if (currentDataLayer) currentDataLayer.remove();
      currentDataLayer = L.geoJSON(json, {
        style: styleAll,
        pointToLayer: generateCircles,
        onEachFeature: addPopups
      }).addTo(myMap);
    })
    .catch(err => {
      console.error("fetchData error:", err);
      showError(err.message);
    });
}

// Symbol: convert to circle markers
function generateCircles(feature, latlng){ return L.circleMarker(latlng); }

// Symbol styling + Q3 cyan for postal present
function styleAll(feature, latlng){
  const styles = {
    stroke: true, color: '#000', opacity: 1, weight: 1,
    fillColor: '#fff', fillOpacity: 0.5, radius: 9
  };

  if (feature.geometry && feature.geometry.type === "Point"){
    styles.stroke = true;
  }

  const props = feature.properties || {};
  const hasPostal = Object.keys(props).some(k => /postal/i.test(k) && props[k]);
  if (hasPostal) styles.fillColor = "cyan";

  const pop = Number(props.population);
  if (!Number.isNaN(pop)) styles.radius = Math.max(6, Math.min(22, Math.sqrt(pop)/300));

  return styles;
}

// Popups
function addPopups(feature, layer){
  const props = feature.properties || {};
  const nameKey = Object.keys(props).find(k => /name|station/i.test(k));
  const title = nameKey ? props[nameKey] : "Feature";
  const list = Object.entries(props)
    .map(([k,v]) => `<dt>${k}</dt><dd>${v}</dd>`)
    .join("");
  layer.bindPopup(`<strong>${title}</strong><br/><dl class="props">${list}</dl>`, { maxWidth: 300 });
}

// Loader (IMPORTANT: target 'mapdiv' per template)
function loadMap(mapid){
  try { if (myMap) myMap.remove(); }
  catch(e){ console.log("no map to delete"); }
  finally {
    const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { maxZoom:19, attribution:"&copy; OpenStreetMap" });
    const cartoLight = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      { maxZoom:20, attribution:"&copy; OpenStreetMap & CARTO" });

    // TEMPLATE ID:
    myMap = L.map("mapdiv", { center:[20,0], zoom:2, layers:[cartoLight] });
    L.control.layers({ "CARTO Light": cartoLight, "OpenStreetMap": osm }, {}).addTo(myMap);

    if (mapid === "mapa"){
      myMap.setView([45.5, -73.6], 10);
      fetchData(STATIONS_URL);
    } else if (mapid === "mapb"){
      myMap.setView([20, 0], 2);
      fetchData(MEGACITIES_URL);
    }

    // Ensure Leaflet recalculates size after render
    setTimeout(() => myMap.invalidateSize(), 0);
  }
}

// Q7: add the dropdown listener with JS; auto-load Map A
document.addEventListener("DOMContentLoaded", () => {
  const sel = document.getElementById("mapdropdown");
  if (!sel) return;

  sel.addEventListener("change", e => {
    const val = e.target.value;
    if (val !== "map0") loadMap(val);
  });

  // Auto-load Map A (also set dropdown value)
  sel.value = "mapa";
  loadMap("mapa");
});
