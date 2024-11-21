phina.globalize();

const version = "1.0";

const info = "頑張って作りましたが\nバグがあると思いますので\n結果は疑ってください";


phina.define('TitleScene', {
    superClass: 'DisplayScene',
    init: function(param/*{}*/) {
        this.superInit(param);

        const self = this;

        this.backgroundColor = "PeachPuff";

        Label({
            text: "シチョウを読む練習",
            fontSize: 50,
            fill: "black",
            fontWeight: 800,
        }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(-2));

        Label({
            text: "version " + version,
            fontSize: 20,
            fill: "black",
        }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(-1.3));

        Label({
            text: info,
            fontSize: 22,
            fill: "black",
        }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(3));

        this.setInteractive(true);
        this.on("pointstart", () => {
            self.exit("GameScene");
        });

        const mouse = Sprite("mouse").addChildTo(this).setPosition(this.gridX.center(), this.gridY.center());

        Label({
            text: "TAP TO START",
            fontSize: 20,
            fill: "black",
            fontWeight: 800,
        }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(5));

    },
});

phina.define('MyButton', {
    superClass: 'Button',
    init: function(param) {
        this.superInit(param);
        const self = this;

        this.on("pointstart", () => {
            self.tweener.by({y: -10}, 50).wait(10).by({y: 10}, 50).play();
        })
    },
});

