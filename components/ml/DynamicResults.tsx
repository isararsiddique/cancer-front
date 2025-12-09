'use client';

/**
 * Dynamic Results Display Component for ML Training Sandbox
 * 
 * Displays execution results including stdout, stderr, visualizations, and metrics.
 * Adapts layout dynamically based on output types.
 * Requirements: 3.3, 3.4, 3.5, 3.6, 3.7
 */

import { CheckCircle, XCircle, AlertCircle, Clock, Terminal, Image as ImageIcon } from 'lucide-react';
import { Card } from '@/components/shared/Card';

interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  execution_time: number;
  timeout: boolean;
  error?: string | null;
  visualizations?: string[] | null;
  metrics?: Record<string, any> | null;
}

interface DynamicResultsProps {
  result: ExecutionResult | null;
}

export function DynamicResults({ result }: DynamicResultsProps) {
  if (!result) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <div className="text-center">
          <Terminal className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No results yet</p>
          <p className="text-sm mt-2">Run your code to see the output here</p>
        </div>
      </div>
    );
  }

  const hasStdout = result.stdout && result.stdout.trim().length > 0;
  const hasStderr = result.stderr && result.stderr.trim().length > 0;
  const hasVisualizations = result.visualizations && result.visualizations.length > 0;
  const hasMetrics = result.metrics && Object.keys(result.metrics).length > 0;

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Execution Status Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {result.success ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : result.timeout ? (
              <Clock className="w-6 h-6 text-orange-500" />
            ) : (
              <XCircle className="w-6 h-6 text-red-500" />
            )}
            <div>
              <h3 className="font-semibold text-slate-900">
                {result.success ? 'Execution Successful' : result.timeout ? 'Execution Timeout' : 'Execution Failed'}
              </h3>
              <p className="text-sm text-slate-600">
                Completed in {result.execution_time.toFixed(3)}s
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Error Message (Requirement 3.7) */}
      {result.error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-900 mb-2">Error</h4>
              <pre className="text-sm text-red-800 whitespace-pre-wrap font-mono bg-red-100 p-3 rounded">
                {result.error}
              </pre>
            </div>
          </div>
        </Card>
      )}

      {/* Standard Error Output (Requirement 3.7) */}
      {hasStderr && (
        <Card className="p-4 bg-orange-50 border-orange-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-orange-900 mb-2">Standard Error</h4>
              <pre className="text-sm text-orange-800 whitespace-pre-wrap font-mono bg-orange-100 p-3 rounded max-h-64 overflow-y-auto">
                {result.stderr}
              </pre>
            </div>
          </div>
        </Card>
      )}

      {/* Standard Output (Requirement 3.3) */}
      {hasStdout && (
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <Terminal className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900 mb-2">Output</h4>
              <pre className="text-sm text-slate-800 whitespace-pre-wrap font-mono bg-slate-100 p-3 rounded max-h-96 overflow-y-auto">
                {result.stdout}
              </pre>
            </div>
          </div>
        </Card>
      )}

      {/* Visualizations (Requirements 3.3, 3.5) */}
      {hasVisualizations && (
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <ImageIcon className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900 mb-3">Visualizations</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.visualizations!.map((viz, index) => (
                  <div key={index} className="bg-slate-100 rounded-lg p-2">
                    <img
                      src={`data:image/png;base64,${viz}`}
                      alt={`Visualization ${index + 1}`}
                      className="w-full h-auto rounded"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Metrics (Requirement 3.6) */}
      {hasMetrics && (
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <BarChart3 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900 mb-3">Metrics</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(result.metrics!).map(([key, value]) => (
                  <div key={key} className="bg-slate-100 rounded-lg p-3">
                    <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">
                      {key.replace(/_/g, ' ')}
                    </p>
                    <p className="text-lg font-semibold text-slate-900">
                      {typeof value === 'number' ? value.toFixed(4) : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!hasStdout && !hasStderr && !hasVisualizations && !hasMetrics && result.success && (
        <Card className="p-8 text-center">
          <Terminal className="w-12 h-12 mx-auto mb-3 text-slate-400" />
          <p className="text-slate-600">No output generated</p>
          <p className="text-sm text-slate-500 mt-1">
            Your code executed successfully but didn't produce any output
          </p>
        </Card>
      )}
    </div>
  );
}

// Import BarChart3 from lucide-react
import { BarChart3 } from 'lucide-react';
