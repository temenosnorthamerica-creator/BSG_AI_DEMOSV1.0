import { useState, useEffect } from 'react'
import {
  RefreshCw,
  Database as DatabaseIcon,
  Table as TableIcon,
  AlertCircle,
  Loader2,
  ChevronDown,
} from 'lucide-react'

interface DatabaseRecordsProps {
  componentId?: string
}

interface Table {
  schema: string
  name: string
  type: string
}

interface Column {
  name: string
  type: string
  max_length?: number
  nullable: boolean
  default?: string
}

interface TableData {
  columns: string[]
  data: Record<string, any>[]
  row_count: number
  total_rows?: number
}

export function DatabaseRecords({ componentId: _componentId }: DatabaseRecordsProps) {
  const [tables, setTables] = useState<Table[]>([])
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [tableData, setTableData] = useState<TableData | null>(null)
  const [_columns, setColumns] = useState<Column[]>([])
  const [loading, setLoading] = useState(false)
  const [tablesLoading, setTablesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<string>('unknown')
  const [limit, _setLimit] = useState(100)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    testConnection()
    loadTables()
  }, [])

  useEffect(() => {
    if (selectedTable) {
      loadTableData()
    }
  }, [selectedTable, limit, offset])

  const testConnection = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/database/connection/test')
      const data = await response.json()
      setConnectionStatus(data.status)
    } catch (err) {
      console.error('Connection test failed:', err)
      setConnectionStatus('failed')
    }
  }

  const loadTables = async () => {
    try {
      setTablesLoading(true)
      setError(null)
      const response = await fetch('http://localhost:8000/api/v1/database/tables')

      if (!response.ok) {
        throw new Error('Failed to fetch tables')
      }

      const data = await response.json()
      setTables(data)
    } catch (err: any) {
      console.error('Error loading tables:', err)
      setError(err.message || 'Failed to load tables')
    } finally {
      setTablesLoading(false)
    }
  }

  const loadTableData = async () => {
    if (!selectedTable) return

    try {
      setLoading(true)
      setError(null)

      // Fetch table data
      const dataResponse = await fetch(
        `http://localhost:8000/api/v1/database/tables/${selectedTable.name}/data?schema=${selectedTable.schema}&limit=${limit}&offset=${offset}`
      )

      if (!dataResponse.ok) {
        throw new Error('Failed to fetch table data')
      }

      const data = await dataResponse.json()
      setTableData(data)

      // Fetch column information
      const columnsResponse = await fetch(
        `http://localhost:8000/api/v1/database/tables/${selectedTable.name}/columns?schema=${selectedTable.schema}`
      )

      if (columnsResponse.ok) {
        const cols = await columnsResponse.json()
        setColumns(cols)
      }
    } catch (err: any) {
      console.error('Error loading table data:', err)
      setError(err.message || 'Failed to load table data')
    } finally {
      setLoading(false)
    }
  }

  const handleTableSelect = (table: Table) => {
    setSelectedTable(table)
    setOffset(0)
  }

  const handleRefresh = () => {
    if (selectedTable) {
      loadTableData()
    } else {
      loadTables()
    }
  }

  const handleNextPage = () => {
    if (tableData && tableData.row_count === limit) {
      setOffset(offset + limit)
    }
  }

  const handlePrevPage = () => {
    if (offset > 0) {
      setOffset(Math.max(0, offset - limit))
    }
  }

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return 'NULL'
    }
    if (typeof value === 'boolean') {
      return value ? 'TRUE' : 'FALSE'
    }
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }
    return String(value)
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Connection Status & Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${
            connectionStatus === 'connected'
              ? 'bg-green-500'
              : connectionStatus === 'failed'
              ? 'bg-red-500'
              : 'bg-yellow-500'
          }`} />
          <span className="text-sm text-gray-600">
            {connectionStatus === 'connected' && 'Connected to MSSQL Database'}
            {connectionStatus === 'failed' && 'Connection Failed'}
            {connectionStatus === 'unknown' && 'Checking connection...'}
          </span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading || tablesLoading}
          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${(loading || tablesLoading) ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Table Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Table
        </label>
        <div className="relative">
          <select
            className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-[#283054] focus:border-transparent"
            value={selectedTable ? `${selectedTable.schema}.${selectedTable.name}` : ''}
            onChange={(e) => {
              const [schema, name] = e.target.value.split('.')
              const table = tables.find(t => t.schema === schema && t.name === name)
              if (table) handleTableSelect(table)
            }}
            disabled={tablesLoading}
          >
            <option value="">Choose a table...</option>
            {tables.map((table) => (
              <option key={`${table.schema}.${table.name}`} value={`${table.schema}.${table.name}`}>
                {table.schema}.{table.name} ({table.type})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Data Display */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#283054]" />
        </div>
      ) : tableData && selectedTable ? (
        <div className="flex-1 flex flex-col space-y-4">
          {/* Table Info */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <TableIcon className="w-4 h-4" />
              <span className="font-medium">{selectedTable.schema}.{selectedTable.name}</span>
              <span>•</span>
              <span>{tableData.row_count} rows displayed</span>
              {tableData.total_rows && (
                <>
                  <span>•</span>
                  <span>{tableData.total_rows} total rows</span>
                </>
              )}
            </div>
          </div>

          {/* Data Table */}
          <div className="flex-1 overflow-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {tableData.columns.map((column) => (
                    <th
                      key={column}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tableData.data.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    {tableData.columns.map((column) => (
                      <td
                        key={column}
                        className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                      >
                        {formatValue(row[column])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {tableData.data.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <DatabaseIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No data available</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {tableData.total_rows && tableData.total_rows > limit && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {offset + 1} to {Math.min(offset + tableData.row_count, tableData.total_rows)} of {tableData.total_rows}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handlePrevPage}
                  disabled={offset === 0}
                  className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={offset + tableData.row_count >= tableData.total_rows}
                  className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <DatabaseIcon className="w-16 h-16 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Select a table to view its records</p>
          </div>
        </div>
      )}
    </div>
  )
}
