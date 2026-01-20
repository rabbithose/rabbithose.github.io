// カメラ関係
var modecam = "stop"
let camMode = "environment"
const cameraInit = () => {
    const video = document.getElementById("camera1");

    const cameraSetting = {
        audio: false,
        video: { facingMode: camMode }
    }
    
    document.getElementById("number0").textContent = "CAM setup";
    navigator.mediaDevices.getUserMedia(cameraSetting)
        .then((mediaStream) => {
            video.srcObject = mediaStream;
            modecam = "move"
            document.getElementById("number0").textContent = "CAM OK";
        })
        .catch((err) => {
            document.getElementById("number0").textContent = "CAM NO";
            console.log(err.toString());
        });
}
function change_camera(){
    if(camMode == "user"){
        camMode = "environment";
    }else{
        camMode = "user";
    }
    cameraInit()
    console.log(camMode)
}
// AI関係
var detector;
let mode = 0;
let letters = "";
// 便利系
function arctan(l1, l2) {
    return ((Math.atan2(l1["y"] - l2["y"], l1["x"] - l2["x"]) * 180) / Math.PI) * -1;
}

function write_letter() {
    let mode_word = mode;
    if (mode == 0 || mode ==1) {
        mode_word = "からだをうつしてチェック!!";
    }else if (mode == 2 || mode == 3) {
        mode_word = "結果発表!!";
    }
    document.getElementById("mode").textContent = mode_word;
}

function advice(shoulderTrend, hipTrend){
  if (shoulderTrend==="悪化")
    return "肩の力を抜いて、\n視線を遠くへ"
  if (hipTrend==="悪化")
    return "腰を立て、\n足裏で地面を感じよう"
  if (shoulderTrend==="改善" && hipTrend==="改善")
    return "良い感覚です。\nこの姿勢をキープ！"
  return "呼吸と歩幅を\n一定に保ちましょう"
}


function detect_skill(data){
    return 0
}

function calcStats(arr){
    const avg = arr.reduce((a,b)=>a+b,0)/arr.length
    const variance = arr.reduce((a,b)=>a+(b-avg)**2,0)/arr.length
    return { avg: avg, std: Math.sqrt(variance) }
}
function avg(arr){
  return arr.reduce((a,b)=>a+b,0)/arr.length
}

function absAvg(arr){
  return avg(arr.map(v => Math.abs(v)))
}
function splitPhases(arr){
  const n = arr.length
  return {
    early: arr.slice(0, Math.floor(n/3)),
    mid:   arr.slice(Math.floor(n/3), Math.floor(2*n/3)),
    late:  arr.slice(Math.floor(2*n/3))
  }
}
function trendScore(early, mid, late){
  const e = absAvg(early)
  const m = absAvg(mid)
  const l = absAvg(late)

  if (l < e*0.8) return "改善"
  if (l > e*1.2) return "悪化"
  return "安定"
}

function abstractWord(shoulderTrend, hipTrend){
  if (shoulderTrend==="改善" && hipTrend==="改善") return "軸が通った登り"
  if (shoulderTrend==="改善") return "身体が目覚めた"
  if (shoulderTrend==="悪化" || hipTrend==="悪化") return "疲れが姿勢に出た"
  return "安定したフォーム"
}

const TITLES = [
  {
    name: "ベーデン・パウエル級",
    minScore: 85,
    condition: (sTrend, hTrend) =>
      sTrend !== "悪化" && hTrend !== "悪化",
    img: "/img/title_bp.png"
  },
  {
    name: "熟練ハイカー",
    minScore: 70,
    condition: () => true,
    img: "/img/title_expert.png"
  },
  {
    name: "安定した登り手",
    minScore: 55,
    condition: () => true,
    img: "/img/title_stable.png"
  },
  {
    name: "がんばり屋ビギナー",
    minScore: 0,
    condition: () => true,
    img: "/img/title_beginner.png"
  }
]
function decideTitle(score, sTrend, hTrend){
  for (let t of TITLES){
    if (score >= t.minScore && t.condition(sTrend, hTrend)){
      return t
    }
  }
  return TITLES[TITLES.length - 1]
}


