const ORIGIN = "715 SANDHILL DR, DUDLEY, NC 28333";
// script.js

let map, directionsService, directionsRenderer, geocoder, homeMarker;

// Initialize Maps services & Autocomplete
function initServices() {
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();
  geocoder = new google.maps.Geocoder();

  // Show the whole USA by default
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 4, // Zoomed out to show most of the US
    center: { lat: 39.8283, lng: -98.5795 }, // Geographic center of the contiguous US
  });
  directionsRenderer.setMap(map);

  // Autocomplete for starting address
  new google.maps.places.Autocomplete(document.getElementById("origin"), {
    types: ["address"],
  });
}
window.onload = initServices;

function calculateDistance() {
  const destination = document.getElementById("destination").value;

  const resultDiv = document.getElementById("billingResult");
  resultDiv.innerHTML =
    "<span class='calculator__spinner'></span> Calculating mileage...";

  const service = new google.maps.DistanceMatrixService();
  service.getDistanceMatrix(
    {
      origins: [ORIGIN],
      destinations: [destination],
      travelMode: "DRIVING",
      unitSystem: google.maps.UnitSystem.IMPERIAL,
    },
    (response, status) => {
      if (status === "OK") {
        const distanceText = response.rows[0].elements[0].distance.text;
        const distanceValue = parseFloat(distanceText.replace(/[^0-9.]/g, ""));
        const roundTripMiles = distanceValue * 2; // round trip
        document.getElementById("totalMiles").value = roundTripMiles;

        calculateBilling(); //Automatically trigger billing after miles are retreived")
      } else {
        alert("Error getting distance: " + status);
      }
    }
  );
}

function calculateBilling() {
  const firm = document.getElementById("firm").value;
  const miles = parseFloat(document.getElementById("totalMiles").value);

  if (isNaN(miles)) {
    alert(
      "Please click 'Get Miles' and wait for the distance to load before calculating."
    );
    return;
  }

  let freeMiles = 0;
  let rate = 0;

  if (firm === "FirmA") {
    freeMiles = 50;
    rate = 0.67;
  } else if (firm === "FirmB") {
    freeMiles = 60;
    rate = 0.55;
  } else if (firm === "FirmC") {
    freeMiles = 50;
    rate = 0.63;
  } else if (firm === "FirmD") {
    freeMiles = 50;
    rate = 0.65;
  } else if (firm === "FirmE") {
    freeMiles = 50;
    rate = 0.6;
  } else if (firm === "FirmF") {
    freeMiles = 50;
    rate = 0.65;
  } else if (firm === "FirmG") {
    freeMiles = 60;
    rate = 0.67;
  }

  const billableMiles = Math.max(0, miles - freeMiles);
  const cost = billableMiles * rate;

  const formulaText = `(${miles} (RT) - ${freeMiles} FREE) = ${billableMiles} mi x $${rate.toFixed(
    2
  )} = $${cost.toFixed(2)}`;

  document.getElementById("billingResult").textContent = formulaText;
}

function copyResult() {
  const result = document.getElementById("billingResult").textContent;
  navigator.clipboard.writeText(result).then(() => {
    alert("Result copied to clipboard!");
  });
}

// --- New: Route optimization with home icon & alphabetical listing ---

function optimizeRoute() {
  const origin = document.getElementById("origin").value.trim();
  const stopInputs = document.querySelectorAll(".claim-cipher__stop");
  const stops = Array.from(stopInputs)
    .map((input) => input.value.trim())
    .filter((val) => val.length > 0);

  console.log("Origin:", origin);
  console.log("Stops:", stops);

  if (!origin) {
    alert("Please enter your starting address.");
    return;
  }
  if (stops.length === 0) {
    alert("Please enter at least one stop.");
    return;
  }

  // Initialize map if needed
  if (!map) {
    map = new google.maps.Map(document.getElementById("map"), {
      zoom: 8,
      center: { lat: 35.3336, lng: -77.9946 },
    });
    directionsRenderer.setMap(map);
  }

  // Geocode origin & place house icon
  geocoder.geocode({ address: origin }, (results, status) => {
    if (status !== "OK") return alert("Could not locate origin: " + status);
    const loc = results[0].geometry.location;
    map.setCenter(loc);
    if (homeMarker) homeMarker.setMap(null);
    homeMarker = new google.maps.Marker({
      position: loc,
      map,
      icon: "https://maps.google.com/mapfiles/kml/shapes/homegardenbusiness.png",
    });

    // Build and send directions request
    const waypoints = stops.map((addr) => ({ location: addr, stopover: true }));
    directionsService.route(
      {
        origin,
        destination: origin,
        waypoints,
        optimizeWaypoints: true,
        travelMode: "DRIVING",
      },
      (res, status) => {
        if (status !== "OK") return alert("Directions error: " + status);
        directionsRenderer.setDirections(res);

        // Sum distance & duration
        let totalDist = 0,
          totalDur = 0;
        res.routes[0].legs.forEach((leg) => {
          totalDist += leg.distance.value;
          totalDur += leg.duration.value;
        });
        const miles = (totalDist / 1609.344).toFixed(2);
        const hrs = Math.floor(totalDur / 3600);
        const mins = Math.round((totalDur % 3600) / 60);

        // Optimized order display
        const order = res.routes[0].waypoint_order;
        const legs = res.routes[0].legs;
        let html = "<strong>Optimized Route:</strong><br>";

        // Start address (home)
        html += `A: ${legs[0].start_address} (Home)<br>`;

        // Waypoints in optimized order
        order.forEach((idx, i) => {
          html += `${String.fromCharCode(66 + i)}: ${
            legs[idx + 1].start_address
          }<br>`;
        });

        // End address (home, should match start)
        html += `${String.fromCharCode(66 + order.length)}: ${
          legs[legs.length - 1].end_address
        } (Home)<br><br>`;

        // Totals
        html += `<br><strong>Total Distance:</strong> ${miles} miles<br>`;
        html += `<strong>Estimated Time:</strong> ${hrs} hr ${mins} min`;

        document.getElementById("routeResults").innerHTML = html;
      }
    );
  });
}
