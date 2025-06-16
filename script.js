const ORIGIN = "715 SANDHILL DR, DUDLEY, NC 28333";

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

  let billableMiles = Math.max(0, miles - freeMiles);
  let cost = billableMiles * rate;

  const formulaText = `(${miles} (RT) - ${freeMiles} FREE) x $${rate.toFixed(
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
