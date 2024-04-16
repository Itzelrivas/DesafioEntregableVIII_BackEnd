import { Router } from "express";

const router = Router();

router.get('/login', (request, response) => {
    response.render('githubLogin', {
        style: "viewsSessions.css"
    })
})

export default router;