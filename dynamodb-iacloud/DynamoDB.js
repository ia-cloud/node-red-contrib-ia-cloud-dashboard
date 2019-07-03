
module.exports = function(RED) {

	function dynamodbNode(config) {

		var dynamodb = require("../dynamodb")(RED);

		var opts;			// dynamodbへのアクセス情報を格納
		var resultList;		// 取得結果を保存

		RED.nodes.createNode(this,config);

		// 検索条件の取得
		this.name = config.name;				// ノード名
		this.operation = config.operation;				// 処理名
		this.stime = config.stime;				//期間 開始期間
		this.etime = config.etime;				//期間 終了期間
		this.TableName = config.tableName;		// 検索対象テーブル名
		this.Limit = config.limit;				// 検索件数
		this.ScanIndexForward = config.sort;	// 並び順

		this.aggregationCheck = config.aggregationCheck;	// アグリゲーション設定の有無									// アグリゲーションオプション
		this.aggregation = config.aggregation;	//アグリゲーション操作
		this.aggreunit = config.aggreunit;		// アグリゲーション単位
		this.decimalPoint = config.decimalPoint;//  アグリゲーション時の小数点以下四捨五入ポイント
		this.KeyConditionExpression = "objectKey = :a";	// 検索条件
		this.FilterExpression = "objectKey = :a";
		this.ExpressionAttributeValues = {				// 検索条件値
			":a": config.objectKey
		};

		// dynamoDB接続用情報の取得
		this.userID = this.credentials.userID;
		this.password = this.credentials.password;

		// node作成
		var node = this;

		// dynamodb接続設定
		opts = dynamodb.cnctSetting(node.userID, node.password);

		// Limitチェック
		if (node.Limit == "") {
			// 上限件数の指定がなかった場合は10000件とする
			node.Limit = 10000;
		}

		// 期間式の設定
		node = dynamodb.expressionSetting(node);


		// injectされたら実行
		node.on('input', function(msg) {

			// ノード接続情報出力
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

			// DynamoDBパラメータの作成
			opts = dynamodb.serviceSetting (opts, node);

			// DynamoDBへリクエスト
			dynamodb.dynamoRequest(opts, node, function(body) {

				console.log("\n\n" + JSON.stringify(body) + "\n\n");

				if (node.aggregationCheck == true) {
					resultList = dynamodb.aggregation(body.Items, node);
				} else {
					resultList = body;
				}

				// resultListを出力へセット
				node.sendMsg(resultList);

			});

		});
	}


	RED.nodes.registerType("DynamoDB", dynamodbNode, {
        credentials: {
            userID: {type:"text"},
            password: {type: "password"}
        }
    });

};




			/*

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

		this.aggregationCheck = config.aggregationCheck;	// アグリゲーション設定の有無
		this.aggregation = config.aggregation;				//アグリゲーション操作
		this.aggreunit = config.aggreunit;					// アグリゲーション単位
		this.decimalPoint = config.decimalPoint				//  アグリゲーション時の小数点以下四捨五入ポイント
		// this.decimalPoint = 2;
		this.KeyConditionExpression = "objectKey = :a";	// 検索条件
		this.ExpressionAttributeValues = {				// 検索条件値
			":a": config.objectKey
		};

		// Limitチェック
		if (this.Limit == "") {
			// 上限件数の指定がなかった場合はundefinedを入力する
			// this.Limit = undefined;

			// 上限件数の指定がなかった場合は10000件とする
			this.Limit = 10000;
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
					
					
					// アグリゲーション処理
					if (node.operation != "PutItem" && node.aggregationCheck == true) {
						console.log("アグリゲーション処理開始:" + node.aggregation);
						
						var items = body.Items;

						// 集計データ格納用
						var aggrItem = {};

						// objectKeyを格納
						aggrItem.objectKey = items[0].objectkey;
						aggrItem.objectList = [];


						var tmpObj;					// オブジェクト一時保存用		
						var DatObj;					// dataObject一時保存用

						var sumList;				// 集計用一時保存配列

						var contentData;			// 結果集計オブジェクト一時保存用
						var resultObj;				// 結果集計オブジェクト一時保存用
						var resultList = [];		// 結果集計用解列

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

						// sumList（一時格納配列）作成
						for (var i=0; i<aggrItem.objectList.length; i) {

							tmpObj = aggrItem.objectList[i];
							
							// 期間設定処理
							var endTimeStamp = moment(tmpObj.timeStamp).endOf(node.aggreunit);
							sumList = {};				

							for (i; i<aggrItem.objectList.length && moment(tmpObj.timeStamp)<=endTimeStamp; i) {

								tmpObj.contentData.forEach (function (CntDat) {									
									// 初めて確認したdataNameの場合、項目箇所を新規作成
									if (sumList[CntDat.dataName] == undefined) {
										sumList[CntDat.dataName] = [];
									}
									sumList[CntDat.dataName].push(CntDat.dataValue);
								});

								// 次に使用するtmpObjを取得
								tmpObj = aggrItem.objectList[++i];
							}
							

							switch (node.aggregation) {
							// 最大値
							case "max":
								contentData = [];
								// sumList内のオブジェクト毎にMAXを算出
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
								// sumList内のオブジェクト毎にMINを算出
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
								// sum関数作成
								var sum  = function(arr) {
									return arr.reduce(function(prev, current, i, arr) {
										return prev+current;
									});
								};
								var average;
								contentData = [];
								// sumList内のオブジェクト毎にAVERAGEを算出
								Object.keys(sumList).forEach(function (key) {
									tmpObj = {};
									tmpObj.dataName = key;
									average = Math.round(sum(sumList[key]) / sumList[key].length * Math.pow(10, node.decimalPoint)) / Math.pow(10, node.decimalPoint);
									tmpObj.dataValue = average;
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
								// sumList内のオブジェクト毎にMEDIANを算出
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
								// sumList内のオブジェクト毎にCOUNTを算出
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
								// 分散
								// 未実装
								break;

							case "first":
								// 最初のデータ
								contentData = [];
								// sumList内のオブジェクト毎にFIRSTを算出
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
								// 最後のデータ
								contentData = [];
								// sumList内のオブジェクト毎にFIRSTを算出
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

						// 作成したresultListをbodyに保存
						body = resultList;

					}

					// bodyをoutputに設定
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

	*/

