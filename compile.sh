cd $(dirname $0)
tsc ./game.ts
tsc ./js/frame.ts ./js/glmTypesGen.ts ./js/alert.ts ./js/renderWorld.ts ./js/gameLogic.ts ./js/tbn.ts
tsc ./server/requestFilter.ts