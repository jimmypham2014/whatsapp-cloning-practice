
//importing
import fetch from 'node-fetch'
import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Pusher from 'pusher';
import cors from 'cors';
//app config
const app = express()
const port = process.env.PORT || 9000

//middleware
app.use(express.json())
app.use(cors())

//secure messages these are the cors headers -- allowing requests from any endpoints
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept'
    );
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    next();
  });


//DB config
const connection_url =`mongodb+srv://jimmypro101:sBeBU8MgBw6ZVjzC@cluster0.vfrufr8.mongodb.net/whatsappdb?retryWrites=true&w=majority`
mongoose.connect(connection_url)

const pusher = new Pusher({
    appId: "1474714",
    key: "a7bfdc572ee08aa57ce2",
    secret: "793b340fbabb436e123e",
    cluster: "us3",
    useTLS: true,
  });

const db = mongoose.connection

db.once('open',()=>{
    console.log('DB connected')

    const msgCollection = db.collection('messagecontents')
    const changeStream = msgCollection.watch();
//connect to pusher
    changeStream.on('change', (change)=>{
        console.log("a change has occured",change)

        if(change.operationType === 'insert'){
            const messageDetails = change.fullDocument;
            pusher.trigger('messages','inserted',
                {
                name:messageDetails.name,
                message:messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received,
                }
            );
        } else {
            console.log('Error triggering Pusher')
        }
    });
});

//api routes

app.get("/", (req,res)=>{
    res.status(200).send('hello world ')
});

app.post('/messages/new',(req,res)=>{
    const dbMessage = req.body
    
    Messages.create(dbMessage, (err,data)=>{
        if(err){
            res.status(500).send(err)
        }else{
            res.status(201).send(data)
        }
    })
})

app.listen(port,()=>console.log(`listening on localhost:${port}`))
