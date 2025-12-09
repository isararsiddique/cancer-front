'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2, Check } from 'lucide-react';

interface ICD11ECTSearchProps {
  onSelect: (details: any) => void;
  placeholder?: string;
}

declare global {
  interface Window {
    ECT?: {
      Handler?: {
        configure: (settings: any, callbacks: any) => void;
        bind: (ino: number) => void;
        clear: (ino: number) => void;
      };
    };
  }
}

export function ICD11ECTSearch({ onSelect, placeholder = "Search ICD-11 (e.g., colon cancer)" }: ICD11ECTSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState('Initializing...');

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  // Get auth token from localStorage
  function getAuthToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token') || null;
    }
    return null;
  }

  // Simple fetch helper
  async function fetchAPI(url: string, options: RequestInit = {}) {
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers: headers as HeadersInit,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Get ICD details (like index.html getICDDetails)
  async function getICDDetails(code: string) {
    try {
      const data = await fetchAPI(`/api/icd/${encodeURIComponent(code)}`);
      return data;
    } catch (error: any) {
      console.error('Error fetching ICD details:', error);
      return null;
    }
  }

  // Initialize WHO ECT widget (like index.html)
  useEffect(() => {
    const initECT = async () => {
      try {
        // Load ECT script if not already loaded
        if (!window.ECT) {
          const script = document.createElement('script');
          script.src = 'https://icdcdn.who.int/embeddedct/icd11ect-1.7.1.js';
          script.onload = () => {
            setTimeout(() => configureECT(), 500);
          };
          document.head.appendChild(script);
        } else {
          configureECT();
        }
      } catch (error) {
        console.error('Error initializing ECT:', error);
        setStatus('Initialization failed');
      }
    };

    const configureECT = () => {
      if (!window.ECT || !window.ECT.Handler) {
        setStatus('ECT not available');
        return;
      }

      const mySettings = {
        apiServerUrl: "https://id.who.int",
        apiSecured: true,
        icdMinorVersion: "2025-01",
        icdLinearization: "mms",
        popupMode: true
      };

      const myCallbacks = {
        async getNewTokenFunction() {
          async function fetchTokenWithRetry(max = 4, delayMs = 800) {
            let lastErr = null;
            for (let i = 0; i < max; i++) {
              try {
                const res = await fetch(`${API_BASE}/api/token`);
                if (!res.ok) throw new Error('token http error');
                const data = await res.json();
                if (!data || !data.access_token) throw new Error('no access_token');
                return data.access_token;
              } catch (e: any) {
                lastErr = e;
                await new Promise(r => setTimeout(r, delayMs));
              }
            }
            throw lastErr || new Error('token fetch failed');
          }
          return await fetchTokenWithRetry();
        },
        async selectedEntityFunction(selected: any) {
          const raw = selected.code || selected.id;
          if (!raw) return;

          // Parse composite expression (like index.html)
          const [clusterStr, manifestStr] = String(raw).split('/');
          const parts = String(clusterStr).split('&').map((s: string) => s.trim()).filter(Boolean);
          const stem = parts[0];
          const manifestParts = manifestStr ? manifestStr.split('&').map((s: string) => s.trim()).filter(Boolean) : [];
          const manifestExts = manifestParts.filter((e: string) => 
            e.startsWith('XA') || e.startsWith('XM') || e.startsWith('XH') || 
            e.startsWith('XK') || e.startsWith('XS')
          );
          const exts = parts.slice(1).concat(manifestExts);

          // Get title
          let title = selected.title || '';
          if (!title) {
            try {
              const icdJson = await getICDDetails(stem);
              title = (icdJson && icdJson.title && (icdJson.title['@value'] || icdJson.title)) || '';
            } catch {}
          }

          // Extract codes (like index.html)
          let top = 'NA', morph = 'NA', beh = 'NA', stageCode = 'NA', laterality = 'NA';
          let manifestationCode = 'NA', manifestation = 'NA';

          for (const e of exts) {
            if (e.startsWith('XA')) { if (top === 'NA') top = e; }
            else if (e.startsWith('XM')) { morph = e; }
            else if (e.startsWith('XH') && morph === 'NA') { morph = e; }
            else if (e.startsWith('XK')) {
              try {
                const latJson = await getICDDetails(e);
                const lt = (latJson && latJson.title && (latJson.title['@value'] || latJson.title) || '').toLowerCase();
                if (lt.includes('left')) laterality = 'Left';
                else if (lt.includes('right')) laterality = 'Right';
                else if (lt.includes('bilateral')) laterality = 'Bilateral';
                else laterality = 'Unknown';
              } catch {
                if (e === 'XK9K') laterality = 'Right';
                else if (e === 'XK8G') laterality = 'Left';
                else if (e === 'XK9J') laterality = 'Bilateral';
                else if (e === 'XK70') laterality = 'Unilateral, unspecified';
                else laterality = 'NA';
              }
            }
            else if (e.startsWith('XS')) {
              try {
                const xsJson = await getICDDetails(e);
                const tt = (xsJson && xsJson.title && (xsJson.title['@value'] || xsJson.title) || '').toLowerCase();
                if (tt.includes('stage') || tt.includes('severity')) {
                  stageCode = e;
                } else if (tt.includes('behavior') || tt.includes('behaviour')) {
                  beh = e;
                }
              } catch {
                if (stageCode === 'NA') stageCode = e;
              }
            }
          }

          // Get manifestation
          if (manifestStr) {
            const manifestCodes = manifestStr.split('&').map((s: string) => s.trim()).filter(Boolean);
            for (const mc of manifestCodes) {
              if (mc.startsWith('MG')) {
                manifestationCode = mc;
                try {
                  const mj = await getICDDetails(mc);
                  manifestation = (mj && mj.title && (mj.title['@value'] || mj.title)) || 'NA';
                } catch {}
                break;
              }
            }
          }

          // Get topography and morphology names
          let topography = 'NA';
          let morphology = 'NA';
          if (top !== 'NA') {
            try {
              const tj = await getICDDetails(top);
              topography = (tj && tj.title && (tj.title['@value'] || tj.title)) || '';
            } catch {}
          }
          if (morph !== 'NA') {
            try {
              const mj = await getICDDetails(morph);
              morphology = (mj && mj.title && (mj.title['@value'] || mj.title)) || '';
            } catch {}
          }

          // Call onSelect with parsed data (matching index.html structure)
          onSelect({
            code: stem,
            raw: raw,
            parsed: {
              icd11_main_code: stem,
              icd11_description: title,
              icd11_composite_expression: raw,
              icd11_topography_code: top,
              icd11_topography: topography,
              icd11_morphology_code: morph,
              icd11_morphology: morphology,
              icd11_behavior_code: beh,
              icd11_stage_code: stageCode,
              laterality: laterality,
              icd11_manifestation_code: manifestationCode,
              manifestation: manifestation,
            },
            auto_fill_fields: {
              icd11_main_code: stem,
              icd11_description: title,
              icd11_composite_expression: raw,
              icd11_topography_code: top,
              icd11_topography: topography,
              icd11_morphology_code: morph,
              icd11_morphology: morphology,
              icd11_behavior_code: beh,
              icd11_stage_code: stageCode,
              laterality: laterality,
              icd11_manifestation_code: manifestationCode,
              manifestation: manifestation,
            }
          });

          if (window.ECT && window.ECT.Handler) {
            window.ECT.Handler.clear(1);
          }
        }
      };

      try {
        window.ECT.Handler.configure(mySettings, myCallbacks);
        window.ECT.Handler.bind(1);
        setIsReady(true);
        setStatus('Ready');
      } catch (error) {
        console.error('Error configuring ECT:', error);
        setStatus('Configuration failed');
      }
    };

    // Test token first
    const testToken = async () => {
      try {
        await fetch(`${API_BASE}/api/token`);
        initECT();
      } catch (error) {
        console.error('Token test failed:', error);
        setStatus('Connection failed');
      }
    };

    testToken();
  }, [API_BASE, onSelect]);

  return (
    <div className="relative w-full">
      {/* Load ECT CSS */}
      <link rel="stylesheet" href="https://icdcdn.who.int/embeddedct/icd11ect-1.7.1.css" />
      
      {/* Search input with ECT class (like index.html) */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          className="ctw-input glass-input w-full pl-12 pr-10 py-3 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          autoComplete="off"
          data-ctw-ino="1"
          placeholder={placeholder}
          disabled={!isReady}
        />
      </div>

      {/* Status badge */}
      <div className="mt-2">
        <span className={`text-xs px-2 py-1 rounded-full ${
          isReady 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
        }`}>
          {status}
        </span>
      </div>

      {/* ECT window container (like index.html) */}
      <div ref={containerRef} className="ctw-window mt-2" data-ctw-ino="1"></div>
    </div>
  );
}
