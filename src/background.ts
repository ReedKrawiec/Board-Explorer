import * as tf from '@tensorflow/tfjs';

const names = ["BOARD", "p", "r", "n", "b", "q", "k", "P", "R", "N", "B", "Q", "K"]
const [modelWidth, modelHeight] = [512, 512];

enum Perspective {
    white,
    black,
}

interface piece {
    type: string,
    width: number,
    height: number,
    x: number,
    y: number
}

interface boardLocation {
    width: number,
    height: number,
    x: number,
    y: number
}

function getTurn(board:string[][]):Perspective {
    let whiteKingSide = "top";
    let blackKingSide = "top"
    let whitePawns7th = 0;
    let whitePawns2nd = 0;
    let blackPawns7th = 0;
    let blackPawns2nd = 0;
    for(let y = 0; y < 8; y++) {
        for(let x = 0; x < 8; x++) {
            
            if(board[y][x] == "K") {
                if(y < 4) {
                    whiteKingSide = "top";
                }
                else {
                    whiteKingSide = "bottom";
                }
            } else if (board[y][x] == "k"){
                if(y < 4) {
                    blackKingSide = "top";
                }
                else {
                    blackKingSide = "bottom";
                }
            } else if(board[y][x] == "P"){
                if(y == 6){
                    whitePawns7th++;
                } else if(y == 1){
                    whitePawns2nd++;
                }
            } else if(board[y][x] == "p"){
                if(y == 6){
                    blackPawns7th++;
                } else if(y == 1){
                    blackPawns2nd++;
                }
            }
        }
    }
    if(whiteKingSide != blackKingSide){
        if(whiteKingSide == "top"){
            return Perspective.black;
        }
        return Perspective.white;
    }
    if(whitePawns7th > 2 || blackPawns2nd > 2){
        return Perspective.white;
    }
    if(blackPawns7th > 2 || whitePawns2nd > 2){
        return Perspective.black;
    }
    if(blackPawns2nd < whitePawns2nd){
        return Perspective.black;
    }
    return Perspective.white;
}

const createFen = (board:string[][]) => {
    let fen = ""
    for (let row of board) {
        let tracker = 0;
        if (fen !== "")
            fen = `${fen}/`;
        for (let entry of row) {
            if (entry === "") {
                tracker++;
            }
            else {
                if (tracker === 0) {
                    fen = `${fen}${entry}`;
                }
                else {
                    fen = `${fen}${tracker}${entry}`;
                }
                tracker = 0;
            }
        }
        if (tracker !== 0) {
            fen = `${fen}${tracker}`
        }
    }
    return fen;
}

const boardDiff = (board1: string[][], board2: string[][]) => {
    if(board2 == null) {
        return {diffs:[], black_count:0, white_count:0}
    }
    const lowerCaseRegex = /[a-z]/
    const diffs = [];
    let black_count = 0;
    let white_count = 0;
    for (let [y, row] of board1.entries()) {
        for (let [x, val] of row.entries()) {
            if (val != board2[y][x]) {
                diffs.push([y, x]);
                if (val != "") {
                    if (val.match(lowerCaseRegex)) {
                        black_count++;
                    } else {
                        white_count++;
                    }
                }
            }
        }
    }
    return {diffs, black_count, white_count};
}

const determineLastMoved = (last_moved_cache:string,white_count:number,black_count:number) => {
    if (black_count > white_count) {
        return {last_moved: "b", cache: "b"}
    } else if (white_count > black_count) {
        return {last_moved: "w", cache: "w"}
    } else if(last_moved_cache === "w" || last_moved_cache === "b"){
        return {last_moved: last_moved_cache, cache: last_moved_cache}
    } else {
        return {last_moved: "w", cache: null}
    }
}

const createBoardArray = (pieces:piece[],board_info:boardLocation) => {
    let board = [
        ["", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""]
    ];
    let board_top_left = {
        x: board_info.x - board_info.width / 2,
        y: board_info.y - board_info.height / 2
    }
    for (let piece of pieces) {
        let piece_cord = {
            x: ((piece.x - board_top_left.x)),
            y: ((piece.y - board_top_left.y))
        }
        let cords = {
            x: Math.floor(piece_cord.x / (board_info.width / 8)),
            y: Math.floor(piece_cord.y / (board_info.height / 8))
        }
        board[cords.y][cords.x] = piece.type;
    }
    return board;
}

