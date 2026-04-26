extends Node2D

@onready var player: CharacterBody2D = $World/Player
@onready var npc: Node2D = $World/NPC
@onready var dialog_panel: Panel = $HUD/DialogPanel
@onready var dialog_speaker: Label = $HUD/DialogPanel/Speaker
@onready var dialog_text: Label = $HUD/DialogPanel/Text
@onready var choices_panel: Panel = $HUD/ChoicesPanel
@onready var choices_label: Label = $HUD/ChoicesPanel/Choices
@onready var touch_pad = $HUD/TouchPad
@onready var pad_label: Label = $HUD/TouchPad/PadLabel
@onready var dpad: Control = $HUD/DPad
@onready var dpad_up: Button = $HUD/DPad/Up
@onready var dpad_down: Button = $HUD/DPad/Down
@onready var dpad_left: Button = $HUD/DPad/Left
@onready var dpad_right: Button = $HUD/DPad/Right
@onready var btn_talk: Button = $HUD/Actions/Talk
@onready var btn_select: Button = $HUD/Actions/Select
@onready var top_stats: Panel = $HUD/TopStats
@onready var top_title: Panel = $HUD/TopTitle
@onready var top_map: Panel = $HUD/TopMap
@onready var hud_nav: Panel = $HUD/HudNav
@onready var hud_prev: Button = $HUD/HudNav/Prev
@onready var hud_next: Button = $HUD/HudNav/Next
@onready var top_stats_label: Label = $HUD/TopStats/Label
@onready var top_title_label: Label = $HUD/TopTitle/Label
@onready var top_map_label: Label = $HUD/TopMap/Label
@onready var corner_markers: Control = $HUD/CornerMarkers
@onready var marker_tl: ColorRect = $HUD/CornerMarkers/TopLeft
@onready var marker_tr: ColorRect = $HUD/CornerMarkers/TopRight
@onready var marker_bl: ColorRect = $HUD/CornerMarkers/BottomLeft
@onready var marker_br: ColorRect = $HUD/CornerMarkers/BottomRight

var touch_axis := Vector2.ZERO
var hud_index := 0

var dialogue_active := false
var dialogue_node := ""
var dialogue_index := 0

var dialogue_tree := {
    "start": {
        "speaker": "AURORA",
        "text": "Hola, Luna. Cruzaste el puente del Reino Arcoiris. Que buscas hoy?",
        "choices": [
            {"text": "Solo explorar", "next": "explore"},
            {"text": "Busco aventura", "next": "adventure"},
        ],
    },
    "explore": {
        "speaker": "AURORA",
        "text": "Entonces visita el prado del norte. Hay cristales brillando al amanecer.",
        "choices": [{"text": "Gracias", "next": "end"}],
    },
    "adventure": {
        "speaker": "AURORA",
        "text": "Perfecto. Empieza dominando el puente: moverte con calma es la clave.",
        "choices": [{"text": "Acepto el reto", "next": "end"}],
    },
    "end": {
        "speaker": "AURORA",
        "text": "Cuando quieras hablar de nuevo, me encontraras aqui.",
        "choices": [{"text": "Cerrar", "next": ""}],
    },
}


func _ready() -> void:
    _sync_mobile_layout()
    _set_dialog_visible(false)
    _set_choices_visible(false)

    btn_talk.visible = false
    btn_select.visible = false
    btn_talk.pressed.connect(_on_talk_pressed)
    btn_select.pressed.connect(_on_select_pressed)
    hud_prev.pressed.connect(_on_hud_prev)
    hud_next.pressed.connect(_on_hud_next)

    touch_pad.axis_changed.connect(_on_touch_axis_changed)
    touch_pad.mouse_filter = Control.MOUSE_FILTER_STOP
    touch_pad.knob.mouse_filter = Control.MOUSE_FILTER_IGNORE
    pad_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
    touch_pad.modulate = Color(1, 1, 1, 0.95)
    touch_pad.knob.modulate = Color(1, 0.8, 0.93, 1)
    pad_label.modulate = Color(1, 1, 1, 1)

    dpad_up.button_down.connect(func(): _set_dpad_axis("up", true))
    dpad_up.button_up.connect(func(): _set_dpad_axis("up", false))
    dpad_down.button_down.connect(func(): _set_dpad_axis("down", true))
    dpad_down.button_up.connect(func(): _set_dpad_axis("down", false))
    dpad_left.button_down.connect(func(): _set_dpad_axis("left", true))
    dpad_left.button_up.connect(func(): _set_dpad_axis("left", false))
    dpad_right.button_down.connect(func(): _set_dpad_axis("right", true))
    dpad_right.button_up.connect(func(): _set_dpad_axis("right", false))

    _refresh_top_labels()


