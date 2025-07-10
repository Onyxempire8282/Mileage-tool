const ORIGIN = "715 SANDHILL DR, DUDLEY, NC 28333";

let map, directionsService, directionsRenderer, geocoder, homeMarker;

function initServices() {
  console.log("Initializing Maps...");
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();
  geocoder = new google.maps.Geocoder();

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 4,
    center: { lat: 39.8283, lng: -98.5795 },
  });

  directionsRenderer.setMap(map);

  new google.maps.places.Autocomplete(document.getElementById("origin"), {
    types: ["address"],
  });
}

window.onload = initServices;

function calculateDistance() {
  console.log("Calculate Distance clicked!");
  const destination = document.getElementById("destination").value;

  const resultDiv = document.getElementById("billingResult");
  resultDiv.innerHTML = "Calculating...";

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
        const dist = parseFloat(response.rows[0].elements[0].distance.text.replace(/[^0-9.]/g, ""));
        const roundTrip = dist * 2;
        document.getElementById("totalMiles").value = roundTrip.toFixed(2);
        calculateBilling();
      } else {
        alert("Distance error: " + status);
      }
    }
  );
}

function calculateBilling() {
  console.log("Calculate Billing clicked!");
  const firm = document.getElementById("firm").value;
  const miles = parseFloat(document.getElementById("totalMiles").value);
  if (isNaN(miles)) {
    alert("No miles yet!");
    return;
  }
  let freeMiles = 50, rate = 0.6;
  if (firm === "FirmA") { freeMiles = 50; rate = 0.67; }
  const billable = Math.max(0, miles - freeMiles);
  const cost = billable * rate;
  document.getElementById("billingResult").textContent =
    `(${miles} RT - ${freeMiles} Free) = ${billable} mi x $${rate} = $${cost.toFixed(2)}`;
}


function optimizeRoute() {
  console.log("Optimize Route clicked!");
  const origin = document.getElementById("origin").value.trim();
  const stops = Array.from(document.querySelectorAll(".claim-cipher__stop"))
    .map(input => input.value.trim()).filter(Boolean);

  if (!origin || stops.length === 0) {
    alert("Missing stops or origin!");
    return;
  }

  geocoder.geocode({ address: origin }, (results, status) => {
    if (status !== "OK") return alert("Origin error: " + status);
    const loc = results[0].geometry.location;
    map.setCenter(loc);
    if (homeMarker) homeMarker.setMap(null);
    homeMarker = new google.maps.Marker({
      position: loc,
      map,
      icon: "https://maps.google.com/mapfiles/kml/shapes/homegardenbusiness.png",
    });

    const waypoints = stops.map(addr => ({ location: addr, stopover: true }));
    directionsService.route(
      {
        origin, destination: origin, waypoints,
        optimizeWaypoints: true, travelMode: "DRIVING"
      },
      (res, status) => {
        if (status !== "OK") return alert("Route error: " + status);
        directionsRenderer.setDirections(res);

        // --- Show time between each stop ---
        const legs = res.routes[0].legs;
        let html = '<h3>Route Details</h3>';
        html += '<table border="1" style="border-collapse:collapse;"><tr><th>From</th><th>To</th><th>Distance</th><th>Duration</th></tr>';
        for (let i = 0; i < legs.length; i++) {
          html += `<tr><td>${legs[i].start_address}</td><td>${legs[i].end_address}</td><td>${legs[i].distance.text}</td><td>${legs[i].duration.text}</td></tr>`;
        }
        html += '</table>';
        document.getElementById("routeResults").innerHTML = html;

        // --- Add schedule table below ---
        addScheduleTable(stops, origin);
      }
    );
  });
}

// Helper to add a Mon-Fri, 8am-5pm schedule table with dropdowns
function addScheduleTable(stops, origin) {
  // Time slots: 8am to 5pm (10 slots)
  const times = Array.from({length: 10}, (_, i) => `${8 + i}:00`);
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  // Example firm list
  let firms = ["Sedgwick", "FirmB", "FirmC", "Add New..."];

  let table = '<h3>Weekly Schedule</h3>';
  table += '<button id="downloadSchedule">Download Table (CSV)</button>';
  table += '<table border="1" style="border-collapse:collapse;"><tr><th>Time</th>';
  for (const day of days) table += `<th>${day}</th>`;
  table += '</tr>';
  for (const time of times) {
    table += `<tr><td>${time}</td>`;
    for (let d = 0; d < days.length; d++) {
      table += '<td>';
      // Address dropdown
      table += '<select class="schedule-address">';
      table += `<option value="">--Address--</option>`;
      [origin, ...stops].forEach(addr => table += `<option value="${addr}">${addr}</option>`);
      table += '</select><br>';
      // Confirmed dropdown
      table += '<select class="schedule-confirmed"><option value="">Confirmed?</option><option>Yes</option><option>No</option></select><br>';
      // Scheduled dropdown
      table += '<select class="schedule-sched"><option value="">Scheduled?</option><option>Yes</option><option>No</option></select><br>';
      // Firm dropdown
      table += '<select class="schedule-firm">';
      firms.forEach(firm => table += `<option value="${firm}">${firm}</option>`);
      table += '</select>';
      table += '</td>';
    }
    table += '</tr>';
  }
  table += '</table>';
  document.getElementById("routeResults").innerHTML += table;

  // Add download functionality
  document.getElementById("downloadSchedule").onclick = function() {
    let csv = [
      ["Time", ...days.map(d => [d+" Address", d+" Confirmed", d+" Scheduled", d+" Firm"]).flat()].join(",")
    ];
    const rows = document.querySelectorAll("#routeResults table")[1].rows;
    for (let i = 1; i < rows.length; i++) {
      let row = [rows[i].cells[0].textContent];
      for (let j = 1; j < rows[i].cells.length; j++) {
        const selects = rows[i].cells[j].querySelectorAll("select");
        row.push(selects[0]?.value || "", selects[1]?.value || "", selects[2]?.value || "", selects[3]?.value || "");
      }
      csv.push(row.join(","));
    }
    const blob = new Blob([csv.join("\n")], {type: "text/csv"});
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "schedule.csv";
    link.click();
  };
}
