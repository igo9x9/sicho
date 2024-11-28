phina.globalize();

const version = "1.7";

const info = "補助線を表示できるように\nなりました";

let wait = false;

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
        }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(-3));

        Label({
            text: "version " + version,
            fontSize: 20,
            fill: "black",
        }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(-2.3));

        Label({
            text: info,
            fontSize: 22,
            fill: "black",
        }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(4));

        this.setInteractive(true);
        this.on("pointstart", () => {
            mouse.tweener.by({y:-20}, 100).by({y:20}, 100)
            .call(function() {
                self.exit("GameScene");
            }).play();
        });

        const mouse = Sprite("mouse").addChildTo(this).setPosition(this.gridX.center(), this.gridY.center());

        const saveData = localStorage.getItem("sicho");
        if (saveData) {
            const data = JSON.parse(saveData);
            const combo = data.combo;
            const maxCombo = data.maxCombo;

            if (maxCombo > 1) {
                Label({
                    text: "最高記録 " + maxCombo + "連勝",
                    fontSize: 20,
                    // fontWeight: 800,
                    fill: "black",
                }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(1));
            }

            if (combo > 1) {
                Label({
                    text: combo + "連勝中!",
                    fontSize: 35,
                    fontWeight: 800,
                    fill: "darkred",
                }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(1.6));
            }

        }

        Label({
            text: "TAP TO START",
            fontSize: 20,
            fill: "black",
            fontWeight: 800,
        }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(6));

    },
});

