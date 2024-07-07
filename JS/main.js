const { Player, stringToDataUrl } = TextAliveApp;

const player = new Player({
    app: { token: "QwskYbYglQvovKNi" },
    mediaElement: document.querySelector("#media"),
    mediaBannerPosition: "bottom right",
});

const overlay = document.getElementById("overlay");
const lyricsContainer = document.getElementById("Lyric_Text");
const seekbar = document.getElementById("seekbar");
const paintedSeekbar = document.getElementById("painted_seekbar");
const playButton = document.getElementById("play");
const bar = document.getElementById("progress-bar");
const choose1 = document.getElementById("choose_1");
const choose2 = document.getElementById("choose_2");
const choose3 = document.getElementById("choose_3");
const judge = document.getElementById("judge");

const BPM = 194;
const BPM_MS = 309.28;
const ResetPhraseNum = [6.5, 8, 16, 25.5, 33, 41.5, 49, 57, 60, 66, 72.5, 74, 81.5, 89.5, 97.5, 103, 111, 116, 129, 145.5, 153.5, 161, 167]; //23Phrases
const correctScore = 10;

let flag_1 = false;
let currentChar = null;
let currentPhrase = null;
let phrases = null;
let phraseIndex = 0;
let phrasePoint = 0;
let previousPhrasePoint = 0;
let score = 0;

// 前回のクイズの答えを保存するための変数
let previousAnswer = "";

console.log("init");

player.addListener({
    onAppReady(app) {
        console.log("１");
        if (app.managed) {
            document.querySelector("#control").className = "disabled";
        }
        if (!app.songUrl) {
            document.querySelector("#media").className = "disabled";
            player.createFromSongUrl("https://piapro.jp/t/--OD/20240202150903");
        }
        console.log("２");
        console.log(app.songUrl);
        console.log(app.managed);
    },

    onAppMediaChange() {
        overlay.className = "";
        resetAll();
    },

    onVideoReady(video) {
        document.querySelector("#artist span").textContent = player.data.song.artist.name;
        document.querySelector("#song span").textContent = player.data.song.name;
        phrases = player.video.firstChar.parent.parent.children;
    },

    onTimerReady() {
        document.getElementById("overlay_text").innerHTML = "COMPLETE";
        overlay.className = "disabled";
        document.querySelector("#control > button#play").className = "";
        document.querySelector("#control > button#stop").className = "";
    },

    onTimeUpdate(position) {
        if (!flag_1) {
            resetChars();
            newQuiz(phrasePoint);
            document.getElementById("ontei").innerHTML = "<img src='quiz_image/first.png' id='ontei_img'/>";
            flag_1 = true;
        }

        const phraseTime = phrasePoint === 0
            ? ResetPhraseNum[phrasePoint] * BPM_MS
            : (ResetPhraseNum[phrasePoint] - ResetPhraseNum[phrasePoint - 1]) * BPM_MS;

        console.log(`Phrase:${phrasePoint} Time:${phraseTime}`);

        const beat = Math.floor(position / BPM_MS) + 1;
        const part = beat / 4;

        if (part === ResetPhraseNum[phrasePoint]) {
            phrasePoint++;
            resetChars();
            newQuiz(phrasePoint);
            console.log(phrasePoint);
        } else if (phrasePoint >= 22) {
            document.getElementById('quiz_overlay').className = 'block';
            document.getElementById('quiz_overlay').innerHTML = 'RESULT';
            judge.innerHTML = result(score);
        }

        if (phrasePoint > 0) {
            const previousPhraseTime = ResetPhraseNum[previousPhrasePoint] * BPM_MS * 4;
            const currentPhraseTime = ResetPhraseNum[phrasePoint] * BPM_MS * 4;
            const elapsedTime = position - previousPhraseTime;
            const totalTime = currentPhraseTime - previousPhraseTime;
            bar.style.left = `${(elapsedTime / totalTime) * 100}%`;
        } else {
            bar.style.left = `${(position / (ResetPhraseNum[phrasePoint] * BPM_MS * 4)) * 100}%`;
        }

        previousPhrasePoint = phrasePoint - 1;
        paintedSeekbar.style.width = `${(position / player.video.duration) * 100}%`;

        let current = currentChar || player.video.firstChar;
        while (current && current.startTime < position + 500) {
            if (currentChar !== current) {
                newLyric(current);
                currentChar = current;
            }
            current = current.next;
        }
        console.log(`beat: ${beat}, part: ${part}, text: ${current}, phrase: ${phrasePoint}`);
    },
});

playButton.addEventListener("click", (e) => {
    e.preventDefault();
    if (player) {
        if (player.isPlaying) {
            player.requestPause();
            playButton.textContent = "▶️";
        } else {
            player.requestPlay();
            playButton.textContent = "II";
        }
    }
});

document.getElementById("stop").addEventListener("click", (e) => {
    e.preventDefault();
    if (player) {
        player.requestStop();
        playButton.textContent = "▶️";
        paintedSeekbar.style.width = `0%`;
        resetAll();
    }
});

