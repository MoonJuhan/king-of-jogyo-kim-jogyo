const express = require('express');
const app = express();
const axios = require('axios');
const logger = require('morgan');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
require('dotenv').config({path:'PandoraBot.env'});
const port = 8888;

const apiRouter = express.Router();

app.use(logger('dev', {}));
app.use(bodyParser.json());
app.use('/api', apiRouter);

const fs = require('fs');

const readline = require('readline');
const {google} = require('googleapis');

var _auth;

apiRouter.post('/test', function(req, res) {
  const responseBody = {
    version: "2.0",
    template: {
      outputs: [
        {
          simpleText: {
            text: t1(req.body.userRequest.utterance)
          }
        }
      ]
    }
  };
  console.log("test");
  res.status(200).send(responseBody);
});

app.listen(port, function() {
  console.log('Skill server listening on port ' + port);
});

const SCOPES = [
  'https://www.googleapis.com/auth/script.projects',
  'https://www.googleapis.com/auth/spreadsheets'
  ];

const TOKEN_PATH = 'token.json';

fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Apps Script API.
  authorize(JSON.parse(content), callAppsScript);
});

function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client, {});
    _auth = oAuth2Client;
  });
}

function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('Authorize this app by visiting this url:', authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);

      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err)return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client, {});
      _auth = oAuth2Client;
    });
  });
}


// -----------------------------------------------------------
// 해커톤 챗봇
var dataSet = [];

fs.readFile("QnA_JSON.json", function(err, data) {
    dataSet = JSON.parse(data);
    console.log(dataSet.length);
});

// 질문 직접 입력
apiRouter.post('/ht_que1', function(req, res) {
  const responseBody = {
    version: "2.0",
    template: {
      outputs: [
        {
          simpleText: {
            text: answer(req)
          }
        }
      ],
      quickReplies: [
        {
          action: "block",
          label: "처음으로",
          blockId: "5e0414ebffa74800014b8e72"
        },
        {
          action: "block",
          label: "다시 질문하기",
          blockId: "5e0426a3ffa74800014b8ff1"
        }
      ]
    }
  };
  console.log("조교왕_김조교");
  res.status(200).send(responseBody);
});

// DB 업데이트 스킬
apiRouter.post('/ht_dbUpdate', function(req, res) {
  const responseBody = {
    version: "2.0",
    template: {
      outputs: [
        {
          simpleText: {
            text: "업데이트 되었습니다."
          }
        }
      ],
      quickReplies: [
        {
          action: "block",
          label: "처음으로",
          blockId: "5e0414ebffa74800014b8e72"
        }
      ]
    }
  };
  console.log("DB 업데이트");
  res.status(200).send(responseBody);
  updateDataSet();
});

// FAQ 스킬
apiRouter.post('/ht_que2', function(req, res) {
  const responseBody = {
    version: "2.0",
    template: faq(req)
  };
  console.log("조교왕_김조교 FAQ");

  res.status(200).send(responseBody);
});

function faq(req){

  if(QuestFind(req).length == 0){
    var ans = {
      outputs: [
        {
          simpleText: {
            text: "등록된 질문이 없습니다."
          }
        }
      ],
      quickReplies: [
        {
          action: "block",
          label: "직접 질문하기",
          blockId: "5e0426a3ffa74800014b8ff1"
        }
      ]
    }
  }
  else{
    var ans = {
      outputs: [
        {
          simpleText: {
            text: "질문을 선택하세요"
          }
        }
      ],
      quickReplies: QuestFind(req)
    }
  }

  return ans;
}

function QuestFind(req){

  try {
    var qus = [];
    for(var i in req.body.contexts){
      if(req.body.contexts[i].name == "Subject"){
        var target = req.body.contexts[i];
        for(var j in dataSet)
        {
          if ((dataSet[j].lecture == target.params["과목명"].resolvedValue) && (dataSet[j].week == target.params["주차"].resolvedValue))
          {
            var obj_dataSet = {
              action: "block",
              label: dataSet[j].question,
              blockId: "5e046015b617ea00015a80f1"
            };
            qus.push(obj_dataSet);
          }
        }
      }
    }
  }
  catch (e) {
  }

  return qus;
}

function answer(req){
  var inputText;
  inputText = req.body.userRequest.utterance;

  try {
    if(req.body.action.params["질문"] != null){
      inputText = req.body.action.params["질문"];
    }
    for(var i in req.body.contexts){
      if(req.body.contexts[i].name == "Subject"){
        console.log(req.body.contexts[i].params["과목명"]);
          console.log(req.body.contexts[i].params["주차"]);
      }
    }
  } catch (e) {
    console.log("no contexts");
  }

  console.log(req.body.action.params["질문"]);
  try {
    return match(inputText, req.body.contexts[i].params["과목명"].resolvedValue, req.body.contexts[i].params["주차"].resolvedValue);
  } catch (e) {
    return match(inputText, "", "");
  } finally {

  }

}

