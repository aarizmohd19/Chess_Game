const express = require("express");
const socket = require('socket.io');
const http = require('http');
const {Chess} = require("chess.js");
const path = require('path'); 
const { log } = require("console");
const app = express();

const server = http.createServer(app);//created server using http linked with express server

const io = socket(server);//instantiated the socket.io

const chess = new Chess();//created chess object instance
let players = {};//initialized players object
let currentPlayer = 'w';//initialized currentPlayer with current turn

app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")));

app.get('/', (req,res) => {
    res.render("index");
});

io.on("connection", function(uniquesocket) {
    console.log("connected");

    if(!players.white){
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole","w");
    }
    else if(!players.black){
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole","b");
    }
    else {
        uniquesocket.emit("spectatorRole");
    } 

    uniquesocket.on("disconnect", function(){
        if(uniquesocket.id === players.white){
            delete players.white
        }
        else if(uniquesocket.id === players.black){
            delete players.black
        }
    });

    uniquesocket.on("move", (move)=> {
        try{
            if(chess.turn() === 'w' && uniquesocket.id !== players.white) return;//for any player playing without turn
            if(chess.turn() === 'b' && uniquesocket.id !== players.black) return;//for any player playing without turn

            const result = chess.move(move);//Getting the move into result and validating move through chess.move() 
            if(result){//Checking if the move is valid or not
                currentPlayer = chess.turn();
                io.emit("move",move);
                io.emit("boardState",chess.fen());
            }
            else {
                console.log("Invalid Move",move);
                uniquesocket.emit("invalidMove", move);
            }
        }
        catch(err){
            console.log(err);
            uniquesocket.emit("invalidMove", move);
        }
    })
});

server.listen(3000,function () {
    console.log("Listening on port 3000");
});