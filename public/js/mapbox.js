/**
 * displays the map according to the specified coordinates (отображает карту в соответствии с введенными координатами)
 * @param {geolocation coordinates}
 * @returns {undefined}
 * @author Dmitriy Vnuchkov (original idea by Jonas Shmedtmann)
 */
export const displayMap = locations => {
  mapboxgl.accessToken = 'pk.eyJ1IjoiZGVldmRldnMiLCJhIjoiY2wybGplNTByMWhmcTNqcDl4cGtzNmR2byJ9.2VKhM2F8GGR-bo4omAwe5g';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/deevdevs/cl2lmom6y001y14qxit6k3o1o',
    scrollZoom: false
  });
  const bounds = new mapboxgl.LngLatBounds();
  locations.forEach(loc => {
    // create marker (создает маркер на карте)
    const el = document.createElement('div');
    el.className = 'marker';
    // add marker (добавляет маркер на карту)
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates)
      .addTo(map);
    // add popup (добавляет сообщение над маркером)
    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);
    // extend map bounds to include this marker (делает так, что все маркеры отображаются на карте в поле видения)
    bounds.extend(loc.coordinates);
  });
  // moves the map to make it visible in accordance with css rules (делает карту видимой в соответствии с правилами в CSS)
  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100
    }
  });
};
