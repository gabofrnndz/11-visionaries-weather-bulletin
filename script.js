function updateBulletin() {

    document.getElementById("displayLocation").textContent =
        document.getElementById("location").value;

    document.getElementById("displayNumber").textContent =
        document.getElementById("bulletinNumber").value;

    document.getElementById("displaySynopsis").textContent =
        document.getElementById("synopsis").value;

    document.getElementById("displayForecast").textContent =
        document.getElementById("forecast").value;

    document.getElementById("displayHeatIndex").textContent =
        document.getElementById("heatIndex").value;

    document.getElementById("displayWarnings").textContent =
        document.getElementById("warnings").value;

    const date = document.getElementById("date").value;

    if (date) {
        document.getElementById("displayDate").textContent = date;
    }
}


async function exportPNG() {

    updateBulletin();

    const bulletin = document.getElementById("bulletin");

    const canvas = await html2canvas(bulletin, {
        scale: 2,
        backgroundColor: "#ffffff"
    });

    const link = document.createElement("a");

    link.download = "11-VISIONARIES-Weather-Bulletin.png";

    link.href = canvas.toDataURL("image/png");

    link.click();
}