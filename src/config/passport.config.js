//Importamos librerias 
import passport from 'passport';
import passportLocal from 'passport-local';
import GitHubStrategy from 'passport-github2';
import userModel from '../models/user.model.js';
import { cartsModel } from '../models/carts.model.js'; 
import { createHash, isValidPassword } from '../../utils.js'; //Funciones de encriptacion que creamos con bcrypt


//Declaramos nuestra estrategia:
const localStrategy = passportLocal.Strategy;

const initializePassport = () => {
    //Estrategia para registrar/crear un nuevo usuario 
	passport.use('register', new localStrategy(
		{ passReqToCallback: true, usernameField: 'email' }, 
		async (request, username, password, done) => { 
			const { first_name, last_name, email, age, cart, role } = request.body
			try {
				//Validamos si ya hay un usuario registrado con el mismo correo:
				const exists = await userModel.findOne({ email })
				if(exists){
					console.log ("El usuario ya existe!!");
					return done(null, false)
				} else{
                    //Verificamos que exista el carrito asociado, en caso de tenerlo y si no se asigna como null
                    const cartId = request.body.cart;
                    let idCart
                    if(cartId.trim() !== ""){
                        const cart = await cartsModel.findOne({ id: cartId });
                        if (!cart) {
                            console.log("El carrito no existe!");
                            return done("El carrito no existe!");
                        }else{
                            idCart = cart._id
                        }
                    }
                    else{
                        idCart = null
                    }

					//Si el usuario no existe en la bd, lo damos de alta
					const user = {
						first_name,
						last_name, 
						email, 
						age,
						password: createHash(password), //Guardamos la password hasheada
                        //cart: cart._id, 
                        cart: idCart,
                        role
					}
					const result = await userModel.create(user); //Cargamos el usuario en la base de datos
					return done(null, result)
				}
			} catch(error){
				return done("Error registrando el usuario: " + error)
			}
        }
    ))

    //Estrategia para iniciar sesión normal ✅
    passport.use('login', new localStrategy(
		{passReqToCallback: true, usernameField: 'email'},
		async (request, username, password, done) => {
			try {
				const user = await userModel.findOne({ email: username })
				console.log("Usuario encontrado para login:");
				console.log(user);
				
				if (!user){
					console.warn("Invalid credentials for user: " + username)
					return done (null, false)
				}
				
                //Validamos usando Bvcrypt credenciales del usuario
                if (!isValidPassword (user, password)){
                    console.warn ("Invalid credentials for user: " + username)
                    return done(null, false)
                }

                //Asignamos roles
                if(username === 'adminCoder@coder.com' && password === 'adminCod3r123'){
                    user.role = 'admin'
                } else if(!user.role){
                    user.role = 'user'
                }
                
                return done(null, user)
			
            }catch (error) {
                return done(error)
            }
	    }
    ))

    //Estrategia para la serealización 
    passport.serializeUser((user, done) => {
		done (null, user._id)
	})
	
    //Estrategia para la deserealización 
	passport.deserializeUser(async (id,done) => {
		try {
			let user = await userModel.findById(id);
			done (null,user)
		} catch (error) {
			console.error("Error deserializando el usuario: " + error)
		}
	})

	//Estrategia para iniciar sesión con GitHub:
    passport.use('github', new GitHubStrategy(
        {
            clientID: 'Iv1.da06c93c986d9b1b', 
            clientSecret: '87d8a9dd5930b0fc93267ed871c526f940594974',
            callbackUrl: 'http://localhost:9090/api/sessions/githubcallback'
        }, async (accessToken, refreshToken, profile, done) => {
            console.log("Profile obtenido del usuario:");
            console.log(profile);
            try {
                const user = await userModel.findOne({ email: profile._json.email });
                console.log("Usuario encontrado para login:");
                console.log(user);

                if (!user) {
                    console.warn("User doesn't exists with username: " + profile._json.email);

                    let newUser = {
                        first_name: profile._json.login, //Lo puse asi porque estoy registrada bien raramente en GitHub y tengo el name (y el correo) en nulo jajaja
                        last_name: '',
                        age: 18,
                        email: profile._json.email,
                        password: '',
                        role,
                        loggedBy: 'GitHub'
                    }

                    const result = await userModel.create(newUser)
                    return done(null, result)
                } else {
                    //El usuario ya existe, entonces ya solo entramos:
                    return done(null, user)
                }
            } catch (error) {
                return done(error)
            }
        }
    ))
}

export default initializePassport;