phina.define('CreateQuestionScene', {
    superClass: 'DisplayScene',
    init: function(param/*{}*/) {
        this.superInit(param);

        const self = this;

        const box = RectangleShape({
            width: this.width,
            height: this.height,
            fill: "black",
        });
        box.alpha = 0;
        box.addChildTo(this).setPosition(this.gridX.center(), this.gridY.center());
        box.tweener.to({alpha: 0.8}, 200).play();

        Label({
            text: "問題を作成中...",
            fontSize: 40,
            fill: "white",
        }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(-1));
    },
    update: function () {
        if (!wait) {
            this.exit();
        }
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
        let combo = 0;
        let maxCombo = 0;

        saveData = localStorage.getItem("sicho");
        if (saveData) {
            data = JSON.parse(saveData);
            combo = data.combo ? data.combo : 0;
            maxCombo = data.maxCombo ? data.maxCombo : 0;
        }

        this.backgroundColor = "PeachPuff";

        self.baseLayer = RectangleShape({
            fill: "transparent",
            strokeWidth: 0,
            width: this.width,
            height: this.height,
        }).addChildTo(this).setPosition(0, 0);

        // 説明文
        const helpImage = Sprite("arrow").addChildTo(this).setPosition(260, 480).setRotation(90).hide();
        const helpLabel = LabelArea({
            text: "この白石は\nシチョウで取れていますか？",
            fontSize: 28,
            fontWeight: 800,
            fill: "white",
            width: 400,
            height: 100,
            stroke: "black",
            strokeWidth: 5,
        }).addChildTo(this).setPosition(450, 600).hide();

        const titleButton = Sprite("mouse2").addChildTo(this).setPosition(this.gridX.center(6), this.gridY.center(7));
        titleButton.setInteractive(true);
        titleButton.on("pointstart", () => {
            titleButton.tweener.by({y:-20}, 100).by({y:20}, 100)
            .call(function() {
                self.exit("TitleScene");
            }).play();
        });

        // --------------------------------------------------------------

        wait = true;
        setTimeout(function() {
            App.pushScene(CreateQuestionScene());
        }, 1);

        // 碁盤を表示（初回用）
        const level = String(combo).slice(-1) === "8" ? 1 : (String(combo).slice(-1) === "9" ? 2 : 0);
        const size = level === 0 ? 9 : (level === 1 ? 13 : 19);
        createGoban(size);

        setTimeout(function() {
            // 問題を生成
            createQuestion();

            // 問題を表示
            showQuestion();

            if (combo !== 0) {
                helpImage.hide();
                helpLabel.hide();
            }
    
            wait = false;
        }, 500);

        
        // 碁盤を描画
        function createGoban(size) {

            // 外枠
            self.ban = RectangleShape({
                fill: "Peru",
                width: 630,
                height: 630,
                stroke: "black",
                strokeWidth: 1,
            }).addChildTo(self.baseLayer).setPosition(self.gridX.center(), self.gridY.center(-2.65));
            const grid = Grid({width: self.ban.width - (size === 9 ? 100 : (size === 13 ? 80 : 50)), columns: size - 1});

            const floor = Math.floor(size / 2);
            (size).times(function(spanX) {
                var startPoint = Vector2((spanX - floor) * grid.unitWidth, -1 * grid.width / 2),
                    endPoint = Vector2((spanX - floor) * grid.unitWidth, grid.width / 2);
        
                let strokeWidth = size === 9 ? 2 : 1.5;
                if (spanX === 0 || spanX === size - 1) {
                    strokeWidth = strokeWidth * 2;
                }
                PathShape({paths:[startPoint, endPoint], stroke: "black", strokeWidth: strokeWidth}).addChildTo(self.ban);
            });
        
            (size).times(function(spanY) {
                var startPoint = Vector2(-1 * grid.width / 2, (spanY - floor) * grid.unitWidth),
                    endPoint = Vector2(grid.width / 2, (spanY - floor) * grid.unitWidth);
                
                let strokeWidth = size === 9 ? 2 : 1.5;
                if (spanY === 0 || spanY === size - 1) {
                    strokeWidth = strokeWidth * 2;
                }
                PathShape({paths:[startPoint, endPoint], stroke: "black", strokeWidth: strokeWidth}).addChildTo(self.ban);
            });

            if (size === 9) {
                addStar(2, 2);
                addStar(6, 2);
                addStar(4, 4);
                addStar(2, 6);
                addStar(6, 6);
            } else if (size === 13) {
                addStar(3, 3);
                addStar(9, 3);
                addStar(6, 6);
                addStar(3, 9);
                addStar(9, 9);
            } else if (size === 19) {
                addStar(3, 3);
                addStar(9, 3);
                addStar(15, 3);
                addStar(3, 9);
                addStar(9, 9);
                addStar(15, 9);
                addStar(3, 15);
                addStar(9, 15);
                addStar(15, 15);
            }

            function addStar(spanX, spanY) {
                CircleShape({
                    radius: 5,
                    fill: "black",
                    strokeWidth: 0,
                }).addChildTo(self.ban).setPosition((spanX - floor) * grid.unitWidth, (spanY - floor) * grid.unitWidth);
            }

            self.banLayer = RectangleShape({
                fill: "transparent",
                strokeWidth: 0,
                width: self.ban.width,
                height: self.ban.height,
            }).addChildTo(self.ban).setPosition(0, 0);

            self.banLayer.size = size;
            self.banLayer.grid = grid;

            // 補助線用レイヤ
            self.witnessLineLayer = RectangleShape({
                fill: "transparent",
                strokeWidth: 0,
                width: self.ban.width,
                height: self.ban.height,
            }).addChildTo(self.ban).setPosition(0, 0).hide();

            PathShape({
                paths:[Vector2(-1 * grid.width/2 + grid.unitWidth, grid.width/2 - 3 * grid.unitWidth), Vector2(grid.width/2 - 2 * grid.unitWidth, -1 * grid.width/2)],
                stroke: "yellow",
                strokeWidth: 10,
            }).addChildTo(self.witnessLineLayer);

            PathShape({
                paths:[Vector2(-1 * grid.width/2 + 3 * grid.unitWidth, grid.width/2 - 2 * grid.unitWidth), Vector2(grid.width/2, -1 * grid.width/2 + grid.unitWidth)],
                stroke: "yellow",
                strokeWidth: 10,
            }).addChildTo(self.witnessLineLayer);

            return;
        }

        // 石を描画
        function createStone(color, x, y) {
            const floor = Math.floor(self.banLayer.size / 2);

            let grad;

            if (color === "black") {
                if (self.banLayer.size === 9) {
                    grad = Canvas.createRadialGradient(-15, -15, 0, -10, -10, 15);
                } else if (self.banLayer.size === 13) {
                    grad = Canvas.createRadialGradient(-10, -10, 0, -5, -5, 10);
                } else if (self.banLayer.size === 19) {
                    grad = Canvas.createRadialGradient(-5, -5, 0, -5, -5, 5);
                }
                grad.addColorStop(0.2, "rgb(80, 80, 80)");
                grad.addColorStop(1, "rgb(0, 0, 0)");
            } else {
                if (self.banLayer.size === 9) {
                    grad = Canvas.createRadialGradient(-15, -15, 0, -10, -10, 40);
                } else if (self.banLayer.size === 13) {
                    grad = Canvas.createRadialGradient(-10, -10, 0, -5, -5, 25);
                } else if (self.banLayer.size === 19) {
                    grad = Canvas.createRadialGradient(-5, -5, 0, -5, -5, 20);
                }
                grad.addColorStop(0.1, "rgb(255, 255, 255)");
                grad.addColorStop(0.95, "rgb(150, 150, 150)");
                grad.addColorStop(1, "rgb(130, 130, 130)");
            }
            const stone = CircleShape({
                fill: grad,
                radius: self.banLayer.grid.unitWidth / 2 - 2,
                strokeWidth: 0,
                x: x,
                y, y,
                shadow: color === "white" ? "black" : "transparent",
                shadowBlur: 3,
            });
            stone.addChildTo(self.banLayer).setPosition(self.banLayer.grid.span(x - floor), self.banLayer.grid.span(y - floor));
        };

        // 問題を生成
        function createQuestion() {
            const level = String(combo).slice(-1) === "8" ? 1 : (String(combo).slice(-1) === "9" ? 2 : 0);
            const size = level === 0 ? 9 : (level === 1 ? 13 : 19);
            let mainRet;
            while (true) {
                // @@
                const initStones = createQuestionStones(level);
                // const initStones = {blackStones:[], whiteStones:[]};
                // const initStones = {blackStones:[{x:4, y: 3}, {x: 7, y: 2}], whiteStones:[{x:5,y:4},{x:5,y:1}]};
                mainRet = main(size, initStones);
                if (mainRet.result !== "cancel") {
                    break;
                }
            }
            pages = mainRet.pages;
            result = mainRet.result;
        }

        // 問題を描画
        function showQuestion() {
            drawStones(pages[0]);
            pageIndex = pages.length - 1;
        }

        // 手順を自動再生
        function drawStonesAuto(pages, pageIndex) {

            wait = true;

            if (pageIndex === pages.length) {
                showResult();
                wait = false;
                return;
            }

            const timing = (pages[0].length > 9 && pageIndex < (pages.length * 2 / 3)) ? 50 : (combo >= 10 ? 100 : 200);

            setTimeout(function() {
                const page = pages[pageIndex];
                drawStones(page);
                drawStonesAuto(pages, pageIndex + 1);
            }, timing);

        }

        // 全ての石を描画
        function drawStones(page) {

            self.banLayer.children.clear();

            for (let y = 0; y < page.length; y ++) {
                const cols = page[y].split("");
                for (let x = 0; x < cols.length; x++) {
                    if (cols[x] === "W") {
                        createStone("white", x, y);
                    } else if (cols[x] === "B") {
                        createStone("black", x, y);
                    }
                }
            }
        }

        // 問題を作る
        // level 0:9路盤 1:13路盤 2:19路盤
        function createQuestionStones(level) {

            const allStones = [];
            const blackStones = [];
            const whiteStones = [];

            const size = level === 0 ? 9 : (level === 1 ? 13 : 19);

            const minX = Math.ceil(size / 2);
            const maxX = size - 2;
            const minY = 1;
            const maxY = Math.ceil(size / 2);
            
            function white() {
                let stone;
                while (true) {
                    stone = {x: Math.randint(minX, maxX), y: Math.randint(minY, maxY)};
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
                    stone = {x: Math.randint(minX, maxX), y: Math.randint(minY, maxY)};
                    if (!allStones.find(s => s.x === stone.x && s.y === stone.y)) {
                        break;
                    }
                }
                allStones.push(stone);
                blackStones.push(stone);
            }

            white();
            black();
            white();
            black();

            if (size === 13) {
                white();
                black();
            } else if (size === 19) {
                white();
                black();
            }
            
            return {
                blackStones: blackStones,
                whiteStones: whiteStones,
            };
    
        }

        // UI

        let witness = false;

        function showResult() {
            choiseLabel.hide();

            backButton.show();
            forwardButton.show();
            nextButton.show();

            witness = false;
            witnessButton.hide();
            self.witnessLineLayer.hide();

            if (userChoise === true && result === "blackWin" || userChoise === false && result === "whiteWin") {
                combo += 1;
                if (combo > maxCombo) {
                    maxCombo = combo;
                }
            } else {
                combo = 0;
            }
            const data = {
                combo: combo,
                maxCombo: maxCombo,
            };
            localStorage.setItem("sicho", JSON.stringify(data));
            comboLabel.text = combo + "連勝中!";
            const comments = ["", "すごい!", "まさかの!", "驚異的!", "夢の!", "名人!", "前人未踏!", "世界クラス!", "ミラクル!", "天才的!"];
            if (combo >= 100) {
                comboCommentLabel.text = "神の領域!";
            } else if (combo >= 10) {
                comboCommentLabel.text = comments[Number(String(combo / 10).charAt(0))];
            } else {
                comboCommentLabel.text = "";
            }
            if (combo > 1) {
                comboLabel.show();
                comboCommentLabel.show();
            } else {
                comboLabel.hide();
                comboCommentLabel.hide();
            }

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
            witnessButton.show();
        }

        const backButton = MyButton({
            text: "<",
            width: 80,
            height: 50,
            fill: "lavender",
            fontColor: "black",
            fontWeight: 800,
            stroke: "black",
            strokeWidth: 8,
        }).addChildTo(this).setPosition(this.gridX.center(3), this.gridY.center(2.9)).hide();
        backButton.selected = () => {
            if (!backButton.visible) return;
            if (wait) return;
            if (pageIndex === 0) return;
            pageIndex -= 1;
            drawStones(pages[pageIndex]);
        };

        const witnessButton = MyButton({
            text: "補助線",
            width: 150,
            height: 50,
            fill: "lavender",
            fontColor: "black",
            fontWeight: 800,
            stroke: "black",
            strokeWidth: 8,
        }).addChildTo(this).setPosition(this.gridX.center(5), this.gridY.center(2.9));
        witnessButton.selected = () => {
            if (witness) {
                self.witnessLineLayer.hide();
            } else {
                self.witnessLineLayer.show();
            }
            witness = !witness;
        };

        const resultLabel = Label({
            text: "",
            fontSize: 90,
            fontWeight: 800,
        }).addChildTo(self).setPosition(this.gridX.center(), this.gridY.center(4.5)).hide();;

        const forwardButton = MyButton({
            text: ">",
            width: 80,
            height: 50,
            fill: "lavender",
            fontColor: "black",
            fontWeight: 800,
            stroke: "black",
            strokeWidth: 8,
        }).addChildTo(this).setPosition(this.gridX.center(5.6), this.gridY.center(2.9)).hide();
        forwardButton.selected = () => {
            if (!forwardButton.visible) return;
            if (wait) return;
            if (pageIndex === pages.length - 1) return;
            pageIndex += 1;
            drawStones(pages[pageIndex]);
        };

        const nextButton = MyButton({
            text: "次の問題",
            width: 230,
            height: 80,
            fill: "white",
            strokeWidth: 10,
            stroke: "black",
            fontColor: "black",
            fontWeight: 800,
        }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(6.5)).hide();
        nextButton.selected = () => {
            if (!nextButton.visible) return;
            if (wait) return;

            wait = true;
            setTimeout(function() {
                App.pushScene(CreateQuestionScene());
            }, 1);
    
            setTimeout(function() {
                // 問題を生成＆表示
                hideResult();
                createQuestion();
                self.ban.remove();
                createGoban(pages[0].length);
                showQuestion();
                wait = false;
            }, 500);
        };

        const comboCommentLabel = Label({
            text: "すごい!",
            fontWeight: 800,
            fontSize: 30,
            fill: "crimson",
            stroke: "white",
            strokeWidth: 4,
        }).addChildTo(nextButton).setPosition(-115, -50).setRotation(-25);
        const comboLabel = Label({
            text: "2連勝中!",
            fontWeight: 800,
            fontSize: 30,
            fill: "crimson",
            stroke: "white",
            strokeWidth: 4,
        }).addChildTo(nextButton).setPosition(-100, -25).setRotation(-25);

        const yesButton = MyButton({
            text: "取れている",
            width: 270,
            height: 100,
            strokeWidth: 10,
            stroke: "black",
            fontSize: 40,
            fontWeight: 800,
            fill: "dodgerblue",
        }).addChildTo(this).setPosition(this.gridX.center(-4), this.gridY.center(5));
        yesButton.selected = () => {
            if (!yesButton.visible) return;
            if (wait) return;
            // 手順を再生
            drawStonesAuto(pages, 0);
            userChoise = true;
            yesButton.hide();
            noButton.hide();
            witnessButton.hide();

            choiseLabel.text = "取れているかな？";
            choiseLabel.show();

            helpImage.hide();
            helpLabel.hide();
        };

        const noButton = MyButton({
            text: "取れていない",
            width: 270,
            height: 100,
            strokeWidth: 10,
            stroke: "black",
            fontSize: 40,
            fontWeight: 800,
            fill: "#FF6600",
        }).addChildTo(this).setPosition(this.gridX.center(4), this.gridY.center(5));
        noButton.selected = () => {
            if (wait) return;
            if (!noButton.visible) return;
            // 手順を再生
            drawStonesAuto(pages, 0);
            userChoise = false;
            yesButton.hide();
            noButton.hide();
            witnessButton.hide();

            choiseLabel.text = "取れていないかな？";
            choiseLabel.show();

            helpImage.hide();
            helpLabel.hide();
        };

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
        "frog": "img/frog.png",
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

function main(size, initStones) {

    const ret = [];

    const startPosition = size === 9 ? {x: 2, y: 6} : (size === 13 ? {x: 2, y: 10} : {x: 2, y: 16});

    const banArray = IgoUtil.cloneBanArray(kifu[size === 9 ? 0 : (size === 13 ? 1 : 2)]);

    // 問題用の初期配置の石を置く
    initStones.blackStones.forEach(stone => {
        IgoUtil.setCellByPosition(banArray, stone, "B");
    });

    initStones.whiteStones.forEach(stone => {
        IgoUtil.setCellByPosition(banArray, stone, "W");
    });

    consoleBan(banArray, ret);

    const startTime = new Date().getTime();

    const banArray2 = IgoUtil.cloneBanArray(banArray);
    const result = playToEnd(banArray2, true);

    if (result.status === "blackWin") {
        console.log("シチョウ成立！")
    } else if (result.status === "whiteWin") {
        console.log("シチョウ不成立！")
    } else {
        console.log("中止！")
    }

    return {
        pages: ret,
        result: result.status,
    };

    function playToEnd(banArray, isOutput, nextIsBlack) {

        let depth = 0;

        // １秒以上経過していたら中止
        const min = ((new Date().getTime()) - startTime) / 1000;
        if (min > 1) {
            return {
                status: "cancel",
                banArray: null,
                depth: depth,
            };
        }

        // 探索の深さが50を超えたら中止する（コウで無限ループになっている可能性）
        if (depth > 50) {
            return {
                status: "cancel",
                banArray: null,
                depth: depth,
            };
        }

        while (true) {

            let ret1 = {};

            depth += 1;

            if (!nextIsBlack) {
                ret1 = whiteTern(banArray, depth);
                if (isOutput) consoleBan(banArray, ret);
            } else {
                if (isOutput) consoleBan(banArray, ret);
            }
            nextIsBlack = false;

            if (ret1.status === "blackWin" || ret1.status === "whiteWin" || ret1.status === "cancel") {
                return {
                    status: ret1.status,
                    banArray: banArray,
                    depth: ret1.depth,
                };
            }

            ret1 = blackTern(banArray, depth);

            if (ret1.status === "blackWin") {
                IgoUtil.removeRen(banArray, startPosition);
                if (isOutput) consoleBan(banArray, ret);
                return {
                    status: ret1.status,
                    banArray: banArray,
                    depth: ret1.depth,
                };
            } else if (ret1.status === "whiteWin") {
                return {
                    status: ret1.status,
                    banArray: banArray,
                    depth: ret1.depth,
                };
            } else if (ret1.status === "cancel") {
                return {
                    status: ret1.status,
                    banArray: banArray,
                    depth: ret1.depth,
                };
            }

            if (isOutput) consoleBan(banArray, ret);
        }
    }

    // 白のターン
    function whiteTern(banArray, depth) {

        // 連を取得する
        const renArray = IgoUtil.getRenArray(banArray, startPosition);

        // 連の周囲を囲んでいる黒石を取得する
        const blackStones = IgoUtil.getBlackArray(banArray, renArray);

        // 黒石を抜く手がある場合、その座標
        let nukiPosition = null;

        // あと一手で黒を取れる座標を探す
        // 黒石をひとつずつ、連を取得してその空点が１つであるものを探して、見つかったら抜ける
        for (let i = 0; i < blackStones.length; i++) {

            const blackStone = blackStones[i];
            const blackRenArray = IgoUtil.getRenArray(banArray, blackStone);
            const blackSpaceArray = IgoUtil.getSpaceArray(banArray, blackRenArray);

            if (blackSpaceArray.length === 1) {
                nukiPosition = {
                    white: blackSpaceArray[0],
                    black: blackStone,
                };
                break;
            }
        }

        // 連の周囲の空点を取得する
        const spaceArray = IgoUtil.getSpaceArray(banArray, renArray);

        // チェック
        if (spaceArray.length === 0) {
            console.log("白のターンで空点がない");
            return {
                status: "blackWin",
                depth: depth,
            };
        }
        if (spaceArray.length > 1) {
            throw("白のターンで空点が複数ある、想定外");
        }

        // 自殺手は打てない、ただし、黒を抜く手があるならそれ
        const banArray0 = IgoUtil.cloneBanArray(banArray);
        IgoUtil.setCellByPosition(banArray0, spaceArray[0], "W");
        const renArray2 = IgoUtil.getRenArray(banArray0, startPosition);
        const spaces = IgoUtil.getSpaceArray(banArray0, renArray2);
        if (spaces.length === 0) {
            if (nukiPosition !== null) {
                // 黒石を取る
                IgoUtil.setCellByPosition(banArray, nukiPosition.white, "W");
                IgoUtil.setCellByPosition(banArray, nukiPosition.black, " ");
                return {
                    status: "continue",
                    depth: depth,
                };
            }
            return {
                status: "blackWin",
                depth: depth,
            };
        }


        if (nukiPosition === null) {
            // 空点に打つ
            IgoUtil.setCellByPosition(banArray, spaceArray[0], "W");
            return {
                status: "continue",
                depth: depth,
            };
        }

        // この時点で、空点の１つは黒を抜く手、もう１つは逃げる手
        // どちらを採用するか検討する

        // 黒を抜く手を調べる
        const banArray1 = IgoUtil.cloneBanArray(banArray);
        IgoUtil.setCellByPosition(banArray1, nukiPosition.white, "W");
        IgoUtil.setCellByPosition(banArray1, nukiPosition.black, " ");
        console.log("白番、黒を抜く手を試してみる", nukiPosition);
        const ret1 = playToEnd(banArray1, false, true);
        // 探索限界チェック
        if (ret1.status === "cancel") {
            return {
                status: "cancel",
                depth: depth,
            }
        }

        // 逃げるだけの手を調べる
        const banArray2 = IgoUtil.cloneBanArray(banArray);
        IgoUtil.setCellByPosition(banArray2, spaceArray[0], "W");
        console.log("白番、逃げる手を試してみる", spaceArray[0]);
        const ret2 = playToEnd(banArray2, false, true);
        // 探索限界チェック
        if (ret2.status === "cancel") {
            return {
                status: "cancel",
                depth: depth,
            }
        }

        // どちらも成立する場合
        if (ret1.status === "whiteWin" && ret2.status === "whiteWin") {
            // 手順が短い方を採用
            if (ret1.depth < ret2.depth) {
                console.log("白番、黒を抜く手に決定（深さで）", nukiPosition, ret1, ret2);
                IgoUtil.setCellByPosition(banArray, nukiPosition.white, "W");
                IgoUtil.setCellByPosition(banArray, nukiPosition.black, " ");
                depth += ret1.depth;
            } else {
                console.log("白番、逃げる手に決定（深さで）", spaceArray[0], ret1, ret2);
                IgoUtil.setCellByPosition(banArray, spaceArray[0], "W");
                depth += ret2.depth;
            }
        } else if (ret1.status === "whiteWin") {
            console.log("白番、黒を抜く手に決定（成立するのはこれ）", nukiPosition, ret1, ret2);
            IgoUtil.setCellByPosition(banArray, nukiPosition.white, "W");
            IgoUtil.setCellByPosition(banArray, nukiPosition.black, " ");
            depth += ret1.depth;
        } else if (ret2.status === "whiteWin") {
            console.log("白番、逃げる手に決定（成立するのはこれ）", spaceArray[0], ret1, ret2);
            IgoUtil.setCellByPosition(banArray, spaceArray[0], "W");
            depth += ret2.depth;
        } else {
            console.log("白番、黒を抜く手に決定（成立する手がない）", nukiPosition, ret1, ret2);
            IgoUtil.setCellByPosition(banArray, nukiPosition.white, "W");
            IgoUtil.setCellByPosition(banArray, nukiPosition.black, " ");
            depth += ret1.depth;
        }

        return {
            status: "continue",
            depth: depth,
        };
    }

    // 黒のターン
    function blackTern(banArray, depth) {

        // 空点を取得する
        const renArray = IgoUtil.getRenArray(banArray, startPosition);
        const spaceArray = IgoUtil.getSpaceArray(banArray, renArray);

        // チェック
        if (spaceArray.length !== 2) {
            if (spaceArray.length === 1) {
                IgoUtil.setCellByPosition(banArray, spaceArray[0], "B");
                return {
                    status: "blackWin",
                    depth: depth,
                };
            }
            return {
                status: "whiteWin",
                depth: depth,
            };
        }

        // 自殺手は除外
        if (IgoUtil.canPutBlack(banArray, spaceArray[0]) === false) {

            if (IgoUtil.canPutBlack(banArray, spaceArray[1]) === false) {
                return {
                    status: "whiteWin",
                    depth: depth,
                };
            }

            IgoUtil.setCellByPosition(banArray, spaceArray[1], "B");
            return {
                status: "continue",
                depth: depth,
            };
        }

        if (IgoUtil.canPutBlack(banArray, spaceArray[1]) === false) {

            IgoUtil.setCellByPosition(banArray, spaceArray[0], "B");
            return {
                status: "continue",
                depth: depth,
            };
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
            // パターン１とパターン２の両方で最後まで打ち進めてみて、
            // どちらもシチョウ成立する結果なら手数が少ない方を採用

            const banArray1 = IgoUtil.cloneBanArray(banArray);
            IgoUtil.setCellByPosition(banArray1, spaceArray[0], "B");
            console.log("黒番、パターン１を試してみる");
            const ret1 = playToEnd(banArray1, false);
            // 探索限界チェック
            if (ret1.status === "cancel") {
                return {
                    status: "cancel",
                    depth: depth,
                }
            }

            const banArray2 = IgoUtil.cloneBanArray(banArray);
            IgoUtil.setCellByPosition(banArray2, spaceArray[1], "B");
            console.log("黒番、パターン２を試してみる");
            const ret2 = playToEnd(banArray2, false);
            // 探索限界チェック
            if (ret2.status === "cancel") {
                return {
                    status: "cancel",
                    depth: depth,
                }
            }

            // どちらも成立する場合
            if (ret1.status === "blackWin" && ret2.status === "blackWin") {
                if (ret1.depth < ret2.depth) {
                    console.log("黒番、パターン１に決定（深さで）");
                    IgoUtil.setCellByPosition(banArray, spaceArray[0], "B");
                    depth += ret1.depth;
                } else {
                    console.log("黒番、パターン２に決定（深さで）");
                    IgoUtil.setCellByPosition(banArray, spaceArray[1], "B");
                    depth += ret2.depth;
                }
            } else if (ret1.status === "blackWin") {
                console.log("黒番、パターン１に決定（成立するのはこれ）");
                IgoUtil.setCellByPosition(banArray, spaceArray[0], "B");
                depth += ret1.depth;
            } else if (ret2.status === "blackWin") {
                console.log("黒番、パターン２に決定（成立するのはこれ）");
                IgoUtil.setCellByPosition(banArray, spaceArray[1], "B");
                depth += ret2.depth;
            } else {
                if (ret2.depth < ret1.depth) {
                    console.log("黒番、パターン１に決定（成立しないが深さが深いほう）");
                    IgoUtil.setCellByPosition(banArray, spaceArray[0], "B");
                    depth += ret1.depth;
                } else {
                    console.log("黒番、パターン２に決定（成立しないが深さが深いほう）");
                    IgoUtil.setCellByPosition(banArray, spaceArray[1], "B");
                    depth += ret2.depth;
                }
            }

        } else if (pattern1_spaceCnt <= 2) {
            IgoUtil.setCellByPosition(banArray, spaceArray[0], "B");
        } else {
            IgoUtil.setCellByPosition(banArray, spaceArray[1], "B");
        }

        return {
            status: "continue",
            depth: depth,
        };
    }


}

phina.define('MyButton', {
    superClass: 'Button',
    init: function(param) {
        this.superInit(param);

        const self = this;

        self.pointOn = false;

        const a = PathShape({
            paths:[Vector2(-1 * this.width/2 + 4, this.height/2 - 2), Vector2(this.width/2 - 4, this.height/2 - 2)],
            stroke: "black",
        })
        .addChildTo(this).setPosition(0, 0);
        a.alpha = 0.2;

        const b = PathShape({
            paths:[Vector2(-1 * this.width/2 + 4, - 1 * this.height/2 + 2), Vector2(this.width/2 - 4, -1 * this.height/2 + 2)],
            stroke: "white",
        })
        .addChildTo(this).setPosition(0, 0);
        b.alpha = 0.2;

        this.selected = null;

        this.on("pointstart", () => {
            self.pointOn = true;
            self.tweener.to({scaleX: 0.95, scaleY: 0.95}, 10).play();
        });
        this.on("pointend", () => {
            if (!self.pointOn) return;
            if (!self.visible) return;
            self.tweener.to({scaleX: 1, scaleY: 1}, 10)
            .call(() => {
                if (self.selected) {
                    self.selected();
                }
            })
            .play();
        });
        this.on("pointout", () => {
            self.pointOn = false;
            self.tweener.to({scaleX: 1, scaleY: 1}, 10).play();
        });

    },
});

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
    // "         ",
    // "         ",
    // "         ",
    // "         ",
    // "         ",
    // " B       ",
    // " BWB     ",
    // "  B      ",
    // "         ",
    [
        "         ",
        "         ",
        "         ",
        "         ",
        "         ",
        " B       ",
        " BWB     ",
        "  B      ",
        "         ",
    ], [
        "             ",
        "             ",
        "             ",
        "             ",
        "             ",
        "             ",
        "             ",
        "             ",
        "             ",
        " B           ",
        " BWB         ",
        "  B          ",
        "             ",
    ], [
        "                   ",
        "                   ",
        "                   ",
        "                   ",
        "                   ",
        "                   ",
        "                   ",
        "                   ",
        "                   ",
        "                   ",
        "                   ",
        "                   ",
        "                   ",
        "                   ",
        "                   ",
        " B                 ",
        " BWB               ",
        "  B                ",
        "                   ",
    ]
];

