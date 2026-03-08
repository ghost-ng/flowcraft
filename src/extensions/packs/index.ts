import type { ExtensionPack } from '../extensionStore';
import { networkInfraPack } from './networkInfra';
import { uxWireframePack } from './uxWireframe';
import { peopleTeamsPack } from './peopleTeams';
import { businessProcessPack } from './businessProcess';
import { dataAnalyticsPack } from './dataAnalytics';

export const builtInPacks: ExtensionPack[] = [
  networkInfraPack,
  uxWireframePack,
  peopleTeamsPack,
  businessProcessPack,
  dataAnalyticsPack,
];
