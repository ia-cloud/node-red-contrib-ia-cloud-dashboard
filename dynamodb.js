
// APIURL
var apiUrl = "https://xfsjduorxc.execute-api.us-east-1.amazonaws.com/stage_1/iacloud/dynamoreq";

module.exports = function(RED) {

    /* 関数定義 */
    return {
        cnctSetting: cnctSetting,
        serviceSetting: serviceSetting,
        dynamoRequest: dynamoRequest,
        aggregation: aggregation,
        round: round,
        expressionSetting: expressionSetting
    };
};

/* 使用モジュール定義 */
var request = require("request");
var moment = require("moment");

var reqbody = {};                   // DynamoDBリクエスト用オブジェクト


/* DynamoDB接続情報設定関数 */
function cnctSetting (userID, password) {
    var opts = {};                  // 接続情報格納用オブジェクト

    // 接続情報のデコード
    var buffer = new Buffer(userID + ":" + password);
    var encodedData = buffer.toString("base64");

    // httpリクエストのoptionを設定
    opts.url = apiUrl;
    opts.method = "POST";
    opts.headers = {};
    opts.headers["Content-Type"] =  "application/json";
    opts.headers["Authorization"] =  "Basic " + encodedData;
    opts.encoding = null;

    return opts;
}


/* 検索期間条件設定関数 */
function expressionSetting (node) {

    if (node.sdate!= undefined && node.edate != undefined) {
        // 開始・終了共に条件あり
        node.ExpressionAttributeValues[":sdate"] = node.sdate + "T00:00:00+09:00";	        // 期間セット
        node.ExpressionAttributeValues[":edate"] = node.edate + "T23:59:59+09:00";	        // 期間セット
        node.KeyConditionExpression = "objectKey = :a and #t BETWEEN :sdate and :edate";    // 検索条件
        node.ExpressionAttributeNames = {											        // 検索条件値
            "#t": "timeStamp"
        };
    } else if (node.sdate != undefined){
        // 開始のみ条件あり
        node.ExpressionAttributeValues[":sdate"] = node.sdate + "T00:00:00+09:00";	        // 期間セット
        delete node.ExpressionAttributeValues[":edate"];                                    // 期間セット
        node.KeyConditionExpression = "objectKey = :a and #t > :sdate";				        // 検索条件
        node.ExpressionAttributeNames = {											        // 検索条件値
            "#t": "timeStamp"
        };
    } else if (node.sdate!= undefined) {
        // 終了のみ条件あり
        delete node.ExpressionAttributeValues[":sdate"];                                    // 期間セット
        node.ExpressionAttributeValues[":edate"] = node.edate + "T23:59:59+09:00";          // 期間セット
        node.KeyConditionExpression = "objectKey = :a and #t < :edate";	                    // 検索条件
        node.ExpressionAttributeNames = {										        	// 検索条件値
            "#t": "timeStamp"
        };
    } else {
        // 開始・終了共に条件なし       
        delete node.ExpressionAttributeValues[":sdate"];                                    // 期間セット
        delete node.ExpressionAttributeValues[":edate"];                                    // 期間セット
        node.KeyConditionExpression = "objectKey = :a";	                                    // 検索条件
        delete node.ExpressionAttributeNames;                                               // 検索条件値
    }
    
    return node;
}


/* DynamoDB操作内容設定関数 */
function serviceSetting (opts, node) {

    reqbody = {};
    service[node.operation](node);          // 操作内容を基にリクエストを設定
    reqbody.oparation = node.operation;

    opts.body = JSON.stringify(reqbody);

    return opts;
}


/* DynamoDBリクエスト実行関数 */
function dynamoRequest (opts, node, callback) {
    //  リクエストモジュールを利用して設定APIへリクエスト
    request (opts, function(err, res, body) {
        var resbody = null;                 // レスポンス設定用オブジェクト

        if (err) {
            // リクエストが失敗したらエラーを出力
            if(err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') {
                node.error(RED._("common.errors.no-response"));
            }
            node.status({fill:"red", shape:"ring", text:"not respond"});
        } else {
            // リクエストが成功したらレスポンス毎に処理を分岐
            if (res.statusCode == 500){
                // 認証エラー
                var resbody = {
                    "status": 401,
                    "errorMassage": "認証情報が正しくありません"
                }; 
                node.error("DynamoDB：認証エラー", resbody);
            } else if (res.statusCode != 200){
                // その他エラー
                var resbody = {
                    "status": 400,
                    "errorMassage": "エラーが発生しました"
                }; 
                node.error("DynamoDB：認証エラー", resbody);
            } else {
                // 結果を出力
                try {
                    resbody = JSON.parse(body);
                } catch (e) {
                    node.warn(RED._("common.errors.json-error"));
                }
            }
        }
        callback(resbody);
    });
}


