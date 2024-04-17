import express from 'express';

const app = express();

app.get('/', (req, res, next) => {
    res.json("Welcome to elib project");
});

export default app;