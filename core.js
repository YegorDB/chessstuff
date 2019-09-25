class SquareName {
    /*
    Human readable chess board square name.
    Create param:
      - name [string] (include two characters - symbol and number, for example 'a1').
      _ _ _ _ _ _ _ _
    8|_|_|_|_|_|_|_|_|
    7|_|_|_|_|_|_|_|_|
    6|_|_|_|_|_|_|_|_|
    5|_|_|_|_|_|_|_|_|
    4|_|_|_|_|_|_|_|_|
    3|_|_|_|_|_|_|_|_|
    2|_|_|_|_|_|_|_|_|
    1|_|_|_|_|_|_|_|_|
      a b c d e f g h
    */

    #symbols = ["a", "b", "c", "d", "e", "f", "g", "h"]
    #numbers = ["1", "2", "3", "4", "5", "6", "7", "8"]

    constructor(name) {
        let symbol = name[0];
        let number = name[1];
        if (!this.#symbols.includes(symbol)) {
            throw Error(`Wrong symbol (${symbol}) passed`);
        }
        if (!this.#numbers.includes(number)) {
            throw Error(`Wrong number (${number}) passed`);
        }
        this.symbol = symbol;
        this.number = number;
        this.value = `${symbol}${number}`;
    }
}


class SquareCoordinates {
    /*
    Chess board square coordinates.
    Create param:
      - coordinates [Array] (include two numbers - square coordinates from 0 to 7, for example [0, 0]).
      _ _ _ _ _ _ _ _
    7|_|_|_|_|_|_|_|_|
    6|_|_|_|_|_|_|_|_|
    5|_|_|_|_|_|_|_|_|
    4|_|_|_|_|_|_|_|_|
    3|_|_|_|_|_|_|_|_|
    2|_|_|_|_|_|_|_|_|
    1|_|_|_|_|_|_|_|_|
    0|_|_|_|_|_|_|_|_|
      0 1 2 3 4 5 6 7
    */

    #numbers = [0, 1, 2, 3, 4, 5, 6, 7]

    constructor(coordinates) {
        let x = coordinates[0];
        let y = coordinates[1];
        if (!this.#numbers.includes(x)) {
            throw Error(`Wrong x value (${x}) passed`);
        }
        if (!this.#numbers.includes(y)) {
            throw Error(`Wrong y value (${y}) passed`);
        }
        this.x = x;
        this.y = y;
        this.value = [x, y];
    }
}


class Square {
    /*
    Chess board square.
    There are create params:
      - name [string] (SquareName class create param);
      - coordinates [Array] (SquareCoordinates class create param).
    To create instance you need to pass one of this params.
    */

    static #symbolToNumber = {"a": 0, "b": 1, "c": 2, "d": 3, "e": 4, "f": 5, "g": 6, "h": 7};
    static #numberToSymbol = {0: "a", 1: "b", 2: "c", 3: "d", 4: "e", 5: "f", 6: "g", 7: "h"};

