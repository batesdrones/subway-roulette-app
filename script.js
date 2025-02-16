document.addEventListener('DOMContentLoaded', () => {
    const wheel = document.getElementById('wheel');
    const spinButton = document.getElementById('spin-button');
    const output = document.getElementById('output');
    const boroughCheckboxes = document.querySelectorAll('#borough-selection input[type="checkbox"]');
    const mapDiv = document.getElementById('map');
    const allCheckbox = document.getElementById('all');
    let stations = [];
    let map;

    // Function to create train line images
    function createTrainLineImages(routesString) {
        if (!routesString) return '';
        const routes = routesString.split(' ').filter(route => route.length > 0);
        return routes.map(route => {
            const cleanRoute = route.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
            return `<img src="img/${cleanRoute}train.png" alt="${route}" class="train-icon" title="${route}">`;
        }).join('');
    }

    // Load CSV data
    Papa.parse('./data/MTA_Subway_stations.csv', {
        download: true,
        header: true,
        dynamicTyping: true,
        complete: (results) => {
            if (results.data && results.data.length > 0) {
                // Filter out any rows with missing required data
                stations = results.data.filter(station => 
                    station['Stop Name'] && 
                    station['BoroName'] && 
                    station['Line'] &&
                    station['GTFS Latitude'] &&
                    station['GTFS Longitude']
                );
                console.log("CSV data loaded successfully:", stations.length, "stations");
                spinButton.disabled = false;
                spinButton.textContent = "Spin!";
            } else {
                console.error("No valid data found in CSV");
                output.textContent = "Error: No station data available";
                spinButton.disabled = true;
            }
        },
        error: (error) => {
            console.error("Error parsing CSV:", error);
            output.textContent = "Error loading station data. Please try again later.";
            spinButton.disabled = true;
        }
    });

    // Borough selection logic
    allCheckbox.addEventListener('change', () => {
        const isChecked = allCheckbox.checked;
        boroughCheckboxes.forEach(cb => {
            if (cb.id !== 'all') {
                cb.checked = isChecked;
                cb.disabled = isChecked;
            }
        });
    });

    // Individual borough checkbox logic
    boroughCheckboxes.forEach(cb => {
        if (cb.id !== 'all') {
            cb.addEventListener('change', () => {
                const anyUnchecked = Array.from(boroughCheckboxes)
                    .filter(checkbox => checkbox.id !== 'all')
                    .some(checkbox => !checkbox.checked);
                allCheckbox.checked = !anyUnchecked;
            });
        }
    });

    let currentRotation = 0;
    spinButton.addEventListener('click', () => {
        // Get selected boroughs
        const selectedBoroughs = Array.from(boroughCheckboxes)
            .filter(cb => cb.checked && cb.id !== 'all')
            .map(cb => cb.value);

        console.log("Selected boroughs:", selectedBoroughs);

        // Filter stations based on selection
        let filteredStations;
        if (allCheckbox.checked) {
            filteredStations = stations;
        } else {
            filteredStations = stations.filter(station => selectedBoroughs.includes(station.BoroName));
        }

        console.log("Filtered stations count:", filteredStations.length);

        if (filteredStations.length === 0) {
            output.textContent = "No stations found for selected boroughs.";
            return;
        }

        // Select random station
        const randomIndex = Math.floor(Math.random() * filteredStations.length);
        const selectedStation = filteredStations[randomIndex];

        console.log("Selected station:", selectedStation);

        // Reset wheel position
        wheel.style.transition = 'none';
        wheel.style.transform = 'rotate(0deg)';
        void wheel.offsetWidth; // Force reflow

        // Create wheel segments
        wheel.innerHTML = '';
        const segmentAngle = 360 / filteredStations.length;
        
        filteredStations.forEach((station, index) => {
            const segment = document.createElement('div');
            segment.classList.add('segment');
            segment.style.transform = `rotate(${segmentAngle * index}deg)`;
            segment.style.backgroundColor = index % 2 === 0 ? '#FF0000' : '#000000';
            segment.textContent = station['Stop Name'];
            
            if (index === randomIndex) {
                segment.classList.add('selected-segment');
            }
            
            wheel.appendChild(segment);
        });

        // Apply spin animation
        wheel.style.transition = 'transform 3s cubic-bezier(0.25, 0.1, 0.25, 1)';
        const spinRotations = 5; // Number of full rotations
        const finalRotation = (spinRotations * 360) + (360 - (segmentAngle * randomIndex));
        wheel.style.transform = `rotate(${finalRotation}deg)`;

        // Update map
        if (selectedStation['GTFS Latitude'] && selectedStation['GTFS Longitude']) {
            if (!map) {
                map = L.map(mapDiv).setView([selectedStation['GTFS Latitude'], selectedStation['GTFS Longitude']], 13);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(map);
            } else {
                map.setView([selectedStation['GTFS Latitude'], selectedStation['GTFS Longitude']], 13);
                map.eachLayer((layer) => {
                    if (layer instanceof L.Marker) {
                        map.removeLayer(layer);
                    }
                });
            }

            L.marker([selectedStation['GTFS Latitude'], selectedStation['GTFS Longitude']])
                .addTo(map)
                .bindPopup(`
                    <b>${selectedStation['Stop Name']}</b><br>
                    Line: ${selectedStation.Line}<br>
                    Borough: ${selectedStation.BoroName}
                `)
                .openPopup();
        }

        // Update output information
        output.innerHTML = `
            <h2>${selectedStation['Stop Name']}</h2>
            <div class="train-lines">
                ${createTrainLineImages(selectedStation['Daytime Routes'])}
            </div>
            <p>Line: ${selectedStation.Line}</p>
            <p>Borough: ${selectedStation.BoroName}</p>
            <p>ADA Accessible: ${selectedStation.ADA === 1 ? 'Yes' : 'No'}</p>
        `;
    });
});