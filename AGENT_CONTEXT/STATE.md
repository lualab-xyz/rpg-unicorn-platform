# STATE

Última actualización: 2026-04-25

## Contexto del repositorio
- Repositorio local inicializado en: `/workspace/rpg-unicorn-platform`.
- Rama actual de trabajo: `feature/spike-godot-visual-port`.
- Rama de integración prevista: `dev`.
- Política acordada: trabajo en `feature/*` y merge a `dev` solo con confirmación del usuario.
- Repositorio remoto creado: `https://github.com/lualab-xyz/rpg-unicorn-platform`.
- Remoto local `origin` enlazado al repositorio de GitHub.
- Push realizado de la rama `feature/task-01-prototipo-motor` con commit inicial del prototipo.

## Objetivo general del proyecto
Definir y construir una arquitectura base para mini juegos RPG 2D estilo 8-bit (inspiración Zelda), con separación clara entre motor reutilizable y juego de ejemplo (`unicorn-mvp`), orientado a web (desktop/móvil) con posible despliegue como PWA/app.

## Decisiones ya tomadas
- Evitar lock-in de herramientas externas.
- Formatos canónicos abiertos para runtime y contenido (datos + assets estándar).
- Herramientas externas (p. ej. Tiled/Aseprite) tratadas como opcionales de productividad, no como dependencia obligatoria.
- Separar estrictamente documentación operativa del agente y documentación del proyecto.
- `README.md` reservado para contenido básico de repositorio, sin contexto de conversación.
- Nuevos archivos en `docs/` solo tras confirmación del usuario.
- Añadir `AGENT_CONTEXT/DECISIONS.md` para registrar acuerdos técnicos y revisarlo antes de nuevas decisiones técnicas.
- Priorizar validación visual 8-bit real (pixel-art y movimiento retro) en la siguiente iteración.

## Archivos de control del agente
- `AGENTS.md` creado con reglas de ramas y contexto.
- `AGENT_CONTEXT/PLAN.md` creado para seguimiento de la task activa.
- `AGENT_CONTEXT/STATE.md` como memoria operativa activa.
- `AGENT_CONTEXT/TASK.md` creado como borrador pendiente de confirmación.
- `AGENT_CONTEXT/DECISIONS.md` creado con acuerdos técnicos activos.

## Documentación del proyecto disponible
- `README.md`: resumen corto del repositorio.
- `docs/project-objective.md`: objetivo, contexto, alcance y acuerdos principales.
- `docs/architecture.md`: guía técnica de arquitectura y límites entre capas.

## Implementación en progreso
- Prototipo jugable inicial creado en `apps/web-player/index.html`.
- Estilos HUD/mobile y layout fullscreen en `apps/web-player/style.css`.
- Lógica jugable en `apps/web-player/game.js`:
  - movimiento jugador por teclado y pad táctil,
  - río con colisión,
  - puente cruzable,
  - interacción con NPC cercano,
  - diálogo con elecciones,
  - modo diálogo bloquea movimiento y usa flechas para seleccionar.
- Iteración visual 8-bit aplicada (pendiente de validar en Pages):
  - viewport con escala entera pixelada,
  - tiles de suelo/agua/camino con paleta limitada,
  - sprites simplificados por píxel para unicornio,
  - animación de caminata por alternancia de frames discretos,
  - overlay scanline suave para estética CRT ligera.
- Iteración raster aplicada para eliminar estética vectorial:
  - generación de assets PNG en `tools/generate_pixel_assets.py`,
  - tiles/world render desde `assets/sprites/tileset.png`,
  - personajes desde `assets/sprites/unicorn_player.png` y `assets/sprites/unicorn_npc.png`,
  - paneles y botones UI con 9-slice PNG,
  - texto bitmap con atlas `assets/ui/font-6x8.png` renderizado en capa dedicada.
- Ajustes de legibilidad/UX en curso:
  - carrusel móvil para paneles superiores con navegación lateral,
  - diálogo y opciones reposicionados en móvil para no pisarse con controles,
  - pad táctil migrado a aspecto 8-bit raster,
  - función de capacidad de texto por contenedor para controlar impresión/paginación base.

## Spike Godot (nuevo)
- Proyecto base creado en `apps/godot-player`.
- Estructura inicial:
  - `apps/godot-player/project.godot`
  - `apps/godot-player/scenes/main.tscn`
  - `apps/godot-player/scenes/player.tscn`
  - `apps/godot-player/scripts/main.gd`
  - `apps/godot-player/scripts/player.gd`
  - `apps/godot-player/scripts/world_renderer.gd`
- Assets raster copiados desde web prototype a `apps/godot-player/assets`.
- Slice portado: movimiento jugador, río colisionable con puente cruzable, NPC y diálogo con elecciones, soporte teclado + touch pad, layout móvil básico.
- Godot instalado localmente para validación: `4.6.2.stable` en `/workspace/tools/godot/Godot_v4.6.2-stable_linux.x86_64`.
- Validación headless completada tras corregir parse errors de `world_renderer.gd`.
- Export web preparado con `apps/godot-player/export_presets.cfg`.
- Workflow de Pages actualizado para exportar Godot Web cuando exista proyecto Godot.
- Deploy de Pages Godot validado tras corregir reglas de environment y pasos de export CI.
- Ajustes aplicados tras feedback:
  - fuente retro integrada (`PressStart2P-Regular.ttf`) en HUD Godot,
  - pad táctil visible en móvil,
  - cielo/fondo corregido para evitar look gris,
  - shell web custom para reemplazar loader inicial por branding del proyecto.

## Publicación remota
- Workflow de Pages añadido en `.github/workflows/deploy-pages.yml`.
- Pages habilitado tras cambio de repositorio a público.
- Despliegue ejecutado con éxito vía workflow `Deploy Web Player to Pages`.
- URL activa de preview: `http://lualab.xyz/rpg-unicorn-platform/`.

## Próximos pasos recomendados
1. Crear estructura base de carpetas (`packages`, `games`, `apps`, `AGENT_CONTEXT`).
2. Definir contrato v1 de formato canónico (mapa, sprite metadata, npc, warps/triggers).
3. Crear `AGENT_CONTEXT/TASK.md` con la task activa tras confirmación del usuario.
