#! /usr/bin/bash
cd $(dirname $0)
tsc ./game.ts
tsc ./js/frame.ts ./js/glmTypesGen.ts ./js/alert.ts ./js/renderWorld.ts ./js/gameLogic.ts ./js/tbn.ts ./js/newYear.ts
tsc ./js/playerConfig.ts
tsc ./server/requestFilter.ts ./server/gameStatus.ts
echo Done.
read a
exit