    constructor(name=null, coordinates=null) {
        if (name) {
            this._name = SquareName(name);
            this._coordinates = SquareCoordinates([Square.#symbolToNumber[this._name.symbol], +(this._name.number - 1)]);
        }
        else if (coordinates) {
            this._coordinates = SquareCoordinates(coordinates);
            this._name = SquareName(Square.#numberToSymbol[this._coordinates.x] + (this._coordinates.y + 1));
        }
        else {
            throw Error("To create Square instance you need to pass either name or coordinates param");
        }
        this._pice = null;
    }

    static coordinatesToName(x, y) {
        return Square.#numberToSymbol[x] + (y + 1);
    }

    get name() {
        return this._name;
    }

    get coordinates() {
        return this._coordinates;
    }

    get pice() {
        return this._pice;
    }

    placePice(pice) {
        this._pice = pice;
    }

    removePice() {
        this._pice = null;
    }

    theSame(otherSquare) {
        return this.name.value === otherSquare.name.value;
    }

    _getLinedCheckerDirection(otherSquare) {
        // get direction of distance between this square and other one
        let dif = {x: 0, y: 0};
        for (let i of ['x', 'y']) {
            if (otherSquare.coordinates[i] > this.coordinates[i]) {
                dif[i] = -1;
            }
            else if (otherSquare.coordinates[i] < this.coordinates[i]) {
                dif[i] = 1;
            }
        }
        return dif;
    }

    getBetweenSquaresNames(otherSquare, include=false) {
        // get names of squares between this square and other one
        let dx = Math.abs(otherSquare.coordinates.x - this.coordinates.x);
        let dy = Math.abs(otherSquare.coordinates.y - this.coordinates.y);
        if (dx != dy && dx != 0 && dy != 0) {
            return [];
        }
        let betweenSquaresNames = [];
        let dif = this._getLinedCheckerDirection(otherSquare);
        let distance = Math.max(dx, dy);
        let start = include ? 0 : 1;
        for (let i = start; i <= distance - start; i++) {
            let x = otherSquare.coordinates.x + i * dif.x;
            let y = otherSquare.coordinates.y + i * dif.y;
            betweenSquaresNames.push(Square.coordinatesToName(x, y));
        }
        return betweenSquaresNames;
    }
}


class PiceSquares {
    /*
    Chess pice dependent squares storage.
    */

    #allKinds = ['move', 'attack', 'xray', 'cover', 'control'];

    constructor() {
        this.refresh();
    }

    refresh(kind='all') {
        let kinds = kind === 'all' ? this.#allKinds : [kind];
        for (let kind of kinds) {
            this[kind] = null;
        }
    }

    add(kind, square) {
        if (this[kind]) {
            this[kind].push(square);
        }
        else {
            this[kind] = [square];
        }
    }

    remove(kind, squareToRemove) {
        this[kind] = this[kind].filter(square => !square.theSame(squareToRemove));
    }

    limit(kind, acceptedNames) {
        // limit some kind of Pice actions squares by Array of accepted square names
        this[kind] = this[kind].filter(square => acceptedNames.includes(square.name.value));
    }
}


class Pice {
    /*
    Base chess pice class.
    There are create params:
      - color [string] (white or black);
      - kind [string] (pawn, knight, bishop, rook, queen, king);
      - square [Square class instance] (where pice is placed).
    */

    constructor(color, kind, square) {
        this.color = color;
        this.kind = kind;
        this.getPlace(square);
        this.squares = new PiceSquares;
        this.refreshSquareFinder();
        this.getInitState();
        this.isKing = false;
        this.isLinear = false;
    }

    get stuck() {
        // check the pice get stucked
        return !this.squares.move && !this.squares.attack;
    }

    refreshSquareFinder() {
        this.sqrBeforeXray = null; // square before xray (always occupied by pice)
        this.xrayControl = false; // control square behind checked king (inline of pice attack)
        this.endOfALine = false;
    }

    refreshSquares() {
        this.squares.refresh();
        this.refreshSquareFinder();
    }

    getInitState() {
        this.binder = null;
    }

    getPlace(square) {
        this.square = square;
        square.placePice(this);
    }

    sameColor(otherPice) {
        return this.color === otherPice.color;
    }

    getSquares(occupiedSquares) {
        // get pice dependent squares
        this.refreshSquares();
        this[this.kind + "Squares"](occupiedSquares);
    }

    nextSquareAction(nextSquare) {
        // define next square kinds and handle logic with it
        if (this.sqrBeforeXray) {
            this.squares.add("xray", nextSquare);
            if (this.xrayControl) {
                this.squares.add("control", nextSquare);
                this.xrayControl = false;
            }
            if (nextSquare.pice) {
                let isOppKingSquare = nextSquare.pice.isKing && !this.sameColor(nextSquare.pice);
                let isOppPiceBeforeXray = !this.sameColor(this.sqrBeforeXray.pice);
                if (isOppKingSquare && isOppPiceBeforeXray) {
                    this.sqrBeforeXray.pice.binder = this;
                }
                this.endOfALine = true;
            }
        }
        else if (nextSquare.pice) {
            if (this.sameColor(nextSquare.pice)) {
                this.squares.add("cover", nextSquare);
            }
            else {
                this.squares.add("attack", nextSquare);
                if (nextSquare.pice.isKing) {
                    nextSquare.pice.checkersSquares.push(this.square);
                    this.xrayControl = true;
                }
            }
            this.squares.add("control", nextSquare);
            if (this.isLinear) this.sqrBeforeXray = nextSquare;
        }
        else {
            this.squares.add("move", nextSquare);
            this.squares.add("control", nextSquare);
        }
    }

    getTotalImmobilize() {
        this.squares.refresh();
    }

    getBind(kingSquare) {
        // make pice is binded
        this.squares.refresh("xray");
        let betweenSquares = this.binder.square.getBetweenSquaresNames(kingSquare, true);
        for (let actonKind of ["move", "attack", "cover"]) {
            this.squares.limit(actonKind, betweenSquares);
        }
    }

    getCheck(checker, betweenSquares) {
        // change Pice action abilities after its king was checked
        this.squares.refresh("cover");
        this.squares.refresh("xray");
        this.squares.limit("attack", [checker.square.name.value]);
        this.squares.limit("move", betweenSquares);
    }
}


class Pawn extends Pice {
    constructor(color, square) {
        super(color, "pawn", square);
    }

    getSquares(occupiedSquares, enPassant) {
        this.refreshSquares();
        let moveSquaresCoordinates = [];
        let attackSquaresCoordinates = [];
        let inLeftEdge = this.square.coordinates.x == 0;
        let inRightEdge = this.square.coordinates.x == 7;
        if (this.color == "white") {
            moveSquaresCoordinates.push([this.square.coordinates.x, this.square.coordinates.y + 1]);
            if (this.square.coordinates.y == 1) {
                moveSquaresCoordinates.push([this.square.coordinates.x, this.square.coordinates.y + 2]);
            }
            if (!inLeftEdge) {
                attackSquaresCoordinates.push([this.square.coordinates.x - 1, this.square.coordinates.y + 1]);
            }
            if (!inRightEdge) {
                attackSquaresCoordinates.push([this.square.coordinates.x + 1, this.square.coordinates.y + 1]);
            }
        }
        else {
            moveSquaresCoordinates.push([this.square.coordinates.x, this.square.coordinates.y - 1]);
            if (this.square.coordinates.y == 6) {
                moveSquaresCoordinates.push([this.square.coordinates.x, this.square.coordinates.y - 2]);
            }
            if (!inLeftEdge) {
                attackSquaresCoordinates.push([this.square.coordinates.x - 1, this.square.coordinates.y - 1]);
            }
            if (!inRightEdge) {
                attackSquaresCoordinates.push([this.square.coordinates.x + 1, this.square.coordinates.y - 1]);
            }
        }

        for (let [x, y] of moveSquaresCoordinates) {
            let square = occupiedSquares.getFromCoordinates(x, y);
            if (square.pice) break;
            this.squares.add("move", square);
        }

        for (let [x, y] of attackSquaresCoordinates) {
            let square = occupiedSquares.getFromCoordinates(x, y);
            this.squares.add("control", square);
            if (square.pice) {
                if (this.sameColor(square.pice)) {
                    this.squares.add("cover", square);
                }
                else {
                    this.squares.add("attack", square);
                    if (square.pice.isKing) {
                        square.pice.checkersSquares.push(this.square);
                    }
                }
            }
            else if (enPassant && square.theSame(enPassant)) {
                this.squares.add("attack", square);
            }
        }
    }
}


class Knight extends Pice {
    constructor(color, square) {
        super(color, "knight", square);
    }

    knightSquares(occupiedSquares) {
        let ofsets = [[-2, -1], [-1, -2], [1, -2], [2, -1], [2, 1], [1, 2], [-1, 2], [-2, 1]];
        for (let ofset of ofsets) {
            let x = this.numSquare[0] + ofset[0];
            let y = this.numSquare[1] + ofset[1];
            if (x < 0 || x > 7 || y < 0 || y > 7) continue;

            this.nextSquareAction(occupiedSquares.getFromCoordinates(x, y));
        }
    }

    getBind() {
        this.getTotalImmobilize();
}


class Bishop extends Pice {
    constructor(color, square) {
        super(color, "bishop", square);
        this.isLinear = true;
    }

    bishopSquares(occupiedSquares) {
        // downleft
        let [i, j] = [this.numSquare[0] - 1, this.numSquare[1] - 1];
        this.refreshSquareFinder();
        while (i >= 0 && j >= 0) {
            this.nextSquareAction(occupiedSquares.getFromCoordinates(i, j));
            if (this.endOfALine) break;
            i--; j--;
        }
        // downright
        [i, j] = [this.numSquare[0] + 1, this.numSquare[1] - 1];
        this.refreshSquareFinder();
        while (i <= 7 && j >= 0) {
            this.nextSquareAction(occupiedSquares.getFromCoordinates(i, j));
            if (this.endOfALine) break;
            i++; j--;
        }
        // upleft
        [i, j] = [this.numSquare[0] - 1, this.numSquare[1] + 1];
        this.refreshSquareFinder();
        while (i >= 0 && j <= 7) {
            this.nextSquareAction(occupiedSquares.getFromCoordinates(i, j));
            if (this.endOfALine) break;
            i--; j++;
        }
        // upright
        [i, j] = [this.numSquare[0] + 1, this.numSquare[1] + 1];
        this.refreshSquareFinder();
        while (i <= 7 && j <= 7) {
            this.nextSquareAction(occupiedSquares.getFromCoordinates(i, j));
            if (this.endOfALine) break;
            i++; j++;
        }
    }
}


class Rook extends Pice {
    constructor(color, square) {
        super(color, "rook", square);
        this.side = square[0] == "a" ? "long" : "short";
        this.isLinear = true;
    }

    rookSquares(occupiedSquares) {
        for (let j = 0; j <= 1; j++) {
            let k = Math.abs(j - 1);
            // up & right
            this.refreshSquareFinder();
            for (let i = this.numSquare[k] + 1; i <= 7; i++) {
                let s = []; s[k] = i; s[j] = this.numSquare[j];
                this.nextSquareAction(occupiedSquares.getFromCoordinates(s[0], s[1]));
                if (this.endOfALine) break;
            }
            // down & left
            this.refreshSquareFinder();
            for (let i = this.numSquare[k] - 1; i >= 0; i--) {
                let s = []; s[k] = i; s[j] = this.numSquare[j];
                this.nextSquareAction(occupiedSquares.getFromCoordinates(s[0], s[1]));
                if (this.endOfALine) break;
            }
        }
    }
}


class Queen extends Pice {
    constructor(color, square) {
        super(color, "queen", square);
        this.isLinear = true;
    }

    getSquares(occupiedSquares) {
        this.refreshSquares();
        this.rookSquares(occupiedSquares);
        this.bishopSquares(occupiedSquares);
    }
}
Object.defineProperty(Queen.prototype, "rookSquares", Object.getOwnPropertyDescriptor(Rook.prototype, "rookSquares"));
Object.defineProperty(Queen.prototype, "bishopSquares", Object.getOwnPropertyDescriptor(Bishop.prototype, "bishopSquares"));


class King extends Pice {
    constructor(color, square) {
        super(color, "king", square);
        this.rank = color == "white" ? "1" : "8";
        this.castlePoints = {"long": "c", "short": "g"};
        this.castleRoads = {
            "long": {"free": ["b", "c", "d"], "safe": ["c", "d"]},
            "short": {"free": ["f", "g"], "safe": ["f", "g"]},
        };
        this.isKing = true;
    }

    getInitState() {
        this.checkersSquares = [];
    }

    getSquares(occupiedSquares, castleRights) {
        this.refreshSquares();

        let ofsets = [[-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1]];
        for (let ofset of ofsets) {
            let x = this.numSquare[0] + ofset[0];
            let y = this.numSquare[1] + ofset[1];
            if (x < 0 || x > 7 || y < 0 || y > 7) continue;

            this.nextSquareAction(occupiedSquares.getFromCoordinates(x, y));
        }

        for (let kingAction of ["move", "attack"]) {
            let wrongSquares = [];
            for (let sqr of this.squares[kingAction]) {
                for (let p of Object.values(occupiedSquares)) {
                    if (p.color != this.color && p.squares["control"].includes(sqr)) {
                        wrongSquares.push(sqr);
                        break;
                    }
                }
            }
            for (let wsqr of wrongSquares) {
                this.squares[kingAction].splice(this.squares[kingAction].indexOf(wsqr), 1);
            }
        }

        for (let kind of ["long", "short"]) {
            if (castleRights[kind] && this.acceptedCastle(occupiedSquares, kind)) {
                this.squares["move"].push(this.castlePoints[kind] + this.rank)
            }
        }
    }

    acceptedCastle(occupiedSquares, kind) {
        for (let type of ["free", "safe"]) {
            if (!this[type + "CastleRoad"](occupiedSquares, this.castleRoads[kind][type])) {
                return false;
            }
            return true;
        }
    }

    freeCastleRoad(occupiedSquares, columns) {
        for (let column of columns) {
            if (occupiedSquares[column + this.rank]) return false;
        }
        return true;
    }

    safeCastleRoad(occupiedSquares, columns) {
        for (let pice of Object.values(occupiedSquares).filter(p => p.color != this.color)) {
            for (let column of columns) {
                if (pice.squares["move"].includes(column + this.rank)) return false;
            }
        }
        return true;
    }

    getCheck() {
        for (let column of Object.values(this.castlePoints)) {
            let square = column + this.rank;
            if (this.squares["move"].includes(square)) {
                this.squares["move"].splice(this.squares["move"].indexOf(square), 1);
            }
        }
    }
}


class Board {
    constructor() {
        this.occupiedSquares = {
            getFromCoordinates(x, y) {
                return this[Square.coordinatesToName(x, y)];
            }
        };
        this.priority = [0, 1];
        this.enPassant = null;
        this.result = null;
        this.transformation = null;
        this.castleRights = {
            "white": {"short": true, "long": true},
            "black": {"short": true, "long": true},
        };
        this.kingsPlaces = {"white": "e1", "black": "e8"};
        this.picesBox = {
            "pawn": Pawn,
            "knight": Knight,
            "bishop": Bishop,
            "rook": Rook,
            "queen": Queen,
            "king": King,
        };
        this.allColors = ["white", "black"];
    }

    get allPices() {
        return Object.values(this.occupiedSquares);
    }

    get allOccupiedSquares() {
        return Object.keys(this.occupiedSquares);
    }

    get currentColor() {
        return this.allColors[this.priority[0]];
    }

    get opponentColor() {
        return this.allColors[this.priority[1]];
    }

    refreshState() {
        this.refreshAllSquares();
        this.changePriority();
    }

    changePriority() {
        this.priority = [this.priority[1], this.priority[0]]
    }

    placePice(color, kind, strSquare) {
        this.occupiedSquares[strSquare] = new this.picesBox[kind](color, strSquare);
    }

    removePice(strSquare) {
        delete this.occupiedSquares[strSquare];
    }

    castleRookMove(from, to, king) {
        if (from == "e" + king.rank) {
            if (to == "c" + king.rank) {
                this.movePice("a" + king.rank, "d" + king.rank, false);
            }
            else if (to == "g" + king.rank) {
                this.movePice("h" + king.rank, "f" + king.rank, false);
            }
        }
    }

    stopKingCastleRights(color) {
        this.castleRights[color] = {"short": false, "long": false};
    }

    stopRookCastleRights(pice) {
        this.castleRights[pice.color][pice.side] = false;
    }

    enPassantMatter(from, to, pice) {
        if (Math.abs(from[1] - to[1]) == 2) {
            this.enPassant = from[0] + (+from[1] + (this.currentColor == "white" ? 1 : -1));
        }
        else if (pice.squares["attack"].includes(to) && !this.occupiedSquares[to]) {
            this.removePice(to[0] + from[1]);
        }
    }

    pawnTransformation(kind) {
        this.placePice(this.currentColor, kind, this.transformation[1]);
        this.removePice(this.transformation[0]);
        this.transformation = null;
        this.refreshState();
        return {
            "success": true,
            "transformation": false,
            "description": "Successfully transformed!"};
    }

    replacePice(from, to, pice) {
        this.removePice(from);
        this.occupiedSquares[to] = pice;
        pice.getPlace(to);
    }

    movePice(from, to, refresh=true) {
        let pice = this.occupiedSquares[from];

        if (!pice) {
            return {
                "success": false,
                "transformation": false,
                "description": "There isn't a pice to replace."};
        }
        if (pice.color != this.currentColor) {
            return {
                "success": false,
                "transformation": false,
                "description": "Wrong color pice."};
        }
        if (!pice.squares["move"].includes(to) && !pice.squares["attack"].includes(to)) {
            return {
                "success": false,
                "transformation": false,
                "description": "Illegal move."};
        }

        this.transformation = null;
        if (pice.kind == "king") {
            this.kingsPlaces[pice.color] = to;
            this.castleRookMove(from, to, pice);
            this.stopKingCastleRights(pice.color);
        }
        else if (pice.kind == "rook") {
            this.stopRookCastleRights(pice);
        }
        else if (pice.kind == "pawn") {
            if (["1", "8"].includes(to[1])) {
                this.transformation = [from, to];
                return {
                    "success": true,
                    "transformation": true,
                    "description": "Pawn is ready to transform on " + to + "."};
            }
            this.enPassantMatter(from, to, pice);
        }

        this.replacePice(from, to, pice);

        if (refresh) this.refreshState();

        return {
            "success": true,
            "transformation": false,
            "description": "Successfully moved!"};
    }

    refreshAllSquares() {
        for (let pice of this.allPices) {
            pice.getInitState();
        }
        for (let pice of this.allPices.filter(p => p.kind != "king" && p.kind != "pawn")) {
            pice.getSquares(this.occupiedSquares);
        }
        for (let pice of this.allPices.filter(p => p.kind == "pawn")) {
            pice.getSquares(this.occupiedSquares, this.enPassant);
        }
        for (let pice of this.allPices.filter(p => p.kind == "king")) {
            pice.getSquares(this.occupiedSquares, this.castleRights[pice.color]);
        }
        for (let pice of this.allPices.filter(p => p.binder)) {
            pice.getBind(this.kingsPlaces[pice.color]);
        }
        let oppKing = this.occupiedSquares[this.kingsPlaces[this.opponentColor]];
        if (oppKing.checkersSquares.length == 1) {
            let noMoves = true;
            let checker = this.occupiedSquares[oppKing.checkersSquares[0]];
            let betweenSquares = checker.isLinear ? checker.square.getBetweenSquaresNames(oppKing.square) : [];
            for (let pice of this.allPices.filter(p => p.sameColor(oppKing))) {
                pice.getCheck(checker, betweenSquares);
                if (!pice.stuck) noMoves = false;
            }
            if (noMoves) this.result = [this.priority[1], this.priority[0]];
        }
        else if (oppKing.checkersSquares.length > 1) {
            for (let pice of this.allPices.filter(p => p.sameColor(oppKing) && !p.isKing)) {
                pice.getTotalImmobilize();
            }
            if (oppKing.stuck) this.result = [this.priority[1], this.priority[0]];
        }
        else {
            let noMoves = true;
            for (let pice of this.allPices.filter(p => p.sameColor(oppKing))) {
                if (!pice.stuck) {
                    noMoves = false;
                    break;
                }
            }
            if (noMoves) this.result = [0.5, 0.5];
        }
        this.enPassant = null;
    }
}


class Game {
    constructor() {
        this.board = new Board;
        this.getInitialPosition();
    }

    getInitialPosition() {
        for (let sqr of ["a7", "b7", "c7", "d7", "e7", "f7", "g7", "h7"]) {
            this.board.placePice("black", "pawn", sqr);
        }
        for (let sqr of ["b8", "g8"]) {
            this.board.placePice("black", "knight", sqr);
        }
        for (let sqr of ["c8", "f8"]) {
            this.board.placePice("black", "bishop", sqr);
        }
        for (let sqr of ["a8", "h8"]) {
            this.board.placePice("black", "rook", sqr);
        }
        this.board.placePice("black", "queen", "d8");
        this.board.placePice("black", "king", "e8");

        for (let sqr of ["a2", "b2", "c2", "d2", "e2", "f2", "g2", "h2"]) {
            this.board.placePice("white", "pawn", sqr);
        }
        for (let sqr of ["b1", "g1"]) {
            this.board.placePice("white", "knight", sqr);
        }
        for (let sqr of ["c1", "f1"]) {
            this.board.placePice("white", "bishop", sqr);
        }
        for (let sqr of ["a1", "h1"]) {
            this.board.placePice("white", "rook", sqr);
        }
        this.board.placePice("white", "queen", "d1");
        this.board.placePice("white", "king", "e1");
        this.board.refreshAllSquares();
    }

    move(from, to) {
        return this.board.movePice(from, to);
    }

    transformation(kind) {
        return this.board.pawnTransformation(kind);
    }
}
