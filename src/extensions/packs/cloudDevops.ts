import type { ExtensionPack } from '../extensionStore';

export const cloudDevopsPack: ExtensionPack = {
  id: 'cloud-devops',
  name: 'Cloud & DevOps',
  builtIn: true,
  icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M16 44 A14 14 0 1 1 44 28 A10 10 0 1 1 52 44 Z" fill="none" stroke="currentColor" stroke-width="2.5"/><polyline points="24,36 32,28 40,36" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  items: [
    // -----------------------------------------------------------------------
    // Compute & Containers
    // -----------------------------------------------------------------------
    {
      id: 'cd-compute',
      name: 'Compute Instance',
      viewBox: '0 0 64 64',
      defaultWidth: 80,
      defaultHeight: 80,
      tags: ['compute', 'vm', 'instance', 'virtual machine', 'server'],
      svgContent:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<rect x="12" y="10" width="40" height="44" rx="4" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
        '<line x1="12" y1="28" x2="52" y2="28" stroke="currentColor" stroke-width="1.5"/>' +
        '<circle cx="20" cy="18" r="2.5" fill="currentColor"/>' +
        '<circle cx="32" cy="18" r="2.5" fill="currentColor" opacity="0.6"/>' +
        '<circle cx="44" cy="18" r="2.5" fill="currentColor" opacity="0.3"/>' +
        '<line x1="18" y1="36" x2="46" y2="36" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>' +
        '<line x1="18" y1="44" x2="38" y2="44" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>' +
        '</svg>',
    },
    {
      id: 'cd-serverless',
      name: 'Serverless Function',
      viewBox: '0 0 64 64',
      defaultWidth: 80,
      defaultHeight: 80,
      tags: ['serverless', 'lambda', 'function', 'faas', 'cloud function'],
      svgContent:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<polygon points="32,6 56,20 56,48 32,58 8,48 8,20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>' +
        // Lambda symbol
        '<path d="M24,22 L32,42 L40,22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<line x1="20" y1="22" x2="44" y2="22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>' +
        '</svg>',
    },
    {
      id: 'cd-container-registry',
      name: 'Container Registry',
      viewBox: '0 0 64 64',
      defaultWidth: 80,
      defaultHeight: 80,
      tags: ['container', 'registry', 'docker', 'image', 'repository'],
      svgContent:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<rect x="8" y="8" width="48" height="48" rx="4" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
        '<rect x="14" y="14" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
        '<rect x="34" y="14" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
        '<rect x="14" y="34" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
        '<rect x="34" y="34" width="14" height="14" rx="2" fill="currentColor" opacity="0.2"/>' +
        '<rect x="34" y="34" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
        '</svg>',
    },
    // -----------------------------------------------------------------------
    // Storage
    // -----------------------------------------------------------------------
    {
      id: 'cd-object-storage',
      name: 'Object Storage',
      viewBox: '0 0 64 64',
      defaultWidth: 80,
      defaultHeight: 80,
      tags: ['object storage', 's3', 'bucket', 'blob', 'files'],
      svgContent:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<ellipse cx="32" cy="14" rx="22" ry="8" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
        '<path d="M10 14 V50 A22 8 0 0 0 54 50 V14" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
        '<ellipse cx="32" cy="32" rx="22" ry="8" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>' +
        '</svg>',
    },
    {
      id: 'cd-block-storage',
      name: 'Block Storage',
      viewBox: '0 0 64 64',
      defaultWidth: 80,
      defaultHeight: 80,
      tags: ['block storage', 'disk', 'volume', 'ebs', 'persistent'],
      svgContent:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<rect x="8" y="8" width="48" height="48" rx="3" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
        '<line x1="8" y1="24" x2="56" y2="24" stroke="currentColor" stroke-width="1.5"/>' +
        '<line x1="8" y1="40" x2="56" y2="40" stroke="currentColor" stroke-width="1.5"/>' +
        '<circle cx="48" cy="16" r="3" fill="currentColor" opacity="0.6"/>' +
        '<circle cx="48" cy="32" r="3" fill="currentColor" opacity="0.6"/>' +
        '<circle cx="48" cy="48" r="3" fill="currentColor" opacity="0.6"/>' +
        '</svg>',
    },
    // -----------------------------------------------------------------------
    // CI/CD & Pipelines
    // -----------------------------------------------------------------------
    {
      id: 'cd-cicd-pipeline',
      name: 'CI/CD Pipeline',
      viewBox: '0 0 64 64',
      defaultWidth: 100,
      defaultHeight: 60,
      tags: ['cicd', 'pipeline', 'build', 'deploy', 'automation'],
      svgContent:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<rect x="4" y="22" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>' +
        '<line x1="18" y1="29" x2="24" y2="29" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
        '<rect x="24" y="22" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>' +
        '<line x1="38" y1="29" x2="44" y2="29" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
        '<rect x="44" y="22" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>' +
        '<polyline points="8,14 8,22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
        '<polyline points="56,36 56,46" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
        '<polygon points="54,46 56,50 58,46" fill="currentColor"/>' +
        '</svg>',
    },
    {
      id: 'cd-git-repo',
      name: 'Git Repository',
      viewBox: '0 0 64 64',
      defaultWidth: 64,
      defaultHeight: 64,
      tags: ['git', 'repository', 'repo', 'version control', 'source code'],
      svgContent:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<circle cx="32" cy="14" r="6" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
        '<circle cx="18" cy="48" r="6" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
        '<circle cx="46" cy="48" r="6" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
        '<line x1="32" y1="20" x2="18" y2="42" stroke="currentColor" stroke-width="2"/>' +
        '<line x1="32" y1="20" x2="46" y2="42" stroke="currentColor" stroke-width="2"/>' +
        '</svg>',
    },
    {
      id: 'cd-artifact-registry',
      name: 'Artifact Registry',
      viewBox: '0 0 64 64',
      defaultWidth: 80,
      defaultHeight: 80,
      tags: ['artifact', 'registry', 'package', 'npm', 'maven'],
      svgContent:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<rect x="8" y="8" width="48" height="48" rx="4" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
        '<line x1="8" y1="24" x2="56" y2="24" stroke="currentColor" stroke-width="1.5"/>' +
        '<rect x="14" y="12" width="8" height="8" rx="1" fill="currentColor" opacity="0.6"/>' +
        '<rect x="26" y="12" width="8" height="8" rx="1" fill="currentColor" opacity="0.4"/>' +
        '<rect x="38" y="12" width="8" height="8" rx="1" fill="currentColor" opacity="0.3"/>' +
        '<line x1="14" y1="34" x2="50" y2="34" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>' +
        '<line x1="14" y1="42" x2="40" y2="42" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>' +
        '<line x1="14" y1="50" x2="34" y2="50" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>' +
        '</svg>',
    },
    // -----------------------------------------------------------------------
    // Monitoring & Observability
    // -----------------------------------------------------------------------
    {
      id: 'cd-monitoring',
      name: 'Monitoring',
      viewBox: '0 0 64 64',
      defaultWidth: 90,
      defaultHeight: 70,
      tags: ['monitoring', 'observability', 'metrics', 'grafana', 'dashboard'],
      svgContent:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<rect x="4" y="8" width="56" height="40" rx="3" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
        '<polyline points="10,40 18,28 26,34 34,16 42,30 50,22 56,26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<circle cx="34" cy="16" r="2.5" fill="currentColor"/>' +
        '<line x1="20" y1="52" x2="44" y2="52" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
        '</svg>',
    },
    {
      id: 'cd-logging',
      name: 'Log Aggregation',
      viewBox: '0 0 64 64',
      defaultWidth: 70,
      defaultHeight: 90,
      tags: ['logging', 'logs', 'aggregation', 'elk', 'splunk'],
      svgContent:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<rect x="10" y="4" width="44" height="56" rx="3" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
        '<line x1="16" y1="14" x2="48" y2="14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
        '<line x1="16" y1="22" x2="44" y2="22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.7"/>' +
        '<line x1="16" y1="30" x2="48" y2="30" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>' +
        '<line x1="16" y1="38" x2="40" y2="38" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>' +
        '<line x1="16" y1="46" x2="46" y2="46" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>' +
        '<circle cx="12" cy="14" r="1.5" fill="currentColor"/>' +
        '<circle cx="12" cy="22" r="1.5" fill="currentColor" opacity="0.7"/>' +
        '<circle cx="12" cy="30" r="1.5" fill="currentColor" opacity="0.6"/>' +
        '</svg>',
    },
    {
      id: 'cd-alerting',
      name: 'Alerting',
      viewBox: '0 0 64 64',
      defaultWidth: 64,
      defaultHeight: 70,
      tags: ['alert', 'alarm', 'notification', 'pagerduty', 'incident'],
      svgContent:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<path d="M16 40 L16 26 A16 16 0 0 1 48 26 L48 40 L52 46 L12 46 Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<line x1="32" y1="6" x2="32" y2="10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>' +
        '<path d="M26 46 A6 6 0 0 0 38 46" fill="none" stroke="currentColor" stroke-width="2"/>' +
        '</svg>',
    },
    // -----------------------------------------------------------------------
    // Configuration & Infrastructure
    // -----------------------------------------------------------------------
    {
      id: 'cd-config-mgmt',
      name: 'Configuration',
      viewBox: '0 0 64 64',
      defaultWidth: 64,
      defaultHeight: 64,
      tags: ['configuration', 'config', 'settings', 'terraform', 'ansible'],
      svgContent:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<circle cx="32" cy="32" r="20" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
        '<circle cx="32" cy="32" r="8" fill="none" stroke="currentColor" stroke-width="2"/>' +
        '<line x1="32" y1="12" x2="32" y2="4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>' +
        '<line x1="52" y1="32" x2="60" y2="32" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>' +
        '<line x1="32" y1="52" x2="32" y2="60" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>' +
        '<line x1="12" y1="32" x2="4" y2="32" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>' +
        '</svg>',
    },
    {
      id: 'cd-secret-vault',
      name: 'Secrets Vault',
      viewBox: '0 0 64 64',
      defaultWidth: 70,
      defaultHeight: 80,
      tags: ['secrets', 'vault', 'credentials', 'keys', 'password'],
      svgContent:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<rect x="10" y="24" width="44" height="32" rx="4" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
        '<path d="M20 24 V18 A12 12 0 0 1 44 18 V24" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
        '<circle cx="32" cy="38" r="5" fill="none" stroke="currentColor" stroke-width="2"/>' +
        '<line x1="32" y1="43" x2="32" y2="50" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>' +
        '</svg>',
    },
    {
      id: 'cd-iac',
      name: 'Infra as Code',
      viewBox: '0 0 64 64',
      defaultWidth: 70,
      defaultHeight: 90,
      tags: ['infrastructure as code', 'iac', 'terraform', 'cloudformation', 'pulumi'],
      svgContent:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<rect x="12" y="4" width="40" height="56" rx="3" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
        '<path d="M20 18 L26 24 L20 30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<line x1="30" y1="30" x2="42" y2="30" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M20 38 L26 44 L20 50" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>' +
        '<line x1="30" y1="50" x2="38" y2="50" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.6"/>' +
        '</svg>',
    },
    // -----------------------------------------------------------------------
    // Networking & CDN
    // -----------------------------------------------------------------------
    {
      id: 'cd-service-mesh',
      name: 'Service Mesh',
      viewBox: '0 0 64 64',
      defaultWidth: 80,
      defaultHeight: 80,
      tags: ['service mesh', 'istio', 'envoy', 'linkerd', 'sidecar'],
      svgContent:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<circle cx="16" cy="16" r="6" fill="none" stroke="currentColor" stroke-width="2"/>' +
        '<circle cx="48" cy="16" r="6" fill="none" stroke="currentColor" stroke-width="2"/>' +
        '<circle cx="16" cy="48" r="6" fill="none" stroke="currentColor" stroke-width="2"/>' +
        '<circle cx="48" cy="48" r="6" fill="none" stroke="currentColor" stroke-width="2"/>' +
        '<circle cx="32" cy="32" r="6" fill="none" stroke="currentColor" stroke-width="2"/>' +
        '<line x1="22" y1="16" x2="26" y2="28" stroke="currentColor" stroke-width="1.5"/>' +
        '<line x1="42" y1="16" x2="38" y2="28" stroke="currentColor" stroke-width="1.5"/>' +
        '<line x1="22" y1="48" x2="26" y2="36" stroke="currentColor" stroke-width="1.5"/>' +
        '<line x1="42" y1="48" x2="38" y2="36" stroke="currentColor" stroke-width="1.5"/>' +
        '<line x1="22" y1="16" x2="42" y2="16" stroke="currentColor" stroke-width="1" opacity="0.6"/>' +
        '<line x1="22" y1="48" x2="42" y2="48" stroke="currentColor" stroke-width="1" opacity="0.6"/>' +
        '<line x1="16" y1="22" x2="16" y2="42" stroke="currentColor" stroke-width="1" opacity="0.6"/>' +
        '<line x1="48" y1="22" x2="48" y2="42" stroke="currentColor" stroke-width="1" opacity="0.6"/>' +
        '</svg>',
    },
    {
      id: 'cd-message-broker',
      name: 'Message Broker',
      viewBox: '0 0 64 64',
      defaultWidth: 80,
      defaultHeight: 80,
      tags: ['message broker', 'kafka', 'rabbitmq', 'pubsub', 'event bus'],
      svgContent:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<rect x="18" y="12" width="28" height="40" rx="3" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
        '<line x1="18" y1="24" x2="46" y2="24" stroke="currentColor" stroke-width="1.5"/>' +
        '<line x1="18" y1="36" x2="46" y2="36" stroke="currentColor" stroke-width="1.5"/>' +
        // Arrows in/out
        '<line x1="4" y1="18" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
        '<polygon points="16,15 18,18 16,21" fill="currentColor"/>' +
        '<line x1="46" y1="30" x2="60" y2="30" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
        '<polygon points="58,27 60,30 58,33" fill="currentColor"/>' +
        '<line x1="4" y1="42" x2="18" y2="42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
        '<polygon points="16,39 18,42 16,45" fill="currentColor"/>' +
        '</svg>',
    },
  ],
};
