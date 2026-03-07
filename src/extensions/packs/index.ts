import type { ExtensionPack } from '../extensionStore';
import { networkInfraPack } from './networkInfra';
import { uxWireframePack } from './uxWireframe';
import { peopleTeamsPack } from './peopleTeams';

export const builtInPacks: ExtensionPack[] = [
  networkInfraPack,
  uxWireframePack,
  peopleTeamsPack,
];
