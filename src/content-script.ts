import * as tf from '@tensorflow/tfjs';
import { Chessground } from 'chessground';
import { Color, Key } from 'chessground/types';

// @ts-ignore
import * as Chess from "chess.js";
import { EvalSourceMapDevToolPlugin } from 'webpack';
import { batchGetValue } from '@tensorflow/tfjs-layers/dist/variables';
const box = document.body.getBoundingClientRect();
const [imagewidth, imageheight] = [box.width, box.height];
const gutterHeight = (imagewidth - document.body.getBoundingClientRect().height) / 2;

console.log(`gutter:${gutterHeight}`);
console.log(document.body.clientHeight)
console.log(document.body.getBoundingClientRect().height);

let hasAlreadyRenderedBoard = false;
let shouldRenderBoard = false;
let shouldRenderEval = false;


let cg: any;
var blob;

export function toColor(chess: any): Color {
  return (chess.turn() === 'w') ? 'white' : 'black';

}

let evalBar = document.createElement("div");
let bar2 = document.createElement("div");
evalBar.appendChild(bar2);
evalBar.style.width = "10px";
evalBar.style.position = "absolute";
evalBar.style.display = "flex";
evalBar.style.backgroundColor = "white";
evalBar.style.visibility = "hidden";
bar2.style.width = "100%";
bar2.style.backgroundColor = "black";
document.body.appendChild(evalBar);

const board = document.createElement("div");
board.id = "board";
board.classList.add("blue");
board.classList.add("meridia")
board.style.border = "solid 2px black";
board.style.position = "absolute";
document.body.appendChild(board);

function evalFen(stockfish:Worker,fen:string, turn:"w"|"b", func:(cp:number)=>void){
  stockfish.postMessage("stop");
  stockfish.postMessage("ucinewgame");
  stockfish.postMessage("position fen " + fen);
  stockfish.postMessage("go depth 22");
  stockfish.onmessage = function (e: any) {
    const line = e.data;
    const regex = /.+\scp\s(-*\d+)/;
    const found = line.match(regex);
    if (found && found[1]) {
      let cp = parseInt(found[1]);
      if (turn === "b") {
        cp = -cp;
      }
      func(cp);
    }
  }
}

export function playOtherSide(cg: any, chess: any, stockfish: Worker) {
  
  return (orig: any, dest: any) => {
    chess.move({ from: orig, to: dest, promotion: 'q' });
    evalFen(stockfish,chess.fen(),chess.turn(),()=>{

    });
    cg.set({
      fen: chess.fen(),
      turnColor: toColor(chess),
      movable: {
        color: toColor(chess),
        dests: toDests(chess)
      }
    });
  };
}

function toDests(chess: any): Map<Key, Key[]> {
  const dests = new Map();
  function swapTurn(chess: any) {
    //console.log(chess.fen());
    let tokens = chess.fen().split(" ");
    tokens[1] = chess.turn() === "b" ? "w" : "b";
    tokens[3] = "-";
    const new_fen = tokens.join(" ");
    //console.log(new_fen);
    chess.load(new_fen);
  }
  chess.SQUARES.forEach((square: any) => {
    let [current,next] = chess.turn() === 'w' ? ["w","b"] : ["b","w"];
    let ms = chess.moves({ square, verbose: true });
    swapTurn(chess);
    ms = [...ms,...chess.moves({ square, verbose: true })];
    //console.log(ms);
    if (ms.length) dests.set(square, ms.map ((m: any) => m.to));
    swapTurn(chess);
  });
  return dests;
}


async function main() {
  const text = await fetch(chrome.runtime.getURL("stockfish.js"));
  const script = await text.text();
  blob = new Blob([script], { type: 'application/javascript' });
  var stockfish = new Worker(URL.createObjectURL(blob));

  stockfish.postMessage("uci");
  
  chrome.runtime.onMessage.addListener(async (data, sender) => {
    if(data == "eval"){
      shouldRenderEval = !shouldRenderEval;
      if(!shouldRenderEval){
        evalBar.style.visibility = "hidden";
      }
      else {
        evalBar.style.visibility = "visible";
      }
      return true;
    }
    if(data == "playable"){
      shouldRenderBoard = !shouldRenderBoard;
      hasAlreadyRenderedBoard = false;
      console.log(shouldRenderBoard);
      if(!shouldRenderBoard){
        board.style.visibility = "hidden";
      }
      return true;
    }
    const { fen, board_info, perspective } = data;
    let fullFen = `${fen} ${perspective == 0 ? "w" : "b"} - - 0 1`;
    let chess: any = new Chess(fullFen);
    const boardWidth = board_info.width * imagewidth;
    const boardHeight = board_info.height * imagewidth;
    const top = 0.75 * (board_info.y * imagewidth - boardHeight / 2 - gutterHeight)
    if (!hasAlreadyRenderedBoard && shouldRenderBoard) {
      board.style.visibility = "visible";
      board.style.width = boardWidth + "px";
      board.style.height = boardWidth + "px";
      board.style.left = board_info.x * imagewidth - boardWidth / 2 + "px";
      board.style.top = top + "px";
      hasAlreadyRenderedBoard = true;

      cg = Chessground(board, {
        fen: fullFen,
        turnColor: perspective == 0 ? "white" : "black",
        orientation: perspective == 0 ? "white" : "black",
        animation: {
          duration: 500
        },
        draggable: {
          showGhost: true
        },
        movable: {
          color: "both",
          free: false,
          dests: toDests(chess),
        }
      });
      cg.set({
        movable: { events: { after: playOtherSide(cg, chess, stockfish) } }
      });
    }
    evalFen(stockfish,chess.fen(),chess.turn(),(cp)=>{
      let clamped = Math.min(1000,Math.max(cp,-1000));
      let regularized = 1 - (clamped + 1000) / 2000;
      const boardHeight = board_info.height * imagewidth;
      const right = (imagewidth - (board_info.x * imagewidth - boardWidth / 2))
      evalBar.style.height = boardHeight + "px";
      bar2.style.height = regularized * boardHeight + "px";
      evalBar.style.right = right + "px";
      evalBar.style.top = top + "px";
      //document.getElementById("evaluation").innerHTML = `${cp / 100}`;
    });
    return true;
  })

  let counter = 0;

  // @ts-ignore
  const stream = await navigator.mediaDevices.getDisplayMedia({
    audio: false
  });

  const canvas = <HTMLCanvasElement>document.createElement("canvas");
  canvas.height = 512;
  canvas.width = 512;
  const ctx = canvas.getContext("2d");

  const video = <HTMLVideoElement>document.createElement("video");
  video.srcObject = stream;
  await video.play();
  const url = chrome.runtime.getURL("my-model.json");
  let model = await tf.loadGraphModel(url);

  setInterval(async () => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const new_width = 512;
    const new_height = 512 / imagewidth * imageheight * 0.95;
    ctx.drawImage(
      video,
      512 / 2 - new_width / 2,
      512 / 2 - new_height / 2,
      new_width,
      new_height
    );
    const blob: Blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg"));
    //const bitmap = await createImageBitmap(blob);

    //const input = tf.image.resizeBilinear(tf.browser.fromPixels(bitmap), [512, 512])
    //.div(255.0).expandDims(0);
    const buffer = await blob.arrayBuffer();
    const typed = new Uint8Array(buffer);
    if (!hasAlreadyRenderedBoard) {
      chrome.runtime.sendMessage({
        frame: Array.from(typed),
        counter
      });
    }
    counter++;
  }, 2000);
}
main();
