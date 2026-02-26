# propwash
FPV drone simulator for the web

Everything is still in prototype phase!

* Use WASD as the left stick, mouse as the right stick (need to click into the game window to capture the mouse first)
* Keys 1-4 switch between the different drone control modes with mode 2 as default
* Right click (when mouse is not captured) and mouse wheel for camera orbit controls
* Use R on keyboard or gamepad (button 5) to reset position to where it was a second ago
* Use space to switch between first person and third person camera

If you clone the repo and host it locally, you can configurate your drone to your heart's content by creating a config file in `configs/` and then loading it with the URL parameter `http://localhost:8000?config=configs/myconfig.json5`.

## Demos

[Playground, beginner](https://mqnc.github.io/propwash/?config=configs/beginner.json5,configs/playground.json5)

[Playground, pro](https://mqnc.github.io/propwash/?config=configs/playground.json5)

[Bando, beginner](https://mqnc.github.io/propwash/?config=configs/beginner.json5,configs/bando.json5)

[Bando, pro](https://mqnc.github.io/propwash/?config=configs/bando.json5)

[Cyber Crazy Park, beginner](https://mqnc.github.io/propwash/?config=configs/beginner.json5,configs/park.json5)

[Cyber Crazy Park, pro](https://mqnc.github.io/propwash/?config=configs/park.json5)

## Attributions

The assets used in this project are under Creative Commons licenses. They are **not relicensed under MIT** unless explicitly noted.  

| Asset | Title | Authors | License |
|---|---|---|---|
||||
| Models | [Racing drone (Lite Graphics Version)](https://skfb.ly/6zBPO) | [BlueMesh](https://sketchfab.com/BlueMesh) | CC BY 4.0 |
||||
| Maps | [playground 2](https://skfb.ly/pyZnG) | [Pasha](https://sketchfab.com/Pasha-) | CC BY 4.0 |
|| [Post-Apocalyptic City](https://skfb.ly/pD6BX) | [golukumar](https://sketchfab.com/mortalityrexotable) | CC BY 4.0 |
|| [Amusement park](https://skfb.ly/p7GFu) | [Megame Studio](https://sketchfab.com/megame1) | CC BY-NC-SA 4.0 |
|| [Lovely Town](https://skfb.ly/ortrz) | [SebastianSosnowski](https://sketchfab.com/SebastianSosnowski) | CC BY 4.0 |
||||
| HDRIs | [Pretoria Gardens](https://polyhaven.com/a/pretoria_gardens) | [Dimitrios Savva](https://polyhaven.com/all?a=Dimitrios%20Savva), [Jarod Guest](https://polyhaven.com/all?a=Jarod%20Guest) | CC0 |
|| [Qwantani Night](https://polyhaven.com/a/qwantani_night) | [Greg Zaal](https://polyhaven.com/all?a=Greg%20Zaal), [Jarod Guest](https://polyhaven.com/all?a=Jarod%20Guest) | CC0 |
|| [Qwantani Noon \(Pure Sky\)](https://polyhaven.com/a/qwantani_noon_puresky) | [Greg Zaal](https://polyhaven.com/all?a=Greg%20Zaal), [Jarod Guest](https://polyhaven.com/all?a=Jarod%20Guest) | CC0 |
||||
| Sounds | [prop sounds](https://www.youtube.com/watch?v=fnYv1KqfEuQ) | [Shane's DIY YouTube channel](https://www.youtube.com/@shanesdiy) | permission from the author |
||||
| Music | [Magenta Metropolis](https://www.free-stock-music.com/fsm-team-escp-magenta-metropolis.html) | [by \| e s c p \|](https://www.escp.space) | CC BY 4.0 |
||||
| Code | [three.js](https://github.com/mrdoob/three.js) | [mrdoob](https://github.com/mrdoob) | MIT |
|| [Rapier](https://rapier.rs/) | [dimforge](https://dimforge.com/) | Apache-2.0 |
|| [fisheye](https://www.decarpentier.nl/lens-distortion) | [Giliam de Carpentier](https://www.decarpentier.nl/) | BSD |



## Todo

* beginner drone should not descend in the beginning
* cooler name? Quadsch? Quadsimodo? AweQuad? Roflcopter? Cumkwat?
* make debug drawing work with worker architecture
* anti turtleing
* reset warp checkpoints by distance, not time
* rebuild raycast for camera position
* stabilization and tilt limiting combined oscillates
* properer drone physics?
* better physics -> sound mapping
* dead zone configurable
* config panel
* CCD
* solve the situations with the props cancelling motion blur
* exposure parameter for motion blur
* shadows
* tasks (at least checkpoints)
* crash sounds
* phone control
* maybe first rotate the tpv camera and then translate it?

## Neglected Physics

* Yaw, pitch and roll are assumed to be controlled by the flight controller and just respond directly to stick input with first-order lag (motor sounds are just heuristics).
* Prop thrust does not drop with increasing airflow.
* Motors do not saturate – attitude control still works fine at max thrust.
* There is no ground effect.
* There is no battery sag.
* There is no prop wash 🙄
