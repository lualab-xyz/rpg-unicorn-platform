extends Node2D

@onready var player: CharacterBody2D = $World/Player
@onready var npc: Node2D = $World/NPC
@onready var hud_root: Control = $HUD/HUDRoot
@onready var dialog_panel: Panel = $HUD/HUDRoot/DialogPanel
@onready var dialog_speaker: Label = $HUD/HUDRoot/DialogPanel/Speaker
@onready var dialog_text: Label = $HUD/HUDRoot/DialogPanel/Text
@onready var choices_panel: Panel = $HUD/HUDRoot/ChoicesPanel
@onready var choices_label: Label = $HUD/HUDRoot/ChoicesPanel/Choices
@onready var touch_pad = $HUD/HUDRoot/TouchPad
@onready var dpad: Control = $HUD/HUDRoot/DPad
@onready var dpad_up: Button = $HUD/HUDRoot/DPad/Up
@onready var dpad_down: Button = $HUD/HUDRoot/DPad/Down
@onready var dpad_left: Button = $HUD/HUDRoot/DPad/Left
@onready var dpad_right: Button = $HUD/HUDRoot/DPad/Right
@onready var btn_talk: Button = $HUD/HUDRoot/Actions/Talk
@onready var btn_select: Button = $HUD/HUDRoot/Actions/Select
@onready var btn_attack: Button = $HUD/HUDRoot/Actions/Attack
@onready var top_stats: Panel = $HUD/HUDRoot/TopStats
@onready var top_title: Panel = $HUD/HUDRoot/TopTitle
@onready var top_map: Panel = $HUD/HUDRoot/TopMap
@onready var hud_nav: Panel = $HUD/HUDRoot/HudNav
@onready var hud_prev: Button = $HUD/HUDRoot/HudNav/Prev
@onready var hud_next: Button = $HUD/HUDRoot/HudNav/Next
@onready var top_stats_label: Label = $HUD/HUDRoot/TopStats/Label
@onready var top_title_label: Label = $HUD/HUDRoot/TopTitle/Label
@onready var top_map_label: Label = $HUD/HUDRoot/TopMap/Label

var touch_axis := Vector2.ZERO
var hud_index := 0
var attack_latch := false
var touch_seen := false
var interaction_latch := false

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
    hud_root.set_anchors_preset(Control.PRESET_FULL_RECT)
    hud_root.offset_left = 0
    hud_root.offset_top = 0
    hud_root.offset_right = 0
    hud_root.offset_bottom = 0

    _sync_mobile_layout()
    _set_dialog_visible(false)
    _set_choices_visible(false)

    btn_talk.pressed.connect(_on_talk_pressed)
    btn_select.pressed.connect(_on_select_pressed)
    btn_attack.pressed.connect(_on_attack_pressed)
    hud_prev.pressed.connect(_on_hud_prev)
    hud_next.pressed.connect(_on_hud_next)

    touch_pad.axis_changed.connect(_on_touch_axis_changed)
    touch_pad.mouse_filter = Control.MOUSE_FILTER_STOP
    touch_pad.knob.mouse_filter = Control.MOUSE_FILTER_IGNORE
    _refresh_top_labels()


func _is_mobile_ui() -> bool:
    if OS.has_feature("mobile"):
        return true
    if touch_seen:
        return true
    if OS.has_feature("web"):
        if Engine.has_singleton("JavaScriptBridge"):
            var ww := int(JavaScriptBridge.eval("window.innerWidth", true))
            var wh := int(JavaScriptBridge.eval("window.innerHeight", true))
            var coarse := bool(JavaScriptBridge.eval("window.matchMedia('(pointer: coarse)').matches", true))
            var mobile_ua := bool(JavaScriptBridge.eval("/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)", true))
            if coarse or mobile_ua:
                return true
            return min(ww, wh) <= 520
        return false
    return false


func _notification(what: int) -> void:
    if what == NOTIFICATION_WM_SIZE_CHANGED:
        _sync_mobile_layout()


