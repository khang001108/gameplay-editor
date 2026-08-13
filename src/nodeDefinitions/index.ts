import type { NodeDefinition, NodeCategory } from "../types/nodeDefs";

import { unitDiesNode } from "./events/unitDies";
import { unitEntersAreaNode } from "./events/unitEntersArea";
import { buildingDestroyedNode } from "./events/buildingDestroyed";
import { timerNode } from "./events/timer";

import { hpLessThanNode } from "./conditions/hpLessThan";
import { resourceGreaterThanNode } from "./conditions/resourceGreaterThan";

import { spawnUnitNode } from "./actions/spawnUnit";
import { giveResourceNode } from "./actions/giveResource";
import { destroyObjectNode } from "./actions/destroyObject";
import { moveUnitNode } from "./actions/moveUnit";
import { attackTargetNode } from "./actions/attackTarget";
import { showMessageNode } from "./actions/showMessage";
import { victoryNode } from "./actions/victory";
import { defeatNode } from "./actions/defeat";

/** Thêm node mới: viết 1 file khai báo rồi thêm đúng 1 dòng vào đây — không sửa gì khác. */
export const NODE_DEFINITIONS: NodeDefinition[] = [
  unitDiesNode,
  unitEntersAreaNode,
  buildingDestroyedNode,
  timerNode,
  hpLessThanNode,
  resourceGreaterThanNode,
  spawnUnitNode,
  giveResourceNode,
  destroyObjectNode,
  moveUnitNode,
  attackTargetNode,
  showMessageNode,
  victoryNode,
  defeatNode,
];

const BY_TYPE = new Map(NODE_DEFINITIONS.map((def) => [def.type, def]));

export function getNodeDefinition(type: string): NodeDefinition | undefined {
  return BY_TYPE.get(type);
}

export function getNodeDefinitionsByCategory(category: NodeCategory): NodeDefinition[] {
  return NODE_DEFINITIONS.filter((def) => def.category === category);
}

export const CATEGORY_LABEL: Record<NodeCategory, string> = {
  event: "Event",
  condition: "Condition",
  action: "Action",
};
