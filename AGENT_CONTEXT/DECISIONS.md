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
