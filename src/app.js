import express from 'express';
import handlebars from 'express-handlebars';
import __dirname from '../utils.js';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import { messagesModel } from './models/messages.model.js';
//Dependencias para las sessions 
import session from 'express-session'; 
import MongoStore from 'connect-mongo';
//Agrego los Passport imports
import passport from 'passport';
import initializePassport from './config/passport.config.js';
//importamos mis archivos de routes
import productsRoutes from './routes/products.router.js'
import cartsRoutes from './routes/carts.router.js'
import homeHandlebars from './routes/views.router.js'
import usersRoutes from './routes/usersViews.router.js'
import sessionsRoutes from './routes/sessions.router.js'
import githubLoginRouter from '../src/routes/githubLoginViews.router.js'

const app = express();
const PORT = 9090;

//Preparar la configuracion del servidor para recibir objetos JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Uso de vista de plantillas
app.engine('handlebars', handlebars.engine());
app.set('view engine', 'handlebars');
app.set('views', __dirname + "/src/views");

// Indicamos que vamos a trabajar con archivos estaticos
app.use(express.static(__dirname + "/src/public"))//Antes solo estaba /public

//Conexión con Mongo 
const URL_MONGO = 'mongodb+srv://Itzelrivas0803:R1v450803@cluster0.zqvjwvn.mongodb.net/ecommerce?retryWrites=true&w=majority&appName=Cluster0'

//Lógica de la creación de sesiones cuando un usuario se loguea ✅ 
app.use(session({
	store: MongoStore.create ({
		mongoUrl: URL_MONGO,
		//mongoOptions: { useNewUrlParser: true, useUnifiedTopology: true }, las eliminamos porque están obsoletas y no tienen efecto en la versión que tengo de mongo
		ttl: 5 * 60
	}),
	secret: "coders3cr3t",
	resave: false, //guarda en memoria
	saveUninitialized: true //lo guarda a penas se crea
}))


//Middlewares Passport 
initializePassport();
app.use(passport.initialize());
app.use(passport.session());

//Puntos de entrada para routes:
app.use('/api/products', productsRoutes)
app.use('/api/carts', cartsRoutes)
app.use('/handlebars', homeHandlebars)
app.use('/users', usersRoutes);
app.use('/api/sessions', sessionsRoutes); //Ruta para agregar usuarios con postMan (posts)
app.use("/github", githubLoginRouter)

const httpServer = app.listen(PORT, () => {
	console.log(`Server run on port: ${PORT}`);
})

//Instanciamos socket.io
export const socketServer = new Server(httpServer);

//Creamos el array para guardar mis mensajes
const messages = []
socketServer.on('connection', socket => {
	console.log('Un cliente se ha conectado.');

	//Con esto las personas pueden ver los mensajes anteriores
	socketServer.emit('messageLogs', messages);

	socket.on("message", async data => {
		try {
			//Agregamos la data a nuestro array:
			messages.push(data)
			//Actualizamos nuestra base de datos:
			const existingUserMessage = await messagesModel.findOne({ user: data.user });
			if (existingUserMessage) {
				await messagesModel.updateOne({ user: data.user }, { $push: { message: data.message } });
			} else {
				await messagesModel.create(data);
			}
			//enviamos todos los mensajes para que se impriman en tiempo real
			socketServer.emit('messageLogs', messages);
		} catch (error) {
			console.error("Error al guardar el mensaje:", error);
		}
	});

	//Salgo del chat
	socket.on('closeChat', data => {
		if (data.close === "close")
			socket.disconnect();
	})
})


//Mongo
const connectMongoDB = async () => {
	try {
		mongoose.connect(URL_MONGO)
	} catch (error) {
		console.error("No se pudo conectar a la base de datos usando Mongoose debido a: " + error)
		process.exit()
	}
}
connectMongoDB();