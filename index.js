'use strict';

const express = require('express');
const compression = require('compression')
const path = require('path');
const cors = require('cors');
const fetch = require('node-fetch');
const CoinMarketCap = require('coinmarketcap-api');
const redis = require("redis").createClient("redis://redistogo:123efeadce9527b1b502760d136a8d33@spinyfin.redistogo.com:10480");
const client = new CoinMarketCap('3b059b3d-b1a4-43ce-8813-02c0b784ccf3');
const RouteCache = require('route-cache');


var failure_checklist = {
	'db_connection_passed': true,
	'ids_data_fetch_passed': true,
	'specific_data_fetch_passed': true,
	'popular_coins_fetch_passed': true,
	'sorted_paginated_data_fetch_passed': true,
}

redis.on("ready", function (err) {
	console.warn("Database ready");
});
redis.on("error", function (err) {
	failure_checklist.db_connection_passed = false;
});



function API() { }

let api = new API();

api.returnSymbolsInString = function (raw_response) {

	let listOfSymbolsWithIds = [];
	raw_response.forEach((item) => {
		listOfSymbolsWithIds.push(item.symbol);
	});

	return listOfSymbolsWithIds.toString();
}

api.returnSymbolsWithIds = function (raw_response) {

	let listOfSymbolsWithIds = [];
	raw_response.forEach((item) => {
		listOfSymbolsWithIds.push({ name: item.name, id: item.id, symbol: item.symbol });
	});

	return listOfSymbolsWithIds;
}
api.insertSymbolsWithIDsInDatabase = function (raw_list) {
	redis.set("ids", JSON.stringify(raw_list));
}
api.getSpecificCoinsData = function (ids) {

	return new Promise((resolve, reject) => {
		client.getQuotes({ id: [ids] })
			.then((res) => {

				resolve(res);
			})
			.catch(e => {
				failure_checklist.specific_data_fetch_passed = false;
				reject(e);
			});
	})

}

api.getPopularCoins = function () {
	return new Promise((resolve, reject) => {
		client.getTickers({ sort: 'market_cap', sortDir: 'desc', limit: 10, start: 1 })
		.then((res) => {
			resolve(res);
		})
		.catch((e) => {
			failure_checklist.popular_coins_fetch_passed = false;
			reject(e)
		});
	})
}

api.getSortedPaginatedCoinsData = function (query) {

	let request = {
		sort: query.sort,
		sortDir: query.asc,
		limit: query.limit,
		start: query.start
	};

	return new Promise((resolve, reject) => {
		client.getTickers({ sort: request.sort, sortDir: request.sortDir, limit: request.limit, start: request.start  })
			.then((res) => {
				resolve(res);
			})
			.catch((e) => {
				failure_checklist.sorted_paginated_data_fetch_passed = false;
				reject(e)
			});
	});

}
api.fetchTodayChartData = function (symbols) {

	console.log('fetch fireed')
	// for each and every single symbol make a historic call and 
	// get historic data from somewhere else  

		fetch('https://pro-api.coinmarketcap.com/v1/cryptocurrency/ohlcv/historical?id=' + symbols, {
			method: 'GET',
			headers: {
				'X-CMC_PRO_API_KEY': '3b059b3d-b1a4-43ce-8813-02c0b784ccf3'
			}
		})
		.then((res) => {
			if(res){
				return res.json();
			}	
		})
		.then((data_unfiltered) => {

			console.log(data_unfiltered.length)

			let graph = [];
			let data = data_unfiltered.data.quotes;
			data.forEach((item) => {
				graph.push({
					date: item.timestamp, 
					value: item.quote.USD.price 
				});
			});


			console.log(graph.length);

			return graph; 
		})
		.catch((e) => {

			console.log('error '+e)
			return []
		});
}
api.attachTodayChartData = function(coin_response){

	let coins_untreated = coin_response.data;
	//let retrievedSymbolsNeededInSingleString = api.returnSymbolsInString(coins_untreated);
	//let todayGraphsOfCoins = api.fetchTodayChartData(retrievedSymbolsNeededInSingleString);

	let coins = coins_untreated.map((item, index) => {

		item = item;
		//item.today = todayGraphsOfCoins[index] coming soon
		item.today = [{
            "date": "Tue Dec 04 2018 10:44:07 GMT-0500 (Eastern Standard Time)",
            "value": 200
        }, {
            "date": "Tue Dec 04 2018 11:44:07 GMT-0500 (Eastern Standard Time)",
            "value": 301
        }, {
            "date": "Tue Dec 04 2018 12:44:07 GMT-0500 (Eastern Standard Time)",
            "value": 402
        }, {
            "date": "Tue Dec 05 2018 01:44:07 GMT-0500 (Eastern Standard Time)",
            "value": 503
        }, {
            "date": "Tue Dec 05 2018 02:44:07 GMT-0500 (Eastern Standard Time)",
            "value": 604
        }, {
            "date": "Tue Dec 05 2018 03:44:07 GMT-0500 (Eastern Standard Time)",
            "value": 705
        }, {
            "date": "Tue Dec 06 2018 04:44:07 GMT-0500 (Eastern Standard Time)",
            "value": 806
        }]


		return  item;
	});

	return coins;
}