func _is_mobile_ui() -> bool:
    var vp := get_viewport().get_visible_rect().size
    if DisplayServer.is_touchscreen_available():
        return true
    if OS.has_feature("web") and vp.x <= 1024:
        return true
    return false


func _notification(what: int) -> void:
    if what == NOTIFICATION_WM_SIZE_CHANGED:
        _sync_mobile_layout()


func _physics_process(_delta: float) -> void:
    var axis := _movement_axis()
    player.call("set_input_vector", axis)
    player.call("set_locked", dialogue_active)

    var can_talk := _near_npc()
    btn_talk.visible = can_talk and not dialogue_active
    btn_select.visible = dialogue_active
    touch_pad.set_enabled(_is_mobile_ui() and not dialogue_active)
    dpad.visible = _is_mobile_ui() and not dialogue_active

    if not dialogue_active and can_talk and Input.is_action_just_pressed("ui_accept"):
        _start_dialogue()

    if dialogue_active:
        if Input.is_action_just_pressed("ui_up"):
            _step_choice(-1)
        if Input.is_action_just_pressed("ui_down"):
            _step_choice(1)
        if Input.is_action_just_pressed("ui_accept"):
            _accept_choice()


func _movement_axis() -> Vector2:
    if dialogue_active:
        return Vector2.ZERO
    var axis := Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
    if touch_axis != Vector2.ZERO:
        axis += touch_axis
    if axis.length() > 1.0:
        axis = axis.normalized()
    return axis


func _near_npc() -> bool:
    return player.global_position.distance_to(npc.global_position) < 46.0


func _start_dialogue() -> void:
    dialogue_active = true
    dialogue_node = "start"
    dialogue_index = 0
    _render_dialogue()


func _close_dialogue() -> void:
    dialogue_active = false
    dialogue_node = ""
    dialogue_index = 0
    _set_dialog_visible(false)
    _set_choices_visible(false)


func _render_dialogue() -> void:
    if not dialogue_tree.has(dialogue_node):
        _close_dialogue()
        return
    var node: Dictionary = dialogue_tree[dialogue_node]
    dialog_speaker.text = str(node.get("speaker", ""))
    dialog_text.text = _fit_dialog_text(str(node.get("text", "")))
    _set_dialog_visible(true)
    _set_choices_visible(true)

    var items: Array = node.get("choices", [])
    var out := ""
    for i in range(items.size()):
        var marker := "> " if i == dialogue_index else "  "
        out += marker + str(items[i].get("text", ""))
        if i < items.size() - 1:
            out += "\n"
    choices_label.text = out


func _fit_dialog_text(full_text: String) -> String:
    var vp := get_viewport().get_visible_rect().size
    var chars_per_line := 38
    var max_lines := 3
    if _is_mobile_ui() or vp.x < 420:
        chars_per_line = 28
        max_lines = 3

    var words := full_text.split(" ")
    var lines: Array[String] = []
    var line := ""

    for word in words:
        var candidate := word if line == "" else line + " " + word
        if candidate.length() > chars_per_line and line != "":
            lines.append(line)
            line = word
        else:
            line = candidate
    if line != "":
        lines.append(line)

    if lines.size() > max_lines:
        lines = lines.slice(0, max_lines)
    return "\n".join(lines)


func _step_choice(delta: int) -> void:
    var node: Dictionary = dialogue_tree.get(dialogue_node, {})
    var items: Array = node.get("choices", [])
    if items.is_empty():
        return
    dialogue_index = posmod(dialogue_index + delta, items.size())
    _render_dialogue()


func _accept_choice() -> void:
    var node: Dictionary = dialogue_tree.get(dialogue_node, {})
    var items: Array = node.get("choices", [])
    if items.is_empty():
        _close_dialogue()
        return
    var target := str(items[dialogue_index].get("next", ""))
    if target == "":
        _close_dialogue()
        return
    dialogue_node = target
    dialogue_index = 0
    _render_dialogue()


func _set_dialog_visible(v: bool) -> void:
    dialog_panel.visible = v


func _set_choices_visible(v: bool) -> void:
    choices_panel.visible = v


func _on_talk_pressed() -> void:
    if not dialogue_active and _near_npc():
        _start_dialogue()


func _on_select_pressed() -> void:
    if dialogue_active:
        _accept_choice()


