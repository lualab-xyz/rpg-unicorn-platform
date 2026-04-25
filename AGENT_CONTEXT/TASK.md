# TASK

Estado: Activa.

## Objetivo
Implementar un primer prototipo jugable del motor en web con pantalla completa, control mobile-first y soporte de teclado, usando ambientación unicornio.

## Alcance de la task actual
- Escena única jugable con:
  - unicornio del jugador moviéndose por el mapa,
  - río con colisión,
  - puente cruzable,
  - unicornio NPC al otro lado del río,
  - conversación breve con elecciones.
- UI superpuesta estilo RPG 8-bit básica.
- Control de entrada:
  - teclado: flechas para moverse y barra espaciadora para interactuar/seleccionar,
  - móvil: pad táctil por arrastre desde el centro y botones de acción contextuales.
- Comportamiento de modo diálogo tipo Zelda:
  - al abrir diálogo, flechas dejan de mover y pasan a seleccionar opciones.

## Criterios de finalización
- El personaje se mueve de forma fluida con teclado y pad táctil.
- El río bloquea movimiento excepto por la zona de puente.
- Al acercarse al NPC aparece acción de hablar.
- El diálogo se abre y permite navegar/confirmar elecciones.
- Durante diálogo, movimiento queda bloqueado y flechas controlan selección.

## Notas de validación
- Probar flujo completo en navegador móvil y escritorio.
- Verificar que la jugabilidad prima sobre el detalle visual en este prototipo.
