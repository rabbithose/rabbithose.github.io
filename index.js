var detector;
var modeai = "wait";

var modecam = "stop"

const cameraInit = () => {
    const video = document.getElementById("camera");

    const cameraSetting = {
        audio: false,
        video: { facingMode: "environment" }
    }

    navigator.mediaDevices.getUserMedia(cameraSetting)
        .then((mediaStream) => {
            video.srcObject = mediaStream;
            modecam = "move"
        })
        .catch((err) => {
            console.log(err.toString());
        });
}

document.addEventListener("DOMContentLoaded", async function () {
    cameraInit()
    detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet
    );
    modeai = "move";
    document.getElementById("mode").textContent = mode;
    console.log("setupOK");
});

setInterval(main, 1000);

let mode = "waiting";
let count = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
let pose_number_list = [];
let letter = "";
let letters = "";

async function main() {
    if (modeai == "move" && modecam == "move") {
        // console.log(detector);
        const video = document.getElementById("camera");
        const poses = await detector.estimatePoses(video);

        get_data_of_tebata(poses[0]);
        write_letter();
    } else {
        console.log(modeai);
    }
}

function get_pose_number(data) {
    const left_shoulder = data.keypoints[5];
    const right_shoulder = data.keypoints[6];
    const left_wrist = data.keypoints[9];
    const right_wrist = data.keypoints[10];

    const l_angle =
        ((Math.atan2(
            left_wrist["y"] - left_shoulder["y"],
            left_wrist["x"] - left_shoulder["x"]
        ) *
            180) /
            Math.PI) *
        -1;
    const r_angle =
        ((Math.atan2(
            right_wrist["y"] - right_shoulder["y"],
            right_wrist["x"] - right_shoulder["x"]
        ) *
            180) /
            Math.PI) *
        -1;

    const numbers = [
        [90, -90],
        [0, 180],
        [-90, 90],
        [45, -135],
        [-45, 135],
        [135, 45],
        [180, 180],
        [0, 90],
        [-90, 180],
        [-135, 180],
        [45, 135],
        [45, 45],
        [90, 90],
        [45, -90],
        [-90, 135],
        [0, -180],
        [180, -180],
        [-90, -180],
        [-135, -180],
        [-180, 180],
        [-180, -180],
        [-135, -135],
        [-90, -90],
    ];

    let result = 0;
    for (let i = 0; i < numbers.length; i++) {
        let x = 1;
        result = 0;
        let l = numbers[i][0];
        let r = numbers[i][1];
        let parameter = 20;
        if (i == 5 || i == 6 || i == 17 || i == 19 || i == 20) {
            x = 2;
        }
        let l_distance = Math.abs(l - l_angle);
        let r_distance = Math.abs(r - r_angle);
        if (l_distance < parameter * x && r_distance < parameter * x) {
            if (i == 0) {
                result = 16;
            } else if (i == 15) {
                result = 1;
            } else if (i == 16 && i == 19 && i == 20) {
                result = 6;
            } else if (i == 17) {
                result = 8;
            } else if (i == 18) {
                result = 9;
            } else if (i == 21) {
                result = 15;
            } else if (i == 22) {
                result = 17;
            } else {
                result = i;
            }
            return result;
        }
    }
    return result;
}

function get_letter(pose_num) {
    for (let i = 1; i < 19; i++) {
        if (pose_num == i) {
            if (pose_num != 0) {
                count[i] += 1;
            }
        } else {
            count[i] = 0;
        }

        if (count[i] == 3) {

            if (i == 17) {
                if (mode == "waiting") {
                    pose_number_list = [];
                    mode = 1;
                    break
                } else {
                    if (pose_number_list.length!=0){
                        mode = "send_list";
                    }
                    count[i] = 0;
                }
            }

            if (mode == 1 || mode == 2 || mode == 3) {
                if (mode == 1) {
                    pose_number_list.push(pose_num);
                    mode += 1;
                } else {
                    if (pose_number_list[mode - 2] == pose_num) {
                        count[i] = 0;
                        break
                    } else {
                        pose_number_list.push(pose_num);
                        mode += 1;
                    }
                }
            }
            if (mode == 4) {
                if (pose_num == 13 || pose_num == 14) {
                    pose_number_list.push(pose_num);
                    mode = "send_list";
                }
            }
        }
        if (mode == "send_list") {
            mode = "waiting";
            const tebata_letter_list = [["ア", 9, 3], ["イ", 3, 2], ["ウ", 6, 9], ["エ", 1, 16, 1], ["オ", 1, 2, 3],
            ["カ", 8, 3], ["キ", 6, 2], ["ク", 11, 15], ["ケ", 7, 3], ["コ", 8, 1],
            ["サ", 1, 12], ["シ", 5, 7], ["ス", 1, 2, 5], ["セ", 9, 7], ["ソ", 5, 3],
            ["タ", 11, 15, 5], ["チ", 7, 16], ["ツ", 12, 3], ["テ", 6, 3], ["ト", 2, 5],
            ["ナ", 1, 3], ["ニ", 6], ["ヌ", 9, 4], ["ネ", 9, 2, 1], ["ノ", 3],
            ["ハ", 10], ["ヒ", 1, 7], ["フ", 9], ["ヘ", 4], ["ホ", 1, 2, 10],
            ["マ", 9, 5], ["ミ", 6, 1], ["ム", 7, 5], ["メ", 3, 5], ["モ", 6, 7],
            ["ヤ", 8, 4], ["ユ", 9, 1], ["ー", 2]["ヨ", 8, 6],
            ["ラ", 5, 9], ["リ", 12], ["ル", 3, 7], ["レ", 7], ["ロ", 7, 8],
            ["ワ", 2, 9], ["ヲ", 1, 9], ["ン", 5, 1], ["゛", 13], ["゜", 14]
            ];
            let add_result = ""
            // if (pose_number_list.index(13) == pose_number_list.length - 1) {
            //     add_result = "゛"
            // } else if (pose_number_list.index(14) == pose_number_list.length - 1) {
            //     add_result = "゜"
            // }
            for (let i = 0; i < tebata_letter_list.length; i++) {
                let t = tebata_letter_list[i]
                for (let j = 0; j < Math.min(pose_number_list.length, t.length - 1); j++) {
                    if (pose_number_list[j] === t[j + 1]) {
                        if (j == pose_number_list.length - 1 && t.length - 1 == pose_number_list.length) {
                            let result_letter = t[0] + add_result;
                            letters += result_letter;
                            return result_letter;
                        }
                        continue;
                    } else {
                        break
                    }
                }
            }
            return "?"
        }
    }
    return letter
}


function get_data_of_tebata(data) {
    console.log(data);
    if (data === undefined) {
        return;
    }

    if (data.score < 0.2) {
        return;
    }
    let pose_num = get_pose_number(data);
    document.getElementById("num_result").textContent = pose_num;
    letter = get_letter(pose_num);
}

function write_letter() {
    document.getElementById("in_tebata").textContent = pose_number_list;
    document.getElementById("mode").textContent = mode;
    document.getElementById("letter").textContent = letter;
    document.getElementById("letters").textContent = letters;
}
function clearletter() {
    letters = ""
}
