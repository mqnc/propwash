# propwash
FPV drone simulator for the web

TL;DR! Let me [play](https://mqnc.github.io/propwash/?config=configs/issum_ascend.json5,configs/beginner.json5)!

## Status

Everything is still in prototype phase!

* Use a gamepad (strongly recommended) or WASD as the left stick, mouse as the right stick (need to click into the game window to capture the mouse first)
* Keys 1-4 switch between the different drone control modes with mode 2 as default
* Use R on keyboard or gamepad (button 5) to reset position to where it was a second ago
* Use space to switch between first person and third person camera

If you clone the repo and host it locally, you can configurate your drone to your heart's content by creating a config file in `configs/` and then loading it with the URL parameter `http://localhost:8000?config=configs/myconfig.json5`.

## Demos

| Mission | Skill |
|---|---|
|Issum — Storm the Castle|[Noob](https://mqnc.github.io/propwash/?config=configs/issum_ascend.json5,configs/beginner.json5) / [Mid](https://mqnc.github.io/propwash/?config=configs/issum_ascend.json5,configs/intermediate.json5) / [Pro](https://mqnc.github.io/propwash/?config=configs/issum_ascend.json5)
|Issum — Pop all 12 Balloons|[Noob](https://mqnc.github.io/propwash/?config=configs/issum_balloons.json5,configs/beginner.json5) / [Mid](https://mqnc.github.io/propwash/?config=configs/issum_balloons.json5,configs/intermediate.json5) / [Pro](https://mqnc.github.io/propwash/?config=configs/issum_balloons.json5)
|Issum — Freestyle|[Noob](https://mqnc.github.io/propwash/?config=configs/issum.json5,configs/beginner.json5) / [Mid](https://mqnc.github.io/propwash/?config=configs/issum.json5,configs/intermediate.json5) / [Pro](https://mqnc.github.io/propwash/?config=configs/issum.json5)
|Playground — Freestyle|[Noob](https://mqnc.github.io/propwash/?config=configs/playground.json5,configs/beginner.json5) / [Mid](https://mqnc.github.io/propwash/?config=configs/playground.json5,configs/intermediate.json5) / [Pro](https://mqnc.github.io/propwash/?config=configs/playground.json5)
|Bando — Freestyle|[Noob](https://mqnc.github.io/propwash/?config=configs/bando.json5,configs/beginner.json5) / [Mid](https://mqnc.github.io/propwash/?config=configs/bando.json5,configs/intermediate.json5) / [Pro](https://mqnc.github.io/propwash/?config=configs/bando.json5)
|Cyber Crazy Park — Freestyle|[Noob](https://mqnc.github.io/propwash/?config=configs/park.json5,configs/beginner.json5) / [Mid](https://mqnc.github.io/propwash/?config=configs/park.json5,configs/intermediate.json5) / [Pro](https://mqnc.github.io/propwash/?config=configs/park.json5)
|Sketchfab Town (80 MB) — Freestyle|[Noob](https://mqnc.github.io/propwash/?config=configs/sketchfab.json5,configs/beginner.json5) / [Mid](https://mqnc.github.io/propwash/?config=configs/sketchfab.json5,configs/intermediate.json5) / [Pro](https://mqnc.github.io/propwash/?config=configs/sketchfab.json5)

## Contribute

I don't actually have any real drone experience beyond some DRL Sim, I need help tweaking parameters!

I'm also not much of a level designer, would be awesome people could contribute maps.

Please somehow interact with the Discussion page if you want to contribute.

## Attributions

The assets used in this project are subject to various licenses. They are **not relicensed under MIT** unless explicitly noted.  

| Asset | Title | Authors | License |
|---|---|---|---|
||||
| Models | [Racing drone (Lite Graphics Version)](https://skfb.ly/6zBPO) | [BlueMesh](https://sketchfab.com/BlueMesh) | CC BY 4.0 |
||||
| Maps | [Issum, The town on Capital Isle](https://skfb.ly/6zFKD) | [Olee](https://sketchfab.com/Olee) | CC BY 4.0 |
|| [playground 2](https://skfb.ly/pyZnG) | [Pasha](https://sketchfab.com/Pasha-) | CC BY 4.0 |
|| [Post-Apocalyptic City](https://skfb.ly/pD6BX) | [golukumar](https://sketchfab.com/mortalityrexotable) | CC BY 4.0 |
|| [Amusement park](https://skfb.ly/p7GFu) | [Megame Studio](https://sketchfab.com/megame1) | CC BY-NC-SA 4.0 |
|| [Cartoon Low Poly City \(Mini Pack\)](https://skfb.ly/oE7Oq) | [mertkilic](https://sketchfab.com/mertkilic) | CC BY 4.0 |
|| [Low Poly Black Castle](https://skfb.ly/oV6DZ) | [Bl4ck Gh0st](https://sketchfab.com/Bl4ckGh0st) | CC BY 4.0 |
|| [Bridge Town](https://skfb.ly/oyLnx) | [yeeko](https://sketchfab.com/yeeko) | CC BY 4.0 |
|| [Eiffel Tower](https://skfb.ly/AIU9) | [Johnson Martin](https://sketchfab.com/Johnson-Martin) | CC BY 4.0 |
|| [Menger Sponge](https://skfb.ly/oBZuz) | [myboy2012](https://sketchfab.com/myboy2012) | CC BY 4.0 |
||||
| HDRIs | [Pretoria Gardens](https://polyhaven.com/a/pretoria_gardens) | [Dimitrios Savva](https://polyhaven.com/all?a=Dimitrios%20Savva), [Jarod Guest](https://polyhaven.com/all?a=Jarod%20Guest) | CC0 |
|| [Qwantani Night](https://polyhaven.com/a/qwantani_night) | [Greg Zaal](https://polyhaven.com/all?a=Greg%20Zaal), [Jarod Guest](https://polyhaven.com/all?a=Jarod%20Guest) | CC0 |
|| [Qwantani Noon \(Pure Sky\)](https://polyhaven.com/a/qwantani_noon_puresky) | [Greg Zaal](https://polyhaven.com/all?a=Greg%20Zaal), [Jarod Guest](https://polyhaven.com/all?a=Jarod%20Guest) | CC0 |
||||
| Sounds | [prop sounds](https://www.youtube.com/watch?v=fnYv1KqfEuQ) | [Shane's DIY YouTube channel](https://www.youtube.com/@shanesdiy) | permission from the author |
|| [hit - hollow 03.wav](https://freesound.org/people/Anthousai/sounds/406266/) | [Anthousai](https://freesound.org/people/Anthousai/) | CC0 |
||||
| Music | [Magenta Metropolis](https://www.free-stock-music.com/fsm-team-escp-magenta-metropolis.html) | [by \| e s c p \|](https://www.escp.space) | CC BY 4.0 |
||||
| Code | [three.js](https://github.com/mrdoob/three.js) | [mrdoob](https://github.com/mrdoob) | MIT |
|| [Rapier](https://rapier.rs/) | [dimforge](https://dimforge.com/) | Apache-2.0 |
|| [fisheye](https://www.decarpentier.nl/lens-distortion) | [Giliam de Carpentier](https://www.decarpentier.nl/) | BSD |



## Todo

* drone should not descend in the beginning
* cooler name? Quadsch? Quadsimodo? AweQuad? Roflcopter? Cumkwat?
* anti turtleing
* reset warp checkpoints by distance, not time
* stabilization and tilt limiting combined oscillates
* properer drone physics?
* better physics -> sound mapping
* dead zone configurable
* thrust knee configurable
* live config changes
* save custom config (browser memory and/or copy-paste text field)
* CCD
* CCD for checkpoints!
* solve the situations with the props cancelling motion blur
* shadows
* crash sounds
* phone control
* config: maybe first rotate the tpv camera and then translate it?
* LOD
* test slowmotion
* camera looks in flight direction?
* can't set shutter speed to infinity with lil gui
* clean up prop animation and play properly (instead of randomizing the frame)
* make inertia configurable
* make compatible with other gamepads

## Neglected Physics

* Yaw, pitch and roll are assumed to be controlled by the flight controller and just respond directly to stick input with first-order lag (motor sounds are just heuristics).
* Prop thrust does not drop with increasing airflow.
* Motors do not saturate – attitude control still works fine at max thrust.
* There is no ground effect.
* There is no battery sag.
* There is no prop wash 🙄
