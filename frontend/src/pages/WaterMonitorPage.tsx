import React, { useState, useEffect } from 'react';
import PageBreadcrumb from '../components/common/PageBreadCrumb';
import PageMeta from '../components/common/PageMeta';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface RainfallReading {
  stationId: string;
  stationName: string;
  district: string;
  latitude: number;
  longitude: number;
  rainfallMmPerHour: number;
  cumulativeRain24h: number;
  riskLevel: string;
  recordedAt: string;
}

interface RiverLevel {
  gaugeId: string;
  riverName: string;
  stationName: string;
  district: string;
  latitude: number;
  longitude: number;
  waterLevelMetres: number;
  alertLevel: number;
  minorFloodLevel: number;
  majorFloodLevel: number;
  status: string;
  trend: string;
  changeFromLastHour: number;
  recordedAt: string;
}

export default function WaterMonitorPage() {
  const [rainfallData, setRainfallData] = useState<RainfallReading[]>([]);
  const [riverData, setRiverData] = useState<RiverLevel[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      const rainRes = await fetch('http://localhost:3001/api/water/rainfall');
      const rainJson = await rainRes.json();
      setRainfallData(rainJson);

      const riverRes = await fetch('http://localhost:3001/api/water/river');
      const riverJson = await riverRes.json();
      setRiverData(riverJson);

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching water data', err);
    }
  };

  useEffect(() => {
    fetchData();

    const socket = io('http://localhost:3001/water');
    socket.on('water_data_updated', () => {
      fetchData();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const getRiskColor = (level: string) => {
    switch(level) {
      case 'DANGER': return 'bg-red-500 text-white';
      case 'WARNING': return 'bg-orange-500 text-white';
      case 'WATCH': return 'bg-yellow-400 text-black';
      default: return 'bg-green-500 text-white';
    }
  };

  const getRiverStatusColor = (status: string) => {
    switch(status) {
      case 'MAJOR_FLOOD': return 'bg-red-600 text-white animate-pulse';
      case 'MINOR_FLOOD': return 'bg-orange-500 text-white';
      case 'ALERT': return 'bg-yellow-400 text-black';
      default: return 'bg-blue-500 text-white';
    }
  };

  return (
    <div>
      <PageMeta title="Water Monitor | Suraksha" description="Real-time rainfall and river water levels" />
      <PageBreadcrumb pageTitle="Water Monitor" />

      <div className="mb-6 flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Live Data Feed</h2>
          <p className="text-xs text-gray-500">Updated every hour via DMC integration</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600 dark:text-gray-400">Last updated: <span className="font-semibold text-gray-900 dark:text-gray-100">{lastUpdated.toLocaleTimeString()}</span></p>
          <button onClick={fetchData} className="text-brand-500 text-xs hover:underline mt-1 font-medium">Refresh Now</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-[500px] flex flex-col">
          <h3 className="font-bold text-gray-800 dark:text-white mb-4">Risk Map Overview</h3>
          <div className="flex-1 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900 z-0">
            <MapContainer center={[7.8731, 80.7718]} zoom={7} style={{ height: "100%", width: "100%", zIndex: 0 }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {rainfallData.map((station, i) => (
                <CircleMarker 
                  key={`rain-${i}`} 
                  center={[station.latitude, station.longitude]}
                  radius={8}
                  pathOptions={{ color: station.riskLevel === 'DANGER' ? 'red' : station.riskLevel === 'WARNING' ? 'orange' : 'green', fillColor: station.riskLevel === 'DANGER' ? 'red' : station.riskLevel === 'WARNING' ? 'orange' : 'green', fillOpacity: 0.7 }}
                >
                  <Tooltip>
                    <div className="font-bold">{station.stationName}</div>
                    <div>Rainfall: {station.rainfallMmPerHour.toFixed(1)} mm/hr</div>
                    <div className="text-xs">Risk: {station.riskLevel}</div>
                  </Tooltip>
                </CircleMarker>
              ))}
              {riverData.map((river, i) => (
                <CircleMarker 
                  key={`river-${i}`} 
                  center={[river.latitude, river.longitude]}
                  radius={10}
                  pathOptions={{ color: river.status === 'MAJOR_FLOOD' ? 'red' : 'blue', fillColor: river.status === 'MAJOR_FLOOD' ? 'red' : 'blue', fillOpacity: 0.8 }}
                >
                  <Tooltip>
                    <div className="font-bold">{river.stationName} ({river.riverName})</div>
                    <div>Level: {river.waterLevelMetres.toFixed(2)} m</div>
                    <div className="text-xs">Status: {river.status}</div>
                  </Tooltip>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Rainfall Table */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-gray-800 dark:text-white mb-4">Rainfall Stations</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                    <th className="py-2 px-3 font-semibold">Station</th>
                    <th className="py-2 px-3 font-semibold">District</th>
                    <th className="py-2 px-3 font-semibold text-right">Current (mm/hr)</th>
                    <th className="py-2 px-3 font-semibold text-right">24h Total (mm)</th>
                    <th className="py-2 px-3 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rainfallData.slice(0, 5).map((station, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-3 font-medium text-gray-800 dark:text-gray-200">{station.stationName}</td>
                      <td className="py-3 px-3 text-gray-600 dark:text-gray-400">{station.district}</td>
                      <td className="py-3 px-3 text-right font-semibold">{station.rainfallMmPerHour.toFixed(1)}</td>
                      <td className="py-3 px-3 text-right">{station.cumulativeRain24h.toFixed(1)}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-md ${getRiskColor(station.riskLevel)}`}>
                          {station.riskLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {rainfallData.length === 0 && (
                    <tr><td colSpan={5} className="py-4 text-center text-gray-500">No data available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* River Levels Table */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-gray-800 dark:text-white mb-4">River Gauges</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                    <th className="py-2 px-3 font-semibold">River & Station</th>
                    <th className="py-2 px-3 font-semibold text-right">Current Level (m)</th>
                    <th className="py-2 px-3 font-semibold text-center">Trend</th>
                    <th className="py-2 px-3 font-semibold text-center">Alert Level</th>
                    <th className="py-2 px-3 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {riverData.slice(0, 5).map((river, i) => (
                    <tr key={i} className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${river.status === 'MAJOR_FLOOD' ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                      <td className="py-3 px-3 font-medium text-gray-800 dark:text-gray-200">
                        {river.riverName} <br/>
                        <span className="text-xs text-gray-500 font-normal">{river.stationName}</span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-lg">
                        {river.waterLevelMetres.toFixed(2)}
                        <span className={`text-xs block font-normal ${river.changeFromLastHour > 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {river.changeFromLastHour > 0 ? '+' : ''}{river.changeFromLastHour.toFixed(2)}m
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold">
                        {river.trend === 'RISING' ? <span className="text-red-500">↑</span> : river.trend === 'FALLING' ? <span className="text-green-500">↓</span> : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="py-3 px-3 text-center text-gray-600 dark:text-gray-400">{river.alertLevel.toFixed(2)}m</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-md ${getRiverStatusColor(river.status)}`}>
                          {river.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {riverData.length === 0 && (
                    <tr><td colSpan={5} className="py-4 text-center text-gray-500">No data available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