phina.define('GameScene', {
    superClass: 'DisplayScene',
    init: function(param/*{}*/) {
        this.superInit(param);

        const self = this;

        let pages;
        let result;
        let userChoise;
        let pageIndex = 0;

        this.backgroundColor = "PeachPuff";

        // 碁盤を生成
        const ban = RectangleShape({
            fill: "DarkGoldenrod",
            // fill: "PeachPuff",
            strokeWidth: 0,
            width: 630,
            height: 630,
        }).addChildTo(self).setPosition(self.gridX.center(), self.gridY.center(-2.5));
        const grid = Grid({width: ban.width - 100, columns: 8});
        createGoban(9);
        const banLayer = RectangleShape({
            fill: "transparent",
            strokeWidth: 0,
            width: 630,
            height: 630,
        }).addChildTo(ban).setPosition(0, 0);

        // 説明文
        const helpImage = Sprite("arrow").addChildTo(this).setPosition(260, 490).setRotation(90);
        const helpLabel = LabelArea({
            text: "この白石は\nシチョウで取れていますか？",
            fontSize: 28,
            fontWeight: 800,
            fill: "white",
            width: 400,
            height: 100,
            stroke: "black",
            strokeWidth: 5,
        }).addChildTo(this).setPosition(450, 600);

        const titleButton = Sprite("mouse2").addChildTo(this).setPosition(this.gridX.center(6), this.gridY.center(7));
        titleButton.setInteractive(true);
        titleButton.on("pointstart", () => {
            titleButton.tweener.by({y:-20}, 100).by({y:20}, 100)
            .call(function() {
                self.exit("TitleScene");
            }).play();
        });

        // --------------------------------------------------------------

        // 問題を生成＆表示
        showQuestion();

        // 手順を再生
        // drawStonesAuto(pages, 0);

        
        // 碁盤を描画
        function createGoban(size) {
            const floor = Math.floor(size / 2);
            (size).times(function(spanX) {
                var startPoint = Vector2((spanX - floor) * grid.unitWidth, -1 * grid.width / 2),
                    endPoint = Vector2((spanX - floor) * grid.unitWidth, grid.width / 2);
        
                let strokeWidth = 2;
                if (spanX === 0 || spanX === size - 1) {
                    strokeWidth = strokeWidth * 2;
                }
                PathShape({paths:[startPoint, endPoint], stroke: "black", strokeWidth: strokeWidth}).addChildTo(ban);
            });
        
            (size).times(function(spanY) {
                var startPoint = Vector2(-1 * grid.width / 2, (spanY - floor) * grid.unitWidth),
                    endPoint = Vector2(grid.width / 2, (spanY - floor) * grid.unitWidth);
                
                let strokeWidth = 2;
                if (spanY === 0 || spanY === size - 1) {
                    strokeWidth = strokeWidth * 2;
                }
                PathShape({paths:[startPoint, endPoint], stroke: "black", strokeWidth: strokeWidth}).addChildTo(ban);
            });
        }

        // 石を描画
        function createStone(size, color, x, y) {
            const floor = Math.floor(size / 2);
            const stone = CircleShape({
                fill: color,
                radius: grid.unitWidth / 2 - 2,
                strokeWidth: 0,
                // stroke: "black",
                x: x,
                y, y,
            });
            stone.addChildTo(banLayer).setPosition(grid.span(x - floor), grid.span(y - floor));
        };

        // 問題を生成＆表示
        function showQuestion() {
            const initStones = createQuestion(3);
            const mainRet = main(initStones);
            pages = mainRet.pages;
            result = mainRet.result;
            drawStones(pages[0]);
            pageIndex = pages.length - 1;
        }

        // 手順を自動再生
        function drawStonesAuto(pages, pageIndex) {

            if (pageIndex === pages.length) {
                showResult();
                return;
            }

            setTimeout(function() {
                const page = pages[pageIndex];
                drawStones(page);
                drawStonesAuto(pages, pageIndex + 1);
            }, 200);

        }

        // 全ての石を描画
        function drawStones(page) {

            banLayer.children.clear();
            const size = page[0].length;

            for (let y = 0; y < page.length; y ++) {
                const cols = page[y].split("");
                for (let x = 0; x < cols.length; x++) {
                    if (cols[x] === "W") {
                        createStone(size, "white", x, y);
                    } else if (cols[x] === "B") {
                        createStone(size, "black", x, y);
                    }
                }
            }
        }

        // 問題を作る
        function createQuestion(level) {

            const allStones = [];
            const blackStones = [];
            const whiteStones = [];

            function white() {
                let stone;
                while (true) {
                    stone = {x: Math.randint(4, 7), y: Math.randint(0, 4)};
                    if (!allStones.find(s => s.x === stone.x && s.y === stone.y)) {
                        break;
                    }
                }
                allStones.push(stone);
                whiteStones.push(stone);
            }

            function black() {
                let stone;
                while (true) {
                    stone = {x: Math.randint(4, 7), y: Math.randint(0, 4)};
                    if (!allStones.find(s => s.x === stone.x && s.y === stone.y)) {
                        break;
                    }
                }
                allStones.push(stone);
                blackStones.push(stone);
            }

            white();

            if (level > 1) { black(); }
            if (level > 2) { white(); black(); }
            if (level > 3) { white(); black(); }
            if (level > 4) { white(); black(); }
            
            return {
                blackStones: blackStones,
                whiteStones: whiteStones,
            };
    
        }

        // UI

        function showResult() {
            choiseLabel.hide();

            backButton.show();
            forwardButton.show();
            nextButton.show();

            resultLabel.text = result === "blackWin" ? "取れている!" : "取れていない!";
            resultLabel.show();
        }

        function hideResult() {
            backButton.hide();
            forwardButton.hide();
            nextButton.hide();

            resultLabel.hide();

            yesButton.show();
            noButton.show();
        }

        const backButton = MyButton({
            text: "<",
            width: 80,
            height: 50,
            fill: "DarkGoldenrod",
            fontColor: "black",
            fontWeight: 800,
            stroke: "black",
            strokeWidth: 8,
        }).addChildTo(this).setPosition(this.gridX.center(3), this.gridY.center(2.7)).hide();
        backButton.on("pointstart", () => {
            if (pageIndex === 0) return;
            pageIndex -= 1;
            drawStones(pages[pageIndex]);
        });

        const forwardButton = MyButton({
            text: ">",
            width: 80,
            height: 50,
            fill: "DarkGoldenrod",
            fontColor: "black",
            fontWeight: 800,
            stroke: "black",
            strokeWidth: 8,
        }).addChildTo(this).setPosition(this.gridX.center(5.6), this.gridY.center(2.7)).hide();
        forwardButton.on("pointstart", () => {
            if (pageIndex === pages.length - 1) return;
            pageIndex += 1;
            drawStones(pages[pageIndex]);
        });

        const resultLabel = Label({
            text: "",
            fontSize: 90,
            fontWeight: 800,
        }).addChildTo(self).setPosition(this.gridX.center(), this.gridY.center(4.5)).hide();;

        const nextButton = MyButton({
            text: "次の問題",
            width: 230,
            height: 80,
            fill: "white",
            strokeWidth: 10,
            stroke: "black",
            fontColor: "black",
            fontWeight: 800,
        }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(6.7)).hide();
        nextButton.on("pointstart", () => {
            // 問題を生成＆表示
            hideResult();
            showQuestion();
        });

        const yesButton = MyButton({
            text: "取れている",
            width: 270,
            height: 100,
            strokeWidth: 10,
            stroke: "black",
            fontSize: 40,
            fontWeight: 800,
        }).addChildTo(this).setPosition(this.gridX.center(-4), this.gridY.center(5));
        yesButton.on("pointstart", () => {
            // 手順を再生
            drawStonesAuto(pages, 0);
            userChoise = true;
            yesButton.hide();
            noButton.hide();

            choiseLabel.text = "取れているかな？";
            choiseLabel.show();

            helpImage.hide();
            helpLabel.hide();
        });

        const noButton = MyButton({
            text: "取れていない",
            width: 270,
            height: 100,
            strokeWidth: 10,
            stroke: "black",
            fontSize: 40,
            fontWeight: 800,
            fill: "Chocolate",
        }).addChildTo(this).setPosition(this.gridX.center(4), this.gridY.center(5));
        noButton.on("pointstart", () => {
            // 手順を再生
            drawStonesAuto(pages, 0);
            userChoise = false;
            yesButton.hide();
            noButton.hide();

            choiseLabel.text = "取れていないかな？";
            choiseLabel.show();

            helpImage.hide();
            helpLabel.hide();
        });

        const choiseLabel = Label({
            text: "",
            fontSize: 50,
            fontWeight: 800,
        }).addChildTo(self).setPosition(this.gridX.center(), this.gridY.center(4.5)).hide();

        // showResult();

    },
});

