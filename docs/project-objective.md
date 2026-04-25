# Project Objective

## Visión
Construir una base técnica para mini-juegos RPG 2D estilo 8-bit (inspiración Zelda) que permita crear contenido por datos, no por construcción visual acoplada a una herramienta.

## Contexto de juego inicial
- Primer juego de validación: `unicorn-mvp` (mundo unicornio para uso familiar).
- Estilo visual de referencia: pixel art 8-bit colorido y amable, con UI RPG clásica.
- Patrón de mundo: combate en el mismo mapa principal, con transición a interiores (casas/caminos/mapas secundarios) mediante warps.

## Objetivos de producto
- Lanzar en web para escritorio y móvil.
- Mantener opción de empaquetado como PWA y posible app móvil futura.
- Facilitar depuración, ampliación y mantenimiento (diálogos, mapas, NPCs, ítems, quests, triggers).

## Principios de construcción acordados
- Separación estricta entre motor y juego concreto.
- Enfoque data-driven para contenido.
- Formatos canónicos abiertos para evitar lock-in.
- Herramientas externas opcionales (aceleran, pero no son obligatorias).

## Edición de mapas y sprites
- Es válido editar sprites y recursos gráficos con herramientas genéricas como Paint o Gimp.
- También se puede usar tooling especializado de forma opcional (por ejemplo Tiled/Aseprite) siempre que la fuente canónica del runtime no dependa de formatos propietarios.
- El runtime debe consumir formatos abiertos/estables para permitir edición manual cuando sea necesario.

## Plataforma y despliegue
- GitHub Pages es factible como hosting del cliente web.
- GitHub Actions es factible para build y publicación automática de la versión web.

## Persistencia y evolución del guardado
- Fase inicial: guardado local en navegador (preferencia por IndexedDB).
- Limitación conocida en hosting estático: el progreso no se sincroniza entre dispositivos sin backend.
- Preparación futura: diseñar una abstracción de persistencia para poder reemplazar guardado local por guardado remoto sin reescribir lógica de juego.

## Alcance inicial propuesto
- Definir estructura base de repositorio (motor, runtime de contenido, tools de contenido, juego de ejemplo, app web).
- Definir contrato v1 de datos para mapas, sprites, NPCs, warps/triggers y diálogo básico.
- Preparar una primera ruta de trabajo de arquitectura antes de implementación extensa.
