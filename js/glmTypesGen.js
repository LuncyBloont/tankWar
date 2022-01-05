"use strict";
exports.__esModule = true;
var glm = require("glm-js");
console.log('declare module \'glm-js\' {}');
console.log('declare namespace glm {');
for (var i in glm) {
    console.log("    const ".concat(i, ": ").concat(glm[i].constructor.name));
}
console.log('}');
