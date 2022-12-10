const root = document.querySelector(":root");

//Checks for the type of an input, returns true if the input is of the selected type
//If its not, it returns an error object

const checkForType = (input, type) => {
    const inType = typeof input;
    if (inType === type) {
        return true;
    }
    if (inType === "null") {
        return errorFactory(11);
    }
    if (inType === "undefined") {
        return errorFactory(12);
    }
    return errorFactory(10, [inType, type]);
};

const gridFactory = (size, lineSize) => {
    //A cell in the game grid
    //It's defined using the position (id), which is their position in the list of cells

    const cellFactory = (position, gridSize) => {
        let owner = "none";
        const id = position;
        const x = id % gridSize;
        const y = Math.floor(id / gridSize);

        const setOwner = (newOwner) => {
            if (newOwner === "none") {
                return true;
            }

            //Checks that the new owner is a string
            if (checkForType(newOwner, "string") !== true) {
                return checkForType(newOwner, "string");
            }

            if (owner === "none") {
                owner = newOwner;
                return true;
            }

            return errorFactory(410, "", `Cell already owned by ${owner}`);
        };

        const getOwner = () => {
            return owner;
        };

        const erase = () => {
            owner = "none";
        };

        return {
            id,
            owner,
            x,
            y,
            setOwner,
            getOwner,
            erase,
        };
    };

    const lineLen = lineSize ? lineSize : size;

    const grid = [];
    for (let i = 0; i < size * size; i++) {
        grid.push(cellFactory(i, size));
    }

    const coordsToId = (x, y) => {
        return y * size + x;
    };

    const idToCoords = (id) => {
        return [id % size, Math.floor(id / size)];
    };

    const cell = (x, y) => {
        return grid[y * size + x];
    };
    const cellById = (id) => {
        return grid[id];
    };

    const checkWholeLine = (size, user, isRotated) => {
        //If no rotation is specified check for both horizontal and vertical
        if (typeof isRotated !== "boolean") {
            return (
                checkWholeLine(size, user, false) ||
                checkWholeLine(size, user, true)
            );
        }

        //If rotation is specified check for specified rotation
        for (let i = 0; i < size; i++) {
            const row = [];
            for (let j = 0; j < size; j++) {
                row.push(cellById(isRotated ? coordsToId(i, j) : coordsToId(j, i)));
            }
            
            if (row.every((cell) => cell.getOwner() === user)) {
                return true;
            }
        }

        return false;
    };

    const checkWholeDiagonals = (size, user) => {
        const diagonal = [];

        //Checks top left to bottom right diagonal
        for (let i = 0; i < size; i++) {
            diagonal.push(cell(i, i));
        }

        if (diagonal.every((cell) => cell.getOwner() === user)) {
            return true;
        }

        //Resets diagonal
        diagonal.length = 0;

        //Checks bottom left to top right diagonal
        for (let i = 0; i < size; i++) {
            diagonal.push(cell(i, size - i - 1));
        }

        if (diagonal.every((cell) => cell.getOwner() === user)) {
            return true;
        }

        //Return false if none apply
        return false;
    };

    const checkLineFor = (size, user, x, y, isRotated) => {
        let chain = 0;

        //If no rotation is specified, both are checked
        if (typeof isRotated !== "boolean") {
            return (
                checkLineFor(size, user, x, y, lineLen, false) ||
                checkLineFor(size, user, x, y, lineLen, true)
            );
        }

        const checkDirection = (isReversed, isRotated) => {
            let mainCoord = isRotated ? y : x;
            const secondaryCoord = isRotated ? x : y;

            //If the direction is reversed start at previous cell, to not double count it
            mainCoord = mainCoord + (isReversed ? -1 : 0);

            while (chain < lineLen) {
                if (mainCoord >= size || mainCoord < 0) {
                    return false;
                }

                const cell = isRotated
                    ? cell(mainCoord, secondaryCoord)
                    : cell(secondaryCoord, mainCoord);
                if (cell.getOwner() !== user) {
                    return false;
                } else {
                    chain++;
                }

                mainCoord += isReversed ? -1 : 1;
            }
        };

        //Check both directions
        checkDirection(false, isRotated);
        checkDirection(true, isRotated);

        return chain > lineLen;
    };

    const checkDiagonalsFor = (size, user, x, y) => {
        let chain = 0;
        const maxDiagonal = lineLen * 2 - 1;
        const upperBound = lineLen - 1;
        const lowerBound = -lineLen + 1;

        const checkDirection = (isRotated) => {
            let currX = isRotated ? x + lowerBound : x + upperBound;
            let currY = y + lowerBound;

            for (let i = 0; i < maxDiagonal; i++) {
                //Check that it's inside the box
                if (currX >= size || currY >= size || currX < 0 || currY < 0) {
                    return false;
                }

                const cell = cell(isRotated ? currX + i : currX - i, currY + i);

                if (cell.getOwner() !== user) {
                    return false;
                } else {
                    chain++;
                }
            }
        };

        //Check both directions
        checkDirection(false);
        checkDirection(true);

        return chain > lineLen;
    };

    const checkWin = (user, x, y) => {
        if (size === lineLen) {
            return (
                checkWholeDiagonals(size, user) || checkWholeLine(size, user)
            );
        }

        return (
            checkDiagonalsFor(size, user, x, y) ||
            checkLineFor(size, user, x, y)
        );
    };

    return {
        grid,
        cell,
        cellById,
        checkWin,
    };
};

