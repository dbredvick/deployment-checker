import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';

const DeploymentChart = () => {
  const [chartData, setChartData] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/deployment-data');
        const data = await response.json();

        const formattedData = formatChartData(data);
        setChartData(formattedData);
      } catch (error) {
        console.error('Error fetching deployment data:', error);
      }
    };

    fetchData();
  }, []);

  const formatChartData = (data) => {
    const labels = data.map(item => item.date);
    const values = data.map(item => item.deployments);

    return {
      labels,
      datasets: [
        {
          label: 'Number of Deployments',
          data: values,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  return (
    <div>
      <h2>Deployment Frequency</h2>
      <Bar data={chartData} />
    </div>
  );
};

export default DeploymentChart;
