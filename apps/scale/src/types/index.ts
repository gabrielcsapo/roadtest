export type Status = 'active' | 'inactive' | 'pending' | 'archived'
export type Risk = 'low' | 'medium' | 'high' | 'critical'
export type ComplianceStatus = 'compliant' | 'non-compliant' | 'in-progress' | 'not-applicable'
export type Framework = 'SOC2' | 'ISO27001' | 'HIPAA' | 'GDPR' | 'PCI-DSS' | 'FedRAMP'

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'viewer'
  avatarUrl?: string
  department?: string
}

export interface Vendor {
  id: string
  name: string
  website: string
  status: Status
  riskLevel: Risk
  contactEmail: string
  lastReviewDate: string
  tags: string[]
  description?: string
  category: string
}

export interface Personnel {
  id: string
  name: string
  email: string
  department: string
  jobTitle: string
  startDate: string
  status: 'active' | 'offboarding' | 'offboarded'
  backgroundCheckStatus: 'pending' | 'passed' | 'failed' | 'not-required'
  manager?: User
}

export interface Policy {
  id: string
  title: string
  description: string
  status: ComplianceStatus
  owner: User
  lastUpdated: string
  version: string
  acceptanceRate: number
  frameworks: Framework[]
}

export interface Credential {
  id: string
  name: string
  type: 'api-key' | 'certificate' | 'password' | 'oauth-token'
  expiresAt: string | null
  status: 'valid' | 'expiring-soon' | 'expired'
  owner: User
  service: string
}

export interface AuditLog {
  id: string
  action: string
  actor: User
  target: string
  targetType: string
  timestamp: string
  metadata: Record<string, unknown>
}

export interface Issue {
  id: string
  title: string
  description: string
  severity: Risk
  status: 'open' | 'in-progress' | 'resolved' | 'wont-fix'
  assignee?: User
  dueDate?: string
  createdAt: string
  framework?: Framework
}

export interface Control {
  id: string
  name: string
  description: string
  framework: Framework
  status: ComplianceStatus
  evidence: string[]
  owner?: User
  dueDate?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiError {
  code: string
  message: string
  field?: string
}

export interface FilterOptions {
  search?: string
  status?: string[]
  risk?: Risk[]
  tags?: string[]
}

export interface SortOptions {
  field: string
  direction: 'asc' | 'desc'
}

export interface TableColumn<T> {
  key: keyof T
  label: string
  sortable?: boolean
  width?: number
}

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'select' | 'textarea' | 'checkbox'
  required?: boolean
  options?: SelectOption[]
}