// ---------------p5.js--------------------------------------

let result = document.getElementById("p5")
let datas = []
let HEIGHT, WIDTH
let BP_img
let titleImages = {}
let taiko
let seikai
let huseikai
let bgm
function preload() {
    titleImages["ベーデン・パウエル級"] = loadImage("./img/bp_new_01.png")
    titleImages["熟練ハイカー"] = loadImage("./img/yukiyama_tozan.png")
    titleImages["安定した登り手"] = loadImage("./img/tozan_fuku_woman.png")
    titleImages["がんばり屋ビギナー"] = loadImage("./img/animal_dance_rabbit.png")
    BP_img = loadImage("./img/bp_new_01.png");
    taiko = loadSound("./sound/和太鼓でドドン.mp3")
    seikai = loadSound("./sound/nc1281.wav")
    bgm = loadSound("./sound/System_Reserve.mp3")
    
}
async function setup() {
    bgm.loop(0,1,0.25,0,600)
    
    await cameraInit()
    document.getElementById("mode").textContent = "now loading...";
    document.getElementById("number1").textContent = "AI Setup...";
    
    try {
    detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet
    );
    document.getElementById("number1").textContent = "AI OK";
    
    } catch(error){
        document.getElementById("number1").textContent = "AI NO";
        console.error("AIの読み込みに失敗しました")
    }
    const videoElement = document.getElementById("camera1");
    HEIGHT = videoElement.videoHeight
    WIDTH = videoElement.videoWidth
    let canvas = createCanvas(WIDTH, HEIGHT)
    
    canvas.parent(result)
    initChart();
}
let Det_Count = 15
let frameCount = 0
let shoulder_deg, hip_deg = 0
let shoulder_abs, hip_abs = 0
let shoulder_degs = []
let hip_degs = []
let second = 0
let score = 0

let all_data = {}
let all_shoulder_degs = []
let all_hip_degs = []