function match(quest, _subject, _week){
  var max = {cnt: 0, index: 0};
  var mincnt = 2;
  for(var i in dataSet){
    var cnt = 0;
    for(var j in dataSet[i].keyword){
      if(quest.includes(dataSet[i].keyword[j])){
        cnt++;
      }
    }
    if(cnt > max.cnt){
      max.index = i;
      max.cnt = cnt;
    }
  }

  if(max.cnt < mincnt){
    //구글 앱스 스크립트 호출
    //새로운 질문 입력하기
    var param = {
      input: quest,
      subject: _subject,
      week: _week,
      type: "new"
    }
    ht_callAppsScript(_auth, param);
    return "질문에 대한 답변이 없습니다. 상담직원에게 연결하세요";
  }
  splitKeyword(quest, dataSet[max.index]);
  return dataSet[max.index].answer;          //해당 string과 키워드 개수가 가장 많은 데이터 오브젝트 반환
}

function writeDataSetJSON(_updateObj){
  var json = JSON.stringify(_updateObj);
  fs.writeFile('QnA_JSON.json', json, function(err, result) {
    if(err) console.log('error', err);
  });

  fs.readFile("QnA_JSON.json", function(err, data) {
      dataSet = JSON.parse(data);
      console.log(dataSet.length);
  });
}

function updateDataSet(){
  var sheetDataLink_JYF = "https://spreadsheets.google.com/feeds/cells/1llk5IZ41U5Ul3kOQva8jkZwZlreHBmtzTwhgTwpeXGo/2/public/basic?alt=json-in-script";
  var updateObj = [];

  console.log("업데이트 DB 실행중");

  axios.get(sheetDataLink_JYF).then(function(response) {
      var sheetJson = response.data.slice(28,response.data.length-2);
      entry = JSON.parse(sheetJson).feed.entry;
      var num = 1;

      for(var i in entry){
        if(entry[i].content.$t == num){
          var oneline = {
            lecture: "",
            week: "",
            question: "",
            answer: "",
            keyword: []
          };

          var num2 = i;
          num2++;

          try {
            while(entry[num2].content.$t != num+1){
              switch (entry[num2].title.$t.substring(0,1)) {
                case "B":
                oneline.lecture = entry[num2].content.$t;
                break;
                case "C":
                oneline.week = entry[num2].content.$t;
                break;
                case "D":
                oneline.question = entry[num2].content.$t;
                break;
                case "E":
                oneline.answer = entry[num2].content.$t;
                break;
                default:
                oneline.keyword.push(entry[num2].content.$t);
              }
              num2++;
            }
          } catch (e) {

          }

          updateObj.push(oneline);
          num++;
        }
      }

      writeDataSetJSON(updateObj);
    })
    .catch(function(error) {
      console.log(error);
    });


      console.log("업데이트 DB 종료");
}

function ht_callAppsScript(auth, parameter) { // eslint-disable-line no-unused-vars
  console.log(parameter);
  const scriptId = "1VUGXgd5MxQqbBgM-ygeB9jYT2HwDJSxlheeOmfapO7jSKi2jICKcD_8x";
  const script = google.script('v1');
  // Make the API request. The request object is included here as 'resource'.
  script.scripts.run({
    auth: auth,
    resource: {
      function: 'ht_write',
      devMode: "true",
      parameters: parameter
    },
    scriptId: scriptId,
  }, function(err, resp) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    if (resp.error) {
      const error = resp.error.details[0];
      console.log('Script error message: ' + error.errorMessage);
      console.log('Script error stacktrace:');

      if (error.scriptStackTraceElements) {
        for (let i = 0; i < error.scriptStackTraceElements.length; i++) {
          const trace = error.scriptStackTraceElements[i];
          console.log('\t%s: %s', trace.function, trace.lineNumber);
        }
      }
    } else {
      const folderSet = resp.data.response.result;
      console.log(Object.keys(folderSet));
      if (Object.keys(folderSet).length == 0) {
        console.log('No folders returned!');
      } else {
        console.log('Folders under your root folder:');
        Object.keys(folderSet).forEach(function(id) {
          console.log('\t%s (%s)', folderSet[id], id);
        });
      }
    }
  });
}

function splitKeyword(input, _dataSet){
  var splitBlank = input.split(" ");
  var keyword = [];
  for(var i in splitBlank){
    var splitText = splitBlank[i].split("은");
    for(var j in splitText){
      if(splitText[j] != "" && keyword.indexOf(splitText[j]) == -1){
        keyword.push(splitText[j]);
      }
    }
    splitText = splitBlank[i].split("는");
    for(var j in splitText){
      if(splitText[j] != "" && keyword.indexOf(splitText[j]) == -1){
        keyword.push(splitText[j]);
      }
    }
    splitText = splitBlank[i].split("이");
    for(var j in splitText){
      if(splitText[j] != "" && keyword.indexOf(splitText[j]) == -1){
        keyword.push(splitText[j]);
      }
    }
    splitText = splitBlank[i].split("가");
    for(var j in splitText){
      if(splitText[j] != "" && keyword.indexOf(splitText[j]) == -1){
        keyword.push(splitText[j]);
      }
    }
  }
  console.log(keyword);
  console.log(_dataSet);

  for(var i in keyword){
    if(_dataSet.keyword.indexOf(keyword[i]) != -1){
      keyword[i] = "";
    }
  }
  keyword = keyword.filter(isNotEmpty);

  console.log(keyword);

  var param = {
    keyword: keyword,
    answer: _dataSet.answer,
    type: "keyword"
  }

  ht_callAppsScript(_auth, param);
}

function isNotEmpty(value) {
  return value != "";
}

// -----------------------------------------------------------
