import React, { useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function TestKeyConsistencyButton({ systemId }) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleTestConsistency = async () => {
    if (!systemId) {
      alert('No system ID available to test');
      return;
    }

    setTesting(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-key-consistency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ systemId })
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        setShowDetails(true);
      } else {
        setResult({
          error: true,
          message: data.error || 'Test failed'
        });
      }
    } catch (error) {
      console.error('Test error:', error);
      setResult({
        error: true,
        message: error.message || 'Failed to run consistency test'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Test Button */}
      <button
        onClick={handleTestConsistency}
        disabled={testing || !systemId}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {testing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Testing Consistency...
          </>
        ) : (
          <>
            <AlertCircle className="w-4 h-4" />
            Test Key Consistency
          </>
        )}
      </button>

      {/* Results Display */}
      {result && (
        <div className="border rounded-lg p-4 space-y-3">
          {result.error ? (
            <div className="flex items-start gap-3 text-red-600">
              <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Test Failed</p>
                <p className="text-sm text-red-500">{result.message}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Overall Result */}
              <div className={`flex items-start gap-3 ${result.allKeysIdentical ? 'text-green-600' : 'text-red-600'}`}>
                {result.allKeysIdentical ? (
                  <CheckCircle className="w-6 h-6 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <p className="font-semibold text-lg">{result.result}</p>
                  <p className="text-sm text-gray-600">
                    {result.allKeysIdentical 
                      ? 'All variations generated the same activation key. Offline activation will work correctly!' 
                      : 'WARNING: Different variations generated different keys. Offline activation may fail!'}
                  </p>
                </div>
              </div>

              {/* Toggle Details */}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
              </button>

              {/* Detailed Results */}
              {showDetails && result.tests && (
                <div className="mt-4 space-y-2">
                  <p className="font-semibold text-sm text-gray-700">Test Variations:</p>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-3 max-h-96 overflow-y-auto">
                    {result.tests.map((test, index) => (
                      <div key={index} className="text-xs border-b border-gray-200 pb-2 last:border-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-500 mb-1">Input #{index + 1}:</p>
                            <p className="font-mono bg-white p-2 rounded border text-gray-800 break-all">
                              {test.input}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-gray-500 mb-1">Generated Key:</p>
                          <p className={`font-mono font-semibold p-2 rounded ${
                            test.key === result.tests[0].key 
                              ? 'bg-green-50 text-green-700 border border-green-200' 
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {test.key}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              {result.tests && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Summary:</span> Tested {result.tests.length} variations of the system ID.
                    {result.allKeysIdentical ? (
                      <span className="text-green-700"> All generated the same key: <span className="font-mono font-bold">{result.tests[0].key}</span></span>
                    ) : (
                      <span className="text-red-700"> Generated {new Set(result.tests.map(t => t.key)).size} different keys!</span>
                    )}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded border">
        <p className="font-semibold mb-1">ℹ️ What this tests:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Original system ID</li>
          <li>Lowercase version</li>
          <li>Uppercase version</li>
          <li>With extra spaces</li>
          <li>Without dashes</li>
          <li>With trailing newline</li>
        </ul>
        <p className="mt-2 text-gray-600">
          All variations should produce the <strong>same activation key</strong> for offline activation to work reliably.
        </p>
      </div>
    </div>
  );
}