extends Panel
class_name TouchPadControl

@export var radius := 44.0
@export var deadzone := 0.16

@onready var knob: Panel = $Knob

var axis := Vector2.ZERO
var active := false
var pointer_id := -1

signal axis_changed(value: Vector2)


func _ready() -> void:
    mouse_filter = Control.MOUSE_FILTER_STOP
    _reset_knob()


func set_enabled(value: bool) -> void:
    visible = value
    if not value:
        axis = Vector2.ZERO
        active = false
        pointer_id = -1
        axis_changed.emit(axis)
        _reset_knob()


func _gui_input(event: InputEvent) -> void:
    if event is InputEventScreenTouch:
        var touch := event as InputEventScreenTouch
        if touch.pressed and _contains_point(touch.position):
            active = true
            pointer_id = touch.index
            _update_axis(touch.position)
            accept_event()
        elif (not touch.pressed) and touch.index == pointer_id:
            _release()
            accept_event()
    elif event is InputEventScreenDrag:
        var drag := event as InputEventScreenDrag
        if active and drag.index == pointer_id:
            _update_axis(drag.position)
            accept_event()
    elif event is InputEventMouseButton:
        var mb := event as InputEventMouseButton
        if mb.button_index == MOUSE_BUTTON_LEFT:
            if mb.pressed and _contains_point(mb.position):
                active = true
                pointer_id = 0
                _update_axis(mb.position)
                accept_event()
            elif not mb.pressed and active and pointer_id == 0:
                _release()
                accept_event()
    elif event is InputEventMouseMotion:
        var mm := event as InputEventMouseMotion
        if active and pointer_id == 0:
            _update_axis(mm.position)
            accept_event()


func _contains_point(point: Vector2) -> bool:
    var center := global_position + size * 0.5
    return point.distance_to(center) <= radius * 1.25


func _release() -> void:
    active = false
    pointer_id = -1
    axis = Vector2.ZERO
    axis_changed.emit(axis)
    _reset_knob()


func _reset_knob() -> void:
    knob.position = (size - knob.size) * 0.5


func _update_axis(point: Vector2) -> void:
    var center := global_position + size * 0.5
    var d := point - center
    var next_axis := Vector2(clamp(d.x / radius, -1.0, 1.0), clamp(d.y / radius, -1.0, 1.0))
    if next_axis.length() < deadzone:
        next_axis = Vector2.ZERO
    axis = next_axis
    axis_changed.emit(axis)

    var base := (size - knob.size) * 0.5
    knob.position = base + Vector2(axis.x * (radius * 0.5), axis.y * (radius * 0.5))