/* アグリゲーション実行関数 */
function aggregation (items, node) {
    var aggrItem = {};                              // 集計データ格納用配列

    // 処理対象データの有無を確認
    if (items.length > 0) {
        aggrItem.objectKey = items[0].objectkey;    // 勝利データ一件目のobjectKeyを取得
        aggrItem.objectList = [];                   // アグリゲーション結果を格納するobjectListを作成

        var tmpObj;					                // オブジェクト一時保存用オブジェクト	
        var DatObj;					                // dataObject一時保存用オブジェクト
        var contentData;			                // 集計結果一時保存用オブジェクト

        var sumList;				                // 一時集計用配列
        
        var resultList = [];		                // 集計結果一時保存用配列
        var resultObj;				                // 結果結果一時保存用オブジェクト
        

        // データをひとまとめに
        for (var i=0; i<items.length; i++) {
            DatObj = items[i].dataObject
            if (DatObj.objectType == "iaCloudObject") {
                tmpObj = {};

                // timeStamp(timestamp)を格納
                if (DatObj.timeStamp != undefined) {
                    tmpObj.timeStamp = DatObj.timeStamp;
                } else if (DatObj.timestamp != undefined) {
                    tmpObj.timeStamp = DatObj.timestamp;
                } else {
                    console.log("timeStamp(timestamp)が無効\n");
                    continue;
                }

                try {
                    // contentDataを格納
                    if (DatObj.objectContent != undefined) {
                        tmpObj.contentData = DatObj.objectContent.contentData;
                    } if (DatObj.ObjectContent != undefined) {
                        tmpObj.contentData = DatObj.ObjectContent.contentData;
                    } else {
                        console.log("objectContent(ObjectContent)が無効\n");
                        continue;
                    }
                } catch (e) {
                    console.log("objectContent(ObjectContent)が無効\n");
                        continue;
                }

                // 作成したtmpObjをpushをaggrItem.objectListへpush
                aggrItem.objectList.push(tmpObj);


            } else {
                console.log("objectTypeが無効:" + DatObj.objectType + "\n");
            }

        }

        // データをソート
        aggrItem.objectList.sort(function(a, b) {
            if (a.timeStamp > b.timeStamp) {
                return 1;
            } else {
                return -1;
            }
        });

        // 全データの集計が終わるまで繰り返す
        for (var i=0; i<aggrItem.objectList.length; i) {

            // 一時集計を容易にするため、tmpObjに一時格納
            tmpObj = aggrItem.objectList[i];
            
            // 期間設定処理
            var endTimeStamp = moment(tmpObj.timeStamp).endOf(node.aggreunit);
            sumList = {};				

            // 指定単位（年～秒）で一時的にsumListへ集計
            for (i; i<aggrItem.objectList.length && moment(tmpObj.timeStamp)<=endTimeStamp; i) {

                tmpObj.contentData.forEach (function (CntDat) {									
                    // 初めて確認したdataNameの場合、項目箇所を新規作成
                    if (sumList[CntDat.dataName] == undefined) {
                        sumList[CntDat.dataName] = [];
                    }
                    sumList[CntDat.dataName].push(CntDat.dataValue);
                });

                // 一時集計を容易にするため、tmpObjに一時格納
                tmpObj = aggrItem.objectList[++i];
            }
            

            /* アグリゲーション */
            switch (node.aggregation) {
            // 最大値
            case "max":
                contentData = [];
                // sumList内のオブジェクト毎にM最大値を算出
                Object.keys(sumList).forEach(function (key) {
                    tmpObj = {};
                    tmpObj.dataName = key;
                    tmpObj.dataValue = Math.max(...sumList[key]);
                    contentData.push(tmpObj);
                });
                // resultListに格納するためのオブジェクトを作成
                resultObj = {
                    timeStamp: endTimeStamp.startOf(node.aggreunit).format(),
                    contentData: contentData
                };
                // resultListに格納
                resultList.push(resultObj);
                break;

            case "min":
                // 最小値
                contentData = [];
                // sumList内のオブジェクト毎に最小値を算出
                Object.keys(sumList).forEach(function (key) {
                    tmpObj = {};
                    tmpObj.dataName = key;
                    tmpObj.dataValue = Math.min(...sumList[key]);
                    contentData.push(tmpObj);
                });
                // resultListに格納するためのオブジェクトを作成
                resultObj = {
                    timeStamp: endTimeStamp.startOf(node.aggreunit).format(),
                    contentData: contentData
                };
                // resultListに格納
                resultList.push(resultObj);
                break;
            
            case "average":
                // 平均
                // SUM関数作成
                var sum  = function(arr) {
                    return arr.reduce(function(prev, current, i, arr) {
                        return prev+current;
                    });
                };
                contentData = [];
                // sumList内のオブジェクト毎に平均を算出
                Object.keys(sumList).forEach(function (key) {
                    tmpObj = {};
                    tmpObj.dataName = key;
                    tmpObj.dataValue =  sum(sumList[key]) / sumList[key].length;
                    contentData.push(tmpObj);
                });
                // resultListに格納するためのオブジェクトを作成
                resultObj = {
                    timeStamp: endTimeStamp.startOf(node.aggreunit).format(),
                    contentData: contentData
                };
                // resultListに格納
                resultList.push(resultObj);
                break;

            case "median":
                // 中央値
                // ソート用関数作成
                function compareNumbers(a, b) {
                    return a - b;
                    }
                var sortedList;
                contentData = [];
                // sumList内のオブジェクト毎に中央値を算出
                Object.keys(sumList).forEach(function (key) {
                    tmpObj = {};
                    tmpObj.dataName = key;

                    sortedList = sumList[key].sort(compareNumbers);
                    tmpObj.dataValue = sortedList[ Math.floor(sortedList.length / 2) ];
                    contentData.push(tmpObj);
                });
                // resultListに格納するためのオブジェクトを作成
                resultObj = {
                    timeStamp: endTimeStamp.startOf(node.aggreunit).format(),
                    contentData: contentData
                };
                // resultListに格納
                resultList.push(resultObj);
                break;

            case "count":
                //カウント
                contentData = [];
                // sumList内のオブジェクト毎にカウントを算出
                Object.keys(sumList).forEach(function (key) {
                    tmpObj = {};
                    tmpObj.dataName = key;
                    tmpObj.dataValue = sumList[key].length;
                    contentData.push(tmpObj);
                });
                // resultListに格納するためのオブジェクトを作成
                resultObj = {
                    timeStamp: endTimeStamp.startOf(node.aggreunit).format(),
                    contentData: contentData
                };
                // resultListに格納
                resultList.push(resultObj);
                break;

            case "integration":
                // 積算
                // 未実装
                break;

            case "first":
                // 指定単位（年～秒）内の最初のデータ
                contentData = [];
                // sumList内のオブジェクト毎に最初のデータを算出
                Object.keys(sumList).forEach(function (key) {
                    tmpObj = {};
                    tmpObj.dataName = key;
                    tmpObj.dataValue = sumList[key][0];
                    contentData.push(tmpObj);
                });
                // resultListに格納するためのオブジェクトを作成
                resultObj = {
                    timeStamp: endTimeStamp.startOf(node.aggreunit).format(),
                    contentData: contentData
                };
                // resultListに格納
                resultList.push(resultObj);
                break;
            
            case "last":
                // 指定単位（年～秒）内の最後のデータ
                contentData = [];
                // sumList内のオブジェクト毎に最後のデータを算出
                Object.keys(sumList).forEach(function (key) {
                    tmpObj = {};
                    tmpObj.dataName = key;
                    tmpObj.dataValue = sumList[key][sumList[key].length-1];
                    contentData.push(tmpObj);
                });
                // resultListに格納するためのオブジェクトを作成
                resultObj = {
                    timeStamp: endTimeStamp.startOf(node.aggreunit).format(),
                    contentData: contentData
                };
                // resultListに格納
                resultList.push(resultObj);
                break;

            }
        }
    } else {
        // アグリゲーション処理用データが存在しなかった場合はエラー出力
        console.log("アグリゲーション対象データがありません");
		node.error("dynamodb.js -aggregation：アグリゲーション対象データがありません");
    }

    // 集計結果(reusltList)を返却する
    return resultList;
}

