# 3D Motorcycle Model & HDR Environment Documentation

## 1. Current 3D Asset (`public/models/motorcycle.glb`)

- **File**: `public/models/motorcycle.glb` (3.86 MB, Draco-compressed binary glTF 2.0)
- **Geometry**: 129 meshes across 260 scene-graph nodes; **1,021,110 triangles** and **677,379 vertices** (exported via `Khronos glTF Blender I/O v1.7.33` from Sketchfab root node `5c6f77036fb94b70936e2ea4e518caab.fbx`).
- **Materials & Textures**: 20 semantic PBR material slots (`carpaint.001`, `carpaint_second.001`, `chrome.001`, `gold.001`, `brakedisk.001`, `mattemetal.001`, `tire.001`, `clearglass.001`, `redglass.001`, `orangeglass.001`, `mirror.001`, etc.) and **0 embedded image textures** (no baked normal, roughness, or albedo texture maps).
- **Source & License / Attribution**:
  - Sourced from the [`NikLever/ThreeJS-Primer`](https://github.com/NikLever/ThreeJS-Primer/blob/master/assets/motorcycle.glb) educational repository (`assets/motorcycle.glb`), distributed under the **GNU General Public License v3.0 (GPL-3.0)**, originally converted from Sketchfab model UUID `5c6f77036fb94b70936e2ea4e518caab`.
  - **Attribution / Usage Note**: While suitable for development and technical demonstrations under GPL-3.0, a proprietary commercial storefront should either comply with GPL-3.0 terms for the asset or swap in a dedicated **CC0 / CC-BY 4.0** or commercially licensed asset (see Section 3 below) and credit the creator in site credits if CC-BY.

## 2. Local HDR Environment (`public/hdr/night_studio_1k.hdr`)

- **File**: `public/hdr/night_studio_1k.hdr` (1024x512 Radiance RGBE `.hdr`, 1.50 MB)
- **Source**: Poly Haven (`studio_small_08_1k.hdr` by Sergej Majboroda)
- **License**: **CC0 1.0 Universal (Public Domain)** — free for any commercial or non-commercial use without attribution requirements.

## 3. Recommended Production Replacement Asset Specification

Because the current `motorcycle.glb` has **1.02M triangles** (heavy vertex count) and **0 baked 2K/4K normal or roughness textures** (relying solely on geometry and procedural PBR material parameters for tire treads, carbon weave, and engine casing micro-detail), swapping in a game-ready PBR motorcycle GLB will simultaneously reduce vertex memory and add micro-surface detail:

- **License**: CC0 (Public Domain), CC-BY 4.0 (with creator credit), or Standard Commercial Royalty-Free License.
- **Triangle Count**: `100,000 – 250,000` triangles (baked high-to-low-poly silhouette with smooth bevels).
- **Texture Maps (2048x2048 to 4096x4096, KTX2/WebP or PNG)**:
  - `baseColor` (`SRGBColorSpace`): Bodywork, decals, anodized fork tubes, carbon fiber weave.
  - `normalMap` (Linear): Tire tread grooves, sidewall lettering, drilled brake rotor holes, engine bolt heads, radiator fins, carbon weave relief.
  - `metalnessMap` & `roughnessMap` (Linear ORM packed): Separating glossy clearcoat fairing (`roughness ~0.05`) from satin frame (`roughness ~0.35`) and matte rubber tires (`roughness ~0.88`).
  - `emissiveMap` (`SRGBColorSpace`): LED DRL strips, projector headlight core, and LED tail lamp array.
- **Hierarchy**: Distinct named sub-nodes (`Wheel_Front`, `Wheel_Rear`, `Steering_Fork`, `Body_Fairing`, `Headlight_Glass`, `Taillight_Glass`) with pivot centers aligned to wheel axles.

