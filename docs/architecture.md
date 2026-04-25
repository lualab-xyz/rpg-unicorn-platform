# Architecture

## Propósito
Definir cómo se organiza técnicamente el proyecto para construir RPGs 2D data-driven, desacoplando motor, contenido y juego concreto.

## Organización de alto nivel (objetivo)
- `packages/engine`: núcleo reutilizable (loop, render, input, cámara, colisiones, audio, ciclo de entidades).
- `packages/content-runtime`: carga/lectura de contenido canónico en runtime.
- `packages/content-tools`: validación, transformación y checks de contenido.
- `games/unicorn-mvp`: contenido y configuración del primer juego.
- `apps/web-player`: aplicación web que ejecuta el juego.
- `docs/`: documentación funcional y técnica.
- `AGENT_CONTEXT/`: contexto operativo del agente.

## Límites entre capas
- El motor no conoce narrativa concreta ni contenido específico de un juego.
- El juego define datos, reglas y assets, pero consume APIs del motor.
- El runtime carga contenido canónico independiente de la herramienta con la que fue creado.

## Modelo de contenido
- Contenido definido en datos versionables.
- Contratos iniciales previstos: mapa, sprite metadata, NPC, warp/trigger, diálogo.
- Validación automática para detectar referencias rotas e inconsistencias.

## Integración con herramientas externas
- Herramientas de autoría son opcionales.
- Si se usan, deben exportar/convertir al formato canónico del proyecto.
- El runtime no debe depender directamente de formatos propietarios.

## Plataforma
- Target principal: web (desktop/móvil).
- Distribución prevista: build estático con publicación en GitHub Pages.
- Automatización prevista: GitHub Actions para build/deploy.

## Persistencia
- Primera implementación: almacenamiento local en navegador.
- Diseño recomendado: interfaz de persistencia para permitir migrar a backend remoto en el futuro.
