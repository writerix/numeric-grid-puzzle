var canvas = document.getElementById("puzzle");
var ctx = canvas.getContext("2d");
var minCanvasDimension = Math.floor(Math.min(window.innerWidth * 0.8, window.innerHeight * 0.8));

var tileWidth;
var tileHeight;
const TILE_COLOR = "#eadea6";
const EMBOSS_COLOR = "#ccc291";
const BORDER_RATIO = 0.025;
const FONT_LIST = "px Helvetica Neue, Helvetica, Arial, sans-serif";

const UP = 0;
const RIGHT = 1;
const DOWN = 2;
const LEFT = 3;
const ANIMATION_LENGTH = 100;
const CLICK = 0;
const UNDO = 1;
const REDO = 2;
const MAX_ROW_HINT = 3;
const MAX_COLUMN_HINT = 3;

var moveHistory;
var tiles;
var startingTileLayout;
var clickHistory;

var arrowTiles;

class Tile{
    constructor(xpos, ypos, sLength, mainColor, context){
        this.xpos = xpos;
        this.ypos = ypos;
        this.sLength = sLength;
        this.border = 0;
        this.mainColor = mainColor;
        this.context = context;
    }
    draw(xpos = this.xpos, ypos = this.ypos){
        this.context.fillStyle = this.mainColor;
        this.context.fillRect(xpos + this.border, ypos + this.border, this.sLength - (2 * this.border), this.sLength - (2 * this.border));
    }
}

class ArrowTile extends Tile{
    constructor(xpos, ypos, sLength, mainColor, direction, context){
        super(xpos, ypos, sLength, mainColor, context);
        this.direction = direction;
    }
    draw(){
        super.draw(this.xpos, this.ypos);
        this.context.fillStyle = "black";
        this.context.beginPath();
        switch(this.direction){
            case UP:
                this.context.moveTo(this.xpos + 0.3 * this.sLength, this.ypos + 0.7 * this.sLength);
                this.context.lineTo(this.xpos + 0.5 * this.sLength, this.ypos + 0.3 * this.sLength);
                this.context.lineTo(this.xpos + 0.7 * this.sLength, this.ypos + 0.7 * this.sLength);
                break;
            case DOWN:
                this.context.moveTo(this.xpos + 0.3 * this.sLength, this.ypos + 0.3 * this.sLength);
                this.context.lineTo(this.xpos + 0.5 * this.sLength, this.ypos + 0.7 * this.sLength);
                this.context.lineTo(this.xpos + 0.7 * this.sLength, this.ypos + 0.3 * this.sLength);
                break;
            case LEFT:
                this.context.moveTo(this.xpos + 0.7 * this.sLength, this.ypos + 0.3 * this.sLength);
                this.context.lineTo(this.xpos + 0.3 * this.sLength, this.ypos + 0.5 * this.sLength);
                this.context.lineTo(this.xpos + 0.7 * this.sLength, this.ypos + 0.7 * this.sLength);
                break;
            case RIGHT:
                this.context.moveTo(this.xpos + 0.3 * this.sLength, this.ypos + 0.3 * this.sLength);
                this.context.lineTo(this.xpos + 0.7 * this.sLength, this.ypos + 0.5 * this.sLength);
                this.context.lineTo(this.xpos + 0.3 * this.sLength, this.ypos + 0.7 * this.sLength);
                break;
        }
        this.context.fill();
    }
}

class NumericTile extends Tile{
    constructor(xpos, ypos, sLength, border, mainColor, emColor, value, context){
        super(xpos, ypos, sLength, mainColor, context);
        this.border = border;
        this.emColor = emColor;
        this.value = value;
        this.str = value.toString();
    }
    