const parseTensorResults = (entries:any,boxes:any,classes:any) => {
    let board_info: boardLocation;
    let pieces: piece[] = [];
    for (let a = 0; a < entries; a++) {
        const class_name = names[classes[a]];
        let box = boxes[a];
        let [x1, y1, x2, y2] = box;
        const width = x2 - x1;
        const height = y2 - y1;
        if (class_name === "BOARD") {
            board_info = {
                x: x1 + width / 2,
                y: y1 + height / 2,
                width,
                height
            }
        }
        else {
            pieces.push({
                type: class_name,
                width,
                height,
                x: x1 + width / 2,
                y: y1 + height / 2
            })
        }
    }
    return {board_info, pieces};
}

const parseRawBoardImage = async (model: tf.GraphModel, image:ImageBitmap) => {
    tf.engine().startScope()
    const canvas = new OffscreenCanvas(512, 512);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const input = tf.image.resizeBilinear(tf.browser.fromPixels(image), [512, 512])
        .div(255.0).expandDims(0);
    const res: any = <any>await model.executeAsync(input);
    input.dispose();
    const boxes = res[0].arraySync()[0];
    const classes = res[2].arraySync()[0];
    const entries = res[3].arraySync()[0];
    for(let tensor of res){
        tensor.dispose();
    }
    tf.engine().endScope();
    return {boxes,classes,entries}
}

let last_board:string[][];
let last_moved_cache:string;
async function parseBoardImage(model: tf.GraphModel, image: ImageBitmap) {
    const {boxes,classes,entries} = await parseRawBoardImage(model,image);
    let {board_info, pieces} = await parseTensorResults(entries, boxes, classes);
    console.log(board_info);
    console.log(pieces);
    if(!board_info){
        return null;
    }
    let board = createBoardArray(pieces,board_info);
    let perspective = getTurn(board);
    if(perspective === Perspective.black) {
        board = board.map((row)=>row.reverse()).reverse();
    }
    let last_moved;
    const {diffs, black_count, white_count} = boardDiff(board, last_board);
    if (diffs.length > 0) {
        console.log("///////////////")
        console.log(black_count);
        console.log(white_count);
        console.log(last_moved_cache);    
        let {last_moved:move, cache} = determineLastMoved(last_moved_cache,board.reduce((acc,row)=>acc+row.filter((val)=>val!=="").length,0),board.reduce((acc,row)=>acc+row.filter((val)=>val!=="").length,0));
        last_moved = move;
        last_moved_cache = cache;
    }
    last_board = board;
    const fen = createFen(board);
    return { fen, board_info, perspective, last_moved, numDiffs: diffs.length };
}

const frameToBitmap = async (frame: any): Promise<ImageBitmap> => {
    const typed = new Uint8Array(frame);
    const blob = new Blob([typed], {
        type: "image/jpeg"
    });
    const bitmap = await createImageBitmap(blob);
    return bitmap;
}

async function main() {
    const url = chrome.runtime.getURL("model/my-model.json");
    let model:tf.GraphModel = await tf.loadGraphModel(url);
    chrome.runtime.onMessage.addListener(async (data, sender) => {
        if (data == "toggle") {
            const curr = await chrome.storage.local.get("enabled")
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, "toggle", function (response) { });
            });
            if(!curr.enabled){
                model = await tf.loadGraphModel(url);
            }
            else{
                model = null;
            }
            await chrome.storage.local.set({
                enabled: !curr.enabled,
            });
        }    
        if(data == "eval"){
            const curr = await chrome.storage.local.get("evaluating")
            await chrome.storage.local.set({
                evaluating: !curr.evaluating,
            });
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, "eval", function (response) { });
            });
        }
        else if (data == "playable"){
            const curr = await chrome.storage.local.get("playable")
            await chrome.storage.local.set({
                playable: !curr.playable,
            });
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, "playable", function (response) { });
            });
        }
        else{
            const bitmap = await frameToBitmap(data.frame);
            const result = await parseBoardImage(model, bitmap);
            if(!result){
                return;
            }
            const {fen,board_info,perspective,last_moved,numDiffs} = result;
            if(numDiffs > 0) {
                chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, { fen, board_info, perspective, last_moved }, function (response) { });
                });
            }
        }
        return true;
    })
}

chrome.storage.local.set({
    "enabled": false,
    "evaluating": false,
    "playable": false
})

main();
