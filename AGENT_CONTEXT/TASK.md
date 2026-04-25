# TASK

Estado: Activa.

## Objetivo
Implementar un prototipo jugable equivalente en Godot para evaluar migración visual/técnica desde el prototipo web actual.

## Alcance de la task actual
- Crear proyecto Godot mínimo en `apps/godot-player`.
- Portar vertical slice visual/jugable:
  - movimiento de unicornio,
  - río con colisión y puente cruzable,
  - NPC con diálogo breve y elecciones,
  - controles teclado + pad táctil.
- Mantener look retro mediante sprites raster ya generados.
- Añadir layout móvil (incluyendo HUD superior con navegación tipo carrusel).

## Criterios de finalización
- El proyecto Godot abre y ejecuta escena principal jugable.
- El slice conserva la interacción principal del prototipo web.
- La UI no se pisa en móvil y conserva estilo retro.
- Existe base modular para continuar (`main.gd`, `player.gd`, `world_renderer.gd`).

## Notas de validación
- Validar ejecución local con Godot 4.2+ (en este entorno no hay binario de Godot).
- Verificar jugabilidad desktop y móvil desde el editor/export web de Godot.
