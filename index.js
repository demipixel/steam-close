var request = require('request');
var gd = require('node-gd');
var options = require('minimist')(process.argv.slice(2), {
  string: 'id',
  default: {
    json: false,
    log: false,
    depth: 10,
    minTarget: 40
  }
});

if (options.errors) {
  console.log('Unknown argument(s): "'+options.errors.join('", "')+'"');
  process.exit(-1);
}

var STEAM_ID = options.id;
var STEAM_API_KEY = options.key;

var usage = () => {
  console.log('Usage: node index --key <STEAM_API_KEY> --id <START_STEAM_ID> [--minTarget <amt>] [--depth <depth>] [--log] [--json]');
  console.log('Ex: node index --key 6TNFKC485FEJ --id 76503663745346 --json');
  console.log('Type node index --h for help');
  process.exit(-1);
}

if (options.h || options.help) {
  console.log('Options:');
  console.log('--key <key>: Your Steam API key. Get it here: https://steamcommunity.com/dev/apikey');
  console.log('--id <id>: The starting steam ID');
  console.log('--minTarget <amt>: The minimum amount of targets to choose per depth. Affects how many results returned at end. Default is 40.');
  console.log('--depth <depth>: How many friends of friends of friends it will go down. Default is 10.');
  console.log('--log: Log stuff');
  console.log('--json: Output in form of nodes at end');
  console.log('');
  console.log('You can use --json and take the output to get a pretty display at <TO_BE_BUILT_SOON>');
  process.exit(-1);
} else if (!STEAM_ID || !STEAM_API_KEY) usage();

var FRIEND_URL = 'http://api.steampowered.com/ISteamUser/GetFriendList/v0001/?key='+STEAM_API_KEY+'&relationship=friend&steamid=';
var SUMMARY_URL = 'http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key='+STEAM_API_KEY+'&steamids=';

var allFriends = {};
var friendCount = {};

friendCount[STEAM_ID] = 1;

function start(maxDepth, cb) {
  if (options.log) console.log('DEPTH '+maxDepth)
  if (maxDepth == 0) return cb ? cb() : null;
  var targets = getTargets();
  var doneCount = 0;
  var done = () => {
    doneCount++;
    if (doneCount != targets.length) return;
    start(maxDepth-1, cb);
  };
  targets.forEach(target => {
    if (allFriends[target] != undefined) return done();
    var tryLoad = (fails) => {
      request(FRIEND_URL+target, (err, header, data) => {
        try {
          if (data.length < 5) {
            allFriends[target] = null;
            done();
            return;
          }
          parseFriendsList(target, JSON.parse(data));
          done();
        } catch (err) {
          if (options.log && fails > 5) { console.log('Could not load friends list for '+target+' (fail '+fails+')',data); done(); }
          else setTimeout(function() { tryLoad(fails+1) }, 50);
        }
      });
    }
    tryLoad(0);
  }); 
}

function finish(fails) {
  fails = fails || 0;
  var winners = getTargets().sort((a,b) => friendCount[a] < friendCount[b]);
  request(SUMMARY_URL+winners.join(','), (err, header, data) => {
    var players;
    try {
      players = JSON.parse(data).response.players;
      winners = players.map(player => player.steamid);
      /*players.forEach(player => {
        console.log(player.personaname + ' -> ' + player.profileurl);
      });*/
    } catch (err) {
      if (fails > 5) { console.log(SUMMARY_URL+winners.join(','),data); throw err; }
      else return finish(fails+1);
    }

    if (options.json) {
      console.log('');
      console.log('');
      console.log('JSON:');
      console.log('');
      console.log('');
      var output = [];
      winners.forEach((winner, index) => {
        if (!allFriends[winner]) {
          allFriends[winner] = [];
          Object.keys(allFriends).forEach(user => {
            if (allFriends[user] && allFriends[user].indexOf(winner) != -1) allFriends[winner].push(user);
          });
        }
      });
      winners.forEach((winner, index) => {
        var connections = allFriends[winner].filter(id => winners.indexOf(id) != -1).map(id => winners.indexOf(id));
        output.push({
          name: players[index].personaname,
          link: players[index].profileurl,
          size: connections.length,
          connections: connections,
          image: players[index].avatarfull
        });
      });
      console.log(JSON.stringify(output));
    }
  });
}

function parseFriendsList(original, list) {
  list = list.friendslist.friends;
  var map = list.map(f => f.steamid);
  allFriends[original] = map;
  map.forEach(friendId => {
    friendCount[friendId] = (friendCount[friendId] || 0) + 1;
  });
}

function getTargets() {
  var MIN_AMT = options.minTarget;
  var prev;
  for (var count = 1; count < 40; count++) {
    var curr = [];
    Object.keys(friendCount).forEach(id => {
      if (friendCount[id] >= count) curr.push(id);
    });
    if (curr.length < MIN_AMT) return prev || curr;
    prev = curr;
  }
  return prev;
}

start(options.depth, () => finish());