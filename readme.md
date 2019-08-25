const http = require("http");
const request = require('request');
const coinList = require('./coins');

//var rtg = require("url").parse(process.env.REDIS_URL);
var redis = require("redis").createClient(
  "redis://redistogo:123efeadce9527b1b502760d136a8d33@spinyfin.redistogo.com:10480"
);

redis.on("ready", function(err) {
  console.log("Ready");
});
redis.on("error", function(err) {
  console.log("Error " + err);
});

/*
> console.log(Buffer.from("Hello World").toString('base64'));
SGVsbG8gV29ybGQ=
> console.log(Buffer.from("SGVsbG8gV29ybGQ=", 'base64').toString('ascii'))
Hello World
*/




function gatherSymbols(rawChunkResponseFromApiFetch){

let a = Buffer.from(rawChunkResponseFromApiFetch, 'base64').toString();

console.log(a)

/*
 var symbolArray =  [];

  var objectContainingListOfSymbols = res.Data;
  for (var symbol in objectContainingListOfSymbols) {
    if (objectContainingListOfSymbols.hasOwnProperty(symbol)) {
        symbolArray.push(objectContainingListOfSymbols[symbol].Symbol);
    }
  }

  console.log(symbolArray);*/
}





function getListOfCoins(){
  const list = coinList();
  console.log(list);
}
getListOfCoins();


/*
async generateData(){

  var todayChart = await generatedTodayChart();
  var weeklyChart = await generatedWeeklyChart();
  var monthlyChart = await generatedMonthlyChart();

  return {
    name: nameData,
    about: aboutData,
    symbol: symbolData,
    priceUSD: priceUSDData,
    priceUSDStart: priceStartData,
    img: imageData,
    volume: volumeData,
    today: todayChart,
    weekly: weeklyChart,
    monthly: monthlyChart
  }
}
generateData().then((data) => {
    redis.set("coins", data);
});
const data = redis.get("coins", function(err, reply) {
    return reply;
});

//const hostname = '127.0.0.1';


*/

const port = process.env.PORT || 8080;
const server = http.createServer((req, res) => {
  res.write('greetings')
  res.end();
});

server.listen(
  port,
  /*hostname,*/ () => {
    console.log(`Server running at http://${port}/`);
  }
);

console.log(`Worker ${process.pid} started`);