/* 表示桁数関数 */
function round (items, node) {
    try {

        if (node.aggregationCheck == true) {
            // アグリゲーション処理後データ
            items.forEach (function (item) {
                item.contentData.forEach (function (obj) {
                    obj.dataValue = Math.round(obj.dataValue * Math.pow(10, node.decimalPoint)) / Math.pow(10, node.decimalPoint);
                });
            });
        } else if (node.aggregationCheck == false) {
            if (items.Items[0].dataObject.objectContent != undefined) {
                // 生データ（objectContent）
                items.Items.forEach (function (item) {
                    item.dataObject.objectContent.contentData.forEach (function (obj) {
                        obj.dataValue = Math.round(obj.dataValue * Math.pow(10, node.decimalPoint)) / Math.pow(10, node.decimalPoint);
                    });
                });
            } else if (items.Items[0].dataObject.ObjectContent != undefined) {
                // 生データ（ObjectContent）
                items.Items.forEach (function (item) {
                    item.dataObject.ObjectContent.contentData.forEach (function (obj) {
                        obj.dataValue = Math.round(obj.dataValue * Math.pow(10, node.decimalPoint)) / Math.pow(10, node.decimalPoint);
                    });
                });
            } else {
                // round処理未実施：生データ
            }
        }
        //  else if (node.aggregationCheck == null) {
        //     // アグリゲーション処理後データ
        // }
        
    } catch (e) {
        // 表示桁数変換データが存在しなかった場合はエラー出力
        console.log("表示桁数変換対象データがありません");
		node.error("dynamodb.js -round：表示桁数変換対象データがありません");
    }
    
    return items;
}


