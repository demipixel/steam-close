# steam-close
Exports nodes for demipixel/node-viewer that connect steam friends

## Basic Usage

If you have no idea what you're doing, you're probably just going to do this:

- "Download as Zip"
- Go to your console or command prompt
- "cd" to the folder (search online how to do this)
- Type: `node index node index --key <STEAM_API_KEY> --json --log --minTarget 100 --depth 2 --id <Steam Community ID>`
- Change the Steam API Key (get one online, free), minTarget (that's the minimum amount of friends to output at the end), maybe the depth (how many friends of friends), and the steam community ID (starts with 765...)
- Copy the JSON output (will say JSON: and then a bunch of text) and paste it into demipixel/node-viewer. I will have an online version soon :)

## People who know what they're doing

Outputs nodes in a format demipixel/node-viewer accepts in json. Looks at your friends, then takes those and gets their friends, etc. Each time it gets the top (or more) --minTarget friends and get theirs, meaning it's not ultra intensive at depth 10 (although the results aren't as good. Turn it to like 9999999 if you want it to spread out. Results will vary.)

### Options

- key (required): Steam API Key (https://steamcommunity.com/dev/apikey)
- json: Output JSON?
- log: Log some extra information
- minTarget: Minimum number of people selected each round to get their friends. Also the minimum number of friends outputted at the end
- depth: How many layers to search. I've found that higher numbers only resulted in getting a lot of popular people, so 2 (maybe 3) is much better for results
- id: Steam Community ID (starts with 765...)
- h or help: Everything above.