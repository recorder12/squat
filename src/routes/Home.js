import React, { useState, useEffect } from "react";
import { dbService } from "fbase";
import * as tf from '@tensorflow/tfjs';
import * as tmPose from '@teachablemachine/pose';


const URL = "https://teachablemachine.withgoogle.com/models/aj8L1qvCM/";
let model, webcam, ctx, labelContainer, maxPredictions;
var status = "stand";
var sentence = "Ready!!";
const success = ["가즈아!", "성공!", "좋아좋아!", "달려! 달려!", "헛뜨아!", "다리 지방이 타들어간다!", "고지가 코앞이다!"];
const fail = ["다시!", "자세 불량!", "회원님 이건 무효에요", "회원님 그러다 허리 다쳐요", "복근에 힘 빡 주고 다시!"];
var count = 0;
const modelURL = URL + "model.json";
const metadataURL = URL + "metadata.json";
const size = 450;
const flip = true; // whether to flip the webcam
var d = new Date();



const Home = ({ userObj }) => {
  var scoreDisplay = document.getElementById("score");
  var sentenceDisplay = document.getElementById("sentence");

  const [nweet, setNweet] = useState("");
  const [nweets, setNweets] = useState([]);
  const getNweets = async () => {
    const dbNweets = await dbService.collection("nweets").get();
    dbNweets.forEach((document) => {
      const nweetObject = {
        ...document.data(),
        id: document.id,
      };
      setNweets((prev) => [nweetObject, ...prev]);
    });
  };
  useEffect(() => {
    getNweets();
  }, []);



  const [newDisplayName, setNewDisplayName] = useState(userObj.displayName);
  useEffect(() => {
    dbService.collection("nweets").onSnapshot((snapshot) => {
      const nweetArray = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNweets(nweetArray);
    });
  }, []);
  
  //AI part
  async function init() {

    // load the model and metadata
    // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
    // Note: the pose library adds a tmPose object to your window (window.tmPose)
    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    //score and sentence display seeting 
    scoreDisplay = document.getElementById("score");
    sentenceDisplay = document.getElementById("sentence");
    sentence = "Start!!";
    sentenceDisplay.innerHTML = sentence;
  
    // Convenience function to setup a webcam
    webcam = new tmPose.Webcam(size, size, flip); // width, height, flip
    await webcam.setup(); // request access to the webcam
    await webcam.play();
    window.requestAnimationFrame(loop);
    d = new Date();
  
    // append/get elements to the DOM
    const canvas = document.getElementById("canvas");
    canvas.width = size; canvas.height = size;
    ctx = canvas.getContext("2d");
    // labelContainer = document.getElementById("label-container");
    // for (let i = 0; i < maxPredictions; i++) { // and class labels
    //     labelContainer.appendChild(document.createElement("div"));
    // }
  }    
    async function loop(timestamp) {
      webcam.update(); // update the webcam frame
      await predict();
      window.requestAnimationFrame(loop);
  }

  async function predict() {
    scoreDisplay = document.getElementById("score");
    sentenceDisplay = document.getElementById("sentence");
      // Prediction #1: run input through posenet
      // estimatePose can take in an image, video or canvas html element
      const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
      // Prediction 2: run input through teachable machine classification model
      const prediction = await model.predict(posenetOutput);
      if(prediction[0].probability.toFixed(2) > 0.9){
        if(status === "squat"){
          count++;
          sentence = "Success!";
          // sentence = success[Math.floor(Math.random() * success.length)];
          scoreDisplay.innerHTML=count;
          sentenceDisplay.innerHTML=sentence;
        }
        status = "stand";
      }else if(prediction[1].probability.toFixed(2) > 0.9){
        status = "squat";
        sentenceDisplay.innerHTML="Squat!";
      }else if(prediction[2].probability.toFixed(2) > 0.9 && status != "squat"){
        if(status === "squat" || status === "stand" ){
          // sentence = fail[Math.floor(Math.random() * fail.length)];
          sentenceDisplay.innerHTML="Benting...checking pose!";
        }
      }
      else{
        sentenceDisplay.innerHTML=sentence = "Watching... ";
      }

      // for (let i = 0; i < maxPredictions; i++) {
      //     const classPrediction =
      //         prediction[i].className + ": " + prediction[i].probability.toFixed(2);
      //     labelContainer.childNodes[i].innerHTML = classPrediction;
      // }
      // finally draw the poses
      drawPose(pose);
  }

  function drawPose(pose) {
      if (webcam.canvas) {
          ctx.drawImage(webcam.canvas, 0, 0);
          // draw the keypoints and skeleton
          if (pose) {
              const minPartConfidence = 0.5;
              tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
              tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
          }
      }
  }

  async function end(){
    await dbService.collection("nweets").add({
      text: count, createdAt: d.toUTCString(),
    creatorId: userObj.uid,
    nickname: userObj.displayName
    })

    count = 0;
    status = "stand";
    window.location.reload();
  }

  return (
    <div>
  
      <div className="guide_box">
        <div className="guide1">Step1) Start 버튼을 눌러 스쿼트를 시작하세요!!</div>
        <div className="guide2">Step2) 왼쪽을 바라보고 정자세로 스쿼트를 하시면 갯수가 카운트됩니다!!</div>
        <div className="guide3">Step3) 운동을 마친 후 End를 누리시면 당신의 기록이 갱신됩니다!!</div>
      </div>

      <div className="main_box">
        <div className="screen">
          <button type="button" className="start" onClick={init}>Start</button>
          <button type="button" className="end" onClick={end}>End</button>
          <div><canvas id="canvas"></canvas></div>
          {/* <div id="label-container"></div> */}
        </div>

        <div className="score-container">
            <div className="sentence" >
              <span id="sentence">{sentence}</span>
            </div>
            <div className="score" id="score">
              <span id="sentence">{count}</span>
            </div>
        </div>
      </div>

      <div className="container">
        {nweets.map((nweet) => (
          <div style={{marginTop:10}} className="feed" key={nweet.id}>
            <h4>{nweet.nickname + "  did squat totally " + nweet.text + " counts (" + nweet.createdAt + ")" }</h4>
          </div>
        ))}
      </div>

    </div>

    
  );
};
export default Home;



//To do list
// 1) getting data with limitation and sorting with date
// 2) getting data with limitation and sorting with counts
// 3) input voices with scores