func _sync_mobile_layout() -> void:
    var mobile := _is_mobile_ui()
    var vp := get_viewport().get_visible_rect().size
    var hud_panels := [top_stats, top_title, top_map]
    hud_nav.visible = mobile
    for i in range(hud_panels.size()):
        hud_panels[i].visible = (not mobile) or i == hud_index

    if mobile:
        top_stats.position = Vector2(8, 8)
        top_stats.size = Vector2(vp.x - 16, 56)
        top_title.position = top_stats.position
        top_title.size = top_stats.size
        top_map.position = top_stats.position
        top_map.size = top_stats.size
        hud_nav.position = Vector2(8, 66)
        hud_nav.size = Vector2(104, 26)
        dialog_panel.position = Vector2(8, 72)
        dialog_panel.size = Vector2(vp.x - 16, 68)
        choices_panel.position = Vector2(8, 146)
        choices_panel.size = Vector2(vp.x - 16, 54)
        touch_pad.position = Vector2(8, 96)
        touch_pad.size = Vector2(112, 112)
        touch_pad.knob.position = Vector2(42, 42)
        touch_pad.knob.size = Vector2(30, 30)
        touch_pad.radius = 44.0
        pad_label.position = Vector2(14, 84)
        pad_label.size = Vector2(84, 18)
        btn_talk.position = Vector2(vp.x - 100, vp.y - 112)
        btn_select.position = Vector2(vp.x - 100, vp.y - 70)
        dpad.position = Vector2(8, 96)
        dpad.size = Vector2(112, 112)
    else:
        top_stats.position = Vector2(8, 8)
        top_stats.size = Vector2(100, 58)
        top_title.position = Vector2(116, 8)
        top_title.size = Vector2(98, 32)
        top_map.position = Vector2(222, 8)
        top_map.size = Vector2(90, 32)
        dialog_panel.position = Vector2(8, vp.y - 84)
        dialog_panel.size = Vector2(vp.x - 16, 76)
        choices_panel.position = Vector2(vp.x - 140, vp.y - 160)
        choices_panel.size = Vector2(132, 72)
        touch_pad.position = Vector2(8, vp.y - 120)
        touch_pad.size = Vector2(96, 96)
        touch_pad.knob.position = Vector2(36, 36)
        touch_pad.knob.size = Vector2(24, 24)
        touch_pad.radius = 38.0
        pad_label.position = Vector2(18, 70)
        pad_label.size = Vector2(64, 18)
        btn_talk.position = Vector2(vp.x - 100, vp.y - 112)
        btn_select.position = Vector2(vp.x - 100, vp.y - 70)
        dpad.position = Vector2(8, vp.y - 120)
        dpad.size = Vector2(112, 112)

    touch_pad.set_enabled(mobile and not dialogue_active)
    dpad.visible = mobile and not dialogue_active

    corner_markers.visible = true
    marker_tl.position = Vector2(2, 2)
    marker_tr.position = Vector2(vp.x - 7, 2)
    marker_bl.position = Vector2(2, vp.y - 7)
    marker_br.position = Vector2(vp.x - 7, vp.y - 7)

    _refresh_top_labels()


func _input(event: InputEvent) -> void:
    if event is InputEventKey:
        var k := event as InputEventKey
        if _is_mobile_ui() and k.pressed and not k.echo:
            if k.physical_keycode == KEY_Q:
                hud_index = posmod(hud_index - 1, 3)
                _sync_mobile_layout()
            elif k.physical_keycode == KEY_E:
                hud_index = posmod(hud_index + 1, 3)
                _sync_mobile_layout()


func _on_touch_axis_changed(value: Vector2) -> void:
    touch_axis = value


func _set_dpad_axis(dir: String, pressed: bool) -> void:
    match dir:
        "up":
            if pressed:
                touch_axis.y = -1
            elif touch_axis.y < 0:
                touch_axis.y = 0
        "down":
            if pressed:
                touch_axis.y = 1
            elif touch_axis.y > 0:
                touch_axis.y = 0
        "left":
            if pressed:
                touch_axis.x = -1
            elif touch_axis.x < 0:
                touch_axis.x = 0
        "right":
            if pressed:
                touch_axis.x = 1
            elif touch_axis.x > 0:
                touch_axis.x = 0


func _on_hud_prev() -> void:
    hud_index = posmod(hud_index - 1, 3)
    _sync_mobile_layout()


func _on_hud_next() -> void:
    hud_index = posmod(hud_index + 1, 3)
    _sync_mobile_layout()


func _refresh_top_labels() -> void:
    top_stats_label.text = "LUNA\nHP 28/28\nMP 12/12"
    top_title_label.text = "REINO MVP"
    top_map_label.text = "MAPA"
