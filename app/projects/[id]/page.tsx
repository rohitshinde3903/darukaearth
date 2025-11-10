'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import type { Geometry } from 'geojson';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface Project {
  id: number;
  name: string;
  description: string;
  site_count: number;
}

interface SiteFeature {
  type: string;
  id: number;
  geometry: Geometry;
  properties: {
    id: number;
    name: string;
    description: string;
    area: number;
    created_at: string;
  };
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const mapRef = useRef<mapboxgl.Map | null>(null);
  
  const [project, setProject] = useState<Project | null>(null);
  const [sites, setSites] = useState<SiteFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedSiteForMap, setSelectedSiteForMap] = useState<SiteFeature | null>(null);

  useEffect(() => {
    fetchProject();
    fetchSites();
  }, []);

  const fetchProject = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/projects/${params.id}/`);
      if (response.ok) {
        setProject(await response.json());
      }
    } catch (err) {
      setError('Failed to fetch project');
    } finally {
      setLoading(false);
    }
  };

  const fetchSites = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/sites/?project=${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setSites(data.features || []);
      }
    } catch (err) {
      setError('Failed to fetch sites');
    }
  };

  const handleSiteCreated = () => {
    setShowModal(false);
    setSuccess('Site created successfully!');
    fetchSites();
    fetchProject();
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeleteSite = async (siteId: number) => {
    if (!confirm('Are you sure you want to delete this site?')) return;

    try {
      const response = await fetch(`http://localhost:8000/api/sites/${siteId}/`, {
        method: 'DELETE',
      });

      if (response.status === 204) {
        setSuccess('Site deleted successfully!');
        fetchSites();
        fetchProject();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to delete site');
    }
  };

  const handleFindOnMap = (site: SiteFeature) => {
    if (!mapRef.current) return;
    
    const geom = site.geometry;
    if (geom.type === 'Polygon') {
      const bounds = new mapboxgl.LngLatBounds();
      (geom.coordinates[0] as [number, number][]).forEach((coord) => {
        bounds.extend(coord);
      });
      mapRef.current.fitBounds(bounds, { padding: 100, maxZoom: 15 });
      
      setSelectedSiteForMap(site);
      setTimeout(() => setSelectedSiteForMap(null), 3000);
    }
  };

  const handleViewAnalytics = (siteId: number) => {
    router.push(`/analytics/${siteId}`);
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Map Configuration Required</h2>
          <p className="text-gray-600">Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local</p>
        </div>
      </div>
    );
  }

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
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/home')}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{project?.name}</h1>
                <p className="text-sm text-gray-600">{project?.description}</p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              + Create Site
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      {success && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        </div>
      )}
      {error && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sites List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 h-[calc(100vh-220px)] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Sites ({sites.length})</h3>
              
              <div className="space-y-3">
                {sites.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No sites yet</p>
                    <p className="text-xs mt-2">Click "Create Site" to add one</p>
                  </div>
                ) : (
                  sites.map((site) => (
                    <div
                      key={site.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-800">{site.properties.name}</h4>
                        <button
                          onClick={() => handleDeleteSite(site.properties.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{site.properties.description}</p>
                      <p className="text-xs text-gray-500 mb-3">
                        📏 {(site.properties.area / 1000000).toFixed(2)} km²
                      </p>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleFindOnMap(site)}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Find on Map
                        </button>
                        <button
                          onClick={() => handleViewAnalytics(site.properties.id)}
                          className="flex-1 px-3 py-2 bg-green-600 text-white text-xs rounded hover:bg-green-700 flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Analytics
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Map View */}
          <div className="lg:col-span-3">
            <MapView sites={sites} selectedSite={selectedSiteForMap} mapRef={mapRef} />
          </div>
        </div>
      </div>

      {/* Create Site Modal */}
      {showModal && (
        <CreateSiteModal
          projectId={params.id as string}
          onClose={() => setShowModal(false)}
          onSuccess={handleSiteCreated}
        />
      )}
    </div>
  );
}

// Map View Component
function MapView({ sites, selectedSite, mapRef }: { 
  sites: SiteFeature[]; 
  selectedSite: SiteFeature | null;
  mapRef: React.MutableRefObject<mapboxgl.Map | null>;
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [0, 20],
      zoom: 2,
    });

    mapRef.current.on('load', () => {
      setMapLoaded(true);
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded || sites.length === 0) return;

    // Remove existing layers
    if (mapRef.current.getSource('sites')) {
      if (mapRef.current.getLayer('sites-fill')) mapRef.current.removeLayer('sites-fill');
      if (mapRef.current.getLayer('sites-outline')) mapRef.current.removeLayer('sites-outline');
      mapRef.current.removeSource('sites');
    }

    // Add sites
    const geojson = {
      type: 'FeatureCollection' as const,
      features: sites.map((site) => ({
        type: 'Feature' as const,
        properties: {
          id: site.id,
          name: site.properties.name,
          area: site.properties.area
        },
        geometry: site.geometry
      }))
    };

    mapRef.current.addSource('sites', {
      type: 'geojson',
      data: geojson
    });

    mapRef.current.addLayer({
      id: 'sites-fill',
      type: 'fill',
      source: 'sites',
      paint: {
        'fill-color': '#3498db',
        'fill-opacity': 0.4
      }
    });

    mapRef.current.addLayer({
      id: 'sites-outline',
      type: 'line',
      source: 'sites',
      paint: {
        'line-color': '#2980b9',
        'line-width': 2
      }
    });

    // Fit bounds
    if (sites.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      sites.forEach((site) => {
        if (site.geometry.type === 'Polygon') {
          (site.geometry.coordinates[0] as [number, number][]).forEach((coord) => {
            bounds.extend(coord);
          });
        }
      });
      mapRef.current.fitBounds(bounds, { padding: 50 });
    }
  }, [sites, mapLoaded]);

  useEffect(() => {
    if (!mapRef.current || !selectedSite) return;

    const geom = selectedSite.geometry;
    if (geom.type === 'Polygon') {
      const bounds = new mapboxgl.LngLatBounds();
      (geom.coordinates[0] as [number, number][]).forEach((coord) => {
        bounds.extend(coord);
      });
      mapRef.current.fitBounds(bounds, { padding: 100, maxZoom: 15 });
    }
  }, [selectedSite]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h3 className="text-lg font-semibold mb-3">Project Map</h3>
      <div ref={mapContainer} style={{ width: '100%', height: 'calc(100vh - 270px)', minHeight: '500px', borderRadius: '0.5rem' }} />
    </div>
  );
}

// Create Site Modal Component
function CreateSiteModal({ projectId, onClose, onSuccess }: { projectId: string; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [drawnPolygon, setDrawnPolygon] = useState<any>(null);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [0, 20],
      zoom: 2,
    });

    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
      defaultMode: 'draw_polygon',
    });

    map.current.addControl(draw.current);
    map.current.addControl(new mapboxgl.NavigationControl());

    const updatePolygon = () => {
      if (!draw.current) return;
      const data = draw.current.getAll();
      if (data.features.length > 0) {
        setDrawnPolygon(data.features[0].geometry);
      }
    };

    map.current.on('draw.create', updatePolygon);
    map.current.on('draw.update', updatePolygon);
    map.current.on('draw.delete', () => setDrawnPolygon(null));

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!drawnPolygon) {
      setError('Please draw a polygon on the map');
      return;
    }

    setLoading(true);
    setError('');

    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;

    try {
      const response = await fetch('http://localhost:8000/api/sites/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: projectId,
          name,
          description,
          geometry: drawnPolygon,
          created_by_email: user?.email,
        }),
      });

      if (response.status === 201) {
        onSuccess();
      } else {
        setError('Failed to create site');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Create New Site</h2>
        <p className="text-gray-600 text-sm mb-6">Draw a polygon on the map to define the site area</p>

        {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2">Site Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter site name"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter description"
            />
          </div>

          <div ref={mapContainer} style={{ height: '400px', marginBottom: '1rem', borderRadius: '0.5rem', border: '2px solid #ddd' }} />

          {drawnPolygon && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              ✓ Polygon drawn! Area will be calculated automatically.
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !drawnPolygon}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Creating...' : 'Create Site'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
