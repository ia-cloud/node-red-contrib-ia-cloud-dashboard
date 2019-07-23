
module.exports = function(RED) {

	function dynamodbNode(config) {

		/* 使用モジュール定義 */
		var dynamodb = require("../dynamodb")(RED);
		var moment = require("moment");

		var opts;											// dynamodbへのアクセス情報を格納
		var resultList;										// 取得結果格納用配列

		RED.nodes.createNode(this,config);

		// 検索条件の取得
		this.name = config.name;							// ノード名
		this.operation = config.operation;					// 処理名

		this.TableName = config.tableName;					// 検索対象テーブル名
		this.Limit = config.limit;							// 検索件数
		this.ScanIndexForward = config.sort;				// 並び順

		this.dateCheck = config.dateCheck;					// 期間設定方法
		this.sdate = config.sdate;							// 期間 開始期間
		this.edate = config.edate;							// 期間 終了期間

		this.aggregationCheck = config.aggregationCheck;	// アグリゲーション設定の有無
		this.aggregation = config.aggregation;				// アグリゲーション操作
		this.aggreunit = config.aggreunit;					// アグリゲーション単位
		this.decimalPoint = config.decimalPoint;			// 表示桁数
		this.FilterExpression = "objectKey = :a";
		this.ExpressionAttributeValues = {					// 検索条件値
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

			// dateCheckがdatesetInputの場合は入力されてきた値でsdate,edateを更新
			if (node.dateCheck == "datesetInput") {
				node.sdate = msg.payload.sdate;
				node.edate = msg.payload.edate;
			}

			// sdate, edate共に入力あり かつ sdate<=edateの場合に処理続行
			if (node.sdate == undefined || node.edate == undefined || moment(node.sdate) <= moment(node.edate)) {
				
				// 期間式の設定
				node = dynamodb.expressionSetting(node);

				// DynamoDBパラメータの作成
				opts = dynamodb.serviceSetting (opts, node);

				// DynamoDBへリクエスト
				dynamodb.dynamoRequest(opts, node, function(body) {

					// console.log("\nDynamo検索結果:" + JSON.stringify(body) + "\n");

					if (body.Items != undefined && body.Items.length > 0) {	
						// アグリゲーション処理
						if (node.aggregationCheck == true) {
							resultList = dynamodb.aggregation(body.Items, node);
						} else {
							resultList = body;
						}

						// 桁数変更処理
						if (node.decimalPoint != "noexe") {
							resultList = dynamodb.round(resultList, node);
						}
						
						// resultListを出力へセット
						node.sendMsg(resultList);
					} else {
						console.log("指定条件のデータが見つかりませんでした");
						node.error("DynamoDB - 指定条件のデータが見つかりませんでした");
						node.sendMsg([]);
					}

				});
			} else {
				console.log("期間指定に誤りがあります");
				node.error("DynamoDB - 期間指定に誤りがあります");
				node.sendMsg([]);
			}

		});
	}


	RED.nodes.registerType("DynamoDB", dynamodbNode, {
        credentials: {
            userID: {type:"text"},
            password: {type: "password"}
        }
    });

};
