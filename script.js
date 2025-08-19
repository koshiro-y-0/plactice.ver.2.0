class ChatBotGame {
    constructor() {
        this.userName = '';
        this.currentStep = 'greeting';
        this.userVictoryCount = 0;
        this.botVictoryCount = 0;
        this.currentGame = 0;
        this.gameResults = [];
        
        // ポケモンデータ
        this.pokemonList = {
            "リザードン": { name: "リザードン", maxHp: 110, currentHp: 110, attack: 30, defense: 10, skillName: "かえんほうしゃ", skillEffect: "次の攻撃のダメージが2倍になる。" },
            "カメックス": { name: "カメックス", maxHp: 100, currentHp: 100, attack: 20, defense: 25, skillName: "ハイドロポンプ", skillEffect: "相手に20の固定ダメージを与える。" },
            "フシギバナ": { name: "フシギバナ", maxHp: 115, currentHp: 115, attack: 22, defense: 20, skillName: "まもる", skillEffect: "相手の次の攻撃ダメージを半減する。" },
            "ピカチュウ": { name: "ピカチュウ", maxHp: 70, currentHp: 70, attack: 35, defense: 8, skillName: "10万ボルト", skillEffect: "次の攻撃が必ずクリティカルヒット（ダメージ1.5倍）になる。" },
            "ルカリオ": { name: "ルカリオ", maxHp: 95, currentHp: 95, attack: 28, defense: 15, skillName: "かなしばり", skillEffect: "相手を1ターン行動不能にする。" }
        };
        
        this.initializeElements();
        this.bindEvents();
        this.start();
    }
    
    initializeElements() {
        // 画面全体会話ビュー要素
        this.speechBubble = document.getElementById('speechBubble');
        this.userInput = document.getElementById('userInput');
        this.sendButton = document.getElementById('sendButton');
        this.quickActions = document.getElementById('quickActions');
        this.gameModal = document.getElementById('gameModal');
        // オセロ用要素
        this.othelloModal = document.getElementById('othelloModal');
        this.othelloBoard = document.getElementById('othelloBoard');
        this.fxLayer = document.getElementById('fxLayer');
    }
    
    // クイックアクション（選択ボタン）ユーティリティ
    setQuickActions(buttonConfigs) {
        this.quickActions.innerHTML = '';
        buttonConfigs.forEach(cfg => {
            const btn = document.createElement('button');
            btn.className = 'quick-btn';
            btn.textContent = cfg.label;
            btn.addEventListener('click', () => cfg.onClick());
            this.quickActions.appendChild(btn);
        });
    }

    clearQuickActions() {
        this.quickActions.innerHTML = '';
    }

    // ========= アニメーション（FX）ユーティリティ =========
    createFxElement(className, lifetimeMs = 900) {
        const el = document.createElement('div');
        el.className = className;
        this.fxLayer.appendChild(el);
        setTimeout(() => {
            if (el && el.parentNode) el.parentNode.removeChild(el);
        }, lifetimeMs);
        return el;
    }

    showBurst() {
        this.createFxElement('burst', 700);
    }

    showSlash() {
        this.createFxElement('slash', 600);
    }

    showShield() {
        this.createFxElement('shield', 900);
    }

    showSparks(count = 6) {
        for (let i = 0; i < count; i++) {
            const spark = this.createFxElement('spark', 800);
            const angle = Math.random() * Math.PI * 2;
            const radius = 80 + Math.random() * 60;
            const dx = Math.cos(angle) * radius;
            const dy = Math.sin(angle) * radius;
            spark.style.setProperty('--dx', `${dx}px`);
            spark.style.setProperty('--dy', `${dy}px`);
        }
    }

    revealCard(nextCard, effect = 'none') {
        // カードフリップ演出（? → 数字）
        const card = document.createElement('div');
        card.className = 'card-flip';
        const inner = document.createElement('div');
        inner.className = 'card-flip-inner';
        const front = document.createElement('div');
        front.className = 'card-face card-front';
        front.textContent = '?';
        const back = document.createElement('div');
        back.className = 'card-face card-back';
        back.textContent = String(nextCard);
        inner.appendChild(front);
        inner.appendChild(back);
        card.appendChild(inner);
        this.fxLayer.appendChild(card);
        setTimeout(() => {
            if (card && card.parentNode) card.parentNode.removeChild(card);
        }, 800);

        // 結果に応じた追加エフェクト
        setTimeout(() => {
            if (effect === 'correct') this.showBurst();
            else if (effect === 'wrong') this.showSlash();
            else if (effect === 'draw') this.showShield();
        }, 620);
    }

    bindEvents() {
        this.sendButton.addEventListener('click', () => this.handleUserInput());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleUserInput();
        });
        
        // ゲーム選択ボタンのイベント
        document.querySelectorAll('.game-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectGame(parseInt(e.target.dataset.game));
            });
        });
        
        // オセロはセルクリックで操作するため、静的イベントは不要
    }
    
    start() {
        this.addBotMessage("初めまして、私の名前はチャットボット🤖です！！！");
        this.addBotMessage("あなたの名前は？");
        this.enableInput();
    }
    
    addBotMessage(message) {
        this.speechBubble.textContent = message;
    }
    
    addUserMessage(message) {
        // 吹き出しにユーザーの入力を一瞬表示してからボット応答に切替えるより、
        // 現在はユーザー入力はログ表示せずフローを進める（見た目を簡潔に）
        // 必要ならここで短いトースト表示等に差し替え可能
        this.speechBubble.textContent = message;
    }
    
    addSystemMessage(message) {
        this.speechBubble.textContent = message;
    }
    
    enableInput() {
        this.userInput.disabled = false;
        this.sendButton.disabled = false;
        this.userInput.focus();
    }
    
    disableInput() {
        this.userInput.disabled = true;
        this.sendButton.disabled = true;
    }
    
    handleUserInput() {
        const input = this.userInput.value.trim();
        if (!input) return;
        
        this.addUserMessage(input);
        this.userInput.value = '';
        this.disableInput();
        
        setTimeout(() => {
            this.processInput(input);
        }, 500);
    }
    
    processInput(input) {
        switch (this.currentStep) {
            case 'greeting':
                this.handleGreeting(input);
                break;
            case 'weather':
                this.handleWeather(input);
                break;
            case 'game_preparation':
                this.handleGamePreparation(input);
                break;
            case 'game_selection':
                this.handleGameSelection(input);
                break;
            case 'janken_input':
                this.handleJankenInput(input);
                break;
            case 'highlow_preparation':
                this.handleHighLowPreparation(input);
                break;
            case 'highlow_input':
                this.handleHighLowInput(input);
                break;
        }
    }
    
    handleGreeting(input) {
        this.userName = input;
        const hour = new Date().getHours();
        let greeting = '';
        
        if (0 <= hour && hour <= 4) {
            greeting = `こんばんわ 😴 ${this.userName}さん`;
        } else if (5 <= hour && hour <= 11) {
            greeting = `おはようございます 🥱 ${this.userName}さん`;
        } else if (11 < hour && hour <= 18) {
            greeting = `こんにちは 🤗 ${this.userName}さん`;
        } else {
            greeting = `こんばんわ 😴 ${this.userName}さん`;
        }
        
        this.addBotMessage(greeting);
        this.addBotMessage(`${this.userName}さん！明日の天気はもう確認しましたか？`);
        this.addBotMessage("下のボタンから選んでください。");
        this.currentStep = 'weather';
        this.disableInput();
        this.setQuickActions([
            { label: '1: 確認済み', onClick: () => { this.clearQuickActions(); this.handleWeather('1'); } },
            { label: '2: まだ確認していない', onClick: () => { this.clearQuickActions(); this.handleWeather('2'); } }
        ]);
    }
    
    handleWeather(input) {
        if (input === '1') {
            this.addBotMessage("素晴らしい！ありがとうございます！");
            this.startGamePreparation();
        } else if (input === '2') {
            this.addBotMessage("明日の北九州の天気をお知らせします。");
            this.showWeather();
        } else {
            this.addBotMessage("「1」と「2」以外は入力しないでください。");
            // 入力は使わないため、ボタンを再表示
            this.disableInput();
            this.setQuickActions([
                { label: '1: 確認済み', onClick: () => { this.clearQuickActions(); this.handleWeather('1'); } },
                { label: '2: まだ確認していない', onClick: () => { this.clearQuickActions(); this.handleWeather('2'); } }
            ]);
        }
    }
    
    showWeather() {
        // 天気予報のシミュレーション（実際のAPIは使用しない）
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const month = tomorrow.getMonth() + 1;
        const day = tomorrow.getDate();
        
        this.addBotMessage(`✨ ${month}月${day}日 明日の北九州市の天気予報 ✨`);
        this.addBotMessage("--- 朝 🌅 の予報 ---");
        this.addBotMessage(" 🌡️  平均気温: 18.5°C (最低: 15.2°C, 最高: 22.1°C)");
        this.addBotMessage(" 💧  平均湿度: 65.3%");
        this.addBotMessage(" ☁️  天気: 晴れ");
        
        this.addBotMessage("--- 昼 ☀️ の予報 ---");
        this.addBotMessage(" 🌡️  平均気温: 22.8°C (最低: 20.1°C, 最高: 25.5°C)");
        this.addBotMessage(" 💧  平均湿度: 58.7%");
        this.addBotMessage(" ☁️  天気: 晴れ時々曇り");
        
        this.addBotMessage("--- 夜 🌙 の予報 ---");
        this.addBotMessage(" 🌡️  平均気温: 16.2°C (最低: 13.8°C, 最高: 18.9°C)");
        this.addBotMessage(" 💧  平均湿度: 72.1%");
        this.addBotMessage(" ☁️  天気: 曇り");
        
        this.addBotMessage("--- 明日全体の気温 ---");
        this.addBotMessage(" ⬇️  明日の最低気温: 13.8°C");
        this.addBotMessage(" ⬆️  明日の最高気温: 25.5°C");
        
        setTimeout(() => {
            this.startGamePreparation();
        }, 1000);
    }
    
    startGamePreparation() {
        this.addSystemMessage("--- ゲーム開始の準備 ---");
        this.addBotMessage("次はいよいよゲームが始まります");
        this.addBotMessage("準備OKならボタンの『はい』を押してください！");
        this.currentStep = 'game_preparation';
        this.disableInput();
        this.setQuickActions([
            { label: 'はい', onClick: () => { this.clearQuickActions(); this.handleGamePreparation('はい'); } },
            { label: 'まだ', onClick: () => { this.handleGamePreparation('まだ'); } }
        ]);
    }
    
    handleGamePreparation(input) {
        if (input === 'はい') {
            this.addBotMessage("👍 準備OKですね！ゲームを始めましょう！");
            this.startGames();
        } else {
            this.addBotMessage(`ゆっくりでいいですよ。${this.userName}さんのペースで大丈夫です。`);
            // ボタンはそのまま表示しておく
        }
    }
    
    startGames() {
        this.addBotMessage("これから3回、私とゲームをします。ルールは3回勝負して勝利数が多い方が勝ちです");
        this.addBotMessage("同じゲームを3回選択することも可能です！！");
        this.addBotMessage(`${this.userName}さんの好きなゲームを選んでください。`);
        // 直接モーダルを表示して選択してもらう
        this.gameModal.style.display = 'block';
    }
    
    handleGameSelection(input) {
        const gameNumber = parseInt(input);
        if (gameNumber >= 1 && gameNumber <= 3) {
            this.currentGame = gameNumber;
            this.gameModal.style.display = 'block';
        } else {
            this.addBotMessage("⚠️ 入力値が間違えています。1, 2, 3のいずれかの数字を入力してください。");
            this.enableInput();
        }
    }
    
    selectGame(gameNumber) {
        this.gameModal.style.display = 'none';
        this.currentGame = gameNumber;
        
        switch (gameNumber) {
            case 1:
                this.startJanken();
                break;
            case 2:
                this.startHighLow();
                break;
            case 3:
                this.startOthello();
                break;
        }
    }
    
    startJanken() {
        this.addBotMessage("--- じゃんけんが選ばれました ---");
        this.addBotMessage("ルールを説明します。今回のじゃんけんは3回勝負です（あいこを除く）");
        this.addBotMessage(`最初に手を入力して、${this.userName}さんから手を出します。`);
        this.addBotMessage("わたしはランダムに決めるので不正はないので安心してください。");
        this.addBotMessage("出す手は下のボタンから「グー」「チョキ」「パー」を選んでください。");
        this.addBotMessage("先に2回勝った方が勝利です。");
        
        this.jankenData = {
            userPoints: 0,
            botPoints: 0,
            round: 1
        };
        
        this.currentStep = 'janken_input';
        this.disableInput();
        this.showJankenButtons();
    }
    
    showJankenButtons() {
        this.setQuickActions([
            { label: 'グー', onClick: () => { this.clearQuickActions(); this.handleJankenInput('グー'); } },
            { label: 'チョキ', onClick: () => { this.clearQuickActions(); this.handleJankenInput('チョキ'); } },
            { label: 'パー', onClick: () => { this.clearQuickActions(); this.handleJankenInput('パー'); } },
        ]);
    }

    // ========= オセロ =========
    startOthello() {
        this.addBotMessage("--- オセロが選ばれました ---");
        this.addBotMessage("あなたは⚪（白）、わたしは⚫（黒）です。挟んで裏返します。");
        this.addBotMessage("あなたの番から開始します。");

        this.othello = {
            SIZE: 8,
            EMPTY: '.',
            WHITE: 'W', // user
            BLACK: 'B', // bot
            board: [],
            turn: 'W'
        };

        this.initOthelloBoard();
        this.renderOthelloBoard();
        this.othelloModal.style.display = 'block';
    }

    initOthelloBoard() {
        const N = this.othello.SIZE;
        const E = this.othello.EMPTY;
        this.othello.board = Array.from({ length: N }, () => Array.from({ length: N }, () => E));
        const mid = N / 2;
        this.othello.board[mid - 1][mid - 1] = this.othello.WHITE;
        this.othello.board[mid][mid] = this.othello.WHITE;
        this.othello.board[mid - 1][mid] = this.othello.BLACK;
        this.othello.board[mid][mid - 1] = this.othello.BLACK;
    }

    isOnBoard(x, y) {
        return 0 <= x && x < this.othello.SIZE && 0 <= y && y < this.othello.SIZE;
    }

    getValidMoves(board, color) {
        const opponent = color === this.othello.WHITE ? this.othello.BLACK : this.othello.WHITE;
        const dirs = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];
        const moves = [];
        for (let x = 0; x < this.othello.SIZE; x++) {
            for (let y = 0; y < this.othello.SIZE; y++) {
                if (board[x][y] !== this.othello.EMPTY) continue;
                for (const [dx, dy] of dirs) {
                    let nx = x + dx, ny = y + dy;
                    let found = false;
                    while (this.isOnBoard(nx, ny) && board[nx][ny] === opponent) {
                        nx += dx; ny += dy; found = true;
                    }
                    if (found && this.isOnBoard(nx, ny) && board[nx][ny] === color) {
                        moves.push([x, y]);
                        break;
                    }
                }
            }
        }
        return moves;
    }

    applyMove(board, x, y, color) {
        const opponent = color === this.othello.WHITE ? this.othello.BLACK : this.othello.WHITE;
        const dirs = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];
        board[x][y] = color;
        for (const [dx, dy] of dirs) {
            let nx = x + dx, ny = y + dy;
            const path = [];
            while (this.isOnBoard(nx, ny) && board[nx][ny] === opponent) {
                path.push([nx, ny]);
                nx += dx; ny += dy;
            }
            if (this.isOnBoard(nx, ny) && board[nx][ny] === color) {
                for (const [px, py] of path) {
                    board[px][py] = color;
                }
            }
        }
    }

    countPieces(board) {
        let w = 0, b = 0;
        for (const row of board) {
            for (const cell of row) {
                if (cell === this.othello.WHITE) w++;
                else if (cell === this.othello.BLACK) b++;
            }
        }
        return { w, b };
    }

    renderOthelloBoard() {
        const boardEl = this.othelloBoard;
        if (!boardEl) return;
        boardEl.innerHTML = '';

        const validMoves = this.getValidMoves(this.othello.board, this.othello.turn);
        const validSet = new Set(validMoves.map(([x, y]) => `${x},${y}`));

        for (let x = 0; x < this.othello.SIZE; x++) {
            for (let y = 0; y < this.othello.SIZE; y++) {
                const cell = document.createElement('div');
                cell.className = 'othello-cell';
                cell.dataset.x = String(x);
                cell.dataset.y = String(y);

                const vkey = `${x},${y}`;
                if (this.othello.turn === this.othello.WHITE && validSet.has(vkey)) {
                    cell.classList.add('valid');
                    cell.addEventListener('click', () => this.handleOthelloUserMove(x, y));
                }

                const piece = this.othello.board[x][y];
                if (piece === this.othello.WHITE || piece === this.othello.BLACK) {
                    const stone = document.createElement('div');
                    stone.className = `othello-piece ${piece === this.othello.WHITE ? 'white' : 'black'}`;
                    cell.appendChild(stone);
                }

                boardEl.appendChild(cell);
            }
        }

        // ターン表示
        const { w, b } = this.countPieces(this.othello.board);
        this.addBotMessage(`⚪${w} - ⚫${b}｜${this.othello.turn === 'W' ? this.userName + 'さんの番(⚪)' : 'わたしの番(⚫)'}`);

        // ユーザーに手がない場合は自動パス
        if (this.othello.turn === this.othello.WHITE && validMoves.length === 0) {
            this.addBotMessage('⚪ 打てる場所がないためパス！');
            this.othello.turn = this.othello.BLACK;
            setTimeout(() => this.botOthelloMove(), 600);
        }
        // ボットのターンに即時移行
        if (this.othello.turn === this.othello.BLACK) {
            setTimeout(() => this.botOthelloMove(), 600);
        }
    }

    handleOthelloUserMove(x, y) {
        const moves = this.getValidMoves(this.othello.board, this.othello.WHITE);
        if (!moves.some(([mx, my]) => mx === x && my === y)) return;
        this.applyMove(this.othello.board, x, y, this.othello.WHITE);
        this.othello.turn = this.othello.BLACK;
        this.renderOthelloBoard();
    }

    botOthelloMove() {
        const whiteMoves = this.getValidMoves(this.othello.board, this.othello.WHITE);
        const blackMoves = this.getValidMoves(this.othello.board, this.othello.BLACK);

        // 終局判定
        if (whiteMoves.length === 0 && blackMoves.length === 0) {
            this.finishOthello();
            return;
        }

        if (blackMoves.length === 0) {
            this.addBotMessage('⚫ 打てる場所がないためパス！');
            this.othello.turn = this.othello.WHITE;
            this.renderOthelloBoard();
            return;
        }

        const [x, y] = blackMoves[Math.floor(Math.random() * blackMoves.length)];
        this.addBotMessage(`🤖 わたし（⚫）は ${x}, ${y} に置きます。`);
        this.applyMove(this.othello.board, x, y, this.othello.BLACK);
        this.othello.turn = this.othello.WHITE;
        this.renderOthelloBoard();
    }

    finishOthello() {
        const { w, b } = this.countPieces(this.othello.board);
        this.addBotMessage(`結果: ⚪${w} - ⚫${b}`);
        this.othelloModal.style.display = 'none';
        if (w > b) {
            this.addBotMessage(`${this.userName}さんの勝ち！🏆`);
            this.gameResults.push('user');
        } else if (b > w) {
            this.addBotMessage('わたしの勝ち！🤖');
            this.gameResults.push('bot');
        } else {
            this.addBotMessage('引き分け！🤝');
            this.gameResults.push('draw');
        }
        this.nextGame();
    }

    handleJankenInput(input) {
        const validChoices = ["グー", "チョキ", "パー"];
        if (!validChoices.includes(input)) {
            this.addBotMessage("⚠️ 「グー」「チョキ」「パー」のいずれかで入力してください。");
            this.showJankenButtons();
            return;
        }
        
        const botChoice = validChoices[Math.floor(Math.random() * 3)];
        this.addBotMessage(`わたしは「${botChoice}」を出しました！`);

        // じゃんけん演出（勝ち:バースト、負け:スラッシュ、あいこ:シールド）
        
        if (input === botChoice) {
            this.addBotMessage("あいこです！もう一度！");
            this.showShield();
        } else if (
            (input === "グー" && botChoice === "チョキ") ||
            (input === "チョキ" && botChoice === "パー") ||
            (input === "パー" && botChoice === "グー")
        ) {
            this.addBotMessage(`${this.userName}さんの勝ち！🎉`);
            this.jankenData.userPoints++;
            this.showBurst();
        } else {
            this.addBotMessage("わたしの勝ち！🤖");
            this.jankenData.botPoints++;
            this.showSlash();
        }
        
        this.addBotMessage(`現在の得点: ${this.userName}さん ${this.jankenData.userPoints}点 | わたし ${this.jankenData.botPoints}点`);
        
        if (this.jankenData.userPoints >= 2 || this.jankenData.botPoints >= 2) {
            this.clearQuickActions();
            this.endJanken();
        } else {
            this.showJankenButtons();
        }
    }
    
    endJanken() {
        this.addBotMessage("--- じゃんけん結果 ---");
        this.addBotMessage(`${this.userName}さんの最終得点：${this.jankenData.userPoints}点`);
        this.addBotMessage(`わたしの最終得点：${this.jankenData.botPoints}点`);
        
        if (this.jankenData.userPoints > this.jankenData.botPoints) {
            this.addBotMessage(`${this.userName}さんのじゃんけん勝利です！🏆`);
            this.gameResults.push("user");
        } else {
            this.addBotMessage("わたしのじゃんけん勝利です！🤖");
            this.gameResults.push("bot");
        }
        
        this.nextGame();
    }
    
    startHighLow() {
        this.addBotMessage("--- HIGH & LOWが選ばれました ---");
        this.addBotMessage("ルールを説明します。今回プレイする HIGH & LOW は普通のものとは少し違います");
        this.addBotMessage(`まず、私はディーラーです。${this.userName}さんは宣言側です。`);
        this.addBotMessage("ルール１：1 ~ 13までの数字がランダムに6枚選ばれます（重複無し）。最初のカードが出され、残りの5枚で勝負します。よって、5回宣言する必要があります。");
        this.addBotMessage("ルール２：最初に1枚目のカードが場に出るので、次のカードが1枚目のカードよりも大きい(HIGH)か小さい(LOW)か当ててください。的中できたら1ポイント獲得です。外した場合はディーラーに得点が入ります。");
        this.addBotMessage("ルール３：宣言は下のボタンから HIGH(大きい) または LOW(小さい) を選んでください。");
        this.addBotMessage("ルール４：最終的にポイントの多さで勝敗を決めます。");
        this.addBotMessage("それでは、ゲームを始めましょう！！");
        this.addBotMessage("準備ができたら『開始』ボタンを押してください。");
        
        this.currentStep = 'highlow_preparation';
        this.disableInput();
        this.setQuickActions([
            { label: '開始', onClick: () => { this.clearQuickActions(); this.startHighLowGame(); } }
        ]);
    }
    
    handleHighLowPreparation(input) {
        if (input === 'Y') {
            this.startHighLowGame();
        } else {
            this.addBotMessage("「Y」以外は入力しないでください。");
            this.enableInput();
        }
    }
    
    startHighLowGame() {
        this.highLowData = {
            userPoint: 0,
            botPoint: 0,
            cards: this.generateRandomCards(6),
            currentCard: null,
            round: 1
        };
        
        this.highLowData.currentCard = this.highLowData.cards[0];
        this.addBotMessage(`最初のカード: ${this.highLowData.currentCard} 🃏`);
        this.currentStep = 'highlow_input';
        this.disableInput();
        this.showHighLowChoiceButtons();
    }
    
    generateRandomCards(count) {
        const cards = [];
        while (cards.length < count) {
            const card = Math.floor(Math.random() * 13) + 1;
            if (!cards.includes(card)) {
                cards.push(card);
            }
        }
        return cards;
    }
    
    handleHighLowInput(input) {
        if (input !== 'h' && input !== 'l') {
            this.addBotMessage("⚠️ 「h」または「l」のいずれかで入力してください。");
            this.showHighLowChoiceButtons();
            return;
        }
        
        const nextCard = this.highLowData.cards[this.highLowData.round];
        this.addBotMessage(`--- ${this.highLowData.round}回戦 ---`);
        this.addBotMessage(`現在のカード: ${this.highLowData.currentCard}`);
        // カードをめくる演出
        this.revealCard(nextCard);
        this.addBotMessage(`次のカードは... ${nextCard} でした！`);
        
        let isCorrect = false;
        if (input === "h" && nextCard > this.highLowData.currentCard) {
            isCorrect = true;
        } else if (input === "l" && nextCard < this.highLowData.currentCard) {
            isCorrect = true;
        }
        
        if (nextCard === this.highLowData.currentCard) {
            this.addBotMessage("同じ数字でした！引き分けです。ポイントは入りません。");
            this.revealCard(nextCard, 'draw');
        } else if (isCorrect) {
            this.addBotMessage("🎉 正解！ポイントゲット！！");
            this.highLowData.userPoint++;
            this.showBurst();
        } else {
            this.addBotMessage("残念！不正解...");
            this.highLowData.botPoint++;
            this.showSlash();
        }
        
        this.addBotMessage(`現在の得点: ${this.userName}さん ${this.highLowData.userPoint}点 | わたし ${this.highLowData.botPoint}点`);
        this.highLowData.currentCard = nextCard;
        this.highLowData.round++;
        
        if (this.highLowData.round > 5) {
            this.clearQuickActions();
            this.endHighLow();
        } else {
            this.showHighLowChoiceButtons();
        }
    }
    
    endHighLow() {
        this.addBotMessage("--- HIGH & LOW 結果 ---");
        this.addBotMessage(`${this.userName}さんの最終得点：${this.highLowData.userPoint}点`);
        this.addBotMessage(`わたしの最終得点：${this.highLowData.botPoint}点`);
        
        if (this.highLowData.userPoint > this.highLowData.botPoint) {
            this.addBotMessage(`おめでとうございます！${this.userName}さんのHIGH & LOW勝利です！🏆`);
            this.gameResults.push("user");
        } else if (this.highLowData.botPoint > this.highLowData.userPoint) {
            this.addBotMessage("残念でした。わたしのHIGH & LOW勝利です！🤖");
            this.gameResults.push("bot");
        } else {
            this.addBotMessage("引き分けでした！");
            this.gameResults.push("draw");
        }
        
        this.nextGame();
    }
    
    startPokemonBattle() {
        this.addBotMessage("--- ポケモンバトルが選ばれました ---");
        this.addBotMessage("ポケモンを選んで、私とバトルしましょう！");
        
        this.showPokemonSelection();
    }
    
    showPokemonSelection() {
        this.pokemonModal.style.display = 'block';
        const pokemonOptions = document.getElementById('pokemonOptions');
        pokemonOptions.innerHTML = '';
        
        Object.entries(this.pokemonList).forEach(([name, pokemon], index) => {
            const card = document.createElement('div');
            card.className = 'pokemon-card';
            card.innerHTML = `
                <h3>${pokemon.name}</h3>
                <p>HP: ${pokemon.maxHp}, 攻撃力: ${pokemon.attack}, 防御: ${pokemon.defense}</p>
                <p>ワザ: [${pokemon.skillName}] - ${pokemon.skillEffect}</p>
            `;
            card.addEventListener('click', () => this.selectPokemon(name));
            pokemonOptions.appendChild(card);
        });
    }
    
    selectPokemon(pokemonName) {
        this.pokemonModal.style.display = 'none';
        this.playerPokemon = { ...this.pokemonList[pokemonName] };
        
        // ボットのポケモンを選択（プレイヤーと異なるもの）
        const availablePokemon = Object.keys(this.pokemonList).filter(name => name !== pokemonName);
        const botPokemonName = availablePokemon[Math.floor(Math.random() * availablePokemon.length)];
        this.botPokemon = { ...this.pokemonList[botPokemonName] };
        
        this.addBotMessage(`${this.userName}さんは [${this.playerPokemon.name}] を選びました！🎉`);
        this.addBotMessage(`ボットは [${this.botPokemon.name}] を出した！🤖`);
        
        this.startBattle();
    }
    
    startBattle() {
        this.battleData = {
            turn: 1,
            playerFirst: Math.random() < 0.5
        };
        
        this.addBotMessage("--- バトルスタート⚔️ ---");
        this.addBotMessage("---------------------------");
        
        if (this.battleData.playerFirst) {
            this.addBotMessage(`${this.userName}さんが先攻です！`);
        } else {
            this.addBotMessage("わたしが先攻です！");
        }
        
        this.nextBattleTurn();
    }
    
    nextBattleTurn() {
        if (this.playerPokemon.currentHp <= 0 || this.botPokemon.currentHp <= 0) {
            this.endBattle();
            return;
        }
        
        this.addBotMessage(`=== ターン ${this.battleData.turn} ===`);
        this.addBotMessage(`${this.userName}さんのポケモン: ${this.playerPokemon.name} HP: ${this.playerPokemon.currentHp}/${this.playerPokemon.maxHp}`);
        this.addBotMessage(`わたしのポケモン: ${this.botPokemon.name} HP: ${this.botPokemon.currentHp}/${this.botPokemon.maxHp}`);
        
        if (this.battleData.playerFirst) {
            this.playerTurn();
        } else {
            this.botTurn();
        }
    }
    
    playerTurn() {
        this.battleModal.style.display = 'block';
        const skillBtn = document.getElementById('skillBtn');
        if (this.playerPokemon.skillUsed) {
            skillBtn.textContent = "3: 特殊ワザ (使用済み)";
            skillBtn.disabled = true;
        } else {
            skillBtn.textContent = `3: 特殊ワザ [${this.playerPokemon.skillName}]`;
            skillBtn.disabled = false;
        }
    }
    
    handleBattleAction(action) {
        this.battleModal.style.display = 'none';
        
        switch (action) {
            case 'attack':
                this.playerAttack();
                break;
            case 'defend':
                this.playerDefend();
                break;
            case 'skill':
                this.playerUseSkill();
                break;
        }
        
        // ボットのターン
        setTimeout(() => {
            this.botTurn();
        }, 1000);
    }
    
    playerAttack() {
        const multiplier = this.playerPokemon.attackMultiplier || 1.0;
        const damage = Math.round(this.playerPokemon.attack * multiplier);
        this.botPokemon.currentHp -= Math.max(0, damage - this.botPokemon.defense / 2);
        if (this.botPokemon.currentHp < 0) this.botPokemon.currentHp = 0;
        
        this.addBotMessage(`[${this.playerPokemon.name}] の攻撃！`);
        this.addBotMessage(`[${this.botPokemon.name}] は ${damage} のダメージを受けた！`);
        this.addBotMessage(`残りHP: ${this.botPokemon.currentHp}`);
        // 攻撃演出
        this.showSlash();
        this.showSparks(5);
    }
    
    playerDefend() {
        this.addBotMessage(`[${this.playerPokemon.name}] は身を守っている！ガードアップ！⬆️`);
        this.playerPokemon.isDefending = true;
        this.showShield();
    }
    
    playerUseSkill() {
        this.addBotMessage(`[${this.playerPokemon.name}] はワザ [${this.playerPokemon.skillName}] を使用した！`);
        this.playerPokemon.skillUsed = true;
        
        switch (this.playerPokemon.skillName) {
            case "かえんほうしゃ":
                this.playerPokemon.attackMultiplier = 2.0;
                this.addBotMessage(`[${this.playerPokemon.name}] の炎が燃え上がった！🔥`);
                this.showBurst();
                break;
            case "ハイドロポンプ":
                this.botPokemon.currentHp -= 20;
                this.addBotMessage(`[${this.botPokemon.name}] に水しぶきが襲いかかる！💧`);
                this.showSparks(8);
                break;
            case "まもる":
                this.playerPokemon.isGuarding = true;
                this.addBotMessage(`[${this.playerPokemon.name}] は身を守った！次の攻撃は半減だ！🛡️`);
                this.showShield();
                break;
            case "10万ボルト":
                this.playerPokemon.attackMultiplier = 1.5;
                this.addBotMessage(`[${this.playerPokemon.name}] の電気が走り出す！⚡`);
                this.showSparks(12);
                break;
            case "かなしばり":
                this.botPokemon.isDisabled = true;
                this.addBotMessage(`[${this.botPokemon.name}] はかなしばりで動けなくなった！😵`);
                this.showSlash();
                break;
        }
    }
    
    botTurn() {
        if (this.botPokemon.isDisabled) {
            this.addBotMessage(`[${this.botPokemon.name}] はかなしばりで動けない！😵`);
            this.botPokemon.isDisabled = false;
        } else {
            const actions = ['attack', 'defend'];
            if (!this.botPokemon.skillUsed) actions.push('skill');
            
            const action = actions[Math.floor(Math.random() * actions.length)];
            
            switch (action) {
                case 'attack':
                    this.botAttack();
                    break;
                case 'defend':
                    this.botDefend();
                    break;
                case 'skill':
                    this.botUseSkill();
                    break;
            }
        }
        
        this.battleData.turn++;
        setTimeout(() => {
            this.nextBattleTurn();
        }, 1000);
    }
    
    botAttack() {
        const multiplier = this.botPokemon.attackMultiplier || 1.0;
        const damage = Math.round(this.botPokemon.attack * multiplier);
        let effectiveDamage = damage;
        
        if (this.playerPokemon.isDefending || this.playerPokemon.isGuarding) {
            this.addBotMessage(`${this.playerPokemon.name} は防御している！ダメージが半減された！`);
            effectiveDamage = Math.floor(damage * 0.5);
            this.playerPokemon.isDefending = false;
            this.playerPokemon.isGuarding = false;
            this.showShield();
        }
        
        effectiveDamage = Math.max(0, effectiveDamage - this.playerPokemon.defense / 2);
        this.playerPokemon.currentHp -= effectiveDamage;
        if (this.playerPokemon.currentHp < 0) this.playerPokemon.currentHp = 0;
        
        this.addBotMessage(`[${this.botPokemon.name}] の攻撃！`);
        this.addBotMessage(`${this.playerPokemon.name} は ${effectiveDamage} のダメージを受けた！`);
        this.addBotMessage(`残りHP: ${this.playerPokemon.currentHp}`);
        this.showSlash();
    }
    
    botDefend() {
        this.addBotMessage(`[${this.botPokemon.name}] は身を守っている！ガードアップ！⬆️`);
        this.botPokemon.isDefending = true;
        this.showShield();
    }
    
    botUseSkill() {
        this.addBotMessage(`[${this.botPokemon.name}] はワザ [${this.botPokemon.skillName}] を使用した！`);
        this.botPokemon.skillUsed = true;
        
        switch (this.botPokemon.skillName) {
            case "かえんほうしゃ":
                this.botPokemon.attackMultiplier = 2.0;
                this.addBotMessage(`[${this.botPokemon.name}] の炎が燃え上がった！🔥`);
                this.showBurst();
                break;
            case "ハイドロポンプ":
                this.playerPokemon.currentHp -= 20;
                this.addBotMessage(`[${this.playerPokemon.name}] に水しぶきが襲いかかる！💧`);
                this.showSparks(8);
                break;
            case "まもる":
                this.botPokemon.isGuarding = true;
                this.addBotMessage(`[${this.botPokemon.name}] は身を守った！次の攻撃は半減だ！🛡️`);
                this.showShield();
                break;
            case "10万ボルト":
                this.botPokemon.attackMultiplier = 1.5;
                this.addBotMessage(`[${this.botPokemon.name}] の電気が走り出す！⚡`);
                this.showSparks(12);
                break;
            case "かなしばり":
                this.playerPokemon.isDisabled = true;
                this.addBotMessage(`[${this.playerPokemon.name}] はかなしばりで動けなくなった！😵`);
                this.showSlash();
                break;
        }
    }
    
    endBattle() {
        this.addBotMessage("--- バトル終了！ ---");
        this.addBotMessage("---------------------");
        
        if (this.playerPokemon.currentHp <= 0) {
            this.addBotMessage(`${this.userName}さんの [${this.playerPokemon.name}] は倒れた！😵`);
            this.addBotMessage(`わたしの [${this.botPokemon.name}] の勝利！🏆`);
            this.gameResults.push("bot");
        } else {
            this.addBotMessage(`わたしの [${this.botPokemon.name}] は倒れた！😵`);
            this.addBotMessage(`${this.userName}さんの [${this.playerPokemon.name}] の勝利！おめでとう！🎉`);
            this.gameResults.push("user");
        }
        
        this.nextGame();
    }
    
    // HIGH & LOW 選択ボタン表示
    showHighLowChoiceButtons() {
        this.setQuickActions([
            { label: 'HIGH', onClick: () => { this.clearQuickActions(); this.handleHighLowInput('h'); } },
            { label: 'LOW', onClick: () => { this.clearQuickActions(); this.handleHighLowInput('l'); } }
        ]);
    }

    nextGame() {
        this.currentGame++;
        
        if (this.currentGame <= 3) {
            this.addBotMessage(`--- 第${this.currentGame}回戦 ---`);
            this.addBotMessage(`${this.userName}さん、ゲームを選んでください。`);
            // 入力ではなくモーダルで選択
            this.gameModal.style.display = 'block';
        } else {
            this.showFinalResults();
        }
    }
    
    showFinalResults() {
        this.userVictoryCount = this.gameResults.filter(result => result === 'user').length;
        this.botVictoryCount = this.gameResults.filter(result => result === 'bot').length;
        
        this.addBotMessage("--- ゲーム終了！結果発表 ---");
        this.addBotMessage(`${this.userName}さん ${this.userVictoryCount}勝 : わたし ${this.botVictoryCount}勝`);
        
        if (this.userVictoryCount > this.botVictoryCount) {
            this.addBotMessage(`おめでとうございます！🎊 ${this.userName}さんの勝利です！！`);
        } else if (this.botVictoryCount > this.userVictoryCount) {
            this.addBotMessage("残念でした！今回はわたしの勝ちでした！🤖");
        } else {
            this.addBotMessage("引き分けですね！どちらも素晴らしい戦いでした！👏");
        }
        
        this.addBotMessage("今日のゲームはここまでです。いかがでしたか？");
        this.addBotMessage("また遊んでくれると嬉しいです。それではまたね！👋");
    }
}

// ゲーム開始
document.addEventListener('DOMContentLoaded', () => {
    new ChatBotGame();
}); 