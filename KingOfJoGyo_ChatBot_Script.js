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

// -----------------------------------------------------------
