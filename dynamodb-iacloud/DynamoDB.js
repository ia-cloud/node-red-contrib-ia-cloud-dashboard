
module.exports = function(RED) {
	"use strict";

	// APIURL
	var apiUrl = "https://xfsjduorxc.execute-api.us-east-1.amazonaws.com/stage_1/iacloud/dynamoreq";

	function dynamodbNode(config) {

		var request = require("request");

		function dynamoRequest(opts, callback){
            request(opts, function(err, res, body) {
                var resbody = null;
                if(err){
					// リクエストが失敗したらエラーを出力
                    if(err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') {
                        node.error(RED._("common.errors.no-response"));
                    }
                    node.status({fill:"red", shape:"ring", text:"not respond"});
                }else{
					// リクエストが成功したらレスポンス毎に処理を分岐
                    if (res.statusCode == 500){
						// 認証エラー
                        var resbody = {
							"status": 401,
							"errorMassage": "認証情報が正しくありません"
						}; 
						node.error("DynamoDB：認証エラー", resbody);
                    }else if (res.statusCode != 200){
							// その他エラー
						var resbody = {
							"status": 400,
							"errorMassage": "エラーが発生しました"
						}; 
						node.error("DynamoDB：認証エラー", resbody);
                    } else {
						// 結果を出力
                        try { var resbody = JSON.parse(body); }
                        catch(e) { node.warn(RED._("common.errors.json-error")); }
                    }
				}
                callback(resbody);
            });
        }

		RED.nodes.createNode(this,config);
		// AWS IAM情報取得
		// this.awsConfig = RED.nodes.getNode(config.aws);
		// this.region = this.awsConfig.region;
		// this.accessKey = this.awsConfig.accessKey;
		// this.secretKey = this.awsConfig.secretKey;

		// dynamoDB接続用情報の取得
		this.userID = this.credentials.userID;
		this.password = this.credentials.password;

		// 接続情報のデコード
		var buffer = new Buffer(this.userID + ":" + this.password);
		var encodedData = buffer.toString("base64");

		// 検索条件の取得
		this.name = config.name;				// ノード名
		this.operation = config.operation;		// 処理名
		this.stime = config.stime;				//期間 開始期間
		this.etime = config.etime;				//期間 終了期間
		this.TableName = config.tableName;		// 検索対象テーブル名
		this.Limit = config.limit;				// 検索件数
		this.ScanIndexForward = config.sort;	// 並び順

		this.KeyConditionExpression = "objectKey = :a";	// 検索条件
		this.ExpressionAttributeValues = {				// 検索条件値
			":a": config.objectKey
		};

		// Limitチェック
		if (this.Limit == "") {
			// 上限件数の指定がなかった場合はundefinedを入力する
			this.Limit =undefined;
		}
		
		//期間の作成
		if (this.stime!= "" && this.etime != "") {
			// 開始・終了共に条件あり
			// console.log("開始・終了共に条件あり");
			this.ExpressionAttributeValues[":stime"] = this.stime + "T00:00:00+09:00";	// 期間セット
			this.ExpressionAttributeValues[":etime"] = this.etime + "T23:59:59+09:00";	// 期間セット
			this.KeyConditionExpression += " and #t BETWEEN :stime and :etime";			// 検索条件
			this.ExpressionAttributeNames = {											// 検索条件値
				"#t": "timeStamp"
			};
		} else if (this.stime != ""){
			// 開始のみ条件あり
			// console.log("開始のみ条件あり");
			this.ExpressionAttributeValues[":stime"] = this.stime + "T00:00:00+09:00";	// 期間セット
			this.KeyConditionExpression += " and #t > :stime";							// 検索条件
			this.ExpressionAttributeNames = {											// 検索条件値
				"#t": "timeStamp"
			};
		} else if (this.stime!= "") {
			// 終了のみ条件あり
			// console.log("終了のみ条件あり");
			this.ExpressionAttributeValues[":etime"] = this.etime + "T23:59:59+09:00";	// 期間セット
			this.KeyConditionExpression += " and #t < :etime";							// 検索条件
			this.ExpressionAttributeNames = {											// 検索条件値
				"#t": "timeStamp"
			};
		} else {
			// 開始・終了共に条件なし
			//console.log("開始・終了共に条件なし");
		}
		
		var node = this;

        // httpリクエストのoptionを設定
        var opts = {};
        opts.url = apiUrl;
        // opts.auth = {
        //     user: this.credentials.userID,
        //     pass: this.credentials.password
		// };
        opts.method = "POST";
        opts.headers = {};
		opts.headers["Content-Type"] =  "application/json";
		opts.headers["Authorization"] =  "Basic " + encodedData;
        opts.encoding = null;  // Force NodeJs to return a Buffer (instead of a string)

		var reqbody = {};	// Lambdaへのリクエスト作成用

		node.on("input", function(msg) {
			node.sendMsg = function (data) {
				if (!data) {
					node.status({fill:"red",shape:"ring",text:"error"});
					node.error("failed: Data acquisition failed");
					return;
				} else {
					msg.payload = data;
					node.status({});
				}
				node.send(msg);
			};
			if (typeof service[node.operation] == "function"){
				node.status({fill:"blue",shape:"dot",text:node.operation});

				service[node.operation](node);
				reqbody.oparation = node.operation;

				opts.body = JSON.stringify(reqbody);

				dynamoRequest(opts, function(body) {
					node.sendMsg(body);
				});
			} else {
				node.error("failed: Operation node defined - "+node.operation);
			}
		});

		// 文字列コピー関数：copyArg
		var copyArg=function(src,arg,out,outArg,isObject){
			var tmpValue=src[arg];
			outArg = (typeof outArg !== 'undefined') ? outArg : arg;
			if (typeof src[arg] !== 'undefined'){
				if (isObject && typeof src[arg]=="string" && src[arg] != "") { 
					tmpValue=JSON.parse(src[arg]);
				}
				out[outArg]=tmpValue;
			}
			//AWS API takes 'Payload' not 'payload' (see Lambda)
			if (arg=="Payload" && typeof tmpValue == 'undefined'){
					out[arg]=src["payload"];
			}

		}

		var service={};

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
			copyArg(msg,"FilterExpression",params,undefined,false); 
			copyArg(msg,"KeyConditionExpression",params,undefined,false); 
			copyArg(msg,"ExpressionAttributeNames",params,undefined,true); 
			copyArg(msg,"ExpressionAttributeValues",params,undefined,true); 

			reqbody.params = params;

		}

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

	}
	RED.nodes.registerType("DynamoDB", dynamodbNode, {
        credentials: {
            userID: {type:"text"},
            password: {type: "password"}
        }
    });

};
