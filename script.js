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
            // Clean the route name to match image filename
            const cleanRoute = route.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
            return `<img src="img/${cleanRoute}train.png" alt="${route}" class="train-icon" title="${route}">`;
        }).join('');
    }

    // Modified CSV loading to use fetch API
    fetch('MTA_Subway_stations.csv')
        .then(response => response.text())
        .then(csvData => {
            Papa.parse(csvData, {
                header: true,
                dynamicTyping: true,
                complete: (results) => {
                    stations = results.data;
                    console.log("CSV data loaded:", stations);
                },
                error: (error) => {
                    console.error("Error parsing CSV:", error);
                    output.textContent = "Error loading station data. Please try again later.";
                }
            });
        })
        .catch(error => {
            console.error("Error fetching CSV:", error);
            output.textContent = "Error loading station data. Please try again later.";
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

    // Function to create wheel segments
    function createWheelSegments(stations, selectedStation) {
        wheel.innerHTML = '';
        const segmentColors = ['#FF0000', '#000000']; // Traditional roulette colors
        const selectedIndex = stations.findIndex(station => 
            station['Stop Name'] === selectedStation['Stop Name'] &&
            station['Line'] === selectedStation['Line']
        );
        
        console.log("Selected station:", selectedStation['Stop Name']);
        console.log("Selected index:", selectedIndex);
        
        stations.forEach((station, index) => {
            const segment = document.createElement('div');
            segment.classList.add('segment');
            
            // Calculate angle for this segment
            const segmentAngle = (360 / stations.length) * index;
            segment.style.transform = `rotate(${segmentAngle}deg)`;
            
            // Set background color
            segment.style.backgroundColor = segmentColors[index % 2];
            segment.textContent = station['Stop Name'];
            
            // Highlight selected station
            if (index === selectedIndex) {
                segment.classList.add('selected-segment');
                console.log("Highlighting segment:", station['Stop Name']);
            }
            
            wheel.appendChild(segment);
        });
        
        return selectedIndex;
    }

    spinButton.addEventListener('click', () => {
        const selectedBoroughs = Array.from(boroughCheckboxes)
            .filter(cb => cb.checked && cb.id !== 'all')
            .map(cb => cb.value);

        if (selectedBoroughs.length === 0 && !allCheckbox.checked) {
            output.textContent = "Please select at least one borough.";
            return;
        }

        const filteredStations = allCheckbox.checked 
            ? stations 
            : stations.filter(station => selectedBoroughs.includes(station.BoroName));

        if (filteredStations.length === 0) {
            output.textContent = "No stations found for selected boroughs.";
            return;
        }

        // First reset the wheel
        wheel.style.transition = 'none';
        wheel.style.transform = 'rotate(0deg)';
        
        // Select random station
        const randomIndex = Math.floor(Math.random() * filteredStations.length);
        const selectedStation = filteredStations[randomIndex];
        
        // Create wheel segments
        wheel.innerHTML = '';
        const segmentAngle = 360 / filteredStations.length;
        
        filteredStations.forEach((station, index) => {
            const segment = document.createElement('div');
            segment.classList.add('segment');
            
            // Calculate angle for this segment
            const rotation = segmentAngle * index;
            segment.style.transform = `rotate(${rotation}deg)`;
            
            // Set background color
            segment.style.backgroundColor = index % 2 === 0 ? '#FF0000' : '#000000';
            segment.textContent = station['Stop Name'];
            
            // Highlight selected station
            if (station['Stop Name'] === selectedStation['Stop Name']) {
                segment.classList.add('selected-segment');
                console.log("Found selected station:", station['Stop Name']);
            }
            
            wheel.appendChild(segment);
        });

        // Force a reflow before starting the animation
        void wheel.offsetWidth;
        
        // Calculate final rotation
        const spinRotations = 5; // Number of full spins
        const finalRotation = (spinRotations * 360) + (360 - (segmentAngle * randomIndex));
        
        // Apply spin animation
        wheel.style.transition = 'transform 3s cubic-bezier(0.25, 0.1, 0.25, 1)';
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

        // Update output information with train line images
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
