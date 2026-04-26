extends RefCounted
class_name WorldConfig

const TILE := 16
const WORLD_SIZE := Vector2(2200, 1400)

const RIVER_RECT := Rect2(980, 120, 260, 1160)
const BRIDGE_RECT := Rect2(940, 640, 340, 110)

const PLAYER_START := Vector2(760, 700)
const NPC_POS := Vector2(1460, 700)

static func river_collision_rects() -> Array[Rect2]:
    var top_h := BRIDGE_RECT.position.y - RIVER_RECT.position.y
    var bottom_y := BRIDGE_RECT.position.y + BRIDGE_RECT.size.y
    var bottom_h := (RIVER_RECT.position.y + RIVER_RECT.size.y) - bottom_y
    return [
        Rect2(RIVER_RECT.position.x, RIVER_RECT.position.y, RIVER_RECT.size.x, top_h),
        Rect2(RIVER_RECT.position.x, bottom_y, RIVER_RECT.size.x, bottom_h),
    ]
