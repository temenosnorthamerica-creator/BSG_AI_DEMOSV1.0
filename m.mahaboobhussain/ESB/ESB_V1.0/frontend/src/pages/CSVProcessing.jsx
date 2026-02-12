import { useState, useEffect, useRef } from 'react';
import { Upload, Play, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Eye, RefreshCw } from 'lucide-react';
import { sampleFilesApi, csvProcessingApi } from '../services/api';

export default function CSVProcessing() {
  const [fileDefinitions, setFileDefinitions] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState('');
  const [csvContent, setCsvContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState(null);
  const [parseResult, setParseResult] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [processResult, setProcessResult] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loadedFile, setLoadedFile] = useState(null); // Track loaded file info
  const fileInputRef = useRef();

  const selectedFile = fileDefinitions.find(f => f.id === selectedFileId);

  useEffect(() => {
    loadFileDefinitions();
  }, []);

  async function loadFileDefinitions() {
    setLoading(true);
    try {
      const data = await sampleFilesApi.getAll();
      setFileDefinitions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Check if same file is already loaded - block it
    if (loadedFile &&
        loadedFile.name === file.name &&
        loadedFile.size === file.size &&
        loadedFile.lastModified === file.lastModified) {
      alert(`File "${file.name}" is already loaded. Please select a different file or click Clear to reset.`);
      e.target.value = ''; // Reset input
      return; // Block loading
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvContent(event.target.result);
      // Store file metadata for tracking
      setLoadedFile({
        name: file.name,
        size: file.size,
        lastModified: file.lastModified
      });
      setParseResult(null);
      setValidationResult(null);
      setProcessResult(null);
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input to allow re-selection of different files
  }

  async function handleParse() {
    if (!csvContent.trim()) {
      alert('Please provide CSV content');
      return;
    }

    setValidating(true);
    setParseResult(null);
    setValidationResult(null);

    try {
      const options = selectedFile ? selectedFile.fileFormat : {};
      const result = await csvProcessingApi.parse(csvContent, options);
      setParseResult(result);
      setShowPreview(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setValidating(false);
    }
  }

  async function handleValidate() {
    if (!selectedFileId) {
      alert('Please select a file definition');
      return;
    }
    if (!csvContent.trim()) {
      alert('Please provide CSV content');
      return;
    }

    setValidating(true);
    setValidationResult(null);

    try {
      const result = await csvProcessingApi.validate(selectedFileId, csvContent);
      setValidationResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setValidating(false);
    }
  }

  async function handleProcess() {
    if (!selectedFileId) {
      alert('Please select a file definition');
      return;
    }
    if (!csvContent.trim()) {
      alert('Please provide CSV content');
      return;
    }

    setProcessing(true);
    setProcessResult(null);
    setError(null);

    try {
      const result = await csvProcessingApi.process(selectedFileId, csvContent, {
        batchSize: 5,
        delayBetweenBatches: 200,
        fileName: loadedFile?.name || 'Pasted Content',
        fileSize: loadedFile?.size || csvContent.length
      });
      setProcessResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  }

  function clearAll() {
    setCsvContent('');
    setLoadedFile(null); // Reset loaded file - allows same file to be loaded again
    setParseResult(null);
    setValidationResult(null);
    setProcessResult(null);
    setError(null);
    setShowPreview(false);
  }

  if (loading) {
    return <div className="card text-center">Loading...</div>;
  }

  return (
    <div className="csv-processing-page">
      <div className="page-header">
        <h1>CSV File Processing</h1>
        <p className="text-muted">Process CSV files by calling APIs for each row</p>
      </div>

      {error && (
        <div className="card" style={{ background: '#fef2f2', borderColor: '#fecaca', marginBottom: '1rem' }}>
          <p style={{ color: '#dc2626' }}>{error}</p>
          <button className="btn btn-secondary btn-sm" onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Left Column - Configuration */}
        <div>
          <div className="card mb-2">
            <h3 className="mb-1">1. Select File Definition</h3>
            <select
              className="form-control"
              value={selectedFileId}
              onChange={e => {
                setSelectedFileId(e.target.value);
                setValidationResult(null);
                setProcessResult(null);
              }}
            >
              <option value="">Select a file definition...</option>
              {fileDefinitions.map(file => (
                <option key={file.id} value={file.id}>
                  {file.name} ({file.columns?.length || 0} columns)
                </option>
              ))}
            </select>

            {selectedFile && (
              <div className="mt-1">
                <p className="text-sm text-muted">
                  Target API: <strong>{selectedFile.targetApi?.apiSampleName || 'Not configured'}</strong>
                </p>
                <p className="text-sm text-muted">
                  Delimiter: <strong>{selectedFile.fileFormat?.delimiter === ',' ? 'Comma' : selectedFile.fileFormat?.delimiter}</strong>
                </p>
                <p className="text-sm text-muted">
                  Mapped fields: <strong>{Object.keys(selectedFile.fieldMapping || {}).length}</strong>
                </p>
              </div>
            )}
          </div>

          <div className="card mb-2">
            <h3 className="mb-1">2. Upload CSV File</h3>
            <div
              className="dropzone"
              onClick={() => fileInputRef.current?.click()}
              style={{ marginBottom: '0.5rem' }}
            >
              <Upload size={32} className="dropzone-icon" />
              <p>Click to upload or drag and drop</p>
              <p className="hint">CSV files only</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />

            {loadedFile && (
              <div style={{ padding: '0.5rem', background: '#f0f9ff', borderRadius: '0.25rem', marginBottom: '0.5rem' }}>
                <p className="text-sm" style={{ margin: 0 }}>
                  <strong>Loaded:</strong> {loadedFile.name} ({(loadedFile.size / 1024).toFixed(1)} KB)
                </p>
              </div>
            )}

            <label className="text-sm">Or paste CSV content:</label>
            <textarea
              className="form-control"
              value={csvContent}
              onChange={e => {
                setCsvContent(e.target.value);
                setParseResult(null);
                setValidationResult(null);
                setProcessResult(null);
              }}
              placeholder="Paste CSV content here..."
              style={{ minHeight: '150px', fontFamily: 'monospace', fontSize: '12px' }}
            />
          </div>

          <div className="card">
            <h3 className="mb-1">3. Process</h3>
            <div className="flex gap-1">
              <button
                className="btn btn-secondary"
                onClick={handleParse}
                disabled={!csvContent.trim() || validating}
              >
                <Eye size={16} />
                Preview
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleValidate}
                disabled={!selectedFileId || !csvContent.trim() || validating}
              >
                <AlertCircle size={16} />
                Validate
              </button>
              <button
                className="btn btn-primary"
                onClick={handleProcess}
                disabled={!selectedFileId || !csvContent.trim() || processing}
              >
                {processing ? <RefreshCw size={16} className="spinning" /> : <Play size={16} />}
                {processing ? 'Processing...' : 'Process File'}
              </button>
              <button className="btn btn-secondary" onClick={clearAll}>
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Results */}
        <div>
          {/* Parse Preview */}
          {parseResult && showPreview && (
            <div className="card mb-2">
              <div className="card-header">
                <h3>CSV Preview</h3>
                <span className="badge badge-info">{parseResult.rowCount} rows</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>#</th>
                      {parseResult.headers.map((header, i) => (
                        <th key={i}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parseResult.sampleRows.map((row, i) => (
                      <tr key={i}>
                        <td>{row.rowIndex}</td>
                        {parseResult.headers.map((header, j) => (
                          <td key={j}>{row.data[header]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parseResult.rowCount > 5 && (
                <p className="text-sm text-muted text-center">Showing first 5 of {parseResult.rowCount} rows</p>
              )}
            </div>
          )}

          {/* Validation Result */}
          {validationResult && (
            <div className="card mb-2" style={{
              background: validationResult.valid ? '#f0fdf4' : '#fef2f2',
              borderColor: validationResult.valid ? '#86efac' : '#fecaca'
            }}>
              <div className="flex gap-1" style={{ alignItems: 'center' }}>
                {validationResult.valid ? (
                  <CheckCircle size={20} style={{ color: '#16a34a' }} />
                ) : (
                  <XCircle size={20} style={{ color: '#dc2626' }} />
                )}
                <h3 style={{ color: validationResult.valid ? '#16a34a' : '#dc2626' }}>
                  {validationResult.valid ? 'Validation Passed' : 'Validation Failed'}
                </h3>
              </div>

              {validationResult.missing.length > 0 && (
                <div className="mt-1">
                  <p className="text-sm"><strong>Missing columns:</strong></p>
                  <ul className="text-sm" style={{ marginLeft: '1rem' }}>
                    {validationResult.missing.map((col, i) => (
                      <li key={i} style={{ color: '#dc2626' }}>{col}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validationResult.extra.length > 0 && (
                <div className="mt-1">
                  <p className="text-sm"><strong>Extra columns (not in definition):</strong></p>
                  <ul className="text-sm" style={{ marginLeft: '1rem' }}>
                    {validationResult.extra.map((col, i) => (
                      <li key={i} style={{ color: '#d97706' }}>{col}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Processing Result */}
          {processResult && (
            <div className="card">
              <div className="card-header">
                <h3>Processing Results</h3>
              </div>

              <div className="grid grid-3 mb-2" style={{ gap: '0.5rem' }}>
                <div className="stat-card" style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>{processResult.successfulRows}</div>
                  <div className="text-sm text-muted">Successful</div>
                </div>
                <div className="stat-card" style={{ background: '#fef2f2', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>{processResult.failedRows}</div>
                  <div className="text-sm text-muted">Failed</div>
                </div>
                <div className="stat-card" style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0284c7' }}>{processResult.totalRows}</div>
                  <div className="text-sm text-muted">Total</div>
                </div>
              </div>

              <h4 className="mb-1">Row Results</h4>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="table" style={{ fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Status</th>
                      <th>Duration</th>
                      <th>Captured Fields</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processResult.results.map((row, i) => (
                      <tr key={i}>
                        <td>{row.rowIndex}</td>
                        <td>
                          {row.success ? (
                            <span className="badge badge-success"><CheckCircle size={12} /> Success</span>
                          ) : (
                            <span className="badge badge-danger"><XCircle size={12} /> Failed</span>
                          )}
                        </td>
                        <td>{row.duration}</td>
                        <td>
                          {row.capturedFields && Object.keys(row.capturedFields).length > 0 ? (
                            <div className="text-sm">
                              {Object.entries(row.capturedFields).map(([key, value], j) => (
                                <div key={j}><strong>{key}:</strong> {String(value)}</div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          {row.error ? (
                            <span className="text-sm" style={{ color: '#dc2626' }}>{row.error}</span>
                          ) : row.response ? (
                            <span className="text-sm">{row.response.status} {row.response.statusText}</span>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!parseResult && !validationResult && !processResult && (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon"><FileSpreadsheet size={48} /></div>
                <p>No results yet</p>
                <p className="text-sm">Select a file definition and upload a CSV to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