/* 文字列コピー関数*/
var copyArg=function(src,arg,out,outArg,isObject){
    var tmpValue=src[arg];
    outArg = (typeof outArg !== 'undefined') ? outArg : arg;
    if (typeof src[arg] !== 'undefined'){
        if (isObject && typeof src[arg]=="string" && src[arg] != "") { 
            tmpValue=JSON.parse(src[arg]);
        }
        out[outArg]=tmpValue;
    }
    if (arg=="Payload" && typeof tmpValue == 'undefined'){
            out[arg]=src["payload"];
    }

}


// 処理毎にserivceを設定
var service={};

// Query処理を行う際のservice
service.Query=function(msg){

    var params={};
    //copyArgs		
    copyArg(msg,"TableName",params,undefined,false); 
    copyArg(msg,"IndexName",params,undefined,false); 
    copyArg(msg,"Select",params,undefined,false); 
    copyArg(msg,"AttributesToGet",params,undefined,true); 
    copyArg(msg,"Limit",params,undefined,false); 
    copyArg(msg,"ConsistentRead",params,undefined,false); 
    copyArg(msg,"KeyConditions",params,undefined,false); 
    copyArg(msg,"QueryFilter",params,undefined,true); 
    copyArg(msg,"ConditionalOperator",params,undefined,false); 
    copyArg(msg,"ScanIndexForward",params,undefined,false); 
    copyArg(msg,"ExclusiveStartKey",params,undefined,true); 
    copyArg(msg,"ReturnConsumedCapacity",params,undefined,false); 
    copyArg(msg,"ProjectionExpression",params,undefined,false); 
    // copyArg(msg,"FilterExpression",params,undefined,false); 
    copyArg(msg,"KeyConditionExpression",params,undefined,false); 
    copyArg(msg,"ExpressionAttributeNames",params,undefined,true); 
    copyArg(msg,"ExpressionAttributeValues",params,undefined,true); 

    reqbody.params = params;

}

// Scan処理を行う際のservice
service.Scan=function(msg){
    var params={};
    //copyArgs
    copyArg(msg,"TableName",params,undefined,false); 
    copyArg(msg,"IndexName",params,undefined,false); 
    copyArg(msg,"AttributesToGet",params,undefined,true); 
    copyArg(msg,"Limit",params,undefined,false); 
    copyArg(msg,"Select",params,undefined,false); 
    copyArg(msg,"ScanFilter",params,undefined,true); 
    copyArg(msg,"ConditionalOperator",params,undefined,false); 
    copyArg(msg,"ExclusiveStartKey",params,undefined,true); 
    copyArg(msg,"ReturnConsumedCapacity",params,undefined,false); 
    copyArg(msg,"TotalSegments",params,undefined,false); 
    copyArg(msg,"Segment",params,undefined,false); 
    copyArg(msg,"ProjectionExpression",params,undefined,false); 
    copyArg(msg,"FilterExpression",params,undefined,false); 
    copyArg(msg,"ExpressionAttributeNames",params,undefined,true); 
    copyArg(msg,"ExpressionAttributeValues",params,undefined,true); 
    copyArg(msg,"ConsistentRead",params,undefined,false); 

    reqbody.params = params;
}

// PutItem処理を行う際のservice
service.PutItem=function(msg){
    var params={};
    //copyArgs
    copyArg(msg,"TableName",params,undefined,false); 
    copyArg(msg,"Item",params,undefined,true); 
    copyArg(msg,"Expected",params,undefined,true); 
    copyArg(msg,"ReturnValues",params,undefined,false); 
    copyArg(msg,"ReturnConsumedCapacity",params,undefined,false); 
    copyArg(msg,"ReturnItemCollectionMetrics",params,undefined,false); 
    copyArg(msg,"ConditionalOperator",params,undefined,false); 
    copyArg(msg,"ConditionExpression",params,undefined,false); 
    copyArg(msg,"ExpressionAttributeNames",params,undefined,true); 
    copyArg(msg,"ExpressionAttributeValues",params,undefined,true); 
    
    reqbody.params = params;
}