import * as tf from '@tensorflow/tfjs';

const names = ["LMS", "BOARD", "P", "R", "N", "B", "Q", "K", "p", "r", "n", "b", "q", "k"]
const [modelWidth, modelHeight] = [512, 512];

function rgbToHex(r:number, g:number, b:number) {
    if (r > 255 || g > 255 || b > 255)
        throw "Invalid color component";
    return ((r << 16) | (g << 8) | b).toString(16);
}

function rgbRound(r:number, g:number, b:number) {
    return [r, g, b].map(x => Math.min(Math.round(x/36) * 36, 255))
}

enum Perspective {
    white,
    black,
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

let last_board:string[][];
let last_moved_cache:string;
async function parseBoardImage(model: tf.GraphModel, image: ImageBitmap) {
    const canvas = new OffscreenCanvas(512, 512);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const input = tf.image.resizeBilinear(tf.browser.fromPixels(image), [512, 512])
        .div(255.0).expandDims(0);
    const res: Array<any> = <Array<any>>await model.executeAsync(input);
    let pieces = [];
    let final: any = {};
    const boxes = res[0].arraySync()[0];
    const probabilitys = res[1].arraySync()[0];
    const classes = res[2].arraySync()[0];
    const entries = res[3].arraySync()[0];
    const global_sample_result_map:{
        [key:string]:{
            count:number,
            cords:number[][]
        }
    } = {};
    for (let a = 0; a < entries; a++) {
        const class_name = names[classes[a]];
        if (!final[class_name]) {
            final[class_name] = [];
        }
        final[class_name].push(boxes[a]);
    }
    let board_info: {
        width: number,
        height: number,
        x: number,
        y: number
    };
    //let boxes = data.map((d)=>[])
    let by_class = {};
    //["LAST_MOVE_SQUARE","BOARD","P","R","N","B","Q","K","p","r","n","b","q","k"]
    let max_per_class = [2, 1, 8, 8, 8, 8, 8, 1, 8, 8, 8, 8, 8, 1]
    for (let key of names) {
        if (final[key] && (true || !["LMS"].includes(key))) {
            for (let index = 0; index < final[key].length; index++) {
                let box = final[key][index];
                let [x1, y1, x2, y2] = box;
                const width = x2 - x1;
                const height = y2 - y1;
                const klass = key;
                const score = 1;
                
                if (key === "BOARD") {
                    board_info = {
                        x: x1 + width / 2,
                        y: y1 + height / 2,
                        width,
                        height
                    }
                }
                else if (!["BOARD", "LMS"].includes(key)){
                    /*
                    const color_samples = [
                        {
                            x: x1 * 512,
                            y: y1 * 512,
                        },
                        {
                            x: x2 * 512,
                            y: y1 * 512,
                        },
                        {
                            x: x1 * 512,
                            y: y2 * 512,
                        },
                        {
                            x: x2 * 512,
                            y: y2 * 512,
                        }    
                    ]
                    const sample_list:{
                        [key:string]:{
                            count:number,
                            color:string
                        }
                    } = {};
                    for(let sample of color_samples) {
                        let p = ctx.getImageData(sample.x, sample.y, 1, 1).data;
                        let q = rgbRound(p[0], p[1], p[2]);
                        let hex = "#" + rgbToHex(q[0], q[1], q[2]);
                        let pre = hex.slice(0,2);
                        if(!sample_list[hex]) {
                            sample_list[hex] = {
                                count: 1,
                                color: hex
                            }
                        }
                        else {
                            sample_list[hex].count++;
          document.querySelector("#eval").addEventListener("click", function() {
  chrome.runtime.sendMessage("eval");
  console.log("eval");
});              }
                        if(!global_sample_result_map[hex]){
                            global_sample_result_map[hex] = {
                                count: 1,
                                cords: [[x1,y1,x2,y2]]
                            };
                        } else {
                            global_sample_result_map[hex].cords.push([x1,y1,x2,y2]);
                        }
                    }
                    console.log(sample_list);
                    */
                    pieces.push({
                        type: key,
                        width,
                        height,
                        x: x1 + width / 2,
                        y: y1 + height / 2
                    })   
                }
            }
        }
    }
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
    if (board_info && true) {
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
    }
    let last_moved = "";
    
    let perspective = getTurn(board);
    if(perspective === Perspective.black) {
        board = board.map((row)=>row.reverse()).reverse();
    }
    let diffs:number[][] = [];
    if(last_board){
        for(let [y,row] of board.entries()){
            for(let [x, val] of row.entries()){
                if(val != last_board[y][x]){
                    diffs.push([y,x]);
                }
            }
        }
    }
    if(diffs.length > 2){
        const lowerCaseRegex = /[a-z]/
        let black_count = 0;
        let white_count = 0;
        for(let diff of diffs){
            let [y,x] = diff;
            if(board[y][x] != ""){
                if(board[y][x].match(lowerCaseRegex)){
                    black_count++;
                } else {
                    white_count++;
                }
                last_moved_cache = last_moved;
            }
        }
        console.log(`${white_count} ${black_count}`)
        if(black_count > white_count){
            last_moved = "w";
        } else if (white_count > black_count){
            last_moved = "b";
        } else {
            last_moved = last_moved_cache
        }
        console.log(last_moved)
    } else if (diffs.length == 0 && last_moved_cache){
        last_moved = last_moved_cache
    }
    last_board = board;
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
    return { fen, board_info, perspective, last_moved }
}

async function main() {
    //const response = fetch("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==");
    const url = chrome.runtime.getURL("my-model.json");
    let model = await tf.loadGraphModel(url);
    const canvas = new OffscreenCanvas(512,512);
    chrome.runtime.onMessage.addListener(async (data, sender) => {
        if(data == "eval"){
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, "eval", function (response) { });
            });
        }
        else if (data == "playable"){
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, "playable", function (response) { });
            });
        }
        else{
            const typed = new Uint8Array(data.frame);
            const blob = new Blob([typed], {
                type: "image/jpeg"
            });
            const bitmap = await createImageBitmap(blob);
            const { fen, board_info, perspective, last_moved } = await parseBoardImage(model, bitmap)
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, { fen, board_info, perspective, last_moved }, function (response) { });
            });
        }
        return true;
    })
}
main();