func _physics_process(_delta: float) -> void:
    var mobile := _is_mobile_ui()
    var axis := _movement_axis()
    player.call("set_input_vector", axis)
    player.call("set_locked", dialogue_active)

    var can_talk := _near_npc()
    btn_talk.visible = mobile and not dialogue_active
    btn_attack.visible = mobile and not dialogue_active
    touch_pad.set_enabled(false)
    dpad.visible = mobile and not dialogue_active

    if can_talk and not dialogue_active:
        if Input.is_action_pressed("ui_accept") and not interaction_latch:
            _start_dialogue()
            interaction_latch = true
    if dialogue_active:
        if Input.is_action_just_pressed("ui_up"):
            _step_choice(-1)
        if Input.is_action_just_pressed("ui_down"):
            _step_choice(1)
        if Input.is_action_pressed("ui_accept") and not interaction_latch:
            _accept_choice()
            interaction_latch = true

    if not Input.is_action_pressed("ui_accept"):
        interaction_latch = false

    if not dialogue_active:
        if Input.is_key_pressed(KEY_CTRL):
            if not attack_latch:
                _do_attack()
                attack_latch = true
        else:
            attack_latch = false


func _movement_axis() -> Vector2:
    if dialogue_active:
        return Vector2.ZERO
    var axis := Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
    if touch_axis != Vector2.ZERO:
        axis += touch_axis
    var pad_axis := _dpad_axis()
    if dpad.visible and pad_axis != Vector2.ZERO:
        axis += pad_axis
    if axis.length() > 1.0:
        axis = axis.normalized()
    return axis


func _dpad_axis() -> Vector2:
    var x := 0.0
    var y := 0.0
    if dpad_left.button_pressed:
        x -= 1.0
    if dpad_right.button_pressed:
        x += 1.0
    if dpad_up.button_pressed:
        y -= 1.0
    if dpad_down.button_pressed:
        y += 1.0
    return Vector2(x, y)


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
    var chars_per_line := 36
    var max_lines := 3
    if _is_mobile_ui():
        chars_per_line = 28

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
    if dialogue_active:
        _accept_choice()
        return
    if _near_npc():
        _start_dialogue()


func _on_select_pressed() -> void:
    if dialogue_active:
        _accept_choice()


func _on_attack_pressed() -> void:
    if not dialogue_active:
        _do_attack()


func _do_attack() -> void:
    player.modulate = Color(1.0, 0.82, 0.88, 1.0)
    var t := get_tree().create_timer(0.12)
    t.timeout.connect(func(): player.modulate = Color(1, 1, 1, 1))


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

        dpad.position = Vector2(8, vp.y - 120)
        dpad.size = Vector2(112, 112)

        btn_talk.position = Vector2(vp.x - 100, vp.y - 112)
        btn_attack.position = Vector2(vp.x - 100, vp.y - 70)
        btn_talk.text = "ACCION"
        btn_attack.text = "ATAQUE"
    else:
        top_stats.position = Vector2(8, 8)
        top_stats.size = Vector2(112, 58)
        top_title.position = Vector2(128, 8)
        top_title.size = Vector2(172, 32)
        top_map.position = Vector2(vp.x - 100, 8)
        top_map.size = Vector2(92, 32)

        dialog_panel.position = Vector2(8, vp.y - 92)
        dialog_panel.size = Vector2(vp.x - 16, 84)
        choices_panel.position = Vector2(vp.x - 180, vp.y - 180)
        choices_panel.size = Vector2(172, 84)

        btn_talk.position = Vector2(vp.x - 100, vp.y - 112)
        btn_attack.position = Vector2(vp.x - 100, vp.y - 70)
        btn_talk.text = "SPACE"
        btn_attack.text = "CTRL"

    dpad.visible = mobile and not dialogue_active
    btn_talk.visible = mobile and not dialogue_active
    btn_attack.visible = mobile and not dialogue_active
    btn_select.visible = false

    _refresh_top_labels()


func _input(event: InputEvent) -> void:
    if event is InputEventScreenTouch or event is InputEventScreenDrag:
        if not touch_seen:
            touch_seen = true
            _sync_mobile_layout()

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
