import type { ExtensionPack } from '../extensionStore';

export const securityCompliancePack: ExtensionPack = {
  id: 'security-compliance',
  name: 'Security & Compliance',
  builtIn: true,
  icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32 6 L52 16 L52 34 A22 22 0 0 1 32 58 A22 22 0 0 1 12 34 L12 16 Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><polyline points="22,32 30,40 42,24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  items: [
    // -----------------------------------------------------------------------
    // Authentication & Access
    // -----------------------------------------------------------------------
    {
      id: 'sec-lock',
      name: 'Lock / Encryption',
      viewBox: '0 0 64 64',
      defaultWidth: 64,
      defaultHeight: 80,
      tags: ['lock', 'encryption', 'secure', 'padlock', 'protect'],
      svgContent:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<path d="M18 26 L18 18 A14 14 0 0 1 46 18 L46 26" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>' +
        '<rect x="12" y="26" width="40" height="30" rx="3" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
        '<circle cx="32" cy="40" r="4" fill="currentColor"/>' +
        '<line x1="32" y1="44" x2="32" y2="50" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>' +
        '</svg>',
    },
    {
      id: 'sec-key',
      name: 'Key / Certificate',
      viewBox: '0 0 64 64',
      defaultWidth: 80,
      defaultHeight: 64,
      tags: ['key', 'certificate', 'ssl', 'tls', 'credential'],
      svgContent:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<circle cx="20" cy="32" r="12" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
        '<circle cx="20" cy="32" r="5" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
        '<line x1="32" y1="32" x2="56" y2="32" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>' +
        '<line x1="48" y1="32" x2="48" y2="24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
        '<line x1="56" y1="32" x2="56" y2="24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
        '</svg>',
    },
    {
      id: 'sec-iam',
      name: 'Identity & Access',
      viewBox: '0 0 64 64',
      defaultWidth: 80,
      defaultHeight: 80,
      tags: ['iam', 'identity', 'access', 'authentication', 'authorization'],
      svgContent:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<circle cx="24" cy="18" r="8" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
        '<path d="M10 44 Q10 32 24 30 Q38 32 38 44" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
        // Shield badge
        '<path d="M44 14 L56 20 L56 32 A14 14 0 0 1 44 44 A14 14 0 0 1 32 32 L32 20 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>' +
        '<polyline points="38,28 43,33 52,24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>',
    },
    {
      id: 'sec-mfa',
      name: 'Multi-Factor Auth',
      viewBox: '0 0 64 64',
      defaultWidth: 80,
      defaultHeight: 80,
      tags: ['mfa', '2fa', 'two factor', 'authentication', 'otp'],
      svgContent:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<rect x="20" y="10" width="24" height="44" rx="3" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
        '<line x1="20" y1="20" x2="44" y2="20" stroke="currentColor" stroke-width="1.5"/>' +
        '<line x1="20" y1="44" x2="44" y2="44" stroke="currentColor" stroke-width="1.5"/>' +
        // OTP code
        '<rect x="24" y="28" width="6" height="10" rx="1" fill="currentColor" opacity="0.6"/>' +
        '<rect x="33" y="28" width="6" height="10" rx="1" fill="currentColor" opacity="0.4"/>' +
        '<circle cx="32" cy="50" r="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
        '</svg>',
    },
    {
      id: 'sec-token',
      name: 'Token / OAuth',
      viewBox: '0 0 64 64',
      defaultWidth: 64,
      defaultHeight: 64,
      tags: ['token', 'oauth', 'jwt', 'bearer', 'session'],
      svgContent:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<circle cx="32" cy="32" r="20" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
        '<circle cx="32" cy="32" r="12" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
        '<polygon points="32,20 35,26 32,24 29,26" fill="currentColor"/>' +
        '<polygon points="44,32 38,35 40,32 38,29" fill="currentColor"/>' +
        '<polygon points="32,44 29,38 32,40 35,38" fill="currentColor"/>' +
        '<polygon points="20,32 26,29 24,32 26,35" fill="currentColor"/>' +
        '</svg>',
    },
    // -----------------------------------------------------------------------
    // Compliance & Audit
    // -----------------------------------------------------------------------
    {
      id: 'sec-audit-log',
      name: 'Audit Log',
      viewBox: '0 0 64 64',
      defaultWidth: 70,
      defaultHeight: 90,
      tags: ['audit', 'log', 'trail', 'record', 'history'],
      svgContent:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<rect x="10" y="4" width="36" height="56" rx="3" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
        '<line x1="16" y1="16" x2="40" y2="16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
        '<line x1="16" y1="24" x2="38" y2="24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>' +
        '<line x1="16" y1="32" x2="40" y2="32" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>' +
        '<line x1="16" y1="40" x2="36" y2="40" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>' +
        '<line x1="16" y1="48" x2="40" y2="48" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>' +
        // Checkmark badge
        '<circle cx="50" cy="44" r="10" fill="none" stroke="currentColor" stroke-width="2"/>' +
        '<polyline points="44,44 48,48 56,40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>',
    },
    {
      id: 'sec-compliance',
      name: 'Compliance',
      viewBox: '0 0 64 64',
      defaultWidth: 70,
      defaultHeight: 90,
      tags: ['compliance', 'standards', 'regulation', 'gdpr', 'hipaa'],
      svgContent:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<rect x="14" y="4" width="36" height="56" rx="3" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
        '<polyline points="22,16 26,20 34,12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<polyline points="22,28 26,32 34,24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<polyline points="22,40 26,44 34,36" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<line x1="38" y1="16" x2="44" y2="16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>' +
        '<line x1="38" y1="28" x2="44" y2="28" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>' +
        '<line x1="38" y1="40" x2="44" y2="40" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>' +
        '</svg>',
    },
    {
      id: 'sec-policy',
      name: 'Security Policy',
      viewBox: '0 0 64 64',
      defaultWidth: 70,
      defaultHeight: 90,
      tags: ['policy', 'rule', 'governance', 'regulation', 'standard'],
      svgContent:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<rect x="12" y="4" width="40" height="56" rx="3" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
        '<path d="M32 14 L40 18 L40 26 A10 10 0 0 1 32 34 A10 10 0 0 1 24 26 L24 18 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>' +
        '<line x1="18" y1="42" x2="46" y2="42" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>' +
        '<line x1="18" y1="50" x2="40" y2="50" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>' +
        '</svg>',
    },
    // -----------------------------------------------------------------------
    // Threats & Defense
    // -----------------------------------------------------------------------
    {
      id: 'sec-shield',
      name: 'Shield / Defense',
      viewBox: '0 0 64 64',
      defaultWidth: 64,
      defaultHeight: 80,
      tags: ['shield', 'defense', 'protect', 'guard', 'waf'],
      svgContent:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<path d="M32 6 L52 16 L52 34 A22 22 0 0 1 32 58 A22 22 0 0 1 12 34 L12 16 Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<polyline points="22,32 30,40 42,24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>',
    },
    {
      id: 'sec-vulnerability',
      name: 'Vulnerability',
      viewBox: '0 0 64 64',
      defaultWidth: 64,
      defaultHeight: 80,
      tags: ['vulnerability', 'bug', 'exploit', 'cve', 'weakness'],
      svgContent:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<path d="M32 6 L52 16 L52 34 A22 22 0 0 1 32 58 A22 22 0 0 1 12 34 L12 16 Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>' +
        // Warning exclamation
        '<line x1="32" y1="20" x2="32" y2="38" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
        '<circle cx="32" cy="46" r="2.5" fill="currentColor"/>' +
        '</svg>',
    },
    {
      id: 'sec-scanner',
      name: 'Security Scanner',
      viewBox: '0 0 64 64',
      defaultWidth: 80,
      defaultHeight: 80,
      tags: ['scanner', 'scan', 'sast', 'dast', 'code review'],
      svgContent:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<circle cx="28" cy="28" r="16" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
        '<line x1="40" y1="40" x2="54" y2="54" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
        // Scan lines
        '<line x1="20" y1="22" x2="36" y2="22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>' +
        '<line x1="20" y1="28" x2="36" y2="28" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>' +
        '<line x1="20" y1="34" x2="32" y2="34" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>' +
        '</svg>',
    },
    {
      id: 'sec-incident',
      name: 'Security Incident',
      viewBox: '0 0 64 64',
      defaultWidth: 64,
      defaultHeight: 64,
      tags: ['incident', 'breach', 'attack', 'threat', 'alert'],
      svgContent:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<polygon points="32,6 58,54 6,54" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<line x1="32" y1="22" x2="32" y2="38" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
        '<circle cx="32" cy="46" r="2.5" fill="currentColor"/>' +
        '</svg>',
    },
    // -----------------------------------------------------------------------
    // Data Protection
    // -----------------------------------------------------------------------
    {
      id: 'sec-data-mask',
      name: 'Data Masking',
      viewBox: '0 0 64 64',
      defaultWidth: 80,
      defaultHeight: 64,
      tags: ['data masking', 'redact', 'anonymize', 'privacy', 'pii'],
      svgContent:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<rect x="6" y="12" width="52" height="40" rx="3" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
        '<line x1="12" y1="24" x2="28" y2="24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
        '<rect x="34" y="20" width="18" height="8" rx="2" fill="currentColor" opacity="0.3"/>' +
        '<line x1="12" y1="36" x2="22" y2="36" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
        '<rect x="28" y="32" width="24" height="8" rx="2" fill="currentColor" opacity="0.3"/>' +
        '<line x1="12" y1="44" x2="30" y2="44" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>' +
        '</svg>',
    },
    {
      id: 'sec-backup',
      name: 'Backup / Recovery',
      viewBox: '0 0 64 64',
      defaultWidth: 80,
      defaultHeight: 80,
      tags: ['backup', 'recovery', 'disaster recovery', 'restore', 'dr'],
      svgContent:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<ellipse cx="32" cy="16" rx="18" ry="8" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
        '<path d="M14 16 V44 A18 8 0 0 0 50 44 V16" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
        // Circular arrow (recovery)
        '<path d="M38 44 A10 10 0 1 1 42 34" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
        '<polygon points="44,34 42,38 40,34" fill="currentColor"/>' +
        '</svg>',
    },
  ],
};