ASSETS = {
    image: {
        "arrow": "img/arrow.png",
        "mouse": "img/mouse.png",
        "mouse2": "img/mouse2.png",
    }
};

phina.main(function() {
    App = GameApp({
        assets: ASSETS,
        startLabel: 'TitleScene',
        scenes: [
            {
                label: 'TitleScene',
                className: 'TitleScene',
            },
            {
                label: 'GameScene',
                className: 'GameScene',
            },
        ],
    });

    App.fps = 60;

    App.run();

});

const IgoUtil = {};

// 石の座標を指定された配列に追加する
// すでに追加済みなら追加しない
IgoUtil.addCellPositionToArray = function(array, cellPosition) {

    // 配列にすでに存在していないか？
    const exists = array.find(function(item) {
        return item.x === cellPosition.x && item.y === cellPosition.y;
    });

    if (!exists) {
        array.push(cellPosition);
    }
};

// 指定した位置にある石を含む連の空点の座標全てを配列で返す
IgoUtil.getSpaceArray = function(banArray, renArray) {
    return IgoUtil.getCellsAroundRenArray(banArray, renArray, " ");
};

// 指定した位置にある石を含む連を囲む黒石の座標全てを配列で返す
IgoUtil.getBlackArray = function(banArray, renArray) {
    return IgoUtil.getCellsAroundRenArray(banArray, renArray, "B");
};

// 連の周囲のセルのうち、指定した値の座標を配列で返す
IgoUtil.getCellsAroundRenArray = function(banArray, renArray, char) {
    const ret = [];

    // 連に含まれる石の上下左右を調べて、値がスペースならそれが空点
    renArray.forEach(function(cell) {
        const x = cell.x;
        const y = cell.y;
        const positions = [{x: x, y: y - 1}, {x: x, y: y + 1}, {x: x - 1, y: y}, {x: x + 1, y: y}];
        positions.forEach(function(position) {
            if (IgoUtil.getCellByPosition(banArray, position) === char) {
                IgoUtil.addCellPositionToArray(ret, position)
            }
        });
    });

    return ret;
}

// 指定した位置にある石を含む連を調べ、連を構成する石の座標全てを配列で返す
IgoUtil.getRenArray = function(banArray, cellPosition) {

    const ret = [];

    // ターゲットの石の色を取得
    const targetColor = IgoUtil.getCellByPosition(banArray, cellPosition);

    // 盤外が指定されていたら調べる必要なし
    if (targetColor === null) {
        return ret;
    }

    const x = cellPosition.x;
    const y = cellPosition.y;

    // チェックフラグを記録するためのマトリックスを生成
    // banArrayと同じ構造で同じ大きさ
    const checkFlgMatrix = [];
    for (let yy = 0; yy < banArray.length; yy ++) {
        checkFlgMatrix.push("".padEnd(banArray[0].length, "0"));
    }

    function check(x, y, targetColor) {

        // すでに調査済みの石なら終了
        if (IgoUtil.getCellByPosition(checkFlgMatrix, {x: x, y: y}) === "1") {
            return;
        }

        // 調査対象の石ではないなら終了
        const color = IgoUtil.getCellByPosition(banArray, {x: x, y: y});
        if (color !== targetColor) {
            return;
        }

        // 調査済みフラグを立てる
        IgoUtil.setCellByPosition(checkFlgMatrix, {x: x, y: y}, "1");

        // 上の座標を調べる
        check(x, y - 1, targetColor);

        // 下の座標を調べる
        check(x, y + 1, targetColor);

        // 左の座標を調べる
        check(x - 1, y, targetColor);

        // 右の座標を調べる
        check(x + 1, y, targetColor);
    }

    check(x, y, targetColor);

    // checkFlgMatrix で値が"1"である座標を返却用の配列に詰める
    for (let i = 0; i < checkFlgMatrix.length; i++) {
        const row = checkFlgMatrix[i];
        const cells = row.split("");
        for (let n = 0; n < cells.length; n++) {
            if (cells[n] === "1") {
                ret.push({x: n, y: i});
            }
        }
    }
    
    return ret;
};