function newLyric(current) {
    currentPhrase = phrases[phraseIndex];

    const classes = [];
    if (["N", "PN", "X"].includes(current.parent.pos)) {
        classes.push("noun");
    }

    if (current.parent.parent.lastChar === current) {
        classes.push("lastChar");
    }

    if (current.parent.language === "en") {
        if (current.parent.lastChar === current) {
            classes.push("lastCharInEnglishWord");
        } else if (current.parent.firstChar === current) {
            classes.push("firstCharInEnglishWord");
        }
    }

    const div = document.createElement("span");
    div.textContent = current.text;
    div.className = classes.join(" ");
    div.addEventListener("click", () => {
        player.requestMediaSeek(current.startTime);
    });
    div.setAttribute("id", "Lyric_Text");
    lyricsContainer.appendChild(div);
}

function newQuiz(phrasePoint) {
    const quizzes = {
        0: ["'quiz_image/0.png' id='Answer'", "'quiz_image/1.png' id='Not_Answer'", "'quiz_image/2.png' id='Not_Answer'"],
        1: ["'quiz_image/3.png' id='Answer'", "'quiz_image/4.png' id='Not_Answer'", "'quiz_image/5.png' id='Not_Answer'"],
        2: ["'quiz_image/6.png' id='Answer'", "'quiz_image/7.png' id='Not_Answer'", "'quiz_image/8.png' id='Not_Answer'"],
        3: ["'quiz_image/9.png' id='Answer'", "'quiz_image/10.png' id='Not_Answer'", "'quiz_image/11.png' id='Not_Answer'"],
        4: ["'quiz_image/12.png' id='Answer'", "'quiz_image/13.png' id='Not_Answer'", "'quiz_image/11.png' id='Not_Answer'"],
        5: ["'quiz_image/15.png' id='Answer'", "'quiz_image/16.png' id='Not_Answer'", "'quiz_image/17.png' id='Not_Answer'"],
        6: ["'quiz_image/18.png' id='Answer'", "'quiz_image/19.png' id='Not_Answer'", "'quiz_image/20.png' id='Not_Answer'"],
        7: ["'quiz_image/21.png' id='Answer'", "'quiz_image/22.png' id='Not_Answer'", "'quiz_image/23.png' id='Not_Answer'"],
        8: ["'quiz_image/24.png' id='Answer'", "'quiz_image/25.png' id='Not_Answer'", "'quiz_image/26.png' id='Not_Answer'"],
        9: ["'quiz_image/27.png' id='Answer'", "'quiz_image/28.png' id='Not_Answer'", "'quiz_image/29.png' id='Not_Answer'"],
        10: ["'quiz_image/30.png' id='Answer'", "'quiz_image/31.png' id='Not_Answer'", "'quiz_image/32.png' id='Not_Answer'"],
        11: ["'quiz_image/33.png' id='Answer'", "'quiz_image/34.png' id='Not_Answer'", "'quiz_image/35.png' id='Not_Answer'"],
        12: ["'quiz_image/36.png' id='Answer'", "'quiz_image/37.png' id='Not_Answer'", "'quiz_image/38.png' id='Not_Answer'"],
        13: ["'quiz_image/39.png' id='Answer'", "'quiz_image/40.png' id='Not_Answer'", "'quiz_image/41.png' id='Not_Answer'"],
        14: ["'quiz_image/42.png' id='Answer'", "'quiz_image/43.png' id='Not_Answer'", "'quiz_image/44.png' id='Not_Answer'"],
        15: ["'quiz_image/45.png' id='Answer'", "'quiz_image/46.png' id='Not_Answer'", "'quiz_image/47.png' id='Not_Answer'"],
        16: ["'quiz_image/48.png' id='Answer'", "'quiz_image/49.png' id='Not_Answer'", "'quiz_image/50.png' id='Not_Answer'"],
        17: ["'quiz_image/51.png' id='Answer'", "'quiz_image/52.png' id='Not_Answer'", "'quiz_image/53.png' id='Not_Answer'"],
        18: ["'quiz_image/54.png' id='Answer'", "'quiz_image/55.png' id='Not_Answer'", "'quiz_image/56.png' id='Not_Answer'"],
        19: ["'quiz_image/57.png' id='Answer'", "'quiz_image/58.png' id='Not_Answer'", "'quiz_image/59.png' id='Not_Answer'"],
        20: ["'quiz_image/60.png' id='Answer'", "'quiz_image/61.png' id='Not_Answer'", "'quiz_image/62.png' id='Not_Answer'"],
        21: ["'quiz_image/63.png' id='Answer'", "'quiz_image/64.png' id='Not_Answer'", "'quiz_image/65.png' id='Not_Answer'"]
    };

    // 新しいクイズを生成する前に前回のクイズの答えを表示
    if (previousAnswer) {
        document.getElementById("ontei").innerHTML = `<img src=${previousAnswer} id='ontei_img'/>`;
    }


    // クイズの選択肢を設定
    if (quizzes[phrasePoint]) {
        const options = quizzes[phrasePoint];
        options.sort(() => Math.random() - 0.5);
        choose1.innerHTML = `<img src=${options[0]} />`;
        choose2.innerHTML = `<img src=${options[1]} />`;
        choose3.innerHTML = `<img src=${options[2]} />`;

        // 現在の答えを保存
        previousAnswer = options.find(option => option.includes("id='Answer'"));
    }
}

