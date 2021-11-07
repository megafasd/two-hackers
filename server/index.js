const http = require('http')
const path = require('path')
const express = require('express')
const socketIo = require('socket.io')
const needle = require('needle')
const config = require('dotenv').config()
const TOKEN = process.env.TWITTER_BEARER_TOKEN
const PORT = process.env.PORT || 3000
const bodyParser = require('body-parser');

const app = express()

const server = http.createServer(app)
const io = socketIo(server)

let count = 0;
let mem = 0;
var firstKey = true;


app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../', 'client', 'index.html'))
})

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/server", express.static('./server/'));


let currentKeyword = "projectsagip2021";
//console.log(currentKeyword);

const rulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules'
const streamURL =
    'https://api.twitter.com/2/tweets/search/stream?tweet.fields=id&expansions=author_id,geo.place_id'

var rules = [{ value: currentKeyword }]
    // Get stream rules
async function getRules() {
    const response = await needle('get', rulesURL, {
        headers: {
            Authorization: `Bearer ${TOKEN}`,
        },
    })
    console.log(response.body)
    return response.body
}

// Set stream rules
async function setRules(rules) {
    const data = {
        add: rules,
    }

    console.log("SET " + JSON.stringify(data["add"]));

    const response = await needle('post', rulesURL, data, {
        headers: {
            'content-type': 'application/json',
            Authorization: `Bearer ${TOKEN}`,
        },
    })

    return response.body
}

// Delete stream rules
async function deleteRules(rules) {
    if (!Array.isArray(rules.data)) {
        return null
    }

    const ids = rules.data.map((rule) => rule.id)
    const value = rules.data.map((rule) => rule.value)

    const data = {
        delete: {
            ids: ids,
            value: value,
        },

    }
    console.log("DELETE" + JSON.stringify(data));


    const response = await needle('post', rulesURL, data, {
        headers: {
            'content-type': 'application/json',
            Authorization: `Bearer ${TOKEN}`,
        },
    })

    return response.body
}

function streamTweets(socket) {
    const stream = needle.get(streamURL, {
        headers: {
            Authorization: `Bearer ${TOKEN}`,
        },
    })

    stream.on('data', (data) => {
        try {
            const json = JSON.parse(data)
            console.log(json)
            socket.emit('tweet', json)

        } catch (error) {}
    })

    return stream
}

/*console.log(count)
let counter2 = count;*/
io.on('connection', async() => {
        console.log('Client connected...')
            /* console.log(count++)
             console.log("count2 " + counter2)
             console.log(124 + JSON.stringify(rules))*/
            //let currentRules
        try {
            /* if (counter2 == mem + 1 || firstKey) {
                 if (firstKey) {
                     firstKey = false;
                 }
                 console.log(count++)*/
            //   Get all stream rules
            //currentRules = getRules()
            getRules().then(currentRules => {
                // console.log(count++)
                console.log("CURRENT" + JSON.stringify(currentRules));
                // Delete all stream rules
                deleteRules(currentRules).then(value => {
                    // console.log(count++)
                    console.log("AFTER DELETE");
                    // Set rules based on array aboves
                    setRules(rules).then(value => {
                        //   mem = count++;
                        //  console.log(mem)
                        console.log("AFTER SET");
                    });

                });
            });
            /* } else {
                 counter2 = -5;
             }*/
        } catch (error) {
            console.error(error)
                //count = 0;
            process.exit(1)
        }
        const filteredStream = streamTweets(io);
        let timeout = 0
        filteredStream.on('timeout', () => {
            // Reconnect on error
            console.warn('A connection error occurred. Reconnecting…')
            setTimeout(() => {
                timeout++
                streamTweets(io)
            }, 2 ** timeout)
            streamTweets(io)
        })
    })
    //count = 0;


app.post('/set-keyword', function(req, res) {

    let keyword = req.body.keyword;
    let currentKeyword = keyword;
    console.log(currentKeyword);

    const rulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules'
    const streamURL =
        'https://api.twitter.com/2/tweets/search/stream?tweet.fields=id&expansions=author_id,geo.place_id'

    var rules = [{ value: currentKeyword }]
        // Get stream rules
    async function getRules() {
        const response = await needle('get', rulesURL, {
            headers: {
                Authorization: `Bearer ${TOKEN}`,
            },
        })
        console.log(response.body)
        return response.body
    }

    // Set stream rules
    async function setRules(rules) {
        const data = {
            add: rules,
        }

        console.log("SET " + JSON.stringify(data["add"]));

        const response = await needle('post', rulesURL, data, {
            headers: {
                'content-type': 'application/json',
                Authorization: `Bearer ${TOKEN}`,
            },
        })

        return response.body
    }

    // Delete stream rules
    async function deleteRules(rules) {
        if (!Array.isArray(rules.data)) {
            return null
        }

        const ids = rules.data.map((rule) => rule.id)
        const value = rules.data.map((rule) => rule.value)

        const data = {
            delete: {
                ids: ids,
                value: value,
            },

        }
        console.log("DELETE" + JSON.stringify(data));


        const response = await needle('post', rulesURL, data, {
            headers: {
                'content-type': 'application/json',
                Authorization: `Bearer ${TOKEN}`,
            },
        })

        return response.body
    }

    function streamTweets(socket) {
        const stream = needle.get(streamURL, {
            headers: {
                Authorization: `Bearer ${TOKEN}`,
            },
        })

        stream.on('data', (data) => {
            try {
                const json = JSON.parse(data)
                console.log(json)
                socket.emit('tweet', json)

            } catch (error) {}
        })

        return stream
    }

    console.log(count)
    let counter2 = count;
    io.on('connection', async() => {
        console.log('Client connected...')
        console.log(count++)
        console.log("count2 " + counter2)
        console.log(124 + JSON.stringify(rules))
            //let currentRules
        try {
            if (counter2 == mem + 1 || firstKey) {
                if (firstKey) {
                    firstKey = false;
                }
                console.log(count++)
                    //   Get all stream rules
                    //currentRules = getRules()
                getRules().then(currentRules => {
                    console.log(count++)
                    console.log("CURRENT" + JSON.stringify(currentRules));
                    // Delete all stream rules
                    deleteRules(currentRules).then(value => {
                        console.log(count++)
                        console.log("AFTER DELETE");
                        // Set rules based on array aboves
                        setRules(rules).then(value => {
                            mem = count++;
                            console.log(mem)
                            console.log("AFTER SET");
                        });

                    });
                });
            } else {
                counter2 = -5;
            }
        } catch (error) {
            console.error(error)
            count = 0;
            process.exit(1)
        }
        const filteredStream = streamTweets(io);
        let timeout = 0
        filteredStream.on('timeout', () => {
            // Reconnect on error
            console.warn('A connection error occurred. Reconnecting…')
            setTimeout(() => {
                timeout++
                streamTweets(io)
            }, 2 ** timeout)
            streamTweets(io)
        })
    })
    count = 0;

    res.redirect('/');
});

server.listen(PORT, () => console.log(`Listening on port ${PORT}`))