import { Router } from "express";
import userModel from "../models/user.model.js";

const router = Router();

//Ruta users/register para mostrar el forms de loguear usuarios (GET)
router.get("/login", (request, response) => {
    response.render('login', {
        style: "viewsSessions.css"
    })
});

//ruta que nos muestra la información del usuario logueado 
router.get("/current", (request, response) => {
    const user = request.session.user
    response.render('current', { user })
});

//Ruta users/register que muestra el forms para registrar nuevos usuarios (GET) ✅
router.get("/register", (request, response) => {
    response.render('register', {
        style: "viewsSessions.css"
    })
});

//Ruta users/registerRef/:email para ver el cart referenciado al usuario (verificamos que la population funcione) ✅
router.get("/registerRef/:email", async (request, response) => {
    try {
        let user_email = request.params.email
        const user = await userModel.findOne({email: user_email}).populate('cart')
        console.log("Se pudo acceder con exito al usuario.")
        response.send(user)
    } catch (error) {
        console.error("Ha surgido este error: " + error);
        response.status(500).send('<h2 style="color: red">¡Oh oh! Ha surgido un error y no se pueden mostrar el usuario.</h2>');
    }
});

//Ruta para destruir la sesión 
router.get("/logout", (request, response) => {
    request.session.destroy(error => {
        if (error){
            response.json({error: "error logout", mensaje: "Error al cerrar la sesion"});
        }
        response.redirect('/users/login');
    });   
});

export default router;