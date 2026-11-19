const mapElement = document.getElementById("map");
const map = L.map(mapElement, { zoomControl: false, scrollWheelZoom: false });
const english = document.documentElement.lang === "en";

L.control.zoom({
  position: "topright",
  zoomInTitle: english ? "Zoom in" : "Приблизить",
  zoomOutTitle: english ? "Zoom out" : "Отдалить",
}).addTo(map);
map.attributionControl.setPrefix(false);

async function loadRoute() {
  const response = await fetch(mapElement.dataset.route);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const route = L.geoJSON(await response.json(), {
    style: ({ properties }) => properties.line,
    pointToLayer({ properties }, latLng) {
      const dot = document.createElement("span");
      dot.style.backgroundColor = properties.color;
      const icon = L.divIcon({
        className: "project-map-marker",
        html: dot,
        iconSize: [24, 24],
      });
      const marker = L.marker(latLng, {
        icon,
        title: properties.name,
        zIndexOffset: properties.description === "0" ? 1000 : 0,
      });
      const popup = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = properties.name;
      popup.append(title);
      if (properties.detail) {
        const detail = document.createElement("p");
        detail.textContent = properties.detail;
        popup.append(detail);
      }
      return marker.bindPopup(popup);
    },
  }).addTo(map);

  const leftPanel = mapElement.dataset.layout === "left";
  const compactLayout = matchMedia("(max-width: 850px)").matches;
  const desktopPadding = leftPanel ? [465, 44] : [24, 232];
  map.fitBounds(route.getBounds(), {
    maxZoom: Number(mapElement.dataset.maxZoom),
    paddingTopLeft: compactLayout ? [22, 30] : desktopPadding,
    paddingBottomRight: [38, 34],
  });

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);
}

loadRoute().catch((error) => {
  const message = document.createElement("p");
  message.className = "project-map-error";
  message.setAttribute("role", "alert");
  message.textContent = english ? "The route could not be loaded." : "Не удалось загрузить маршрут.";
  mapElement.append(message);
  console.error(error);
});
