export type CapabilityCategory =
  | 'agent-orchestration'
  | 'bridges-connectors'
  | 'provider-access'
  | 'reliability'
  | 'automation'
  | 'intelligence'
  | 'knowledge'
  | 'governance';

export type CapabilityMaturity = 'experimental' | 'verified' | 'production-proven';
export type CapabilityPortability = 'low' | 'medium' | 'high';
export type CapabilityExposure = 'public-safe' | 'operator-private';

export interface CapabilityEvidence {
  label: string;
  status: 'pass' | 'partial' | 'blocked';
  summary: string;
}

export interface CapabilityEntry {
  id: string;
  name: string;
  displayName?: string;
  category: CapabilityCategory;
  summary: string;
  problemSolved: string;
  maturity: CapabilityMaturity;
  portability: CapabilityPortability;
  runtimes: string[];
  interfaces: string[];
  dependencies: string[];
  tags: string[];
  evidence: CapabilityEvidence[];
  securityNotes: string[];
  secretsRequired: boolean;
  publicSafe: boolean;
  exposure: CapabilityExposure;
  reusable: boolean;
  integrationPattern: string;
  updatedAt: string;
}
