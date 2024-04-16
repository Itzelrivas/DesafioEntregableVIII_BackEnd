import { Router } from 'express';
import passport from 'passport';

const router = Router();

//Ruta para iniciar sesion con gitHub
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }), async (request, response) => {

})

//Ruta que se renderiza al inicar sesión con GitHub ✅
router.get('/githubcallback', passport.authenticate('github', { failureRedirect: '/api/sessions/fail-login' }), async (request, response) => {
    const user = request.user

	//Asignamos roles
	if(user.email === 'adminCoder@coder.com'){
		user.role = 'administrador'
	}

	//Creamos la sesión 
    request.session.user = {
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        age: user.age,
		role: user.role
    }
    
    response.redirect("/handlebars/home")
})

//Ruta users/register para registrar nuevos usuarios (POST) ✅ 
router.post("/register", passport.authenticate('register', { failureRedirect: '/api/sessions/fail-register' }), async(request, response) => {
	console.log("Registrando nuevo usuario.");
	response.status(200).send({ status: 'success', message: "User creado de forma exitosa!!" })
})

//Ruta users/login para loguear usuarios (POST)
router.post("/login", passport.authenticate('login', { failureRedirect: '/api/sessions/fail-login' }), async (request, response) => { 
	console.log("User encontrado:");
	const user = request.user;
	console.log(user);
	
	if(!user){ 
        return response.status(401).send({ status: "error", error: "El usuario y la contraseña no coinciden!" });
    }
	
	request.session.user = {
		name: `${user.first_name} ${user.last_name}`,
		email: user.email, 
		age: user.age,
        role: user.role,
	}

	response.send({ status: "success", payload: request.session.user, message: "Primer logueo realizado! :)" });
})


router.get("/fail-register", (request, response) => {
	response.status(401).send({ error: "Failed to process register!" }) ;
})
	
router.get("/fail-login", (request, response) => {
	response.status(401).send({ error: "Failed to process login!" });
})

export default router;