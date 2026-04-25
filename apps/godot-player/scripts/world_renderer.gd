extends Node2D

const TILE := 16

@export var world_width := 2200
@export var world_height := 1400
@export var river := Rect2(980, 120, 260, 1160)
@export var bridge := Rect2(940, 640, 340, 110)

var tileset: Texture2D


func _ready() -> void:
    tileset = load("res://assets/sprites/tileset.png")
    queue_redraw()


func _draw() -> void:
    if tileset == null:
        return

    var viewport := get_viewport().get_visible_rect().size
    var cam_pos := Vector2.ZERO
    var cam := get_viewport().get_camera_2d()
    if cam:
        cam_pos = cam.global_position - viewport * 0.5

    _draw_ground(cam_pos, viewport)
    _draw_river(cam_pos, viewport)
    _draw_bridge(cam_pos, viewport)
    _draw_paths(cam_pos, viewport)
    _draw_trees(cam_pos, viewport)


func _process(_delta: float) -> void:
    queue_redraw()


func _tile_region(tile_index: int) -> Rect2:
    var cols := 8
    return Rect2((tile_index % cols) * TILE, int(tile_index / cols) * TILE, TILE, TILE)


func _draw_tile(tile_index: int, pos: Vector2) -> void:
    draw_texture_rect_region(
        tileset,
        Rect2(pos, Vector2(TILE, TILE)),
        _tile_region(tile_index),
        Color(1, 1, 1, 1),
        false,
    )


func _draw_ground(cam_pos: Vector2, viewport: Vector2) -> void:
    var start_x := int(floor(cam_pos.x / TILE)) * TILE
    var start_y := int(floor(cam_pos.y / TILE)) * TILE
    var end_x := int(cam_pos.x + viewport.x + TILE)
    var end_y := int(cam_pos.y + viewport.y + TILE)

    for y in range(start_y, end_y, TILE):
        for x in range(start_x, end_x, TILE):
            var check := int(x / TILE + y / TILE) % 2
            var c := Color(0.47, 0.82, 0.42, 1.0) if check == 0 else Color(0.41, 0.74, 0.37, 1.0)
            draw_rect(Rect2(Vector2(x, y), Vector2(TILE, TILE)), c, true)
            if int((x / TILE) * 13 + (y / TILE) * 7) % 29 == 0:
                _draw_tile(2, Vector2(x, y))


func _draw_river(cam_pos: Vector2, _viewport: Vector2) -> void:
    var phase := int(Time.get_ticks_msec() / 220) % 2
    var rx := river.position.x
    var ry := river.position.y
    for y in range(0, int(river.size.y), TILE):
        for x in range(0, int(river.size.x), TILE):
            var v := int(x / TILE + y / TILE + phase) % 2
            _draw_tile(5 if v == 0 else 6, Vector2(rx + x, ry + y))


func _draw_bridge(cam_pos: Vector2, _viewport: Vector2) -> void:
    var bx := bridge.position.x
    var by := bridge.position.y
    for y in range(0, int(bridge.size.y), TILE):
        for x in range(0, int(bridge.size.x), TILE):
            _draw_tile(7, Vector2(bx + x, by + y))


func _draw_paths(cam_pos: Vector2, _viewport: Vector2) -> void:
    var zones := [
        Rect2(120, 705, 860, 42),
        Rect2(1240, 705, 840, 42),
    ]
    for zone_data in zones:
        var zone := zone_data as Rect2
        var px := zone.position.x
        var py := zone.position.y
        for y in range(0, int(zone.size.y), TILE):
            for x in range(0, int(zone.size.x), TILE):
                var v := int(x / TILE + y / TILE) % 2
                _draw_tile(3 if v == 0 else 4, Vector2(px + x, py + y))


func _draw_trees(cam_pos: Vector2, _viewport: Vector2) -> void:
    for i in range(8):
        var tx := 140 + i * 240
        var ty := 380 if i % 2 == 0 else 980
        var px := tx
        var py := ty
        _draw_tile(8, Vector2(px + 3, py + 10))
        _draw_tile(9 + (i % 2), Vector2(px, py))
