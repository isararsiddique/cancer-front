'use client';

/**
 * Code Editor Component for ML Training Sandbox
 * 
 * Provides a Python code editor with syntax highlighting and execution capabilities.
 * Requirements: 3.1
 */

import { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/shared/Button';

interface CodeEditorProps {
  onExecute: (code: string) => Promise<void>;
  isExecuting?: boolean;
  initialCode?: string;
}

export function CodeEditor({ onExecute, isExecuting = false, initialCode = '' }: CodeEditorProps) {
  const [code, setCode] = useState(initialCode || `# Write your Python code here
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

# Example: Simple linear regression
X = np.array([[1], [2], [3], [4], [5]])
y = np.array([2, 4, 6, 8, 10])

model = LinearRegression()
model.fit(X, y)

prediction = model.predict([[6]])
print(f'Prediction for x=6: {prediction[0]:.2f}')
`);

  const handleExecute = async () => {
    if (!code.trim()) {
      alert('Please enter some code to execute');
      return;
    }
    
    await onExecute(code);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      
      // Insert 4 spaces
      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(newCode);
      
      // Move cursor after the inserted spaces
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Editor Header */}
      <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-sm font-medium text-slate-300">Python Editor</span>
        </div>
        
        <Button
          variant="primary"
          size="sm"
          icon={isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          onClick={handleExecute}
          disabled={isExecuting}
          className="bg-green-600 hover:bg-green-700"
        >
          {isExecuting ? 'Executing...' : 'Run Code'}
        </Button>
      </div>

      {/* Code Editor Textarea */}
      <div className="flex-1 relative">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isExecuting}
          className="w-full h-full p-4 bg-slate-900 text-slate-100 font-mono text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          style={{
            tabSize: 4,
            fontFamily: "'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
          }}
          placeholder="# Write your Python code here..."
          spellCheck={false}
        />
        
        {/* Line numbers overlay (simple version) */}
        <div className="absolute top-0 left-0 p-4 pr-2 bg-slate-800/50 text-slate-500 font-mono text-sm leading-relaxed pointer-events-none select-none">
          {code.split('\n').map((_, i) => (
            <div key={i} className="text-right">
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Editor Footer */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-t border-slate-700 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span>Python 3.11</span>
          <span>•</span>
          <span>{code.split('\n').length} lines</span>
          <span>•</span>
          <span>{code.length} characters</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-slate-700 rounded text-slate-300">UTF-8</span>
        </div>
      </div>
    </div>
  );
}
