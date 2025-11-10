'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface AnalyticsSummary {
  total_carbon_sequestered: number;
  avg_vegetation_index: number;
  total_species: number;
  avg_tree_cover: number;
  total_records: number;
  latest_date: string;
}

interface TimeSeriesData {
  dates: string[];
  carbon: number[];
  vegetation: number[];
  species: number[];
  tree_cover: number[];
}

export default function SiteAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [summaryRes, timeSeriesRes] = await Promise.all([
        fetch(`http://localhost:8000/api/analytics/summary/?site=${params.siteId}`),
        fetch(`http://localhost:8000/api/analytics/time_series/?site=${params.siteId}`)
      ]);

      if (summaryRes.ok && timeSeriesRes.ok) {
        setSummary(await summaryRes.json());
        setTimeSeries(await timeSeriesRes.json());
      }
    } catch (err) {
      console.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Site Analytics</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Total Carbon</h3>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-800">{summary?.total_carbon_sequestered.toFixed(1)} t</p>
            <p className="text-xs text-gray-500 mt-1">CO₂ Sequestered</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Vegetation Index</h3>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-800">{summary?.avg_vegetation_index.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">NDVI Average</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Species Count</h3>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-800">{summary?.total_species}</p>
            <p className="text-xs text-gray-500 mt-1">Biodiversity</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Tree Cover</h3>
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-800">{summary?.avg_tree_cover.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">Coverage</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Carbon Sequestration Over Time</h3>
            <SimpleLineChart data={timeSeries?.carbon || []} labels={timeSeries?.dates || []} color="#10b981" />
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Vegetation Index Trend</h3>
            <SimpleLineChart data={timeSeries?.vegetation || []} labels={timeSeries?.dates || []} color="#3b82f6" />
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Species Count</h3>
            <SimpleBarChart data={timeSeries?.species || []} labels={timeSeries?.dates || []} color="#8b5cf6" />
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Tree Cover Percentage</h3>
            <SimpleLineChart data={timeSeries?.tree_cover || []} labels={timeSeries?.dates || []} color="#f59e0b" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple Chart Components
function SimpleLineChart({ data, labels, color }: { data: number[]; labels: string[]; color: string }) {
  const max = Math.max(...data, 1);
  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((value / max) * 80);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative h-64">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
        {data.map((value, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = 100 - ((value / max) * 80);
          return <circle key={i} cx={x} cy={y} r="2" fill={color} />;
        })}
      </svg>
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>{labels[0]?.slice(0, 10)}</span>
        <span>{labels[labels.length - 1]?.slice(0, 10)}</span>
      </div>
    </div>
  );
}

function SimpleBarChart({ data, labels, color }: { data: number[]; labels: string[]; color: string }) {
  const max = Math.max(...data, 1);
  
  return (
    <div className="h-64 flex items-end justify-between gap-2">
      {data.map((value, i) => {
        const height = (value / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div className="w-full bg-gray-200 rounded-t" style={{ height: '100%' }}>
              <div 
                className="rounded-t transition-all" 
                style={{ height: `${height}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
