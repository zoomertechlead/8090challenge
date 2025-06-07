async function fetchDataAndPlot() {
    try {
        const response = await fetch('public_cases.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (!Array.isArray(data)) {
            console.error("Error: JSON data must be a list of objects.");
            document.getElementById('plotContainer').innerText = "Error: JSON data is not in the expected format (must be a list).";
            return;
        }

        // Group data by trip_duration_days
        const dataByDuration = {};
        data.forEach((item, index) => {
            if (item && item.input && typeof item.input === 'object' &&
                'trip_duration_days' in item.input &&
                'miles_traveled' in item.input &&
                'total_receipts_amount' in item.input &&
                'expected_output' in item) {
                
                const duration = item.input.trip_duration_days;
                if (!dataByDuration[duration]) {
                    dataByDuration[duration] = [];
                }
                dataByDuration[duration].push({
                    miles_traveled: item.input.miles_traveled,
                    total_receipts_amount: item.input.total_receipts_amount,
                    expected_output: item.expected_output,
                    trip_duration_days: duration,
                    originalIndex: index
                });
            } else {
                console.warn(`Skipping item at index ${index} due to missing or invalid keys.`);
            }
        });

        if (Object.keys(dataByDuration).length === 0) {
            console.error("Error: No valid data groups found to plot.");
            document.getElementById('plotContainer').innerText = "Error: No valid data groups found to plot.";
            return;
        }

        const traces = [];
        const sortedDurations = Object.keys(dataByDuration).map(Number).sort((a, b) => a - b);

        sortedDurations.forEach((duration, traceIndex) => {
            const groupData = dataByDuration[duration];
            
            const x_miles_traveled = [];
            const y_total_receipts_amount = [];
            const z_expected_output = [];
            const pointLabels = [];

            groupData.forEach(point => {
                x_miles_traveled.push(point.miles_traveled);
                y_total_receipts_amount.push(point.total_receipts_amount);
                z_expected_output.push(point.expected_output);
                pointLabels.push(
                    `Index: ${point.originalIndex}<br>` +
                    `Output: ${point.expected_output.toFixed(2)}<br>` +
                    `Duration (Days): ${point.trip_duration_days}<br>` +
                    `Miles Traveled: ${point.miles_traveled}<br>` +
                    `Receipts Amount: ${point.total_receipts_amount.toFixed(2)}`
                );
            });

            traces.push({
                x: x_miles_traveled,
                y: y_total_receipts_amount,
                z: z_expected_output,
                name: `Duration: ${duration} day(s)`,
                mode: 'markers',
                type: 'scatter3d',
                text: pointLabels,
                hoverinfo: 'text',
                marker: {
                    size: 5,
                    color: z_expected_output, // Color by expected_output (which is also Z-axis)
                    colorscale: 'Viridis',
                    // Only show color scale for the first trace to avoid multiple color bars
                    // Plotly usually handles this well if colorscale and data range are consistent
                    // However, explicitly controlling it can be safer.
                    // For now, let Plotly manage it; if multiple bars appear, we can set showscale: false for subsequent traces.
                }
            });
        });

        const layout = {
            title: '3D Visualization: Output vs. Miles vs. Receipts (Grouped by Trip Duration)',
            margin: { l: 0, r: 0, b: 0, t: 60 }, // Increased top margin for longer title
            scene: {
                xaxis: { title: 'Miles Traveled' },
                yaxis: { title: 'Total Receipts Amount ($)' },
                zaxis: { title: 'Expected Output' }
            },
            legend: {
                title: {
                    text: 'Trip Duration'
                },
                // Adjust legend position if it overlaps with the plot
                // x: 1.1, 
                // y: 1
            }
        };

        Plotly.newPlot('plotContainer', traces, layout);

    } catch (error) {
        console.error('Failed to fetch or plot data:', error);
        document.getElementById('plotContainer').innerText = `Failed to load visualization: ${error.message}. Check the console for more details.`;
    }
}

fetchDataAndPlot();
