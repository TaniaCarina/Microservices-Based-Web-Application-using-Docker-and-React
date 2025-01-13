import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import Stomp from "stompjs";

Chart.register(...registerables);

const DeviceChart = () => {
    const [measurements, setMeasurements] = useState([]);
    const [date, setDate] = useState(null);
    const [hourlyDifferences, setHourlyDifferences] = useState([]);
    const deviceUuid = window.location.href.split('/').slice(-1)[0];
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);
    const clientRef = useRef(null);
    const [connected, setConnected] = useState(false);
    const [notification, setNotification] = useState(null); // State for popup notification


    const processMessage = (message) => {
        const data = JSON.parse(message.body);
        console.log("Received message:", data);
        const notificationMessage = `Device UUID: ${data.deviceUuid}, Max Hourly Consumption: ${data.maxHourlyConsumption}, Total Consumption: ${data.totalConsumption}`;
        setNotification(notificationMessage); 
        // setNotification(data.message);
        // console.log("Notification message:", data.message);
      };

      useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 30000); 
            return () => clearTimeout(timer);
        }
    }, [notification]);  

    useEffect(() => {
        if (date) {
            getNewMeasurements();
        }
    }, [date]);

    useEffect(() => {
        updateHourlyDifferences();
    }, [measurements]);

    useEffect(() => {
        return () => {
            if (clientRef.current) {
                clientRef.current.deactivate();
            }
        };
    }, []);

 
const getNewMeasurements = () => {
  const dateObj = new Date(date);
  const formattedDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

//   const client = new Client({
//       brokerURL: "ws://localhost:8082/measurements",  // Adjust URL if necessary
//       connectHeaders: {},
//       onConnect: () => {
//           client.subscribe("/topic/measurements", (message) => {
//               const receivedMessage = JSON.parse(message.body);
//               setMeasurements(receivedMessage);
//           });

//           client.publish({
//               destination: "/app/sendMeasurement",
//               body: JSON.stringify({
//                   deviceUuid: deviceUuid,
//                   date: formattedDate,
//               }),
//           });
//       },
//       // Add handlers for other client events as needed
//   });

const client = new Client({
    brokerURL: 'ws://localhost:8082/measurements'
  });

  client.onConnect = (frame) => {
      setConnected(true);
      console.log('Connected: ' + frame);
      client.subscribe('/topic/notifications', (message) => {
          processMessage(message);
      });
      client.subscribe("/topic/measurements", (message) => {
                      const receivedMessage = JSON.parse(message.body);
                      setMeasurements(receivedMessage);
                  });
      client.publish({
            destination: "/app/sendMeasurement",
                body: JSON.stringify({
                    deviceUuid: deviceUuid,
                    date: formattedDate,
                }),
     });
    //   client.publish({
    //       destination: "/app/hello",
    //       body: 'test',
    //   });
  };

  client.onWebSocketError = (error) => {
    console.error('Error with monitoring websocket', error);
};

client.onStompError = (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
    };

  client.activate();
  clientRef.current = client;
};

    const updateHourlyDifferences = () => {
        const hourlyDiff = Array(24).fill(0).map(() => []);

        measurements.forEach((measurement) => {
            const timestamp = new Date(measurement.timestamp);
            const hour = timestamp.getHours();
            hourlyDiff[hour].push(measurement.value);
        });

        const hourlyDifferencesData = hourlyDiff.map(values => {
            return values.length >= 2 ? values[values.length - 1] - values[0] : 0;
        });

        const chartData = {
          labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
            datasets: [{
                label: 'Hourly Differences',
                data: hourlyDifferencesData,
                backgroundColor: 'rgba(173, 124, 253, 0.6)',
                borderColor: 'rgb(66, 5, 78)',
                borderWidth: 1,
            }],
        };

        setHourlyDifferences(chartData);
    };

    useEffect(() => {
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

            chartInstanceRef.current = newChartInstance;
        }
    }, [hourlyDifferences]);

    return (
        <div style={{ padding: '24px' }}>
            <label htmlFor="datePicker">Pick a date: </label>
            <input type="date" id="datePicker" value={date || ''} onChange={(e) => setDate(e.target.value)} />
            <canvas ref={chartRef} width="400" height="200"></canvas>
            {/* Popup Notification */}
            {notification && (
            <div
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    backgroundColor: 'rgba(74, 0, 114, 0.8)',
                    color: 'white',
                    padding: '16px',
                    borderRadius: '8px',
                    zIndex: 1000,
                }}
            >
                <p>{notification}</p>
            </div>
        )}
        </div>
    );
};

export default DeviceChart;