const errorFactory = (errorID, details, message) => {
    const id = errorID;

    //Returns the adequate error message based on error and details
    const getErrorMessage = (error, details, message) => {
        if (message) {
            return message;
        }

        switch (error) {
            case 10:
                return `Wrong type ${details[0]} should be ${details[1]}`;
                break;

            case 11:
                return `Wrong type null`;
                break;
            case 12:
                return `Wrong type undefined`;
                break;

            case 23:
                return `Non specific error at process ${details}`;
                break;

            default:
                return `Unspecified error`;
                break;
        }
    };

    const errorMessage = getErrorMessage(errorID, details, message);

    console.log(`Error ${id}: ${errorMessage}`);

    return {
        id,
        errorMessage,
    };
};

const gameObject = (() => {
    let grid = gridFactory(3, 3);

    let isGameOver = false;

    const turnHandler = (() => {
        const turns = [];
        let currentPlayer = "none";

        const getCurrentPlayer = () => {
            return currentPlayer;
        };

        const addPlayer = (player) => {
            turns.push(player);
            currentPlayer = player;
        };

        const nextTurn = (trueRandomTurns) => {
            if (trueRandomTurns) {
                return turns[Math.floor(Math.random() * turns.length)];
            }
            let nextIndex = turns.findIndex((turn) => turn === currentPlayer) + 1;
            nextIndex =
                nextIndex > turns.length - 1
                    ? nextIndex - turns.length
                    : nextIndex;

            currentPlayer = turns[nextIndex];
        };

        //Use Fisher Yates shuffle to sort turns
        const shuffle = () => {
            for (i = turns.length - 1; i > 0; i--) {
                j = Math.floor(Math.random() * i);
                k = turns[i];
                turns[i] = turns[j];
                turns[j] = k;
            }
        };

        return {
            addPlayer,
            nextTurn,
            shuffle,
            getCurrentPlayer,
            turns,
        };
    })();

    const populate = (size, lineSize) => {
        Object.assign(gameObject.grid, gridFactory(size, lineSize));
    };

    const drawBoard = (size) => {
        const DOMboard = document.getElementById("game-board");
        root.style.setProperty(`--size`, `${size}`);
        //Erase old grid
        for (let i = 0; i < DOMboard.childNodes.length; i++) {
            DOMboard.removeChild(DOMboard.childNodes[i]);
        }
        //Make new grid
        for (let i = 0; i < size * size; i++) {
            DOMboard.insertAdjacentHTML(
                `beforeend`,
                `<div class="cell" id="cell${i}" x="${
                    i % size
                }" y="${Math.floor(i / size)}"></div>`
            );

            addCellEvents(i);
        }
    };

    const drawCell = (cellID, DOMcell) => {
        const currentPlayer = turnHandler.getCurrentPlayer();
        if (typeof currentPlayer !== "string") {
            DOMcell.textContent = "";
            return;
        }
        if (grid.cellById(cellID).setOwner(currentPlayer) !== true) {
            return grid.cellById(cellID).setOwner(currentPlayer);
        }

        DOMcell.textContent = currentPlayer;
    };

    const addCellEvents = (cellID) => {
        const DOMcell = document.getElementById(`cell${cellID}`);
        DOMcell.addEventListener("click", () => {
            if (isGameOver) {
                return;
            }

            drawCell(cellID, DOMcell)
            if (grid.checkWin(turnHandler.getCurrentPlayer())) {
                gameOver(turnHandler.getCurrentPlayer());
            }
            turnHandler.nextTurn();
        });
    };

    const gameOver = (winner) => {
        isGameOver = true;
        generatePopUp(new Config("green", "100px", "bold", "italic", `${winner} WINS!`, "win-popup"));
    } 

    return {
        populate,
        drawBoard,
        turnHandler,
        grid,
    };
})();

function Config (color, fontSize, fontWeight, fontStyle, text, popUpClass) {
    this.color = color;
    this.fontSize = fontSize;
    this.fontWeight = fontWeight;
    this.fontStyle = fontStyle;
    this.text = text;
    this.popUpClass = popUpClass;
    return this;
}

const generatePopUp = (config) => {

    //Create the DOM element for the pop up
    const popUp = document.createElement("div");
    popUp.id = "popUp";
    
    //Add basic properties
    popUp.classList.add("popUp");
    popUp.style.setProperty("position", "fixed");
    popUp.style.setProperty("top", "50%");
    popUp.style.setProperty("left", "50%");
    popUp.style.setProperty("transform", "translate(-50%, -50%)");
    popUp.style.setProperty("white-space", "nowrap");
    popUp.style.setProperty("height", String(config.fontSize * 1.5));
    
    //Implement specific properties
    popUp.style.setProperty("color", config.color);
    popUp.style.setProperty("font-size", config.fontSize);
    popUp.style.setProperty("font-weight", config.fontWeight);
    popUp.style.setProperty("font-style", config.fontStyle);
    popUp.classList.add(config.class);

    //Add the text content
    popUp.textContent = config.text;

    //Add the pop up to the DOM
    document.body.appendChild(popUp);

    return popUp;
}


function setup() {
    const size = 4;
    gameObject.populate(size, size);
    gameObject.drawBoard(size);
    gameObject.turnHandler.addPlayer("X");
    gameObject.turnHandler.addPlayer("O");
}

setup();
console.log(gameObject);