function checkAnswer(playerChoose) {
    if (document.getElementById(`choose_${playerChoose}`).querySelector("[id='Answer']") !== null) {
        judge.innerHTML = "<h1 id='Correct'>正解！</h1>"
        return true;
    } else {
        judge.innerHTML = "<h1 id='Uncorrect'>はずれ！</h1>"
        return false;
    }
}

function f_choose1() {
    if (choose1.className !== 'disabled') {
        if (checkAnswer(1)) {
            score += correctScore;
            document.getElementById('score').innerHTML = `完成度: ${score}%`;
        }
        choose1.className = 'disabled';
        choose2.className = 'disabled';
        choose3.className = 'disabled';
        document.getElementById('quiz_overlay').className = 'block';
        document.getElementById('quiz_overlay').innerHTML = '選択済み';

    }
}

function f_choose2() {
    if (choose2.className !== 'disabled') {
        if (checkAnswer(2)) {
            score += correctScore;
            document.getElementById('score').innerHTML = `完成度: ${score}%`;
        }
        choose1.className = 'disabled';
        choose2.className = 'disabled';
        choose3.className = 'disabled';
        document.getElementById('quiz_overlay').className = 'block';
        document.getElementById('quiz_overlay').innerHTML = '選択済み';

    }
}

function f_choose3() {
    if (choose3.className !== 'disabled') {
        if (checkAnswer(3)) {
            score += correctScore;
            document.getElementById('score').innerHTML = `完成度: ${score}%    `;
        }
        choose1.className = 'disabled';
        choose2.className = 'disabled';
        choose3.className = 'disabled';
        document.getElementById('quiz_overlay').className = 'block';
        document.getElementById('quiz_overlay').innerHTML = '選択済み';

    }
}

function resetAll() {
    resetChars();
    currentChar = null;
    phrasePoint = 0;
    flag_1 = false;
    score = 0;
    previousAnswer = "";
    lyricsContainer.innerHTML = "";
    currentPhrase = null;
    document.getElementById("ontei").innerHTML = '';
    choose1.innerHTML = ``;
    choose2.innerHTML = ``;
    choose3.innerHTML = ``;
    choose1.className = '';
    choose2.className = '';
    choose3.className = '';
    document.getElementById('quiz_overlay').className = 'block';
    document.getElementById('score').innerHTML = `完成度: ${score}%`;

}

function resetChars() {
    lyricsContainer.innerHTML = "";
    currentPhrase = null;
    document.getElementById("ontei").innerHTML = ``;
    choose1.innerHTML = ``;
    choose2.innerHTML = ``;
    choose3.innerHTML = ``;
    choose1.className = '';
    choose2.className = '';
    choose3.className = '';
    document.getElementById('quiz_overlay').className = '';
    judge.innerHTML = ""


}

document.getElementById("close").addEventListener("click", () => {
    window.close();
});

function open_instraction() {
    document.getElementById("close_instraction").className = "";
    overlay.className = "instraction";
    document.getElementById("overlay_text").innerHTML = "<h1>説明</h1><h3>この度はこのやり込みゲーをしてくださりありがとうございます。<br>このゲームは次のフレーズのメロディを下の三択から選ぶゲームです。<br><br>青色の音程バーは右のピアノ通りで、<br>ピンク色の音程バーはピアノの1オクターブ上を指しています。<br>正解を選ぶと左上の完成度が上がっていきます。<br><br>前半は間違いの選択肢にノイズがかかっていたりはみ出したりしていますが、<br>後半になるにつれそれらが少なくなり難しくなっていきます。<br><br>ヒントとしましては、選択肢の天井に音程バーが有るものは選ばないほうがいいでしょう。<br><br>※所見の方は一度通してこの素晴らしすぎる楽曲を聞くことを強くおすすめします。</h3>";
}

function close_instraction() {
    document.getElementById("close_instraction").className = "disabled";
    overlay.className = "disabled";
}

function result(score) {
    if (score < 50) {
        return "<h1 id='rank_c'>RANK:C</h1>";
    } else if (score < 100) {
        return "<h1 id='rank_b'>RANK:B</h1>";
    } else if (score < 200) {
        return "<h1 id='rank_a'>RANK:A</h1>";
    } else if (score < 220) {
        return "<h1 id='rank_s'>RANK:S</h1>";
    } else {
        return "<h1 id='rank_p'>PERFECT!!!</h1>";
    }

}