async function draw() {
    write_letter()
    background(0,255,255)
    stroke(0)
    fill(0)
    rect(5,5,WIDTH-10, HEIGHT-10)
    if (mode == 0){
        stroke(0,255,255)
        fill(0,255,255)
        textAlign(CENTER, CENTER);
        textSize(50)
        text("クリックしてスタート",WIDTH/2,HEIGHT/2)
        const video = document.getElementById("camera1");
        const poses = await detector.estimatePoses(video);
        document.getElementById("number2").textContent = poses.length+"人";
        
    } else if (modecam == "move" && mode == 1) {
        for (let i=0 ; i<HEIGHT/10 ; i++){
            stroke(0,10*((frameCount/10+i)%10+10),0)
            line(5,i*(HEIGHT/10)+HEIGHT/20,WIDTH-10,i*(HEIGHT/10)+HEIGHT/20)
        }
        const video = document.getElementById("camera1");
        const poses = await detector.estimatePoses(video);
        let idx = 0
        document.getElementById("number2").textContent = poses.length+"人";
        for (let data of poses) {
            idx += 1
            data = data["keypoints"]
            for (i of data){
                ellipse(i["x"], i["y"], 10, 10)
            }
            // 0:nose, 1:left eye, 2:right eye, 3:left ear, 4:right ear, 5:left shoulder, 6:right shoulder, 7:left elbow, 8:right elbow, 9:left wrist, 10:right wrist,
            // 11:left hip, 12:right hip, 13:left knee, 14:right knee, 15:left ankle, 16:right ankle
            // 接続するキーポイントの組
            const kp_links = [
                    [0,1],[0,2],[1,3],[2,4],[0,5],[0,6],[5,6],[5,7],[7,9],[6,8],
                    [8,10],[11,12],[5,11],[11,13],[13,15],[6,12],[12,14],[14,16]
                ]
            for (let kp_idx of kp_links) {
                stroke(255, 0, 0)
                let kp_1 = data[kp_idx[0]]
                let kp_2 = data[kp_idx[1]]
                if (kp_idx[0] > 10 && kp_idx[1] > 10) {
                    stroke(0, 255, 0)
                } else if(kp_idx[0] <= 6 && kp_idx[1] <= 6) {
                    stroke(0, 0, 255)
                }
                line(kp_1["x"], kp_1["y"], kp_2["x"], kp_2["y"])
            }
            shoulder_deg = arctan(data[5], data[6])
            hip_deg = arctan(data[11], data[12])
            
            all_hip_degs.push(hip_deg)
            all_shoulder_degs.push(shoulder_deg)
            
            // グラフ描画
            if (frameCount % 10 === 0) updateChart(second, shoulder_deg, hip_deg);
            // honntoha +=
            shoulder_degs[second]=shoulder_deg/60
            hip_degs[second]=hip_deg/60
            
        }
        stroke(0,255,255)
        fill(0,255,255)
        textSize(32)
        if (frameCount%60 == 0 && Det_Count>0){
            second+=1
            Det_Count -= 1
            document.getElementById("number3").textContent = Det_Count+"秒"
        }
        if(Det_Count==0){
            mode = 2
            frameCount = 0
            seikai.play(0,1,2.5,0,600)
        }
        
        fill(0, 255, 0)
        // time.sleep(0.4)
    } else if (mode==2){
        stroke(0,255,255)
        fill(0,255,255)
        textAlign(CENTER, CENTER);
        textSize(64)
        text("リザルト",WIDTH/2,50)
        textSize(32)
        
        score =  100
        
        all_data["shoulder_degs"]= all_shoulder_degs 
        all_data["hip_degs"]=all_hip_degs
        let shoulder = calcStats(shoulder_degs)
        let hip = calcStats(hip_degs)
        // all_data["shoulder_avg"]= shoulder.avg
        // all_data["hip_avg"]= shoulder.avg
        // all_data["shoulder_std"]= shoulder.std
        // all_data["hip_std"]= shoulder.std
        

        score -= shoulder.avg * 100
        score -= hip.avg * 100
        score -= shoulder.std * 100
        score -= hip.std * 100
        const sPhase = splitPhases(shoulder_degs)
        const hPhase = splitPhases(hip_degs)
        const sTrend = trendScore(sPhase.early, sPhase.mid, sPhase.late)
        const hTrend = trendScore(hPhase.early, hPhase.mid, hPhase.late)
        // score = constrain(score, 0, 100)
        const title = decideTitle(score, sTrend, hTrend)
        const titleImg = titleImages[title.name]

        textSize(36)
        text("称号：" + title.name, WIDTH/2, 150)

        image(
        titleImg,
        (WIDTH - titleImg.width/2) / 2,
        260,
        titleImg.width / 2,
        titleImg.height / 2
        )

        const all_data_string = JSON.stringify(all_data)
        console.log(all_data_string)
        // if (frameCount%360>50) text("スコア:"+score,WIDTH/2,150)
        // if (frameCount%360>100) {
        //     text("あなたのスキル:ベーデンパウエル級",WIDTH/2,200)
        //     image(BP_img, (WIDTH-BP_img.width/2)/2,250,BP_img.width/2,BP_img.height/2)
            
        // }
        if (frameCount%360>=359) mode = 3
        if (frameCount>=3599) mode = 0
        if(mode == 2 && frameCount === 2){
            // all_data に統計値を追加
            let shoulder = calcStats(shoulder_degs);
            let hip = calcStats(hip_degs);

            all_data.shoulder_avg = shoulder.avg;
            all_data.shoulder_std = shoulder.std;
            all_data.shoulder_trend = trendScore(...Object.values(splitPhases(shoulder_degs)));
            all_data.hip_avg = hip.avg;
            all_data.hip_std = hip.std;
            all_data.hip_trend = trendScore(...Object.values(splitPhases(hip_degs)));

            // DOM に統計値を表示
            document.getElementById("s_avg").textContent = all_data.shoulder_avg.toFixed(2);
            document.getElementById("s_std").textContent = all_data.shoulder_std.toFixed(2);
            document.getElementById("s_trend").textContent = all_data.shoulder_trend;

            document.getElementById("h_avg").textContent = all_data.hip_avg.toFixed(2);
            document.getElementById("h_std").textContent = all_data.hip_std.toFixed(2);
            document.getElementById("h_trend").textContent = all_data.hip_trend;

            
        }
     }else if (mode == 3){
        score =  100
        let shoulder = calcStats(shoulder_degs)
        let hip = calcStats(hip_degs)
        
        score -= shoulder.avg * 100
        score -= hip.avg * 100
        score -= shoulder.std * 100
        score -= hip.std * 100

        const sPhase = splitPhases(shoulder_degs)
        const hPhase = splitPhases(hip_degs)

        const sTrend = trendScore(sPhase.early, sPhase.mid, sPhase.late)
        const hTrend = trendScore(hPhase.early, hPhase.mid, hPhase.late)

        const word = abstractWord(sTrend, hTrend)
        const tip  = advice(sTrend, hTrend)

        stroke(0,255,255)
        fill(0,255,255)
        textAlign(CENTER, CENTER);
        textSize(64)
        text("リザルト",WIDTH/2,50)
        textSize(32)

        

        if (frameCount%360>50) text("スコア:"+score,WIDTH/2,150)
        if (frameCount%360>100) text("姿勢評価："+word, WIDTH/2, 210)
        if (frameCount%360>150)  text("アドバイス："+tip, WIDTH/2, 290)
            
        
        if (frameCount%360>=359) mode = 2
        if (frameCount>=3599) mode = 0
    } else {
        console.log("wait");
    }
    frameCount+=1
    frameCount%=3600
}

