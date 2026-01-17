// Swagger/OpenAPI Types for API Testing

export interface SwaggerSpec {
  swagger: string
  info: {
    description: string
    version: string
    title: string
  }
  host: string
  basePath: string
  tags: Array<{ name: string }>
  schemes: string[]
  security: any[]
  paths: Record<string, PathItem>
  definitions?: Record<string, any>
}

export interface PathItem {
  get?: Operation
  post?: Operation
  put?: Operation
  patch?: Operation
  delete?: Operation
}

export interface Operation {
  tags: string[]
  summary: string
  description: string
  operationId: string
  produces?: string[]
  consumes?: string[]
  parameters?: Parameter[]
  responses: Record<string, Response>
}

export interface Parameter {
  name: string
  in: 'path' | 'query' | 'header' | 'body' | 'formData'
  description: string
  required: boolean
  type?: string
  format?: string
  schema?: any
  example?: any
}

export interface Response {
  description: string
  schema?: any
  examples?: any
}

export interface ApiEndpoint {
  id: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  summary: string
  description: string
  parameters: Parameter[]
  tags: string[]
  operationId: string
}

export interface ApiRequest {
  endpoint: ApiEndpoint
  pathParams: Record<string, string>
  queryParams: Record<string, string>
  headers: Record<string, string>
  body?: any
}

export interface ApiResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  data: any
  duration: number
}
