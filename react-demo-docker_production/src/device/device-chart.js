import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import SockJS from 'sockjs-client';
import { Stomp } from 'stompjs';


Chart.register(...registerables);

const DeviceChart = (props) => {
    const [measurements, setMeasurements] = useState([]);
    const [date, setDate] = useState(null);
    const [hourlyDifferences, setHourlyDifferences] = useState([]);
    const deviceUuid = window.location.href.split('/')[window.location.href.split('/').length - 1];
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null); // Reference for the chart instance
    const [stompClient, setStompClient] = useState(null);


    useEffect(() => {
        if (date) {
            getNewMeasurements();
        }
    }, [date]);

    useEffect(() => {
        updateHourlyDifferences();
    }, [measurements]);

    useEffect(() => {
        console.log("measurements");
        console.log(measurements);
    }, [measurements]);

    const getNewMeasurements = () => {
      const dateObj = new Date(date);
      const formattedDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
  
      const socket = new SockJS("http://localhost:8082/measurements");
      const client = Stomp.over(socket);
  
      client.connect({}, () => {
          client.subscribe("/topic/measurements", (message) => {
              const receivedMessage = JSON.parse(message.body);
              setMeasurements(receivedMessage);
              updateHourlyDifferences();
          });
  
          // Trimiterea unui mesaj la server pentru a solicita măsurători
          client.send("/app/sendMeasurement", {}, JSON.stringify({
              deviceUuid: deviceUuid,
              date: formattedDate
          }));
      });
  
      setStompClient(client);
  };
  

      //   console.log(formattedDate);
      //  // fetch(`http://localhost:8082/measurements-by-day/${deviceUuid}/${formattedDate}`, {
      //       method: 'GET'
      //   })
      //   .then(res => res.json())
      //   .then(data => {
      //       setMeasurements(data);
      //       updateHourlyDifferences();
      //   })
      //   .catch(err => console.log(err));
    //};
  
    const updateHourlyDifferences = () => {
        const hourlyDiff = {};

        for (let i = 0; i < 24; i++) {
          hourlyDiff[i] = [];
        }

        measurements.forEach((measurement) => {
          const timestamp = new Date(measurement.timestamp);
          const hour = timestamp.getHours();
    
          hourlyDiff[hour].push(measurement.value);
        });

        const hourlyDifferencesData = [];

        for (let i = 0; i < 24; i++) {
          const values = hourlyDiff[i];
          if (values.length >= 2) {
            const hourlyDiffValue = values[values.length - 1] - values[0];
            hourlyDifferencesData.push(hourlyDiffValue);
          } else {
            hourlyDifferencesData.push(0);
          }
        }

        const chartData = {
          labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
          datasets: [{
              label: 'Hourly Differences',
              data: hourlyDifferencesData,
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
          }],
        };

        setHourlyDifferences(chartData);
    };
  
    useEffect(() => {
      // Clean up the previous chart before drawing a new one
      if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy();
      }

      if (chartRef.current && hourlyDifferences.labels && hourlyDifferences.datasets) {
        const newChartInstance = new Chart(chartRef.current, {
          type: 'bar',
          data: hourlyDifferences,
          options: {
            responsive: true,
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Hour',
                },
              },
              y: {
                title: {
                  display: true,
                  text: 'Hourly Differences',
                },
              },
            },
          },
        });

        chartInstanceRef.current = newChartInstance; // Update the ref with the new chart instance
      }
    }, [hourlyDifferences]);

    return (
        <div style={{ padding: '24px' }}>
          <label htmlFor="datePicker">Pick a date: </label>
          <input type="date" id="datePicker" value={date} onChange={(e) => setDate(e.target.value)} />
          <canvas ref={chartRef} width="400" height="200"></canvas>
        </div>
    );
}

export default DeviceChart;