// 指定座標の値を返す.盤外ならnullを返す
IgoUtil.getCellByPosition = function(banArray, cellPosition) {

    const x = cellPosition.x;
    const y = cellPosition.y;

    // xが盤外でないか
    if (x < 0 || x >= banArray[0].length) {
        return null;
    }
    // y が盤外でないか
    if (y < 0 || y >= banArray.length) {
        return null;
    }
    return banArray[y].slice(x, x + 1);
};

// 指定座標の値を設定する
IgoUtil.setCellByPosition = function(banArray, cellPosition, value) {

    const x = cellPosition.x;
    const y = cellPosition.y;

    // xが盤外でないか
    if (x < 0 || x >= banArray[0].length) {
        throw("盤外の値を変更しようとしている");
    }
    // y が盤外でないか
    if (y < 0 || y >= banArray.length) {
        throw("盤外の値を変更しようとしている");
    }

    const cells = banArray[y].split("");
    let newRow = "";
    for (let i = 0; i < cells.length; i++) {
        if (i === x) {
            newRow += value;
        } else {
            newRow += cells[i];
        }
    }
    banArray[y] = newRow;
};

// 黒石を打てる場所か
IgoUtil.canPutBlack = function(banArray, cellPosition) {
    const x = cellPosition.x;
    const y = cellPosition.y;

    // 四方が白石ならNG
    const up = IgoUtil.getCellByPosition(banArray, {x: x, y: y - 1});
    const down = IgoUtil.getCellByPosition(banArray, {x: x, y: y + 1});
    const left = IgoUtil.getCellByPosition(banArray, {x: x - 1, y: y});
    const right = IgoUtil.getCellByPosition(banArray, {x: x + 1, y: y});
    if ((up === "W" || up === null) && (down === "W" || down === null) && (left === "W" || left === null) && (right === "W" || right === null)) {
        return false;
    }

    // 黒が打った図を作り、その連の空点が１だったら取られてしまうのでNG
    const banArray2 = IgoUtil.cloneBanArray(banArray);
    IgoUtil.setCellByPosition(banArray2, cellPosition, "B");
    const renArray = IgoUtil.getRenArray(banArray2, cellPosition);
    const spaceArray = IgoUtil.getSpaceArray(banArray2, renArray);
    if (spaceArray.length === 1) {
        return false;
    }

    return true;
};

IgoUtil.removeRen = function(banArray, cellPosition) {
    const renArray = IgoUtil.getRenArray(banArray, cellPosition);
    renArray.forEach(function(cell) {
        IgoUtil.setCellByPosition(banArray, cell, " ");
    });
};

// 盤配列のコピーを返す
IgoUtil.cloneBanArray = function(banArray) {
    const ret = [];
    for (let y = 0; y < banArray.length; y++) {
        ret.push(banArray[y]);
    }
    return ret;
};

