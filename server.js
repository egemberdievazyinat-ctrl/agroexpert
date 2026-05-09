const express = require("express");
const cors = require("cors");

require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

const path = require("path");

const app = express();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

app.use(cors());
app.use(express.json());

// временная база
let researchDB = {};

// показываем HTML
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "agroexpert_v2.html"));
});

// генерация кода
let researchCounter = 1;

function generateCode() {

    const now = new Date();

    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear()).slice(-2);

    const datePart = `${day}${month}${year}`;

    const idPart = String(researchCounter).padStart(3, "0");

    const code = `AG-${idPart}-${datePart}`;

    researchCounter++;

    return code;
}

// добавить исследование
app.post("/add-research", async (req, res) => {

    const code = generateCode();

   const data = {
    access_code: code,

    client_name: req.body.clientName,
    visit_date: req.body.visitDate,

    location: req.body.location,
    culture: req.body.culture,

    ph: req.body.ph,
    nitrogen: req.body.nitrogen,
    phosphorus: req.body.phosphorus,
    potassium: req.body.potassium,
    humus: req.body.humus,
    salinity: req.body.salinity,

    recommendations: req.body.recommendations
};

  

    const { error } = await supabase
    .from("research_results")
    .insert([data]);

if (error) {
    console.log("Ошибка базы:", error);

    return res.status(500).json({
        error: "Ошибка сохранения"
    });
}  
    researchDB[code] = data;

    res.json({
        success: true,
        accessCode: code
    });
});

// получить результаты
app.get("/results/:code", async (req, res) => {
  const code = req.params.code;
  
  console.log("Ищем код:", code);

  const cleanCode = code.trim();
  
  const { data, error } = await supabase
  .from("research_results")
  .select("*")
  .eq("access_code", cleanCode);
    
    console.log("Что вернула база:", data, error);

  if (error || !data.length) {
    return res.status(404).json({
      error: "Код не найден"
    });
  }

  return res.json(data[0]);
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    return res.status(401).json({
      error: "Неверный логин или пароль"
    });
  }

  res.json({
    user: data.user,
    session: data.session
  });
});

app.listen(3000, () => {
    console.log("AgroLab running on http://localhost:3000");
});

app.post("/add-request", async (req, res) => {
  try {
    const {
      name,
      phone,
      region,
      field_info,
      analyses,
      comment
    } = req.body;

    const { data, error } = await supabase
      .from("service_requests")
      .insert([{
        name,
        phone,
        region,
        field_info,
        analyses,
        comment
      }]);

    console.log("Supabase result:", data);
    console.log("Supabase error:", error); 

    if (error) {
      console.error(error);
      return res.status(500).json({
        error: "Ошибка сохранения"
      });
    }

    res.json({
      success: true
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json(err);
  }
});