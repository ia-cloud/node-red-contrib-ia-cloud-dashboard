# node-red-contrib-ia-cloud-dashboard

## 名称
ia-cloud　データ取得・変換・可視化ノード



## 機能概要

このノードは、[node-red-contrib-ia-cloud-fds](https://github.com/ia-cloud/node-red-contrib-ia-cloud-fds)によりia-cloud Center Server（CCS）へ格納されたオブジェクトを取得・変換し、ダッシュボードを用いて可視化を行うノードの集合体です。

## ノード一覧
以下のノードが保存されています。  

- ### CCSへ格納されたオブジェクトの取得・変換に関するノード

|ノード名|説明|
|:-|:-|
|[dynamodb-iacloud](dynamodb-iacloud)|DynamoDBに格納されたia-cloudオブジェクトを取得|
|[getChartdata-iacloud](getchartdata-iacloud)|DynamoDBに格納されたia-cloudオブジェクトを取得し、アグリゲーション・表示名変更を行った後にdashborad - chartへ入力する際の形に変換|
|[getLatestdata-iacloud](getlatestdata-iacloud)|DynamoDBに格納されたia-cloudオブジェクトを取得し、dashboradの各ウィジェットへ入力する際の形に変換|

- ### ダッシュボードを用いて可視化を行うノード
「ノード：[node-red-contrib-dashboard](https://github.com/node-red/node-red-dashboard)」内のウィジェット追加方法[[Creating New Dashboard Widgets](https://github.com/node-red/node-red-dashboard/wiki/Creating-New-Dashboard-Widgets)]を参考に実装

|ノード名|説明|
|:-|:-|
|[ui-dateset](ui-dateset)|ダッシュボードから開始日時・終了日時を取得|
|[ui-oprstatus](ui-oprstatus)|入力値を基にダッシュボードへ稼働状況グラフを表示|
|[ui-table](ui-table)|入力値を基にダッシュボードへテーブル(表)を表示|
|[ui-spreadsheet](ui-spreadsheet)|ia-cloud アラーム&イベントモデルデータの集計を行いダッシュボードへテーブル(表)形式で表示|
|[ui-bar_gauge](ui-bar_gauge)|入力値を基にダッシュボードへバーゲージを表示|
|[ui-lamps](ui-lamps)|入力値を基にダッシュボードへ表示灯を表示|
|[ui-num_dt](ui-num_dt)|入力値を基にダッシュボードへ「数値」もしくは「日時」を表示|