function main(initStones) {

    const ret = [];

    const startPosition = {x: 2, y: 6};

    const banArray = IgoUtil.cloneBanArray(kifu);

    // 問題用の初期配置の石を置く
    initStones.blackStones.forEach(stone => {
        IgoUtil.setCellByPosition(banArray, stone, "B");
    });

    initStones.whiteStones.forEach(stone => {
        IgoUtil.setCellByPosition(banArray, stone, "W");
    });

    consoleBan(banArray, ret);

    const banArray2 = IgoUtil.cloneBanArray(banArray);
    const result = playToEnd(banArray2, true);

    if (result.status === "blackWin") {
        console.log("シチョウ成立！")
    } else {
        console.log("シチョウ不成立！")
    }

    return {
        pages: ret,
        result: result.status,
    };

    function playToEnd(banArray, isOutput, nextIsBlack) {
        while (true) {

            let ret1;

            if (!nextIsBlack) {
                ret1 = whiteTern(banArray);
                if (isOutput) consoleBan(banArray, ret);
            } else {
                if (isOutput) consoleBan(banArray, ret);
            }
            nextIsBlack = false;

            if (ret1.status === "blackWin" || ret1.status === "whiteWin") {
                return {
                    status: ret1.status,
                    banArray: banArray
                };
            }

            ret1 = blackTern(banArray);

            if (ret1.status === "blackWin") {
                IgoUtil.removeRen(banArray, startPosition);
                if (isOutput) consoleBan(banArray, ret);
                return {
                    status: ret1.status,
                    banArray: banArray
                };
            } else if (ret1.status === "whiteWin") {
                return {
                    status: ret1.status,
                    banArray: banArray
                };
            }

            if (isOutput) consoleBan(banArray, ret);
        }
    }

    // 白のターン
    function whiteTern(banArray) {

        // 連を取得する
        const renArray = IgoUtil.getRenArray(banArray, startPosition);

        // 連の周囲を囲んでいる黒石を取得する
        const blackStones = IgoUtil.getBlackArray(banArray, renArray);

        // 黒石を抜く手がある場合、その座標
        let nukiPosition = null;

        // 黒石を１つずつ、三方向が全て白石または盤外である黒石（アタリ状態の黒石）を探す
        for (let i = 0; i < blackStones.length; i++) {
            const blackStone = blackStones[i];
            const x = blackStone.x;
            const y = blackStone.y;
            const positions = [{x: x, y: y - 1}, {x: x, y: y + 1}, {x: x - 1, y: y}, {x: x + 1, y: y}];
            let dame = 4;
            let spacePosition = null;
            for (let n = 0; n < positions.length; n ++) {
                const stone = IgoUtil.getCellByPosition(banArray, positions[n]);
                if (stone === "W" || stone === null) {
                    dame -= 1;
                } else if (stone === " ") {
                    spacePosition = positions[n];
                }
            }
            // dameが1ということは、アタリ状態である
            // ただしspacePositionがnullだったら黒石と連結しているということなので、アタリ状態ではない
            if (dame === 1 && spacePosition !== null) {
                nukiPosition = {
                    white: spacePosition,
                    black: blackStone,
                };
            }
        }


        // 連の周囲の空点を取得する
        const spaceArray = IgoUtil.getSpaceArray(banArray, renArray);

        // チェック
        if (spaceArray.length === 0) {
            console.log("白のターンで空点がない");
            return {status: "blackWin"};
        }
        if (spaceArray.length > 1) {
            throw("白のターンで空点が複数ある、想定外");
        }

        // 自殺手は打てない、ただし、黒を抜く手があるならそれ
        const banArray2 = IgoUtil.cloneBanArray(banArray);
        IgoUtil.setCellByPosition(banArray2, spaceArray[0], "W");
        const renArray2 = IgoUtil.getRenArray(banArray2, startPosition);
        const spaces = IgoUtil.getSpaceArray(banArray2, renArray2);
        if (spaces.length === 0) {
            if (nukiPosition !== null) {
                // 黒石を取る
                IgoUtil.setCellByPosition(banArray, nukiPosition.white, "W");
                IgoUtil.setCellByPosition(banArray, nukiPosition.black, " ");
                return {status: "continue"};
            }
            return {status: "blackWin"};
        }


        if (nukiPosition === null) {
            // 空点に打つ
            IgoUtil.setCellByPosition(banArray, spaceArray[0], "W");
            return {status: "continue"};
        }

        // 黒石を取る手がある場合、
        // まずは空点に打つ手が有効かどうかを調べてから、
        // シチョウが成立しないのなら黒石を取る手を採用する

        // console.log("白番、黒を取らない手を試してみる");
        // const banArray2 = IgoUtil.cloneBanArray(banArray);
        // IgoUtil.setCellByPosition(banArray2, spaceArray[0], "W");
        // const ret = playToEnd(banArray2, false, true);
        // if (ret.status === "whiteWin") {
        //     console.log("白番、黒を取らない手に決定");
        //     IgoUtil.setCellByPosition(banArray, spaceArray[0], "W");
        // } else {
        //     console.log("白番、黒を取る手に決定");
        //     IgoUtil.setCellByPosition(banArray, nukiPosition.white, "W");
        //     IgoUtil.setCellByPosition(banArray, nukiPosition.black, " ");
        // }        

        // ややこしいので、もう取れる場合は取る！
        IgoUtil.setCellByPosition(banArray, nukiPosition.white, "W");
        IgoUtil.setCellByPosition(banArray, nukiPosition.black, " ");

        return {status: "continue"};
    }

    // 黒のターン
    function blackTern(banArray) {

        // 空点を取得する
        const renArray = IgoUtil.getRenArray(banArray, startPosition);
        const spaceArray = IgoUtil.getSpaceArray(banArray, renArray);

        // チェック
        if (spaceArray.length !== 2) {
            if (spaceArray.length === 1) {
                IgoUtil.setCellByPosition(banArray, spaceArray[0], "B");
                return {status: "blackWin"};
            }
            return {status: "whiteWin"};
        }

        // 自殺手は除外
        if (IgoUtil.canPutBlack(banArray, spaceArray[0]) === false) {

            if (IgoUtil.canPutBlack(banArray, spaceArray[1]) === false) {
                return {status: "whiteWin"};
            }

            IgoUtil.setCellByPosition(banArray, spaceArray[1], "B");
            return {status: "continue"};
        }

        if (IgoUtil.canPutBlack(banArray, spaceArray[1]) === false) {

            IgoUtil.setCellByPosition(banArray, spaceArray[0], "B");
            return {status: "continue"};
        }

        // その１
        const pattern1_kifuClone = IgoUtil.cloneBanArray(banArray);
        // 黒が打った図
        IgoUtil.setCellByPosition(pattern1_kifuClone, spaceArray[0], "B");
        // 白が逃げた図
        IgoUtil.setCellByPosition(pattern1_kifuClone, spaceArray[1], "W");
        // 空点の数
        const renArray_1 = IgoUtil.getRenArray(pattern1_kifuClone, startPosition);
        const spaceArray_1 = IgoUtil.getSpaceArray(pattern1_kifuClone, renArray_1);
        const pattern1_spaceCnt = spaceArray_1.length;

        // その２
        const pattern2_kifuClone = IgoUtil.cloneBanArray(banArray);
        // 黒が打った図
        IgoUtil.setCellByPosition(pattern2_kifuClone, spaceArray[1], "B");
        // 白が逃げた図
        IgoUtil.setCellByPosition(pattern2_kifuClone, spaceArray[0], "W");
        // 空点の数
        const renArray_2 = IgoUtil.getRenArray(pattern2_kifuClone, startPosition);
        const spaceArray_2 = IgoUtil.getSpaceArray(pattern2_kifuClone, renArray_2);
        const pattern2_spaceCnt = spaceArray_2.length;
        
        if (pattern1_spaceCnt <= 2 && pattern2_spaceCnt <= 2) {
            console.log("分岐あり。黒はどちらの手にするか検討開始");
            // パターン１のほうで最後まで打ち進めてみて、
            // シチョウ成立する結果ならパターン１に決定
            const banArray2 = IgoUtil.cloneBanArray(banArray);
            IgoUtil.setCellByPosition(banArray2, spaceArray[0], "B");
            console.log("黒番、パターン１を試してみる");
            const ret = playToEnd(banArray2, false);
            if (ret.status === "blackWin") {
                console.log("黒番、パターン１に決定");
                IgoUtil.setCellByPosition(banArray, spaceArray[0], "B");
            } else {
                console.log("黒番、パターン２に決定");
                IgoUtil.setCellByPosition(banArray, spaceArray[1], "B");
            }
        } else if (pattern1_spaceCnt <= 2) {
            IgoUtil.setCellByPosition(banArray, spaceArray[0], "B");
        } else {
            IgoUtil.setCellByPosition(banArray, spaceArray[1], "B");
        }

        return {status: "continue"};
    }


}

function consoleBan(banArray, arry) {
    let text = "+" + "-".padEnd(banArray.length, "-") + "+\n";
    for (let y = 0; y < banArray.length; y++) {
        text = text + "|" + banArray[y] + "|\n";
    }
    text += "+" + "-".padEnd(banArray.length, "-") + "+";
    console.log(text);

    arry.push(IgoUtil.cloneBanArray(banArray));
}

const kifu = [
    "         ",
    "         ",
    "         ",
    "         ",
    "         ",
    " B       ",
    " BWB     ",
    "  B      ",
    "         ",
];

