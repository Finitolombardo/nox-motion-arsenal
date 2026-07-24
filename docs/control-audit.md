# Control audit triage

The generic preview fingerprint is a triage signal, not a defect verdict. Pointer, scroll, click, text-input and timeline effects need their actual trigger before a control can be judged.

## Confirmed working

Targeted browser verification confirms the contribution-critical representatives:

- `canvasui-particle-reveal`: density and color controls change the rendered canvas.
- `cursor-magnetic-cta`: pointer interaction changes the CTA transform.
- `scroll-pinned-product-stage`: internal scroll advances the active stage.
- `img2threejs-nox-orbital-station`: heavy run gate, render and drag interaction work.
- `hero-massive-typography-reveal`: detail route and animation render without errors.
- `premium-signal-particles`: canvas mounts, animates, resizes and cleans up after navigation.

## Interaction required

These generic markers require a targeted pointer, scroll, click, form or transition trigger before classification:

- `canvasui-glass-lens`
- `canvasui-glitch-burst`
- `canvasui-particle-object`
- `cards-tilt-parallax`
- `cursor-magnetic-cta`
- `cursor-hover-distortion`
- `cursor-pointer-parallax-stage`
- `cursor-spotlight-reveal`
- `cursor-interactive-symbol-drift`
- `forms-answer-lock-in`
- `forms-question-transition`
- `forms-validation-pulse`
- `forms-selection-energy-ripple`
- `overlays-modal-iris-reveal`
- `scroll-pinned-product-stage`
- `transitions-smooth-section-wipe`
- `transitions-masked-route`
- `transitions-clip-path-reveal`
- `transitions-panel-shift`

## Needs targeted test

These markers did not react to the generic first-control mutation and need a focused assertion:

- `bg-noise-fog-field`
- `cards-glass-metal-panel`
- `cards-border-trace-depth`
- `premium-glass-distortion-cards`
- `system-agent-log-stream`

## Confirmed defect

None from the generic audit.

Only entries in this section block release. Move an effect here only after a focused reproduction proves the defect.
