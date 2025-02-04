import mongoose from "mongoose";

const cursoSchema = new mongoose.Schema({
    name: { type: String, required: true },
    year: { type: Number, required: true },
    tipo: { type: String, required: true }
});