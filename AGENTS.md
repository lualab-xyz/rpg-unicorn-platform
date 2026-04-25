# AGENTS

## Reglas de trabajo de ramas
- Trabaja siempre en una rama `feature/*`.
- La rama `dev` es la única rama de integración.
- Solo se hace merge de `feature/*` a `dev` tras confirmación explícita del usuario.
- Si empieza una task nueva, crea/cambia a una nueva rama `feature/*` dedicada antes de modificar código.

## Carpeta de contexto del agente
- La carpeta `AGENT_CONTEXT/` contiene contexto operativo para el agente.
- Archivos operativos dentro de `AGENT_CONTEXT/`:
  - `AGENT_CONTEXT/TASK.md`
  - `AGENT_CONTEXT/PLAN.md`
  - `AGENT_CONTEXT/STATE.md`
  - `AGENT_CONTEXT/DECISIONS.md`
- `TASK.md` describe como mínimo:
  - objetivo actual,
  - alcance,
  - criterios de finalización,
  - notas de validación.
- El agente puede proponer cambios en `TASK.md`, pero solo se modifican y guardan con confirmación del usuario.
- `DECISIONS.md` recoge acuerdos técnicos de construcción (no reglas operativas) y debe revisarse siempre antes de tomar nuevas decisiones técnicas.

## Archivos operativos
- `AGENT_CONTEXT/STATE.md`: memoria operativa del agente para reanudar trabajo aunque no exista contexto conversacional.
- `AGENT_CONTEXT/PLAN.md`: plan vivo de pasos para la task actual, con progreso y comentarios.
- `AGENT_CONTEXT/DECISIONS.md`: registro de decisiones técnicas acordadas con el usuario y su estado.

## Documentación del proyecto
- No mezclar documentación operativa de conversación con la documentación funcional/técnica del proyecto.
- `README.md` debe contener solo información básica y típica del repositorio (instalación, uso, estructura general), sin detalles específicos de esta conversación.
- La carpeta `docs/` contiene documentación del proyecto (por ejemplo: `project-objective.md`, `architecture.md`, `build.md`).
- Siempre confirmar con el usuario antes de crear nuevos archivos dentro de `docs/`.
- Evitar proliferación de archivos Markdown sueltos fuera de `docs/` y de los archivos operativos acordados.
- Evitar duplicación de información entre `README.md`, `docs/*` y `AGENT_CONTEXT/*`; si se repite contenido, debe ser mínimo, intencional y justificado.
- Separación de responsabilidades de documentos:
  - `README.md`: resumen breve para cualquier persona que entra al repo.
  - `docs/project-objective.md`: objetivo del proyecto y alcance acordado.
  - `docs/architecture.md`: guía técnica de arquitectura, carpetas y construcción.
  - `AGENT_CONTEXT/DECISIONS.md`: decisiones técnicas acordadas para implementar.

## Convenciones mínimas
- Mantener cambios pequeños y trazables.
- Documentar decisiones técnicas relevantes en `AGENT_CONTEXT/STATE.md`.
- Marcar en `AGENT_CONTEXT/PLAN.md` cada paso completado inmediatamente al finalizarlo.
