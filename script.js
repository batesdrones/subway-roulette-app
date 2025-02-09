document.addEventListener('DOMContentLoaded', () => {
    const wheel = document.getElementById('wheel');
    const spinButton = document.getElementById('spin-button');
    const output = document.getElementById('output');
    const boroughCheckboxes = document.querySelectorAll('#borough-selection input[type="checkbox"]');
    const mapDiv = document.getElementById('map');
    const allCheckbox = document.getElementById('all');
    let stations = [];
    let map;

    Papa.parse('MTA_subway_stations.csv', { // Make sure the path is correct!
        download: true,
        header: true,
        dynamicTyping: true,
        complete: (results) => {
            stations = results.data;
            console.log("CSV data loaded:", stations); // Check if data is loaded correctly!
        },
        error: (error) => {
            console.error("Error parsing CSV:", error);
            alert("Error loading CSV file. Please check the file path and ensure CORS is enabled if fetching from a different domain.");
        }
    });

    allCheckbox.addEventListener('change', () => {
        if (allCheckbox.checked) {
            boroughCheckboxes.forEach(cb => cb.checked = true);
        } else {
            boroughCheckboxes.forEach(cb => cb.checked = false);
        }
    });

    spinButton.addEventListener('click', () => {
        let selectedBoroughs = [];

        if (allCheckbox.checked) {
            selectedBoroughs = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"]; // Make sure these match your CSV!
        } else {
            selectedBoroughs = Array.from(boroughCheckboxes)
                .filter(cb => cb.checked && cb.id !== 'all')
                .map(cb => cb.value);
        }

        console.log("Selected Boroughs:", selectedBoroughs); // Debugging: Check selected boroughs

        const filteredStations = stations.filter(station =>
            selectedBoroughs.includes(station.BoroName) 
        );

        console.log("Filtered Stations:", filteredStations); // Debugging: Check filtered stations

        if (filteredStations.length === 0) {
            output.textContent = "No stations match your criteria.";
            wheel.innerHTML = ''; // Clear wheel segments if no matches
            if (map) map.remove(); // Remove map if no matches to prevent errors
            return;
        }

        const randomIndex = Math.floor(Math.random() * filteredStations.length);
        const selectedStation = filteredStations[randomIndex];

        // Improved Roulette Wheel Animation and Display
        const numSegments = filteredStations.length;
        const rotationAngle = 360 / numSegments * randomIndex + 720;

        wheel.style.transition = 'transform 2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        wheel.style.transform = `rotate(${rotationAngle}deg)`;

        // Create Wheel Segments Dynamically (Corrected)
        wheel.innerHTML = ''; // Clear previous segments

        filteredStations.forEach((station, index) => {
            const segment = document.createElement('div');
            segment.classList.add('segment');
            segment.style.transform = `rotate(${360 / numSegments * index}deg)`;
            segment.style.backgroundColor = index % 2 === 0 ? '#3498db' : '#e74c3c';
            segment.textContent = station['Stop Name']; // Or another property from your CSV

            wheel.appendChild(segment); // Append the segment to the wheel
        });

        // Map Display (Improved)
        if (selectedStation['GTFS Latitude'] && selectedStation['GTFS Longitude']) {
            if (!map) {
                map = L.map(mapDiv).setView([selectedStation['GTFS Latitude'], selectedStation['GTFS Longitude']], 13);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(map);
            } else {
                map.setView([selectedStation['GTFS Latitude'], selectedStation['GTFS Longitude']], 13);
            }

            L.marker([selectedStation['GTFS Latitude'], selectedStation['GTFS Longitude']])
                .addTo(map)
                .bindPopup(`<b>${selectedStation['Stop Name']}</b><br>Line: ${selectedStation.Line}<br>Borough: ${selectedStation.BoroName}`) // Customize popup
                .openPopup();
        } else {
            console.error("No coordinates for station:", selectedStation);
            alert("No coordinates available for this station.");
            if (map) map.remove(); // Remove map to prevent errors
        }

        output.innerHTML = `<h2>${selectedStation['Stop Name']}</h2>
                             <p>Line: ${selectedStation.Line}</p>
                             <p>Borough: ${selectedStation.BoroName}</p>
                             <p>Division: ${selectedStation.Division}</p>
                             <p>Latitude: ${selectedStation['GTFS Latitude']}</p>
                             <p>Longitude: ${selectedStation['GTFS Longitude']}</p>`;

    });
});