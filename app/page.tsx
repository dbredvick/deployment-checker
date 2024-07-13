'use client'
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

//@ts-ignore
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          {children}
          <div className="items-center px-4 py-3">
            <button
              id="ok-btn"
              className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// @ts-ignore
const AddUrlForm = ({ onClose, onUrlAdded }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // @ts-ignore
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/add-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to add URL');
      }

      onUrlAdded(url);
      onClose();
    } catch (err) {
      setError('Failed to add URL. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Add New URL</h3>
      <div className="mb-4">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          required
        />
      </div>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {isLoading ? 'Adding...' : 'Add URL'}
      </button>
    </form>
  );
};

const DeploymentDashboard = () => {
  const [websiteData, setWebsiteData] = useState({});
  const [view, setView] = useState('daily');
  const [websites, setWebsites] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/api/deployment-data');
      const fetchedData = await response.json();

      // @ts-ignore
      const uniqueWebsites = [...new Set(fetchedData.map(item => item.url))];
      // @ts-ignore
      setWebsites(uniqueWebsites);
      // @ts-ignore
      const processData = (rawData, viewType, website) => {
        // @ts-ignore
        const filteredData = rawData.filter(item => item.url === website);
        // @ts-ignore
        const deployments = filteredData.map(item => new Date(item.timestamp));
        const startDate = new Date(Math.min(...deployments));
        const endDate = new Date(Math.max(...deployments));
        // @ts-ignore
        const getIntervals = (start, end, intervalType) => {
          const intervals = [];
          let current = new Date(start);
          while (current <= end) {
            intervals.push(new Date(current));
            switch (intervalType) {
              case 'daily':
                current.setDate(current.getDate() + 1);
                break;
              case 'weekly':
                current.setDate(current.getDate() + 7);
                break;
              case 'monthly':
                current.setMonth(current.getMonth() + 1);
                break;
            }
          }
          return intervals;
        };

        const intervals = getIntervals(startDate, endDate, viewType);
        // @ts-ignore
        const formatDate = (date, viewType) => {
          const options = { month: 'short', day: 'numeric' };
          switch (viewType) {
            case 'daily':
              return date.toLocaleDateString('en-US', options);
            case 'weekly':
              return `Week of ${date.toLocaleDateString('en-US', options)}`;
            case 'monthly':
              return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          }
        };

        return intervals.map(date => {
          // @ts-ignore
          const count = filteredData.filter(deployment => {
            const deploymentDate = new Date(deployment.timestamp);
            switch (viewType) {
              case 'daily':
                return deploymentDate.toDateString() === date.toDateString();
              case 'weekly':
                const deploymentWeekStart = new Date(deploymentDate.setDate(deploymentDate.getDate() - deploymentDate.getDay()));
                return deploymentWeekStart.toDateString() === date.toDateString();
              case 'monthly':
                return deploymentDate.getMonth() === date.getMonth() && deploymentDate.getFullYear() === date.getFullYear();
            }
          }).length;

          return {
            date: formatDate(date, viewType),
            count
          };
        });
      };

      const updateWebsiteData = () => {
        const websiteDataMap = {};
        uniqueWebsites.forEach(website => {
          // @ts-ignore
          websiteDataMap[website] = processData(fetchedData, view, website);
        });
        setWebsiteData(websiteDataMap);
      };

      updateWebsiteData();
    };

    fetchData();
  }, [view]);

  // @ts-ignore
  const handleUrlAdded = (newUrl) => {
    // @ts-ignore
    setWebsites(prevWebsites => [...prevWebsites, newUrl]);
    // In a real application, you would typically fetch new data here
    // For this example, we'll just add an empty dataset for the new URL
    setWebsiteData(prevData => ({
      ...prevData,
      [newUrl]: []
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">Deployment Frequency Dashboard</h1>

        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Add URL
          </button>
          <div>
            <label className="mr-2 text-gray-700">View:</label>
            <select
              value={view}
              onChange={(e) => setView(e.target.value)}
              className="border rounded p-2 bg-gray-50"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        {websites.map(site => (
          <div key={site} className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">{site}</h2>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={websiteData[site]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#4F46E5" name="Deployments" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <AddUrlForm onClose={() => setIsModalOpen(false)} onUrlAdded={handleUrlAdded} />
        </Modal>
      </div>
    </div>
  );
};

export default DeploymentDashboard;