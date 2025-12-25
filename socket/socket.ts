import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { registerUserEvent } from './userEvent.js';
import { registerChatEvents } from './chatEvents.js';
import Conversation from '../models/Conversation.js';


dotenv.config();

export function intializedSocket(server : any) : SocketIOServer{
    const io = new SocketIOServer(server, {
        cors : {
            origin : "*"
        }
    });

    io.use((socket: Socket, next) => {
        const token = socket.handshake.auth.token;
        if(!token){
            return next(new Error("Token topilmadi, auth xatoligi"));
        }
        jwt.verify(token, process.env.JWT_SECRET as string, (err : any, decoded : any)=> {
            if(err){
                return next(new Error("Token nosozligi"));
            }

            let userData = decoded.user;
            socket.data = userData;
            socket.data.userId = userData.id;
            next();
        })
    })

    io.on('connection', async(socket : Socket) => {
        const userId = socket.data.userId;
        console.log(`User connected : ${userId}`);

        registerChatEvents(io, socket);
        registerUserEvent(io, socket);

        try {
            const conversations = await Conversation.find({
                participants : userId
            }).select("_id");

            conversations.forEach(conversation => {
                socket.join(conversation._id.toString());
            })
        } catch (error : any) {
            console.log("Error joining conversation: ", error)
        }
        socket.on('disconnect', () => {
            console.log(`User disconnected : ${userId}`);
        })
    })
 
    return io;
}
