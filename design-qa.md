**Findings**

- No actionable P0/P1/P2 issues remain.
- The firing-to-life handoff now reads as one causal sequence: residual kiln heat contracts around the same vessel, the vessel cools and regains its black-and-white material, the tavern context settles around it, and only then does the cord interaction become available.
- The stable “隔帘启封” frame remains faithful to the selected visual target. Protected live device chrome is intentionally present in browser captures and is not app-content drift.

**Comparison Target**

- Source visual truth: `D:\vbcoding\宋瓷\1\kiln-wheel-demo\design-audit\references\cizhou-level3-selected-v1.png`
- Motion-chain source specification: `D:\vbcoding\宋瓷\1\kiln-wheel-demo\AGENTS.md` under the Cizhou firing-to-life durable decision.
- Browser-rendered transition states:
  - `D:\vbcoding\宋瓷\1\kiln-wheel-demo\design-audit\captures\cizhou-transition-afterglow.png`
  - `D:\vbcoding\宋瓷\1\kiln-wheel-demo\design-audit\captures\cizhou-transition-cooling.png`
  - `D:\vbcoding\宋瓷\1\kiln-wheel-demo\design-audit\captures\cizhou-transition-entering.png`
  - `D:\vbcoding\宋瓷\1\kiln-wheel-demo\design-audit\captures\cizhou-transition-ready.png`
- Four-state storyboard evidence: `D:\vbcoding\宋瓷\1\kiln-wheel-demo\design-audit\captures\cizhou-transition-storyboard.png`
- Source/final combined comparison: `D:\vbcoding\宋瓷\1\kiln-wheel-demo\design-audit\captures\cizhou-source-vs-transition-ready.png`
- Source pixels: 868 × 1856.
- Implementation captures: 393 × 852.
- CSS phone screen: 393 × 852; browser viewport: 1400 × 1110; device scale factor: 1.
- Density normalization: center-cropped the source to 856 × 1856 to match the phone aspect ratio, then downsampled it to 393 × 852 with high-quality bicubic interpolation.
- State: Cizhou level-three transition from completed firing to the sealed lifestyle scene.

**Full-view Comparison Evidence**

- The source/final combined image confirms that the curtain, lamp, partial hand, cord, vessel, cup, vertical title, and bottom index retain the selected composition and hierarchy.
- The storyboard confirms continuous deceleration across four states:
  1. `焰息 · 器成`: close vessel silhouette, residual copper-orange heat, soft focus.
  2. `出窑 · 待凉`: lower saturation and heat, clearer ceramic body, wider framing.
  3. `入肆 · 成席`: curtain, lamp, hand, and counter become legible while motion slows.
  4. Ready `隔帘启封`: full selected composition, no transition copy, interaction enabled.
- Phone-screen `scrollTop` remained `0` in every captured phase, so the composition does not drift during the transition.

**Focused Region Evidence**

- Each intermediate state was inspected separately at native 393 × 852 size. A further crop was not necessary because the vessel silhouette, stage title, stage detail, and final cord affordance are readable at the full phone size.
- The selected scene’s typography and vessel ornament were also inspected in the equal-size source/final comparison.

**Required Fidelity Surfaces**

- Fonts and typography: the final scene typography remains embedded in the approved raster. The three transition chapter titles use the existing Song-style app stack at a restrained 22 px weight and disappear completely in the ready state; no prompt text leaks into the final scene.
- Spacing and layout rhythm: chapter copy stays low and left, away from the vessel and hand. The camera eases from close to full framing without shifting the vessel’s central visual role. Safe areas and device chrome remain unobstructed.
- Colors and visual tokens: color temperature moves continuously from copper-orange residual heat through ash-gold to the target charcoal/ivory tavern palette. Saturation, brightness, and blur all decelerate together instead of cutting independently.
- Image quality and asset fidelity: all four states use the real approved 868 × 1856 raster; no CSS-drawn vessel, placeholder imagery, invented icon, or unrelated transition asset is used. The ready state removes the former scale/filter composite so the source raster resolves as cleanly as the protected runtime permits.
- Copy and content: the three concise chapter labels explain physical causality without adding a dense tutorial. The original scene copy remains unchanged.
- Accessibility and states: transition copy is announced politely; Enter/Space cannot trigger the seal early; reduced motion skips directly to the ready state; the cord target is a semantic labeled button with a practical hit area.

**Comparison History**

1. First transition pass found two P2 fidelity issues:
   - The initial `焰息 · 器成` frame used scale 1.52–1.58 and 8–10 px blur, making the vessel too abstract to function as a continuous visual anchor.
   - The ready frame retained a 1.006 scale and a brightness filter, forcing an unnecessary composited layer and softening the selected raster.
2. Fixes made:
   - Reduced the first-stage scale to 1.42–1.46 and blur to 5–6 px; tightened cooling and entering stages proportionally so the vessel remains identifiable throughout.
   - Removed ready-state scaling and filtering while preserving the approved crop and the separate revealed-state blur.
   - Increased transition chapter typography slightly for native-phone readability.
3. Post-fix evidence:
   - `cizhou-transition-storyboard.png` shows the same vessel continuously recognizable through every stage.
   - `cizhou-source-vs-transition-ready.png` shows the final composition aligned to the selected visual target.
   - Early transition test: the cord target and return control both reported `pointer-events: none`; Enter left `data-life-phase="sealed"`.
   - Settled-state test: `data-arrival-phase="ready"`, cord target `pointer-events: auto`, phone-screen `scrollTop = 0`.
   - Downward drag changed `data-life-phase` from `sealed` to `revealed`; replay restored `sealed`; Enter changed it to `revealed`; “返回窑中” restored the kiln fire state.
   - Browser console warnings/errors checked: none.

**Implementation Checklist**

- [x] Preserve the accepted Cizhou firing animation and synchronized fade.
- [x] Add residual-heat, cooling, and tavern-entry bridge states.
- [x] Keep one vessel as the continuous visual anchor.
- [x] Decelerate color, scale, blur, and motion together.
- [x] Delay interaction until the lifestyle scene is fully settled.
- [x] Preserve drag, replay, keyboard, return, reduced-motion, and safe-area behavior.
- [x] Keep the protected mobile runtime intact.

**Follow-up Polish**

- P3: the browser capture is slightly softer than the separately normalized source because the protected phone-frame composition is captured as a complete layered device. The production asset itself is unchanged and full-resolution.

final result: passed
