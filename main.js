//Checks for the type of an input, returns true if the input is of the selected type
//If its not, it returns an error object

const checkForType = (input, type) => {
    const inType = typeof input;
    if (intype === type) {
        return true;
    }
    if (intype === "null") {
        return errorFactory(11);
    }
    if (intype === "undefined") {
        return errorFactory(12);
    }
    return errorFactory(10, [intype, type]);
};

//A cell in the game grid
//It's defined using the position (id), which is their position in the list of cells

const cellFactory = (position, gridSize) => {
    let owner = "none";
    const id = position;
    const x = id % gridSize;
    const y = Math.floor(id / gridSize);

    const setOwner = (newOwner) => {
        //Checks that the new owner is a string
        if (checkForType(newOwner, "string") !== true) {
            return checkForType(newOwner, "string");
        }
        
        if (owner === "none") {
            owner = newOwner;
        }

        return errorFactory(410, "", `Cell already owned by ${owner}`);        
    };

    const getOwner = () => {
        return owner;
    };

    return {
        id,
        owner,
        x,
        y,
        setOwner,
        getOwner
    };
};

const gridFactory = (size, lineSize) => {
    const grid = [];
    for (let i = 0; i < size * size; i++) {
        grid.push(cellFactory(i, size));
    }
    
    const coordsToId = (x, y) => {
        return y * size + x;
    };

    const idToCoords = (id) => {
        return [
            id % size,
            Math.floor(id / size)
        ];
    };

    const cell = (x, y) => {
        return grid[y * size + x];
    }
    const cellById = (id) => {
        return grid[id];
    }

    const checkWholeLine = (size, user, isRotated) => {
        //If no rotation is specified check for both horizontal and vertical
        if (typeof isRotated !== "boolean") {
            return checkWholeLine(size, user, false) || checkWholeLine(size, user, true);
        }
        
        //If rotation is specified check for specified rotation
        for (let i = 0; i < size; i++) {
            const row = [];
            for (let j = 0; j < size; j++) {
                row.push(cell(isRotated ? coordsToId(i, j) : coordsToId(j, i)));                    
            }

            if (row.every(cell => cell.owner === user)) {
                return true;
            }
        }

        return false;
    }

    const checkWholeDiagonals = (size, user) => {
        const diagonal = [];

        //Checks top left to bottom right diagonal 
        for (let i = 0 ; i < size; i++) {
            diagonal.push(cell(i, i));
        }

        if (diagonal.every(cell => cell.owner === user)) {
            return true;
        }

        //Resets diagonal
        diagonal.length = 0;

        //Checks bottom left to top right diagonal
        for (let i = 0; i < size; i++) {
            diagonal.push(cell(i, size - i));
        }

        if (diagonal.every(cell => cell.owner === user)) {
            return true;
        }

        //Return false if none apply
        return false;
    }

    const checkLineFor = (size, user, x, y, lineSize, isRotated) => {
        let chain = 0;

        //If no rotation is specified, both are checked
        if (typeof isRotated !== "boolean") {
            return checkLineFor(size, user, x, y, lineSize, false) || checkLineFor(size, user, x, y, lineSize, true);
        }

        const checkDirection = (isReversed, isRotated) => {
            let mainCoord = isRotated ? y : x;
            const secondaryCoord = isRotated ? x : y;

            //If the direction is reversed start at previous cell, to not double count it
            mainCoord = mainCoord + (isReversed ? -1 : 0);

            while (chain < lineSize) {
                if (mainCoord >= size || mainCoord < 0) {
                    return false;
                }

                const cell = isRotated ? cell(mainCoord, secondaryCoord) : cell(secondaryCoord, mainCoord);
                if (cell.owner !== user) {
                    return false;
                } else {
                    chain++;
                }

                mainCoord += isReversed ? -1 : 1;
            }
        }
        
        //Check both directions
        checkDirection(false, isRotated);
        checkDirection(true, isRotated);

        return chain > lineSize;
    }

    const checkDiagonalsFor = (size, user, x, y, lineSize) => {
        let chain = 0;
        const maxDiagonal = lineSize * 2 - 1;
        const upperBound = lineSize -1;
        const lowerBound = -lineSize +1;

        const checkDirection = (isRotated) => {
            let currX = isRotated ? x + lowerBound : x + upperBound;
            let currY = y + lowerBound;

            for (let i = 0 ; i < maxDiagonal; i++) {
                
                //Check that it's inside the box
                if (currX >= size || currY >= size || currX < 0 || currY < 0) {
                    return false;
                }

                const cell = cell(isRotated ? currX + i : currX - i, currY + i);

                if (cell.owner!== user) {
                    return false;
                } else {
                    chain++;
                }
            }
            
        }        

        //Check both directions
        checkDirection(false);
        checkDirection(true);

        return chain > lineSize;
    }

    const checkWin = (user) => {
        if (size === lineSize) {
            return checkWholeDiagonals(size, user) || checkWholeLine(size, user);
        }
    }   
}

const errorFactory = (errorID, details, message) => {
    const id = errorID;

    //Returns the adequate error message based on error and details
    const getErrorMessage = (error, details, message) => {
        
        if (message) {
            return message;
        }

        switch (error) {
            case 10:
                return `Wrong type ${details[0]} should be ${details[1]}`
                break;
            
            case 11:
                return `Wrong type null`
                break;
            case 12:
                return `Wrong type undefined`
                break;

            case 23:
                return `Non specific error at process ${details}`
                break;

            default:
                return `Unspecified error`;
                break;
            }
    }
   
    const errorMessage = getErrorMessage(errorID, details, message);


    console.log(`Error ${id}: ${errorMessage}`);

    return {
        id,
        errorMessage,
    };
};

const gameObject = (() => {
    const cells = [];

    const populate = (size) => {
        board.length = 0;
        for (let i = 0; i < size * size; i++) {
            cells.push(cellFactory(i, size));
        }
    };

    const drawBoard = (size) => {
        const DOMboard = document.getElementById("game-board");
        DOMboard.setAttribute("--size", size);
        //Erase old grid
        for (let i = 0; i < DOMboard.childNodes.length; i++) {
            DOMboard.removeChild(childNodes[i]);
        }
        //Make new grid
        for (let i = 0; i < size; i++) {
            DOMboard.insertAdjacentHTML(
                `beforeend`,
                `<div class="cell" id="cell${i}" x="${
                    i % size
                }" y="${Math.floor(i / size)}"></div>`
            );
        }
    };

    const addCellEvents = (cellID) => {
        const DOMcell = document.getElementById(`cell${cellID}`);
        DOMcell.addEventListener("click", (e) => {
            e.target;
        });
    };

    return {
        populate,
        drawBoard,
        board,
    };
})();

console.log(gameObject);
