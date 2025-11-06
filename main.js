/* GEOG 464 – Lab 7 Web Atlas (root paths) */
let myMap = null;
let currentDataLayer = null;

const STATIONS_URL   = "https://raw.githubusercontent.com/brubcam/GEOG-464_Lab-7/main/DATA/train-stations.geojson";
const MEGACITIES_URL = "https://raw.githubusercontent.com/brubcam/GEOG-464_Lab-7/main/DATA/megacities.geojson";

function showError(msg){
  const el = document.createElement('div');
  el.style.cssText = "position:fixed;top:0;left:0;right:0;padding:.6rem 1rem;background:#b00020;color:white;font:14px/1.4 system-ui;z-index:9999";
  el.textContent = "Data load error: " + msg;
  document.body.appendChild(el);
}

function fetchData(url){
  return fetch(url, { mode: "cors", cache: "no-store" })
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`); return r.json(); })
    .then(json => {
      if (currentDataLayer) currentDataLayer.remove();
      currentDataLayer = L.geoJSON(json, {
        style: styleAll,
        pointToLayer: (f, ll) => L.circleMarker(ll),
        onEachFeature: addPopups
      }).addTo(myMap);
    })
    .catch(err => { console.error("fetchData error:", err); showError(err.message); });
}

function styleAll(feature){
  const props = feature.properties || {};
  const styles = { stroke:true, color:'#000', opacity:1, weight:1, fillColor:'#fff', fillOpacity:0.5, radius:9 };
  const hasPostal = Object.keys(props).some(k => /postal/i.test(k) && props[k]);
  if (hasPostal) styles.fillColor = "cyan";
  const pop = Number(props.population);
  if (!Number.isNaN(pop)) styles.radius = Math.max(6, Math.min(22, Math.sqrt(pop)/300));
  return styles;
}

function addPopups(feature, layer){
  const props = feature.properties || {};
  const nameKey = Object.keys(props).find(k => /name|station/i.test(k));
  const title = nameKey ? props[nameKey] : "Feature";
  const list = Object.entries(props).map(([k,v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
  layer.bindPopup(`<strong>${title}</strong><br/><dl class="props">${list}</dl>`, { maxWidth: 300 });
}

function loadMap(mapid){
  try{ if (myMap) myMap.remove(); } catch(e){}
  finally{
    const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { maxZoom:19, attribution:"&copy; OpenStreetMap" });

    myMap = L.map("mapdiv", { center:[20,0], zoom:2, layers:[osm] });

    if (mapid === "mapa"){ myMap.setView([45.5,-73.6],10); fetchData(STATIONS_URL); }
    else if (mapid === "mapb"){ myMap.setView([20,0],2); fetchData(MEGACITIES_URL); }

    setTimeout(() => myMap.invalidateSize(), 0);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const sel = document.getElementById("mapdropdown");
  if (!sel) return;
  sel.addEventListener("change", e => {
    const val = e.target.value;
    if (val !== "map0") loadMap(val);
  });
  sel.value = "mapa";
  loadMap("mapa");
});
