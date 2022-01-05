import * as glm from 'glm-js'
console.log('declare module \'glm-js\' {}')
console.log('declare namespace glm {')
for (let i in glm) {
    console.log(`    const ${i}: ${glm[i].constructor.name}`)
}
console.log('}')