client
	.getIdMap({ listingStatus: 'active' })
	.then((res) => {
		let symbol_list = api.returnSymbolsWithIds(res.data);
		api.insertSymbolsWithIDsInDatabase(symbol_list);

	})
	.catch((e) => {
		failure_checklist.ids_data_fetch_passed = false;
	})





//const fs = require('fs');
//const xz = require("xz");
//const file = require('./data_dump.json');
const app = express();
app.use(compression())
app.use(cors());





 


//app.use(express.static(path.join(__dirname, 'build')));

app.get('/', (req, res) => {
	//res.pipe(compression).pipe(outFile).end(200);

	res.send('coinsparta api')
});

app.get('/file', (req, res) => {

	//let fileContent = fs.readFile('data_dump.json');
	inFile.pipe(compression).pipe(outFile);
	res.send(file);
})


app.get('/api/ids' , RouteCache.cacheSeconds(6000), (req, res) => {
	redis.get("ids", function (err, reply) {
		if (err) {
			failure_checklist.ids_data_fetch_passed = false;
			res.sendStatus = 500;
			res.end();
		}
		res.sendStatus = 200;
		res.send(reply);
	});
});

app.get('/api/search', RouteCache.cacheSeconds(60), (req, res) => {

	var specificCoinsData = api.getSpecificCoinsData(req.query.coins);

	//console.log('search api hit')

	specificCoinsData
		.then((coin_response) => {
			res.sendStatus = 200;
			//let output = api.attachTodayChartData(coin_response);
			res.send(coin_response);
		})
		.catch((e) => {
			failure_checklist.specific_data_fetch_passed = false;
			res.sendStatus = 500;
			res.end();
		});

});


app.get('/api/query', RouteCache.cacheSeconds(60) ,(req, res) => {


	var sortedPaginatedCoinsData = api.getSortedPaginatedCoinsData(req.query);

	sortedPaginatedCoinsData
		.then((coin_response) => {
			res.sendStatus = 200;
			//let output = api.attachTodayChartData(coin_response);
			res.send(coin_response);
		})
		.catch((e) => {
			failure_checklist.sorted_paginated_data_fetch_passed = false;
			res.sendStatus = 500;
			res.end();
		});

});


app.get('/api/popular', RouteCache.cacheSeconds(60), (req, res) => {

	

	var popularCoins = api.getPopularCoins();

	popularCoins
		.then((coin_response) => {
			res.sendStatus = 200;
			//let output = api.attachTodayChartData(coin_response);
			res.send(coin_response);
		})
		.catch((e) => {
			failure_checklist.popular_coins_fetch_passed = false;
			res.sendStatus = 500;
			res.end();
		});

});


var port = process.env.PORT || 8081;
app.listen(port);