function mouseClicked(){
  if (mode == 0){
    Det_Count = 15
    frameCount = 0
    shoulder_deg, hip_deg = 0
    mode = 1
    shoulder_degs, hip_degs = [],[]
    score = 0
    resetChartData();
    taiko.play()
  } else if ( mode==2 || mode==3){
    mode = 0
  }
}
let chartInstance = null;

function initChart() {
  const ctx = document.getElementById("chart").getContext("2d");
  if (chartInstance) chartInstance = null;
  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],  // フレーム番号
      datasets: [
        {
          label: "肩",
          data: [],
          borderColor: "red",
          fill: false,
          tension: 0.3
        },
        {
          label: "腰",
          data: [],
          borderColor: "green",
          fill: false,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "top" } },
      animation: { duration: 0 },  // リアルタイム更新用
      scales: {
        y: { title: { display: true, text: "角度(°)" }, min: -90, max: 90 },
        x: { title: { display: true, text: "フレーム" } }
      }
    }
  });
}

// リアルタイム追加
function updateChart(frame, shoulder, hip) {
  if (!chartInstance) return;

  chartInstance.data.labels.push(frame);
  chartInstance.data.datasets[0].data.push(shoulder);
  chartInstance.data.datasets[1].data.push(hip);

  // データが多くなる場合は古いものを削除
  if(chartInstance.data.labels.length > 2000){
    chartInstance.data.labels.shift();
    chartInstance.data.datasets[0].data.shift();
    chartInstance.data.datasets[1].data.shift();
  }

  chartInstance.update('none'); // アニメーションなしで更新
}

function resetChartData() {
  if (!chartInstance) return;
  chartInstance.data.labels = [];
  chartInstance.data.datasets[0].data = [];
  chartInstance.data.datasets[1].data = [];
  chartInstance.update('none');
}