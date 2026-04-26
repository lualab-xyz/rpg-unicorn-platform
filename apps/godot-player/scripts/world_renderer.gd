extends Node2D

const TILE := 16
const LAYER_GROUND := 0
const LAYER_PATH := 1
const LAYER_WATER := 2
const LAYER_BRIDGE := 3
const LAYER_DECOR := 4

var tilemap: TileMap
var source_id := 0


func _ready() -> void:
    tilemap = TileMap.new()
    tilemap.name = "TileMap"
    tilemap.y_sort_enabled = false
    tilemap.rendering_quadrant_size = 16
    add_child(tilemap)

    while tilemap.get_layers_count() <= LAYER_DECOR:
        tilemap.add_layer(tilemap.get_layers_count())

    tilemap.set_layer_z_index(LAYER_GROUND, 0)
    tilemap.set_layer_z_index(LAYER_PATH, 1)
    tilemap.set_layer_z_index(LAYER_WATER, 2)
    tilemap.set_layer_z_index(LAYER_BRIDGE, 3)
    tilemap.set_layer_z_index(LAYER_DECOR, 5)

    var ts := TileSet.new()
    var atlas := TileSetAtlasSource.new()
    atlas.texture = load("res://assets/sprites/tileset.png")
    atlas.texture_region_size = Vector2i(TILE, TILE)

    for y in range(2):
        for x in range(8):
            atlas.create_tile(Vector2i(x, y))

    source_id = ts.get_next_source_id()
    ts.add_source(atlas, source_id)
    tilemap.tile_set = ts

    _build_map()


func _set_cell(layer: int, wx: int, wy: int, atlas_x: int, atlas_y: int) -> void:
    tilemap.set_cell(layer, Vector2i(wx, wy), source_id, Vector2i(atlas_x, atlas_y))


func _build_map() -> void:
    _build_ground()
    _build_water()
    _build_bridge()
    _build_paths()
    _build_trees()


func _build_ground() -> void:
    var world_size := Vector2(2200, 1400)
    var w_tiles := int(world_size.x / TILE)
    var h_tiles := int(world_size.y / TILE)
    for y in range(h_tiles):
        for x in range(w_tiles):
            var even := (x + y) % 2 == 0
            _set_cell(LAYER_GROUND, x, y, 0 if even else 1, 0)
            if int(x * 13 + y * 7) % 29 == 0:
                _set_cell(LAYER_DECOR, x, y, 2, 0)


func _build_water() -> void:
    var r := Rect2(980, 120, 260, 1160)
    var sx := int(r.position.x / TILE)
    var sy := int(r.position.y / TILE)
    var w := int(r.size.x / TILE)
    var h := int(r.size.y / TILE)
    for y in range(h):
        for x in range(w):
            var even := (x + y) % 2 == 0
            _set_cell(LAYER_WATER, sx + x, sy + y, 5 if even else 6, 0)


func _build_bridge() -> void:
    var b := Rect2(940, 640, 340, 110)
    var sx := int(b.position.x / TILE)
    var sy := int(b.position.y / TILE)
    var w := int(b.size.x / TILE)
    var h := int(b.size.y / TILE)
    for y in range(h):
        for x in range(w):
            _set_cell(LAYER_BRIDGE, sx + x, sy + y, 7, 0)


func _build_paths() -> void:
    var zones := [
        Rect2(120, 705, 860, 42),
        Rect2(1240, 705, 840, 42),
    ]
    for zone_data in zones:
        var zone := zone_data as Rect2
        var sx := int(zone.position.x / TILE)
        var sy := int(zone.position.y / TILE)
        var w := int(zone.size.x / TILE)
        var h := int(zone.size.y / TILE)
        for y in range(h):
            for x in range(w):
                var even := (x + y) % 2 == 0
                _set_cell(LAYER_PATH, sx + x, sy + y, 3 if even else 4, 0)


func _build_trees() -> void:
    for i in range(8):
        var tx := 140 + i * 240
        var ty := 380 if i % 2 == 0 else 980
        var cx := int(tx / TILE)
        var cy := int(ty / TILE)
        _set_cell(LAYER_DECOR, cx, cy, 9 + (i % 2), 1)
        _set_cell(LAYER_DECOR, cx, cy + 1, 8, 1)
