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

let mode = "文字を読み取っていない";
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
                if (mode == "文字を読み取っていない") {
                    pose_number_list = [];
                    mode = 1;
                    break
                } else {
                    if (pose_number_list.length != 0) {
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
            mode = "文字を読み取っていない";
            return tebata_to_letter()
        }
    }
    return letter
}


function tebata_to_letter() {
    const tebata_to_letter_tbl = {
        "9,3": "ア",
        "3,2": "イ",
        "6,9": "ウ",
        "1,16,1": "エ",
        "1,2,3": "オ",
        "8,3": "カ",
        "6,2": "キ",
        "11,15": "ク",
        "7,3": "ケ",
        "8,1": "コ",
        "1,12": "サ",
        "5,7": "シ",
        "1,2,5": "ス",
        "9,7": "セ",
        "5,3": "ソ",
        "11,15,5": "タ",
        "7,16": "チ",
        "12,3": "ツ",
        "6,3": "テ",
        "2,5": "ト",
        "1,3": "ナ",
        "6": "ニ",
        "9,4": "ヌ",
        "9,2,1": "ネ",
        "3": "ノ",
        "10": "ハ",
        "1,7": "ヒ",
        "9": "フ",
        "4": "ヘ",
        "1,2,10": "ホ",
        "9,5": "マ",
        "6,1": "ミ",
        "7,5": "ム",
        "3,5": "メ",
        "6,7": "モ",
        "8,4": "ヤ",
        "9,1": "ユ",
        "2": "ー",
        "8,6": "ヨ",
        "5,9": "ラ",
        "12": "リ",
        "3,7": "ル",
        "7": "レ",
        "7,8": "ロ",
        "2,9": "ワ",
        "1,9": "ヲ",
        "5,1": "ン",
    };
    const daku_before = "カキクケコサシスセソタチツテトハヒフヘホ";
    const daku_after = "ガギグゲゴザジズゼゾダヂヅデドバビブベボ";
    const handaku_before = "ハヒフヘホ";
    const handaku_after = "パピプペポ";

    let lastNumber = pose_number_list.at(-1); // 末尾の数字
    let result = ""; // 変換結果

    if (lastNumber != 13 && lastNumber != 14) {
        post_key = pose_number_list.join(","); // リストを","で連結
        result = tebata_to_letter_tbl[post_key];
    } else {
        // 末尾の数字のみ削除（13＝濁点、14=半濁点）
        console.log(pose_number_list)
        pose_number_list = pose_number_list.filter((c) => { return c != 13 && c != 14 });
        console.log(pose_number_list)
        post_key = pose_number_list.join(",");
        result = tebata_to_letter_tbl[post_key];
        console.log(post_key, result)
        let before = lastNumber == 13 ? daku_before : handaku_before;
        let after = lastNumber == 13 ? daku_after : handaku_after;
        let p = before.indexOf(result);
        if (p >= 0) {
            result = after.charAt(p);
        }
        pose_number_list.push(lastNumber);
    }


    if (result != "" && result != undefined) {
        letters += result;
        return result;
    } else {
        return "?";
    }
}


function get_data_of_tebata(data) {
    console.log(data);
    if (data === undefined) {
        return;
    }

    if (data.score < 0.2) {
        document.getElementById("num_result").textContent = "none_person";
        return;
    }
    let pose_num = get_pose_number(data);
    document.getElementById("num_result").textContent = pose_num;
    letter = get_letter(pose_num);
}

function write_letter() {
    // document.getElementById("in_tebata").textContent = pose_number_list;
    for (let i = 0; i < 4; i++) {
        id = "number" + i;
        if (i < pose_number_list.length) {
            document.getElementById(id).textContent = pose_number_list[i];
        } else {
            document.getElementById(id).textContent = "";
        }
    }

    document.getElementById("mode").textContent = mode;
    document.getElementById("letter").textContent = letter;
    document.getElementById("letters").textContent = letters;
}
function clearletter() {
    letters = ""
}

function delete_number() {
    // pose_number_listの最後の文字を消してモードを一つ下げる
}
