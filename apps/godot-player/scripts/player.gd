extends CharacterBody2D

@export var speed := 96.0

var input_vector := Vector2.ZERO
var locked := false
var facing_left := false
var anim_tick := 0.0
var anim_frame := 0

@onready var sprite: Sprite2D = $Sprite2D


func set_input_vector(v: Vector2) -> void:
    input_vector = v


func set_locked(v: bool) -> void:
    locked = v
    if locked:
        input_vector = Vector2.ZERO


func _physics_process(delta: float) -> void:
    var axis := Vector2.ZERO if locked else input_vector
    if axis.length() > 1.0:
        axis = axis.normalized()

    velocity = axis * speed
    move_and_slide()

    if abs(axis.x) > abs(axis.y):
        facing_left = axis.x < 0.0

    if axis.length() > 0.01:
        anim_tick += delta
        if anim_tick >= 0.16:
            anim_tick = 0.0
            anim_frame = (anim_frame + 1) % 2
    else:
        anim_tick = 0.0
        anim_frame = 0

    sprite.frame = anim_frame
    sprite.flip_h = facing_left
