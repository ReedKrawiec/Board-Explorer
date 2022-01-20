import * as tf from '@tensorflow/tfjs';
import { Chessground } from 'chessground';
import { Color, Key } from 'chessground/types';

// @ts-ignore
import * as Chess from "chess.js";
import { EvalSourceMapDevToolPlugin } from 'webpack';
const box = document.body.getBoundingClientRect();
const [imagewidth, imageheight] = [box.width, box.height];
//const [screenWidth,screenHeight] = [box.width, ];
const gutterHeight = (imagewidth - document.body.getBoundingClientRect().height) / 2;

console.log(`gutter:${gutterHeight}`);
console.log(document.body.clientHeight)
console.log(document.body.getBoundingClientRect().height);

let cover: HTMLElement;

let already = false;

let cg: any;


var blob;

export function toColor(chess: any): Color {
  return (chess.turn() === 'w') ? 'white' : 'black';

}

export function playOtherSide(cg: any, chess: any) {
  return (orig: any, dest: any) => {
    chess.move({ from: orig, to: dest });
    cg.set({
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
  chess.SQUARES.forEach((s: any) => {
    const ms = chess.moves({ square: s, verbose: true });
    if (ms.length) dests.set(s, ms.map((m: any) => m.to));
  });
  return dests;
}
async function main() {
  const text = await fetch(chrome.runtime.getURL("stockfish.js"));
  const script = await text.text();
  blob = new Blob([script], { type: 'application/javascript' });
  var stockfish = new Worker(URL.createObjectURL(blob));

  async function evaluateFen(fen: string):Promise<number> {
    return new Promise((resolve, reject) => {
      stockfish.postMessage("uci");
      // start new game
      stockfish.postMessage("ucinewgame");
      stockfish.postMessage("position fen " + fen);
      // start search
      stockfish.postMessage("go depth 14");
      let values: string[] = [];
      stockfish.onmessage = function (e) {
        values.push(e.data);
        if (values.length > 5) {
          values.shift();
        }
        if(values[values.length - 1].indexOf("bestmove") > -1){
          let line = values[values.length - 2];
          const regex = /.+\scp\s(\d+)\s.+/;
          const found = line.match(regex);
          console.log(line);
          resolve(parseInt(found[1]));
        }
      };
    });
  }

  chrome.runtime.onMessage.addListener(async (data, sender) => {
    const { fen, board_info, perspective } = data;
    if (!already) {
      cover = document.createElement("div");
      cover.id = "board";
      cover.classList.add("blue");
      cover.classList.add("meridia")
      cover.style.border = "solid 2px black";
      cover.style.position = "absolute";
      document.body.appendChild(cover);
      const boardWidth = board_info.width * imagewidth;
      const boardHeight = board_info.height * imagewidth;
      cover.style.width = boardWidth + "px";
      cover.style.height = boardWidth + "px";
      cover.style.left = board_info.x * imagewidth - boardWidth / 2 + "px";
      cover.style.top = 0.75 * (board_info.y * imagewidth - boardHeight / 2 - gutterHeight) + "px";
      already = true;
      let fullFen = `${fen} ${perspective == 0 ? "w" : "b"} - - 0 1`;
      console.log(fullFen);
      let evaluation:number = await evaluateFen(fullFen) / 100;
      
      let chess: any = new Chess(fullFen);
      cg = Chessground(cover, {
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
          color: perspective == 0 ? "white" : "black",
          free: false,
          dests: toDests(chess),
        }
      });
      cg.set({
        movable: { events: { after: playOtherSide(cg, chess) } }
      });
      let pNode = document.createElement("p");
      pNode.style.position = "absolute";
      pNode.style.top = "0px";
      pNode.style.left = "0px";
      let textNode = document.createTextNode(`${evaluation}`);
      pNode.appendChild(textNode);
      cover.appendChild(pNode);
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
    if (!already) {
      chrome.runtime.sendMessage({
        frame: Array.from(typed),
        counter
      });
    }
    counter++;
  }, 2000);
}
main();
