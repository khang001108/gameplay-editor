import type { MapObjectDefinition, MapObjectKind } from "../types/mapDefs";

import { townhallDef } from "./buildings/townhall";
import { barracksDef } from "./buildings/barracks";
import { towerDef } from "./buildings/tower";
import { wallDef } from "./buildings/wall";
import { farmDef } from "./buildings/farm";
import { goldMineDef } from "./buildings/goldMine";

import { pawnDef } from "./units/pawn";
import { warriorDef } from "./units/warrior";
import { archerDef } from "./units/archer";
import { monkDef } from "./units/monk";

/** Thêm building/unit mới: viết 1 file khai báo rồi thêm đúng 1 dòng vào đây — không sửa gì khác. */
export const MAP_OBJECT_DEFINITIONS: MapObjectDefinition[] = [
  townhallDef,
  barracksDef,
  towerDef,
  wallDef,
  farmDef,
  goldMineDef,
  pawnDef,
  warriorDef,
  archerDef,
  monkDef,
];

const BY_TYPE = new Map(MAP_OBJECT_DEFINITIONS.map((def) => [def.type, def]));

export function getMapObjectDefinition(type: string): MapObjectDefinition | undefined {
  return BY_TYPE.get(type);
}

export function getMapObjectDefinitionsByKind(kind: MapObjectKind): MapObjectDefinition[] {
  return MAP_OBJECT_DEFINITIONS.filter((def) => def.kind === kind);
}
