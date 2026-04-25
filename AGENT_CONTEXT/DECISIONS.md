# DECISIONS

Última actualización: 2026-04-25

## Cómo usar este archivo
- Este archivo registra decisiones técnicas acordadas con el usuario.
- Antes de proponer o aplicar nuevas decisiones técnicas, revisar este documento.
- No incluir aquí reglas operativas de flujo de trabajo del agente (van en `AGENTS.md`).

## Decisiones técnicas acordadas

### D-001 — Arquitectura separada motor/juego
- Estado: acordada.
- Decisión: separar físicamente motor reutilizable y juego específico (`unicorn-mvp`).
- Motivo: facilitar mantenimiento, escalabilidad y reutilización.

### D-002 — Enfoque data-driven
- Estado: acordada.
- Decisión: contenido del juego definido por datos y contratos explícitos.
- Motivo: ampliar fácilmente mapas, diálogos, NPCs, ítems y quests sin acoplar lógica.

### D-003 — Evitar lock-in de herramientas
- Estado: acordada.
- Decisión: usar formatos canónicos abiertos para runtime; herramientas externas solo opcionales.
- Motivo: poder editar y mantener contenido sin depender de una herramienta concreta.

### D-004 — Edición de sprites/mapas con herramientas genéricas
- Estado: acordada.
- Decisión: permitir edición con Paint/Gimp y flujo manual cuando se necesite.
- Motivo: mantener independencia y flexibilidad del pipeline creativo.

### D-005 — Plataforma objetivo web + evolución a app
- Estado: acordada.
- Decisión: construir para web desktop/móvil con opción de PWA y posible empaquetado app.
- Motivo: validar rápido y mantener camino de evolución multiplataforma.

### D-006 — Despliegue con GitHub Pages + Actions
- Estado: acordada.
- Decisión: usar CI/CD con GitHub Actions para publicar build web en Pages.
- Motivo: automatizar publicación en infraestructura simple de hosting estático.

### D-007 — Persistencia local primero, preparada para cloud
- Estado: acordada.
- Decisión: iniciar con guardado local en navegador y diseñar abstracción para backend futuro.
- Motivo: entregar MVP rápido y evitar deuda técnica al migrar a sincronización remota.

### D-008 — Validación visual estilo 8-bit real
- Estado: acordada.
- Decisión: priorizar look&feel pixel-art (tile look, escala entera, sprites pixelados, animación por frames discretos) sobre estética vectorial.
- Motivo: la siguiente validación del prototipo exige parecer un juego 8-bit y no una demo geométrica libre.

### D-009 — Reemplazar vectores por sprites raster para mundo y UI
- Estado: acordada.
- Decisión: usar PNGs para tiles, personajes y marcos de UI; evitar trazos vectoriales para conseguir estética RPG retro real.
- Motivo: la percepción visual seguía siendo vectorial y no cumplía con la validación de estilo 8-bit solicitada.

### D-010 — UX móvil consistente para HUD y diálogo
- Estado: acordada.
- Decisión: en móvil, HUD superior en modo carrusel (con navegación) y diálogo/choices reposicionados para no solaparse con controles; mantener reglas de paginación por capacidad real de caracteres/lineas.
- Motivo: evitar textos apelotonados y solapamiento con pad, garantizando consistencia entre desktop y móvil.

### D-011 — Spike de migración visual a Godot
- Estado: acordada.
- Decisión: abrir rama dedicada y construir vertical slice equivalente en Godot para evaluar calidad/velocidad frente al prototipo web.
- Motivo: validar si Godot acelera construcción de RPG 2D estilo Zelda manteniendo arquitectura modular propia.

### D-012 — Build de Pages basado en export web de Godot
- Estado: acordada.
- Decisión: cuando exista `apps/godot-player/project.godot`, el pipeline de Pages debe exportar Web desde Godot; en caso contrario, usar build estático web existente.
- Motivo: necesitamos previsualización remota en Pages también para el spike Godot sin romper el flujo actual.
