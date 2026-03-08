import type { ExtensionPack } from '../extensionStore';
import { networkInfraPack } from './networkInfra';
import { uxWireframePack } from './uxWireframe';
import { peopleTeamsPack } from './peopleTeams';
import { businessProcessPack } from './businessProcess';
import { dataAnalyticsPack } from './dataAnalytics';
import { cloudDevopsPack } from './cloudDevops';
import { securityCompliancePack } from './securityCompliance';

export const builtInPacks: ExtensionPack[] = [
  networkInfraPack,
  uxWireframePack,
  peopleTeamsPack,
  businessProcessPack,
  dataAnalyticsPack,
  cloudDevopsPack,
  securityCompliancePack,
];
