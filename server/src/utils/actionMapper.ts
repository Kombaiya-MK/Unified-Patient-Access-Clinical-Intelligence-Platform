/**
 * Action Mapper Utility
 * 
 * File: server/src/utils/actionMapper.ts
 * Purpose: Map HTTP methods and routes to audit action types
 * Task: US_011 TASK_001 - Immutable Audit Logging Service
 * 
 * Features:
 * - Map HTTP methods (GET, POST, PUT, DELETE) to audit actions
 * - Extract resource type and ID from request path
 * - Handle special routes (auth, search, export)
 * - Support collection vs. single resource operations
 */

import { AuditAction, ResourceInfo, RESOURCE_TYPE_MAP } from '../types/audit.types';

/**
 * Map HTTP Method to Audit Action
 * 
 * @param method - HTTP method (GET, POST, PUT, PATCH, DELETE)
 * @param path - Request path
 * @returns Audit action enum value
 * 
 * @example
 * ```typescript
 * mapHttpMethodToAction('POST', '/api/patients') // AuditAction.CREATE
 * mapHttpMethodToAction('GET', '/api/patients/123') // AuditAction.READ
 * mapHttpMethodToAction('PUT', '/api/patients/123') // AuditAction.UPDATE
 * mapHttpMethodToAction('DELETE', '/api/patients/123') // AuditAction.DELETE
 * ```
 */
export function mapHttpMethodToAction(method: string, path: string): AuditAction {
  const upperMethod = method.toUpperCase();
  const lowerPath = path.toLowerCase();
  
  // Special routes
  if (lowerPath.includes('/login')) {
    return AuditAction.LOGIN;
  }
  if (lowerPath.includes('/logout')) {
    return AuditAction.LOGOUT;
  }
  if (lowerPath.includes('/search')) {
    return AuditAction.SEARCH;
  }
  if (lowerPath.includes('/export')) {
    return AuditAction.EXPORT;
  }
  
  // Standard CRUD mapping
  switch (upperMethod) {
    case 'POST':
      return AuditAction.CREATE;
    case 'GET':
      return AuditAction.READ;
    case 'PUT':
    case 'PATCH':
      return AuditAction.UPDATE;
    case 'DELETE':
      return AuditAction.DELETE;
    default:
      return AuditAction.ACCESS;
  }
}

/**
 * Extract Resource Information from Path
 * 
 * @param path - Request path (e.g., '/api/patients/123')
 * @param params - Route parameters object
 * @returns ResourceInfo with type and ID
 * 
 * @example
 * ```typescript
 * extractResourceInfo('/api/patients/123', { id: '123' })
 * // { resourceType: 'patient', resourceId: '123' }
 * 
 * extractResourceInfo('/api/appointments', {})
 * // { resourceType: 'appointment', resourceId: null }
 * ```
 */
export function extractResourceInfo(
  path: string,
  params: Record<string, any> = {},
): ResourceInfo {
  // Remove leading/trailing slashes and split path
  const segments = path.replace(/^\/|\/$/g, '').split('/');
  
  // Find the resource segment (usually after 'api')
  let resourceSegment = '';
  let resourceId: string | null = null;
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    
    // Skip 'api' prefix
    if (segment === 'api') {
      continue;
    }
    
    // Check if this segment is a resource name (not a parameter)
    if (!segment.startsWith(':') && !isNumeric(segment) && !isUUID(segment)) {
      resourceSegment = segment;
      
      // Check if next segment is an ID
      if (i + 1 < segments.length) {
        const nextSegment = segments[i + 1];
        if (isNumeric(nextSegment) || isUUID(nextSegment)) {
          resourceId = nextSegment;
        }
      }
      
      break;
    }
  }
  
  // Extract ID from params if not found in path
  if (!resourceId && params.id) {
    resourceId = String(params.id);
  }
  
  // Map resource name to friendly type
  let resourceType = resourceSegment;
  if (RESOURCE_TYPE_MAP[resourceSegment]) {
    resourceType = RESOURCE_TYPE_MAP[resourceSegment];
  }
  
  // If no resource type found, use 'resource'
  if (!resourceType) {
    resourceType = 'resource';
  }
  
  // Collection operations have no resource ID
  if (!resourceId) {
    resourceId = 'collection';
  }
  
  return {
    resourceType,
    resourceId,
  };
}

/**
 * Check if string is numeric
 * 
 * @param value - String to check
 * @returns True if numeric
 */
function isNumeric(value: string): boolean {
  return /^\d+$/.test(value);
}

/**
 * Check if string is a UUID
 * 
 * @param value - String to check
 * @returns True if UUID format
 */
function isUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Determine if Operation is on Collection or Single Resource
 * 
 * @param resourceId - Resource ID from extractResourceInfo
 * @returns True if collection operation
 */
export function isCollectionOperation(resourceId: string | null): boolean {
  return !resourceId || resourceId === 'collection';
}

/**
 * Extract Table Name from Resource Type
 * Convert resource type back to table name
 * 
 * @param resourceType - Resource type (e.g., 'patient', 'appointment')
 * @returns Table name (e.g., 'patient_profiles', 'appointments')
 */
export function extractTableName(resourceType: string): string {
  // Reverse lookup in RESOURCE_TYPE_MAP
  for (const [tableName, mappedType] of Object.entries(RESOURCE_TYPE_MAP)) {
    if (mappedType === resourceType) {
      return tableName;
    }
  }
  
  // If not found in map, pluralize and return
  if (resourceType.endsWith('s')) {
    return resourceType;
  }
  
  return `${resourceType}s`;
}

/**
 * Build Audit Action Description
 * Create human-readable description of action
 * 
 * @param action - Audit action enum
 * @param resourceType - Resource type
 * @param resourceId - Resource ID
 * @returns Human-readable description
 * 
 * @example
 * ```typescript
 * buildActionDescription(AuditAction.CREATE, 'patient', '123')
 * // "Created patient 123"
 * 
 * buildActionDescription(AuditAction.READ, 'appointment', 'collection')
 * // "Listed appointments"
 * ```
 */
export function buildActionDescription(
  action: AuditAction,
  resourceType: string,
  resourceId: string | null,
): string {
  const isCollection = isCollectionOperation(resourceId);
  
  switch (action) {
    case AuditAction.CREATE:
      return `Created ${resourceType} ${resourceId}`;
    case AuditAction.READ:
      if (isCollection) {
        return `Listed ${resourceType}s`;
      }
      return `Viewed ${resourceType} ${resourceId}`;
    case AuditAction.UPDATE:
      return `Updated ${resourceType} ${resourceId}`;
    case AuditAction.DELETE:
      return `Deleted ${resourceType} ${resourceId}`;
    case AuditAction.SEARCH:
      return `Searched ${resourceType}s`;
    case AuditAction.EXPORT:
      return `Exported ${resourceType}s`;
    default:
      return `Accessed ${resourceType} ${resourceId || ''}`.trim();
  }
}

export default {
  mapHttpMethodToAction,
  extractResourceInfo,
  isCollectionOperation,
  extractTableName,
  buildActionDescription,
};
