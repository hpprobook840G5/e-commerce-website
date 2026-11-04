# 3D Motorcycle Model & HDR Environment Documentation

## 1. Current 3D Asset (`public/models/motorcycle.glb`) — Placeholder Status

- **Target Model Requested**: Hero X Pulse 220
- **Current Asset Status**: **Placeholder** (`public/models/motorcycle.glb`, 3.86 MB Draco-compressed binary glTF 2.0). A search of public 3D repositories confirmed that no free, unauthenticated, properly licensed (CC0 / CC-BY / royalty-free) **Hero X Pulse 220** GLB model exists publicly. Per project specification, the existing motorcycle GLB is retained as a high-detail placeholder rather than faking a swap.
- **Geometry**: 129 meshes across 260 scene-graph nodes; **1,021,110 triangles** and **677,379 vertices** (exported via `Khronos glTF Blender I/O v1.7.33` from Sketchfab root node `5c6f77036fb94b70936e2ea4e518caab.fbx`).
- **Source & License**:
  - Sourced from the [`NikLever/ThreeJS-Primer`](https://github.com/NikLever/ThreeJS-Primer/blob/master/assets/motorcycle.glb) educational repository (`assets/motorcycle.glb`), distributed under the **GNU General Public License v3.0 (GPL-3.0)**.

## 2. Clickable Part Mesh Mapping (`MotorcycleModel.jsx` & `cinematicConfig.js`)

| Part Name | Category Slug | Separable in GLB? | Mapped GLB Mesh Name(s) |
| :--- | :--- | :--- | :--- |
| **Seat** | `seat` | Yes | `seat_black.001_0` |
| **Headlight** | `headlight` | Yes | `glass_HL_clearglass.001_0`, `reflector_HL_chrome.001_0`, `lightbulb_HL_clearglass.001_0`, `body_HL_black.001_0`, `det_reflector_HL_chrome.001_0`, `plastic_HL_black.001_0` |
| **Exhaust** | `exhaust` | Yes | `muffler01_mattemetal.001_0`, `muffler_01_mattemetal.001_0`, `muffler02_bronze.001_0`, `weld_muffler_bronze.001_0` |
| **Front Tire** | `front-tire` | Yes | `tire_front_tire.001_0` |
| **Rear Tire** | `rear-tire` | Yes | `tire_rear_tire.001_0` |
| **Handlebars** | `handlebars` | Yes | `handlebar_black.001_0`, `axis_handle_mattemetal.001_0`, `bolt_handle_mattemetal.001_0`, `det_handle_black.001_0`, `lever_mattemetal.001_0`, `det_lever_black.001_0`, `switch_black.001_0`, `button_gray_gray.001_0`, `button_red_red.001_0` |
| **Fuel Tank** | `fuel-tank` | **No (Not Separable)** | Outer painted fuel tank shrouds are fused with the nose fairing and tail bodywork into a single full-length mesh `body001_carpaint_second.001_0` (`zRange: [-0.99, 1.02]`). Not faked as a 3D hotspot. |

## 3. Local HDR Environment (`public/hdr/night_studio_1k.hdr`)

- **File**: `public/hdr/night_studio_1k.hdr` (1024x512 Radiance RGBE `.hdr`, 1.50 MB)
- **Source**: Poly Haven (`studio_small_08_1k.hdr` by Sergej Majboroda)
- **License**: **CC0 1.0 Universal (Public Domain)** — free for any commercial or non-commercial use without attribution requirements.
