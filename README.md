# node-red-contrib-ia-cloud-dashboard

## 名称
ia-cloud　データ取得・変換・可視化ノード



## 機能概要

このノードは、[node-red-contrib-ia-cloud-fds](https://github.com/ia-cloud/node-red-contrib-ia-cloud-fds)によりia-cloud Center Server（CCS）へ格納されたオブジェクトを取得・変換し、ダッシュボードを用いて可視化を行うノードの集合体です。

## ノード一覧
以下のノードが保存されています。  

- ### dynamodb-iacloud
  DynamoDBに格納されたia-cloudオブジェクトを取得するノード  
  
- ### getChartdata-iacloud
  DynamoDBに格納されたia-cloudオブジェクトを取得し、アグリゲーション・表示名変更を行った後にdashborad - chartへ入力する際の形に変換するノード  

- ### getLatestdata-iacloud
  DynamoDBに格納されたia-cloudオブジェクトを取得し、dashboradの各ウィジェットへ入力する際の形に変換するノード 

- ### json2inchart-iacloud
  json入力をdashborad - chartへ入力する際の形に変換するノード  

- ### json2inLatest-iacloud
  json入力をdashboradの各ウィジェットへ入力する際の形に変換するノード 

- ### json2csv-iacloud
  json入力をcsv形式へ変換することができるノード   

- ### ui-porstatus
  「ノード：[node-red-contrib-dashboard](https://github.com/node-red/node-red-dashboard)」内のウィジェット追加方法[[Creating New Dashboard Widgets](https://github.com/node-red/node-red-dashboard/wiki/Creating-New-Dashboard-Widgets)]を参考に実装したノード   
  入力値を基にダッシュボードへ稼働状況グラフを表示するノード  
- ### ui-table
  「ノード：[node-red-contrib-dashboard](https://github.com/node-red/node-red-dashboard)」内のウィジェット追加方法[[Creating New Dashboard Widgets](https://github.com/node-red/node-red-dashboard/wiki/Creating-New-Dashboard-Widgets)]を参考に実装したノード  
  入力値を基にダッシュボードへテーブル(表)を表示するノード  

- ### ui-spreadsheet
  「ノード：[node-red-contrib-dashboard](https://github.com/node-red/node-red-dashboard)」内のウィジェット追加方法[[Creating New Dashboard Widgets](https://github.com/node-red/node-red-dashboard/wiki/Creating-New-Dashboard-Widgets)]を参考に実装したノード  
  ia-cloud アラーム&イベントモデルデータの集計を行いダッシュボードへテーブル(表)形式で表示するノード 

- ### ui-bar_gauge
  「ノード：[node-red-contrib-dashboard](https://github.com/node-red/node-red-dashboard)」内のウィジェット追加方法[[Creating New Dashboard Widgets](https://github.com/node-red/node-red-dashboard/wiki/Creating-New-Dashboard-Widgets)]を参考に実装したノード  
  入力値を基にダッシュボードへバーゲージを表示するノード 

- ### ui-lamps
  「ノード：[node-red-contrib-dashboard](https://github.com/node-red/node-red-dashboard)」内のウィジェット追加方法[[Creating New Dashboard Widgets](https://github.com/node-red/node-red-dashboard/wiki/Creating-New-Dashboard-Widgets)]を参考に実装したノード  
  入力値を基にダッシュボードへ表示灯を表示するノード 

- ### ui-num_dt
  「ノード：[node-red-contrib-dashboard](https://github.com/node-red/node-red-dashboard)」内のウィジェット追加方法[[Creating New Dashboard Widgets](https://github.com/node-red/node-red-dashboard/wiki/Creating-New-Dashboard-Widgets)]を参考に実装したノード  
  入力値を基にダッシュボードへ「数値」もしくは「日時」を表示するノード 