    draw(xpos = this.xpos, ypos = this.ypos){
        // To obtain the embossed look: place a right triangle then the square tile
        this.context.fillStyle = this.emColor;
        this.context.beginPath();
        this.context.moveTo(xpos, ypos + this.sLength);
        this.context.lineTo(xpos + this.sLength, ypos + this.sLength);
        this.context.lineTo(xpos + this.sLength, ypos);
        this.context.fill();
        super.draw(xpos, ypos);
        this.context.fillStyle = "black";
        this.context.font = (Math.floor(this.sLength/2)).toString() + FONT_LIST;
        this.context.fillText(this.str, Math.floor(xpos  + ((this.sLength/2)) - ((this.context.measureText(this.str)).width)/2), Math.floor(ypos + Math.floor(this.sLength/1.5)));
    }
}

function columnUp(colnum){
    var topVal = tiles[0][colnum];
    for(let i = 0; i < tiles.length - 1; i++){
        tiles[i][colnum] = tiles[i + 1][colnum];
    }
    tiles[tiles.length - 1][colnum] = topVal;
}

function columnDown(colnum){
    var bottomVal = tiles[tiles.length - 1][colnum];
    for(let i = tiles.length - 1; i > 0; i--){
        tiles[i][colnum] = tiles[i - 1][colnum];
    }
    tiles[0][colnum] = bottomVal;
}

function rowRight(rownum){
    if(tiles[rownum].length < 2){
        return;
    }
    tiles[rownum].unshift(tiles[rownum].pop());
}

function rowLeft(rownum){
    if(tiles[rownum].length < 2){
        return;
    }
    tiles[rownum].push(tiles[rownum].shift());
}

function animateMove(startTime, timeStamp, duration, direction, val, source){
    var runTime = timeStamp - startTime;
    var progress = runTime / duration;
    progress = Math.min(1, progress); //avoid animating beyond 100% of what is expected of a single move
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if(direction == UP || direction == DOWN){
        for(let i = 0; i < tiles.length; i++){
            tiles[i][val].ypos = tileHeight + (tileHeight * i);
        }
    }
    if(direction == LEFT || direction == RIGHT){
        for(let i = 0; i < (tiles[val]).length; i++){
            tiles[val][i].xpos = tileWidth + (tileWidth * i);
        }
    }
    
    if(direction == UP){
        for(let i = 0; i < tiles.length; i++){
            for(let j = 0; j < (tiles[i]).length; j++){
                if(j == val){
                    //ascending column animation:
                    tiles[i][j].draw(tiles[i][j].xpos, tiles[i][j].ypos + tileHeight - (progress * tileHeight));
                }else{
                    //regular animation condition:
                    tiles[i][j].draw();
                }
            }
        }
        //draw final tile at top
        tiles[tiles.length - 1][val].draw(tileWidth + tileWidth * val, tileHeight - (progress * tileHeight));
    }else if(direction == RIGHT){
        for(let i = 0; i < tiles.length; i++){
            for(let j = 0; j < (tiles[i]).length; j++){
                if(i == val){
                    tiles[i][j].draw(tiles[i][j].xpos - tileWidth + (progress * tileWidth), tiles[i][j].ypos);
               }else{
                    tiles[i][j].draw();
               }
            }
        }
        //draw final tile at right
        tiles[val][0].draw((tileWidth * (tiles[val]).length) + (progress * tileHeight), tileHeight + (tileHeight * val));
    }else if(direction == DOWN){
        for(let i = 0; i < tiles.length; i++){
            for(let j = 0; j < (tiles[i]).length; j++){
                if(j == val){
                    //descending column animation:
                    tiles[i][j].draw(tiles[i][j].xpos, tiles[i][j].ypos - tileHeight + (progress * tileHeight));
                }else{
                    //regular animation condition:
                    tiles[i][j].draw();
                }
            }
        }
        //draw final tile at bottom:
        tiles[0][val].draw(tileWidth + tileWidth * val, (tiles.length * tileHeight) + (progress * tileHeight));
    }else{
        for(let i = 0; i < tiles.length; i++){
            for(let j = 0; j < (tiles[i]).length; j++){
                if(i == val){
                    tiles[i][j].draw(tiles[i][j].xpos + tileWidth - (progress * tileWidth), tiles[i][j].ypos);
               }else{
                    tiles[i][j].draw();
               }
            }
        }
        //draw final tile at left
        tiles[val][(tiles[val]).length - 1].draw(tileWidth - (progress * tileHeight), tileHeight + (tileHeight * val));
    }
    
    //add background and arrows:
    ctx.fillStyle = TILE_COLOR;
    ctx.fillRect(0, 0, tileWidth, canvas.height);
    ctx.fillRect(0, tileHeight + (tiles.length * tileHeight), canvas.width, canvas.height);
    ctx.fillRect(0, 0, canvas.width, tileHeight);
    ctx.fillRect(tileWidth + ((tiles[0]).length * tileWidth), 0, canvas.width, canvas.height);
    
    for(let i = 0; i < arrowTiles.length; i++){
        arrowTiles[i].draw();
    }
    
    if(runTime < duration){
        requestAnimationFrame(function(timeStamp){
            animateMove(startTime, timeStamp, duration, direction, val, source);
        });
    }else{
        if(source == CLICK){
            moveHistory.moveIndex++;
            if(moveHistory.history.length == moveHistory.moveIndex){
                moveHistory.history.push({"direction": direction, "value": val});
            }else{
                moveHistory.history.length = moveHistory.moveIndex;
                moveHistory.history.push({"direction": direction, "value": val});
            }

        }
        document.getElementById("feedback").innerText = "Moves: " + (moveHistory.moveIndex + 1);
        
        //cannot undo when there are no more moves to undo
        document.getElementById("undo_button").disabled = (moveHistory.moveIndex == -1);
        //cannot redo when there are no more moves to redo
        document.getElementById("redo_button").disabled = (moveHistory.moveIndex + 1 >= moveHistory.history.length);
        
        setTimeout(function(){
            if(checkVictory()){
                alert("You won!");
            }
        }, 0);
    }
}

