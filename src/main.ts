

//making new typescript code

//TODO: ACTUALLY ADD TYPES TO THE CODE





//TODO: ask br to help with correct typing
//require('dotenv').config();
const { default: axios } = require('axios')
const RPC = require('discord-rpc')
const fs = require('fs')
//change for web server hosted images on v2
//const images = "https://test2rpcimages.vercel.app"
const rpc = new RPC.Client({
    transport: "ipc"
})

const DISCORD_CLIENT_ID = '1016530131516391455'


let start
let inGame = false

async function main(){
    const readline = require('readline')

    async function getOrPromptConfig(): Promise<string> {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        })

        const question = (prompt: string): Promise<string> =>
            new Promise(resolve => rl.question(prompt, resolve))

        try {
            const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'))
            if (config.robloxUserId) {
                console.log(`Current Roblox User ID: ${config.robloxUserId}`)
                const answer = await question('Keep this ID? (y/n): ')
                if (answer.toLowerCase() === 'y') {
                    rl.close()
                    return config.robloxUserId
                }
            }
        } catch {
            // no config yet
        }

        console.log("==========================================")
        console.log("Windgate Rich Presence")
        console.log("==========================================")
        console.log("How to use:")
        console.log("Option A(recommended): follow the windgate_rpc Roblox account and enable joins for connections and people you follow")
        console.log("Option B: friend the windgate_rpc Roblox account and message ptgbr on Discord")
        console.log("windgate_rpc Roblox account: https://www.roblox.com/users/10635730283/profile")
        console.log("==========================================")

        const userId = await question('Enter your Roblox User ID: ')
        rl.close()
        fs.writeFileSync('config.json', JSON.stringify({ robloxUserId: userId }))
        return userId
    }
    const ROBLOX_USER_ID: any = await getOrPromptConfig()

    //urls
    const serverUrl = "https://windgaterpcserver-production.up.railway.app"
    const presenceUrl = `${serverUrl}/getpresence`
    const getPlaceDataUrl = `${serverUrl}/getplacedata`

    async function getMenuImage(): Promise<string | undefined> {
    try {
        const response = await axios.get(`https://api.github.com/repos/pedromlabio/windgate_rpc_images/contents/misc/MENU.png`)
        return response.data.download_url
        } catch {
        return undefined
        }
    }

    async function getRandomCellImage(worldCode: string, cellString: string): Promise<string | undefined> {
    try {
        const response = await axios.get(`https://api.github.com/repos/pedromlabio/windgate_rpc_images/contents/worlds/world${worldCode}/${cellString}`)
        const files = response.data.filter((f: any) => f.name.endsWith('.png'))
        if (files.length === 0) return undefined
        const random = files[Math.floor(Math.random() * files.length)]
        return random.download_url
    } catch {
        return undefined
    }
}

    async function processPresence(robloxPresence){
        let data
        let universeId = robloxPresence.universeId

        if(universeId != 1250803741){
            if(inGame){inGame = false}

            //console.log(universeId)
            data = {
                details: "In Different Game",
                state: "In Game",
                largeImageKey: "https://static.wikia.nocookie.net/projoot-testing/images/e/e6/Site-logo.png/revision/latest?cb=20210603012513"
            }
        }else{
            //user is in windgate proceed with checkings
            let placeId = robloxPresence.placeId
            //console.log(placeId)
            if(placeId == 3540051865){
                //console.log("menu")
                //menu
                if(!inGame){start = new Date().getTime(); inGame = true}

                let imageLink = await getMenuImage()//`${images}/misc/MENU.png`
                data = {
                    details: "Playing Windgate",
                    state: "In Menu",
                    largeImageKey: imageLink,
                    startTimestamp: start
                }
            }else{
                if(!inGame){start = new Date().getTime(); inGame = true}
                //in world
                let placeData = await getPlaceData(placeId)
                let dataArray = placeData.split(":")
                let world = dataArray[0]
                let cellCode = dataArray[1].split(",")
                let worldArray = world.split(".")
                let worldCode = ("").concat(worldArray[0], worldArray[1]);
                //console.log(world)
                //console.log(cellCode)
                //cell checking
                //TODO ASK BR IF IT'D BE BETTER TO HAVE TWO INLINE VAR DECLARATIONS TO MAKE CODE SMALLER
                if(cellCode[0] == 3 && cellCode[1] == 3){
                    //C
                    let imageLink2 = await getRandomCellImage(worldCode, 'C')//`${images}/worlds/world${worldCode}/C.png`
                    data = {
                        details: `World: ${world}`,
                        state: "Cell: C",
                        largeImageKey: imageLink2,
                        startTimestamp: start
                    }
                }else{
                    //user is in a different cell, begin to process info
                    let x = Number(cellCode[0]);
                    let y = Number(cellCode[1]);
                    let cellString = "";
                    switch(y){
                        case 1:
                            //NN
                            cellString = cellString.concat("NN");
                            break;
                        case 2:
                            //N
                            cellString = cellString.concat("N");
                            break;
                        case 3:
                            //null
                            break;
                        case 4:
                            //S
                            cellString = cellString.concat("S");
                            break;
                        case 5:
                            //SS
                            cellString = cellString.concat("SS");
                            break;
                    }
                    switch(x){
                        case 1:
                            //WW
                            cellString = cellString.concat("WW");
                            break;
                        case 2:
                            //W
                            cellString = cellString.concat("W");
                            break;
                        case 3:
                            //null
                            break;
                        case 4:
                            cellString = cellString.concat("E");
                            break;
                        case 5:
                            cellString = cellString.concat("EE");
                            break;
                    }
                    let worldArray = world.split(".")
                    let worldCode = ("").concat(worldArray[0], worldArray[1])
                    let imageLink2 = await getRandomCellImage(worldCode, cellString)//`${images}/worlds/world${worldCode}/${cellString}.png`
                    data = {
                        details: `World: ${world}`,
                        state: `Cell: ${cellString}`,
                        largeImageKey: imageLink2,
                        startTimestamp: start
                    }
                }
            }
        }
        return data
    }

    async function getPlaceData(id){
        try{
            const response = await axios.get(`${getPlaceDataUrl}?id=${id}`)
            return response.data[0].name
        }catch(error: any){
            console.error(error.response.data)
        }
    }

    async function getData(){
        //TODO ADD TRY CATCH
        const response = await axios.get(`${presenceUrl}?id=${ROBLOX_USER_ID}`)

        let userPresence = response.data.userPresences[0]

        let data = {}
        let presenceType = Number(userPresence.userPresenceType)

        switch(presenceType){

            case 0:
                if(inGame){inGame = false}
                //offiline
                data = {
                    details: "Not in Game",
                    state: "Offline",
                    largeImageKey: "https://static.wikia.nocookie.net/projoot-testing/images/e/e6/Site-logo.png/revision/latest?cb=20210603012513"
                }
                break
            case 1:
                if(inGame){inGame = false}
                //website
                data = {
                    details: "Not in Game",
                    state: "Website",
                    largeImageKey: "https://static.wikia.nocookie.net/projoot-testing/images/e/e6/Site-logo.png/revision/latest?cb=20210603012513"
                }
                break
            case 2:
                //in game
                data = await processPresence(userPresence)
                break
        } 
        return data
    }

    async function updatePresence(rpcData){
        rpc.setActivity(rpcData)
    }

    rpc.on("ready", async () => {
        let data = await getData()
        updatePresence(data)

        setInterval(async () => {
            data = await getData()
            updatePresence(data)
        }, 5e3)
        console.log("active")
    })

    rpc.login({
        clientId: DISCORD_CLIENT_ID
    })
}
main()