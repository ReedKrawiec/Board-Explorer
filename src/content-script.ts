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

const MAX_DEPTH = 24;
const MIN_DEPTH_UPDATE_EVAL = 6;

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
  console.log("EVALING:" + fen)
  stockfish.postMessage("stop");
  stockfish.postMessage("ucinewgame");
  stockfish.postMessage("position fen " + fen);
  stockfish.postMessage(`go depth ${MAX_DEPTH}`);
  stockfish.onmessage = function (e: any) {
    const line = e.data;
    const regex = /.+\sdepth\s(\d+).+cp\s(-*\d+)/;
    const found = line.match(regex);
    if (found && found[1] && found[2]) {
      let cp = parseInt(found[2]);
      let depth = parseInt(found[1]);
      if(depth > MIN_DEPTH_UPDATE_EVAL){
        if (turn === "b") {
          cp = -cp;
        }
        console.log(cp);
        func(cp);
      }
    }
  }
}

function swapTurn(chess: any) {
  //console.log(chess.fen());
  let tokens = chess.fen().split(" ");
  tokens[1] = chess.turn() === "b" ? "w" : "b";
  tokens[3] = "-";
  const new_fen = tokens.join(" ");
  //console.log(new_fen);
  chess.load(new_fen);
}

export function playOtherSide(cg: any, chess: any, stockfish: Worker) {
  
  return (orig: any, dest: any) => {
    const piece = chess.get(orig)
    if(piece.color !== chess.turn()){
      swapTurn(chess);
    }
    let result = chess.move({ from: orig, to: dest, promotion: 'q' });
    console.log(chess.fen());
    evalFen(stockfish,chess.fen(),chess.turn(),(cp)=>{
      
      let clamped = Math.min(1000,Math.max(cp,-1000));
      let regularized = 1 - (clamped + 1000) / 2000;
      bar2.style.height = regularized * 100 + "%";
    });
    
   const color = piece.color === 'w' ? 'b' : 'w';
    cg.set({
      fen: chess.fen(),
      turnColor: toColor(chess),
      movable: {
        color:toColor(chess),
        dests: toDests(chess)
      }
    });
  };
}

function toDests(chess: any): Map<Key, Key[]> {
  const dests = new Map();
  
  chess.SQUARES.forEach((square: any) => {
    let [current,next] = chess.turn() === 'w' ? ["w","b"] : ["b","w"];
    let ms = chess.moves({ square, verbose: true });
    swapTurn(chess);
    let other = chess.moves({ square, verbose: true });
    ms = [...ms,...other];
    if (ms.length) dests.set(square, ms.map ((m: any) => m.to));
    swapTurn(chess);
  });
  return dests;
}

let last_fen:string;
let last_moved_cache:string;
async function main() {
  const text = await fetch(chrome.runtime.getURL("stockfish.js"));
  const script = await text.text();
  blob = new Blob([script], { type: 'application/javascript' });
  var stockfish = new Worker(URL.createObjectURL(blob));
  stockfish.postMessage("uci");
  
  chrome.runtime.onMessage.addListener(async (data, sender) => {
    if(data == "eval"){
      shouldRenderEval = !shouldRenderEval;
      console.log(`EVAL TURNED:${shouldRenderEval}`)
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
      console.log(`PLAYABLE TURNED:${shouldRenderBoard}`)
      hasAlreadyRenderedBoard = false;
      if(!shouldRenderBoard){
        board.style.visibility = "hidden";
      }
      return true;
    }
    const { fen, board_info, perspective, last_moved } = data;
    console.log("LAST MOVED=" + last_moved);
    let turn;
    if(last_moved != "" && last_moved != last_moved_cache){
      turn = last_moved === "w" ? "b" : "w";
      console.log(`TURN = ${turn}`);
      last_moved_cache = turn;
    } else {
      turn = perspective === 0 ? "w" : "b";
    }
    let fullFen = `${fen} ${turn} - - 0 1`;
    
    if(last_fen === fullFen){
      return;
    }
    console.log(fullFen);
    last_fen = fullFen;
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
      const dests = toDests(chess)
      cg = Chessground(board, {
        fen: fullFen,
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
          dests
        }
      });
      cg.set({
        movable: { events: { after: playOtherSide(cg, chess, stockfish) } }
      });
      
    }
    if(shouldRenderEval && !shouldRenderBoard){
      evalFen(stockfish,fullFen,chess.turn(),(cp)=>{
        let clamped = Math.min(1000,Math.max(cp,-1000));
        let regularized = 1 - (clamped + 1000) / 2000;
        const boardHeight = board_info.height * imagewidth;
        const right = (imagewidth - (board_info.x * imagewidth - boardWidth / 2))
        evalBar.style.height = boardHeight + "px";
        bar2.style.height = regularized * 100 + "%";
        evalBar.style.right = right + "px";
        evalBar.style.top = top + "px";
        evalBar.style.visibility = "visible"
        //document.getElementById("evaluation").innerHTML = `${cp / 100}`;
      });
    }
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
  }, 1000);
}
main();