function clickResolver(clickX, clickY){   
    var col = Math.floor((clickX - tileWidth)/tileWidth);
    var row = Math.floor((clickY - tileHeight)/tileHeight);
    clickHistory.push({"clickX" : clickX, "clickY" : clickY, "col" : col, "row" : row});
    if(row < 0 && col >= 0 && col <= (tiles[0]).length - 1){
        //some type of column up
        columnUp(col);
        requestAnimationFrame(function(timeStamp){
            animateMove(timeStamp, timeStamp, ANIMATION_LENGTH, UP, col, CLICK);
        });
    }else if (row > tiles.length - 1 && col >= 0 && col <= (tiles[0]).length - 1){
        //some type of column down
        columnDown(col);
        requestAnimationFrame(function(timeStamp){
            animateMove(timeStamp, timeStamp, ANIMATION_LENGTH, DOWN, col, CLICK);
        });
    }else if(col < 0 && row >= 0 && row <= tiles.length - 1){
        //some type of row left
        rowLeft(row);
        requestAnimationFrame(function(timeStamp){
            animateMove(timeStamp, timeStamp, ANIMATION_LENGTH, LEFT, row, CLICK);
        });
    }else if(col > (tiles[0]).length - 1 && row >= 0 && row <= tiles.length - 1){
        //some type of row right
        rowRight(row);
        requestAnimationFrame(function(timeStamp){
            animateMove(timeStamp, timeStamp, ANIMATION_LENGTH, RIGHT, row, CLICK);
        });
    }
}

canvas.addEventListener("mousedown", function(event){
    let rect = canvas.getBoundingClientRect();
    clickResolver(event.clientX - rect.left, event.clientY - rect.top);
    }
);

function permParity(perm, n){
    var i, j, ret;
     ret = false;
     
    for (i = 0; i < n-1; i++){
        for (j = i+1; j < n; j++){
            if (perm[i] > perm[j]){
                ret = !ret;
            }
        }
    }
    return ret;
}

