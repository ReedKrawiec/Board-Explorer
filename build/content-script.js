/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/content-script.js":
/*!*******************************!*\
  !*** ./src/content-script.js ***!
  \*******************************/
/***/ (() => {

eval("async function main() {\n  stream = await navigator.mediaDevices.getDisplayMedia();\n  const url = chrome.runtime.getURL(\"/best_web_model/model.json\");\n  const shardsURLS = []\n  var file = new File([\"foo\"], \"foo.txt\", {\n    type: \"text/plain\",\n  });\n  console.log(url);\n  console.log(stream);\n}\nmain();\n\n//# sourceURL=webpack://board-explorer/./src/content-script.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/content-script.js"]();
/******/ 	
/******/ })()
;