/* eslint-disable */

// const locations = JSON.parse(document.getElementById('map').dataset.locations);
// // console.log(locations);

export const displayMap = locations => {
  //according to the instructions from the mapbox API? I add JS code here
  mapboxgl.accessToken = 'pk.eyJ1IjoiZGVldmRldnMiLCJhIjoiY2wybGplNTByMWhmcTNqcDl4cGtzNmR2byJ9.2VKhM2F8GGR-bo4omAwe5g';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/deevdevs/cl2lmom6y001y14qxit6k3o1o',
    scrollZoom: false
    // center: [-118.242806, 34.084205],
    // zoom: 8,
    // interactive: false
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    //Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    //Add marker
    new mapboxgl.Marker({
      element: el,
      //bottom of the pin will be attached to the map location
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    //Add popup
    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);
    //Extend map bounds to include this marker
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100
    }
  });
};