function shuffleArray(array){
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

function initGameUI(){
    
    document.getElementById("feedback").innerText = "Moves: " + (moveHistory.moveIndex + 1);
    document.getElementById("undo_button").disabled = true;
    document.getElementById("redo_button").disabled = true;
    
    var rows = tiles.length;
    var columns = (tiles[0]).length;
    
    if(rows > MAX_ROW_HINT || columns > MAX_COLUMN_HINT){
        document.getElementById("hint_button").disabled = true;
        document.getElementById("hint_button").title = "Hints are only available for puzzles up to size " + MAX_ROW_HINT + "x" + MAX_COLUMN_HINT + ".";
    }else{
        document.getElementById("hint_button").disabled = false;
        document.getElementById("hint_button").title = "";
    }
    
    //smaller devices:
    if(screen.width < 640){
        canvas.width = minCanvasDimension;
        canvas.height = minCanvasDimension;
    }
    //allow room for tiles, border, and control arrows:
    tileWidth = Math.floor(Math.min(canvas.width/(columns + 2), canvas.height/(rows + 2)));
    tileHeight = tileWidth;
    
    ctx.fillStyle = TILE_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(tileWidth, tileHeight, (tileWidth * columns), (tileHeight * rows));
    
    //array of arrow tiles
    arrowTiles = [];
    for(let i = 0; i < tiles.length; i++){
        //left arrow
        arrowTiles.push(new ArrowTile(0, tileHeight * (1 + i), tileWidth, TILE_COLOR, LEFT, ctx));
        //right arrow
        arrowTiles.push(new ArrowTile(tileWidth + tileWidth * (tiles[0]).length, tileHeight * (1 + i), tileWidth, TILE_COLOR, RIGHT, ctx));
    }
    for(let i = 0; i < (tiles[0]).length; i++){
        //up arrow
        arrowTiles.push(new ArrowTile(tileWidth + i * tileWidth, 0, tileWidth, TILE_COLOR, UP, ctx));
        //down arrow
        arrowTiles.push(new ArrowTile(tileWidth + i * tileWidth, tileHeight * (1 + tiles.length), tileWidth, TILE_COLOR, DOWN, ctx));
    }
    for(let i = 0; i < arrowTiles.length; i++){
        arrowTiles[i].draw();
    }
    var border = tileWidth * BORDER_RATIO;
    for(let i = 0; i < tiles.length; i++){
        for(let j = 0; j < (tiles[i]).length; j++){
            tiles[i][j] = new NumericTile(tileWidth + (j * tileWidth), tileHeight + (i * tileHeight), tileWidth, border, TILE_COLOR, EMBOSS_COLOR, tiles[i][j], ctx);
            tiles[i][j].draw();
        }
    }
}

function newGame(){
    var params = document.getElementById("grid_parameters").value;
    var params_arr = params.split("x");
    var rows = parseInt(params_arr[0]);
    var columns = parseInt(params_arr[1]);
    
    tiles = [];
    startingTileLayout = [];
    moveHistory = {
        moveIndex: -1,
        history: [],
        };
    clickHistory = [];
    var numberArray = [];
    for(let i = 0; i < rows * columns; i++){
        numberArray[i] = i + 1;
    }
    do{
        shuffleArray(numberArray);
        
        /*If number of rows and columns are both odd, not all random positions are solvable.
        By swapping the last two values of a non-solvable puzzle we create a solvable puzzle.
        For details:
        https://www.chiark.greenend.org.uk/~sgtatham/puzzles/devel/writing.html#writing-generation
        https://github.com/ghewgill/puzzles/blob/f1e768406396d04bd0fc2be8c47d18e291fdc8c6/sixteen.c#L361
        */
        if(rows % 2 == 1 && columns % 2 == 1){
            if(permParity(numberArray, rows * columns) != false){
                let temp = numberArray[(rows * columns) - 2];
                numberArray[(rows * columns) - 2] = numberArray[(rows * columns) - 1];
                numberArray[(rows * columns) - 1] = temp;
            }
        }
    }while(isAscending(numberArray));
    
    for(let i = 0; i < rows; i++){
        tiles.push([]);
        startingTileLayout.push([]);
        for(let j = 0; j < columns; j++){
            tiles[i].push(numberArray[(i * columns) + j]);
            startingTileLayout[i].push(numberArray[(i * columns) + j]);
        }
    }
    initGameUI();
}

function restartGame(){
    moveHistory = {
    moveIndex: -1,
    history: [],
    };
    clickHistory = [];
    //restore tiles to its original state
    tiles.length = startingTileLayout.length;
    for(let i = 0; i < startingTileLayout.length; i++){
        tiles[i] = (startingTileLayout[i]).slice();
    }
    initGameUI();
}


function undoLastMove(){
    var moveToUndo = moveHistory.history[moveHistory.moveIndex];
    if(moveToUndo == null){
        return;
    }
    var undoDirection;
    switch(moveToUndo.direction){
        case UP:
            columnDown(moveToUndo.value);
            undoDirection = DOWN;
            break;
        case RIGHT:
            rowLeft(moveToUndo.value);
            undoDirection = LEFT;
            break;
        case DOWN:
            columnUp(moveToUndo.value);
            undoDirection = UP;
            break;
        default:
            rowRight(moveToUndo.value);
            undoDirection = RIGHT;
    }
    
    moveHistory.moveIndex--;
    
    requestAnimationFrame(function(timeStamp){
            animateMove(timeStamp, timeStamp, ANIMATION_LENGTH, undoDirection, moveToUndo.value, UNDO);
        });
}

function redo(){
    
    var moveToRedo = moveHistory.history[moveHistory.moveIndex + 1];
    if(moveToRedo == null){
        return;
    }
    switch(moveToRedo.direction){
        case UP:
            columnUp(moveToRedo.value);
            break;
        case RIGHT:
            rowRight(moveToRedo.value);
            break;
        case DOWN:
            columnDown(moveToRedo.value);
            break;
        default:
            rowLeft(moveToRedo.value);
    }
    
    moveHistory.moveIndex++;
    
    requestAnimationFrame(function(timeStamp){
            animateMove(timeStamp, timeStamp, ANIMATION_LENGTH, moveToRedo.direction, moveToRedo.value, REDO);
        });
}

function displayHint(hint){
    var feedback = document.getElementById("hint_popup");
    feedback.innerText = hint;
    feedback.style.visibility = "visible";
}

function displayError(){
    var feedback = document.getElementById("hint_popup");
    feedback.innerText = "An error has occurred. Please try reloading the webpage.";
    feedback.style.visibility = "visible";
}

function loadHint(){
    let tileLayout = [];
    for(let i = 0; i < tiles.length; i++){
        tileLayout.push([]);
        for(let j = 0; j < (tiles[i]).length; j++){
            tileLayout[i].push(tiles[i][j].value);
        }
    }
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function(){
        if(this.readyState == 4){
            if(this.status == 200){
                let hint = JSON.parse(this.responseText);
                displayHint(hint.suggestedMove);
            }else{
                displayError();
            }
        }
    };
    xhttp.open("GET", "/api/hint?state=" + JSON.stringify(tileLayout), true);
    xhttp.send();
}

function hideHint(){
    document.getElementById("hint_popup").style.visibility = "hidden";
}

function isAscending(arr){
    //arrays with zero or one item can be considered ascending
    if(arr.length < 2){
        return true;
    }
    
    for(let i = 0; i < arr.length - 1; i++){
        if(arr[i] > arr[i + 1]){
            return false;
        }
    }
    return true;
}

function checkVictory(){
    for(let i = 0; i < tiles.length; i++){
        for(let j = 0; j < (tiles[i]).length; j++){
            if(tiles[i][j].value != ((tiles[i]).length * i) + j + 1){
                return false;
            }
        }
    }
    return true;
}

document.getElementById("new_game_button").addEventListener("click", function(){newGame();});
document.getElementById("grid_parameters").addEventListener("change", function(){newGame();});
document.getElementById("restart_button").addEventListener("click", function(){restartGame();});
document.getElementById("undo_button").addEventListener("click", function(){undoLastMove();});
document.getElementById("redo_button").addEventListener("click", function(){redo();});
document.getElementById("hint_button").addEventListener("click", function(){loadHint();});
document.getElementById("hint_button").addEventListener("mouseout", function(){hideHint();});

newGame();