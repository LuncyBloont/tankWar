cd $(dirname $0)
tsc ./game.ts
tsc ./js/frame.ts ./js/glmTypesGen.ts
tsc ./server/requestFilter.ts