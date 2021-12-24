import * as tf from '@tensorflow/tfjs';

const names = ["LMS","BOARD","P","R","N","B","Q","K","p","r","n","b","q","k"]
const [modelWidth, modelHeight] = [512, 512];

async function main() {
    //const response = fetch("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==");
    const url = chrome.runtime.getURL("my-model.json");
    let model = await tf.loadGraphModel(url);
    chrome.runtime.onMessage.addListener(async (data, sender)=>{
        const typed = new Uint8Array(data.frame);
        const blob = new Blob([typed],{
            type: "image/jpeg"
        });
        const bitmap = await createImageBitmap(blob);

        const input = tf.image.resizeBilinear(tf.browser.fromPixels(bitmap), [512, 512])
        .div(255.0).expandDims(0);
        model.executeAsync(input).then((res:Array<any>)=>{
            console.log("DONE " + data.counter);
            console.log(res);
            let pieces = [];
            /*
            let final:{
                [index:string]:Array<Array<unknown>>
            } = {};
            */
            let final:any = {};
            const boxes = res[0].arraySync()[0];
            const probabilitys = res[1].arraySync()[0];
            const classes = res[2].arraySync()[0];
            const entries = res[3].arraySync()[0];
            for(let a = 0; a < entries; a++){
                const class_name = names[classes[a]];
                if(!final[class_name]){
                    final[class_name] = [];
                }
                final[class_name].push(boxes[a]);
            }
            console.log(final);
            let board_info;
            //let boxes = data.map((d)=>[])
            let by_class = {};
            //["LAST_MOVE_SQUARE","BOARD","P","R","N","B","Q","K","p","r","n","b","q","k"]
            let max_per_class = [2,1,8,8,8,8,8,1,8,8,8,8,8,1]
            for(let key of names){
                if(final[key] && (true || !["LMS"].includes(key))){
                    for(let [index,box] of final[key].entries()){
                        let [x1, y1, x2, y2] = box;
                        const width = x2 - x1;
                        const height = y2 - y1;
                        const klass = key;
                        const score = 1;
                        if(key === "BOARD"){
                            board_info = {
                                x: x1 + width/2,
                                y: y1 + height/2,
                                width,
                                height
                            }
                        }
                        else if(!["BOARD","LMS"].includes(key))
                            pieces.push({
                                type:key,
                                width,
                                height,
                                x: x1 + width/2,
                                y: y1 + height/2
                            })
                    }
                }        
            }
            let board = [
                ["","","","","","","",""],
                ["","","","","","","",""],
                ["","","","","","","",""],
                ["","","","","","","",""],
                ["","","","","","","",""],
                ["","","","","","","",""],
                ["","","","","","","",""],
                ["","","","","","","",""]
            ];
            console.log(board);
            if(board_info && true){
                let board_top_left = {
                    x:board_info.x - board_info.width/2,
                    y:board_info.y - board_info.height/2
                }
                console.log(board_info);
                for(let piece of pieces){  
                    let piece_cord = {
                        x:((piece.x - board_top_left.x)),
                        y:((piece.y - board_top_left.y))
                    }
                    console.log(piece_cord);
                    let cords = {
                        x:Math.floor(piece_cord.x/(board_info.width/8)),
                        y:Math.floor(piece_cord.y/(board_info.height/8))
                    }
                    console.log(board)
                    console.log(cords)
                    board[cords.y][cords.x] = piece.type;
                }
            }
            let fen = ""
            for(let row of board){
                let tracker = 0;
                if(fen !== "")
                    fen = `${fen}/`;
                for(let entry of row){
                    if(entry === ""){
                        tracker++;
                    }
                    else{
                        if(tracker === 0){
                            fen = `${fen}${entry}`;
                        }
                        else{
                            fen = `${fen}${tracker}${entry}`;
                        }
                        tracker = 0;
                    }
                }
                if(tracker !== 0){
                    fen = `${fen}${tracker}`
                }
            }
            console.log(fen);
        });
    })
}
main();
